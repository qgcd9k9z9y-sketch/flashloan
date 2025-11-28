/**
 * Route Optimizer
 * 
 * Optimizes arbitrage routes for maximum profitability
 */

import { logger } from '../utils/logger';
import { ArbitrageOpportunity } from '../scanner';
import { PoolPrice } from '../scanner/soroswap';
import { soroswapScanner } from '../scanner/soroswap';
import { aquariusScanner } from '../scanner/aquarius';

export interface OptimizedRoute {
  originalOpportunity: ArbitrageOpportunity;
  optimizedAmount: bigint;
  expectedProfit: bigint;
  improvementPercent: number;
}

export class RouteOptimizer {
  /**
   * Optimize the borrow amount for maximum profit
   */
  optimizeBorrowAmount(opp: ArbitrageOpportunity): OptimizedRoute {
    try {
      logger.debug('Optimizing route', { opportunityId: opp.id });

      // Try different amounts to find optimal
      const amounts = this.generateAmountCandidates(opp.borrowAmount);

      let bestAmount = opp.borrowAmount;
      let bestProfit = opp.expectedProfit;

      for (const amount of amounts) {
        const profit = this.simulateWithAmount(opp, amount);

        if (profit > bestProfit) {
          bestProfit = profit;
          bestAmount = amount;
        }
      }

      const improvementPercent = Number(bestProfit - opp.expectedProfit) / Number(opp.expectedProfit) * 100;

      logger.debug('Route optimized', {
        originalAmount: opp.borrowAmount.toString(),
        optimizedAmount: bestAmount.toString(),
        originalProfit: opp.expectedProfit.toString(),
        optimizedProfit: bestProfit.toString(),
        improvementPercent: improvementPercent.toFixed(2),
      });

      return {
        originalOpportunity: opp,
        optimizedAmount: bestAmount,
        expectedProfit: bestProfit,
        improvementPercent,
      };
    } catch (error) {
      logger.error('Route optimization failed', { error });
      // Return original as fallback
      return {
        originalOpportunity: opp,
        optimizedAmount: opp.borrowAmount,
        expectedProfit: opp.expectedProfit,
        improvementPercent: 0,
      };
    }
  }

  /**
   * Generate candidate amounts to test
   */
  private generateAmountCandidates(baseAmount: bigint): bigint[] {
    const candidates: bigint[] = [];

    // Test amounts from 50% to 150% of base, in 10% increments
    for (let multiplier = 50; multiplier <= 150; multiplier += 10) {
      const amount = (baseAmount * BigInt(multiplier)) / BigInt(100);
      candidates.push(amount);
    }

    return candidates;
  }

  /**
   * Simulate arbitrage with a specific amount
   */
  private simulateWithAmount(opp: ArbitrageOpportunity, amount: bigint): bigint {
    try {
      // Simulate swap on first DEX
      const amountAfterSwap1 = this.simulateSwap(
        opp.poolA,
        opp.poolA.tokenA,
        opp.poolA.tokenB,
        amount,
        opp.poolA.pool.dexName
      );

      // Simulate swap on second DEX
      const amountAfterSwap2 = this.simulateSwap(
        opp.poolB,
        opp.poolB.tokenB,
        opp.poolB.tokenA,
        amountAfterSwap1,
        opp.poolB.pool.dexName
      );

      // Calculate profit after flash loan fee
      const flashLoanFee = (amount * BigInt(9)) / BigInt(10000);
      const netProfit = amountAfterSwap2 - amount - flashLoanFee;

      return netProfit;
    } catch (error) {
      logger.error('Simulation failed', { error });
      return BigInt(0);
    }
  }

  /**
   * Simulate swap on a specific DEX
   */
  private simulateSwap(
    pool: PoolPrice,
    tokenIn: any,
    tokenOut: any,
    amountIn: bigint,
    dexName: string
  ): bigint {
    if (dexName === 'Soroswap') {
      return soroswapScanner.simulateSwap(pool, tokenIn, tokenOut, amountIn);
    } else if (dexName === 'Aquarius') {
      return aquariusScanner.simulateSwap(pool, tokenIn, tokenOut, amountIn);
    }

    throw new Error(`Unknown DEX: ${dexName}`);
  }

  /**
   * Check if route is still profitable after optimization
   */
  isRouteProfitable(route: OptimizedRoute, minProfitUsd: number): boolean {
    const profitUsd = Number(route.expectedProfit) / Math.pow(10, route.originalOpportunity.poolA.tokenA.decimals);
    return profitUsd >= minProfitUsd;
  }

  /**
   * Calculate effective price impact
   */
  calculatePriceImpact(opp: ArbitrageOpportunity, amount: bigint): number {
    // Calculate how much the trade affects pool prices
    const reserveA = opp.poolA.reserveA;
    const priceImpact = Number(amount) / Number(reserveA);

    return priceImpact * 100; // Return as percentage
  }
}

export const routeOptimizer = new RouteOptimizer();
export default routeOptimizer;
