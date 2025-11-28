/**
 * Solana Chain Configuration
 * 
 * DEX pools and tokens on Solana mainnet
 */

import { DexType } from './dex_pools';

// Solana tokens
export const SOLANA_TOKENS = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    address: 'So11111111111111111111111111111111111111112', // Wrapped SOL
    decimals: 9,
    isNative: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
  },
  RAY: {
    symbol: 'RAY',
    name: 'Raydium',
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
  },
};

// Raydium pools
export const RAYDIUM_POOLS = [
  {
    dex: DexType.Solana,
    dexName: 'Raydium',
    poolAddress: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2', // SOL/USDC
    tokenA: 'SOL',
    tokenB: 'USDC',
    feeRate: 25, // 0.25%
    enabled: true,
  },
  {
    dex: DexType.Solana,
    dexName: 'Raydium',
    poolAddress: '7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX', // SOL/USDT
    tokenA: 'SOL',
    tokenB: 'USDT',
    feeRate: 25,
    enabled: true,
  },
];

// Orca pools
export const ORCA_POOLS = [
  {
    dex: DexType.Solana,
    dexName: 'Orca',
    poolAddress: 'EGZ7tiLeH62TPV1gL8WwbXGzEPa9zmcpVnnkPKKnrE2U', // SOL/USDC
    tokenA: 'SOL',
    tokenB: 'USDC',
    feeRate: 30, // 0.30%
    enabled: true,
  },
];

export const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
