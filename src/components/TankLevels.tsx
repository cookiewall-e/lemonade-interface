import React from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Droplet } from 'lucide-react';
import { ReservoirLevel } from '../types';

interface TankLevelsProps {
  reservoirs: Record<string, ReservoirLevel>;
  onRefillTank: (tankId: string) => void;
}

export const TankLevels: React.FC<TankLevelsProps> = ({ reservoirs, onRefillTank }) => {
  return (
    <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <span>Liquid Supply Reservoirs</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitors fluid supply bottles connected to the Arduino pump tubes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {(Object.entries(reservoirs) as [string, ReservoirLevel][]).map(([key, tank]) => {
          const percent = Math.max(0, Math.min(100, Math.round((tank.currentMl / tank.maxCapacityMl) * 100)));
          const isLow = percent < 20;

          return (
            <div
              key={key}
              className={`p-4 rounded-xl border transition-all ${
                isLow
                  ? 'bg-rose-950/20 border-rose-900/60'
                  : 'bg-zinc-950/50 border-zinc-800/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-200">{tank.name}</div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">
                    {tank.currentMl} <span className="text-xs font-normal text-zinc-500">/ {tank.maxCapacityMl} ml</span>
                  </div>
                </div>

                <button
                  id={`refill-${key}-btn`}
                  type="button"
                  onClick={() => onRefillTank(key)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors flex items-center gap-1"
                  title="Reset to 100% full"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="text-[10px]">Refill</span>
                </button>
              </div>

              {/* Tank Level Gauge */}
              <div className="mt-3">
                <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      key === 'water'
                        ? 'bg-cyan-500'
                        : key === 'raspberry'
                          ? 'bg-rose-500'
                          : 'bg-amber-400'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] mt-1.5 font-mono">
                  <span className={isLow ? 'text-rose-400 font-semibold flex items-center gap-1' : 'text-zinc-400'}>
                    {isLow && <AlertTriangle className="w-2.5 h-2.5" />}
                    {percent}% Capacity
                  </span>
                  <span className="text-zinc-500">
                    {isLow ? 'Refill recommended' : 'Sufficient'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
