/**
 * DEX Pool Configuration
 * 
 * Defines all DEX pools to monitor for arbitrage opportunities
 */

export enum DexType {
  Soroswap = 0,
  Phoenix = 1,
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
 * Soroswap Pools
 */
export const SOROSWAP_POOLS: DexPool[] = [
  {
    dex: DexType.Soroswap,
    dexName: 'Soroswap',
    poolAddress: 'CSOROSWAP1XLMUSDCPOOLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    tokenA: 'XLM',
    tokenB: 'USDC',
    feeRate: 30, // 0.3%
    enabled: true,
  },
  {
    dex: DexType.Soroswap,
    dexName: 'Soroswap',
    poolAddress: 'CSOROSWAP2XLMAQUAPOOLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    tokenA: 'XLM',
    tokenB: 'AQUA',
    feeRate: 30,
    enabled: true,
  },
  {
    dex: DexType.Soroswap,
    dexName: 'Soroswap',
    poolAddress: 'CSOROSWAP3USDCAQUAPOOLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    tokenA: 'USDC',
    tokenB: 'AQUA',
    feeRate: 30,
    enabled: true,
  },
  {
    dex: DexType.Soroswap,
    dexName: 'Soroswap',
    poolAddress: 'CSOROSWAP4XLMYXLMPOOLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    tokenA: 'XLM',
    tokenB: 'YXLM',
    feeRate: 30,
    enabled: true,
  },
];

/**
 * Phoenix Pools
 */
export const PHOENIX_POOLS: DexPool[] = [
  {
    dex: DexType.Phoenix,
    dexName: 'Phoenix',
    poolAddress: 'CPHOENIX1XLMUSDCPOOLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    tokenA: 'XLM',
    tokenB: 'USDC',
    feeRate: 25, // 0.25%
    enabled: true,
  },
  {
    dex: DexType.Phoenix,
    dexName: 'Phoenix',
    poolAddress: 'CPHOENIX2XLMAQUAPOOLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    tokenA: 'XLM',
    tokenB: 'AQUA',
    feeRate: 25,
    enabled: true,
  },
  {
    dex: DexType.Phoenix,
    dexName: 'Phoenix',
    poolAddress: 'CPHOENIX3USDCAQUAPOOLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    tokenA: 'USDC',
    tokenB: 'AQUA',
    feeRate: 25,
    enabled: true,
  },
  {
    dex: DexType.Phoenix,
    dexName: 'Phoenix',
    poolAddress: 'CPHOENIX4XLMBTCPOOLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    tokenA: 'XLM',
    tokenB: 'BTC',
    feeRate: 30,
    enabled: true,
  },
];

/**
 * All pools combined
 */
export const ALL_POOLS: DexPool[] = [
  ...SOROSWAP_POOLS,
  ...PHOENIX_POOLS,
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
