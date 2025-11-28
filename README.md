# Flash-Loan Arbitrage Bot for Stellar Soroban

A production-ready flash-loan arbitrage system built on the Stellar Soroban ecosystem. This bot detects and executes arbitrage opportunities across multiple DEXs (Soroswap, Phoenix, Stellar Orderbook) using atomic transactions.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLASH-LOAN ARBITRAGE SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐     ┌──────────────────────┐                     │
│  │   Arbitrage Scanner  │────▶│   AI Decision Engine │                     │
│  │   (Price Monitor)    │     │   (Risk Scoring)     │                     │
│  └──────────┬───────────┘     └──────────┬───────────┘                     │
│             │                            │                                  │
│             ▼                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │              Flash Loan Engine (Off-Chain)            │                  │
│  │  • Build Soroban Transaction                          │                  │
│  │  • Route Optimization                                 │                  │
│  │  • Gas Estimation                                     │                  │
│  └──────────────────────────┬───────────────────────────┘                  │
│                             │                                               │
│                             ▼                                               │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │         FlashLoanExecutor Contract (On-Chain)         │                  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │                  │
│  │  │ Borrow  │─▶│ Swap #1 │─▶│ Swap #2 │─▶│ Repay   │  │                  │
│  │  │ Assets  │  │ (DEX A) │  │ (DEX B) │  │ + Profit│  │                  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │                  │
│  └──────────────────────────────────────────────────────┘                  │
│                             │                                               │
│            ┌────────────────┼────────────────┐                             │
│            ▼                ▼                ▼                             │
│     ┌──────────┐     ┌──────────┐     ┌──────────────┐                     │
│     │ Soroswap │     │ Phoenix  │     │ Stellar DEX  │                     │
│     │   Pool   │     │   Pool   │     │  Orderbook   │                     │
│     └──────────┘     └──────────┘     └──────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
flashloan/
├── contracts/                    # Soroban Smart Contracts
│   └── flash_loan_executor/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs           # Main contract entry
│           ├── flash_loan.rs    # Flash loan logic
│           ├── arbitrage.rs     # Arbitrage execution
│           ├── dex_interface.rs # DEX integration traits
│           ├── security.rs      # Security guards
│           ├── events.rs        # Event emissions
│           └── errors.rs        # Custom errors
│
├── bot/                          # Off-Chain Bot (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── scanner/             # Price monitoring
│       │   ├── index.ts
│       │   ├── soroswap.ts
│       │   ├── phoenix.ts
│       │   └── stellar_dex.ts
│       ├── engine/              # Flash loan execution
│       │   ├── index.ts
│       │   ├── transaction_builder.ts
│       │   └── route_optimizer.ts
│       ├── ai/                  # Decision engine
│       │   ├── index.ts
│       │   ├── risk_scorer.ts
│       │   └── opportunity_ranker.ts
│       ├── utils/               # Utilities
│       │   ├── logger.ts
│       │   ├── metrics.ts
│       │   └── stellar_client.ts
│       └── index.ts             # Main entry
│
├── scripts/                      # Execution scripts
│   ├── runScanner.ts
│   ├── executeFlashLoan.ts
│   └── simulateArb.ts
│
├── config/                       # Configuration
│   ├── config.ts
│   ├── tokens.ts
│   └── dex_pools.ts
│
├── tests/                        # Test suites
│   ├── contract_tests.rs
│   └── bot_tests.ts
│
└── docs/                         # Documentation
    ├── FLASH_LOAN_MECHANISM.md
    ├── DEPLOYMENT.md
    └── TESTING.md
```

## 🔥 How Flash Loans Work on Soroban

Unlike Ethereum, Soroban doesn't have native flash loans. We simulate flash-loan behavior using **atomic multi-operation transactions**:

### Mechanism

1. **Atomic Transaction Bundle**: All operations are bundled into a single Soroban transaction
2. **Temporary Credit**: The contract "borrows" from a liquidity pool at the start
3. **Arbitrage Execution**: Swaps are executed across DEXs within the same transaction
4. **Repayment**: The borrowed amount + fee is returned before transaction completes
5. **Revert on Failure**: If any step fails, the entire transaction reverts (no partial execution)

### Key Difference from Ethereum

- **No callback pattern**: Soroban uses invoke chains instead
- **Atomicity**: Guaranteed by Soroban's transaction model
- **Gas Model**: Different fee structure (resource units vs gas)

## 🚀 Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Soroban CLI
cargo install --locked soroban-cli

# Install Node.js dependencies
cd bot && npm install
```

### Build Contract

```bash
cd contracts/flash_loan_executor
soroban contract build
```

### Deploy Contract (Testnet)

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/flash_loan_executor.wasm \
  --network testnet \
  --source <YOUR_SECRET_KEY>
```

### Run Scanner

```bash
cd bot
npx ts-node scripts/runScanner.ts
```

### Execute Arbitrage

```bash
npx ts-node scripts/executeFlashLoan.ts --opportunity <OPP_ID>
```

## ⚙️ Configuration

Edit `config/config.ts`:

```typescript
export const config = {
  rpc: {
    soroban: "https://soroban-testnet.stellar.org",
    horizon: "https://horizon-testnet.stellar.org",
  },
  contracts: {
    flashLoanExecutor: "CXXXXX...",
  },
  thresholds: {
    minProfitBps: 50, // 0.5% minimum profit
    maxSlippageBps: 100, // 1% max slippage
  },
};
```

## 🔐 Security Features

- **Reentrancy Guard**: Prevents recursive calls during execution
- **Slippage Protection**: Reverts if output is below minimum expected
- **Profit Validation**: Ensures profit > 0 before completing transaction
- **Owner-Only Withdrawals**: Only contract owner can withdraw profits
- **Emergency Pause**: Circuit breaker for emergency situations

## 📊 Monitoring & Metrics

The bot tracks:
- Opportunities detected per hour
- Successful arbitrage count
- Total profit (by token)
- Failed transaction reasons
- Gas costs per execution

## ⚠️ Disclaimer

This software is for educational purposes. Flash loan arbitrage involves significant financial risk. Use at your own risk on mainnet.

## 📄 License

MIT License
