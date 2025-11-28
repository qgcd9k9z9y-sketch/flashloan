/**
 * Base Chain Configuration
 * 
 * DEX pools and tokens on Base mainnet
 */

import { DexType } from './dex_pools';

// Base chain tokens
export const BASE_TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x4200000000000000000000000000000000000006', // WETH on Base
    decimals: 18,
    isNative: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Native USDC on Base
    decimals: 6,
  },
  USDbC: {
    symbol: 'USDbC',
    name: 'USD Base Coin',
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // Bridged USDC
    decimals: 6,
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    decimals: 18,
  },
};

// Aerodrome DEX pools (most liquid on Base)
export const AERODROME_POOLS = [
  {
    dex: DexType.Base,
    dexName: 'Aerodrome',
    poolAddress: '0xcDAC0d6c6C59727a65F871236188350531885C43', // ETH/USDC
    tokenA: 'ETH',
    tokenB: 'USDC',
    feeRate: 5, // 0.05%
    enabled: true,
  },
  {
    dex: DexType.Base,
    dexName: 'Aerodrome',
    poolAddress: '0xB4885Bc63399BF5518b994c1d0C153334Ee579D0', // ETH/USDbC
    tokenA: 'ETH',
    tokenB: 'USDbC',
    feeRate: 5,
    enabled: true,
  },
];

// BaseSwap pools
export const BASESWAP_POOLS = [
  {
    dex: DexType.Base,
    dexName: 'BaseSwap',
    poolAddress: '0x6FE47426fc4424Bb15fc7ea948F81a2682C0F37D', // ETH/USDC
    tokenA: 'ETH',
    tokenB: 'USDC',
    feeRate: 30, // 0.30%
    enabled: true,
  },
];

export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = 'https://mainnet.base.org';
