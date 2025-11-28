/**
 * Sui Chain Configuration
 * 
 * DEX pools and tokens on Sui mainnet
 */

import { DexType } from './dex_pools';

// Sui tokens
export const SUI_TOKENS = {
  SUI: {
    symbol: 'SUI',
    name: 'Sui',
    address: '0x2::sui::SUI',
    decimals: 9,
    isNative: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    decimals: 6,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    decimals: 6,
  },
  CETUS: {
    symbol: 'CETUS',
    name: 'Cetus',
    address: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    decimals: 9,
  },
};

// Cetus DEX pools
export const CETUS_POOLS = [
  {
    dex: DexType.Sui,
    dexName: 'Cetus',
    poolAddress: '0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630', // SUI/USDC
    tokenA: 'SUI',
    tokenB: 'USDC',
    feeRate: 30, // 0.30%
    enabled: true,
  },
  {
    dex: DexType.Sui,
    dexName: 'Cetus',
    poolAddress: '0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3', // SUI/USDT
    tokenA: 'SUI',
    tokenB: 'USDT',
    feeRate: 30,
    enabled: true,
  },
];

// Turbos DEX pools
export const TURBOS_POOLS = [
  {
    dex: DexType.Sui,
    dexName: 'Turbos',
    poolAddress: '0x5eb2dfcdd1b15d2021328258f6d5ec081e9a0cdcfa9e13a0eaeb9b5f7505ca78', // SUI/USDC
    tokenA: 'SUI',
    tokenB: 'USDC',
    feeRate: 25, // 0.25%
    enabled: true,
  },
];

export const SUI_RPC_URL = 'https://fullnode.mainnet.sui.io:443';
