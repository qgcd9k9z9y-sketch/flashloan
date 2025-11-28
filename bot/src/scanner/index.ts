/**
 * Main Arbitrage Scanner
 * 
 * Orchestrates scanning across all DEXs and detects arbitrage opportunities
 */

import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { soroswapScanner, PoolPrice } from './soroswap';
import { aquariusScanner } from './aquarius';
import { stellarDexScanner } from './stellar_dex';
import { baseScanner } from './base';
import { solanaScanner } from './solana';
import { suiScanner } from './sui';
import { aptosScanner } from './aptos';
import { getToken } from '../config/tokens';
import { findArbitragePairs, DexPool } from '../config/dex_pools';
import config from '../config/config';

logger.info('🌐 Multi-chain scanner initialized', {
  stellar: true,
  base: config.base?.enabled || false,
  solana: config.solana?.enabled || false,
  sui: config.sui?.enabled || false,
  aptos: config.aptos?.enabled || false,
});

export interface ArbitrageOpportunity {
  id: string;
  poolA: PoolPrice;
  poolB: PoolPrice;
  tokenA: string; // First token symbol
  tokenB: string; // Second token symbol
  tokenBorrow: string; // Token symbol to borrow
  tokenIntermediate: string; // Intermediate token
  borrowAmount: bigint;
  expectedProfit: bigint;
  expectedProfitUsd: number;
  profitPercentage: number;
  timestamp: number;
  expiresAt: number;
}

export class ArbitrageScanner {
  private opportunities: Map<string, ArbitrageOpportunity>;
  private isScanning: boolean;
  private opportunityCounter: number;

  constructor() {
    this.opportunities = new Map();
    this.isScanning = false;
    this.opportunityCounter = 0;
  }

  /**
   * Start continuous scanning
   */
  async startScanning(): Promise<void> {
    logger.info('Starting arbitrage scanner', {
      interval: config.scanner.scanIntervalMs,
    });

    this.isScanning = true;

    while (this.isScanning) {
      await this.performScan();
      await this.sleep(config.scanner.scanIntervalMs);
    }
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    logger.info('Stopping arbitrage scanner');
    this.isScanning = false;
  }

  /**
   * Perform a single scan cycle
   */
  async performScan(): Promise<ArbitrageOpportunity[]> {
    const scanStart = Date.now();

    try {
      logger.debug('Performing arbitrage scan');

      // Get all arbitrage pool pairs
      const pairs = findArbitragePairs();

      // Fetch prices from all pools
      const poolPrices = await this.fetchAllPoolPrices(pairs);

      // Detect opportunities
      const opportunities = this.detectOpportunities(poolPrices);

      // Store opportunities
      opportunities.forEach(opp => {
        this.opportunities.set(opp.id, opp);
        metrics.recordOpportunityDetected();
      });

      // Clean expired opportunities
      this.cleanExpiredOpportunities();

      const scanTime = Date.now() - scanStart;
      metrics.recordScan(scanTime);

      // Get all active opportunities from Map
      const allActiveOpportunities = this.getOpportunities();

      if (allActiveOpportunities.length > 0) {
        logger.info('Arbitrage opportunities detected', {
          count: allActiveOpportunities.length,
          scanTimeMs: scanTime,
        });
      }

      return allActiveOpportunities;
    } catch (error) {
      logger.error('Scan failed', { error });
      metrics.recordError(error as Error);
      return [];
    }
  }

