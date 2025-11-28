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
export const TOKENS: Record<string, Token> = {
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

  // Base Chain Tokens
  'BASE-ETH': {
    symbol: 'ETH',
    name: 'Ethereum (Base)',
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    isNative: true,
  },
  'BASE-USDC': {
    symbol: 'USDC',
    name: 'USD Coin (Base)',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
  },
  USDbC: {
    symbol: 'USDbC',
    name: 'USD Base Coin',
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    decimals: 6,
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    decimals: 18,
  },

  // Solana Tokens
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    isNative: true,
  },
  'SOL-USDC': {
    symbol: 'USDC',
    name: 'USD Coin (Solana)',
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

  // Sui Tokens
  SUI: {
    symbol: 'SUI',
    name: 'Sui',
    address: '0x2::sui::SUI',
    decimals: 9,
    isNative: true,
  },
  'SUI-USDC': {
    symbol: 'USDC',
    name: 'USD Coin (Sui)',
    address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    decimals: 6,
  },
  'SUI-USDT': {
    symbol: 'USDT',
    name: 'Tether USD (Sui)',
    address: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    decimals: 6,
  },
  CETUS: {
    symbol: 'CETUS',
    name: 'Cetus Protocol',
    address: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    decimals: 9,
  },

  // Aptos Tokens
  APT: {
    symbol: 'APT',
    name: 'Aptos',
    address: '0x1::aptos_coin::AptosCoin',
    decimals: 8,
    isNative: true,
  },
  'APT-USDC': {
    symbol: 'USDC',
    name: 'USD Coin (Aptos)',
    address: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
    decimals: 6,
  },
  'APT-USDT': {
    symbol: 'USDT',
    name: 'Tether USD (Aptos)',
    address: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
    decimals: 6,
  },
  CAKE: {
    symbol: 'CAKE',
    name: 'PancakeSwap',
    address: '0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6::oft::CakeOFT',
    decimals: 8,
  },
};

/**
 * Token pairs to monitor for arbitrage opportunities
 */
export interface TokenPair {
  tokenA: string; // Token symbol
  tokenB: string; // Token symbol
  minLiquidity: number; // Minimum liquidity in USD
  enabled: boolean;
}

export const MONITORED_PAIRS: TokenPair[] = [
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
 * Supports both Stellar tokens and multi-chain tokens
 */
export function getToken(symbol: string, chain?: string): Token | undefined {
  // First try direct match
  if (TOKENS[symbol]) {
    return TOKENS[symbol];
  }
  
  // Try chain-specific variants
  const chainPrefix = chain ? `${chain.toUpperCase()}-` : '';
  const chainSpecific = TOKENS[`${chainPrefix}${symbol}`];
  if (chainSpecific) {
    return chainSpecific;
  }
  
  // For common symbols, try different chain prefixes
  const commonPrefixes = ['BASE', 'SOL', 'SUI', 'APT'];
  for (const prefix of commonPrefixes) {
    const key = `${prefix}-${symbol}`;
    if (TOKENS[key]) {
      return TOKENS[key];
    }
  }
  
  // Fallback: return a default token for known symbols
  if (symbol === 'ETH') {
    return TOKENS['BASE-ETH'] || TOKENS['ETH'];
  }
  if (symbol === 'USDC') {
    return TOKENS['USDC']; // Stellar USDC as default
  }
  if (symbol === 'USDT') {
    return TOKENS['USDT'];
  }
  
  return undefined;
}

/**
 * Get token by address
 */
export function getTokenByAddress(address: string): Token | undefined {
  return Object.values(TOKENS).find(t => t.address === address);
}

/**
 * Get all enabled token pairs
 */
export function getEnabledPairs(): TokenPair[] {
  return MONITORED_PAIRS.filter(p => p.enabled);
}

/**
 * Convert token amount to human-readable format
 */
export function formatTokenAmount(amount: bigint | string | number, token: Token): string {
  const decimals = token.decimals;
  const amountNum = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  const formatted = amountNum / Math.pow(10, decimals);
  return `${formatted.toFixed(decimals)} ${token.symbol}`;
}

/**
 * Convert human-readable amount to stroops (atomic units)
 */
export function parseTokenAmount(amount: number, token: Token): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, token.decimals)));
}
