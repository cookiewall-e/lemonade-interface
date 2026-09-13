import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Cpu, 
  Zap, 
  Layers, 
  HelpCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { ArduinoSettings } from '../types';
import { generateArduinoSketch } from '../utils/arduinoSketch';

interface ArduinoSetupModalProps {
  settings: ArduinoSettings;
  onClose: () => void;
}

export const ArduinoSetupModal: React.FC<ArduinoSetupModalProps> = ({
  settings,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'wiring' | 'guide'>('code');
  const [copied, setCopied] = useState(false);

  const sketchCode = generateArduinoSketch(settings);

  const handleCopy = () => {
    navigator.clipboard.writeText(sketchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sketchCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DrinkDispenser.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl space-y-5 my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Arduino Uno Setup & Firmware
              </h2>
              <p className="text-xs text-zinc-400">
                Flash your Arduino Uno and connect 12V relays for automatic beverage pouring
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

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'code'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Arduino Sketch (.ino)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wiring')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'wiring'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Wiring Diagram & Relays
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'guide'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Connection Steps
          </button>
        </div>

        {/* Tab 1: Code View */}
        {activeTab === 'code' && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-400 font-mono">
                DrinkDispenser.ino • Ready to paste into Arduino IDE
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ino</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-black/80 rounded-xl p-4 border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed select-all">
              <pre>{sketchCode}</pre>
            </div>
          </div>
        )}

        {/* Tab 2: Wiring Diagram */}
        {activeTab === 'wiring' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Pinout & Circuit Architecture</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="font-semibold text-cyan-400">Arduino Uno Pinout</div>
                  <ul className="mt-1.5 space-y-1 font-mono text-zinc-300 text-[11px]">
                    <li>• <span className="text-white font-bold">Pin D7</span>: Relay 1 IN (Water Pump)</li>
                    <li>• <span className="text-white font-bold">Pin D8</span>: Relay 2 IN (Raspberry Pump)</li>
                    <li>• <span className="text-white font-bold">5V Pin</span>: Relay VCC</li>
                    <li>• <span className="text-white font-bold">GND Pin</span>: Relay GND & 12V PSU GND</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="font-semibold text-amber-400">12V Power & Relay Wiring</div>
                  <ul className="mt-1.5 space-y-1 font-mono text-zinc-300 text-[11px]">
                    <li>• <span className="text-white">12V (+)</span> → Relay COM Terminal</li>
                    <li>• <span className="text-white">Relay NO</span> → Pump (+) Lead</li>
                    <li>• <span className="text-white">Pump (-)</span> → 12V Power Supply (-)</li>
                    <li>• <span className="text-rose-400 font-bold">Common GND</span>: Tie Arduino GND to 12V (-)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommended Hardware */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Recommended Bill of Materials (BOM)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <div className="font-semibold text-zinc-200">1. Arduino Uno</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Arduino Uno R3 or R4 or clone with USB cable</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <div className="font-semibold text-zinc-200">2. 2-Channel Relay Board</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">5V optocoupled relay module (Active LOW)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <div className="font-semibold text-zinc-200">3. 12V Food-Grade Pumps</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">12V peristaltic or diaphragm pumps + silicone tubing</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Step-by-Step Guide */}
        {activeTab === 'guide' && (
          <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
            <div className="space-y-3">
              {[
                {
                  step: '1',
                  title: 'Upload Sketch to Arduino',
                  desc: 'Open the Arduino IDE, paste the sketch code above, select Board: "Arduino Uno", choose your COM port, and click Upload.'
                },
                {
                  step: '2',
                  title: 'Wire the Relays & Pumps',
                  desc: 'Connect Pin D7 to the Water Relay and Pin D8 to the Raspberry Lemonade Relay. Connect pump power through the relay NO (Normally Open) contacts.'
                },
                {
                  step: '3',
                  title: 'Connect Web App over USB',
                  desc: 'Plug the Arduino USB cable into your computer. Click "Connect USB" in the top bar of this web app and select your Arduino serial port at 9600 baud.'
                },
                {
                  step: '4',
                  title: 'Prime & Dispense',
                  desc: 'Click "Pumps" to prime the lines with fluid, then choose your Raspberry Lemonade or Water and press Dispense!'
                }
              ].map((s) => (
                <div key={s.step} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-200 font-bold flex items-center justify-center shrink-0 text-xs">
                    {s.step}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{s.title}</div>
                    <div className="text-zinc-400 mt-0.5 leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-200 flex items-start gap-2 text-xs">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Note for Preview Environments:</span> Some web browsers restrict Web Serial access inside embedded iframes. If the browser prompts that USB is blocked, you can use the built-in <strong className="text-cyan-300">Simulator Mode</strong> to test all features instantly, or open the app in a standalone tab!
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