  /**
   * Fetch prices from all pools
   */
  private async fetchAllPoolPrices(
    pairs: Array<{ poolA: DexPool; poolB: DexPool }>
  ): Promise<PoolPrice[]> {
    const poolsToFetch: Array<{
      pool: DexPool;
      tokenA: any;
      tokenB: any;
    }> = [];

    // Prepare pool fetch requests
    pairs.forEach(({ poolA, poolB }) => {
      const tokenA = getToken(poolA.tokenA);
      const tokenB = getToken(poolA.tokenB);

      if (!tokenA || !tokenB) return;

      poolsToFetch.push({
        pool: poolA,
        tokenA,
        tokenB,
      });

      poolsToFetch.push({
        pool: poolB,
        tokenA,
        tokenB,
      });
    });

    // Fetch from all DEXs in parallel
    const promises: Promise<PoolPrice[]>[] = [];

    // Stellar DEXs
    const soroswapPools = poolsToFetch.filter(p => p.pool.dexName === 'Soroswap');
    if (soroswapPools.length > 0) {
      promises.push(soroswapScanner.fetchMultiplePools(soroswapPools));
    }

    const aquariusPools = poolsToFetch.filter(p => p.pool.dexName === 'Aquarius');
    if (aquariusPools.length > 0) {
      promises.push(aquariusScanner.fetchMultiplePools(aquariusPools));
    }

    // Base DEXs
    if (config.base?.enabled) {
      const basePools = poolsToFetch.filter(p => 
        p.pool.dexName === 'Aerodrome' || p.pool.dexName === 'BaseSwap'
      );
      if (basePools.length > 0) {
        promises.push(baseScanner.fetchMultiplePools(basePools));
      }
    }

    // Solana DEXs
    if (config.solana?.enabled) {
      const solanaPools = poolsToFetch.filter(p => 
        p.pool.dexName === 'Raydium' || p.pool.dexName === 'Orca'
      );
      if (solanaPools.length > 0) {
        promises.push(solanaScanner.fetchMultiplePools(solanaPools));
      }
    }

    // Sui DEXs
    if (config.sui?.enabled) {
      const suiPools = poolsToFetch.filter(p => 
        p.pool.dexName === 'Cetus' || p.pool.dexName === 'Turbos'
      );
      if (suiPools.length > 0) {
        promises.push(suiScanner.fetchMultiplePools(suiPools));
      }
    }

    // Aptos DEXs
    if (config.aptos?.enabled) {
      const aptosPools = poolsToFetch.filter(p => 
        p.pool.dexName === 'PancakeSwap' || p.pool.dexName === 'Liquidswap'
      );
      if (aptosPools.length > 0) {
        promises.push(aptosScanner.fetchMultiplePools(aptosPools));
      }
    }

    // Fetch all in parallel
    const results = await Promise.all(promises);
    
    // Flatten all results
    return results.flat();
  }

