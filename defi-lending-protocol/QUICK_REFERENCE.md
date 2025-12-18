# Quick Reference Guide

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/TheDEV111/finance-lending-protocol.git
cd finance-lending-protocol/defi-lending-protocol
npm install

# Check contracts
clarinet check contracts/lending-pool.clar
clarinet check contracts/collateral-manager.clar
clarinet check contracts/interest-calculator.clar
clarinet check contracts/price-oracle.clar

# Run tests
npm test

# Start console
clarinet console
```

## 📝 Common Operations

### Deposit Collateral
```clarity
(contract-call? .lending-pool deposit-collateral u10000000)
;; Deposits 10 STX as collateral
```

### Borrow Funds
```clarity
(contract-call? .lending-pool borrow-funds u5000000)
;; Borrows 5 STX (must have sufficient collateral)
```

### Repay Loan
```clarity
(contract-call? .lending-pool repay-loan u5000000)
;; Repays 5 STX
```

### Withdraw Collateral
```clarity
(contract-call? .lending-pool withdraw-collateral u3000000)
;; Withdraws 3 STX (must maintain health factor)
```

### Check Position
```clarity
(contract-call? .lending-pool get-user-position tx-sender)
;; Returns: {collateral, borrowed, interest-index, last-interaction-block}
```

### Check Health Factor
```clarity
(contract-call? .collateral-manager check-health-factor tx-sender)
;; Returns health factor (e.g., u150 = 1.5x)
```

### Get Current Rate
```clarity
(contract-call? .interest-calculator get-current-rate)
;; Returns current borrow rate
```

### Get STX Price
```clarity
(contract-call? .price-oracle get-latest-price "STX")
;; Returns current STX price
```

## 🔧 Admin Operations

### Update Price (Oracle Only)
```clarity
(contract-call? .price-oracle update-price "STX" u1500000 "SOURCE")
;; Updates STX price to $1.50
```

### Update Interest Rate Parameters (Owner Only)
```clarity
(contract-call? .interest-calculator update-rate-parameters 
  u2000000   ;; base rate (2%)
  u10000000  ;; optimal rate (10%)
  u50000000  ;; max rate (50%)
  u80)       ;; optimal utilization (80%)
