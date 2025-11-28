use soroban_sdk::{Env, Address};
use crate::errors::Error;

const REENTRANCY_KEY: &str = "reentrancy_guard";
const OWNER_KEY: &str = "owner";
const PAUSED_KEY: &str = "paused";

/// Reentrancy guard implementation
pub struct ReentrancyGuard<'a> {
    env: &'a Env,
}

impl<'a> ReentrancyGuard<'a> {
    /// Enter the guarded section
    pub fn enter(env: &'a Env) -> Result<Self, Error> {
        let key = REENTRANCY_KEY;
        
        // Check if already entered
        if env.storage().instance().has(&key) {
            return Err(Error::ReentrancyGuard);
        }
        
        // Set guard
        env.storage().instance().set(&key, &true);
        
        Ok(ReentrancyGuard { env })
    }
}

impl<'a> Drop for ReentrancyGuard<'a> {
    /// Automatically release the guard when it goes out of scope
    fn drop(&mut self) {
        let key = REENTRANCY_KEY;
        self.env.storage().instance().remove(&key);
    }
}

/// Check if the caller is the contract owner
pub fn require_owner(env: &Env, caller: &Address) -> Result<(), Error> {
    let owner: Address = env.storage().instance().get(&OWNER_KEY)
        .unwrap_or_else(|| panic!("Contract not initialized"));
    
    if caller != &owner {
        return Err(Error::Unauthorized);
    }
    
    Ok(())
}

/// Set the contract owner (only during initialization)
pub fn set_owner(env: &Env, owner: &Address) {
    env.storage().instance().set(&OWNER_KEY, owner);
}

/// Get the contract owner
pub fn get_owner(env: &Env) -> Address {
    env.storage().instance().get(&OWNER_KEY)
        .unwrap_or_else(|| panic!("Contract not initialized"))
}

/// Check if the contract is paused
pub fn require_not_paused(env: &Env) -> Result<(), Error> {
    let is_paused: bool = env.storage().instance().get(&PAUSED_KEY).unwrap_or(false);
    
    if is_paused {
        return Err(Error::ContractPaused);
    }
    
    Ok(())
}

/// Pause the contract (owner only)
pub fn pause(env: &Env) {
    env.storage().instance().set(&PAUSED_KEY, &true);
}

/// Unpause the contract (owner only)
pub fn unpause(env: &Env) {
    env.storage().instance().set(&PAUSED_KEY, &false);
}

/// Validate slippage tolerance
/// Returns true if actual_output meets minimum requirements
pub fn check_slippage(
    expected_output: i128,
    actual_output: i128,
    max_slippage_bps: u32, // basis points (1 bps = 0.01%)
) -> Result<(), Error> {
    // Calculate minimum acceptable output
    // min_output = expected * (10000 - slippage_bps) / 10000
    let min_output = expected_output
        .checked_mul((10000 - max_slippage_bps as i128))
        .ok_or(Error::ArithmeticOverflow)?
        .checked_div(10000)
        .ok_or(Error::ArithmeticOverflow)?;
    
    if actual_output < min_output {
        return Err(Error::SlippageExceeded);
    }
    
    Ok(())
}

/// Validate that profit meets minimum threshold
pub fn check_minimum_profit(
    profit: i128,
    min_profit: i128,
) -> Result<(), Error> {
    if profit <= 0 {
        return Err(Error::NoProfitGenerated);
    }
    
    if profit < min_profit {
        return Err(Error::ProfitBelowThreshold);
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slippage_check() {
        // Expected 1000, actual 990, max slippage 1% (100 bps)
        // Min acceptable: 1000 * 9900 / 10000 = 990
        assert!(check_slippage(1000, 990, 100).is_ok());
        
        // Actual 989 should fail
        assert!(check_slippage(1000, 989, 100).is_err());
    }

    #[test]
    fn test_minimum_profit() {
        assert!(check_minimum_profit(100, 50).is_ok());
        assert!(check_minimum_profit(50, 100).is_err());
        assert!(check_minimum_profit(0, 50).is_err());
        assert!(check_minimum_profit(-10, 50).is_err());
    }
}
