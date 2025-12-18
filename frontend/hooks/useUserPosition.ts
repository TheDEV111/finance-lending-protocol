'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS } from '@/lib/constants';
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  standardPrincipalCV,
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

interface UserPosition {
  collateral: number;
  borrowed: number;
  interestIndex: number;
  lastInteractionBlock: number;
}

export function useUserPosition() {
  const { address, isConnected } = useWallet();
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setPosition(null);
      return;
    }

    fetchPosition();
  }, [address, isConnected]);

  const fetchPosition = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const [contractAddress, contractName] = CONTRACTS.LENDING_POOL.split('.');

      const result = await fetchCallReadOnlyFunction({
        network: STACKS_MAINNET,
        contractAddress,
        contractName,
        functionName: 'get-user-position',
        functionArgs: [standardPrincipalCV(address)],
        senderAddress: address,
      });

      const jsonResult = cvToJSON(result);
      
      if (jsonResult.value) {
        setPosition({
          collateral: Number(jsonResult.value.collateral.value) / 1000000,
          borrowed: Number(jsonResult.value.borrowed.value) / 1000000,
          interestIndex: Number(jsonResult.value['interest-index'].value),
          lastInteractionBlock: Number(jsonResult.value['last-interaction-block'].value),
        });
      }
    } catch (err) {
      console.error('Error fetching position:', err);
      setError('Failed to fetch position');
    } finally {
      setLoading(false);
    }
  };

  return { position, loading, error, refetch: fetchPosition };
}
