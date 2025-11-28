# Flash Loan Arbitrage Bot - Complete Setup & Deployment Guide

## Prerequisites

### 1. Install Required Tools

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Install Node.js (v18 or higher)
# Install from https://nodejs.org/

# Verify installations
stellar --version
node --version
npm --version
```

### 2. Configure Stellar Network

```bash
# Generate a new keypair for testnet
stellar keys generate deployer --network testnet

# Fund your account (testnet only)
stellar keys fund deployer --network testnet

# Get your address
stellar keys address deployer
```

## Part 1: Deploy Smart Contract

### Build the Contract

```bash
cd contracts/flash_loan_executor

# Build
stellar contract build

# Optimize (recommended)
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/flash_loan_executor.wasm
```

### Deploy to Testnet

```bash
# From project root
chmod +x scripts/deploy_contract.sh
./scripts/deploy_contract.sh

# Or manually:
cd contracts/flash_loan_executor
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/flash_loan_executor.wasm \
  --source deployer \
  --network testnet
```

### Initialize the Contract

```bash
# Replace CONTRACT_ID with your deployed contract ID
CONTRACT_ID="CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
OWNER_ADDRESS=$(stellar keys address deployer)

stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --owner $OWNER_ADDRESS
```

## Part 2: Setup Bot

### Install Dependencies

```bash
cd bot
npm install
```

### Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Required environment variables:
```env
# Stellar Network
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
IS_TESTNET=true

# Contracts (use your deployed contract IDs)
FLASH_LOAN_EXECUTOR_CONTRACT=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SOROSWAP_ROUTER=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PHOENIX_ROUTER=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Bot Wallet (your deployer key or create new one)
BOT_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
BOT_PUBLIC_KEY=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Trading Parameters
MIN_PROFIT_BPS=50
MAX_SLIPPAGE_BPS=100
MAX_TRADE_AMOUNT=10000

# Execution
AUTO_EXECUTE=false
DRY_RUN=true
```

### Build and Run

```bash
# Build TypeScript
npm run build

# Run scanner (simulation mode)
npm run scanner

# Run full bot
npm start
```

## Part 3: Setup Frontend

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Environment

```bash
# Copy example env
cp .env.example .env.local

# Edit with your settings
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_FLASH_LOAN_EXECUTOR_CONTRACT=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Run Frontend

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The frontend will be available at `http://localhost:3000`

## Part 4: Integration Testing

### Test Contract

```bash
chmod +x scripts/test_contract.sh
./scripts/test_contract.sh <CONTRACT_ID>
```

### Test Bot Scanner

```bash
cd bot
npm run scanner
```

### Test Arbitrage Simulation

```bash
cd bot
npm run simulate
```

## Part 5: Production Deployment

### Deploy Contract to Mainnet

```bash
# Generate mainnet keys
stellar keys generate mainnet-deployer --network mainnet

# Fund your account with real XLM
# Send XLM to: stellar keys address mainnet-deployer

# Deploy
NETWORK=mainnet ./scripts/deploy_contract.sh
```

### Deploy Bot (Server)

```bash
# Build bot
cd bot
npm run build

# Run with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name "flashloan-bot"
pm2 save
pm2 startup
```

### Deploy Frontend (Vercel)

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Monitoring & Maintenance

### Monitor Bot Logs

```bash
# With PM2
pm2 logs flashloan-bot

# Direct logs
tail -f bot/logs/bot.log
```

### Monitor Contract

```bash
# View contract events
stellar events --id <CONTRACT_ID> --start-ledger <LEDGER> --network testnet
```

### Update Configuration

```bash
# Update trading parameters
nano bot/.env

# Restart bot
pm2 restart flashloan-bot
```

## Security Checklist

- ✅ Store private keys securely (use environment variables, never commit)
- ✅ Enable reentrancy guard in smart contract
- ✅ Set appropriate profit thresholds
- ✅ Test thoroughly on testnet before mainnet
- ✅ Monitor bot activity and profits
- ✅ Set up alerts for errors/failures
- ✅ Regularly update dependencies
- ✅ Implement proper error handling
- ✅ Use hardware wallet for mainnet deployments (recommended)

## Troubleshooting

### Contract Build Fails

```bash
# Clean and rebuild
cd contracts/flash_loan_executor
cargo clean
stellar contract build
```

### Bot Connection Issues

```bash
# Check RPC endpoint
curl https://soroban-testnet.stellar.org/health

# Verify account exists
stellar account get <YOUR_ADDRESS> --network testnet
```

### Frontend Not Loading Data

- Check if bot API is running
- Verify API endpoints in `.env.local`
- Check browser console for errors
- Ensure CORS is properly configured

## Useful Commands

```bash
# Check account balance
stellar account get <ADDRESS> --network testnet

# View recent transactions
stellar transaction list --account <ADDRESS> --network testnet

# Check contract balance
stellar contract invoke --id <CONTRACT_ID> --network testnet -- balance

# Generate new keypair
stellar keys generate <name> --network testnet
```

## Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Docs](https://soroban.stellar.org/)
- [Stellar CLI Reference](https://developers.stellar.org/docs/tools/cli)
- [Soroswap Docs](https://docs.soroswap.finance/)
- [Phoenix Protocol](https://phoenix-hub.io/)

## Support

For issues or questions:
1. Check existing documentation
2. Review contract error codes in `contracts/flash_loan_executor/src/errors.rs`
3. Check bot logs for error messages
4. Review testnet transactions for failure reasons

---

**Remember**: Always test on testnet first! Flash loan arbitrage involves real financial risks.
