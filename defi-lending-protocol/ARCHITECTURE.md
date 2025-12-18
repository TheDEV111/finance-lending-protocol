# Smart Contracts Architecture

Detailed technical documentation for the DeFi Lending Protocol smart contracts.

## 📐 Architecture Overview

The protocol consists of four interconnected smart contracts:

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Price Oracle │ │Lending Pool  │ │ Interest     │
│ (Independent)│ │  (Core)      │ │ Calculator   │
│              │ │              │ │ (Independent)│
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                 │
       └────────────────┼─────────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ Collateral   │
                 │ Manager      │
                 │ (Dependent)  │
                 └──────────────┘
```

## 🏦 1. Lending Pool Contract

**File**: `contracts/lending-pool.clar`  
**Purpose**: Core protocol contract managing deposits, borrows, repayments, and withdrawals.

### Data Structures

#### User Position Map
```clarity
(define-map user-positions
  principal
  {
    collateral: uint,           ;; Total STX deposited
    borrowed: uint,             ;; Principal borrowed
    interest-index: uint,       ;; Index at time of borrow
    last-interaction-block: uint ;; Last block of interaction
  }
)
```

### State Variables
- `total-liquidity`: Total STX available in the pool
- `total-borrowed`: Total STX currently borrowed
- `global-interest-index`: Compound interest accumulator
- `last-update-block`: Last interest index update block
- `protocol-paused`: Emergency pause state

### Key Functions

#### deposit-collateral
```clarity
(define-public (deposit-collateral (amount uint))
  ;; Transfers STX from user to contract
  ;; Updates user position
  ;; Increases total liquidity
```
**Requirements:**
- amount > 0
- Protocol not paused
- Successful STX transfer

#### borrow-funds
```clarity
(define-public (borrow-funds (amount uint))
  ;; Validates collateral ratio
  ;; Checks pool liquidity
  ;; Transfers STX to user
  ;; Updates interest rates
```
**Requirements:**
- amount > 0
- amount <= max borrowable (75% of collateral)
- Pool has sufficient liquidity
- Protocol not paused

**Calculations:**
```
max_borrow = collateral * 75 / 100
new_debt = current_debt + amount
health_factor = (collateral * 75 / 100) / debt * 100
```

#### repay-loan
```clarity
(define-public (repay-loan (amount uint))
  ;; Calculates current debt with interest
  ;; Accepts repayment
  ;; Updates position and pool stats
  ;; Updates interest rates
```

#### withdraw-collateral
```clarity
(define-public (withdraw-collateral (amount uint))
  ;; Checks health factor after withdrawal
  ;; Transfers collateral to user
  ;; Updates position
```

**Health Factor Check:**
```clarity
if (debt > 0) {
  new_health = (remaining_collateral * 75 / 100) / debt * 100
  assert!(new_health >= 120) // Minimum 1.2
}
```

### Interest Accrual Model

The protocol uses a compound interest model:

```clarity
(define-private (update-interest-index)
  ;; blocks_elapsed = current_block - last_update_block
  ;; rate = current_interest_rate
  ;; interest_per_block = rate / 52560 (blocks per year)
  ;; multiplier = 1 + (interest_per_block * blocks_elapsed / 100)
  ;; new_index = old_index * multiplier
```

## 💹 2. Interest Calculator Contract

**File**: `contracts/interest-calculator.clar`  
**Purpose**: Manages dynamic interest rates based on pool utilization.

### Interest Rate Model

The protocol uses a two-slope interest rate model:

```
Rate │     
 50% │                              ╱
     │                           ╱
     │                        ╱
 10% │              ╱────────
     │          ╱
  2% │─────────
     └────────────────────────────────── Utilization
         0%        80%              100%
```

#### Rate Calculation Logic

**Below Optimal Utilization (0-80%):**
```
rate = base_rate + (optimal_rate - base_rate) * (utilization / optimal_utilization)
```

**Above Optimal Utilization (80-100%):**
```
rate = optimal_rate + (max_rate - optimal_rate) * ((utilization - optimal) / (100 - optimal))
```

### Parameters

```clarity
BASE_RATE = 2% (2000000 with 6 decimals)
OPTIMAL_RATE = 10% (10000000 with 6 decimals)
MAX_RATE = 50% (50000000 with 6 decimals)
OPTIMAL_UTILIZATION = 80%
```

### Supply Rate

The supply rate (lenders' earnings) is calculated as:

```
supply_rate = borrow_rate * utilization / 100
```

### Functions

#### update-rates
```clarity
(define-public (update-rates (utilization uint))
  ;; Calculate new borrow rate
  ;; Calculate new supply rate
  ;; Store rate history
  ;; Return rate info
```

#### calculate-interest
```clarity
(define-read-only (calculate-interest 
  (principal-amount uint) 
  (rate uint) 
  (blocks uint))
  ;; interest = principal * rate * blocks / (blocks_per_year * precision * 100)
```

## 🛡️ 3. Collateral Manager Contract

**File**: `contracts/collateral-manager.clar`  
**Purpose**: Manages liquidations and health factor monitoring.

### Health Factor System

The health factor determines position safety:

```
Health Factor = (collateral * collateral_ratio) / debt * 100

Where:
- collateral_ratio = 75% (COLLATERAL_RATIO)
- Healthy: HF >= 150 (1.5x)
- Warning: 120 <= HF < 150
- Liquidatable: HF < 100 (1.0x)
```

### Liquidation Mechanism

#### Liquidation Conditions
- Health Factor < 1.0 (100)
- Position has outstanding debt
- Liquidator repays partial debt

#### Liquidation Process

1. **Validate Liquidatable:**
```clarity
health_factor = (collateral * 75 / 100) / debt * 100
assert!(health_factor < 100)
```

2. **Calculate Amounts:**
```clarity
debt_to_repay = debt / 2  // 50% partial liquidation
collateral_to_seize = debt_to_repay * 105 / 100  // 5% bonus
```

3. **Execute:**
```clarity
;; Transfer debt repayment from liquidator
;; Transfer seized collateral to liquidator
;; Update user position
;; Record liquidation event
```

### Liquidation Data

```clarity
(define-map liquidation-events
  uint
  {
    liquidated-user: principal,
    liquidator: principal,
    collateral-seized: uint,
    debt-repaid: uint,
    liquidation-block: uint,
    health-factor-before: uint
  }
)
```

### Functions

#### liquidate-position
```clarity
(define-public (liquidate-position 
  (user principal) 
  (debt-to-repay uint))
  ;; Check if liquidatable
  ;; Calculate collateral to seize
  ;; Execute liquidation
  ;; Record event
```

#### check-health-factor
```clarity
(define-read-only (check-health-factor (user principal))
  ;; Get position from lending-pool
  ;; Calculate current debt
  ;; Calculate health factor
  ;; Return result
```

## 📊 4. Price Oracle Contract

**File**: `contracts/price-oracle.clar`  
**Purpose**: Manages decentralized price feeds for collateral assets.

### Price Feed Structure

```clarity
(define-map asset-prices
  { asset: (string-ascii 10) }
  {
    price: uint,              ;; Price with 6 decimals
    last-update-block: uint,  ;; Block height of update
    last-update-time: uint,   ;; Burn block height
    decimals: uint,           ;; Price decimals (6)
    source: (string-ascii 20) ;; Data source identifier
  }
)
```

### Security Features

#### 1. Oracle Authorization
```clarity
(define-map authorized-oracles
  principal
  { authorized: bool, update-count: uint }
)
```

Only authorized addresses can update prices.

#### 2. Staleness Check
```clarity
PRICE_STALENESS_THRESHOLD = 144 blocks (~24 hours)

blocks_since_update = current_block - last_update_block
if (blocks_since_update > 144) {
  return ERR_PRICE_TOO_OLD
}
```

#### 3. Price Deviation Limit
```clarity
MAX_PRICE_DEVIATION = 10%

deviation = |new_price - old_price| / old_price * 100
assert!(deviation <= 10)
```

#### 4. Price Bounds
```clarity
(define-map asset-config
  { asset: (string-ascii 10) }
  {
    supported: bool,
    min-price: uint,  // e.g., $0.10 for STX
    max-price: uint,  // e.g., $100 for STX
    decimals: uint
  }
)
```

### Functions

#### update-price
```clarity
(define-public (update-price 
  (asset (string-ascii 10))
  (new-price uint)
  (source (string-ascii 20)))
  ;; Check authorization
  ;; Validate price bounds
  ;; Check deviation
  ;; Update price
  ;; Store history
```

#### get-latest-price
```clarity
(define-read-only (get-latest-price (asset (string-ascii 10)))
  ;; Get price
  ;; Check staleness
  ;; Return price or error
```

## 🔄 Contract Interactions

### User Deposits and Borrows

```
User
  │
  ├─→ (1) deposit-collateral → lending-pool
  │                               │
  │                               ├─→ Update position
  │                               └─→ Increase liquidity
  │
  ├─→ (2) borrow-funds → lending-pool
  │                         │
  │                         ├─→ Check collateral-manager
  │                         ├─→ Update interest-calculator
  │                         ├─→ Transfer STX
  │                         └─→ Update position
```

### Interest Rate Updates

```
Borrow/Repay Event
  │
  └─→ lending-pool
        │
        ├─→ Calculate new utilization
        │
        └─→ interest-calculator.update-rates(utilization)
              │
              ├─→ Calculate new borrow rate
              ├─→ Calculate new supply rate
              └─→ Store rate history
```

### Liquidation Flow

```
Liquidator
  │
  └─→ collateral-manager.liquidate-position(user, amount)
        │
        ├─→ Check health factor (< 1.0)
        ├─→ Get position from lending-pool
        ├─→ Calculate liquidation amounts
        ├─→ Transfer debt repayment
        ├─→ Transfer seized collateral (with 5% bonus)
        └─→ Record liquidation event
```

## 📏 Constants Reference

### Lending Pool
```clarity
COLLATERAL_RATIO = 75 / 100 (75%)
MIN_HEALTH_FACTOR = 120 / 100 (1.2x)
INTEREST_PRECISION = 1,000,000 (6 decimals)
```

### Collateral Manager
```clarity
LIQUIDATION_BONUS = 105 / 100 (5%)
LIQUIDATION_THRESHOLD = 100 / 100 (1.0x)
```

### Interest Calculator
```clarity
BASE_RATE = 2,000,000 (2%)
OPTIMAL_RATE = 10,000,000 (10%)
MAX_RATE = 50,000,000 (50%)
OPTIMAL_UTILIZATION = 80
BLOCKS_PER_YEAR = 52,560
```

### Price Oracle
```clarity
PRICE_STALENESS_THRESHOLD = 144 blocks
MAX_PRICE_DEVIATION = 10 / 100 (10%)
PRICE_PRECISION = 1,000,000 (6 decimals)
```

## 🔒 Error Codes

### Lending Pool (100-199)
- `100`: ERR_UNAUTHORIZED
- `101`: ERR_INSUFFICIENT_COLLATERAL
- `102`: ERR_INSUFFICIENT_LIQUIDITY
- `103`: ERR_INVALID_AMOUNT
- `104`: ERR_POSITION_NOT_FOUND
- `105`: ERR_HEALTH_FACTOR_TOO_LOW
- `106`: ERR_NO_COLLATERAL
- `107`: ERR_OUTSTANDING_DEBT

### Collateral Manager (200-299)
- `200`: ERR_UNAUTHORIZED
- `201`: ERR_POSITION_HEALTHY
- `202`: ERR_INVALID_LIQUIDATION
- `203`: ERR_NO_POSITION
- `204`: ERR_PRICE_NOT_AVAILABLE

### Interest Calculator (300-399)
- `300`: ERR_UNAUTHORIZED
- `301`: ERR_INVALID_RATE
- `302`: ERR_INVALID_UTILIZATION

### Price Oracle (400-499)
- `400`: ERR_UNAUTHORIZED
- `401`: ERR_PRICE_TOO_OLD
- `402`: ERR_INVALID_PRICE
- `403`: ERR_ASSET_NOT_SUPPORTED
- `404`: ERR_ORACLE_NOT_AUTHORIZED
- `405`: ERR_PRICE_DEVIATION_TOO_HIGH

## 🧮 Mathematical Formulas

### Health Factor
```
HF = (C × CR ÷ 100) ÷ D × 100
```
Where:
- C = Collateral amount
- CR = Collateral Ratio (75)
- D = Current debt (with interest)

### Utilization Rate
```
U = B ÷ L × 100
```
Where:
- B = Total borrowed
- L = Total liquidity

### Interest Rate (Below Optimal)
```
R = Rb + (Ro - Rb) × (U ÷ Uo)
```
Where:
- Rb = Base rate (2%)
- Ro = Optimal rate (10%)
- U = Current utilization
- Uo = Optimal utilization (80%)

### Interest Rate (Above Optimal)
```
R = Ro + (Rm - Ro) × ((U - Uo) ÷ (100 - Uo))
```
Where:
- Rm = Max rate (50%)

### Compound Interest
```
I = P × (1 + r × t)
```
Where:
- P = Principal
- r = Rate per block
- t = Blocks elapsed

## 🎯 Gas Optimization

### Efficient Data Structures
- Use `uint` instead of `int` where possible
- Pack related data in maps
- Minimize storage reads/writes

### Function Optimizations
- Cache frequently accessed values
- Use read-only functions for queries
- Batch operations where possible

### Cost Estimates
- `deposit-collateral`: ~0.002 STX
- `borrow-funds`: ~0.003 STX (includes rate update)
- `repay-loan`: ~0.003 STX
- `withdraw-collateral`: ~0.002 STX
- `liquidate-position`: ~0.004 STX

---

**Note**: This architecture is designed for security, efficiency, and extensibility. Future upgrades may include multi-asset support, flash loans, and governance mechanisms.
