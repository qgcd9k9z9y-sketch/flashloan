#!/bin/bash

# Test the deployed contract
# This script runs basic tests against a deployed contract

set -e

if [ -z "$1" ]; then
    if [ -f ".contract_id" ]; then
        CONTRACT_ID=$(cat .contract_id)
    else
        echo "Error: Contract ID not provided and .contract_id file not found"
        echo "Usage: ./test_contract.sh <CONTRACT_ID>"
        exit 1
    fi
else
    CONTRACT_ID="$1"
fi

NETWORK="${NETWORK:-testnet}"

echo "Testing contract: $CONTRACT_ID"
echo "Network: $NETWORK"

# Test 1: Check if contract exists
echo -e "\nTest 1: Checking contract existence..."
stellar contract fetch --id "$CONTRACT_ID" --network $NETWORK > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Contract exists"
else
    echo "✗ Contract not found"
    exit 1
fi

# Test 2: Try to invoke a read-only function (if available)
# Add more tests as needed

echo -e "\n✓ All tests passed!"
