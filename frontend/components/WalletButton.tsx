'use client';

import { useWallet } from '@/contexts/WalletContext';
import { Wallet, LogOut } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';

export default function WalletButton() {
  const { isConnected, address, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <Wallet className="w-4 h-4" />
        <span className="font-mono text-sm">{shortenAddress(address)}</span>
        <LogOut className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
    >
      <Wallet className="w-5 h-5" />
      Connect Wallet
    </button>
  );
}
