#!/bin/bash

# Quick Start Script for Flash Loan Arbitrage Bot
# This script helps you get started quickly

set -e

echo "=========================================="
echo "Flash Loan Arbitrage Bot - Quick Start"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command_exists stellar; then
    echo -e "${RED}✗ Stellar CLI not found${NC}"
    echo "Install it with: cargo install --locked stellar-cli --features opt"
    exit 1
fi
echo -e "${GREEN}✓ Stellar CLI installed${NC}"

if ! command_exists node; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Install from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed${NC}"

if ! command_exists cargo; then
    echo -e "${RED}✗ Rust/Cargo not found${NC}"
    echo "Install from: https://rustup.rs/"
    exit 1
fi
echo -e "${GREEN}✓ Rust/Cargo installed${NC}"

# Menu
echo -e "\n${YELLOW}What would you like to do?${NC}"
echo "1) Deploy Smart Contract"
echo "2) Setup Bot"
echo "3) Setup Frontend"
echo "4) Full Setup (All of the above)"
echo "5) Exit"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}Deploying Smart Contract...${NC}"
        chmod +x scripts/deploy_contract.sh
        ./scripts/deploy_contract.sh
        ;;
    2)
        echo -e "\n${YELLOW}Setting up Bot...${NC}"
        cd bot
        
        if [ ! -f ".env" ]; then
            cp .env.example .env
            echo -e "${YELLOW}Created .env file. Please edit it with your settings.${NC}"
            echo -e "${YELLOW}Then run: cd bot && npm install && npm start${NC}"
        else
            echo -e "${GREEN}.env file already exists${NC}"
        fi
        
        echo -e "\n${YELLOW}Installing dependencies...${NC}"
        npm install
        
        echo -e "\n${GREEN}✓ Bot setup complete!${NC}"
        echo -e "Run 'npm start' to start the bot"
        ;;
    3)
        echo -e "\n${YELLOW}Setting up Frontend...${NC}"
        cd frontend
        
        if [ ! -f ".env.local" ]; then
            cp .env.example .env.local
            echo -e "${YELLOW}Created .env.local file. Please edit it with your settings.${NC}"
        else
            echo -e "${GREEN}.env.local file already exists${NC}"
        fi
        
        echo -e "\n${YELLOW}Installing dependencies...${NC}"
        npm install
        
        echo -e "\n${GREEN}✓ Frontend setup complete!${NC}"
        echo -e "Run 'npm run dev' to start the development server"
        ;;
    4)
        echo -e "\n${YELLOW}Full Setup Starting...${NC}"
        
        # Deploy contract
        echo -e "\n${YELLOW}Step 1/3: Deploying Smart Contract...${NC}"
        chmod +x scripts/deploy_contract.sh
        ./scripts/deploy_contract.sh
        
        # Setup bot
        echo -e "\n${YELLOW}Step 2/3: Setting up Bot...${NC}"
        cd bot
        if [ ! -f ".env" ]; then
            cp .env.example .env
        fi
        npm install
        cd ..
        
        # Setup frontend
        echo -e "\n${YELLOW}Step 3/3: Setting up Frontend...${NC}"
        cd frontend
        if [ ! -f ".env.local" ]; then
            cp .env.example .env.local
        fi
        npm install
        cd ..
        
        echo -e "\n${GREEN}=========================================="
        echo "✓ Full Setup Complete!"
        echo "==========================================${NC}"
        echo -e "\n${YELLOW}Next steps:${NC}"
        echo "1. Edit bot/.env with your contract ID and keys"
        echo "2. Edit frontend/.env.local with your contract ID"
        echo "3. Start bot: cd bot && npm start"
        echo "4. Start frontend: cd frontend && npm run dev"
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}Done!${NC}"
