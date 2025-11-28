/**
 * Flash Loan Engine
 * 
 * Executes flash loan arbitrage transactions
 */

import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { stellarClient } from '../utils/stellar_client';
import { ArbitrageOpportunity } from '../scanner';
import { transactionBuilder, FlashLoanTransaction } from './transaction_builder';
import { routeOptimizer } from './route_optimizer';
import config from '../config/config';

export interface ExecutionResult {
  success: boolean;
  opportunityId: string;
  transactionHash?: string;
  actualProfit?: number;
  actualProfitUsd?: number;
  gasCost?: number;
  gasCostUsd?: number;
  executionTimeMs: number;
  error?: string;
}

export class FlashLoanEngine {
  private activeExecutions: Set<string>;
  private executionHistory: ExecutionResult[];

  constructor() {
    this.activeExecutions = new Set();
    this.executionHistory = [];
  }

  /**
   * Execute a flash loan arbitrage
   */
  async executeArbitrage(opp: ArbitrageOpportunity): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Check if already executing this opportunity
    if (this.activeExecutions.has(opp.id)) {
      return {
        success: false,
        opportunityId: opp.id,
        executionTimeMs: Date.now() - startTime,
        error: 'Opportunity already being executed',
      };
    }

    this.activeExecutions.add(opp.id);

    try {
      logger.info('Executing arbitrage', {
        opportunityId: opp.id,
        pair: `${opp.tokenBorrow}/${opp.tokenIntermediate}`,
        expectedProfit: opp.expectedProfitUsd,
      });

      // Step 1: Optimize route
      const optimized = routeOptimizer.optimizeBorrowAmount(opp);

      if (!routeOptimizer.isRouteProfitable(optimized, 1)) {
        throw new Error('Route no longer profitable after optimization');
      }

      // Update opportunity with optimized amount
      const optimizedOpp = {
        ...opp,
        borrowAmount: optimized.optimizedAmount,
        expectedProfit: optimized.expectedProfit,
      };

      // Step 2: Build transaction
      const tx = await transactionBuilder.buildFlashLoanTransaction(optimizedOpp);

      // Step 3: Validate transaction
      const validation = transactionBuilder.validateTransaction(tx);
      if (!validation.valid) {
        throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
      }

      // Step 4: Execute transaction
      const result = await this.submitTransaction(tx);

      // Step 5: Record metrics
      const executionTime = Date.now() - startTime;
      metrics.recordExecution(
        result.success,
        result.actualProfitUsd || 0,
        result.gasCostUsd || 0,
        executionTime
      );

      // Add to history
      this.executionHistory.push(result);
      if (this.executionHistory.length > 100) {
        this.executionHistory.shift(); // Keep only last 100
      }

      return result;
    } catch (error) {
      logger.error('Arbitrage execution failed', {
        opportunityId: opp.id,
        error,
      });

      const executionTime = Date.now() - startTime;
      const result: ExecutionResult = {
        success: false,
        opportunityId: opp.id,
        executionTimeMs: executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      metrics.recordExecution(false, 0, 0, executionTime);
      this.executionHistory.push(result);

      return result;
    } finally {
      this.activeExecutions.delete(opp.id);
    }
  }

  /**
   * Submit transaction to the network
   */
  private async submitTransaction(tx: FlashLoanTransaction): Promise<ExecutionResult> {
    try {
      logger.info('Submitting transaction to network', {
        method: tx.method,
        estimatedGas: tx.estimatedGas,
      });

      // Call the contract
      const result = await stellarClient.invokeContract(
        tx.contractId,
        tx.method,
        tx.args
      );

      // Parse result
      const actualProfit = BigInt(result || 0);
      const actualProfitUsd = Number(actualProfit) / Math.pow(10, tx.opportunity.poolA.tokenA.decimals);

      // Estimate gas cost (this would come from transaction result)
      const gasCost = tx.estimatedGas;
      const gasCostUsd = gasCost / 10000000; // Convert stroops to XLM, assume $0.10/XLM

      logger.info('Transaction successful', {
        actualProfit: actualProfit.toString(),
        actualProfitUsd,
        gasCost,
      });

      return {
        success: true,
        opportunityId: tx.opportunity.id,
        transactionHash: 'hash_placeholder', // Would come from transaction result
        actualProfit: Number(actualProfit),
        actualProfitUsd,
        gasCost,
        gasCostUsd,
        executionTimeMs: Date.now() - tx.builtAt,
      };
    } catch (error) {
      logger.error('Transaction submission failed', { error });
      throw error;
    }
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry(opp: ArbitrageOpportunity): Promise<ExecutionResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= config.execution.maxRetries; attempt++) {
      try {
        logger.info('Execution attempt', { attempt, opportunityId: opp.id });

        const result = await this.executeArbitrage(opp);

        if (result.success) {
          return result;
        }

        lastError = new Error(result.error || 'Execution failed');

        if (attempt < config.execution.maxRetries) {
          logger.info('Retrying execution', {
            attempt,
            delayMs: config.execution.retryDelayMs,
          });
          await this.sleep(config.execution.retryDelayMs);
        }
      } catch (error) {
        lastError = error as Error;

        if (attempt < config.execution.maxRetries) {
          await this.sleep(config.execution.retryDelayMs);
        }
      }
    }

    // All retries failed
    return {
      success: false,
      opportunityId: opp.id,
      executionTimeMs: 0,
      error: lastError?.message || 'All retries failed',
    };
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ExecutionResult[] {
    return [...this.executionHistory];
  }

  /**
   * Get active executions count
   */
  getActiveExecutionsCount(): number {
    return this.activeExecutions.size;
  }

  /**
   * Check if can execute more (based on concurrency limit)
   */
  canExecuteMore(): boolean {
    return this.activeExecutions.size < config.execution.maxConcurrentExecutions;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const flashLoanEngine = new FlashLoanEngine();
export default flashLoanEngine;
