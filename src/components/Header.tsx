import React, { useState } from 'react';
import { 
  Usb, 
  Play, 
  Square, 
  Settings, 
  Code2, 
  Activity, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { ConnectionStatus } from '../types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  statusDetails?: string;
  onConnectUsb: (baudRate: number) => void;
  onToggleSimulator: () => void;
  onDisconnect: () => void;
  onEmergencyStop: () => void;
  onOpenCodeGuide: () => void;
  onOpenDiagnostics: () => void;
  isDispensing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  statusDetails,
  onConnectUsb,
  onToggleSimulator,
  onDisconnect,
  onEmergencyStop,
  onOpenCodeGuide,
  onOpenDiagnostics,
  isDispensing
}) => {
  const [showBaudMenu, setShowBaudMenu] = useState(false);
  const [selectedBaud, setSelectedBaud] = useState(9600);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wide">ARDUINO UNO CONNECTED</span>
            <span className="text-emerald-400/70 text-[11px]">({selectedBaud} baud)</span>
          </div>
        );
      case 'simulated':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-purple-400"></span>
            <span className="font-semibold tracking-wide">SIMULATOR ACTIVE</span>
            <span className="text-purple-400/70 text-[11px]">(Emulated Uno)</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide">CONNECTING...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold tracking-wide">PORT ERROR</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-zinc-500"></span>
            <span className="tracking-wide">ARDUINO OFFLINE</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-500/20 text-white font-bold">
              <span className="text-base tracking-tighter">🍹</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                  AquaBerry Dispenser
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Arduino Uno
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-normal mt-0.5">
                Automated Raspberry Lemonade & Pure Water Station
              </p>
            </div>
          </div>

          <div className="md:hidden">
            {getStatusBadge()}
          </div>
        </div>

        {/* Center: Connection status on desktop */}
        <div className="hidden md:flex items-center gap-3">
          {getStatusBadge()}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Emergency Stop Button */}
          <button
            id="emergency-stop-btn"
            type="button"
            onClick={onEmergencyStop}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-md active:scale-95 ${
              isDispensing
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-2 ring-rose-400 ring-offset-2 ring-offset-zinc-950'
                : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60'
            }`}
            title="Immediately cuts power to all pumps"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>EMERGENCY STOP</span>
          </button>

          {/* Connection Trigger Menu */}
          {connectionStatus === 'connected' || connectionStatus === 'simulated' ? (
            <button
              id="disconnect-arduino-btn"
              type="button"
              onClick={onDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          ) : (
            <div className="relative">
              <div className="inline-flex rounded-lg shadow-sm">
                <button
                  id="connect-arduino-btn"
                  type="button"
                  onClick={() => onConnectUsb(selectedBaud)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Usb className="w-3.5 h-3.5" />
                  <span>Connect USB</span>
                </button>
                <button
                  id="baud-menu-btn"
                  type="button"
                  onClick={() => setShowBaudMenu(!showBaudMenu)}
                  className="px-1.5 py-1.5 rounded-r-lg bg-emerald-700 hover:bg-emerald-600 text-emerald-100 border-l border-emerald-800 text-xs transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {showBaudMenu && (
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-zinc-900 border border-zinc-700 shadow-xl py-1.5 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Select Baud Rate
                  </div>
                  {[9600, 115200, 57600].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setSelectedBaud(rate);
                        setShowBaudMenu(false);
                        onConnectUsb(rate);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-800 ${
                        selectedBaud === rate ? 'text-emerald-400 font-semibold' : 'text-zinc-300'
                      }`}
                    >
                      <span>{rate} baud</span>
                      {selectedBaud === rate && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                  ))}
                  <div className="h-px bg-zinc-800 my-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBaudMenu(false);
                      onToggleSimulator();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-950/40 flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <span>Run Hardware Simulator</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick simulator shortcut if disconnected */}
          {connectionStatus === 'disconnected' && (
            <button
              id="quick-sim-btn"
              type="button"
              onClick={onToggleSimulator}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 text-xs font-medium border border-purple-800/40 transition-colors"
              title="Test the interface with virtual Arduino responses"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Simulate</span>
            </button>
          )}

          {/* Diagnostics / Manual Pump Test */}
          <button
            id="diagnostics-btn"
            type="button"
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors"
            title="Manual pump priming and calibration"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Pumps</span>
          </button>

          {/* Arduino Code & Wiring Guide */}
          <button
            id="open-code-guide-btn"
            type="button"
            onClick={onOpenCodeGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-300 text-xs font-semibold border border-cyan-800/40 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Arduino Sketch (.ino)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
