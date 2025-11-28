/**
 * API Server for Frontend
 * 
 * Provides REST endpoints for the frontend dashboard
 */

import express from 'express';
import cors from 'cors';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { arbitrageScanner } from '../scanner';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Helper function to convert BigInt values to strings recursively
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      serialized[key] = serializeBigInt(obj[key]);
    }
    return serialized;
  }
  
  return obj;
}

// Middleware
app.use(cors());
app.use(express.json());

// Store bot state
let botState = {
  isRunning: false,
  startTime: null as Date | null,
  lastScanTime: null as Date | null,
  opportunities: [] as any[],
};

// GET /api/status - Get bot status
app.get('/api/status', (req, res) => {
  const uptime = botState.startTime 
    ? Math.floor((Date.now() - botState.startTime.getTime()) / 1000)
    : 0;
  
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  const response = serializeBigInt({
    isRunning: botState.isRunning,
    lastScanTime: botState.lastScanTime?.toISOString() || 'Never',
    uptime: `${hours}h ${minutes}m`,
    network: 'Testnet',
    connectedDexes: ['Soroswap', 'Phoenix', 'Stellar DEX'],
    lastError: null,
  });
  
  res.json(response);
});

// POST /api/start - Start bot
app.post('/api/start', (req, res) => {
  if (botState.isRunning) {
    return res.status(200).json({ success: true, message: 'Bot is already running' });
  }
  
  // Note: This only updates the UI state. The bot process is controlled by the main loop.
  // To fully start/stop, restart the bot process or implement proper lifecycle management.
  botState.isRunning = true;
  if (!botState.startTime) {
    botState.startTime = new Date();
  }
  logger.info('Bot status set to running via API');
  
  res.json({ success: true, message: 'Bot status updated (note: bot must be running as a process)' });
});

// POST /api/stop - Stop bot
app.post('/api/stop', (req, res) => {
  if (!botState.isRunning) {
    return res.status(200).json({ success: true, message: 'Bot is already stopped' });
  }
  
  // Note: This only updates the UI state. The bot process continues running.
  // To fully stop, kill the bot process or implement proper lifecycle management.
  botState.isRunning = false;
  logger.info('Bot status set to stopped via API');
  
  res.json({ success: true, message: 'Bot status updated (note: bot process continues running)' });
});

// GET /api/opportunities - Get current opportunities
app.get('/api/opportunities', (req, res) => {
  const serialized = serializeBigInt(botState.opportunities || []);
  res.json(serialized);
});

// GET /api/metrics - Get bot metrics
app.get('/api/metrics', (req, res) => {
  const stats = metrics.getStats();
  
  const serializedStats = serializeBigInt({
    totalProfit: Number(stats.totalProfit).toFixed(2),
    avgProfit: Number(stats.avgProfit).toFixed(2),
    successRate: Number(stats.successRate).toFixed(1),
    totalExecutions: Number(stats.executionCount),
    profitHistory: (stats.profitHistory || []).map((item: any) => ({
      ...item,
      timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : item.timestamp,
    })),
  });
  
  res.json(serializedStats);
});

// POST /api/execute - Execute an opportunity
app.post('/api/execute', async (req, res) => {
  const { opportunityId, userPublicKey } = req.body;
  
  if (!opportunityId) {
    return res.status(400).json({ error: 'Opportunity ID required' });
  }
  
  if (!userPublicKey) {
    return res.status(400).json({ error: 'Wallet not connected. Please connect your Freighter wallet.' });
  }
  
  try {
    logger.info(`Executing arbitrage for opportunity ${opportunityId}`, { userPublicKey });
    
    // Find the opportunity
    const opportunity = botState.opportunities.find((opp: any) => opp.id === opportunityId);
    
    if (!opportunity) {
      logger.warn('Opportunity not found', { opportunityId });
      return res.status(404).json({ error: 'Opportunity not found or expired' });
    }
    
    // Check if opportunity is still valid (not expired)
    if (opportunity.expiresAt < Date.now()) {
      logger.warn('Opportunity expired', { 
        opportunityId, 
        expiresAt: opportunity.expiresAt, 
        now: Date.now(),
        ageSeconds: (Date.now() - opportunity.timestamp) / 1000
      });
      return res.status(410).json({ 
        error: 'Opportunity expired',
        message: 'This opportunity has expired. Please select a newer one.',
        ageSeconds: Math.floor((Date.now() - opportunity.timestamp) / 1000)
      });
    }
    
    // Build flash loan transaction
    // TODO: Implement actual flash loan execution with flashLoanEngine
    // This would involve:
    // 1. Build transaction XDR with flash loan contract call
    // 2. Return XDR to frontend for user signature
    // 3. Frontend signs with Freighter
    // 4. Submit signed transaction to network
    
    // For now, return transaction details that need to be signed
    const mockTransactionXDR = "AAAAAgAAAABbtxiNXIRW8"; // Mock XDR
    
    const response = {
      success: false,
      requiresSignature: true,
      message: 'Transaction built. Please sign with your wallet.',
      transactionXDR: mockTransactionXDR,
      opportunity: {
        pair: `${opportunity.tokenBorrow}/${opportunity.tokenIntermediate}`,
        profit: opportunity.expectedProfitUsd,
        amount: opportunity.borrowAmount,
      },
      note: 'Flash loan execution requires real DEX contracts. Current implementation uses mock data.',
    };
    
    res.json(serializeBigInt(response));
  } catch (error) {
    logger.error('Execution failed', { error });
    res.status(500).json({ error: 'Execution failed', details: (error as Error).message });
  }
});

// Update opportunities periodically
export function updateOpportunities(opportunities: any[]) {
  botState.opportunities = opportunities;
  botState.lastScanTime = new Date();
}

// Set bot running state
export function setBotRunning(running: boolean) {
  botState.isRunning = running;
  if (running && !botState.startTime) {
    botState.startTime = new Date();
  }
}

// Start API server
export function startApiServer() {
  app.listen(PORT, () => {
    logger.info(`API server listening on port ${PORT}`);
  });
}

export { botState };
