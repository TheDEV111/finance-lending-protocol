# DeFi Lending Protocol - Deployment Guide

This guide walks you through deploying the DeFi Lending Protocol to Stacks blockchain networks.

## 📋 Prerequisites

- Clarinet v3.11.0 or later installed
- Node.js v18+ and npm
- Stacks wallet with STX for deployment
- Network access (Devnet/Testnet/Mainnet)

## 🏗️ Contract Deployment Order

The contracts must be deployed in the following order due to dependencies:

1. **price-oracle.clar** (No dependencies)
2. **interest-calculator.clar** (No dependencies)
3. **lending-pool.clar** (Depends on: interest-calculator)
4. **collateral-manager.clar** (Depends on: lending-pool, price-oracle)

## 🧪 Local Devnet Deployment

### Step 1: Start Clarinet Console
```bash
cd defi-lending-protocol
clarinet console
```

### Step 2: Deploy Contracts in Console
```clarity
;; Deploy price-oracle
(contract-call? .price-oracle get-latest-price "STX")

;; Deploy interest-calculator  
(contract-call? .interest-calculator get-current-rate)

;; Deploy lending-pool - Deposit some collateral
(contract-call? .lending-pool deposit-collateral u10000000)

;; Deploy collateral-manager - Check health
(contract-call? .collateral-manager check-health-factor tx-sender)
```

### Step 3: Test Basic Operations
```clarity
;; 1. Deposit collateral
(contract-call? .lending-pool deposit-collateral u100000000) ;; 100 STX

;; 2. Check position
(contract-call? .lending-pool get-user-position tx-sender)

;; 3. Borrow funds
(contract-call? .lending-pool borrow-funds u50000000) ;; 50 STX

;; 4. Check health factor
(contract-call? .collateral-manager check-health-factor tx-sender)

;; 5. Repay loan
(contract-call? .lending-pool repay-loan u25000000) ;; 25 STX
```

## 🌐 Testnet Deployment

### Step 1: Configure Testnet Settings

Check your `settings/Testnet.toml`:

```toml
[network]
name = "testnet"

[accounts.deployer]
mnemonic = "your mnemonic phrase here"
stx_address = "ST..."
btc_address = "..."
```

### Step 2: Generate Deployment Plan
```bash
clarinet deployment generate --testnet
```

This creates `deployments/default.testnet-plan.yaml`

### Step 3: Review Deployment Plan

The generated plan will look like:

```yaml
---
id: 0
name: Testnet deployment
network: testnet
stacks-node: "https://stacks-node-api.testnet.stacks.co"
bitcoin-node: "http://bitcoind.testnet.stacks.co:18332"
plan:
  batches:
    - id: 0
      transactions:
        - contract-publish:
            contract-name: price-oracle
            expected-sender: ST...
            cost: 1500
            path: contracts/price-oracle.clar
            
        - contract-publish:
            contract-name: interest-calculator
            expected-sender: ST...
            cost: 1500
            path: contracts/interest-calculator.clar
            
    - id: 1
      transactions:
        - contract-publish:
            contract-name: lending-pool
            expected-sender: ST...
            cost: 2000
            path: contracts/lending-pool.clar
            
    - id: 2
      transactions:
        - contract-publish:
            contract-name: collateral-manager
            expected-sender: ST...
            cost: 1800
            path: contracts/collateral-manager.clar
```

### Step 4: Deploy to Testnet
```bash
clarinet deployment apply --testnet
```

### Step 5: Verify Deployment

Visit the Stacks Explorer (Testnet):
```
https://explorer.stacks.co/?chain=testnet
```

Search for your deployer address and verify all 4 contracts are deployed.

### Step 6: Initialize Protocol

After deployment, initialize the protocol:

```bash
# Using Clarinet console with testnet
clarinet console --testnet

# Or use stacks-cli
stx call ST...contract-address.price-oracle authorize-oracle ST...oracle-address
```

## 🚀 Mainnet Deployment

⚠️ **IMPORTANT**: Only deploy to mainnet after:
- Comprehensive security audit
- Extensive testnet testing  
- Community review
- Emergency pause mechanisms tested

### Step 1: Prepare Mainnet Configuration

Update `settings/Mainnet.toml`:

```toml
[network]
name = "mainnet"

[accounts.deployer]
mnemonic = "SECURE MNEMONIC - USE HARDWARE WALLET"
stx_address = "SP..."
```

### Step 2: Generate Mainnet Deployment Plan
```bash
clarinet deployment generate --mainnet
```

### Step 3: Cost Estimation

