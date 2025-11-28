/**
 * Base Chain Scanner
 * 
 * Scans Uniswap V2-style DEXs on Base (Aerodrome, BaseSwap)
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { Token } from '../config/tokens';
import { DexPool } from '../config/dex_pools';

export interface BasePoolPrice {
  pool: DexPool;
  tokenA: Token;
  tokenB: Token;
  priceAtoB: number;
  priceBtoA: number;
  reserveA: bigint;
  reserveB: bigint;
  liquidityUsd: number;
  timestamp: number;
}

// Uniswap V2 Pair ABI (minimal)
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

export class BaseScanner {
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl: string = 'https://mainnet.base.org') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    logger.info('Base scanner initialized', { rpcUrl });
  }

  /**
   * Fetch price for a Base DEX pool
   */
  async fetchPoolPrice(pool: DexPool, tokenA: Token, tokenB: Token): Promise<BasePoolPrice | null> {
    try {
      logger.debug('Fetching Base pool price', {
        pool: pool.poolAddress.slice(0, 10),
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
      });

      const pairContract = new ethers.Contract(pool.poolAddress, PAIR_ABI, this.provider);

      // Get reserves
      const [reserve0, reserve1] = await pairContract.getReserves();
      
      // Get token order
      const token0Address = await pairContract.token0();
      const isToken0A = token0Address.toLowerCase() === tokenA.address.toLowerCase();

      const reserveA = isToken0A ? reserve0 : reserve1;
      const reserveB = isToken0A ? reserve1 : reserve0;

      // Convert to regular numbers for price calculation
      const reserveANum = Number(reserveA) / Math.pow(10, tokenA.decimals);
      const reserveBNum = Number(reserveB) / Math.pow(10, tokenB.decimals);

      if (reserveANum === 0 || reserveBNum === 0) {
        logger.warn('Zero reserves in Base pool', { pool: pool.poolAddress });
        return null;
      }

      const priceAtoB = reserveBNum / reserveANum;
      const priceBtoA = reserveANum / reserveBNum;

      // Estimate liquidity in USD (assuming tokenB is stablecoin or use oracle)
      const liquidityUsd = reserveBNum * 2; // Simplified

      logger.debug('Got reserves from Base', {
        pool: `${pool.poolAddress.slice(0, 8)}...`,
        reserveA: reserveA.toString(),
        reserveB: reserveB.toString(),
        priceAtoB: priceAtoB.toFixed(6),
      });

      return {
        pool,
        tokenA,
        tokenB,
        priceAtoB,
        priceBtoA,
        reserveA: BigInt(reserveA.toString()),
        reserveB: BigInt(reserveB.toString()),
        liquidityUsd,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to fetch Base pool price', {
        pool: pool.poolAddress,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Fetch multiple pool prices in parallel
   */
  async fetchMultiplePools(
    pools: Array<{ pool: DexPool; tokenA: Token; tokenB: Token }>
  ): Promise<BasePoolPrice[]> {
    const promises = pools.map(({ pool, tokenA, tokenB }) =>
      this.fetchPoolPrice(pool, tokenA, tokenB)
    );

    const results = await Promise.all(promises);
    return results.filter((p): p is BasePoolPrice => p !== null);
  }
}

export const baseScanner = new BaseScanner();
