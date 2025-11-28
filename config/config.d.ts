/**
 * Configuration for Flash Loan Arbitrage Bot
 *
 * This file contains all configuration parameters for the bot including:
 * - RPC endpoints
 * - Contract addresses
 * - Trading parameters
 * - Risk management settings
 */
export declare const config: {
    network: {
        sorobanRpc: string;
        horizonUrl: string;
        networkPassphrase: string;
        isTestnet: boolean;
    };
    contracts: {
        flashLoanExecutor: string;
        soroswapRouter: string;
        phoenixRouter: string;
    };
    wallet: {
        secretKey: string;
        publicKey: string;
    };
    trading: {
        minProfitBps: number;
        maxSlippageBps: number;
        minLiquidityUsd: number;
        maxTradeSizeUsd: number;
        gasPriceBuffer: number;
    };
    scanner: {
        scanIntervalMs: number;
        maxOpportunities: number;
        opportunityTtlSeconds: number;
        enableParallelScan: boolean;
    };
    ai: {
        enabled: boolean;
        riskThreshold: number;
        minSuccessProbability: number;
        enableML: boolean;
    };
    execution: {
        autoExecute: boolean;
        enableApiServer: boolean;
        maxConcurrentExecutions: number;
        txTimeoutSeconds: number;
        maxRetries: number;
        retryDelayMs: number;
    };
    logging: {
        level: string;
        enableFileLogging: boolean;
        logFilePath: string;
        enableMetrics: boolean;
    };
    safety: {
        enableCircuitBreaker: boolean;
        maxLossesUsd: number;
        lossWindowHours: number;
        maxConsecutiveFailures: number;
    };
};
export declare function validateConfig(): void;
export default config;
//# sourceMappingURL=config.d.ts.map