use soroban_sdk::{Address, Env, Symbol, Vec, symbol_short};

/// Event emitted when a flash loan is initiated
pub fn emit_flash_loan_started(
    env: &Env,
    token: Address,
    amount: i128,
    borrower: Address,
) {
    let topics = (symbol_short!("fl_start"), token, borrower);
    env.events().publish(topics, amount);
}

/// Event emitted when arbitrage is executed
pub fn emit_arbitrage_executed(
    env: &Env,
    route_id: u32,
    dex_a: Address,
    dex_b: Address,
    profit: i128,
) {
    let topics = (symbol_short!("arb_exec"), route_id);
    let data = (dex_a, dex_b, profit);
    env.events().publish(topics, data);
}

/// Event emitted when a swap is completed
pub fn emit_swap_completed(
    env: &Env,
    dex: Address,
    token_in: Address,
    token_out: Address,
    amount_in: i128,
    amount_out: i128,
) {
    let topics = (symbol_short!("swap_ok"), dex);
    let data = (token_in, token_out, amount_in, amount_out);
    env.events().publish(topics, data);
}

/// Event emitted when flash loan is repaid
pub fn emit_flash_loan_repaid(
    env: &Env,
    token: Address,
    amount: i128,
    fee: i128,
) {
    let topics = (symbol_short!("fl_repay"), token);
    let data = (amount, fee);
    env.events().publish(topics, data);
}

/// Event emitted when profit is calculated
pub fn emit_profit_calculated(
    env: &Env,
    token: Address,
    gross_profit: i128,
    net_profit: i128,
    fees_paid: i128,
) {
    let topics = (symbol_short!("profit"), token);
    let data = (gross_profit, net_profit, fees_paid);
    env.events().publish(topics, data);
}

/// Event emitted when owner withdraws profit
pub fn emit_profit_withdrawn(
    env: &Env,
    owner: Address,
    token: Address,
    amount: i128,
) {
    let topics = (symbol_short!("withdraw"), owner, token);
    env.events().publish(topics, amount);
}

/// Event emitted when arbitrage fails
pub fn emit_arbitrage_failed(
    env: &Env,
    route_id: u32,
    reason: Symbol,
) {
    let topics = (symbol_short!("arb_fail"), route_id);
    env.events().publish(topics, reason);
}

/// Event emitted when contract is paused/unpaused
pub fn emit_pause_status_changed(
    env: &Env,
    is_paused: bool,
) {
    let topics = (symbol_short!("pause"),);
    env.events().publish(topics, is_paused);
}
