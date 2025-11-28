/**
 * Aptos Chain Configuration
 * 
 * DEX pools and tokens on Aptos mainnet
 */

import { DexType } from './dex_pools';

// Aptos tokens
export const APTOS_TOKENS = {
  APT: {
    symbol: 'APT',
    name: 'Aptos',
    address: '0x1::aptos_coin::AptosCoin',
    decimals: 8,
    isNative: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
    decimals: 6,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
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

// PancakeSwap pools on Aptos
export const PANCAKESWAP_POOLS = [
  {
    dex: DexType.Aptos,
    dexName: 'PancakeSwap',
    poolAddress: '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa', // APT/USDC
    tokenA: 'APT',
    tokenB: 'USDC',
    feeRate: 25, // 0.25%
    enabled: true,
  },
  {
    dex: DexType.Aptos,
    dexName: 'PancakeSwap',
    poolAddress: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12', // APT/USDT
    tokenA: 'APT',
    tokenB: 'USDT',
    feeRate: 25,
    enabled: true,
  },
];

// Liquidswap pools
export const LIQUIDSWAP_POOLS = [
  {
    dex: DexType.Aptos,
    dexName: 'Liquidswap',
    poolAddress: '0x5a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948', // APT/USDC
    tokenA: 'APT',
    tokenB: 'USDC',
    feeRate: 30, // 0.30%
    enabled: true,
  },
];

export const APTOS_RPC_URL = 'https://fullnode.mainnet.aptoslabs.com/v1';
