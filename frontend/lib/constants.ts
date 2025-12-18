// Contract addresses on mainnet
export const CONTRACT_ADDRESS = 'SPVQ61FEWR6M4HVAT3BNE07D4BNW6A1C2ACCNQ6F';

export const CONTRACTS = {
  LENDING_POOL: `${CONTRACT_ADDRESS}.lending-pool`,
  COLLATERAL_MANAGER: `${CONTRACT_ADDRESS}.collateral-manager`,
  INTEREST_CALCULATOR: `${CONTRACT_ADDRESS}.interest-calculator`,
  PRICE_ORACLE: `${CONTRACT_ADDRESS}.price-oracle`,
} as const;

// Protocol constants
export const PROTOCOL_CONSTANTS = {
  COLLATERAL_RATIO: 75, // 75% LTV
  MIN_HEALTH_FACTOR: 1.2,
  LIQUIDATION_THRESHOLD: 1.0,
  LIQUIDATION_BONUS: 5, // 5%
  INTEREST_PRECISION: 1000000, // 6 decimals
  MIN_DEPOSIT: 100000000, // 100 STX in microSTX
} as const;

// Interest rate model
export const INTEREST_RATES = {
  BASE_RATE: 2, // 2% APY
  OPTIMAL_RATE: 10, // 10% APY at 80% utilization
  MAX_RATE: 50, // 50% APY at 100% utilization
  OPTIMAL_UTILIZATION: 80, // 80%
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  MAINNET: {
    url: 'https://api.hiro.so',
    name: 'mainnet',
  },
  TESTNET: {
    url: 'https://api.testnet.hiro.so',
    name: 'testnet',
  },
} as const;

// UI Constants
export const HEALTH_FACTOR_THRESHOLDS = {
  HEALTHY: 1.5,
  WARNING: 1.2,
  DANGER: 1.0,
} as const;

// Transaction types
export const TX_TYPES = {
  DEPOSIT: 'deposit',
  BORROW: 'borrow',
  REPAY: 'repay',
  WITHDRAW: 'withdraw',
  LIQUIDATE: 'liquidate',
} as const;
