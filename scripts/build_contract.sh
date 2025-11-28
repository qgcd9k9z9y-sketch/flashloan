#!/bin/bash

# Contract Build Only Script
# Use this to just compile the contract without deploying

set -e

echo "Building Flash Loan Executor Contract..."

cd contracts/flash_loan_executor

# Build the contract
stellar contract build

if [ $? -eq 0 ]; then
    echo "✓ Contract built successfully!"
    echo "WASM location: target/wasm32-unknown-unknown/release/flash_loan_executor.wasm"
else
    echo "✗ Build failed"
    exit 1
fi

# Optimize
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/flash_loan_executor.wasm

if [ $? -eq 0 ]; then
    echo "✓ WASM optimized successfully!"
else
    echo "⚠ Optimization failed"
fi