  /**
   * Detect arbitrage opportunities from pool prices
   */
  private detectOpportunities(poolPrices: PoolPrice[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    logger.debug(`Detecting opportunities from ${poolPrices.length} pool prices`);

    // Group prices by token pair
    const pricesByPair = new Map<string, PoolPrice[]>();

    poolPrices.forEach(price => {
      const pairKey = this.getPairKey(price.tokenA.symbol, price.tokenB.symbol);
      if (!pricesByPair.has(pairKey)) {
        pricesByPair.set(pairKey, []);
      }
      pricesByPair.get(pairKey)!.push(price);
    });

    logger.debug(`Grouped into ${pricesByPair.size} token pairs:`, Array.from(pricesByPair.entries()).map(([pair, prices]) => `${pair}(${prices.length})`));

    // Find arbitrage between different DEXs for same pair
    pricesByPair.forEach((prices, pairKey) => {
      if (prices.length < 2) return;

      // Compare all combinations
      for (let i = 0; i < prices.length; i++) {
        for (let j = i + 1; j < prices.length; j++) {
          const priceA = prices[i];
          const priceB = prices[j];

          // Skip if same DEX
          if (priceA.pool.dexName === priceB.pool.dexName) continue;

          // Check both directions
          const opp1 = this.calculateArbitrage(priceA, priceB);
          const opp2 = this.calculateArbitrage(priceB, priceA);

          if (opp1 && this.isViableOpportunity(opp1)) {
            opportunities.push(opp1);
          }

          if (opp2 && this.isViableOpportunity(opp2)) {
            opportunities.push(opp2);
          }
        }
      }
    });

    return opportunities;
  }

  /**
   * Calculate arbitrage profitability
   */
  private calculateArbitrage(
    poolA: PoolPrice,
    poolB: PoolPrice
  ): ArbitrageOpportunity | null {
    try {
      // Determine optimal borrow amount (simplified - use 10% of smaller reserve)
      const borrowAmount = poolA.reserveA / BigInt(10);

      // Simulate: borrow tokenA, swap on poolA to get tokenB
      const scannerA = poolA.pool.dexName === 'Soroswap' ? soroswapScanner : aquariusScanner;
      const amountAfterSwap1 = scannerA.simulateSwap(
        poolA,
        poolA.tokenA,
        poolA.tokenB,
        borrowAmount
      );

      // Swap tokenB back to tokenA on poolB
      const scannerB = poolB.pool.dexName === 'Soroswap' ? soroswapScanner : aquariusScanner;
      const amountAfterSwap2 = scannerB.simulateSwap(
        poolB,
        poolB.tokenB,
        poolB.tokenA,
        amountAfterSwap1
      );

      // Calculate profit (before flash loan fee)
      const grossProfit = amountAfterSwap2 - borrowAmount;

      // Subtract flash loan fee (0.09%)
      const flashLoanFee = (borrowAmount * BigInt(9)) / BigInt(10000);
      const netProfit = grossProfit - flashLoanFee;

      if (netProfit <= 0) return null;

      const profitPercentage = (Number(netProfit) / Number(borrowAmount)) * 100;

      // Estimate profit in USD (simplified)
      const profitUsd = Number(netProfit) / Math.pow(10, poolA.tokenA.decimals);

      const opportunity: ArbitrageOpportunity = {
        id: this.generateOpportunityId(poolA, poolB),
        poolA,
        poolB,
        tokenA: poolA.tokenA.symbol,
        tokenB: poolA.tokenB.symbol,
        tokenBorrow: poolA.tokenA.symbol,
        tokenIntermediate: poolA.tokenB.symbol,
        borrowAmount,
        expectedProfit: netProfit,
        expectedProfitUsd: profitUsd,
        profitPercentage,
        timestamp: Date.now(),
        expiresAt: Date.now() + config.scanner.opportunityTtlSeconds * 1000,
      };

      return opportunity;
    } catch (error) {
      logger.error('Failed to calculate arbitrage', { error });
      return null;
    }
  }

  /**
   * Check if opportunity meets viability criteria
   */
  private isViableOpportunity(opp: ArbitrageOpportunity): boolean {
    // Check minimum profit threshold
    const minProfitBps = config.trading.minProfitBps;
    const minProfitPercent = minProfitBps / 100; // Convert bps to percentage

    if (opp.profitPercentage < minProfitPercent) {
      return false;
    }

    // Check liquidity
    if (opp.poolA.liquidityUsd < config.trading.minLiquidityUsd ||
        opp.poolB.liquidityUsd < config.trading.minLiquidityUsd) {
      return false;
    }

    return true;
  }

  /**
   * Get all detected opportunities
   */
  getOpportunities(): ArbitrageOpportunity[] {
    return Array.from(this.opportunities.values()).sort((a, b) => 
      b.expectedProfitUsd - a.expectedProfitUsd
    );
  }

  /**
   * Get opportunity by ID
   */
  getOpportunity(id: string): ArbitrageOpportunity | undefined {
    return this.opportunities.get(id);
  }

  /**
   * Clean up expired opportunities
   */
  private cleanExpiredOpportunities(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.opportunities.forEach((opp, id) => {
      if (opp.expiresAt < now) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.opportunities.delete(id));

    if (toDelete.length > 0) {
      logger.debug('Cleaned expired opportunities', { count: toDelete.length });
    }
  }

  /**
   * Generate unique opportunity ID
   */
  private generateOpportunityId(poolA: PoolPrice, poolB: PoolPrice): string {
    // Use deterministic ID based on pool addresses only (no timestamp)
    // This prevents duplicate opportunities for same pool pair
    return `${poolA.pool.poolAddress}_${poolB.pool.poolAddress}`;
  }

  /**
   * Get pair key for grouping
   */
  private getPairKey(tokenA: string, tokenB: string): string {
    return [tokenA, tokenB].sort().join('_');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const arbitrageScanner = new ArbitrageScanner();
export default arbitrageScanner;
