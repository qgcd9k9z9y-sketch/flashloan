"use strict";
/**
 * Token Configuration
 *
 * Defines all tokens supported by the arbitrage bot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONITORED_PAIRS = exports.TOKENS = void 0;
exports.getToken = getToken;
exports.getTokenByAddress = getTokenByAddress;
exports.getEnabledPairs = getEnabledPairs;
exports.formatTokenAmount = formatTokenAmount;
exports.parseTokenAmount = parseTokenAmount;
/**
 * Supported tokens on Stellar/Soroban
 */
exports.TOKENS = {
    // Native Stellar asset (XLM)
    XLM: {
        symbol: 'XLM',
        name: 'Stellar Lumens',
        address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', // Native token wrapper
        decimals: 7,
        isNative: true,
    },
    // USDC
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        address: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
        decimals: 7,
    },
    // Aqua Token
    AQUA: {
        symbol: 'AQUA',
        name: 'Aquarius',
        address: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCSEQEQWFDR3IAQUA',
        decimals: 7,
    },
    // yXLM (Yield-bearing XLM)
    YXLM: {
        symbol: 'yXLM',
        name: 'Ultra Capital yXLM',
        address: 'CDVQVKOY2YSXS2IC7KN6MNASSHPAO7UN2UR2ON4OI2SKMFJNVAMDYXLM',
        decimals: 7,
    },
    // BTC (Wrapped Bitcoin)
    BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        address: 'CBTC6XGGFHBDFSBDEWJ5ELJAFQPYGR3PBVAJXBYFUTBOL5TP5KVMBTC',
        decimals: 7,
    },
    // ETH (Wrapped Ethereum)
    ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        address: 'CETH6L5TIUP6KBHGDMWOGMQVOCPSVEHQJ7THGE4P2ZZLEQGUXWKETH',
        decimals: 7,
    },
};
exports.MONITORED_PAIRS = [
    // Major pairs
    { tokenA: 'XLM', tokenB: 'USDC', minLiquidity: 50000, enabled: true },
    { tokenA: 'XLM', tokenB: 'AQUA', minLiquidity: 20000, enabled: true },
    { tokenA: 'USDC', tokenB: 'AQUA', minLiquidity: 20000, enabled: true },
    // Secondary pairs
    { tokenA: 'XLM', tokenB: 'YXLM', minLiquidity: 10000, enabled: true },
    { tokenA: 'XLM', tokenB: 'BTC', minLiquidity: 50000, enabled: true },
    { tokenA: 'XLM', tokenB: 'ETH', minLiquidity: 50000, enabled: true },
    { tokenA: 'USDC', tokenB: 'BTC', minLiquidity: 50000, enabled: true },
    { tokenA: 'USDC', tokenB: 'ETH', minLiquidity: 50000, enabled: true },
    // Cross pairs
    { tokenA: 'BTC', tokenB: 'ETH', minLiquidity: 100000, enabled: true },
    { tokenA: 'AQUA', tokenB: 'YXLM', minLiquidity: 5000, enabled: false },
];
/**
 * Get token by symbol
 */
function getToken(symbol) {
    return exports.TOKENS[symbol];
}
/**
 * Get token by address
 */
function getTokenByAddress(address) {
    return Object.values(exports.TOKENS).find(t => t.address === address);
}
/**
 * Get all enabled token pairs
 */
function getEnabledPairs() {
    return exports.MONITORED_PAIRS.filter(p => p.enabled);
}
/**
 * Convert token amount to human-readable format
 */
function formatTokenAmount(amount, token) {
    const decimals = token.decimals;
    const amountNum = typeof amount === 'bigint' ? Number(amount) : Number(amount);
    const formatted = amountNum / Math.pow(10, decimals);
    return `${formatted.toFixed(decimals)} ${token.symbol}`;
}
/**
 * Convert human-readable amount to stroops (atomic units)
 */
function parseTokenAmount(amount, token) {
    return BigInt(Math.floor(amount * Math.pow(10, token.decimals)));
}
//# sourceMappingURL=tokens.js.map