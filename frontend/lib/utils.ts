import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Convert microSTX to STX
export function microStxToStx(microStx: number | bigint): number {
  return Number(microStx) / 1000000;
}

// Convert STX to microSTX
export function stxToMicroStx(stx: number): bigint {
  return BigInt(Math.floor(stx * 1000000));
}

// Format STX amount with commas and decimals
export function formatStx(amount: number, decimals: number = 2): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format USD amount
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

// Calculate health factor
export function calculateHealthFactor(
  collateral: number,
  debt: number,
  collateralRatio: number = 75
): number {
  if (debt === 0) return 999; // No debt = healthy
  const collateralValue = (collateral * collateralRatio) / 100;
  return collateralValue / debt;
}

// Get health factor status
export function getHealthFactorStatus(healthFactor: number): {
  status: 'healthy' | 'warning' | 'danger';
  color: string;
  text: string;
} {
  if (healthFactor >= 1.5) {
    return { status: 'healthy', color: 'text-emerald-500', text: 'Healthy' };
  } else if (healthFactor >= 1.2) {
    return { status: 'warning', color: 'text-amber-500', text: 'At Risk' };
  } else {
    return { status: 'danger', color: 'text-red-500', text: 'Liquidatable' };
  }
}

// Calculate max borrow amount
export function calculateMaxBorrow(
  collateral: number,
  collateralRatio: number = 75
): number {
  return (collateral * collateralRatio) / 100;
}

// Calculate interest for a period
export function calculateInterest(
  principal: number,
  rate: number,
  blocks: number,
  blocksPerYear: number = 52560
): number {
  const rateDecimal = rate / 100;
  return (principal * rateDecimal * blocks) / blocksPerYear;
}

// Shorten address for display
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.substring(0, chars + 2)}...${address.substring(
    address.length - chars
  )}`;
}

// Format block height
export function formatBlockHeight(block: number): string {
  return block.toLocaleString('en-US');
}

// Calculate time from blocks (assuming 10 min per block)
export function blocksToTime(blocks: number): string {
  const minutes = blocks * 10;
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

// Validate STX amount
export function isValidStxAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1000000000;
}

// Get transaction status color
export function getTxStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'text-emerald-500';
    case 'pending':
      return 'text-amber-500';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}
