/**
 * AI Decision Engine
 * 
 * Evaluates arbitrage opportunities using rule-based or ML-based scoring
 */

import { ArbitrageOpportunity } from '../scanner';
import config from '../config/config';

export interface OpportunityScore {
  opportunity: ArbitrageOpportunity;
  totalScore: number;
  profitScore: number;
  liquidityScore: number;
  riskScore: number;
  successProbability: number;
  shouldExecute: boolean;
  reason: string;
}

export class AIDecisionEngine {
  /**
   * Evaluate an arbitrage opportunity
   */
  evaluateOpportunity(opp: ArbitrageOpportunity): OpportunityScore {
    if (!config.ai.enabled) {
      // Simple pass-through if AI is disabled
      return this.simpleEvaluation(opp);
    }

    // Calculate individual scores
    const profitScore = this.calculateProfitScore(opp);
    const liquidityScore = this.calculateLiquidityScore(opp);
    const riskScore = this.calculateRiskScore(opp);

    // Weighted total score (0-100)
    const totalScore = (
      profitScore * 0.4 +
      liquidityScore * 0.3 +
      (100 - riskScore) * 0.3
    );

    // Estimate success probability
    const successProbability = this.estimateSuccessProbability(opp, totalScore);

    // Determine if should execute
    const shouldExecute = this.shouldExecuteOpportunity(
      totalScore,
      riskScore,
      successProbability
    );

    const reason = this.generateReason(shouldExecute, totalScore, riskScore, successProbability);

    return {
      opportunity: opp,
      totalScore,
      profitScore,
      liquidityScore,
      riskScore,
      successProbability,
      shouldExecute,
      reason,
    };
  }

  /**
   * Rank multiple opportunities
   */
  rankOpportunities(opportunities: ArbitrageOpportunity[]): OpportunityScore[] {
    const scored = opportunities.map(opp => this.evaluateOpportunity(opp));

    // Sort by total score descending
    return scored.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate profit score (0-100)
   */
  private calculateProfitScore(opp: ArbitrageOpportunity): number {
    // Score based on profit percentage
    // 0.5% = 50, 1% = 75, 2%+ = 100
    const profitPercent = opp.profitPercentage;

    if (profitPercent >= 2.0) return 100;
    if (profitPercent >= 1.0) return 75 + ((profitPercent - 1.0) * 25);
    if (profitPercent >= 0.5) return 50 + ((profitPercent - 0.5) * 50);
    return profitPercent * 100;
  }

  /**
   * Calculate liquidity score (0-100)
   */
  private calculateLiquidityScore(opp: ArbitrageOpportunity): number {
    const avgLiquidity = (opp.poolA.liquidityUsd + opp.poolB.liquidityUsd) / 2;

    // Score based on liquidity depth
    // $50k = 50, $100k = 75, $200k+ = 100
    if (avgLiquidity >= 200000) return 100;
    if (avgLiquidity >= 100000) return 75 + ((avgLiquidity - 100000) / 100000) * 25;
    if (avgLiquidity >= 50000) return 50 + ((avgLiquidity - 50000) / 50000) * 25;
    return (avgLiquidity / 50000) * 50;
  }

  /**
   * Calculate risk score (0-100, higher = more risky)
   */
  private calculateRiskScore(opp: ArbitrageOpportunity): number {
    let riskScore = 0;

    // Age risk: older opportunities are riskier
    const ageMs = Date.now() - opp.timestamp;
    const ageSeconds = ageMs / 1000;
    if (ageSeconds > 15) riskScore += 30;
    else if (ageSeconds > 10) riskScore += 20;
    else if (ageSeconds > 5) riskScore += 10;

    // Size risk: larger trades are riskier
    const sizeUsd = Number(opp.borrowAmount) / Math.pow(10, opp.poolA.tokenA.decimals);
    if (sizeUsd > 50000) riskScore += 30;
    else if (sizeUsd > 25000) riskScore += 20;
    else if (sizeUsd > 10000) riskScore += 10;

    // Liquidity risk: lower liquidity = higher risk
    const minLiquidity = Math.min(opp.poolA.liquidityUsd, opp.poolB.liquidityUsd);
    if (minLiquidity < 20000) riskScore += 30;
    else if (minLiquidity < 50000) riskScore += 15;

    // Profit margin risk: thin margins are risky
    if (opp.profitPercentage < 0.3) riskScore += 25;
    else if (opp.profitPercentage < 0.5) riskScore += 15;

    return Math.min(riskScore, 100);
  }

  /**
   * Estimate probability of successful execution (0-1)
   */
  private estimateSuccessProbability(opp: ArbitrageOpportunity, totalScore: number): number {
    // Base probability from total score
    let probability = totalScore / 100;

    // Adjust for market conditions
    const ageSeconds = (Date.now() - opp.timestamp) / 1000;
    if (ageSeconds > 10) {
      probability *= 0.8; // Reduce probability for old opportunities
    }

    // Adjust for profit margin
    if (opp.profitPercentage < 0.3) {
      probability *= 0.7; // Thin margins less likely to succeed
    }

    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Determine if opportunity should be executed
   */
  private shouldExecuteOpportunity(
    totalScore: number,
    riskScore: number,
    successProbability: number
  ): boolean {
    // Check minimum score threshold
    if (totalScore < 50) {
      return false;
    }

    // Check risk threshold
    if (riskScore > config.ai.riskThreshold) {
      return false;
    }

    // Check success probability
    if (successProbability < config.ai.minSuccessProbability) {
      return false;
    }

    return true;
  }

  /**
   * Generate human-readable reason
   */
  private generateReason(
    shouldExecute: boolean,
    totalScore: number,
    riskScore: number,
    successProbability: number
  ): string {
    if (!shouldExecute) {
      if (totalScore < 50) {
        return `Score too low (${totalScore.toFixed(0)}/100)`;
      }
      if (riskScore > config.ai.riskThreshold) {
        return `Risk too high (${riskScore.toFixed(0)}/100)`;
      }
      if (successProbability < config.ai.minSuccessProbability) {
        return `Success probability too low (${(successProbability * 100).toFixed(0)}%)`;
      }
      return 'Unknown reason';
    }

    return `Good opportunity (score: ${totalScore.toFixed(0)}, risk: ${riskScore.toFixed(0)}, prob: ${(successProbability * 100).toFixed(0)}%)`;
  }

  /**
   * Simple evaluation when AI is disabled
   */
  private simpleEvaluation(opp: ArbitrageOpportunity): OpportunityScore {
    return {
      opportunity: opp,
      totalScore: 100,
      profitScore: 100,
      liquidityScore: 100,
      riskScore: 0,
      successProbability: 1.0,
      shouldExecute: true,
      reason: 'AI disabled - simple pass-through',
    };
  }
}

export const aiDecisionEngine = new AIDecisionEngine();
export default aiDecisionEngine;
