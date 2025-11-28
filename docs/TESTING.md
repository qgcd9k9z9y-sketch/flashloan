# Testing Guide

## Overview

This guide covers testing strategies for both the Soroban smart contract and the TypeScript bot.

## Smart Contract Tests

### Running Tests

```bash
cd contracts/flash_loan_executor

# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_flash_loan_fee_calculation

# Run with coverage
cargo tarpaulin --out Html
```

### Test Structure

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_initialization() {
        let env = Env::default();
        let contract_id = env.register_contract(None, FlashLoanExecutorContract);
        let client = FlashLoanExecutorContractClient::new(&env, &contract_id);
        
        let owner = Address::generate(&env);
        let result = client.initialize(&owner);
        assert!(result.is_ok());
    }
}
```

### Key Test Cases

#### 1. Initialization Tests
```rust
#[test]
fn test_initialization() {
    // Contract can be initialized
}

#[test]
fn test_double_initialization_fails() {
    // Cannot initialize twice
}

#[test]
fn test_owner_is_set_correctly() {
    // Owner is stored correctly
}
```

#### 2. Flash Loan Tests
```rust
#[test]
fn test_flash_loan_fee_calculation() {
    let fee = FlashLoanManager::calculate_flash_loan_fee(1_000_000).unwrap();
    assert_eq!(fee, 900); // 0.09% of 1M
}

#[test]
fn test_flash_loan_insufficient_liquidity() {
    // Should fail if pool lacks liquidity
}

#[test]
fn test_flash_loan_repayment() {
    // Should successfully repay loan + fee
}
```

#### 3. Arbitrage Tests
```rust
#[test]
fn test_arbitrage_profitable_route() {
    // Should execute profitable arbitrage
}

#[test]
fn test_arbitrage_unprofitable_reverts() {
    // Should revert if not profitable
}

#[test]
fn test_slippage_protection() {
    // Should revert if slippage exceeded
}
```

#### 4. Security Tests
```rust
#[test]
fn test_reentrancy_guard() {
    // Should prevent reentrancy
}

#[test]
fn test_unauthorized_withdrawal() {
    // Only owner can withdraw
}

#[test]
fn test_pause_functionality() {
    // Paused contract rejects transactions
}
```

### Mock DEX Contracts

Create mock DEX contracts for testing:

```rust
#[contract]
pub struct MockDex;

#[contractimpl]
impl MockDex {
    pub fn swap(
        env: Env,
        amount_in: i128,
        min_amount_out: i128,
    ) -> i128 {
        // Simple 1:1 swap for testing
        amount_in
    }
    
    pub fn get_reserves(env: Env) -> (i128, i128) {
        (1000000, 1000000)
    }
}
```

## Bot Tests

### Running Tests

```bash
cd bot

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test scanner.test.ts

# Watch mode
npm test -- --watch
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { ArbitrageScanner } from '../src/scanner';

describe('ArbitrageScanner', () => {
  let scanner: ArbitrageScanner;

  beforeEach(() => {
    scanner = new ArbitrageScanner();
  });

  it('should detect arbitrage opportunities', async () => {
    const opportunities = await scanner.performScan();
    expect(opportunities).toBeDefined();
  });
});
```

### Key Test Cases

#### 1. Scanner Tests
```typescript
describe('ArbitrageScanner', () => {
  it('should fetch pool prices');
  it('should detect price discrepancies');
  it('should calculate profitability');
  it('should filter by minimum profit');
  it('should expire old opportunities');
});
```

#### 2. AI Decision Engine Tests
```typescript
describe('AIDecisionEngine', () => {
  it('should score opportunities correctly');
  it('should reject high-risk opportunities');
  it('should rank by profitability');
  it('should respect success probability threshold');
});
```

#### 3. Execution Engine Tests
```typescript
describe('FlashLoanEngine', () => {
  it('should build transactions correctly');
  it('should validate before execution');
  it('should retry on failure');
  it('should respect concurrency limits');
});
```

#### 4. Integration Tests
```typescript
describe('End-to-End', () => {
  it('should scan, evaluate, and execute', async () => {
    // Mock opportunity
    const opp = createMockOpportunity();
    
    // Evaluate
    const score = aiDecisionEngine.evaluateOpportunity(opp);
    expect(score.shouldExecute).toBe(true);
    
    // Execute
    const result = await flashLoanEngine.executeArbitrage(opp);
    expect(result.success).toBe(true);
  });
});
```

### Mocking

#### Mock Stellar Client
```typescript
jest.mock('../src/utils/stellar_client', () => ({
  stellarClient: {
    invokeContract: jest.fn().mockResolvedValue(BigInt(1000)),
    getAccount: jest.fn().mockResolvedValue({}),
  },
}));
```

#### Mock Pool Prices
```typescript
function createMockPoolPrice(): PoolPrice {
  return {
    pool: { /* ... */ },
    tokenA: { /* ... */ },
    tokenB: { /* ... */ },
    priceAtoB: 1.0,
    priceBtoA: 1.0,
    reserveA: BigInt(1000000),
    reserveB: BigInt(1000000),
    liquidityUsd: 100000,
    timestamp: Date.now(),
  };
}
```

## Simulation Testing

### Test Against Live Testnet

```bash
# Set up testnet environment
cp .env.example .env.test
# Edit .env.test with testnet values

