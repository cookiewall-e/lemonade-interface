import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { SerialLogEntry } from '../types';

interface SerialMonitorProps {
  logs: SerialLogEntry[];
  onSendCommand: (cmd: string) => void;
  onClearLogs: () => void;
  isConnected: boolean;
}

export const SerialMonitor: React.FC<SerialMonitorProps> = ({
  logs,
  onSendCommand,
  onClearLogs,
  isConnected
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputCmd, setInputCmd] = useState('');
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCmd.trim()) return;
    onSendCommand(inputCmd.trim());
    setInputCmd('');
  };

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.direction}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg transition-all">
      {/* Header bar toggle */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-3 bg-zinc-950/80 flex items-center justify-between cursor-pointer hover:bg-zinc-950 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
            Arduino Serial Monitor (UART / USB)
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="text-zinc-400 hover:text-zinc-200 text-xs p-1"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Terminal */}
      {isOpen && (
        <div className="p-4 space-y-3 border-t border-zinc-800 bg-zinc-950 font-mono text-xs">
          
          {/* Quick Command Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-zinc-500 mr-1">Quick:</span>
            {[
              { label: 'PING', cmd: 'PING' },
              { label: 'STOP ALL', cmd: 'STOP' },
              { label: 'WATER 100ml', cmd: 'POUR:WATER:100' },
              { label: 'RASPBERRY 100ml', cmd: 'POUR:RASP_LEMON:100:30' },
              { label: 'PUMP 1 ON', cmd: 'PUMP:1:ON' },
              { label: 'PUMP 1 OFF', cmd: 'PUMP:1:OFF' },
              { label: 'PUMP 2 ON', cmd: 'PUMP:2:ON' },
              { label: 'PUMP 2 OFF', cmd: 'PUMP:2:OFF' },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => onSendCommand(btn.cmd)}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-[10px] transition-colors"
              >
                {btn.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyLogs}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] flex items-center gap-1"
                title="Copy log to clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={onClearLogs}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] flex items-center gap-1"
                title="Clear log"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Console Log Output */}
          <div className="h-48 overflow-y-auto rounded-lg bg-black/60 p-3 border border-zinc-800/80 space-y-1.5 font-mono text-[11px] leading-relaxed">
            {logs.length === 0 ? (
              <div className="text-zinc-600 italic text-center py-8">
                No serial events yet. Connect Arduino Uno or dispense a drink to see UART logs.
              </div>
            ) : (
              logs.map((log) => {
                let badgeColor = 'text-zinc-400 bg-zinc-900';
                let textColor = 'text-zinc-300';

                if (log.direction === 'TX') {
                  badgeColor = 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/60';
                  textColor = 'text-cyan-200';
                } else if (log.direction === 'RX') {
                  badgeColor = 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60';
                  textColor = 'text-emerald-200';
                } else if (log.direction === 'SYS') {
                  badgeColor = 'text-purple-400 bg-purple-950/60 border border-purple-800/60';
                  textColor = log.type === 'error' ? 'text-rose-300' : log.type === 'warn' ? 'text-amber-300' : 'text-zinc-400';
                }

                return (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-zinc-600 select-none text-[10px] pt-0.5">{log.timestamp}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${badgeColor}`}>
                      {log.direction}
                    </span>
                    <span className={`break-all ${textColor}`}>
                      {log.text}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>

          {/* Command Input Bar */}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              id="serial-cmd-input"
              type="text"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              placeholder="Send custom serial command (e.g. POUR:WATER:200 or PUMP:1:ON)..."
              className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-xs font-mono"
            />
            <button
              id="send-serial-btn"
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
