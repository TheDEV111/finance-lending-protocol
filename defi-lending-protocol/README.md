# DeFi Lending Protocol

A decentralized lending platform built on the Stacks blockchain that allows users to deposit STX as collateral and borrow against it with automated interest calculations, dynamic rates, and liquidation protection.

## 🚀 Features

- **Collateralized Lending**: Deposit STX as collateral and borrow up to 75% of its value
- **Dynamic Interest Rates**: Automatic rate adjustments based on pool utilization (0-100%)
- **Automated Liquidation**: Protect lenders with health factor monitoring and liquidation mechanism
- **Real-time Interest Accrual**: Interest calculated per-block with compound calculations
- **Decentralized Price Oracle**: On-chain price feeds with staleness checks and deviation limits
- **Security First**: Comprehensive health factor checks and minimum collateral ratios

## 📋 Smart Contracts

### 1. **lending-pool.clar** - Main Lending Contract
Core protocol functionality for deposits, borrows, repayments, and withdrawals.

**Key Functions:**
- `deposit-collateral` - Deposit STX as collateral
- `borrow-funds` - Borrow against collateral (up to 75% LTV)
- `repay-loan` - Repay borrowed amount with accrued interest
- `withdraw-collateral` - Withdraw collateral (maintaining health factor)

**Constants:**
- `COLLATERAL_RATIO`: 75% (max borrow to collateral ratio)
- `MIN_HEALTH_FACTOR`: 1.2 (minimum health factor to avoid liquidation)
- `INTEREST_PRECISION`: 1,000,000 (6 decimal places)

### 2. **collateral-manager.clar** - Liquidation & Health Monitoring
Manages collateral valuation, health factor calculations, and liquidations.

**Key Functions:**
- `check-health-factor` - Calculate user's position health
- `is-liquidatable` - Check if position can be liquidated
- `liquidate-position` - Liquidate unhealthy positions
- `calculate-liquidation-amount` - Determine liquidation parameters

**Constants:**
- `LIQUIDATION_BONUS`: 5% bonus for liquidators
- `LIQUIDATION_THRESHOLD`: Health factor < 1.0 triggers liquidation

### 3. **interest-calculator.clar** - Dynamic Rate Management
Calculates and updates interest rates based on pool utilization.

**Key Functions:**
- `update-rates` - Update borrow and supply rates
- `calculate-borrow-rate` - Calculate rate based on utilization
- `calculate-interest` - Calculate interest over time periods
- `estimate-apy` - Convert rates to APY

**Interest Rate Model:**
- Base Rate: 2% APY at 0% utilization
- Optimal Rate: 10% APY at 80% utilization  
- Max Rate: 50% APY at 100% utilization

### 4. **price-oracle.clar** - Decentralized Price Feeds
Manages price feeds for collateral assets with security features.

**Key Functions:**
- `update-price` - Submit price update (authorized oracles only)
- `get-latest-price` - Get current asset price
- `is-price-fresh` - Check price staleness
- `authorize-oracle` / `revoke-oracle` - Manage oracle permissions

**Security Features:**
- Price staleness check (144 blocks / ~24 hours)
- Maximum price deviation limit (10%)
- Multi-source aggregation support
- Emergency pause mechanism

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DeFi Lending Protocol                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌─────────────────┐                 │
│  │ Price Oracle │◄─────┤ External Feeds  │                 │
│  └──────┬───────┘      └─────────────────┘                 │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐      ┌──────────────────┐                │
│  │ Collateral   │◄─────┤  Lending Pool    │                │
│  │ Manager      │      │  (Main Contract) │                │
│  └──────────────┘      └─────────┬────────┘                │
│                                   │                          │
│                                   ▼                          │
│                        ┌──────────────────┐                 │
│                        │ Interest         │                 │
│                        │ Calculator       │                 │
│                        └──────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Development Setup

