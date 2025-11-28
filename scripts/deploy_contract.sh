#!/bin/bash

# Flash Loan Executor Contract Build and Deploy Script
# This script compiles and deploys the Rust smart contract to Stellar Soroban

set -e

echo "=========================================="
echo "Flash Loan Executor - Build & Deploy"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTRACT_DIR="contracts/flash_loan_executor"
NETWORK="${NETWORK:-testnet}"
SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
NETWORK_PASSPHRASE="${NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo -e "${RED}Error: stellar CLI not found. Install it first:${NC}"
    echo "cargo install --locked stellar-cli --features opt"
    exit 1
fi

# Step 1: Build the contract
echo -e "\n${YELLOW}Step 1: Building contract...${NC}"
cd "$CONTRACT_DIR"
stellar contract build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Contract built successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 2: Optimize the WASM (optional but recommended)
echo -e "\n${YELLOW}Step 2: Optimizing WASM...${NC}"
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/flash_loan_executor.wasm

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ WASM optimized${NC}"
else
    echo -e "${YELLOW}⚠ Optimization failed, continuing with unoptimized WASM${NC}"
fi

# Step 3: Deploy to network
echo -e "\n${YELLOW}Step 3: Deploying to ${NETWORK}...${NC}"

# Check if deployer identity exists
if ! stellar keys show deployer &> /dev/null; then
    echo -e "${YELLOW}Deployer identity not found. Creating new identity...${NC}"
    stellar keys generate deployer --network $NETWORK
fi

# Deploy contract
CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/flash_loan_executor.wasm \
    --source deployer \
    --network $NETWORK \
    2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Contract deployed successfully!${NC}"
    echo -e "${GREEN}Contract ID: ${CONTRACT_ID}${NC}"
    
    # Save contract ID to file
    echo "$CONTRACT_ID" > ../../.contract_id
    echo -e "${GREEN}Contract ID saved to .contract_id${NC}"
    
    # Step 4: Initialize contract
    echo -e "\n${YELLOW}Step 4: Initializing contract...${NC}"
    
    OWNER_ADDRESS=$(stellar keys address deployer)
    
    stellar contract invoke \
        --id "$CONTRACT_ID" \
        --source deployer \
        --network $NETWORK \
        -- initialize \
        --owner "$OWNER_ADDRESS"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Contract initialized successfully!${NC}"
    else
        echo -e "${RED}✗ Initialization failed${NC}"
        exit 1
    fi
    
    # Print deployment summary
    echo -e "\n${GREEN}=========================================="
    echo "Deployment Summary"
    echo "==========================================${NC}"
    echo "Network: $NETWORK"
    echo "Contract ID: $CONTRACT_ID"
    echo "Owner: $OWNER_ADDRESS"
    echo "RPC URL: $SOROBAN_RPC_URL"
    echo -e "${GREEN}==========================================${NC}"
    
    # Update config files
    echo -e "\n${YELLOW}Updating configuration files...${NC}"
    
    # Update bot config
    if [ -f "../../config/config.ts" ]; then
        sed -i.bak "s/flashLoanExecutor: process.env.FLASH_LOAN_EXECUTOR_CONTRACT || '.*'/flashLoanExecutor: process.env.FLASH_LOAN_EXECUTOR_CONTRACT || '$CONTRACT_ID'/" ../../config/config.ts
        echo -e "${GREEN}✓ Bot config updated${NC}"
    fi
    
    # Update frontend .env
    if [ -f "../../frontend/.env" ]; then
        sed -i.bak "s/NEXT_PUBLIC_FLASH_LOAN_EXECUTOR_CONTRACT=.*/NEXT_PUBLIC_FLASH_LOAN_EXECUTOR_CONTRACT=$CONTRACT_ID/" ../../frontend/.env
        echo -e "${GREEN}✓ Frontend .env updated${NC}"
    fi
    
    echo -e "\n${GREEN}✓ Deployment complete!${NC}"
    echo -e "${YELLOW}Don't forget to update your .env files with the contract ID${NC}"
    
else
    echo -e "${RED}✗ Deployment failed${NC}"
    echo "$CONTRACT_ID"
    exit 1
fi
