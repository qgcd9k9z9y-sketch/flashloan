/**
 * DEX Pool Configuration
 * 
 * Defines all DEX pools to monitor for arbitrage opportunities
 */

export enum DexType {
  Soroswap = 0,
  Aquarius = 1,
  Base = 2, // Base chain DEXs (Aerodrome, BaseSwap)
  Solana = 3, // Solana DEXs (Raydium, Orca, Jupiter)
  Sui = 4, // Sui DEXs (Cetus, Turbos)
  Aptos = 5, // Aptos DEXs (PancakeSwap, Liquidswap)
}

export interface DexPool {
  dex: DexType;
  dexName: string;
  poolAddress: string;
  tokenA: string; // Token symbol
  tokenB: string; // Token symbol
  feeRate: number; // Fee rate in basis points (30 = 0.3%)
  enabled: boolean;
}

/**
 * Soroswap Pools (Testnet - Real Addresses)
 * Note: Only XLM/USDC pool is currently deployed on testnet
 * Source: Soroswap Factory CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES
 */
export const SOROSWAP_POOLS: DexPool[] = [
  {
    dex: DexType.Soroswap,
    dexName: 'Soroswap',
    poolAddress: 'CDE3I665APUHQYMATNLEODUPIWTEWXB5NB5IEV6NNNDQ3ZYRJ3SSWZKM', // XLM/USDC - Pool 7
    tokenA: 'XLM',
    tokenB: 'USDC',
    feeRate: 30, // 0.3%
    enabled: true,
  },
  {
    dex: DexType.Soroswap,
    dexName: 'Soroswap',
    poolAddress: 'CDT3AHGQC4PYFGMJWBIY2VLZIZ7CBMCKZ7BZMYC55WIVPDPRYWYBHD4I', // XLM/USDC - Pool 6
    tokenA: 'XLM',
    tokenB: 'USDC',
    feeRate: 30, // 0.3%
    enabled: true,
  },
  {
    dex: DexType.Soroswap,
    dexName: 'Soroswap',
    poolAddress: 'CCJQDQ3Y3WXJJQIDMAWK77DGDETT5U222OU2ARGYZWYSPDDFXYAJVWSR', // XLM/token - Pool 5
    tokenA: 'XLM',
    tokenB: 'USDC',
    feeRate: 30, // 0.3%
    enabled: true,
  },
  {
    dex: DexType.Soroswap,
    dexName: 'Soroswap',
    poolAddress: 'CB7GYMRPDTRKHQ2XNVYF34ZTCXP5R6223247BPDLSRZRX4BOK7XGLJQE', // token/token - Pool 4
    tokenA: 'USDC',
    tokenB: 'AQUA',
    feeRate: 30, // 0.3%
    enabled: true,
  },
];

/**
 * Aquarius Pools (Testnet - Real Addresses)
 * Source: https://amm-api-testnet.aqua.network/api/external/v1/pools/
 */
export const AQUARIUS_POOLS: DexPool[] = [
  {
    dex: DexType.Aquarius,
    dexName: 'Aquarius',
    poolAddress: 'CD3LFMMLBQ6RBJUD3Z2LFDFE6544WDRMWHEZYPI5YDVESYRSO2TT32BX', // XLM/USDC constant_product
    tokenA: 'XLM',
    tokenB: 'USDC',
    feeRate: 30, // 0.30%
    enabled: true,
  },
  {
    dex: DexType.Aquarius,
    dexName: 'Aquarius',
    poolAddress: 'CCSXYUVLYALKJGIIYMGYLZI447VS6TDWFTVDL43B4IKK2WERHLWUVCRC', // XLM/AQUA constant_product
    tokenA: 'XLM',
    tokenB: 'AQUA',
    feeRate: 30,
    enabled: true,
  },
  {
    dex: DexType.Aquarius,
    dexName: 'Aquarius',
    poolAddress: 'CC2NBF7M6QBEOUNTV2C4BK42ID2WK2O3AJRC777BND4O3B6JUV7EY33J', // USDC/USDT stableswap
    tokenA: 'USDC',
    tokenB: 'USDT',
    feeRate: 10, // 0.10% (stable pool)
    enabled: true,
  },
  {
    dex: DexType.Aquarius,
    dexName: 'Aquarius',
    poolAddress: 'CCPRHABYS45EJUFUW6BQ26JCP7KDX76XMHASKC2IHSNIHQGWISTQXUM5', // USDT/AQUA constant_product
    tokenA: 'USDT',
    tokenB: 'AQUA',
    feeRate: 30,
    enabled: true,
  },
];

// Import other chain pools
import { AERODROME_POOLS, BASESWAP_POOLS } from './base_config';
import { RAYDIUM_POOLS, ORCA_POOLS } from './solana_config';
import { CETUS_POOLS, TURBOS_POOLS } from './sui_config';
import { PANCAKESWAP_POOLS, LIQUIDSWAP_POOLS } from './aptos_config';

/**
 * All pools combined - Multi-chain
 */
export const ALL_POOLS: DexPool[] = [
  // Stellar/Soroban DEXs
  ...SOROSWAP_POOLS,
  ...AQUARIUS_POOLS,
  // Base DEXs
  ...AERODROME_POOLS,
  ...BASESWAP_POOLS,
  // Solana DEXs
  ...RAYDIUM_POOLS,
  ...ORCA_POOLS,
  // Sui DEXs
  ...CETUS_POOLS,
  ...TURBOS_POOLS,
  // Aptos DEXs
  ...PANCAKESWAP_POOLS,
  ...LIQUIDSWAP_POOLS,
];

/**
 * Get pools for a specific token pair
 */
export function getPoolsForPair(tokenA: string, tokenB: string): DexPool[] {
  return ALL_POOLS.filter(pool => 
    pool.enabled && (
      (pool.tokenA === tokenA && pool.tokenB === tokenB) ||
      (pool.tokenA === tokenB && pool.tokenB === tokenA)
    )
  );
}

/**
 * Get all pools by DEX type
 */
export function getPoolsByDex(dexType: DexType): DexPool[] {
  return ALL_POOLS.filter(pool => pool.dex === dexType && pool.enabled);
}

/**
 * Get pool by address
 */
export function getPoolByAddress(address: string): DexPool | undefined {
  return ALL_POOLS.find(pool => pool.poolAddress === address);
}

/**
 * Find arbitrage opportunities between two DEXs for the same pair
 */
export function findArbitragePairs(): Array<{ poolA: DexPool; poolB: DexPool }> {
  const pairs: Array<{ poolA: DexPool; poolB: DexPool }> = [];

  for (let i = 0; i < ALL_POOLS.length; i++) {
    for (let j = i + 1; j < ALL_POOLS.length; j++) {
      const poolA = ALL_POOLS[i];
      const poolB = ALL_POOLS[j];

      // Skip if same DEX
      if (poolA.dex === poolB.dex) continue;

      // Skip if not enabled
      if (!poolA.enabled || !poolB.enabled) continue;

      // Check if same token pair
      const sameForward = poolA.tokenA === poolB.tokenA && poolA.tokenB === poolB.tokenB;
      const sameReverse = poolA.tokenA === poolB.tokenB && poolA.tokenB === poolB.tokenA;

      if (sameForward || sameReverse) {
        pairs.push({ poolA, poolB });
      }
    }
  }

  return pairs;
}

/**
 * Calculate effective price impact from fees
 */
export function calculateFeeCost(amount: number, feeRateBps: number): number {
  return amount * (feeRateBps / 10000);
}
