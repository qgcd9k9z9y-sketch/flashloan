/**
 * DEX Pool Configuration
 *
 * Defines all DEX pools to monitor for arbitrage opportunities
 */
export declare enum DexType {
    Soroswap = 0,
    Aquarius = 1
}
export interface DexPool {
    dex: DexType;
    dexName: string;
    poolAddress: string;
    tokenA: string;
    tokenB: string;
    feeRate: number;
    enabled: boolean;
}
/**
 * Soroswap Pools (Testnet - Real Addresses)
 * Note: Only XLM/USDC pool is currently deployed on testnet
 * Source: Soroswap Factory CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES
 */
export declare const SOROSWAP_POOLS: DexPool[];
/**
 * Aquarius Pools (Testnet - Real Addresses)
 * Source: https://amm-api-testnet.aqua.network/api/external/v1/pools/
 */
export declare const AQUARIUS_POOLS: DexPool[];
/**
 * All pools combined
 */
export declare const ALL_POOLS: DexPool[];
/**
 * Get pools for a specific token pair
 */
export declare function getPoolsForPair(tokenA: string, tokenB: string): DexPool[];
/**
 * Get all pools by DEX type
 */
export declare function getPoolsByDex(dexType: DexType): DexPool[];
/**
 * Get pool by address
 */
export declare function getPoolByAddress(address: string): DexPool | undefined;
/**
 * Find arbitrage opportunities between two DEXs for the same pair
 */
export declare function findArbitragePairs(): Array<{
    poolA: DexPool;
    poolB: DexPool;
}>;
/**
 * Calculate effective price impact from fees
 */
export declare function calculateFeeCost(amount: number, feeRateBps: number): number;
//# sourceMappingURL=dex_pools.d.ts.map