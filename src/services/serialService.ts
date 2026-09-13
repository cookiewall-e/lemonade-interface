import { ConnectionStatus, SerialLogEntry } from '../types';

type MessageCallback = (entry: SerialLogEntry) => void;
type StatusCallback = (status: ConnectionStatus, details?: string) => void;

class SerialService {
  // Web Serial native objects
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private inputDone: any = null;
  private outputDone: any = null;
  private inputStream: any = null;
  private outputStream: any = null;

  private status: ConnectionStatus = 'disconnected';
  private messageListeners: Set<MessageCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private isSimulated: boolean = false;
  private simulatedTimer: any = null;

  constructor() {
    // Check if running in browser
  }

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isConnectedOrSimulated(): boolean {
    return this.status === 'connected' || this.status === 'simulated';
  }

  public addMessageListener(cb: MessageCallback) {
    this.messageListeners.add(cb);
    return () => {
      this.messageListeners.delete(cb);
    };
  }

  public addStatusListener(cb: StatusCallback) {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  private setStatus(status: ConnectionStatus, details?: string) {
    this.status = status;
    this.statusListeners.forEach((cb) => cb(status, details));
  }

  private emitLog(direction: 'TX' | 'RX' | 'SYS', text: string, type?: 'info' | 'success' | 'warn' | 'error') {
    const entry: SerialLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      direction,
      text,
      type,
    };
    this.messageListeners.forEach((cb) => cb(entry));
  }

