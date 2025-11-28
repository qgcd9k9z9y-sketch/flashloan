/**
 * Metrics Collection System
 * 
 * Tracks bot performance, profits, and execution statistics
 */

import { logger } from './logger';

export interface OpportunityMetrics {
  detected: number;
  executed: number;
  successful: number;
  failed: number;
  totalProfitUsd: number;
  totalGasCostUsd: number;
  netProfitUsd: number;
}

export interface ExecutionMetrics {
  averageExecutionTimeMs: number;
  successRate: number;
  consecutiveFailures: number;
  lastExecutionTimestamp: number;
}

export interface PerformanceMetrics {
  uptime: number;
  scansPerformed: number;
  avgScanTimeMs: number;
  errorsEncountered: number;
}

class MetricsCollector {
  private startTime: number;
  private opportunities: OpportunityMetrics;
  private execution: ExecutionMetrics;
  private performance: PerformanceMetrics;
  private executionTimes: number[];

  constructor() {
    this.startTime = Date.now();
    this.opportunities = {
      detected: 0,
      executed: 0,
      successful: 0,
      failed: 0,
      totalProfitUsd: 0,
      totalGasCostUsd: 0,
      netProfitUsd: 0,
    };
    this.execution = {
      averageExecutionTimeMs: 0,
      successRate: 0,
      consecutiveFailures: 0,
      lastExecutionTimestamp: 0,
    };
    this.performance = {
      uptime: 0,
      scansPerformed: 0,
      avgScanTimeMs: 0,
      errorsEncountered: 0,
    };
    this.executionTimes = [];
  }

  /**
   * Record a detected opportunity
   */
  recordOpportunityDetected(): void {
    this.opportunities.detected++;
  }

  /**
   * Record an executed trade
   */
  recordExecution(success: boolean, profitUsd: number, gasCostUsd: number, executionTimeMs: number): void {
    this.opportunities.executed++;
    
    if (success) {
      this.opportunities.successful++;
      this.opportunities.totalProfitUsd += profitUsd;
      this.execution.consecutiveFailures = 0;
    } else {
      this.opportunities.failed++;
      this.execution.consecutiveFailures++;
    }

    this.opportunities.totalGasCostUsd += gasCostUsd;
    this.opportunities.netProfitUsd = this.opportunities.totalProfitUsd - this.opportunities.totalGasCostUsd;

    // Track execution time
    this.executionTimes.push(executionTimeMs);
    if (this.executionTimes.length > 100) {
      this.executionTimes.shift(); // Keep only last 100
    }

    this.execution.averageExecutionTimeMs = 
      this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length;

    this.execution.successRate = 
      this.opportunities.executed > 0 
        ? this.opportunities.successful / this.opportunities.executed 
        : 0;

    this.execution.lastExecutionTimestamp = Date.now();
  }

  /**
   * Record a scan operation
   */
  recordScan(scanTimeMs: number): void {
    this.performance.scansPerformed++;
    
    // Calculate running average scan time
    const prevTotal = this.performance.avgScanTimeMs * (this.performance.scansPerformed - 1);
    this.performance.avgScanTimeMs = (prevTotal + scanTimeMs) / this.performance.scansPerformed;
  }

  /**
   * Record an error
   */
  recordError(error: Error): void {
    this.performance.errorsEncountered++;
    logger.error('Metrics: Error recorded', { error: error.message, stack: error.stack });
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): {
    opportunities: OpportunityMetrics;
    execution: ExecutionMetrics;
    performance: PerformanceMetrics;
  } {
    this.performance.uptime = Date.now() - this.startTime;

    return {
      opportunities: { ...this.opportunities },
      execution: { ...this.execution },
      performance: { ...this.performance },
    };
  }

  /**
   * Get summary report
   */
  getSummary(): string {
    const metrics = this.getAllMetrics();
    const uptimeHours = (metrics.performance.uptime / (1000 * 60 * 60)).toFixed(2);

    return `
╔════════════════════════════════════════════════════════════════╗
║               ARBITRAGE BOT METRICS SUMMARY                    ║
╠════════════════════════════════════════════════════════════════╣
║ OPPORTUNITIES                                                  ║
║   Detected:           ${metrics.opportunities.detected.toString().padStart(10)}                      ║
║   Executed:           ${metrics.opportunities.executed.toString().padStart(10)}                      ║
║   Successful:         ${metrics.opportunities.successful.toString().padStart(10)}                      ║
║   Failed:             ${metrics.opportunities.failed.toString().padStart(10)}                      ║
║                                                                ║
║ PROFITABILITY                                                  ║
║   Total Profit:       $${metrics.opportunities.totalProfitUsd.toFixed(2).padStart(10)}                    ║
║   Total Gas Cost:     $${metrics.opportunities.totalGasCostUsd.toFixed(2).padStart(10)}                    ║
║   Net Profit:         $${metrics.opportunities.netProfitUsd.toFixed(2).padStart(10)}                    ║
║                                                                ║
║ EXECUTION                                                      ║
║   Success Rate:       ${(metrics.execution.successRate * 100).toFixed(1).padStart(10)}%                   ║
║   Avg Exec Time:      ${metrics.execution.averageExecutionTimeMs.toFixed(0).padStart(10)}ms                   ║
║   Consecutive Fails:  ${metrics.execution.consecutiveFailures.toString().padStart(10)}                      ║
║                                                                ║
║ PERFORMANCE                                                    ║
║   Uptime:             ${uptimeHours.padStart(10)}h                    ║
║   Scans Performed:    ${metrics.performance.scansPerformed.toString().padStart(10)}                      ║
║   Avg Scan Time:      ${metrics.performance.avgScanTimeMs.toFixed(0).padStart(10)}ms                   ║
║   Errors:             ${metrics.performance.errorsEncountered.toString().padStart(10)}                      ║
╚════════════════════════════════════════════════════════════════╝
    `;
  }

  /**
   * Get stats for API
   */
  getStats() {
    const metrics = this.getAllMetrics();
    return {
      totalProfit: metrics.opportunities.netProfitUsd,
      avgProfit: metrics.opportunities.executed > 0 
        ? metrics.opportunities.netProfitUsd / metrics.opportunities.executed 
        : 0,
      successRate: metrics.execution.successRate * 100,
      executionCount: metrics.opportunities.executed,
      profitHistory: [], // Implement if needed
    };
  }

  /**
   * Print summary to console
   */
  printSummary(): void {
    logger.info(this.getSummary());
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.startTime = Date.now();
    this.opportunities = {
      detected: 0,
      executed: 0,
      successful: 0,
      failed: 0,
      totalProfitUsd: 0,
      totalGasCostUsd: 0,
      netProfitUsd: 0,
    };
    this.execution = {
      averageExecutionTimeMs: 0,
      successRate: 0,
      consecutiveFailures: 0,
      lastExecutionTimestamp: 0,
    };
    this.performance = {
      uptime: 0,
      scansPerformed: 0,
      avgScanTimeMs: 0,
      errorsEncountered: 0,
    };
    this.executionTimes = [];
    logger.info('Metrics reset');
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

export default metrics;
