/**
 * Token Configuration
 *
 * Defines all tokens supported by the arbitrage bot
 */
export interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    isNative?: boolean;
}
/**
 * Supported tokens on Stellar/Soroban
 */
export declare const TOKENS: Record<string, Token>;
/**
 * Token pairs to monitor for arbitrage opportunities
 */
export interface TokenPair {
    tokenA: string;
    tokenB: string;
    minLiquidity: number;
    enabled: boolean;
}
export declare const MONITORED_PAIRS: TokenPair[];
/**
 * Get token by symbol
 */
export declare function getToken(symbol: string): Token | undefined;
/**
 * Get token by address
 */
export declare function getTokenByAddress(address: string): Token | undefined;
/**
 * Get all enabled token pairs
 */
export declare function getEnabledPairs(): TokenPair[];
/**
 * Convert token amount to human-readable format
 */
export declare function formatTokenAmount(amount: bigint | string | number, token: Token): string;
/**
 * Convert human-readable amount to stroops (atomic units)
 */
export declare function parseTokenAmount(amount: number, token: Token): bigint;
//# sourceMappingURL=tokens.d.ts.map