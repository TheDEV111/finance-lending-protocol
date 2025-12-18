'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';
import { CONTRACTS, PROTOCOL_CONSTANTS } from '@/lib/constants';
import { stxToMicroStx, formatStx, isValidStxAmount } from '@/lib/utils';
import { uintCV, PostConditionMode } from '@stacks/transactions';
import { ArrowDown, Loader2 } from 'lucide-react';

interface DepositTabProps {
  currentCollateral: number;
  onSuccess?: () => void;
}

export default function DepositTab({ currentCollateral, onSuccess }: DepositTabProps) {
  const { userSession } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (!userSession || !amount) return;

    if (!isValidStxAmount(amount)) {
      setError('Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < 0.01) {
      setError('Minimum deposit is 0.01 STX');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [contractAddress, contractName] = CONTRACTS.LENDING_POOL.split('.');
      const network = new StacksMainnet();

      await openContractCall({
        network,
        contractAddress,
        contractName,
        functionName: 'deposit-collateral',
        functionArgs: [uintCV(stxToMicroStx(amountNum))],
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
          setAmount('');
          if (onSuccess) onSuccess();
        },
        onCancel: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('Error depositing:', err);
      setError('Failed to deposit collateral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Deposit Amount
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-4 text-2xl font-mono text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="0.01"
            min="0"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-lg font-semibold text-white">STX</span>
          </div>
        </div>
        <div className="mt-2 text-sm text-white/60">
          ≈ ${(parseFloat(amount || '0') * 1.5).toFixed(2)} USD
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Transaction Preview */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-white/60">Current Collateral:</span>
          <span className="font-mono text-white">{formatStx(currentCollateral)} STX</span>
        </div>
        
        <div className="flex justify-center">
          <ArrowDown className="w-5 h-5 text-white/40" />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white/60">New Collateral:</span>
          <span className="font-mono text-emerald-400 font-semibold">
            {formatStx(currentCollateral + parseFloat(amount || '0'))} STX
          </span>
        </div>
      </div>

      <button
        onClick={handleDeposit}
        disabled={loading || !amount}
        className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Depositing...
          </>
        ) : (
          'Deposit Collateral'
        )}
      </button>

      <div className="text-xs text-white/50 text-center">
        Your STX will be locked as collateral. You can withdraw it anytime if you have no outstanding debt.
      </div>
    </div>
  );
}
