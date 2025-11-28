# Flash Loan Arbitrage Bot - README

[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue)](https://stellar.org)
[![Rust](https://img.shields.io/badge/Rust-Smart%20Contracts-orange)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Bot-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-black)](https://nextjs.org/)

Advanced flash loan arbitrage bot for the Stellar Soroban ecosystem. Automatically detects and executes profitable arbitrage opportunities across multiple DEXs including Soroswap, Phoenix, and Stellar DEX.

## 🌟 Features

### Smart Contract (Rust/Soroban)
- ⚡ **Atomic Flash Loans**: Borrow, trade, and repay in a single transaction
- 🔒 **Security**: Reentrancy guards, ownership controls, emergency pause
- 🔄 **Multi-DEX Support**: Soroswap, Phoenix, Stellar DEX
- 📊 **Event Logging**: Complete transaction history and debugging
- 🎯 **Profit Verification**: Ensures profitability before execution

### Bot (TypeScript/Node.js)
- 🤖 **Automated Scanner**: Real-time opportunity detection
- 🧠 **AI-Powered**: ML-based opportunity ranking and risk assessment
- 📈 **Route Optimization**: Finds best execution paths
- 💰 **Profit Tracking**: Detailed metrics and analytics
- 🔔 **Monitoring**: Winston logging with multiple outputs

### Frontend (Next.js/React/Tailwind)
- 📊 **Real-time Dashboard**: Live opportunities and bot status
- 📈 **Profit Charts**: Visual profit tracking with Recharts
- 🎨 **Modern UI**: Beautiful gradient design with Tailwind CSS
- ⚡ **Performance**: Optimized with Next.js 14
- 📱 **Responsive**: Works on all devices

## 🚀 Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Install Node.js v18+
# Download from https://nodejs.org/
```

### 1. Deploy Smart Contract

```bash
# Make deploy script executable
chmod +x scripts/deploy_contract.sh

# Deploy to testnet
./scripts/deploy_contract.sh
```

This will:
- Build the Rust contract
- Optimize the WASM
- Deploy to Stellar testnet
- Initialize the contract
- Save the contract ID

### 2. Setup Bot

```bash
cd bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Add your settings

# Build and run
npm run build
npm start
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
nano .env.local  # Add your settings

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the dashboard!

## 📁 Project Structure

```
flashloan/
├── contracts/              # Rust smart contracts
│   └── flash_loan_executor/
│       ├── src/
│       │   ├── lib.rs           # Main contract logic
│       │   ├── flash_loan.rs    # Flash loan mechanism
│       │   ├── arbitrage.rs     # Arbitrage execution
│       │   ├── dex_interface.rs # DEX integrations
│       │   ├── security.rs      # Security features
│       │   ├── errors.rs        # Error definitions
│       │   └── events.rs        # Event logging
│       └── Cargo.toml
│
├── bot/                    # TypeScript arbitrage bot
│   ├── src/
│   │   ├── index.ts             # Main bot orchestrator
│   │   ├── scanner/             # Opportunity scanner
│   │   ├── ai/                  # AI decision engine
│   │   ├── engine/              # Execution engine
│   │   └── utils/               # Utilities
│   ├── scripts/                 # Execution scripts
│   └── package.json
│
├── frontend/               # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx             # Main dashboard
│   │   ├── layout.tsx           # Root layout
│   │   └── api/                 # API routes
│   ├── components/              # React components
│   └── package.json
│
├── config/                 # Shared configuration
│   ├── config.ts                # Bot configuration
│   ├── tokens.ts                # Token definitions
│   └── dex_pools.ts             # DEX pool addresses
│
├── scripts/                # Deployment scripts
│   ├── deploy_contract.sh       # Deploy contract
│   ├── build_contract.sh        # Build only
│   └── test_contract.sh         # Test deployment
│
└── docs/                   # Documentation
    ├── COMPLETE_SETUP_GUIDE.md
    ├── DEPLOYMENT.md
    ├── FLASH_LOAN_MECHANISM.md
    └── TESTING.md
```

## 🔧 Configuration

### Contract Configuration

The contract is configured at initialization:
- Owner address (admin controls)
- Emergency pause capability
- Reentrancy protection

### Bot Configuration (`bot/.env`)

```env
# Network
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
IS_TESTNET=true

# Contracts
FLASH_LOAN_EXECUTOR_CONTRACT=CXXX...
SOROSWAP_ROUTER=CXXX...
PHOENIX_ROUTER=CXXX...

# Trading
MIN_PROFIT_BPS=50        # 0.5% minimum profit
MAX_SLIPPAGE_BPS=100     # 1% max slippage
MAX_TRADE_AMOUNT=10000   # Maximum per trade

# Execution
AUTO_EXECUTE=false       # Manual approval mode
DRY_RUN=true            # Simulation mode
```

### Frontend Configuration (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FLASH_LOAN_EXECUTOR_CONTRACT=CXXX...
```

## 🧪 Testing

### Test Contract

```bash
# Unit tests
cd contracts/flash_loan_executor
cargo test

# Integration tests
./scripts/test_contract.sh <CONTRACT_ID>
```

### Test Bot

```bash
cd bot

# Run scanner only
npm run scanner

# Simulate arbitrage
npm run simulate

# Full test suite
npm test
```

## 📊 How It Works

### 1. Opportunity Detection
The scanner continuously monitors DEX prices across:
- Soroswap pools
- Phoenix pools
- Stellar DEX offers

### 2. AI Analysis
Each opportunity is evaluated on:
- Profitability score
- Risk assessment
- Liquidity analysis
- Historical success rate

### 3. Route Optimization
The engine finds the optimal path:
```
Token A → DEX 1 → Token B → DEX 2 → Token A (+ Profit)
```

### 4. Atomic Execution
All steps happen in one transaction:
1. Flash loan borrowed
2. Swap on DEX A
3. Swap on DEX B
4. Flash loan repaid + fee
5. Profit secured

If any step fails, the entire transaction reverts!

## 🔒 Security Features

- **Reentrancy Guard**: Prevents reentrancy attacks
- **Owner Controls**: Administrative functions protected
- **Emergency Pause**: Can halt contract in emergency
- **Slippage Protection**: Prevents sandwich attacks
- **Profit Verification**: Only profitable trades execute
- **Atomic Transactions**: All-or-nothing execution

## 📈 Performance

Typical bot performance on testnet:
- Scan frequency: Every 5-10 seconds
- Opportunity detection: 2-5 per minute
- Execution time: <5 seconds
- Success rate: 85%+ (with proper configuration)

## 🚧 Roadmap

- [ ] Support for more DEXs (Aquarius, etc.)
- [ ] Multi-hop arbitrage routes
- [ ] Gas optimization
- [ ] Mobile app
- [ ] Telegram notifications
- [ ] Advanced analytics dashboard
- [ ] Backtesting framework

## 📚 Documentation

- [Complete Setup Guide](docs/COMPLETE_SETUP_GUIDE.md)
- [Flash Loan Mechanism](docs/FLASH_LOAN_MECHANISM.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Testing Guide](docs/TESTING.md)

## ⚠️ Disclaimer

This software is for educational purposes. Flash loan arbitrage involves financial risks:

- Smart contract risks
- Market volatility risks
- Slippage and MEV risks
- Technical failure risks

**Always test thoroughly on testnet before using real funds!**

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://stellar.org)
- [Soroban Team](https://soroban.stellar.org)
- [Soroswap](https://soroswap.finance)
- [Phoenix Protocol](https://phoenix-hub.io)

## 📞 Support

- GitHub Issues: Report bugs and request features
- Documentation: Check the `/docs` folder
- Stellar Discord: Join the community

---

**Built with ❤️ for the Stellar ecosystem**

⭐ Star this repo if you find it useful!
