# Deployment Guide

## Prerequisites

### 1. Install Dependencies

#### Rust & Soroban CLI
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli --version 20.0.0
```

#### Node.js & TypeScript
```bash
# Install Node.js (v18+)
# Using nvm:
nvm install 18
nvm use 18

# Install project dependencies
cd bot
npm install
```

### 2. Configure Stellar Account

```bash
# Generate a new keypair (testnet)
soroban keys generate --global bot --network testnet

# Get public key
soroban keys address bot

# Fund the account (testnet)
curl "https://friendbot.stellar.org?addr=$(soroban keys address bot)"
```

## Smart Contract Deployment

### Step 1: Build the Contract

```bash
cd contracts/flash_loan_executor

# Build optimized WASM
soroban contract build --release

# The WASM file will be at:
# target/wasm32-unknown-unknown/release/flash_loan_executor.wasm
```

### Step 2: Optimize WASM (Optional)

```bash
# Install wasm-opt (from binaryen)
brew install binaryen  # macOS
# or
apt-get install binaryen  # Linux

# Optimize
wasm-opt \
  --strip-debug \
  --vacuum \
  -Oz \
  target/wasm32-unknown-unknown/release/flash_loan_executor.wasm \
  -o flash_loan_executor_optimized.wasm
```

### Step 3: Deploy to Testnet

```bash
# Deploy the contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/flash_loan_executor.wasm \
  --source bot \
  --network testnet

# Output will be contract ID (save this!):
# CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 4: Initialize the Contract

```bash
# Initialize with your address as owner
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source bot \
  --network testnet \
  -- \
  initialize \
  --owner $(soroban keys address bot)
```

### Step 5: Verify Deployment

```bash
# Test contract is working
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source bot \
  --network testnet \
  -- \
  get_profit_balance \
  --token <TOKEN_ADDRESS>
```

## Bot Configuration

### Step 1: Set Up Environment

```bash
cd bot

# Copy example env file
cp ../.env.example .env

# Edit .env with your values
nano .env
```

Required values:
```env
BOT_SECRET_KEY=SXXXXX...  # Your bot's secret key
FLASH_LOAN_EXECUTOR_CONTRACT=CXXXXX...  # Deployed contract ID
SOROSWAP_ROUTER=CXXXXX...  # Soroswap router address
PHOENIX_ROUTER=CXXXXX...  # Phoenix router address
```

### Step 2: Validate Configuration

```bash
# Test configuration
npm run dev

# Should see:
# ✓ Configuration validated
# ✓ Stellar client initialized
```

## Mainnet Deployment

⚠️ **IMPORTANT**: Thoroughly test on testnet before mainnet deployment!

### Step 1: Switch Network

Update `.env`:
```env
SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
HORIZON_URL=https://horizon.stellar.org
NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
IS_TESTNET=false
```

### Step 2: Fund Mainnet Account

```bash
# Generate mainnet keys
soroban keys generate --global bot-mainnet --network mainnet

# Send XLM to this address from your wallet
# Minimum: 10 XLM for contract deployment + operations
```

### Step 3: Deploy Contract

```bash
# Deploy to mainnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/flash_loan_executor.wasm \
  --source bot-mainnet \
  --network mainnet

# Initialize
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source bot-mainnet \
  --network mainnet \
  -- \
  initialize \
  --owner $(soroban keys address bot-mainnet)
```

### Step 4: Security Checklist

Before going live:

- [ ] Audit contract code
- [ ] Test with small amounts
- [ ] Set up monitoring alerts
- [ ] Configure circuit breaker
- [ ] Limit max trade size
- [ ] Enable logging
- [ ] Set up backup systems
- [ ] Document emergency procedures

## Contract Upgrades

### Method 1: Deploy New Contract

```bash
# Deploy new version
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/flash_loan_executor_v2.wasm \
  --source bot \
  --network testnet

# Update bot configuration with new contract ID
# Withdraw profits from old contract first!
```

### Method 2: Use Upgradeable Pattern (Advanced)

Implement a proxy pattern:
```rust
pub struct ProxyContract {
    implementation: Address,
}

impl ProxyContract {
    pub fn upgrade(env: Env, new_implementation: Address) {
        // Only owner can upgrade
        require_owner(&env, &env.invoker())?;
        env.storage().instance().set(&"implementation", &new_implementation);
    }
}
```

## Monitoring Deployment

### Health Check Endpoints

```bash
# Check bot is running
curl http://localhost:3000/health

# Get metrics
curl http://localhost:3000/metrics
```

### Logs

```bash
# Follow logs
tail -f logs/bot.log

# Search for errors
grep ERROR logs/bot.log

# Profitability report
grep "profit" logs/bot.log | grep SUCCESS
```

### Alerts

Set up alerts for:
- Contract errors
- Consecutive failures (> 5)
- Profit drops below threshold
- High gas costs
- Network connectivity issues

## Backup & Recovery

### Backup Contract State

```bash
# Export contract state
soroban contract fetch \
  --id <CONTRACT_ID> \
  --network testnet \
  --out contract_state.json
```

### Backup Profits

Regularly withdraw accumulated profits:
```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source bot \
  --network testnet \
  -- \
  withdraw_profit \
  --caller $(soroban keys address bot) \
  --token <TOKEN_ADDRESS> \
  --amount 1000000000 \
  --recipient $(soroban keys address bot)
```

### Recovery Procedures

If bot crashes:
1. Check logs for root cause
2. Ensure contract is not paused
3. Verify account has sufficient XLM
4. Restart bot with `npm run dev`
5. Monitor for 30 minutes

If contract is compromised:
1. Immediately pause contract
2. Withdraw all profits
3. Deploy new contract
4. Update bot configuration
5. Conduct security audit

## Cost Estimation

### Testnet
- Contract deployment: Free
- Transactions: Free (throttled)

### Mainnet
- Contract deployment: ~5-10 XLM
- Per transaction: 0.00001-0.0001 XLM base fee
- Contract execution: 0.01-0.1 XLM (depending on complexity)
- Monthly operational cost: ~10-50 XLM (with moderate activity)

## Troubleshooting

### Contract Deployment Fails

```bash
# Check account balance
soroban keys address bot
# Visit stellar.expert to check balance

# Increase fee
soroban contract deploy \
  --wasm ... \
  --fee 100000

# Check network status
curl https://soroban-testnet.stellar.org/health
```

### Bot Can't Connect

```bash
# Test RPC connection
curl https://soroban-testnet.stellar.org

# Check credentials
soroban keys show bot

# Verify contract exists
soroban contract inspect --id <CONTRACT_ID> --network testnet
```

### Transactions Failing

```bash
# Simulate transaction first
npm run simulate

# Check account sequence
soroban account details --address $(soroban keys address bot)

# Increase timeout
# In config.ts: TX_TIMEOUT_SECONDS=60
```

## Next Steps

After successful deployment:

1. **Monitor Performance**: Track metrics for 24 hours
2. **Optimize Parameters**: Adjust min profit, slippage based on results
3. **Scale Gradually**: Increase trade sizes slowly
4. **Implement Backtesting**: Use historical data to refine strategy
5. **Set Up Dashboards**: Create monitoring dashboards (Grafana, etc.)

## Support

- **Soroban Docs**: https://soroban.stellar.org/docs
- **Discord**: https://discord.gg/stellar
- **GitHub Issues**: [Your repo]/issues
