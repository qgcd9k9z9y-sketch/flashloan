/**
 * Aptos Chain Scanner
 * 
 * Scans PancakeSwap, Liquidswap on Aptos
 */

import { AptosClient } from 'aptos';
import { logger } from '../utils/logger';
import { Token } from '../config/tokens';
import { DexPool } from '../config/dex_pools';

export interface AptosPoolPrice {
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

export class AptosScanner {
  private client: AptosClient;

  constructor(rpcUrl: string = 'https://fullnode.mainnet.aptoslabs.com/v1') {
    this.client = new AptosClient(rpcUrl);
    logger.info('Aptos scanner initialized', { rpcUrl });
  }

  /**
   * Fetch price for an Aptos DEX pool
   */
  async fetchPoolPrice(pool: DexPool, tokenA: Token, tokenB: Token): Promise<AptosPoolPrice | null> {
    try {
      logger.debug('Fetching Aptos pool price', {
        pool: pool.poolAddress.slice(0, 10),
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
      });

      // Get pool resource
      const resource = await this.client.getAccountResource(
        pool.poolAddress,
        `${pool.poolAddress}::swap::LiquidityPool<${tokenA.address}, ${tokenB.address}>`
      );

      if (!resource) {
        logger.warn('Pool resource not found', { pool: pool.poolAddress });
        return null;
      }

      const data = resource.data as any;
      
      // Aptos pools typically have coin_x_reserve and coin_y_reserve
      const reserveA = BigInt(data.coin_x_reserve?.value || data.reserve_x || 0);
      const reserveB = BigInt(data.coin_y_reserve?.value || data.reserve_y || 0);

      const reserveANum = Number(reserveA) / Math.pow(10, tokenA.decimals);
      const reserveBNum = Number(reserveB) / Math.pow(10, tokenB.decimals);

      if (reserveANum === 0 || reserveBNum === 0) {
        return null;
      }

      const priceAtoB = reserveBNum / reserveANum;
      const priceBtoA = reserveANum / reserveBNum;
      const liquidityUsd = reserveBNum * 2;

      logger.debug('Got reserves from Aptos', {
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
        reserveA,
        reserveB,
        liquidityUsd,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to fetch Aptos pool price', {
        pool: pool.poolAddress,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Fetch multiple pool prices
   */
  async fetchMultiplePools(
    pools: Array<{ pool: DexPool; tokenA: Token; tokenB: Token }>
  ): Promise<AptosPoolPrice[]> {
    const promises = pools.map(({ pool, tokenA, tokenB }) =>
      this.fetchPoolPrice(pool, tokenA, tokenB)
    );

    const results = await Promise.all(promises);
    return results.filter((p): p is AptosPoolPrice => p !== null);
  }
}

export const aptosScanner = new AptosScanner();
