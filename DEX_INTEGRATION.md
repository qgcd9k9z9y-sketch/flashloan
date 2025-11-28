# DEX Integration Guide

## Current Status ✅

### Soroswap (INTEGRATED)
**Router Contract (Testnet):** `CCMAPXWVZD4USEKDWRYS7DA4Y3D7E2SDMGBFJUCEXTC7VN6CUBGWPFUS`
**Factory Contract (Testnet):** `CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES`

Source: https://github.com/soroswap/core/blob/main/public/testnet.contracts.json

### Phoenix Protocol (PENDING)
**Status:** Testnet contract addresses not yet found
**Action Required:** Contact Phoenix team or check their Discord/Telegram

- Discord: https://discord.gg/phoenix
- Telegram: https://t.me/phoenix_protocol
- GitHub: https://github.com/Phoenix-Protocol-The-Game

## How to Get Real Pool Addresses

### Option 1: Query Soroswap Factory
Use Soroswap Factory contract to get actual pool addresses:

```bash
stellar contract invoke \
  --id CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES \
  --network testnet \
  --source-account YOUR_ACCOUNT \
  -- \
  get_pair \
  --token_a TOKEN_A_ADDRESS \
  --token_b TOKEN_B_ADDRESS
```

### Option 2: Use Soroswap API
```bash
curl "https://api.soroswap.finance/api/pools?network=testnet"
```

### Option 3: Check Soroswap Interface
1. Visit https://app.soroswap.finance/
2. Connect your Freighter wallet to Testnet
3. Navigate to Pools section
4. Inspect network requests to see pool addresses

## Token Addresses (Testnet)

### Native Assets
- **XLM**: Native Stellar token (no contract address needed)

### Common Test Tokens
Find testnet token addresses at:
- Soroswap docs: https://docs.soroswap.finance/
- Stellar Asset directory: https://stellar.org/assets

## Implementation Steps

### 1. Update Pool Addresses
Edit `/bot/src/config/dex_pools.ts` with real pool addresses:

```typescript
export const SOROSWAP_POOLS: DexPool[] = [
  {
    dex: DexType.Soroswap,
    dexName: 'Soroswap',
    poolAddress: 'REAL_POOL_ADDRESS_HERE', // Get from factory
    tokenA: 'XLM',
    tokenB: 'USDC',
    feeRate: 30,
    enabled: true,
  },
  // ... more pools
];
```

### 2. Implement Real DEX Calls
Update scanner implementations:

**`/bot/src/scanner/soroswap.ts`:**
```typescript
// Replace mock data with real contract calls
const contract = new Contract(pool.poolAddress, {
  rpc: sorobanRpc,
  networkPassphrase,
});

const reserves = await contract.call('get_reserves');
```

**`/bot/src/scanner/phoenix.ts`:**
```typescript
// Phoenix may use different function names
const poolInfo = await contract.call('query_pool_info');
```

### 3. Build Flash Loan Transaction
Edit `/bot/src/engine/transaction_builder.ts`:

```typescript
import { Contract, TransactionBuilder } from '@stellar/stellar-sdk';

// Build execute_flash_loan_arbitrage transaction
const tx = new TransactionBuilder(account, { fee })
  .addOperation(
    contract.call('execute_flash_loan_arbitrage', {
      borrow_token: borrowToken,
      borrow_amount: borrowAmount,
      pools: poolAddresses,
      min_profit: minProfit,
    })
  )
  .setTimeout(30)
  .build();

return tx.toXDR();
```

### 4. Test Execution
```bash
# 1. Start bot backend
cd /Users/murat/flashloan/bot
npm run build
node dist/src/index.js

# 2. Start frontend
cd /Users/murat/flashloan/frontend
npm run dev

# 3. Connect Freighter wallet at http://localhost:3000
# 4. Click Execute on an opportunity
# 5. Sign transaction with Freighter
```

## Troubleshooting

### "Contract not found"
- Verify contract address is correct
- Check you're on the right network (testnet vs mainnet)
- Ensure contract is deployed: `stellar contract info --id CONTRACT_ID --network testnet`

### "Insufficient balance"
- Fund your testnet account: `curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"`
- Check XLM balance covers transaction fees and reserves

### "Invalid operation"
- Verify function name matches contract interface
- Check parameter types and order
- Use `stellar contract inspect` to see available functions

## Next Steps

1. **Get Phoenix Addresses**: Contact Phoenix team for testnet deployment
2. **Fetch Real Pools**: Query Soroswap factory for active pools
3. **Test Token Addresses**: Get testnet USDC, AQUA addresses
4. **Implement Scanner**: Replace mock data with real RPC calls
5. **Build Transactions**: Implement transaction builder
6. **Test End-to-End**: Execute a real arbitrage on testnet

## Resources

- Soroswap Docs: https://docs.soroswap.finance/
- Stellar Docs: https://developers.stellar.org/docs
- Soroban Examples: https://github.com/stellar/soroban-examples
- Freighter Wallet: https://www.freighter.app/
