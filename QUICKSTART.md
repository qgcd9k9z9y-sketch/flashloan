# Flash-Loan Arbitrage Bot - Quick Start

Welcome to the Flash-Loan Arbitrage Bot for Stellar Soroban! This guide will get you up and running quickly.

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install Rust & Soroban CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked soroban-cli

# Install Node.js dependencies
cd bot
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

Minimum required settings:
```env
BOT_SECRET_KEY=SXXXXX...
FLASH_LOAN_EXECUTOR_CONTRACT=CXXXXX...
```

### 3. Build & Deploy Contract

```bash
# Build contract
cd contracts/flash_loan_executor
soroban contract build

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/flash_loan_executor.wasm \
  --source <YOUR_KEY> \
  --network testnet
```

### 4. Run the Bot

```bash
cd bot

# Scan mode (no execution)
npm run scanner

# Simulate opportunities
npm run simulate

# Full bot with auto-execution
npm start
```

## 📚 Learn More

- [Flash Loan Mechanism](docs/FLASH_LOAN_MECHANISM.md) - How it works
- [Deployment Guide](docs/DEPLOYMENT.md) - Detailed deployment steps
- [Testing Guide](docs/TESTING.md) - Testing strategies

## 🎯 Key Features

- ✅ **Atomic Flash Loans** - No partial executions
- ✅ **Multi-DEX Support** - Soroswap, Phoenix, Stellar DEX
- ✅ **AI Decision Engine** - Smart opportunity evaluation
- ✅ **Security Guards** - Reentrancy, slippage, profit protection
- ✅ **Real-time Monitoring** - Metrics & logging
- ✅ **Circuit Breaker** - Automatic safety stops

## 💡 Usage Examples

### Scan for Opportunities
```bash
npm run scanner
```

### Execute Specific Opportunity
```bash
npm run execute -- <OPPORTUNITY_ID>
```

### Execute Best Opportunity
```bash
npm run execute -- --best
```

## ⚙️ Configuration Tips

**For Maximum Profit:**
```env
MIN_PROFIT_BPS=30    # 0.3% minimum
MAX_SLIPPAGE_BPS=150 # 1.5% slippage
AUTO_EXECUTE=true
```

**For Conservative Trading:**
```env
MIN_PROFIT_BPS=100   # 1% minimum
MAX_SLIPPAGE_BPS=50  # 0.5% slippage
AI_RISK_THRESHOLD=20 # Lower risk tolerance
AUTO_EXECUTE=false   # Manual approval
```

## 🔒 Security Checklist

Before running on mainnet:

- [ ] Audit smart contract code
- [ ] Test thoroughly on testnet
- [ ] Set up monitoring & alerts
- [ ] Configure circuit breaker
- [ ] Limit initial trade sizes
- [ ] Enable all safety features
- [ ] Document emergency procedures
- [ ] Keep private keys secure

## 📊 Monitoring

View metrics:
```bash
# Real-time metrics in logs
tail -f logs/bot.log

# Summary every 5 minutes
# Automatically printed by bot
```

Expected output:
```
╔════════════════════════════════════════════════════════════════╗
║               ARBITRAGE BOT METRICS SUMMARY                    ║
╠════════════════════════════════════════════════════════════════╣
║ OPPORTUNITIES                                                  ║
║   Detected:                   250                              ║
║   Executed:                    42                              ║
║   Successful:                  38                              ║
║   Failed:                       4                              ║
║                                                                ║
║ PROFITABILITY                                                  ║
║   Total Profit:      $1,234.56                                 ║
║   Total Gas Cost:      $12.34                                  ║
║   Net Profit:        $1,222.22                                 ║
╚════════════════════════════════════════════════════════════════╝
```

## 🆘 Troubleshooting

**Bot can't connect:**
```bash
# Check RPC endpoint
curl https://soroban-testnet.stellar.org

# Verify credentials
soroban keys show <YOUR_KEY>
```

**No opportunities found:**
- DEX pools may have similar prices
- Increase scan interval
- Check token pair configuration
- Lower minimum profit threshold

**Executions failing:**
- Check account has sufficient XLM
- Verify contract is initialized
- Review slippage settings
- Check pool liquidity

## 🤝 Support

- Documentation: `/docs`
- GitHub Issues: [Create an issue]
- Discord: [Stellar Discord](https://discord.gg/stellar)

## ⚠️ Disclaimer

This software is for educational purposes. Flash loan arbitrage involves significant financial risk. Always:

- Test on testnet first
- Start with small amounts
- Monitor continuously
- Use safety features
- Understand the risks

**Use at your own risk. No guarantees of profit.**

## 📝 License

MIT License - See LICENSE file for details

---

**Happy Arbitraging! 🚀💰**

For detailed documentation, see the `docs/` directory.