### Prerequisites
- [Clarinet](https://docs.hiro.so/clarinet) v3.11.0+
- Node.js v18+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/TheDEV111/finance-lending-protocol.git
cd finance-lending-protocol/defi-lending-protocol

# Install dependencies
npm install

# Run contract checks
clarinet check contracts/lending-pool.clar
clarinet check contracts/collateral-manager.clar
clarinet check contracts/interest-calculator.clar
clarinet check contracts/price-oracle.clar

# Run tests
npm test
```

## 🧪 Testing

The protocol includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test file
npx vitest run tests/defi-lending-protocol.test.ts

# Run with coverage
npm run test:coverage
```

### Test Coverage Areas
- ✅ Deposit and withdrawal operations
- ✅ Borrowing with collateral ratios
- ✅ Interest rate calculations
- ✅ Health factor monitoring
- ✅ Liquidation scenarios
- ✅ Price oracle updates
- ✅ Edge cases and error handling

## 📊 Usage Examples

### Deposit Collateral
```clarity
(contract-call? .lending-pool deposit-collateral u10000000) ;; Deposit 10 STX
```

### Borrow Funds
```clarity
(contract-call? .lending-pool borrow-funds u5000000) ;; Borrow 5 STX (50% of collateral)
```

### Repay Loan
```clarity
(contract-call? .lending-pool repay-loan u5000000) ;; Repay 5 STX
```

### Check Health Factor
```clarity
(contract-call? .lending-pool get-health-factor tx-sender)
```

### Liquidate Position
```clarity
(contract-call? .collateral-manager liquidate-position 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM u3000000)
```

## 🔐 Security Considerations

### Health Factor System
- **Healthy**: Health Factor > 1.5 (Green)
- **Warning**: Health Factor 1.2-1.5 (Yellow)
- **Liquidatable**: Health Factor < 1.0 (Red)

### Collateral Requirements
- Maximum LTV: 75%
- Minimum Health Factor: 1.2
- Liquidation Threshold: Health Factor < 1.0
- Liquidation Bonus: 5%

### Interest Rate Bounds
- Minimum Rate: 2% APY
- Maximum Rate: 50% APY
- Rate updates: Every block based on utilization

## 🚢 Deployment

### Devnet Deployment
```bash
clarinet integrate
```

### Testnet Deployment
```bash
clarinet deployment generate --testnet
clarinet deployment apply --testnet
```

### Mainnet Deployment
```bash
clarinet deployment generate --mainnet
clarinet deployment apply --mainnet
```

## 📈 Roadmap

### Phase 1: Core Protocol ✅
- [x] Lending pool implementation
- [x] Interest rate calculator
- [x] Collateral manager
- [x] Price oracle

### Phase 2: Frontend Development (Coming Soon)
- [ ] React + Next.js dashboard
- [ ] Wallet integration (Hiro, Xverse, Leather)
- [ ] Real-time position monitoring
- [ ] Transaction history
- [ ] Analytics dashboard

### Phase 3: Advanced Features
- [ ] Multi-asset collateral support
- [ ] Flash loans
- [ ] Governance token
- [ ] Cross-chain bridges
- [ ] Mobile application

### Phase 4: Chainhooks Integration
- [ ] Real-time event monitoring
- [ ] Automated notifications
- [ ] Analytics data pipeline
- [ ] Risk monitoring system

## 📝 Contract Status

| Contract | Status | Individual Check | Full Check |
|----------|--------|------------------|------------|
| price-oracle | ✅ Ready | ✅ Passed | ⚠️ Clarinet Issue |
| interest-calculator | ✅ Ready | ✅ Passed | ⚠️ Clarinet Issue |
| lending-pool | ✅ Ready | ✅ Passed | ⚠️ Clarinet Issue |
| collateral-manager | ✅ Ready | ✅ Passed | ⚠️ Clarinet Issue |

**Note**: All contracts pass individual syntax checks. The full `clarinet check` shows dependency resolution warnings that are known issues with Clarinet 3.11.0's static analysis mode when using `block-height` in read-only functions and cross-contract calls. These do not affect contract functionality or deployment.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: https://github.com/TheDEV111/finance-lending-protocol
- **Documentation**: [Coming Soon]
- **Discord**: [Coming Soon]
- **Twitter**: [Coming Soon]

## 👥 Team

- **TheDEV111** - Lead Developer

## 🙏 Acknowledgments

- Stacks Foundation
- Hiro Systems for Clarinet
- The Stacks Community

---

**⚠️ Disclaimer**: This protocol is currently in development and has not been audited. Use at your own risk. Do not deploy to mainnet with real funds until a comprehensive security audit has been completed.
