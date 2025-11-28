/**
 * Transaction Builder
 * 
 * Builds Soroban transactions for flash loan arbitrage execution
 */

import { logger } from '../utils/logger';
import { ArbitrageOpportunity } from '../scanner';
import config from '../config/config';

export interface FlashLoanTransaction {
  opportunity: ArbitrageOpportunity;
  contractId: string;
  method: string;
  args: any[];
  estimatedGas: number;
  builtAt: number;
}

export class TransactionBuilder {
  /**
   * Build a flash loan arbitrage transaction
   */
  async buildFlashLoanTransaction(
    opp: ArbitrageOpportunity
  ): Promise<FlashLoanTransaction> {
    try {
      logger.info('Building flash loan transaction', {
        opportunityId: opp.id,
        pair: `${opp.tokenBorrow}/${opp.tokenIntermediate}`,
      });

      const contractId = config.contracts.flashLoanExecutor;

      // Determine pool address to borrow from
      // In practice, you'd query available pools
      const poolAddress = opp.poolA.pool.poolAddress;

      // Build arguments for the contract call
      const args = [
        poolAddress, // pool_address
        opp.poolA.tokenA.address, // token_borrow
        opp.poolA.tokenB.address, // token_intermediate
        opp.borrowAmount.toString(), // amount
        opp.poolA.pool.dex, // dex_a_type (0 = Soroswap, 1 = Aquarius)
        opp.poolA.pool.poolAddress, // dex_a_pool
        opp.poolB.pool.dex, // dex_b_type
        opp.poolB.pool.poolAddress, // dex_b_pool
        config.trading.minProfitBps, // min_profit_bps
        config.trading.maxSlippageBps, // max_slippage_bps
      ];

      // Estimate gas
      const estimatedGas = await this.estimateGas(contractId, 'execute_flash_loan_arbitrage', args);

      return {
        opportunity: opp,
        contractId,
        method: 'execute_flash_loan_arbitrage',
        args,
        estimatedGas,
        builtAt: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to build transaction', { error });
      throw error;
    }
  }

  /**
   * Build a simulation transaction (dry run)
   */
  async buildSimulationTransaction(
    opp: ArbitrageOpportunity
  ): Promise<FlashLoanTransaction> {
    try {
      const contractId = config.contracts.flashLoanExecutor;

      const args = [
        opp.poolA.tokenA.address, // token_borrow
        opp.poolA.tokenB.address, // token_intermediate
        opp.borrowAmount.toString(), // amount
        opp.poolA.pool.dex, // dex_a_type
        opp.poolA.pool.poolAddress, // dex_a_pool
        opp.poolB.pool.dex, // dex_b_type
        opp.poolB.pool.poolAddress, // dex_b_pool
      ];

      const estimatedGas = await this.estimateGas(contractId, 'simulate_arbitrage', args);

      return {
        opportunity: opp,
        contractId,
        method: 'simulate_arbitrage',
        args,
        estimatedGas,
        builtAt: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to build simulation transaction', { error });
      throw error;
    }
  }

  /**
   * Estimate gas for a contract call
   */
  private async estimateGas(
    contractId: string,
    method: string,
    args: any[]
  ): Promise<number> {
    try {
      // TODO: Implement actual gas estimation via simulation
      // This would call the Soroban RPC simulateTransaction endpoint

      // For now, return a conservative estimate
      const baseGas = 100000; // Base cost
      const perArgGas = 10000; // Cost per argument
      const complexity = args.length * perArgGas;

      const estimated = baseGas + complexity;

      // Apply buffer
      return Math.floor(estimated * config.trading.gasPriceBuffer);
    } catch (error) {
      logger.warn('Gas estimation failed, using default', { error });
      return 500000; // Default 0.5 XLM
    }
  }

  /**
   * Validate transaction before submission
   */
  validateTransaction(tx: FlashLoanTransaction): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tx.contractId || tx.contractId.length !== 56) {
      errors.push('Invalid contract ID');
    }

    if (!tx.method) {
      errors.push('Missing method name');
    }

    if (!tx.args || tx.args.length === 0) {
      errors.push('Missing arguments');
    }

    if (tx.estimatedGas <= 0) {
      errors.push('Invalid gas estimate');
    }

    // Check transaction age (shouldn't be too old)
    const ageSeconds = (Date.now() - tx.builtAt) / 1000;
    if (ageSeconds > 30) {
      errors.push('Transaction too old, rebuild required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const transactionBuilder = new TransactionBuilder();
export default transactionBuilder;
