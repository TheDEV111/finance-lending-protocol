'use client';

import { useState, useEffect } from 'react';
import { CONTRACTS } from '@/lib/constants';
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

interface PoolStats {
  totalLiquidity: number;
  totalBorrowed: number;
  utilizationRate: number;
  currentBorrowRate: number;
  currentSupplyRate: number;
}

export function usePoolStats() {
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const [lendingAddress, lendingName] = CONTRACTS.LENDING_POOL.split('.');
      const [calcAddress, calcName] = CONTRACTS.INTEREST_CALCULATOR.split('.');

      // Fetch pool liquidity
      const liquidityResult = await fetchCallReadOnlyFunction({
        network: STACKS_MAINNET,
        contractAddress: lendingAddress,
        contractName: lendingName,
        functionName: 'get-pool-liquidity',
        functionArgs: [],
        senderAddress: lendingAddress,
      });

      // Fetch total borrowed
      const borrowedResult = await fetchCallReadOnlyFunction({
        network: STACKS_MAINNET,
        contractAddress: lendingAddress,
        contractName: lendingName,
        functionName: 'get-total-borrowed',
        functionArgs: [],
        senderAddress: lendingAddress,
      });

      // Fetch utilization rate
      const utilizationResult = await fetchCallReadOnlyFunction({
        network: STACKS_MAINNET,
        contractAddress: lendingAddress,
        contractName: lendingName,
        functionName: 'get-utilization-rate',
        functionArgs: [],
        senderAddress: lendingAddress,
      });

      // Fetch borrow rate
      const borrowRateResult = await fetchCallReadOnlyFunction({
        network: STACKS_MAINNET,
        contractAddress: calcAddress,
        contractName: calcName,
        functionName: 'get-current-rate',
        functionArgs: [],
        senderAddress: calcAddress,
      });

      // Fetch supply rate
      const supplyRateResult = await fetchCallReadOnlyFunction({
        network: STACKS_MAINNET,
        contractAddress: calcAddress,
        contractName: calcName,
        functionName: 'get-supply-rate',
        functionArgs: [],
        senderAddress: calcAddress,
      });

      const liquidity = Number(cvToJSON(liquidityResult).value) / 1000000;
      const borrowed = Number(cvToJSON(borrowedResult).value) / 1000000;
      const utilization = Number(cvToJSON(utilizationResult).value);
      const borrowRate = Number(cvToJSON(borrowRateResult).value) / 10000; // Convert to percentage
      const supplyRate = Number(cvToJSON(supplyRateResult).value) / 10000;

      setStats({
        totalLiquidity: liquidity,
        totalBorrowed: borrowed,
        utilizationRate: utilization,
        currentBorrowRate: borrowRate,
        currentSupplyRate: supplyRate,
      });
    } catch (err) {
      console.error('Error fetching pool stats:', err);
      setError('Failed to fetch pool stats');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch: fetchStats };
}
