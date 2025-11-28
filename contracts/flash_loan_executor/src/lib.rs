#![no_std]

//! Flash Loan Arbitrage Executor Contract
//! 
//! This contract enables atomic flash loan arbitrage across multiple DEXs
//! on the Stellar Soroban ecosystem. It supports Soroswap, Phoenix, and
//! potentially other DEX protocols.
//! 
//! ## How it works:
//! 1. Contract borrows tokens via flash loan (atomic transaction)
//! 2. Executes swaps on DEX A (e.g., Soroswap)
//! 3. Executes reverse swap on DEX B (e.g., Phoenix)
//! 4. Repays flash loan + fee
//! 5. Keeps the profit
//! 
//! If any step fails, the entire transaction reverts.

mod errors;
mod events;
mod security;
mod dex_interface;
mod flash_loan;
mod arbitrage;

use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, symbol_short};
use errors::Error;
use security::{ReentrancyGuard, require_owner, require_not_paused, set_owner};
use flash_loan::{FlashLoanManager, FlashLoanContext};
use arbitrage::{ArbitrageExecutor, ArbitrageRoute, DexConfig};
use dex_interface::DexType;

const IS_INITIALIZED: &str = "initialized";
const PROFIT_STORAGE: &str = "profit";

#[contract]
pub struct FlashLoanExecutorContract;

#[contractimpl]
impl FlashLoanExecutorContract {
    /// Initialize the contract
    /// 
    /// # Arguments
    /// * `owner` - The address that will own the contract
    pub fn initialize(env: Env, owner: Address) -> Result<(), Error> {
        // Check if already initialized
        if env.storage().instance().has(&IS_INITIALIZED) {
            return Err(Error::AlreadyInitialized);
        }
        
        // Set owner
        set_owner(&env, &owner);
        
        // Mark as initialized
        env.storage().instance().set(&IS_INITIALIZED, &true);
        
        Ok(())
    }
    
    /// Execute a complete flash loan arbitrage
    /// 
    /// # Arguments
    /// * `pool_address` - Address of the liquidity pool to borrow from
    /// * `token_borrow` - Token to borrow via flash loan
    /// * `token_intermediate` - Intermediate token for the swap route
    /// * `amount` - Amount to borrow
    /// * `dex_a_type` - Type of first DEX (0 = Soroswap, 1 = Phoenix)
    /// * `dex_a_pool` - Pool address on first DEX
    /// * `dex_b_type` - Type of second DEX
    /// * `dex_b_pool` - Pool address on second DEX
    /// * `min_profit_bps` - Minimum profit in basis points
    /// * `max_slippage_bps` - Maximum slippage in basis points
    pub fn execute_flash_loan_arbitrage(
        env: Env,
        pool_address: Address,
        token_borrow: Address,
        token_intermediate: Address,
        amount: i128,
        dex_a_type: u32,
        dex_a_pool: Address,
        dex_b_type: u32,
        dex_b_pool: Address,
        min_profit_bps: u32,
        max_slippage_bps: u32,
    ) -> Result<i128, Error> {
        // Security checks
        require_not_paused(&env)?;
        let _guard = ReentrancyGuard::enter(&env)?;
        
        // Convert DEX type integers to enum
        let dex_a_type_enum = Self::parse_dex_type(dex_a_type)?;
        let dex_b_type_enum = Self::parse_dex_type(dex_b_type)?;
        
        // === STEP 1: Request Flash Loan ===
        let mut flash_loan_ctx = FlashLoanManager::request_flash_loan(
            &env,
            &pool_address,
            &token_borrow,
            amount,
        )?;
        
        // === STEP 2: Execute Arbitrage ===
        let route = ArbitrageRoute {
            route_id: Self::generate_route_id(&env),
            dex_a: DexConfig {
                dex_type: dex_a_type_enum,
                pool_address: dex_a_pool,
            },
            dex_b: DexConfig {
                dex_type: dex_b_type_enum,
                pool_address: dex_b_pool,
            },
            token_borrow: token_borrow.clone(),
            token_intermediate,
            amount,
            min_profit_bps,
            max_slippage_bps,
        };
        
        let result = ArbitrageExecutor::execute_arbitrage(&env, &route, &flash_loan_ctx)?;
        
        // === STEP 3: Repay Flash Loan ===
        FlashLoanManager::repay_flash_loan(&env, &mut flash_loan_ctx)?;
        
        // === STEP 4: Store Profit ===
        Self::add_profit(&env, &token_borrow, result.net_profit);
        
        Ok(result.net_profit)
    }
    
