/**
 * Risk Scorer
 * 
 * Advanced risk assessment for arbitrage opportunities
 */

import { ArbitrageOpportunity } from '../scanner';
import { metrics } from '../utils/metrics';

export interface RiskFactors {
  liquidityRisk: number; // 0-100
  slippageRisk: number; // 0-100
  timingRisk: number; // 0-100
  executionRisk: number; // 0-100
  marketRisk: number; // 0-100
}

export class RiskScorer {
  /**
   * Assess all risk factors for an opportunity
   */
  assessRisk(opp: ArbitrageOpportunity): RiskFactors {
    return {
      liquidityRisk: this.assessLiquidityRisk(opp),
      slippageRisk: this.assessSlippageRisk(opp),
      timingRisk: this.assessTimingRisk(opp),
      executionRisk: this.assessExecutionRisk(),
      marketRisk: this.assessMarketRisk(opp),
    };
  }

  /**
   * Calculate aggregate risk score
   */
  calculateAggregateRisk(factors: RiskFactors): number {
    const weights = {
      liquidityRisk: 0.3,
      slippageRisk: 0.25,
      timingRisk: 0.2,
      executionRisk: 0.15,
      marketRisk: 0.1,
    };

    return (
      factors.liquidityRisk * weights.liquidityRisk +
      factors.slippageRisk * weights.slippageRisk +
      factors.timingRisk * weights.timingRisk +
      factors.executionRisk * weights.executionRisk +
      factors.marketRisk * weights.marketRisk
    );
  }

  /**
   * Assess liquidity risk
   */
  private assessLiquidityRisk(opp: ArbitrageOpportunity): number {
    const minLiquidity = Math.min(opp.poolA.liquidityUsd, opp.poolB.liquidityUsd);
    const tradeSize = Number(opp.borrowAmount) / Math.pow(10, opp.poolA.tokenA.decimals);
    const liquidityRatio = tradeSize / minLiquidity;

    // Risk increases with trade size relative to liquidity
    if (liquidityRatio > 0.2) return 100; // 20%+ of pool is very risky
    if (liquidityRatio > 0.1) return 70;
    if (liquidityRatio > 0.05) return 40;
    if (liquidityRatio > 0.02) return 20;
    return 10;
  }

  /**
   * Assess slippage risk
   */
  private assessSlippageRisk(opp: ArbitrageOpportunity): number {
    // Higher profit margins can absorb more slippage
    if (opp.profitPercentage < 0.3) return 80;
    if (opp.profitPercentage < 0.5) return 60;
    if (opp.profitPercentage < 1.0) return 40;
    if (opp.profitPercentage < 2.0) return 20;
    return 10;
  }

  /**
   * Assess timing risk (opportunity freshness)
   */
  private assessTimingRisk(opp: ArbitrageOpportunity): number {
    const ageSeconds = (Date.now() - opp.timestamp) / 1000;

    if (ageSeconds > 20) return 90;
    if (ageSeconds > 15) return 70;
    if (ageSeconds > 10) return 50;
    if (ageSeconds > 5) return 30;
    return 10;
  }

  /**
   * Assess execution risk based on bot's recent performance
   */
  private assessExecutionRisk(): number {
    const allMetrics = metrics.getAllMetrics();
    const { consecutiveFailures, successRate } = allMetrics.execution;

    // High consecutive failures = high risk
    if (consecutiveFailures >= 3) return 80;
    if (consecutiveFailures >= 2) return 60;

    // Low success rate = higher risk
    if (successRate < 0.5) return 70;
    if (successRate < 0.7) return 50;
    if (successRate < 0.8) return 30;

    return 10;
  }

  /**
   * Assess market risk (placeholder for advanced market analysis)
   */
  private assessMarketRisk(opp: ArbitrageOpportunity): number {
    // In a real implementation, this would analyze:
    // - Market volatility
    // - Recent price movements
    // - Order book depth changes
    // - Network congestion

    // For now, return baseline risk
    return 20;
  }
}

export const riskScorer = new RiskScorer();
export default riskScorer;
