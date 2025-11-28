use soroban_sdk::contracterror;

/// Custom error codes for the Flash Loan Executor contract
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Contract is already initialized
    AlreadyInitialized = 1,
    
    /// Caller is not the contract owner
    Unauthorized = 2,
    
    /// Reentrancy attempt detected
    ReentrancyGuard = 3,
    
    /// Flash loan amount is zero or invalid
    InvalidFlashLoanAmount = 4,
    
    /// Insufficient liquidity in the pool
    InsufficientLiquidity = 5,
    
    /// Slippage tolerance exceeded
    SlippageExceeded = 6,
    
    /// Arbitrage route is invalid or empty
    InvalidRoute = 7,
    
    /// Swap execution failed
    SwapFailed = 8,
    
    /// Flash loan repayment failed
    RepaymentFailed = 9,
    
    /// No profit generated from arbitrage
    NoProfitGenerated = 10,
    
    /// Profit is below minimum threshold
    ProfitBelowThreshold = 11,
    
    /// DEX pool address is invalid
    InvalidPoolAddress = 12,
    
    /// Token address is invalid
    InvalidTokenAddress = 13,
    
    /// Arithmetic overflow occurred
    ArithmeticOverflow = 14,
    
    /// Contract is paused
    ContractPaused = 15,
    
    /// Invalid withdraw amount
    InvalidWithdrawAmount = 16,
}
