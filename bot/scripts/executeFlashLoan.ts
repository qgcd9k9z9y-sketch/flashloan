#!/usr/bin/env ts-node

/**
 * Execute Flash Loan Script
 * 
 * Manually execute a specific arbitrage opportunity
 */

import { logger } from '../src/utils/logger';
import { arbitrageScanner } from '../src/scanner';
import { flashLoanEngine } from '../src/engine';
import { aiDecisionEngine } from '../src/ai';
import { validateConfig } from '../config/config';

async function main() {
  try {
    logger.info('='.repeat(70));
    logger.info('⚡ Flash Loan Executor');
    logger.info('='.repeat(70));

    // Validate config
    validateConfig();
    logger.info('✓ Configuration validated');

    // Get opportunity ID from command line
    const opportunityId = process.argv[2];

    if (!opportunityId) {
      logger.info('\nUsage: npm run execute -- <opportunity_id>');
      logger.info('\nOr to execute best available opportunity:');
      logger.info('  npm run execute -- --best\n');
      process.exit(1);
    }

    let opportunity;

    if (opportunityId === '--best') {
      // Find best opportunity
      logger.info('Scanning for best opportunity...');
      const opportunities = await arbitrageScanner.performScan();

      if (opportunities.length === 0) {
        logger.error('No opportunities found');
        process.exit(1);
      }

      // Evaluate and get best
      const scores = opportunities.map(opp => aiDecisionEngine.evaluateOpportunity(opp));
      const executable = scores.filter(s => s.shouldExecute);

      if (executable.length === 0) {
        logger.error('No executable opportunities found');
        process.exit(1);
      }

      executable.sort((a, b) => b.totalScore - a.totalScore);
      opportunity = executable[0].opportunity;

      logger.info('Best opportunity selected:', {
        id: opportunity.id,
        pair: `${opportunity.tokenBorrow}/${opportunity.tokenIntermediate}`,
        expectedProfit: `$${opportunity.expectedProfitUsd.toFixed(2)}`,
      });
    } else {
      // Get specific opportunity
      opportunity = arbitrageScanner.getOpportunity(opportunityId);

      if (!opportunity) {
        logger.error(`Opportunity ${opportunityId} not found`);
        process.exit(1);
      }
    }

    // Evaluate opportunity
    const score = aiDecisionEngine.evaluateOpportunity(opportunity);

    logger.info('\nOpportunity Details:');
    logger.info(`  Pair: ${opportunity.tokenBorrow}/${opportunity.tokenIntermediate}`);
    logger.info(`  Expected Profit: $${opportunity.expectedProfitUsd.toFixed(2)} (${opportunity.profitPercentage.toFixed(2)}%)`);
    logger.info(`  Score: ${score.totalScore.toFixed(0)}/100`);
    logger.info(`  Risk: ${score.riskScore.toFixed(0)}/100`);
    logger.info(`  Success Probability: ${(score.successProbability * 100).toFixed(0)}%`);
    logger.info(`  Should Execute: ${score.shouldExecute ? 'YES' : 'NO'}`);
    logger.info(`  Reason: ${score.reason}`);

    if (!score.shouldExecute) {
      logger.warn('\n⚠️  AI recommends NOT executing this opportunity');
      logger.info('Use --force flag to execute anyway (not implemented)');
      process.exit(1);
    }

    // Confirm execution
    logger.info('\n🚀 Executing arbitrage...');

    // Execute
    const result = await flashLoanEngine.executeWithRetry(opportunity);

    if (result.success) {
      logger.info('\n✓ Execution successful!');
      logger.info(`  Transaction Hash: ${result.transactionHash}`);
      logger.info(`  Actual Profit: $${result.actualProfitUsd?.toFixed(2)}`);
      logger.info(`  Gas Cost: $${result.gasCostUsd?.toFixed(2)}`);
      logger.info(`  Net Profit: $${((result.actualProfitUsd || 0) - (result.gasCostUsd || 0)).toFixed(2)}`);
      logger.info(`  Execution Time: ${result.executionTimeMs}ms`);
    } else {
      logger.error('\n✗ Execution failed');
      logger.error(`  Error: ${result.error}`);
      logger.error(`  Execution Time: ${result.executionTimeMs}ms`);
      process.exit(1);
    }
  } catch (error) {
    logger.error('Execution error', { error });
    process.exit(1);
  }
}

main();
