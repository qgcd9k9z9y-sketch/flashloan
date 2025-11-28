/**
 * Flash-Loan Arbitrage Bot - Main Entry Point
 * 
 * Orchestrates all components: scanner, AI engine, and execution engine
 */

import { logger } from './utils/logger';
import { metrics } from './utils/metrics';
import { arbitrageScanner } from './scanner';
import { aiDecisionEngine } from './ai';
import { flashLoanEngine } from './engine';
import config, { validateConfig } from './config/config';
import { startApiServer, updateOpportunities, setBotRunning } from './api/server';

class ArbitrageBot {
  private isRunning: boolean;
  private metricsInterval?: NodeJS.Timeout;

  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    try {
      logger.info('='.repeat(70));
      logger.info('🚀 Starting Flash-Loan Arbitrage Bot');
      logger.info('='.repeat(70));

      // Validate configuration
      validateConfig();
      logger.info('✓ Configuration validated');

      // Log configuration
      logger.info('Configuration:', {
        network: config.network.isTestnet ? 'Testnet' : 'Mainnet',
        minProfitBps: config.trading.minProfitBps,
        maxSlippageBps: config.trading.maxSlippageBps,
        autoExecute: config.execution.autoExecute,
        aiEnabled: config.ai.enabled,
      });

      this.isRunning = true;

      // Start API server for frontend
      if (config.execution.enableApiServer) {
        logger.info('Starting API server...');
        startApiServer();
        // Set bot as running in API state
        setBotRunning(true);
      }

      // Start periodic metrics reporting
      this.startMetricsReporting();

      // Start scanning
      logger.info('Starting arbitrage scanner...');
      this.startScanAndExecuteLoop();

      logger.info('✓ Bot started successfully');
      logger.info('Press Ctrl+C to stop');
    } catch (error) {
      logger.error('Failed to start bot', { error });
      process.exit(1);
    }
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    logger.info('Stopping bot...');
    this.isRunning = false;
    
    // Update API state
    setBotRunning(false);

    arbitrageScanner.stopScanning();

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Print final metrics
    metrics.printSummary();

    logger.info('Bot stopped');
    process.exit(0);
  }

  /**
   * Main scan and execute loop
   */
  private async startScanAndExecuteLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Scan for opportunities
        const opportunities = await arbitrageScanner.performScan();

        // Update API server with new opportunities
        updateOpportunities(opportunities);

        if (opportunities.length > 0) {
          logger.info(`Found ${opportunities.length} arbitrage opportunities`);

          // Evaluate with AI
          const scores = opportunities.map(opp => aiDecisionEngine.evaluateOpportunity(opp));

          // Log top opportunities
          scores
            .filter(s => s.shouldExecute)
            .slice(0, 5)
            .forEach((score, index) => {
              logger.info(`Opportunity #${index + 1}:`, {
                pair: `${score.opportunity.tokenBorrow}/${score.opportunity.tokenIntermediate}`,
                profit: `$${score.opportunity.expectedProfitUsd.toFixed(2)}`,
                profitPercent: `${score.opportunity.profitPercentage.toFixed(2)}%`,
                score: score.totalScore.toFixed(0),
                risk: score.riskScore.toFixed(0),
                shouldExecute: score.shouldExecute,
              });
            });

          // Execute if auto-execute is enabled
          if (config.execution.autoExecute) {
            await this.executeOpportunities(scores);
          }
        }

        // Wait before next scan
        await this.sleep(config.scanner.scanIntervalMs);
      } catch (error) {
        logger.error('Error in scan/execute loop', { error });
        metrics.recordError(error as Error);
        await this.sleep(5000); // Wait 5s before retrying
      }
    }
  }

  /**
   * Execute scored opportunities
   */
  private async executeOpportunities(scores: any[]): Promise<void> {
    const executable = scores.filter(s => s.shouldExecute);

    if (executable.length === 0) {
      logger.info('No executable opportunities after AI evaluation');
      return;
    }

    // Sort by score
    executable.sort((a, b) => b.totalScore - a.totalScore);

    // Execute top opportunities (respecting concurrency limit)
    for (const score of executable) {
      if (!flashLoanEngine.canExecuteMore()) {
        logger.info('Max concurrent executions reached, skipping remaining opportunities');
        break;
      }

      // Execute in background (don't await)
      flashLoanEngine.executeWithRetry(score.opportunity).then(result => {
        if (result.success) {
          logger.info('✓ Arbitrage executed successfully', {
            opportunityId: result.opportunityId,
            profit: `$${result.actualProfitUsd?.toFixed(2)}`,
            gasCost: `$${result.gasCostUsd?.toFixed(2)}`,
          });
        } else {
          logger.warn('✗ Arbitrage execution failed', {
            opportunityId: result.opportunityId,
            error: result.error,
          });
        }
      });

      // Small delay between executions
      await this.sleep(100);
    }
  }

  /**
   * Start periodic metrics reporting
   */
  private startMetricsReporting(): void {
    // Print metrics every 5 minutes
    this.metricsInterval = setInterval(() => {
      metrics.printSummary();
    }, 5 * 60 * 1000);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize bot
const bot = new ArbitrageBot();

// Handle graceful shutdown
process.on('SIGINT', () => bot.stop());
process.on('SIGTERM', () => bot.stop());

// Start bot
bot.start().catch(error => {
  logger.error('Fatal error', { error });
  process.exit(1);
});

export default bot;
