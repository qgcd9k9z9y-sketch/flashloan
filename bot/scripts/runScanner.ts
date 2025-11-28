#!/usr/bin/env ts-node

/**
 * Run Scanner Script
 * 
 * Continuously scans for arbitrage opportunities without executing
 */

import { logger } from '../src/utils/logger';
import { metrics } from '../src/utils/metrics';
import { arbitrageScanner } from '../src/scanner';
import { aiDecisionEngine } from '../src/ai';
import { opportunityRanker } from '../src/ai/opportunity_ranker';
import { validateConfig } from '../config/config';

async function main() {
  try {
    logger.info('='.repeat(70));
    logger.info('🔍 Arbitrage Scanner - Monitoring Mode');
    logger.info('='.repeat(70));

    // Validate config
    validateConfig();
    logger.info('✓ Configuration validated');

    logger.info('Starting scanner... (Press Ctrl+C to stop)');

    let scanCount = 0;

    while (true) {
      scanCount++;
      logger.info(`\n--- Scan #${scanCount} ---`);

      // Perform scan
      const opportunities = await arbitrageScanner.performScan();

      if (opportunities.length === 0) {
        logger.info('No opportunities found');
      } else {
        logger.info(`Found ${opportunities.length} opportunities`);

        // Evaluate with AI
        const scores = opportunities.map(opp => aiDecisionEngine.evaluateOpportunity(opp));

        // Rank opportunities
        const ranked = opportunityRanker.rankOpportunities(scores);

        if (ranked.length > 0) {
          logger.info('\n' + opportunityRanker.generateRecommendation(ranked));

          // Display top 5
          logger.info('\nTop Opportunities:');
          ranked.slice(0, 5).forEach(r => {
            logger.info(`
  #${r.rank} [${r.executionPriority.toUpperCase()}]
    Pair: ${r.opportunity.tokenBorrow}/${r.opportunity.tokenIntermediate}
    Profit: $${r.opportunity.expectedProfitUsd.toFixed(2)} (${r.opportunity.profitPercentage.toFixed(2)}%)
    Score: ${r.score.totalScore.toFixed(0)}/100
    Risk: ${r.score.riskScore.toFixed(0)}/100
    Success Prob: ${(r.score.successProbability * 100).toFixed(0)}%
    DEXs: ${r.opportunity.poolA.pool.dexName} → ${r.opportunity.poolB.pool.dexName}
            `.trim());
          });
        }
      }

      // Print periodic metrics every 10 scans
      if (scanCount % 10 === 0) {
        metrics.printSummary();
      }

      // Wait before next scan
      await sleep(5000); // 5 seconds
    }
  } catch (error) {
    logger.error('Scanner error', { error });
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('\n\nShutting down scanner...');
  metrics.printSummary();
  process.exit(0);
});

main();