  /**
   * Connects to the real Arduino Uno via Web Serial API
   */
  public async connectHardware(baudRate: number = 9600): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      this.emitLog('SYS', 'Web Serial API is not supported in this browser. Switching to Simulation Mode.', 'warn');
      this.enableSimulation();
      return false;
    }

    this.setStatus('connecting');
    this.emitLog('SYS', `Requesting USB Serial Port at ${baudRate} baud...`, 'info');

    try {
      // Prompt user to select Arduino Uno serial port
      // Arduino Uno USB VID is typically 0x2341 (official) or 0x1A86 (CH340 clone) or 0x0403 (FTDI)
      const serial = (navigator as any).serial;
      this.port = await serial.requestPort({
        // Optional filters for Arduino Uno
        // We leave empty to allow any serial device or clones
      });

      await this.port.open({ baudRate });

      const textDecoder = new TextDecoderStream();
      this.inputDone = this.port.readable.pipeTo(textDecoder.writable);
      this.inputStream = textDecoder.readable;

      const textEncoder = new TextEncoderStream();
      this.outputDone = textEncoder.readable.pipeTo(this.port.writable);
      this.outputStream = textEncoder.writable;
      this.writer = this.outputStream.getWriter();

      this.isSimulated = false;
      this.setStatus('connected', `Connected via USB Serial (${baudRate} baud)`);
      this.emitLog('SYS', `Successfully connected to Arduino Uno! Baud: ${baudRate}`, 'success');

      // Start listening to incoming data
      this.startReading();

      // Send initial handshake ping
      setTimeout(() => {
        this.send('PING');
      }, 1500);

      return true;
    } catch (err: any) {
      console.error('Serial connection error:', err);
      const errMsg = err?.message || String(err);

      if (err?.name === 'SecurityError' || errMsg.includes('Permissions-Policy') || errMsg.includes('disallowed')) {
        this.emitLog(
          'SYS',
          'USB Serial blocked by iframe permissions policy. Automatically activating Hardware Simulator mode so you can test, or open in a new tab for direct USB access.',
          'warn'
        );
        this.enableSimulation();
        return false;
      }

      if (err?.name === 'NotFoundError') {
        this.emitLog('SYS', 'Serial connection cancelled by user (no port selected).', 'info');
        this.setStatus('disconnected');
        return false;
      }

      this.emitLog('SYS', `Failed to connect: ${errMsg}`, 'error');
      this.setStatus('error', errMsg);
      return false;
    }
  }

  /**
   * Activates hardware simulation mode (allows testing all UI/pumps/pouring without physical Arduino)
   */
  public enableSimulation(): void {
    if (this.port) {
      this.disconnect();
    }
    this.isSimulated = true;
    this.setStatus('simulated', 'Arduino Uno Simulator Mode Active');
    this.emitLog('SYS', 'Arduino Uno Virtual Emulation activated. All dispensing commands will simulate real hardware responses.', 'success');
    
    setTimeout(() => {
      this.emitLog('RX', 'ARDUINO_READY:Drink Dispenser v2.0 [SIMULATED]', 'info');
      this.emitLog('RX', 'PUMPS:1=Water,2=Raspberry,3=Lemon [SIMULATED]', 'info');
    }, 400);
  }

  public disableSimulation(): void {
    this.isSimulated = false;
    this.setStatus('disconnected');
    this.emitLog('SYS', 'Simulator deactivated.', 'info');
  }

  /**
   * Disconnects current port or simulation
   */
  public async disconnect(): Promise<void> {
    if (this.isSimulated) {
      this.disableSimulation();
      return;
    }

    try {
      if (this.reader) {
        await this.reader.cancel();
        await this.inputDone.catch(() => {});
        this.reader = null;
        this.inputDone = null;
      }

      if (this.writer) {
        await this.writer.close();
        await this.outputDone;
        this.writer = null;
        this.outputDone = null;
      }

      if (this.port) {
        await this.port.close();
        this.port = null;
      }

      this.setStatus('disconnected');
      this.emitLog('SYS', 'Arduino Uno disconnected.', 'info');
    } catch (err: any) {
      console.error('Error closing serial port:', err);
      this.setStatus('disconnected');
    }
  }

  /**
   * Send a serial command string to Arduino Uno
   */
  public async send(command: string): Promise<boolean> {
    const formatted = command.trim();
    this.emitLog('TX', formatted, 'info');

    if (this.isSimulated) {
      this.simulateArduinoResponse(formatted);
      return true;
    }

    if (!this.writer) {
      this.emitLog('SYS', 'Cannot send: Serial port is not connected!', 'error');
      return false;
    }

    try {
      await this.writer.write(formatted + '\n');
      return true;
    } catch (err: any) {
      this.emitLog('SYS', `Write error: ${err.message}`, 'error');
      return false;
    }
  }

  private async startReading(): Promise<void> {
    let buffer = '';
    try {
      this.reader = this.inputStream.getReader();
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine) {
              this.handleArduinoMessage(cleanLine);
            }
          }
        }
      }
    } catch (err: any) {
      if (this.status === 'connected') {
        this.emitLog('SYS', `Read error: ${err.message}`, 'error');
      }
    } finally {
      if (this.reader) {
        this.reader.releaseLock();
      }
    }
  }

  private handleArduinoMessage(msg: string) {
    let type: 'info' | 'success' | 'warn' | 'error' = 'info';
    if (msg.startsWith('COMPLETE') || msg.startsWith('START') || msg.startsWith('ARDUINO_READY') || msg.startsWith('PONG')) {
      type = 'success';
    } else if (msg.startsWith('WARN') || msg.startsWith('ESTOP')) {
      type = 'warn';
    } else if (msg.startsWith('ERR')) {
      type = 'error';
    }
    this.emitLog('RX', msg, type);
  }

  /**
   * Realistic Arduino Uno Firmware simulator for offline / preview sandbox
   */
  private simulateArduinoResponse(command: string) {
    clearTimeout(this.simulatedTimer);

    if (command === 'PING') {
      setTimeout(() => {
        this.handleArduinoMessage('PONG:ARDUINO_UNO_OK [SIM]');
      }, 80);
    } else if (command === 'STOP' || command === 'ESTOP') {
      setTimeout(() => {
        this.handleArduinoMessage('ESTOP:ALL_PUMPS_SHUTOFF');
      }, 50);
    } else if (command.startsWith('POUR:WATER:')) {
      const ml = command.split(':')[2] || '250';
      setTimeout(() => {
        this.handleArduinoMessage(`START:WATER:${ml}ML:TIME_MS:5000`);
      }, 100);
      setTimeout(() => {
        this.handleArduinoMessage('PUMP_OFF:WATER');
        this.handleArduinoMessage('COMPLETE:DRINK_READY');
      }, 5200);
    } else if (command.startsWith('POUR:RASP_LEMON:')) {
      const parts = command.split(':');
      const ml = parts[2] || '250';
      const ratio = parts[3] || '30';
      setTimeout(() => {
        this.handleArduinoMessage(`START:RASP_LEMON:TOTAL:${ml}ML:WATER:70%:RASP:${ratio}%`);
      }, 100);
      setTimeout(() => {
        this.handleArduinoMessage('PUMP_OFF:RASPBERRY');
      }, 3500);
      setTimeout(() => {
        this.handleArduinoMessage('PUMP_OFF:WATER');
        this.handleArduinoMessage('COMPLETE:DRINK_READY');
      }, 5300);
    } else if (command.startsWith('PUMP:')) {
      const parts = command.split(':');
      const id = parts[1];
      const state = parts[2];
      setTimeout(() => {
        this.handleArduinoMessage(`MANUAL_PUMP:Pump_${id}:${state}`);
      }, 60);
    }
  }
}

export const serialService = new SerialService();
