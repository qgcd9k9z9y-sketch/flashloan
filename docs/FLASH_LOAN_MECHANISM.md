# Flash Loan Mechanism on Soroban

## Overview

Unlike Ethereum's native flash loan support, Stellar Soroban achieves flash loan functionality through **atomic multi-operation transactions**. This document explains how the mechanism works and how it differs from other platforms.

## How It Works

### 1. Atomic Transaction Model

Soroban guarantees that all operations within a single transaction either succeed completely or fail completely. There are no partial executions. This atomicity is the foundation of our flash loan implementation.

```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE TRANSACTION                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│  │  Borrow    │───▶│  Arbitrage │───▶│   Repay    │        │
│  │  Assets    │    │  Execution │    │  + Fee     │        │
│  └────────────┘    └────────────┘    └────────────┘        │
│                                                              │
│  If ANY step fails → ENTIRE transaction reverts             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Transaction Flow

#### Step 1: Request Flash Loan
```rust
pub fn request_flash_loan(
    env: &Env,
    pool_address: &Address,
    token: &Address,
    amount: i128,
) -> Result<FlashLoanContext, Error>
```

- Validates borrow amount > 0
- Checks pool has sufficient liquidity
- Calculates fee (0.09% = 9 basis points)
- Records debt that must be repaid
- Transfers tokens from pool to contract

#### Step 2: Execute Arbitrage
```rust
pub fn execute_arbitrage(
    env: &Env,
    route: &ArbitrageRoute,
    flash_loan_ctx: &FlashLoanContext,
) -> Result<ArbitrageResult, Error>
```

- **Swap 1**: Borrowed token → Intermediate token (DEX A)
- **Swap 2**: Intermediate token → Borrowed token (DEX B)
- Validates slippage on both swaps
- Calculates profit

#### Step 3: Repay Flash Loan
```rust
pub fn repay_flash_loan(
    env: &Env,
    context: &mut FlashLoanContext,
) -> Result<(), Error>
```

- Verifies contract has sufficient balance
- Transfers borrowed amount + fee back to pool
- Marks loan as repaid
- Emits repayment event

### 3. Key Differences from Ethereum

| Aspect | Ethereum (Aave/Uniswap) | Soroban |
|--------|-------------------------|---------|
| **Implementation** | Callback pattern | Invoke chain |
| **Flash Loan Function** | Dedicated `flashLoan()` | Atomic transaction |
| **Fee** | 0.09% typically | Configurable (0.09% default) |
| **Reversion** | `revert()` | Transaction failure |
| **Gas Model** | ETH gas | XLM + resource fees |
| **Atomicity** | Via callbacks | Native to platform |

### 4. Security Guarantees

#### Reentrancy Protection
```rust
pub struct ReentrancyGuard<'a> {
    env: &'a Env,
}

impl<'a> ReentrancyGuard<'a> {
    pub fn enter(env: &'a Env) -> Result<Self, Error> {
        if env.storage().instance().has(&REENTRANCY_KEY) {
            return Err(Error::ReentrancyGuard);
        }
        env.storage().instance().set(&REENTRANCY_KEY, &true);
        Ok(ReentrancyGuard { env })
    }
}
```

The guard automatically releases when it goes out of scope.

#### Slippage Check
```rust
pub fn check_slippage(
    expected_output: i128,
    actual_output: i128,
    max_slippage_bps: u32,
) -> Result<(), Error> {
    let min_output = expected_output
        .checked_mul((10000 - max_slippage_bps as i128))
        .checked_div(10000)?;
    
    if actual_output < min_output {
        return Err(Error::SlippageExceeded);
    }
    Ok(())
}
```

#### Profit Validation
```rust
pub fn check_minimum_profit(
    profit: i128,
    min_profit: i128,
) -> Result<(), Error> {
    if profit <= 0 {
        return Err(Error::NoProfitGenerated);
    }
    if (profit < min_profit {
        return Err(Error::ProfitBelowThreshold);
    }
    Ok(())
}
```

### 5. Fee Structure

**Flash Loan Fee**: 0.09% (9 basis points)
```
Fee = Borrowed Amount × 0.0009
```

**DEX Swap Fees**:
- Soroswap: 0.3% (30 basis points)
- Phoenix: 0.25% (25 basis points)

**Total Cost Example**:
```
Borrow: 100,000 USDC
Flash Loan Fee: 90 USDC (0.09%)
Swap 1 Fee: 300 USDC (0.3%)
Swap 2 Fee: 250 USDC (0.25%)
Total Fees: 640 USDC

Required Profit to Break Even: 0.64%
```

### 6. Failure Scenarios

All failures cause full transaction revert:

1. **Insufficient Liquidity**: Pool doesn't have requested amount
2. **Slippage Exceeded**: Actual output < minimum acceptable
3. **No Profit**: Final balance ≤ initial borrow amount
4. **Repayment Failed**: Contract can't repay loan + fee
5. **Timeout**: Transaction takes too long to execute

### 7. Gas/Resource Costs

Soroban uses a resource-based fee model:

- **CPU Instructions**: Computation cost
- **Memory**: Storage access cost
- **Ledger Entry**: State modification cost

Estimated costs:
- Simple arbitrage: ~0.01-0.05 XLM
- Complex multi-hop: ~0.05-0.1 XLM

### 8. Comparison with Other Platforms

#### Ethereum Flash Loans
- Pros: Mature ecosystem, high liquidity
- Cons: High gas fees ($50-200), MEV competition

#### Soroban Flash Loans
- Pros: Low fees (<$0.01), fast confirmation (~5s)
- Cons: Emerging ecosystem, lower liquidity

### 9. Best Practices

1. **Always Simulate First**: Use `simulate_arbitrage()` before executing
2. **Set Reasonable Slippage**: 1-2% for volatile pairs, 0.1-0.5% for stable pairs
3. **Monitor Gas Prices**: Adjust buffer during network congestion
4. **Implement Circuit Breaker**: Stop after N consecutive failures
5. **Track Pool Liquidity**: Don't trade more than 10% of pool size

### 10. Example Transaction

```rust
// 1. Initialize contract
initialize(env, owner);

// 2. Execute flash loan arbitrage
let result = execute_flash_loan_arbitrage(
    env,
    pool_address,        // Liquidity pool to borrow from
    token_xlm,           // Borrow XLM
    token_usdc,          // Swap to USDC
    1000000000,          // Borrow 100 XLM (7 decimals)
    0,                   // DEX A = Soroswap
    soroswap_pool,
    1,                   // DEX B = Phoenix
    phoenix_pool,
    50,                  // Min profit = 0.5%
    100,                 // Max slippage = 1%
);

// 3. Withdraw profit
withdraw_profit(env, owner, token_xlm, amount, recipient);
```

### 11. Monitoring & Debugging

#### Events Emitted
- `fl_start`: Flash loan initiated
- `swap_ok`: Successful swap
- `fl_repay`: Flash loan repaid
- `profit`: Profit calculated
- `arb_exec`: Arbitrage executed
- `arb_fail`: Arbitrage failed

#### Error Codes
See `errors.rs` for complete list of error codes and meanings.

## Conclusion

Soroban's atomic transaction model provides a clean and efficient way to implement flash loans without the callback complexity of Ethereum. The low fees and fast confirmation times make it ideal for arbitrage, though the ecosystem is still developing.
