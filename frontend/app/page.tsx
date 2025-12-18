'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useUserPosition } from '@/hooks/useUserPosition';
import { usePoolStats } from '@/hooks/usePoolStats';
import WalletButton from '@/components/WalletButton';
import HealthFactorGauge from '@/components/HealthFactorGauge';
import DepositTab from '@/components/DepositTab';
import { formatStx, formatPercentage } from '@/lib/utils';
import { TrendingUp, Wallet, BarChart3, Activity } from 'lucide-react';

export default function Home() {
  const { isConnected } = useWallet();
  const { position, loading: positionLoading, refetch: refetchPosition } = useUserPosition();
  const { stats, loading: statsLoading } = usePoolStats();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              DeFi Lending Protocol
            </h1>
            <p className="text-white/60">Borrow and lend STX with dynamic rates</p>
          </div>
          <WalletButton />
        </div>
      </header>

      {!isConnected ? (
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Connect your Stacks wallet to start depositing collateral, borrowing STX, and earning interest.
            </p>
            <WalletButton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-white/60">Total Liquidity</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {statsLoading ? '---' : formatStx(stats?.totalLiquidity || 0)} STX
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-white/60">Total Borrowed</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {statsLoading ? '---' : formatStx(stats?.totalBorrowed || 0)} STX
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-amber-400" />
                <span className="text-white/60">Utilization</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {statsLoading ? '---' : formatPercentage(stats?.utilizationRate || 0)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Account</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-white/60 text-sm mb-1">Collateral</div>
                    <div className="text-xl font-mono font-bold text-white">
                      {positionLoading ? '---' : formatStx(position?.collateral || 0)} STX
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm mb-1">Borrowed</div>
                    <div className="text-xl font-mono font-bold text-white">
                      {positionLoading ? '---' : formatStx(position?.borrowed || 0)} STX
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="glass rounded-xl p-6">
                <DepositTab 
                  currentCollateral={position?.collateral || 0}
                  onSuccess={refetchPosition}
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <HealthFactorGauge 
                collateral={position?.collateral || 0}
                debt={position?.borrowed || 0}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