```

### Pause Protocol (Owner Only)
```clarity
(contract-call? .lending-pool toggle-protocol-pause)
;; Pauses/unpauses the protocol
```

### Authorize Oracle (Owner Only)
```clarity
(contract-call? .price-oracle authorize-oracle 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
;; Authorizes an oracle address
```

## 📊 Read-Only Queries

### Pool Statistics
```clarity
(contract-call? .lending-pool get-pool-liquidity)
(contract-call? .lending-pool get-total-borrowed)
(contract-call? .lending-pool get-utilization-rate)
```

### User Queries
```clarity
(contract-call? .lending-pool calculate-max-borrow tx-sender)
(contract-call? .lending-pool calculate-current-debt tx-sender)
(contract-call? .lending-pool get-health-factor tx-sender)
```

### Rate Queries
```clarity
(contract-call? .interest-calculator get-current-rate)
(contract-call? .interest-calculator get-supply-rate)
(contract-call? .interest-calculator get-utilization-rate)
(contract-call? .interest-calculator get-rate-parameters)
```

### Oracle Queries
```clarity
(contract-call? .price-oracle get-latest-price "STX")
(contract-call? .price-oracle is-price-fresh "STX")
(contract-call? .price-oracle get-asset-config "STX")
```

### Liquidation Queries
```clarity
(contract-call? .collateral-manager is-liquidatable 'ST...)
(contract-call? .collateral-manager calculate-liquidation-amount 'ST...)
(contract-call? .collateral-manager get-liquidation-stats)
```

## 🧮 Calculation Formulas

### Max Borrow Amount
```
max_borrow = collateral * 75 / 100
```

### Current Debt
```
debt = borrowed * (current_index / user_index)
```

### Health Factor
```
health_factor = (collateral * 75 / 100) / debt * 100
```

### Utilization Rate
```
utilization = total_borrowed / total_liquidity * 100
```

### Interest Rate (Below 80% Utilization)
```
rate = 2% + (10% - 2%) * (utilization / 80%)
```

### Interest Rate (Above 80% Utilization)
```
rate = 10% + (50% - 10%) * ((utilization - 80%) / 20%)
```

## 🎯 Key Constants

### Lending Pool
```clarity
COLLATERAL_RATIO = 75           ;; 75%
MIN_HEALTH_FACTOR = 120         ;; 1.2x
INTEREST_PRECISION = 1000000    ;; 6 decimals
```

### Collateral Manager
```clarity
LIQUIDATION_BONUS = 105         ;; 5% bonus
LIQUIDATION_THRESHOLD = 100     ;; 1.0x
```

### Interest Calculator
```clarity
BASE_RATE = 2000000            ;; 2% APY
OPTIMAL_RATE = 10000000        ;; 10% APY
MAX_RATE = 50000000            ;; 50% APY
OPTIMAL_UTILIZATION = 80       ;; 80%
BLOCKS_PER_YEAR = 52560        ;; ~10min blocks
```

### Price Oracle
```clarity
PRICE_STALENESS_THRESHOLD = 144  ;; ~24 hours
MAX_PRICE_DEVIATION = 10         ;; 10%
PRICE_PRECISION = 1000000        ;; 6 decimals
```

## ⚠️ Error Codes Quick Reference

| Code | Meaning |
|------|---------|
| 100 | Unauthorized |
| 101 | Insufficient collateral |
| 102 | Insufficient liquidity |
| 103 | Invalid amount |
| 104 | Position not found |
| 105 | Health factor too low |
| 106 | No collateral |
| 107 | Outstanding debt |
| 200-299 | Collateral manager errors |
| 300-399 | Interest calculator errors |
| 400-499 | Price oracle errors |

## 🔍 Debugging Tips

### Check Contract Syntax
```bash
clarinet check contracts/[contract-name].clar
```

### Run Specific Test
```bash
npx vitest run tests/defi-lending-protocol.test.ts -t "test name"
```

### Console Testing
```bash
clarinet console
# Then run contract calls interactively
```

### View Contract State
```clarity
;; In console
::get_assets_maps
::get_data_var lending-pool total-liquidity
```

## 📦 NPM Scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

## 🌐 Network Addresses

### Devnet (Local)
- Default deployer: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`

### Testnet
- Deploy with your testnet address
- Explorer: https://explorer.stacks.co/?chain=testnet

### Mainnet
- Deploy with your mainnet address
- Explorer: https://explorer.stacks.co/

## 🚨 Safety Checklist

Before borrowing:
- [ ] Check health factor will remain > 1.2
- [ ] Verify current interest rate
- [ ] Ensure sufficient liquidity in pool
- [ ] Calculate total repayment amount

Before withdrawing:
- [ ] Check remaining health factor
- [ ] Repay loans if health factor < 1.5
- [ ] Verify no outstanding debt

Before liquidating:
- [ ] Confirm health factor < 1.0
- [ ] Calculate liquidation amounts
- [ ] Have sufficient STX for repayment
- [ ] Understand 5% bonus mechanics

## 📚 Additional Resources

- **README.md**: Project overview and features
- **ARCHITECTURE.md**: Technical deep-dive
- **DEPLOYMENT.md**: Deployment guide
- **PROJECT_SUMMARY.md**: Completion status
- **Tests**: `tests/defi-lending-protocol.test.ts`

## 🆘 Common Issues

### "Insufficient collateral" error
- Your borrow amount exceeds 75% of collateral
- Solution: Deposit more collateral or borrow less

### "Health factor too low" error
- Your health factor would drop below 1.2
- Solution: Repay debt or deposit more collateral

### "Insufficient liquidity" error
- Pool doesn't have enough STX
- Solution: Wait for more deposits or borrow less

### "Price too old" error
- Oracle price is stale (>24 hours)
- Solution: Wait for oracle update or update price (if authorized)

## 💡 Pro Tips

1. **Maintain healthy margins**: Keep health factor > 1.5 for safety
2. **Monitor interest rates**: Rates increase with utilization
3. **Partial repayments**: You can repay loans partially
4. **Emergency withdrawals**: Repay all debt first
5. **Liquidation protection**: Set up alerts for health factor < 1.3

## 🎓 Example Scenarios

### Scenario 1: Simple Borrow
```clarity
;; 1. Deposit 100 STX
(contract-call? .lending-pool deposit-collateral u100000000)

;; 2. Borrow 50 STX (50% LTV, safe)
(contract-call? .lending-pool borrow-funds u50000000)

;; 3. Check health factor (should be ~1.5)
(contract-call? .collateral-manager check-health-factor tx-sender)
```

### Scenario 2: Liquidation
```clarity
;; 1. Find liquidatable position
(contract-call? .collateral-manager is-liquidatable 'ST...)

;; 2. Calculate amounts
(contract-call? .collateral-manager calculate-liquidation-amount 'ST...)

;; 3. Execute liquidation
(contract-call? .collateral-manager liquidate-position 'ST... u5000000)
```

### Scenario 3: Rate Monitoring
```clarity
;; 1. Check current utilization
(contract-call? .lending-pool get-utilization-rate)

;; 2. Check current rate
(contract-call? .interest-calculator get-current-rate)

;; 3. Estimate APY
(contract-call? .interest-calculator estimate-apy u10000000)
```

---

**Keep this guide handy for quick reference during development and testing!**