    /// Simulate arbitrage without executing (dry run)
    /// 
    /// Returns the expected net profit
    pub fn simulate_arbitrage(
        env: Env,
        token_borrow: Address,
        token_intermediate: Address,
        amount: i128,
        dex_a_type: u32,
        dex_a_pool: Address,
        dex_b_type: u32,
        dex_b_pool: Address,
    ) -> Result<i128, Error> {
        let dex_a_type_enum = Self::parse_dex_type(dex_a_type)?;
        let dex_b_type_enum = Self::parse_dex_type(dex_b_type)?;
        
        let route = ArbitrageRoute {
            route_id: 0,
            dex_a: DexConfig {
                dex_type: dex_a_type_enum,
                pool_address: dex_a_pool,
            },
            dex_b: DexConfig {
                dex_type: dex_b_type_enum,
                pool_address: dex_b_pool,
            },
            token_borrow,
            token_intermediate,
            amount,
            min_profit_bps: 0,
            max_slippage_bps: 10000, // No slippage check in simulation
        };
        
        ArbitrageExecutor::simulate_arbitrage(&env, &route)
    }
    
    /// Withdraw accumulated profits (owner only)
    /// 
    /// # Arguments
    /// * `token` - Token to withdraw
    /// * `amount` - Amount to withdraw
    /// * `recipient` - Address to send profits to
    pub fn withdraw_profit(
        env: Env,
        caller: Address,
        token: Address,
        amount: i128,
        recipient: Address,
    ) -> Result<(), Error> {
        caller.require_auth();
        require_owner(&env, &caller)?;
        
        if amount <= 0 {
            return Err(Error::InvalidWithdrawAmount);
        }
        
        // Check available profit
        let available = Self::get_profit(&env, &token);
        if amount > available {
            return Err(Error::InvalidWithdrawAmount);
        }
        
        // TODO: Transfer tokens to recipient
        // let token_client = TokenClient::new(&env, &token);
        // token_client.transfer(&env.current_contract_address(), &recipient, &amount);
        
        // Update stored profit
        Self::subtract_profit(&env, &token, amount);
        
        // Emit event
        events::emit_profit_withdrawn(&env, caller, token, amount);
        
        Ok(())
    }
    
    /// Get accumulated profit for a token
    pub fn get_profit_balance(env: Env, token: Address) -> i128 {
        Self::get_profit(&env, &token)
    }
    
    /// Pause the contract (owner only, emergency use)
    pub fn pause(env: Env, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        require_owner(&env, &caller)?;
        
        security::pause(&env);
        events::emit_pause_status_changed(&env, true);
        
        Ok(())
    }
    
    /// Unpause the contract (owner only)
    pub fn unpause(env: Env, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        require_owner(&env, &caller)?;
        
        security::unpause(&env);
        events::emit_pause_status_changed(&env, false);
        
        Ok(())
    }
    
    // === Helper Functions ===
    
    fn parse_dex_type(type_id: u32) -> Result<DexType, Error> {
        match type_id {
            0 => Ok(DexType::Soroswap),
            1 => Ok(DexType::Phoenix),
            _ => Err(Error::InvalidRoute),
        }
    }
    
    fn generate_route_id(env: &Env) -> u32 {
        // Simple counter-based ID generation
        let key = Symbol::new(env, "route_counter");
        let current: u32 = env.storage().instance().get(&key).unwrap_or(0);
        let next = current + 1;
        env.storage().instance().set(&key, &next);
        next
    }
    
    fn get_profit(env: &Env, token: &Address) -> i128 {
        let key = (PROFIT_STORAGE, token);
        env.storage().persistent().get(&key).unwrap_or(0)
    }
    
    fn add_profit(env: &Env, token: &Address, amount: i128) {
        let key = (PROFIT_STORAGE, token);
        let current = Self::get_profit(env, token);
        let new_total = current + amount;
        env.storage().persistent().set(&key, &new_total);
    }
    
    fn subtract_profit(env: &Env, token: &Address, amount: i128) {
        let key = (PROFIT_STORAGE, token);
        let current = Self::get_profit(env, token);
        let new_total = current - amount;
        env.storage().persistent().set(&key, &new_total);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_initialization() {
        let env = Env::default();
        let contract_id = env.register_contract(None, FlashLoanExecutorContract);
        let client = FlashLoanExecutorContractClient::new(&env, &contract_id);
        
        let owner = Address::generate(&env);
        
        // Initialize
        let result = client.initialize(&owner);
        assert!(result.is_ok());
        
        // Try to initialize again (should fail)
        let result = client.initialize(&owner);
        assert!(result.is_err());
    }
}
