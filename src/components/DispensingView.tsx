import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Square, CheckCircle2, AlertTriangle, Sparkles, Droplets, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DispensingState } from '../types';

interface DispensingViewProps {
  state: DispensingState;
  onCancel: () => void;
  onDismiss: () => void;
}

export const DispensingView: React.FC<DispensingViewProps> = ({
  state,
  onCancel,
  onDismiss
}) => {
  const isFinished = state.progressPercent >= 100 && !state.isDispensing;
  const isRaspberry = state.drink === 'raspberry_lemonade';

  useEffect(() => {
    if (isFinished) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: isRaspberry ? ['#f43f5e', '#ec4899', '#fbbf24'] : ['#06b6d4', '#3b82f6', '#e0f2fe']
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isFinished, isRaspberry]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow ambient background */}
        <div 
          className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isRaspberry ? 'bg-rose-500' : 'bg-cyan-500'
          }`} 
        />

        {/* Header */}
        <div className="text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-700 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>ARDUINO DISPENSING ENGINE</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isFinished 
              ? 'Drink Ready!' 
              : isRaspberry 
                ? 'Pouring Raspberry Lemonade...' 
                : 'Dispensing Pure Water...'}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {state.stageMessage}
          </p>
        </div>

        {/* Visual Glass & Stream Animation */}
        <div className="my-8 flex flex-col items-center justify-center relative min-h-[260px]">
          
          {/* Top Dispensing Nozzle */}
          <div className="w-10 h-3 bg-zinc-700 rounded-t-sm border-t border-x border-zinc-600 relative z-20 shadow-md"></div>
          
          {/* Pouring Stream (Visible during dispensing) */}
          {state.isDispensing && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 110 }}
              className={`w-2.5 relative z-10 rounded-full shadow-lg ${
                isRaspberry 
                  ? 'bg-gradient-to-b from-rose-400 via-pink-500 to-rose-600 shadow-rose-500/50' 
                  : 'bg-gradient-to-b from-cyan-300 via-blue-400 to-cyan-500 shadow-cyan-500/50'
              }`}
            >
              {/* Stream ripples */}
              <div className="absolute inset-0 opacity-50 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px] animate-pulse"></div>
            </motion.div>
          )}

          {!state.isDispensing && !isFinished && (
            <div className="h-20"></div>
          )}

          {/* The Beverage Glass */}
          <div className="w-36 h-48 sm:w-40 sm:h-52 rounded-b-3xl border-4 border-t-0 border-white/20 bg-white/5 backdrop-blur-xs relative overflow-hidden flex items-end p-1.5 shadow-2xl">
            
            {/* Measurement lines on glass */}
            <div className="absolute left-2 top-6 bottom-6 flex flex-col justify-between z-20 pointer-events-none opacity-40 text-[9px] font-mono text-white select-none">
              <span>- MAX</span>
              <span>- 75%</span>
              <span>- 50%</span>
              <span>- 25%</span>
            </div>

            {/* Rising Liquid */}
            <motion.div
              initial={{ height: '0%' }}
              animate={{ height: `${Math.min(100, Math.max(8, state.progressPercent))}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
              className={`w-full rounded-b-2xl relative overflow-hidden transition-all ${
                isRaspberry 
                  ? 'bg-gradient-to-t from-rose-700 via-pink-600 to-rose-400' 
                  : 'bg-gradient-to-t from-blue-700 via-cyan-600 to-sky-400'
              }`}
            >
              {/* Top Wave surface effect */}
              <div className="absolute top-0 inset-x-0 h-3 bg-white/30 backdrop-blur-xs rounded-full -mt-1.5 transform scale-x-110 animate-pulse"></div>

              {/* Rising bubbles */}
              {state.isDispensing && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <span className="absolute bottom-2 left-1/4 w-2 h-2 rounded-full bg-white/40 animate-ping"></span>
                  <span className="absolute bottom-6 left-2/3 w-2.5 h-2.5 rounded-full bg-white/30 animate-bounce"></span>
                  <span className="absolute bottom-10 left-1/3 w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse"></span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Glass Base coaster */}
          <div className="w-48 sm:w-52 h-3 bg-zinc-800 rounded-full border-t border-zinc-700 mt-1 shadow-md"></div>
        </div>

        {/* Progress Metrics */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Volume Dispensed</span>
            </span>
            <span className="font-mono text-white font-bold text-sm">
              {state.dispensedMl} / {state.totalMl} ml ({Math.round(state.progressPercent)}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
            <motion.div 
              className={`h-full rounded-full transition-all ${
                isRaspberry
                  ? 'bg-gradient-to-r from-rose-500 to-pink-400'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-400'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, state.progressPercent)}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono">
            <span>Elapsed: {state.elapsedSeconds.toFixed(1)}s</span>
            <span>Target: {state.totalSeconds.toFixed(1)}s</span>
          </div>
        </div>

        {/* Active Pump Indicators */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${state.activePumps.includes(1) ? 'bg-cyan-400 animate-ping' : 'bg-zinc-600'}`}></span>
            <span className={state.activePumps.includes(1) ? 'text-cyan-300 font-semibold' : 'text-zinc-500'}>
              Water Pump (D7)
            </span>
          </div>
          {isRaspberry && (
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${state.activePumps.includes(2) ? 'bg-rose-400 animate-ping' : 'bg-zinc-600'}`}></span>
              <span className={state.activePumps.includes(2) ? 'text-rose-300 font-semibold' : 'text-zinc-500'}>
                Raspberry Pump (D8)
              </span>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 pt-2">
          {isFinished ? (
            <button
              id="drink-ready-done-btn"
              type="button"
              onClick={onDismiss}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enjoy Drink & Return</span>
            </button>
          ) : (
            <button
              id="cancel-pour-btn"
              type="button"
              onClick={onCancel}
              className="w-full py-3 px-6 rounded-xl font-semibold text-xs bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Cancel / Stop Dispensing</span>
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
};
