import React, { useState, useEffect, useRef } from 'react';
import { 
  DrinkType, 
  SweetnessLevel, 
  ConnectionStatus, 
  SerialLogEntry, 
  DispensingState, 
  ReservoirLevel, 
  ArduinoSettings 
} from './types';
import { serialService } from './services/serialService';
import { Header } from './components/Header';
import { DrinkSelector } from './components/DrinkSelector';
import { DispensingView } from './components/DispensingView';
import { TankLevels } from './components/TankLevels';
import { SerialMonitor } from './components/SerialMonitor';
import { ManualControls } from './components/ManualControls';
import { ArduinoSetupModal } from './components/ArduinoSetupModal';
import { 
  Sparkles, 
  Droplet, 
  History, 
  Cpu, 
  CheckCircle2, 
  ShieldCheck, 
  Flame,
  Zap
} from 'lucide-react';

const INITIAL_SETTINGS: ArduinoSettings = {
  baudRate: 9600,
  dispenserMode: '2-pump',
  relayActiveLow: true,
  pumps: {
    pump1: {
      id: 1,
      name: 'Water Pump',
      pin: 7,
      flowRateMlPerSec: 25.0,
      activeLow: true,
      color: '#06b6d4',
    },
    pump2: {
      id: 2,
      name: 'Raspberry Syrup Pump',
      pin: 8,
      flowRateMlPerSec: 20.0,
      activeLow: true,
      color: '#f43f5e',
    },
    pump3: {
      id: 3,
      name: 'Lemon Pump',
      pin: 9,
      flowRateMlPerSec: 18.0,
      activeLow: true,
      color: '#f59e0b',
    },
  },
};

