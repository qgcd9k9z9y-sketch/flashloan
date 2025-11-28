/**
 * Opportunity Ranker
 * 
 * Ranks and prioritizes arbitrage opportunities for execution
 */

import { ArbitrageOpportunity } from '../scanner';
import { OpportunityScore } from './index';
import { logger } from '../utils/logger';

export interface RankedOpportunity {
  opportunity: ArbitrageOpportunity;
  score: OpportunityScore;
  rank: number;
  executionPriority: 'high' | 'medium' | 'low';
}

export class OpportunityRanker {
  /**
   * Rank opportunities by execution priority
   */
  rankOpportunities(scores: OpportunityScore[]): RankedOpportunity[] {
    // Filter to only executable opportunities
    const executable = scores.filter(s => s.shouldExecute);

    if (executable.length === 0) {
      logger.debug('No executable opportunities to rank');
      return [];
    }

    // Sort by multiple criteria
    const sorted = executable.sort((a, b) => {
      // Primary: Total score
      if (Math.abs(a.totalScore - b.totalScore) > 5) {
        return b.totalScore - a.totalScore;
      }

      // Secondary: Success probability
      if (Math.abs(a.successProbability - b.successProbability) > 0.1) {
        return b.successProbability - a.successProbability;
      }

      // Tertiary: Expected profit
      return b.opportunity.expectedProfitUsd - a.opportunity.expectedProfitUsd;
    });

    // Assign ranks and priorities
    return sorted.map((score, index) => ({
      opportunity: score.opportunity,
      score,
      rank: index + 1,
      executionPriority: this.determineExecutionPriority(score, index, sorted.length),
    }));
  }

  /**
   * Get top N opportunities
   */
  getTopOpportunities(ranked: RankedOpportunity[], count: number): RankedOpportunity[] {
    return ranked.slice(0, count);
  }

  /**
   * Filter by priority level
   */
  filterByPriority(
    ranked: RankedOpportunity[],
    priority: 'high' | 'medium' | 'low'
  ): RankedOpportunity[] {
    return ranked.filter(r => r.executionPriority === priority);
  }

  /**
   * Determine execution priority
   */
  private determineExecutionPriority(
    score: OpportunityScore,
    rank: number,
    totalCount: number
  ): 'high' | 'medium' | 'low' {
    // Top 20% with score > 80 = high priority
    if (rank < totalCount * 0.2 && score.totalScore > 80) {
      return 'high';
    }

    // Top 50% with score > 60 = medium priority
    if (rank < totalCount * 0.5 && score.totalScore > 60) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate execution recommendation
   */
  generateRecommendation(ranked: RankedOpportunity[]): string {
    if (ranked.length === 0) {
      return 'No opportunities available for execution';
    }

    const highPriority = this.filterByPriority(ranked, 'high');
    const mediumPriority = this.filterByPriority(ranked, 'medium');
    const lowPriority = this.filterByPriority(ranked, 'low');

    const top = ranked[0];

    return `
Found ${ranked.length} executable opportunities:
  - High priority: ${highPriority.length}
  - Medium priority: ${mediumPriority.length}
  - Low priority: ${lowPriority.length}

Top recommendation:
  Rank: #${top.rank}
  Pair: ${top.opportunity.tokenBorrow}/${top.opportunity.tokenIntermediate}
  Expected Profit: $${top.opportunity.expectedProfitUsd.toFixed(2)} (${top.opportunity.profitPercentage.toFixed(2)}%)
  Score: ${top.score.totalScore.toFixed(0)}/100
  Success Probability: ${(top.score.successProbability * 100).toFixed(0)}%
  Risk: ${top.score.riskScore.toFixed(0)}/100
    `.trim();
  }
}

export const opportunityRanker = new OpportunityRanker();
export default opportunityRanker;
