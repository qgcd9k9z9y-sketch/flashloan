/**
 * Sui Chain Scanner
 * 
 * Scans Cetus, Turbos DEXs on Sui
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { logger } from '../utils/logger';
import { Token } from '../config/tokens';
import { DexPool } from '../config/dex_pools';

export interface SuiPoolPrice {
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

export class SuiScanner {
  private client: SuiClient;

  constructor(rpcUrl?: string) {
    this.client = new SuiClient({ 
      url: rpcUrl || getFullnodeUrl('mainnet')
    });
    logger.info('Sui scanner initialized', { rpcUrl: rpcUrl || 'mainnet' });
  }

  /**
   * Fetch price for a Sui DEX pool (Cetus/Turbos)
   */
  async fetchPoolPrice(pool: DexPool, tokenA: Token, tokenB: Token): Promise<SuiPoolPrice | null> {
    try {
      logger.debug('Fetching Sui pool price', {
        pool: pool.poolAddress.slice(0, 10),
        pair: `${tokenA.symbol}/${tokenB.symbol}`,
      });

      // Get pool object from Sui
      const poolObject = await this.client.getObject({
        id: pool.poolAddress,
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      if (!poolObject.data) {
        logger.warn('Pool object not found', { pool: pool.poolAddress });
        return null;
      }

      // Parse pool reserves from object fields
      const content = poolObject.data.content;
      if (content && 'fields' in content) {
        const fields = content.fields as any;
        
        // Cetus pools typically have coin_a and coin_b fields
        const reserveA = BigInt(fields.coin_a || fields.reserve_a || 0);
        const reserveB = BigInt(fields.coin_b || fields.reserve_b || 0);

        const reserveANum = Number(reserveA) / Math.pow(10, tokenA.decimals);
        const reserveBNum = Number(reserveB) / Math.pow(10, tokenB.decimals);

        if (reserveANum === 0 || reserveBNum === 0) {
          return null;
        }

        const priceAtoB = reserveBNum / reserveANum;
        const priceBtoA = reserveANum / reserveBNum;
        const liquidityUsd = reserveBNum * 2;

        logger.debug('Got reserves from Sui', {
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
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch Sui pool price', {
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
  ): Promise<SuiPoolPrice[]> {
    const promises = pools.map(({ pool, tokenA, tokenB }) =>
      this.fetchPoolPrice(pool, tokenA, tokenB)
    );

    const results = await Promise.all(promises);
    return results.filter((p): p is SuiPoolPrice => p !== null);
  }
}

export const suiScanner = new SuiScanner();