# Run simulation
npm run simulate

# Should output:
# ✓ Configuration validated
# 🧪 Scanning for opportunities...
# Found X opportunities
# Simulating each...
```

### Dry Run Mode

```typescript
// In config.ts
export const config = {
  execution: {
    autoExecute: false,  // Disable auto-execution
    dryRun: true,        // Enable dry run
  },
};
```

### Backtesting

Create a backtesting script:

```typescript
// scripts/backtest.ts
import { readFileSync } from 'fs';

async function backtest() {
  // Load historical price data
  const priceData = JSON.parse(readFileSync('data/historical_prices.json'));
  
  let totalProfit = 0;
  let successCount = 0;
  
  for (const snapshot of priceData) {
    // Simulate arbitrage detection
    const opportunities = detectOpportunities(snapshot);
    
    for (const opp of opportunities) {
      // Simulate execution
      const result = simulateExecution(opp);
      
      if (result.success) {
        totalProfit += result.profit;
        successCount++;
      }
    }
  }
  
  console.log(`Total Profit: $${totalProfit.toFixed(2)}`);
  console.log(`Success Rate: ${(successCount / priceData.length * 100).toFixed(1)}%`);
}

backtest();
```

## Load Testing

### Stress Test Scanner

```typescript
// test/load/scanner.load.test.ts
describe('Scanner Load Test', () => {
  it('should handle 100 concurrent scans', async () => {
    const promises = Array(100).fill(0).map(() => 
      scanner.performScan()
    );
    
    const results = await Promise.all(promises);
    expect(results.every(r => Array.isArray(r))).toBe(true);
  });
});
```

### Stress Test Execution

```typescript
describe('Execution Load Test', () => {
  it('should handle max concurrent executions', async () => {
    const opportunities = createMockOpportunities(10);
    
    const promises = opportunities.map(opp =>
      flashLoanEngine.executeArbitrage(opp)
    );
    
    const results = await Promise.allSettled(promises);
    
    // Should respect concurrency limit
    expect(
      results.filter(r => r.status === 'fulfilled').length
    ).toBeLessThanOrEqual(config.execution.maxConcurrentExecutions);
  });
});
```

## Performance Testing

### Measure Scan Performance

```typescript
describe('Performance', () => {
  it('should scan within 5 seconds', async () => {
    const start = Date.now();
    await scanner.performScan();
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });
});
```

### Measure Execution Speed

```typescript
it('should execute within 30 seconds', async () => {
  const opp = createMockOpportunity();
  
  const start = Date.now();
  const result = await flashLoanEngine.executeArbitrage(opp);
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(30000);
});
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cd contracts/flash_loan_executor && cargo test

  bot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd bot && npm install && npm test
```

## Test Coverage Goals

- **Smart Contract**: > 80% line coverage
- **Bot**: > 70% line coverage
- **Integration Tests**: All critical paths covered

### Generate Coverage Reports

```bash
# Contract coverage
cargo tarpaulin --out Html
open tarpaulin-report.html

# Bot coverage
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Debugging Tests

### Contract Debugging

```rust
#[test]
fn test_with_logging() {
    let env = Env::default();
    env.budget().reset_unlimited(); // Remove budget limits
    
    // Your test code
    println!("Debug info: {:?}", value);
}
```

### Bot Debugging

```typescript
// Set LOG_LEVEL=debug in .env.test
process.env.LOG_LEVEL = 'debug';

it('should debug opportunity detection', async () => {
  const opportunities = await scanner.performScan();
  console.log('Opportunities:', JSON.stringify(opportunities, null, 2));
});
```

## Best Practices

1. **Write Tests First**: TDD approach for critical logic
2. **Mock External Services**: Don't rely on live DEXs in unit tests
3. **Test Edge Cases**: Zero amounts, overflow, underflow
4. **Integrate Early**: Run integration tests frequently
5. **Automate**: Use CI/CD for automated testing
6. **Monitor Coverage**: Maintain high test coverage
7. **Document Tests**: Explain what each test validates
8. **Test Failure Paths**: Don't just test happy paths

## Common Issues

### Contract Tests Timeout

```rust
// Increase timeout in tests
#[test]
#[timeout(30000)] // 30 seconds
fn long_running_test() {
    // ...
}
```

### Mock Data Staleness

```typescript
// Refresh mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockPoolPrices = generateFreshMockPrices();
});
```

### Flaky Tests

```typescript
// Add retries for flaky network tests
it('should fetch pool prices', async () => {
  let attempts = 0;
  let result;
  
  while (attempts < 3) {
    try {
      result = await scanner.fetchPoolPrice(pool);
      break;
    } catch (e) {
      attempts++;
      if (attempts === 3) throw e;
      await sleep(1000);
    }
  }
  
  expect(result).toBeDefined();
});
```

## Next Steps

After testing:

1. Deploy to testnet
2. Run live simulations
3. Monitor for issues
4. Iterate and improve
5. Deploy to mainnet (with extreme caution)