const INITIAL_RESERVOIRS: Record<string, ReservoirLevel> = {
  water: {
    id: 'water',
    name: 'Chilled Water Supply',
    currentMl: 1800,
    maxCapacityMl: 2500,
    color: '#06b6d4',
  },
  raspberry: {
    id: 'raspberry',
    name: 'Raspberry Lemonade Syrup',
    currentMl: 850,
    maxCapacityMl: 1000,
    color: '#f43f5e',
  },
  lemon: {
    id: 'lemon',
    name: 'Lemon Juice Concentrate',
    currentMl: 400,
    maxCapacityMl: 500,
    color: '#f59e0b',
  },
};

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [statusDetails, setStatusDetails] = useState<string>('');
  const [serialLogs, setSerialLogs] = useState<SerialLogEntry[]>([]);
  
  // Selection state
  const [selectedDrink, setSelectedDrink] = useState<DrinkType>('raspberry_lemonade');
  const [selectedSize, setSelectedSize] = useState<number>(250);
  const [sweetness, setSweetness] = useState<SweetnessLevel>('balanced');
  
  // Hardware settings & reservoirs
  const [settings, setSettings] = useState<ArduinoSettings>(INITIAL_SETTINGS);
  const [reservoirs, setReservoirs] = useState<Record<string, ReservoirLevel>>(INITIAL_RESERVOIRS);

  // Statistics
  const [drinksHistory, setDrinksHistory] = useState<{ id: string; name: string; ml: number; time: string }[]>([
    { id: '1', name: 'Raspberry Lemonade', ml: 250, time: '10:15 AM' },
    { id: '2', name: 'Pure Water', ml: 350, time: '10:48 AM' },
  ]);

  // Dispensing Engine state
  const [dispensingState, setDispensingState] = useState<DispensingState>({
    isDispensing: false,
    drink: 'raspberry_lemonade',
    totalMl: 250,
    dispensedMl: 0,
    progressPercent: 0,
    stageMessage: 'Ready',
    activePumps: [],
    elapsedSeconds: 0,
    totalSeconds: 10,
  });

  // Modals
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showCodeGuide, setShowCodeGuide] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);

  // Interval reference for dispensing animation
  const dispenseIntervalRef = useRef<any>(null);

  // Hook into Serial Service
  useEffect(() => {
    const unsubStatus = serialService.addStatusListener((status, details) => {
      setConnectionStatus(status);
      if (details) setStatusDetails(details);
    });

    const unsubLogs = serialService.addMessageListener((entry) => {
      setSerialLogs((prev) => [...prev.slice(-150), entry]);
    });

    return () => {
      unsubStatus();
      unsubLogs();
    };
  }, []);

  // Play audio chime using Web Audio API
  const playChime = (type: 'start' | 'complete' | 'stop') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'start') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'complete') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc1.start();
        osc2.start(ctx.currentTime + 0.12);
        osc1.stop(ctx.currentTime + 0.12);
        osc2.stop(ctx.currentTime + 0.4);
      } else if (type === 'stop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // Ignore audio block if user hasn't interacted
    }
  };

  // Start Dispensing Routine
  const handleStartDispense = async () => {
    if (dispensingState.isDispensing) return;

    // Check if connected, or prompt simulator
    if (connectionStatus === 'disconnected') {
      serialService.enableSimulation();
    }

    const isRaspberry = selectedDrink === 'raspberry_lemonade';
    let ratioPercent = 25;
    if (sweetness === 'mild') ratioPercent = 15;
    if (sweetness === 'balanced') ratioPercent = 25;
    if (sweetness === 'sweet') ratioPercent = 35;
    if (sweetness === 'tart') ratioPercent = 20;

    // Calculate duration in seconds
    const waterFlow = settings.pumps.pump1.flowRateMlPerSec || 25;
    const raspFlow = settings.pumps.pump2.flowRateMlPerSec || 20;
    
    const waterVolume = isRaspberry ? (selectedSize * (100 - ratioPercent)) / 100 : selectedSize;
    const raspVolume = isRaspberry ? (selectedSize * ratioPercent) / 100 : 0;

    const timeWaterSec = waterVolume / waterFlow;
    const timeRaspSec = raspVolume / raspFlow;
    const totalDurationSec = Math.max(timeWaterSec, timeRaspSec, 4);

    // Send serial command to Arduino Uno
    const serialCommand = isRaspberry
      ? `POUR:RASP_LEMON:${selectedSize}:${ratioPercent}`
      : `POUR:WATER:${selectedSize}`;

    await serialService.send(serialCommand);
    playChime('start');

    // Initialize dispensing state
    setDispensingState({
      isDispensing: true,
      drink: selectedDrink,
      totalMl: selectedSize,
      dispensedMl: 0,
      progressPercent: 0,
      stageMessage: isRaspberry ? 'Initiating pumps for Raspberry Lemonade...' : 'Initiating pure water pump...',
      activePumps: isRaspberry ? [1, 2] : [1],
      elapsedSeconds: 0,
      totalSeconds: totalDurationSec,
    });
    setShowDispenseModal(true);

    // Start tick timer
    const startTime = Date.now();
    clearInterval(dispenseIntervalRef.current);

    dispenseIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(100, (elapsed / totalDurationSec) * 100);
      const currentDispensed = Math.min(selectedSize, Math.round((progress / 100) * selectedSize));

      let stageMsg = isRaspberry 
        ? 'Dispensing cold water and fresh raspberry syrup...' 
        : 'Dispensing filtered drinking water...';

      if (progress > 85 && progress < 100) {
        stageMsg = 'Final drops dispensing...';
      } else if (progress >= 100) {
        stageMsg = 'Dispense complete! Enjoy your drink.';
      }

      setDispensingState((prev) => ({
        ...prev,
        dispensedMl: currentDispensed,
        progressPercent: progress,
        elapsedSeconds: elapsed,
        stageMessage: stageMsg,
      }));

      if (progress >= 100) {
        clearInterval(dispenseIntervalRef.current);
        playChime('complete');
        setDispensingState((prev) => ({
          ...prev,
          isDispensing: false,
          progressPercent: 100,
          dispensedMl: selectedSize,
          activePumps: [],
          stageMessage: 'Your beverage is ready to drink!',
        }));

        // Deduct from reservoirs
        setReservoirs((prev) => ({
          ...prev,
          water: {
            ...prev.water,
            currentMl: Math.max(0, prev.water.currentMl - Math.round(waterVolume)),
          },
          raspberry: {
            ...prev.raspberry,
            currentMl: Math.max(0, prev.raspberry.currentMl - Math.round(raspVolume)),
          },
        }));

        // Log to history
        setDrinksHistory((prev) => [
          {
            id: Math.random().toString(36).substring(2, 7),
            name: isRaspberry ? 'Raspberry Lemonade' : 'Pure Water',
            ml: selectedSize,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 7),
        ]);
      }
    }, 80);
  };

  // Emergency Stop Handler
  const handleEmergencyStop = async () => {
    clearInterval(dispenseIntervalRef.current);
    playChime('stop');
    await serialService.send('STOP');

    setDispensingState((prev) => ({
      ...prev,
      isDispensing: false,
      activePumps: [],
      stageMessage: 'Emergency stop activated! All pumps shut off.',
    }));
  };

  // Manual Pump Command
  const handleSendPumpCommand = async (pumpId: number, state: boolean) => {
    await serialService.send(`PUMP:${pumpId}:${state ? 'ON' : 'OFF'}`);
  };

  // Refill a tank
  const handleRefillTank = (tankId: string) => {
    setReservoirs((prev) => {
      const tank = prev[tankId];
      if (!tank) return prev;
      return {
        ...prev,
        [tankId]: {
          ...tank,
          currentMl: tank.maxCapacityMl,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* App Header */}
      <Header
        connectionStatus={connectionStatus}
        statusDetails={statusDetails}
        onConnectUsb={(baud) => serialService.connectHardware(baud)}
        onToggleSimulator={() => {
          if (connectionStatus === 'simulated') {
            serialService.disconnect();
          } else {
            serialService.enableSimulation();
          }
        }}
        onDisconnect={() => serialService.disconnect()}
        onEmergencyStop={handleEmergencyStop}
        onOpenCodeGuide={() => setShowCodeGuide(true)}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
        isDispensing={dispensingState.isDispensing}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Notice for new users if disconnected */}
        {connectionStatus === 'disconnected' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-rose-950/60 border border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-900/50 border border-cyan-700/60 flex items-center justify-center text-cyan-300 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Connect Your Arduino Uno
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Plug your Arduino Uno via USB, or test the entire dispensing experience right now in Simulator Mode.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => serialService.enableSimulation()}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Run Simulator</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCodeGuide(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Wiring & Code</span>
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Grid: Left Drink Selection & Center Pouring, Right Gauges & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main 2 Cols: Drink Selector */}
          <div className="lg:col-span-2 space-y-6">
            <DrinkSelector
              selectedDrink={selectedDrink}
              onSelectDrink={setSelectedDrink}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              sweetness={sweetness}
              onChangeSweetness={setSweetness}
              onStartDispense={handleStartDispense}
              isDispensing={dispensingState.isDispensing}
              isConnected={serialService.isConnectedOrSimulated()}
              reservoirs={reservoirs}
            />

            {/* Serial Monitor Bar */}
            <SerialMonitor
              logs={serialLogs}
              onSendCommand={(cmd) => serialService.send(cmd)}
              onClearLogs={() => setSerialLogs([])}
              isConnected={serialService.isConnectedOrSimulated()}
            />
          </div>

          {/* Right Column: Tank Levels & Beverage History */}
          <div className="space-y-6">
            
            {/* Supply Reservoirs */}
            <TankLevels
              reservoirs={reservoirs}
              onRefillTank={handleRefillTank}
            />

            {/* Recent Dispensed Log */}
            <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-md space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <History className="w-4 h-4 text-rose-400" />
                  <span>Recent Dispenses</span>
                </h3>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {drinksHistory.length} made
                </span>
              </div>

              <div className="space-y-2">
                {drinksHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {item.name.includes('Raspberry') ? '🍓' : '💧'}
                      </span>
                      <div>
                        <div className="font-semibold text-zinc-200">{item.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{item.time}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {item.ml} ml
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hardware Status Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>System Safeguards Active</span>
              </div>
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                <li>• 45-second hardware safety auto-cutoff in Arduino sketch</li>
                <li>• Instant non-blocking Serial Emergency Stop (`STOP` / `ESTOP`)</li>
                <li>• Optocoupled relay isolation protects Arduino Uno logic</li>
              </ul>
            </div>

          </div>

        </div>

      </main>

      {/* Interactive Dispensing Modal */}
      {showDispenseModal && (
        <DispensingView
          state={dispensingState}
          onCancel={handleEmergencyStop}
          onDismiss={() => setShowDispenseModal(false)}
        />
      )}

      {/* Diagnostics / Pump Priming Modal */}
      {showDiagnostics && (
        <ManualControls
          settings={settings}
          onUpdateSettings={setSettings}
          onSendPumpCommand={handleSendPumpCommand}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* Arduino Firmware & Wiring Modal */}
      {showCodeGuide && (
        <ArduinoSetupModal
          settings={settings}
          onClose={() => setShowCodeGuide(false)}
        />
      )}

    </div>
  );
}
