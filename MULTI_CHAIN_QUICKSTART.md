# Multi-Chain Bot Quick Start

## 🚀 Starting the Bot

### 1. Install Dependencies (if needed)
```bash
cd /Users/murat/flashloan/bot
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Start the Backend API
```bash
npm start
# Backend runs on http://localhost:3001
```

### 4. Start the Frontend (in a new terminal)
```bash
cd /Users/murat/flashloan/frontend
npm run dev
# Frontend runs on http://localhost:3000
```

## 🌐 Multi-Chain Status

### Currently Active Chains
| Chain | Network | Status | DEXs | Pools |
|-------|---------|--------|------|-------|
| Stellar | Testnet | ✅ Active | Soroswap, Aquarius | 8 |
| Base | Mainnet | ✅ Active | Aerodrome, BaseSwap | 3 |
| Solana | Mainnet | ⚠️ Mock Data | Raydium, Orca | 3 |
| Sui | Mainnet | ✅ Active | Cetus, Turbos | 3 |
| Aptos | Mainnet | ✅ Active | PancakeSwap, Liquidswap | 3 |

**Total**: 5 chains, 10 DEXs, 20 pools

## ⚙️ Configuration

### Enable/Disable Chains
Edit `config/config.ts` or set environment variables:

```typescript
// config/config.ts
export default {
  stellar: { ... },
  base: {
    enabled: true, // Change to false to disable
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453
  },
  solana: {
    enabled: true,
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  },
  sui: {
    enabled: true,
    rpcUrl: 'https://fullnode.mainnet.sui.io:443'
  },
  aptos: {
    enabled: true,
    rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1'
  }
}
```

### Custom RPC Endpoints
For better performance, use paid RPC providers:

```bash
# Base
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY

# Solana
SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_KEY

# Sui
SUI_RPC_URL=https://sui-mainnet.nodereal.io/v1/YOUR_KEY

# Aptos
APTOS_RPC_URL=https://aptos-mainnet.nodereal.io/v1/YOUR_KEY
```

## 📊 Monitoring

### API Endpoints

#### Get Opportunities
```bash
curl http://localhost:3001/api/opportunities
```

Response:
```json
[
  {
    "id": "pool1_pool2",
    "tokenA": "XLM",
    "tokenB": "USDC",
    "poolA": {
      "dexName": "Soroswap",
      "priceAtoB": 0.089,
      ...
    },
    "poolB": {
      "dexName": "Aquarius",
      "priceAtoB": 0.092,
      ...
    },
    "expectedProfitUsd": 12.5,
    "profitPercentage": 3.2
  }
]
```

#### Execute Trade
```bash
curl -X POST http://localhost:3001/api/execute \
  -H "Content-Type: application/json" \
  -d '{"opportunityId": "pool1_pool2"}'
```

### Log Files
Logs are written to console with timestamps:
```
2024-12-XX 10:30:15 [INFO] 🌐 Multi-chain scanner initialized
2024-12-XX 10:30:16 [INFO] Stellar scanner initialized
2024-12-XX 10:30:16 [INFO] Base scanner initialized
2024-12-XX 10:30:17 [INFO] Solana scanner initialized
2024-12-XX 10:30:17 [INFO] Sui scanner initialized
2024-12-XX 10:30:18 [INFO] Aptos scanner initialized
```

## 🔍 Debugging

### Check Scanner Status
```typescript
// In bot/src/scanner/index.ts
logger.info('🌐 Multi-chain scanner initialized', {
  stellar: true,
  base: config.base?.enabled || false,
  solana: config.solana?.enabled || false,
  sui: config.sui?.enabled || false,
  aptos: config.aptos?.enabled || false,
});
```

### Test Individual Chain Scanner
```typescript
// Example: Test Base scanner
import { baseScanner } from './scanner/base';
import { AERODROME_POOLS } from '../config/base_config';
import { BASE_TOKENS } from '../config/base_config';

const pool = AERODROME_POOLS[0];
const tokenA = BASE_TOKENS.ETH;
const tokenB = BASE_TOKENS.USDC;

