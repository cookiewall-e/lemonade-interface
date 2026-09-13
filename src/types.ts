export type DrinkType = 'water' | 'raspberry_lemonade';

export type SweetnessLevel = 'mild' | 'balanced' | 'sweet' | 'tart';

export type DispenserMode = '2-pump' | '3-pump';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'simulated' | 'error';

export interface DrinkSize {
  id: string;
  name: string;
  volumeMl: number;
  iconSize: 'sm' | 'md' | 'lg';
}

export interface DrinkRecipe {
  waterPercent: number;
  raspberryPercent: number;
  lemonPercent: number;
}

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  direction: 'TX' | 'RX' | 'SYS';
  text: string;
  type?: 'info' | 'success' | 'warn' | 'error';
}

export interface DispensingState {
  isDispensing: boolean;
  drink: DrinkType;
  totalMl: number;
  dispensedMl: number;
  progressPercent: number;
  stageMessage: string;
  activePumps: number[]; // e.g. [1], [2], [1, 2]
  elapsedSeconds: number;
  totalSeconds: number;
}

export interface PumpConfig {
  id: number;
  name: string;
  pin: number;
  flowRateMlPerSec: number; // typically 15-30 ml/sec for 12V peristaltic/diaphragm pumps
  activeLow: boolean; // Most Arduino relay boards are Active LOW
  color: string;
}

export interface ReservoirLevel {
  id: string;
  name: string;
  currentMl: number;
  maxCapacityMl: number;
  color: string;
}

export interface ArduinoSettings {
  baudRate: number;
  dispenserMode: DispenserMode;
  relayActiveLow: boolean;
  pumps: {
    pump1: PumpConfig; // Water
    pump2: PumpConfig; // Raspberry Lemonade or Syrup
    pump3: PumpConfig; // Lemon (if 3-pump)
  };
}
