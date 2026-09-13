import React, { useState } from 'react';
import { 
  Droplet, 
  Sparkles, 
  Flame, 
  Info, 
  Clock, 
  Check, 
  Sliders, 
  GlassWater,
  AlertCircle,
  Zap,
  CupSoda
} from 'lucide-react';
import { DrinkType, SweetnessLevel, DrinkSize, ReservoirLevel } from '../types';

interface DrinkSelectorProps {
  selectedDrink: DrinkType;
  onSelectDrink: (drink: DrinkType) => void;
  selectedSize: number;
  onSelectSize: (ml: number) => void;
  sweetness: SweetnessLevel;
  onChangeSweetness: (level: SweetnessLevel) => void;
  onStartDispense: () => void;
  isDispensing: boolean;
  isConnected: boolean;
  reservoirs: Record<string, ReservoirLevel>;
}

const PRESET_SIZES: DrinkSize[] = [
  { id: 'sm', name: 'Small Cup', volumeMl: 150, iconSize: 'sm' },
  { id: 'md', name: 'Regular Glass', volumeMl: 250, iconSize: 'md' },
  { id: 'lg', name: 'Large Tumbler', volumeMl: 350, iconSize: 'lg' },
];

export const DrinkSelector: React.FC<DrinkSelectorProps> = ({
  selectedDrink,
  onSelectDrink,
  selectedSize,
  onSelectSize,
  sweetness,
  onChangeSweetness,
  onStartDispense,
  isDispensing,
  isConnected,
  reservoirs
}) => {
  const [isCustomSize, setIsCustomSize] = useState(false);

  // Compute ingredient breakdown for Raspberry Lemonade
  const getRecipeRatios = (level: SweetnessLevel) => {
    switch (level) {
      case 'mild':
        return { water: 80, raspberry: 15, lemon: 5, label: 'Light Berry (Subtle & Crisp)' };
      case 'balanced':
        return { water: 70, raspberry: 20, lemon: 10, label: 'Classic Refreshment (Perfect Harmony)' };
      case 'sweet':
        return { water: 60, raspberry: 30, lemon: 10, label: 'Rich & Sweet (Intense Raspberry)' };
      case 'tart':
        return { water: 65, raspberry: 15, lemon: 20, label: 'Extra Tart & Zesty (Lemon Kick)' };
    }
  };

  const currentRatio = getRecipeRatios(sweetness);

  const waterMl = selectedDrink === 'water' 
    ? selectedSize 
    : Math.round((selectedSize * currentRatio.water) / 100);

  const raspberryMl = selectedDrink === 'water' 
    ? 0 
    : Math.round((selectedSize * currentRatio.raspberry) / 100);

  const lemonMl = selectedDrink === 'water' 
    ? 0 
    : Math.round((selectedSize * currentRatio.lemon) / 100);

  // Check tank sufficiency
  const waterOk = (reservoirs.water?.currentMl || 0) >= waterMl;
  const raspberryOk = selectedDrink === 'water' || (reservoirs.raspberry?.currentMl || 0) >= raspberryMl;
  const tanksOk = waterOk && raspberryOk;

  // Approximate flow rate 25ml/s
  const estimatedTimeSec = Math.max(3, Math.ceil(selectedSize / 25));

  return (
    <div className="w-full space-y-6">
      {/* Main Drink Cards Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* OPTION 1: Raspberry Lemonade */}
        <div
          id="select-raspberry-lemonade-card"
          onClick={() => onSelectDrink('raspberry_lemonade')}
          className={`relative cursor-pointer rounded-2xl p-5 sm:p-6 transition-all duration-200 border-2 overflow-hidden group ${
            selectedDrink === 'raspberry_lemonade'
              ? 'bg-gradient-to-br from-rose-950/60 via-pink-950/40 to-zinc-900 border-rose-500 shadow-xl shadow-rose-950/40'
              : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
          }`}
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-400 flex items-center justify-center text-2xl shadow-md shadow-rose-600/30">
              🍓
            </div>
            {selectedDrink === 'raspberry_lemonade' ? (
              <div className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Selected</span>
              </div>
            ) : (
              <span className="text-xs text-zinc-500 group-hover:text-zinc-400">Click to choose</span>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Raspberry Lemonade
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
              Infused with natural raspberry syrup, freshly squeezed lemon concentrate, and pure chilled water.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-zinc-800/80">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/50">
              Sweet & Tangy
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/50">
              Custom Sweetness
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-pink-950/60 text-pink-300 border border-pink-800/50">
              Auto-Blended
            </span>
          </div>
        </div>

        {/* OPTION 2: Pure Water */}
        <div
          id="select-water-card"
          onClick={() => onSelectDrink('water')}
          className={`relative cursor-pointer rounded-2xl p-5 sm:p-6 transition-all duration-200 border-2 overflow-hidden group ${
            selectedDrink === 'water'
              ? 'bg-gradient-to-br from-cyan-950/60 via-blue-950/40 to-zinc-900 border-cyan-500 shadow-xl shadow-cyan-950/40'
              : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
              <Droplet className="w-6 h-6 fill-cyan-200" />
            </div>
            {selectedDrink === 'water' ? (
              <div className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-300 text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Selected</span>
              </div>
            ) : (
              <span className="text-xs text-zinc-500 group-hover:text-zinc-400">Click to choose</span>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Pure Chilled Water
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
              Crystal-clear, filtered drinking water dispensed at high precision straight into your cup.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-zinc-800/80">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
              100% Hydration
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/50">
              Zero Calories
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-950/60 text-sky-300 border border-sky-800/50">
              Rapid Flow
            </span>
          </div>
        </div>

      </div>

      {/* Drink Customization Section */}
      <div className="bg-zinc-900/90 rounded-2xl p-5 sm:p-6 border border-zinc-800 shadow-md space-y-6">
        
        {/* Flavor Profile (Only for Raspberry Lemonade) */}
        {selectedDrink === 'raspberry_lemonade' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>Recipe Flavor Profile</span>
              </label>
              <span className="text-xs text-rose-300 font-medium bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                {currentRatio.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'mild', title: 'Mild & Crisp', desc: '15% Raspberry', icon: '🍃' },
                { id: 'balanced', title: 'Classic Blend', desc: '20% Raspberry', icon: '⭐' },
                { id: 'sweet', title: 'Sweet Berry', desc: '30% Raspberry', icon: '🍓' },
                { id: 'tart', title: 'Extra Zesty', desc: '20% Lemon kick', icon: '🍋' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  id={`flavor-${opt.id}-btn`}
                  type="button"
                  onClick={() => onChangeSweetness(opt.id as SweetnessLevel)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    sweetness === opt.id
                      ? 'bg-rose-950/60 border-rose-500 text-rose-100 shadow-sm'
                      : 'bg-zinc-800/60 border-zinc-700/60 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="text-base">{opt.icon}</div>
                  <div className="text-xs font-semibold mt-1">{opt.title}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cup Volume / Size Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <GlassWater className="w-4 h-4 text-cyan-400" />
              <span>Pour Volume</span>
            </label>
            <span className="text-xs text-cyan-300 font-mono font-semibold bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-800/50">
              {selectedSize} mL
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {PRESET_SIZES.map((size) => {
              const isSelected = !isCustomSize && selectedSize === size.volumeMl;
              return (
                <button
                  key={size.id}
                  id={`size-${size.id}-btn`}
                  type="button"
                  onClick={() => {
                    setIsCustomSize(false);
                    onSelectSize(size.volumeMl);
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-zinc-800 border-cyan-500 text-cyan-200 shadow-sm'
                      : 'bg-zinc-800/50 border-zinc-700/60 hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="text-xs font-medium">{size.name}</div>
                  <div className="text-base font-bold text-white font-mono">{size.volumeMl} <span className="text-xs font-normal text-zinc-400">ml</span></div>
                </button>
              );
            })}
          </div>

          {/* Custom ml slider */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>Custom Volume Slider</span>
              </span>
              <span className="font-mono">{selectedSize} ml (~{Math.round(selectedSize * 0.0338)} oz)</span>
            </div>
            <input
              id="volume-slider"
              type="range"
              min="50"
              max="500"
              step="25"
              value={selectedSize}
              onChange={(e) => {
                setIsCustomSize(true);
                onSelectSize(Number(e.target.value));
              }}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
              <span>50 ml (Shot)</span>
              <span>250 ml (Glass)</span>
              <span>500 ml (Bottle)</span>
            </div>
          </div>
        </div>

        {/* Live Recipe Breakdown Banner */}
        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-medium text-zinc-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span>Estimated Recipe Proportions:</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] flex-wrap">
              <span className="text-cyan-400">Water: {waterMl}ml</span>
              {selectedDrink === 'raspberry_lemonade' && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-rose-400">Raspberry Syrup: {raspberryMl}ml</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-amber-300">Lemon: {lemonMl}ml</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-400 shrink-0">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Est. Pour Time: ~{estimatedTimeSec}s</span>
          </div>
        </div>

        {/* Tank Level Warning if insufficient */}
        {!tanksOk && (
          <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Warning: One or more ingredient tanks are running low for a {selectedSize}ml pour. Please refill or reduce cup size.
            </span>
          </div>
        )}

        {/* Big Dispense Button */}
        <div className="pt-2">
          <button
            id="start-dispense-btn"
            type="button"
            disabled={isDispensing}
            onClick={onStartDispense}
            className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-200 shadow-xl flex items-center justify-center gap-3 active:scale-[0.99] ${
              selectedDrink === 'raspberry_lemonade'
                ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/50 ring-1 ring-rose-400/30'
                : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/50 ring-1 ring-cyan-400/30'
            }`}
          >
            {selectedDrink === 'raspberry_lemonade' ? (
              <CupSoda className="w-5 h-5 animate-pulse" />
            ) : (
              <Droplet className="w-5 h-5 animate-pulse" />
            )}
            <span>
              {isDispensing
                ? 'DISPENSING IN PROGRESS...'
                : `DISPENSE ${selectedSize}mL ${selectedDrink === 'raspberry_lemonade' ? 'RASPBERRY LEMONADE' : 'WATER'}`}
            </span>
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          </button>

          {!isConnected && (
            <p className="text-center text-[11px] text-zinc-500 mt-2">
              Note: Connect Arduino Uno via USB Serial in the header, or run in virtual Simulator mode to test!
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
