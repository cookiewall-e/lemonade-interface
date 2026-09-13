import React, { useState } from 'react';
import { Play, Square, Gauge, Wrench, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ArduinoSettings } from '../types';

interface ManualControlsProps {
  settings: ArduinoSettings;
  onUpdateSettings: (newSettings: ArduinoSettings) => void;
  onSendPumpCommand: (pumpId: number, state: boolean) => void;
  onClose: () => void;
}

export const ManualControls: React.FC<ManualControlsProps> = ({
  settings,
  onUpdateSettings,
  onSendPumpCommand,
  onClose
}) => {
  const [activePumpMap, setActivePumpMap] = useState<Record<number, boolean>>({});
  const [calibratingPump, setCalibratingPump] = useState<number | null>(null);
  const [measuredVolume, setMeasuredVolume] = useState<number>(200);
  const [calibrationSeconds, setCalibrationSeconds] = useState<number>(10);
  const [isCalibratingRun, setIsCalibratingRun] = useState<boolean>(false);

  const togglePump = (pumpId: number) => {
    const currentState = !!activePumpMap[pumpId];
    const nextState = !currentState;
    setActivePumpMap(prev => ({ ...prev, [pumpId]: nextState }));
    onSendPumpCommand(pumpId, nextState);
  };

  const primePumpTimed = (pumpId: number, seconds: number = 3) => {
    setActivePumpMap(prev => ({ ...prev, [pumpId]: true }));
    onSendPumpCommand(pumpId, true);

    setTimeout(() => {
      setActivePumpMap(prev => ({ ...prev, [pumpId]: false }));
      onSendPumpCommand(pumpId, false);
    }, seconds * 1000);
  };

  const runCalibrationTest = (pumpId: number) => {
    setIsCalibratingRun(true);
    setActivePumpMap(prev => ({ ...prev, [pumpId]: true }));
    onSendPumpCommand(pumpId, true);

    setTimeout(() => {
      setActivePumpMap(prev => ({ ...prev, [pumpId]: false }));
      onSendPumpCommand(pumpId, false);
      setIsCalibratingRun(false);
    }, calibrationSeconds * 1000);
  };

  const applyCalibration = (pumpId: number) => {
    if (measuredVolume <= 0 || calibrationSeconds <= 0) return;
    const computedRate = parseFloat((measuredVolume / calibrationSeconds).toFixed(1));

    const updated = { ...settings };
    if (pumpId === 1) updated.pumps.pump1.flowRateMlPerSec = computedRate;
    if (pumpId === 2) updated.pumps.pump2.flowRateMlPerSec = computedRate;
    if (pumpId === 3) updated.pumps.pump3.flowRateMlPerSec = computedRate;

    onUpdateSettings(updated);
    setCalibratingPump(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-cyan-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Pump Diagnostics & Calibration
              </h2>
              <p className="text-xs text-zinc-400">
                Prime fluid lines, test relays, and tune flow rate (ml/s)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Individual Pump Testing Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Manual Pump Triggers
            </h3>
            <span className="text-[11px] text-zinc-500">
              Press to toggle pump relay state
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pump 1: Water */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Pump 1: Fresh Water</div>
                  <div className="text-xs text-cyan-400 font-mono mt-0.5">
                    Arduino Pin D{settings.pumps.pump1.pin} • {settings.pumps.pump1.flowRateMlPerSec} ml/s
                  </div>
                </div>
                <span className={`w-3 h-3 rounded-full ${activePumpMap[1] ? 'bg-emerald-400 animate-ping' : 'bg-zinc-700'}`} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => togglePump(1)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    activePumpMap[1]
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  {activePumpMap[1] ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{activePumpMap[1] ? 'Stop Pump' : 'Turn ON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => primePumpTimed(1, 3)}
                  className="py-2 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-cyan-300 text-xs font-medium border border-cyan-800/40"
                  title="Run for 3s to remove air bubbles"
                >
                  Prime (3s)
                </button>

                <button
                  type="button"
                  onClick={() => setCalibratingPump(1)}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                  title="Calibrate flow rate"
                >
                  <Gauge className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pump 2: Raspberry Lemonade */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Pump 2: Raspberry Syrup</div>
                  <div className="text-xs text-rose-400 font-mono mt-0.5">
                    Arduino Pin D{settings.pumps.pump2.pin} • {settings.pumps.pump2.flowRateMlPerSec} ml/s
                  </div>
                </div>
                <span className={`w-3 h-3 rounded-full ${activePumpMap[2] ? 'bg-emerald-400 animate-ping' : 'bg-zinc-700'}`} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => togglePump(2)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    activePumpMap[2]
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  {activePumpMap[2] ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{activePumpMap[2] ? 'Stop Pump' : 'Turn ON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => primePumpTimed(2, 3)}
                  className="py-2 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-rose-300 text-xs font-medium border border-rose-800/40"
                  title="Run for 3s to remove air bubbles"
                >
                  Prime (3s)
                </button>

                <button
                  type="button"
                  onClick={() => setCalibratingPump(2)}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                  title="Calibrate flow rate"
                >
                  <Gauge className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Calibration Wizard Modal Section */}
        {calibratingPump && (
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Gauge className="w-4 h-4" />
                <span>Calibrating Pump {calibratingPump} Flow Rate</span>
              </div>
              <button
                type="button"
                onClick={() => setCalibratingPump(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Place a measuring cup under the dispenser nozzle. Click "Run 10s Test Pour", then enter the exact milliliters collected.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isCalibratingRun}
                onClick={() => runCalibrationTest(calibratingPump)}
                className={`py-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  isCalibratingRun
                    ? 'bg-purple-600 text-white animate-pulse'
                    : 'bg-purple-700 hover:bg-purple-600 text-white'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isCalibratingRun ? 'Running 10s Test...' : 'Run 10s Test Pour'}</span>
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={measuredVolume}
                  onChange={(e) => setMeasuredVolume(Number(e.target.value))}
                  placeholder="Volume collected (ml)"
                  className="w-28 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white font-mono"
                />
                <span className="text-xs text-zinc-400">mL collected</span>
              </div>

              <button
                type="button"
                onClick={() => applyCalibration(calibratingPump)}
                className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold ml-auto"
              >
                Save Rate ({(measuredVolume / calibrationSeconds).toFixed(1)} ml/s)
              </button>
            </div>
          </div>
        )}

        {/* Cleaning & Flush Mode Notice */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-300">Sanitation Tip:</span> After using sugary syrup or lemonade concentrate, place pump suction tubes into warm clean water and run the 3s Prime cycle multiple times to flush and clean the tubing lines.
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
          >
            Close Diagnostics
          </button>
        </div>

      </div>
    </div>
  );
};
