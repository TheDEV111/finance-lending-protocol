'use client';

import { calculateHealthFactor, getHealthFactorStatus } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface HealthFactorGaugeProps {
  collateral: number;
  debt: number;
}

export default function HealthFactorGauge({ collateral, debt }: HealthFactorGaugeProps) {
  const healthFactor = calculateHealthFactor(collateral, debt);
  const { status, color, text } = getHealthFactorStatus(healthFactor);

  // Calculate gauge percentage (cap at 200%)
  const percentage = Math.min((healthFactor / 2) * 100, 100);

  const getIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      case 'danger':
        return <XCircle className="w-6 h-6" />;
    }
  };

  const getGaugeColor = () => {
    switch (status) {
      case 'healthy':
        return 'from-emerald-500 to-green-600';
      case 'warning':
        return 'from-amber-500 to-orange-600';
      case 'danger':
        return 'from-red-500 to-rose-600';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Health Factor</h3>
        <div className={`flex items-center gap-2 ${color}`}>
          {getIcon()}
          <span className="font-semibold">{text}</span>
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-white/10"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(percentage / 100) * 352} 352`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  className={status === 'healthy' ? 'text-emerald-500' : status === 'warning' ? 'text-amber-500' : 'text-red-500'}
                  stopColor="currentColor"
                />
                <stop
                  offset="100%"
                  className={status === 'healthy' ? 'text-green-600' : status === 'warning' ? 'text-orange-600' : 'text-rose-600'}
                  stopColor="currentColor"
                />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-mono">
                {healthFactor > 99 ? '∞' : healthFactor.toFixed(2)}
              </div>
              <div className="text-xs text-white/60">factor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-white/60">Liquidation Risk:</span>
          <span className="text-white font-semibold">
            {status === 'healthy' ? 'Low' : status === 'warning' ? 'Medium' : 'High'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/60">Min Safe Factor:</span>
          <span className="text-white font-mono">1.20</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/60">Liquidation at:</span>
          <span className="text-red-400 font-mono">{'<'}1.00</span>
        </div>
      </div>
    </div>
  );
}
