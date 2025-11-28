/**
 * Soroswap DEX Scanner
 * 
 * Fetches prices and liquidity from Soroswap pools
 */

import { logger } from '../utils/logger';
import { DexPool } from '../config/dex_pools';
import { Token } from '../config/tokens';
import { getStellarClient } from '../utils/stellar_client';
import { Contract, scValToNative, TransactionBuilder } from '@stellar/stellar-sdk';

export interface PoolPrice {
  pool: DexPool;
  tokenA: Token;
  tokenB: Token;
  priceAtoB: number; // Price of tokenA in terms of tokenB
  priceBtoA: number; // Price of tokenB in terms of tokenA
  reserveA: bigint;
  reserveB: bigint;
  liquidityUsd: number;
  timestamp: number;
}

export class SoroswapScanner {
  /**
   * Fetch price for a specific pool
   */
  async fetchPoolPrice(pool: DexPool, tokenA: Token, tokenB: Token): Promise<PoolPrice | null> {
    try {
      logger.debug('Fetching Soroswap pool price', {
        pool: pool.poolAddress,
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
      });

      // Real Soroswap pool contract calls
      const client = getStellarClient();
      const contract = new Contract(pool.poolAddress);
      
      try {
        // Call get_reserves() on the pool contract via RPC simulation
        const account = await client.server.getAccount(client.getPublicKey());
        const transaction = new TransactionBuilder(account, {
          fee: '100',
          networkPassphrase: 'Test SDF Network ; September 2015',
        })
        .addOperation(contract.call('get_reserves'))
        .setTimeout(30)
        .build();
        
        const result = await client.server.simulateTransaction(transaction);
        
        if ('result' in result && result.result) {
          const reserves = scValToNative(result.result.retval);
          
          // reserves is array [reserveA, reserveB]
          const reserveA = BigInt(reserves[0]);
          const reserveB = BigInt(reserves[1]);
          
          logger.debug('Got real reserves from Soroswap', {
            pool: pool.poolAddress.substring(0, 8) + '...',
            reserveA: reserveA.toString(),
            reserveB: reserveB.toString(),
          });
          
          // Calculate prices
          const priceAtoB = Number(reserveB) / Number(reserveA);
          const priceBtoA = Number(reserveA) / Number(reserveB);
          
          // Estimate liquidity in USD (simplified - using USDC as $1)
          const liquidityUsd = tokenB.symbol === 'USDC' 
            ? Number(reserveB) / Math.pow(10, tokenB.decimals)
            : Number(reserveA) / Math.pow(10, tokenA.decimals) * 0.10; // Rough XLM price
          
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
        } else {
          logger.warn('No results from get_reserves simulation', { pool: pool.poolAddress });
          return null;
        }
      } catch (rpcError) {
        logger.error('RPC call failed for Soroswap pool', {
          pool: pool.poolAddress,
          error: rpcError,
        });
        return null;
      }
    } catch (error) {
      logger.error('Failed to fetch Soroswap pool price', {
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
   * Calculate output amount for a given input
   * Using constant product formula: x * y = k
   */
  calculateSwapOutput(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    feeRateBps: number
  ): bigint {
    // Apply fee: amountInWithFee = amountIn * (10000 - fee) / 10000
    const feeMultiplier = BigInt(10000 - feeRateBps);
    const amountInWithFee = (amountIn * feeMultiplier) / BigInt(10000);

    // Calculate output: amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;

    return numerator / denominator;
  }

  /**
   * Simulate a swap to get expected output
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

export const soroswapScanner = new SoroswapScanner();
export default soroswapScanner;
