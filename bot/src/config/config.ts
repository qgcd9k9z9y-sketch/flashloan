/**
 * Configuration for Flash Loan Arbitrage Bot
 * 
 * This file contains all configuration parameters for the bot including:
 * - RPC endpoints
 * - Contract addresses
 * - Trading parameters
 * - Risk management settings
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Stellar Network Configuration
  network: {
    // Soroban RPC endpoint
    sorobanRpc: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
    
    // Horizon API endpoint (for account info, etc.)
    horizonUrl: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
    
    // Network passphrase
    networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    
    // Is testnet?
    isTestnet: process.env.IS_TESTNET !== 'false',
  },

  // Contract Addresses
  contracts: {
    // Flash Loan Executor contract
    flashLoanExecutor: process.env.FLASH_LOAN_EXECUTOR_CONTRACT || 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    
    // Soroswap Router
    soroswapRouter: process.env.SOROSWAP_ROUTER || 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    
    // Aquarius AMM Router (Testnet)
    aquariusRouter: process.env.AQUARIUS_ROUTER || 'CDGX6Q3ZZIDSX2N3SHBORWUIEG2ZZEBAAMYARAXTT7M5L6IXKNJMT3GB',
  },

  // Bot Wallet
  wallet: {
    // Private key (keep secure!)
    secretKey: process.env.BOT_SECRET_KEY || '',
    
    // Public key (derived from secret if not provided)
    publicKey: process.env.BOT_PUBLIC_KEY || '',
  },

  // Trading Parameters
  trading: {
    // Minimum profit threshold in basis points (50 bps = 0.5%)
    minProfitBps: parseInt(process.env.MIN_PROFIT_BPS || '50'),
    
    // Maximum slippage tolerance in basis points (100 bps = 1%)
    maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '100'),
    
    // Minimum liquidity in USD required in a pool
    minLiquidityUsd: parseInt(process.env.MIN_LIQUIDITY_USD || '10000'),
    
    // Maximum trade size in USD
    maxTradeSizeUsd: parseInt(process.env.MAX_TRADE_SIZE_USD || '50000'),
    
    // Gas price buffer multiplier (1.2 = 20% buffer)
    gasPriceBuffer: parseFloat(process.env.GAS_PRICE_BUFFER || '1.2'),
  },

  // Scanner Configuration
  scanner: {
    // Scan interval in milliseconds (5000 = 5 seconds)
    scanIntervalMs: parseInt(process.env.SCAN_INTERVAL_MS || '5000'),
    
    // Number of opportunities to keep in memory
    maxOpportunities: parseInt(process.env.MAX_OPPORTUNITIES || '100'),
    
    // Expiry time for opportunities in seconds (5 minutes for testing)
    opportunityTtlSeconds: parseInt(process.env.OPPORTUNITY_TTL_SECONDS || '300'),
    
    // Enable parallel scanning across DEXs
    enableParallelScan: process.env.ENABLE_PARALLEL_SCAN !== 'false',
  },

  // AI Decision Engine
  ai: {
    // Enable AI-based decision making
    enabled: process.env.AI_ENABLED === 'true',
    
    // Risk score threshold (0-100, higher = more conservative)
    riskThreshold: parseInt(process.env.AI_RISK_THRESHOLD || '30'),
    
    // Minimum success probability (0-1)
    minSuccessProbability: parseFloat(process.env.AI_MIN_SUCCESS_PROB || '0.7'),
    
    // Enable machine learning model (vs rule-based)
    enableML: process.env.AI_ENABLE_ML === 'true',
  },

  // Execution Settings
  execution: {
    // Auto-execute opportunities
    autoExecute: process.env.AUTO_EXECUTE === 'true',
    
    // Enable API server for frontend
    enableApiServer: process.env.ENABLE_API_SERVER !== 'false',
    
    // Maximum concurrent executions
    maxConcurrentExecutions: parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '3'),
    
    // Transaction timeout in seconds
    txTimeoutSeconds: parseInt(process.env.TX_TIMEOUT_SECONDS || '30'),
    
    // Retry attempts for failed transactions
    maxRetries: parseInt(process.env.MAX_RETRIES || '2'),
    
    // Delay between retries in milliseconds
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000'),
  },

  // Logging & Monitoring
  logging: {
    // Log level: 'error' | 'warn' | 'info' | 'debug'
    level: process.env.LOG_LEVEL || 'info',
    
    // Enable file logging
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    
    // Log file path
    logFilePath: process.env.LOG_FILE_PATH || './logs/bot.log',
    
    // Enable metrics collection
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
  },

  // Safety Features
  safety: {
    // Enable circuit breaker
    enableCircuitBreaker: process.env.ENABLE_CIRCUIT_BREAKER !== 'false',
    
    // Max losses before circuit breaker trips (in USD)
    maxLossesUsd: parseInt(process.env.MAX_LOSSES_USD || '1000'),
    
    // Time window for loss calculation (in hours)
    lossWindowHours: parseInt(process.env.LOSS_WINDOW_HOURS || '24'),
    
    // Emergency stop on consecutive failures
    maxConsecutiveFailures: parseInt(process.env.MAX_CONSECUTIVE_FAILURES || '5'),
  },
};

// Validation
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.wallet.secretKey) {
    errors.push('BOT_SECRET_KEY is required');
  }

  if (!config.contracts.flashLoanExecutor || config.contracts.flashLoanExecutor.startsWith('CX')) {
    errors.push('FLASH_LOAN_EXECUTOR_CONTRACT must be set to a valid contract address');
  }

  if (config.trading.minProfitBps < 0 || config.trading.minProfitBps > 10000) {
    errors.push('MIN_PROFIT_BPS must be between 0 and 10000');
  }

  if (config.trading.maxSlippageBps < 0 || config.trading.maxSlippageBps > 10000) {
    errors.push('MAX_SLIPPAGE_BPS must be between 0 and 10000');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export default config;
