/**
 * Transaction Builder
 * 
 * Builds Soroban transactions for flash loan arbitrage execution
 */

import { logger } from '../utils/logger';
import { ArbitrageOpportunity } from '../scanner';
import config from '../config/config';
import { getStellarClient } from '../utils/stellar_client';
import { Contract, TransactionBuilder as StellarTxBuilder, Operation, nativeToScVal, Address } from '@stellar/stellar-sdk';

export interface FlashLoanTransaction {
  opportunity: ArbitrageOpportunity;
  contractId: string;
  method: string;
  args: any[];
  estimatedGas: number;
  builtAt: number;
  xdr?: string; // Built transaction XDR for signing
}

export class TransactionBuilder {
  /**
   * Build a flash loan arbitrage transaction
   */
  async buildFlashLoanTransaction(
    opp: ArbitrageOpportunity,
    userPublicKey?: string
  ): Promise<FlashLoanTransaction> {
    try {
      logger.info('Building flash loan transaction', {
        opportunityId: opp.id,
        pair: `${opp.tokenBorrow}/${opp.tokenIntermediate}`,
      });

      const client = getStellarClient();
      const contractId = config.contracts.flashLoanExecutor;
      const contract = new Contract(contractId);

      // Get source account (user or bot)
      const sourceKey = userPublicKey || client.getPublicKey();
      const sourceAccount = await client.server.getAccount(sourceKey);

      // Build contract arguments
      const contractArgs = [
        new Address(opp.poolA.tokenA.address).toScVal(), // token_borrow
        new Address(opp.poolA.tokenB.address).toScVal(), // token_intermediate  
        nativeToScVal(opp.borrowAmount, { type: 'u128' }), // amount
        nativeToScVal(opp.poolA.pool.dex, { type: 'u32' }), // dex_a_type
        new Address(opp.poolA.pool.poolAddress).toScVal(), // dex_a_pool
        nativeToScVal(opp.poolB.pool.dex, { type: 'u32' }), // dex_b_type
        new Address(opp.poolB.pool.poolAddress).toScVal(), // dex_b_pool
        nativeToScVal(config.trading.minProfitBps, { type: 'u32' }), // min_profit_bps
      ];

      // Build transaction
      const txBuilder = new StellarTxBuilder(sourceAccount, {
        fee: '10000', // 0.001 XLM
        networkPassphrase: client['network'],
      });

      const tx = txBuilder
        .addOperation(contract.call('execute_flash_loan_arbitrage', ...contractArgs))
        .setTimeout(30)
        .build();

      // Get XDR for signing
      const xdr = tx.toXDR();

      // Estimate gas
      const estimatedGas = 10000;

      return {
        opportunity: opp,
        contractId,
        method: 'execute_flash_loan_arbitrage',
        args: contractArgs,
        estimatedGas,
        builtAt: Date.now(),
        xdr,
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
