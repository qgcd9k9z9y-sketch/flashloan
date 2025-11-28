/**
 * Aquarius DEX Scanner
 * 
 * Fetches prices and liquidity from Aquarius AMM pools
 */

import { logger } from '../utils/logger';
import { DexPool } from '../config/dex_pools';
import { Token } from '../config/tokens';
import { PoolPrice } from './soroswap';
import { getStellarClient } from '../utils/stellar_client';
import { Contract, scValToNative, TransactionBuilder } from '@stellar/stellar-sdk';

export class AquariusScanner {
  /**
   * Fetch price for a specific Aquarius pool
   */
  async fetchPoolPrice(pool: DexPool, tokenA: Token, tokenB: Token): Promise<PoolPrice | null> {
    try {
      logger.debug('Fetching Aquarius pool price', {
        pool: pool.poolAddress,
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
      });

      // Real Aquarius pool contract calls via RPC
      const client = getStellarClient();
      const contract = new Contract(pool.poolAddress);
      
      // Get account for building transaction
      const account = await client.server.getAccount(client.getPublicKey());
      
      // Build transaction to call get_reserves
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: client['network'],
      })
        .addOperation(contract.call('get_reserves'))
        .setTimeout(30)
        .build();
      
      // Simulate the transaction
      const result = await client.server.simulateTransaction(transaction);
      
      if ('result' in result && result.result) {
        const reserves = scValToNative(result.result.retval);
        const reserveA = BigInt(reserves[0]);
        const reserveB = BigInt(reserves[1]);
        
        const priceAtoB = Number(reserveB) / Number(reserveA);
        const priceBtoA = Number(reserveA) / Number(reserveB);
        
        // Estimate liquidity in USD (simplified - using tokenB as USD proxy if it's USDC/USDT)
        const liquidityUsd = ['USDC', 'USDT'].includes(tokenB.symbol)
          ? Number(reserveB) / Math.pow(10, tokenB.decimals)
          : Number(reserveA) / Math.pow(10, tokenA.decimals);
        
        return {
          pool,
          tokenA,
          tokenB,
          priceAtoB,
          priceBtoA,
          reserveA,
          reserveB,
          liquidityUsd,
          timestamp: Date.now(),
        };
      }
      
      logger.error('Failed to simulate Aquarius get_reserves', {
        pool: pool.poolAddress,
        result,
      });
      return null;
    } catch (error) {
      logger.error('Failed to fetch Aquarius pool price', {
        pool: pool.poolAddress,
        error,
      });
      return null;
    }
  }

  /**
   * Fetch prices for multiple pools in parallel
   */
  async fetchMultiplePools(
    pools: Array<{ pool: DexPool; tokenA: Token; tokenB: Token }>
  ): Promise<PoolPrice[]> {
    const promises = pools.map(({ pool, tokenA, tokenB }) =>
      this.fetchPoolPrice(pool, tokenA, tokenB)
    );

    const results = await Promise.allSettled(promises);

    return results
      .filter((r): r is PromiseFulfilledResult<PoolPrice | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((p): p is PoolPrice => p !== null);
  }

  /**
   * Calculate output for Aquarius (constant product formula)
   */
  calculateSwapOutput(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    feeRateBps: number
  ): bigint {
    // Aquarius uses constant product formula (x*y=k) with configurable fees
    const feeMultiplier = BigInt(10000 - feeRateBps);
    const amountInWithFee = (amountIn * feeMultiplier) / BigInt(10000);

    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;

    return numerator / denominator;
  }

  /**
   * Simulate a swap
   */
  simulateSwap(
    poolPrice: PoolPrice,
    tokenIn: Token,
    tokenOut: Token,
    amountIn: bigint
  ): bigint {
    const isAtoB = tokenIn.address === poolPrice.tokenA.address;
    const reserveIn = isAtoB ? poolPrice.reserveA : poolPrice.reserveB;
    const reserveOut = isAtoB ? poolPrice.reserveB : poolPrice.reserveA;

    return this.calculateSwapOutput(
      amountIn,
      reserveIn,
      reserveOut,
      poolPrice.pool.feeRate
    );
  }
}

export const aquariusScanner = new AquariusScanner();
export default aquariusScanner;
