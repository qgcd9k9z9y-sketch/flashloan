"use strict";
/**
 * DEX Pool Configuration
 *
 * Defines all DEX pools to monitor for arbitrage opportunities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_POOLS = exports.AQUARIUS_POOLS = exports.SOROSWAP_POOLS = exports.DexType = void 0;
exports.getPoolsForPair = getPoolsForPair;
exports.getPoolsByDex = getPoolsByDex;
exports.getPoolByAddress = getPoolByAddress;
exports.findArbitragePairs = findArbitragePairs;
exports.calculateFeeCost = calculateFeeCost;
var DexType;
(function (DexType) {
    DexType[DexType["Soroswap"] = 0] = "Soroswap";
    DexType[DexType["Aquarius"] = 1] = "Aquarius";
})(DexType || (exports.DexType = DexType = {}));
/**
 * Soroswap Pools (Testnet - Real Addresses)
 * Note: Only XLM/USDC pool is currently deployed on testnet
 * Source: Soroswap Factory CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES
 */
exports.SOROSWAP_POOLS = [
    {
        dex: DexType.Soroswap,
        dexName: 'Soroswap',
        poolAddress: 'CDE3I665APUHQYMATNLEODUPIWTEWXB5NB5IEV6NNNDQ3ZYRJ3SSWZKM', // Real XLM/USDC pool
        tokenA: 'XLM',
        tokenB: 'USDC',
        feeRate: 30, // 0.3%
        enabled: true,
    },
    // Other pools not yet deployed on Soroswap testnet
    // {
    //   dex: DexType.Soroswap,
    //   dexName: 'Soroswap',
    //   poolAddress: 'CSOROSWAP2XLMAQUAPOOLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    //   tokenA: 'XLM',
    //   tokenB: 'AQUA',
    //   feeRate: 30,
    //   enabled: false,
    // },
];
/**
 * Aquarius Pools (Testnet - Real Addresses)
 * Source: https://amm-api-testnet.aqua.network/api/external/v1/pools/
 */
exports.AQUARIUS_POOLS = [
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
/**
 * All pools combined
 */
exports.ALL_POOLS = [
    ...exports.SOROSWAP_POOLS,
    ...exports.AQUARIUS_POOLS,
];
/**
 * Get pools for a specific token pair
 */
function getPoolsForPair(tokenA, tokenB) {
    return exports.ALL_POOLS.filter(pool => pool.enabled && ((pool.tokenA === tokenA && pool.tokenB === tokenB) ||
        (pool.tokenA === tokenB && pool.tokenB === tokenA)));
}
/**
 * Get all pools by DEX type
 */
function getPoolsByDex(dexType) {
    return exports.ALL_POOLS.filter(pool => pool.dex === dexType && pool.enabled);
}
/**
 * Get pool by address
 */
function getPoolByAddress(address) {
    return exports.ALL_POOLS.find(pool => pool.poolAddress === address);
}
/**
 * Find arbitrage opportunities between two DEXs for the same pair
 */
function findArbitragePairs() {
    const pairs = [];
    for (let i = 0; i < exports.ALL_POOLS.length; i++) {
        for (let j = i + 1; j < exports.ALL_POOLS.length; j++) {
            const poolA = exports.ALL_POOLS[i];
            const poolB = exports.ALL_POOLS[j];
            // Skip if same DEX
            if (poolA.dex === poolB.dex)
                continue;
            // Skip if not enabled
            if (!poolA.enabled || !poolB.enabled)
                continue;
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
function calculateFeeCost(amount, feeRateBps) {
    return amount * (feeRateBps / 10000);
}
//# sourceMappingURL=dex_pools.js.map