Estimate deployment costs:
- Each contract: ~0.15-0.30 STX
- Total for 4 contracts: ~0.6-1.2 STX
- Gas fees may vary with network congestion

### Step 4: Deploy to Mainnet
```bash
# Dry run first (recommended)
clarinet deployment apply --mainnet --dry-run

# Actual deployment
clarinet deployment apply --mainnet
```

### Step 5: Post-Deployment Configuration

After mainnet deployment, configure the protocol:

```clarity
;; 1. Authorize price oracle(s)
(contract-call? .price-oracle authorize-oracle 'SP...oracle-address)

;; 2. Set initial STX price (if needed)
(contract-call? .price-oracle update-price "STX" u1000000 "INIT")

;; 3. Verify interest rate parameters
(contract-call? .interest-calculator get-rate-parameters)

;; 4. Test with small amounts first
(contract-call? .lending-pool deposit-collateral u1000000) ;; 1 STX test
```

## 🔧 Post-Deployment Checklist

- [ ] Verify all 4 contracts deployed successfully
- [ ] Check contract addresses match deployment plan
- [ ] Authorize price oracle addresses
- [ ] Set initial asset prices
- [ ] Test deposit function with small amount
- [ ] Test borrow function with small amount
- [ ] Test repayment function
- [ ] Test withdrawal function
- [ ] Verify interest rate calculations
- [ ] Test liquidation scenario (testnet only)
- [ ] Set up monitoring and alerts
- [ ] Update frontend with contract addresses
- [ ] Update documentation with deployment info

## 📊 Monitoring Deployed Contracts

### Using Stacks Explorer

```
Mainnet: https://explorer.stacks.co/
Testnet: https://explorer.stacks.co/?chain=testnet
```

### Using Clarinet

```bash
# Check contract status
clarinet deployments check --mainnet

# View contract details
clarinet contract-call price-oracle get-latest-price --mainnet
```

### Key Metrics to Monitor

1. **Total Liquidity**: `(contract-call? .lending-pool get-pool-liquidity)`
2. **Total Borrowed**: `(contract-call? .lending-pool get-total-borrowed)`
3. **Utilization Rate**: `(contract-call? .lending-pool get-utilization-rate)`
4. **Current Interest Rate**: `(contract-call? .interest-calculator get-current-rate)`
5. **Liquidation Count**: `(contract-call? .collateral-manager get-liquidation-stats)`

## 🔐 Security Best Practices

### For Testnet
- Use separate wallet for testing
- Don't use real private keys
- Test all edge cases
- Simulate liquidation scenarios

### For Mainnet
- **CRITICAL**: Complete security audit before deployment
- Use hardware wallet for deployment
- Store deployment keys securely
- Implement multi-sig for admin functions (future upgrade)
- Set up 24/7 monitoring
- Have emergency response plan
- Start with conservative parameters
- Implement circuit breakers
- Regular price oracle updates

## 🆘 Emergency Procedures

### Pause Protocol (Admin Only)
```clarity
(contract-call? .lending-pool toggle-protocol-pause)
(contract-call? .price-oracle set-emergency-pause true)
```

### Update Interest Rate Parameters
```clarity
(contract-call? .interest-calculator update-rate-parameters 
  u2000000   ;; base-rate
  u10000000  ;; optimal-rate  
  u50000000  ;; max-rate
  u80)       ;; optimal-utilization
```

## 📝 Deployment Verification Script

Create `scripts/verify-deployment.ts`:

```typescript
import { Cl } from "@stacks/transactions";

async function verifyDeployment(network: 'testnet' | 'mainnet') {
  const contracts = [
    'price-oracle',
    'interest-calculator', 
    'lending-pool',
    'collateral-manager'
  ];
  
  for (const contract of contracts) {
    console.log(`Verifying ${contract}...`);
    // Add verification logic
  }
}
```

## 🐛 Troubleshooting

### Issue: Contract deployment fails
- **Solution**: Check you have enough STX for fees
- **Solution**: Verify network connectivity
- **Solution**: Check contract dependencies are met

### Issue: Contract call fails
- **Solution**: Verify function signatures match
- **Solution**: Check parameter types are correct
- **Solution**: Ensure contracts deployed in correct order

### Issue: Price oracle not updating
- **Solution**: Authorize oracle addresses
- **Solution**: Check price deviation limits
- **Solution**: Verify staleness threshold

## 📞 Support

For deployment issues:
- GitHub Issues: https://github.com/TheDEV111/finance-lending-protocol/issues
- Discord: [Coming Soon]
- Email: [Coming Soon]

---

**Remember**: Always test thoroughly on devnet and testnet before mainnet deployment!