const price = await baseScanner.fetchPoolPrice(pool, tokenA, tokenB);
console.log('Base pool price:', price);
```

## ⚠️ Known Issues

### 1. Solana Mock Data
**Issue**: Solana scanner uses random mock reserves
**Impact**: Prices are not real
**Solution**: Implement Raydium pool layout parsing in `bot/src/scanner/solana.ts`

```typescript
// Current (Line 85-86):
const reserveA = BigInt(Math.random() * 1000000 * 1e9); // MOCK
const reserveB = BigInt(Math.random() * 1000000 * 1e6); // MOCK

// TODO: Parse actual layout from accountInfo.data
```

### 2. Cross-Chain Arbitrage Not Implemented
**Issue**: Only detects arbitrage within same chain
**Impact**: No opportunities between different blockchains
**Solution**: Implement bridge integration (Wormhole, LayerZero)

### 3. Flash Loan Only on Stellar
**Issue**: Flash loan contract only deployed on Stellar testnet
**Impact**: Cannot execute trades on other chains yet
**Solution**: Deploy equivalent flash loan contracts on Base, Solana, Sui, Aptos

## 🛠️ Development

### Add New DEX Pool
1. Add pool to chain config (e.g., `config/base_config.ts`)
2. Pools automatically included in arbitrage detection
3. Rebuild and restart bot

Example:
```typescript
// config/base_config.ts
export const AERODROME_POOLS: DexPool[] = [
  // ... existing pools
  {
    dex: DexType.Base,
    dexName: 'Aerodrome',
    poolAddress: '0xNEW_POOL_ADDRESS',
    tokenA: 'ETH',
    tokenB: 'DAI',
    feeRate: 5, // 0.05%
    enabled: true,
  }
];
```

### Add New Token
```typescript
// config/base_config.ts
export const BASE_TOKENS = {
  // ... existing tokens
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    decimals: 18,
  }
};
```

## 📈 Performance Tuning

### Scan Interval
```typescript
// config/config.ts
scanner: {
  scanIntervalMs: 10000, // Reduce for faster scanning (e.g., 5000)
  opportunityTtlSeconds: 60,
}
```

### Minimum Profit Threshold
```typescript
// config/config.ts
trading: {
  minProfitBps: 50, // Minimum 0.5% profit (50 basis points)
  maxSlippageBps: 100, // Max 1% slippage
  minLiquidityUsd: 1000, // Minimum $1000 liquidity
}
```

## 🔐 Security

### Private Keys
Never commit private keys! Use environment variables:
```bash
# .env
STELLAR_PRIVATE_KEY=SXXXXXXXXXXXXX
BASE_PRIVATE_KEY=0xXXXXXXXXXXXXXX
SOLANA_PRIVATE_KEY=XXXXXXXXXXXXX
```

### RPC Security
Use authenticated RPC endpoints in production:
- Prevents rate limiting
- Better reliability
- Access to premium features

## 📚 Resources

### Documentation
- [Stellar Soroban Docs](https://soroban.stellar.org/)
- [Base Docs](https://docs.base.org/)
- [Solana Docs](https://docs.solana.com/)
- [Sui Docs](https://docs.sui.io/)
- [Aptos Docs](https://aptos.dev/)

### DEX Documentation
- [Soroswap](https://docs.soroswap.finance/)
- [Aquarius AMM](https://aqua.network/)
- [Aerodrome](https://docs.aerodrome.finance/)
- [Raydium](https://raydium.io/docs/)
- [Cetus](https://cetus.zone/)

## 🎯 Next Steps

1. **Test all chains**: Verify each scanner fetches real data
2. **Fix Solana**: Implement real pool parsing
3. **Monitor logs**: Check for errors during scanning
4. **Optimize RPC**: Switch to paid endpoints if needed
5. **Add more pools**: Expand coverage on each chain

---

Need help? Check `MULTI_CHAIN_INTEGRATION.md` for detailed technical info.
