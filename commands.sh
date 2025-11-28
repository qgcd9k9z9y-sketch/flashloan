#!/bin/bash

# Flash-Loan Arbitrage Bot - Common Commands
# This script contains frequently used commands for development and deployment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}\n"
}

print_info() {
    echo -e "${YELLOW}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================
# SETUP COMMANDS
# ============================================

setup_rust() {
    print_header "Setting up Rust & Soroban"
    
    if ! command_exists rustc; then
        print_info "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
        source $HOME/.cargo/env
    fi
    
    print_info "Adding WASM target..."
    rustup target add wasm32-unknown-unknown
    
    print_info "Installing Soroban CLI..."
    cargo install --locked soroban-cli --version 20.0.0
    
    print_success "Rust & Soroban setup complete!"
}

setup_node() {
    print_header "Setting up Node.js dependencies"
    
    cd bot
    print_info "Installing npm packages..."
    npm install
    
    print_success "Node.js dependencies installed!"
    cd ..
}

setup_env() {
    print_header "Setting up environment"
    
    if [ ! -f .env ]; then
        print_info "Copying .env.example to .env..."
        cp .env.example .env
        print_success ".env file created!"
        print_info "Please edit .env with your configuration"
    else
        print_info ".env file already exists"
    fi
}

# ============================================
# BUILD COMMANDS
# ============================================

build_contract() {
    print_header "Building Soroban Contract"
    
    cd contracts/flash_loan_executor
    print_info "Building with cargo..."
    cargo build --target wasm32-unknown-unknown --release
    
    print_success "Contract built successfully!"
    print_info "WASM location: target/wasm32-unknown-unknown/release/flash_loan_executor.wasm"
    cd ../..
}

build_bot() {
    print_header "Building Bot"
    
    cd bot
    print_info "Compiling TypeScript..."
    npm run build
    
    print_success "Bot built successfully!"
    print_info "Output: dist/"
    cd ..
}

# ============================================
# DEPLOYMENT COMMANDS
# ============================================

deploy_testnet() {
    print_header "Deploying to Testnet"
    
    read -p "Enter your Soroban key name (default: bot): " KEY_NAME
    KEY_NAME=${KEY_NAME:-bot}
    
    print_info "Deploying contract..."
    CONTRACT_ID=$(soroban contract deploy \
        --wasm contracts/flash_loan_executor/target/wasm32-unknown-unknown/release/flash_loan_executor.wasm \
        --source $KEY_NAME \
        --network testnet)
    
    print_success "Contract deployed!"
    echo -e "Contract ID: ${GREEN}${CONTRACT_ID}${NC}"
    echo ""
    echo "Add this to your .env file:"
    echo "FLASH_LOAN_EXECUTOR_CONTRACT=$CONTRACT_ID"
    
    read -p "Initialize contract now? (y/n): " INIT
    if [ "$INIT" == "y" ]; then
        OWNER=$(soroban keys address $KEY_NAME)
        print_info "Initializing contract with owner: $OWNER"
        soroban contract invoke \
            --id $CONTRACT_ID \
            --source $KEY_NAME \
            --network testnet \
            -- \
            initialize \
            --owner $OWNER
        print_success "Contract initialized!"
    fi
}

# ============================================
# RUN COMMANDS
# ============================================

run_scanner() {
    print_header "Running Scanner (Monitor Mode)"
    cd bot
    npm run scanner
    cd ..
}

run_simulator() {
    print_header "Running Simulator (Dry Run)"
    cd bot
    npm run simulate
    cd ..
}

run_bot() {
    print_header "Running Full Bot"
    cd bot
    npm start
    cd ..
}

# ============================================
# TEST COMMANDS
# ============================================

test_contract() {
    print_header "Testing Contract"
    cd contracts/flash_loan_executor
    cargo test -- --nocapture
    cd ../..
}

test_bot() {
    print_header "Testing Bot"
    cd bot
    npm test
    cd ..
}

test_all() {
    test_contract
    test_bot
}

# ============================================
# UTILITY COMMANDS
# ============================================

check_balance() {
    print_header "Checking Account Balance"
    
    read -p "Enter key name (default: bot): " KEY_NAME
    KEY_NAME=${KEY_NAME:-bot}
    
    ADDRESS=$(soroban keys address $KEY_NAME)
    print_info "Address: $ADDRESS"
    
    print_info "Fetching balance..."
    curl -s "https://horizon-testnet.stellar.org/accounts/$ADDRESS" | \
        jq '.balances[] | select(.asset_type=="native") | .balance'
}

view_logs() {
    print_header "Viewing Bot Logs"
    
    if [ -f bot/logs/bot.log ]; then
        tail -f bot/logs/bot.log
    else
        print_error "Log file not found. Run the bot first."
    fi
}

clean() {
    print_header "Cleaning Build Artifacts"
    
    print_info "Cleaning contract build..."
    cd contracts/flash_loan_executor
    cargo clean
    cd ../..
    
    print_info "Cleaning bot build..."
    cd bot
    rm -rf dist/
    cd ..
    
    print_success "Clean complete!"
}

# ============================================
# MENU
# ============================================

show_menu() {
    clear
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║     Flash-Loan Arbitrage Bot - Command Center         ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo "SETUP:"
    echo "  1) Setup Rust & Soroban"
    echo "  2) Setup Node.js dependencies"
    echo "  3) Setup environment (.env)"
    echo ""
    echo "BUILD:"
    echo "  4) Build contract"
    echo "  5) Build bot"
    echo "  6) Build all"
    echo ""
    echo "DEPLOY:"
    echo "  7) Deploy to testnet"
    echo ""
    echo "RUN:"
    echo "  8) Run scanner (monitor mode)"
    echo "  9) Run simulator (dry run)"
    echo " 10) Run full bot"
    echo ""
    echo "TEST:"
    echo " 11) Test contract"
    echo " 12) Test bot"
    echo " 13) Test all"
    echo ""
    echo "UTILITIES:"
    echo " 14) Check account balance"
    echo " 15) View logs"
    echo " 16) Clean build artifacts"
    echo ""
    echo "  0) Exit"
    echo ""
    read -p "Enter choice: " choice
    
    case $choice in
        1) setup_rust ;;
        2) setup_node ;;
        3) setup_env ;;
        4) build_contract ;;
        5) build_bot ;;
        6) build_contract && build_bot ;;
        7) deploy_testnet ;;
        8) run_scanner ;;
        9) run_simulator ;;
        10) run_bot ;;
        11) test_contract ;;
        12) test_bot ;;
        13) test_all ;;
        14) check_balance ;;
        15) view_logs ;;
        16) clean ;;
        0) exit 0 ;;
        *) print_error "Invalid choice" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# ============================================
# MAIN
# ============================================

# If no arguments, show menu
if [ $# -eq 0 ]; then
    show_menu
else
    # Run specific command
    case $1 in
        setup-rust) setup_rust ;;
        setup-node) setup_node ;;
        setup-env) setup_env ;;
        build-contract) build_contract ;;
        build-bot) build_bot ;;
        deploy-testnet) deploy_testnet ;;
        run-scanner) run_scanner ;;
        run-simulator) run_simulator ;;
        run-bot) run_bot ;;
        test-contract) test_contract ;;
        test-bot) test_bot ;;
        test-all) test_all ;;
        check-balance) check_balance ;;
        view-logs) view_logs ;;
        clean) clean ;;
        *)
            echo "Unknown command: $1"
            echo ""
            echo "Available commands:"
            echo "  setup-rust, setup-node, setup-env"
            echo "  build-contract, build-bot"
            echo "  deploy-testnet"
            echo "  run-scanner, run-simulator, run-bot"
            echo "  test-contract, test-bot, test-all"
            echo "  check-balance, view-logs, clean"
            exit 1
            ;;
    esac
fi
