import { ArduinoSettings } from '../types';

export function generateArduinoSketch(settings: ArduinoSettings): string {
  const p1 = settings.pumps.pump1;
  const p2 = settings.pumps.pump2;
  const p3 = settings.pumps.pump3;
  const is3Pump = settings.dispenserMode === '3-pump';
  const relayOn = settings.relayActiveLow ? 'LOW' : 'HIGH';
  const relayOff = settings.relayActiveLow ? 'HIGH' : 'LOW';

  return `/*
  =============================================================
  ARDUINO UNO SMART DRINK DISPENSER
  Target Board: Arduino Uno (ATmega328P) or Uno R4 / Compatible
  Compatible with: Automated Drink Dispenser Web Interface
  =============================================================
  Hardware Setup:
  - Relay 1 (Water Pump): Pin D${p1.pin}
  - Relay 2 (Raspberry ${is3Pump ? 'Syrup' : 'Lemonade'} Pump): Pin D${p2.pin}${is3Pump ? `\n  - Relay 3 (Lemon Juice Pump): Pin D${p3.pin}` : ''}
  - Status LED: Pin 13 (Built-in)
  - Power: 12V DC Adapter connected to Relay COM terminals
  - Ground: Arduino GND connected to 12V PSU GND & Relay GND
  =============================================================
*/

// --- PIN ASSIGNMENTS ---
const int PIN_PUMP_WATER = ${p1.pin};      // Pump 1: Water
const int PIN_PUMP_RASPBERRY = ${p2.pin};  // Pump 2: Raspberry ${is3Pump ? 'Syrup' : 'Lemonade'}
${is3Pump ? `const int PIN_PUMP_LEMON = ${p3.pin};      // Pump 3: Lemon Juice\n` : ''}const int PIN_STATUS_LED = 13;

// --- RELAY LOGIC (Active ${settings.relayActiveLow ? 'LOW (Most optocoupled relay modules)' : 'HIGH'}) ---
const int RELAY_ON = ${relayOn};
const int RELAY_OFF = ${relayOff};

// --- CALIBRATED FLOW RATES (Milliliters per Second) ---
// Adjust these to match your specific 12V pumps
float FLOW_RATE_WATER = ${p1.flowRateMlPerSec.toFixed(1)}f;     // ml/sec
float FLOW_RATE_RASPBERRY = ${p2.flowRateMlPerSec.toFixed(1)}f; // ml/sec
${is3Pump ? `float FLOW_RATE_LEMON = ${p3.flowRateMlPerSec.toFixed(1)}f;     // ml/sec\n` : ''}
// --- DISPENSING ENGINE STATE ---
enum SystemState {
  STATE_IDLE,
  STATE_POURING,
  STATE_ERROR
};

SystemState currentState = STATE_IDLE;

// Non-blocking pump execution timers
struct PumpTimer {
  int pin;
  bool active;
  unsigned long durationMs;
  unsigned long startMs;
  String name;
};

PumpTimer pumpWater = {PIN_PUMP_WATER, false, 0, 0, "Water"};
PumpTimer pumpRaspberry = {PIN_PUMP_RASPBERRY, false, 0, 0, "Raspberry"};
${is3Pump ? `PumpTimer pumpLemon = {PIN_PUMP_LEMON, false, 0, 0, "Lemon"};\n` : ''}
unsigned long totalPourStartMs = 0;
unsigned long maxPourSafetyLimitMs = 45000; // 45 sec auto-cutoff safety
unsigned long lastHeartbeatMs = 0;

void setup() {
  // Initialize Serial interface at chosen baud rate
  Serial.begin(${settings.baudRate});
  while (!Serial && millis() < 3000) { ; } // wait for serial port to connect
  
  // Set Pin Modes
  pinMode(PIN_PUMP_WATER, OUTPUT);
  pinMode(PIN_PUMP_RASPBERRY, OUTPUT);
  ${is3Pump ? `pinMode(PIN_PUMP_LEMON, OUTPUT);\n  ` : ''}pinMode(PIN_STATUS_LED, OUTPUT);

  // Default all pumps to OFF state
  stopAllPumps();
  digitalWrite(PIN_STATUS_LED, HIGH);
  delay(200);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Send startup handshake
  Serial.println(F("ARDUINO_READY:Drink Dispenser v2.0"));
  Serial.println(F("PUMPS:1=Water,2=Raspberry${is3Pump ? ',3=Lemon' : ''}"));
}

void loop() {
  checkSerialInput();
  updatePumps();
  emitHeartbeat();
}

// -------------------------------------------------------------
// PROCESS INCOMING SERIAL COMMANDS FROM WEB APP
// Supported formats:
//   POUR:WATER:<ml>
//   POUR:RASP_LEMON:<ml>:<sweetness_percent>
//   PUMP:<id>:<ON|OFF>
//   STOP
//   PING
// -------------------------------------------------------------
void checkSerialInput() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\\n');
    input.trim();
    if (input.length() == 0) return;

    // Echo for telemetry
    // Serial.print(F("RX:"));
    // Serial.println(input);

    if (input == "PING") {
      Serial.println(F("PONG:ARDUINO_UNO_OK"));
    } 
    else if (input == "STOP" || input == "ESTOP") {
      emergencyStop();
    }
    else if (input.startsWith("POUR:WATER:")) {
      int ml = input.substring(11).toInt();
      if (ml > 0 && ml <= 1000) {
        startPourWater(ml);
      } else {
        Serial.println(F("ERR:INVALID_VOLUME"));
      }
    }
    else if (input.startsWith("POUR:RASP_LEMON:")) {
      // Format: POUR:RASP_LEMON:<ml>:<ratio_rasp_percent>
      int firstSep = input.indexOf(':', 16);
      int totalMl = 0;
      int raspPercent = 30; // default 30% raspberry
      
      if (firstSep == -1) {
        totalMl = input.substring(16).toInt();
      } else {
        totalMl = input.substring(16, firstSep).toInt();
        raspPercent = input.substring(firstSep + 1).toInt();
      }
      
      if (totalMl > 0 && totalMl <= 1000) {
        startPourRaspberryLemonade(totalMl, raspPercent);
      } else {
        Serial.println(F("ERR:INVALID_VOLUME"));
      }
    }
    else if (input.startsWith("PUMP:")) {
      // Format: PUMP:<id>:<1|0|ON|OFF>
      int id = input.substring(5, 6).toInt();
      String action = input.substring(7);
      bool turnOn = (action == "ON" || action == "1");
      setManualPump(id, turnOn);
    }
    else {
      Serial.print(F("ERR:UNKNOWN_COMMAND:"));
      Serial.println(input);
    }
  }
}

// -------------------------------------------------------------
// START DISPENSING ACTIONS
// -------------------------------------------------------------
void startPourWater(int totalMl) {
  if (currentState == STATE_POURING) {
    Serial.println(F("WARN:ALREADY_POURING"));
    return;
  }

  stopAllPumps();
  currentState = STATE_POURING;
  totalPourStartMs = millis();

  // Calculate run duration from flow rate
  unsigned long duration = (unsigned long)((totalMl / FLOW_RATE_WATER) * 1000.0f);
  
  pumpWater.active = true;
  pumpWater.startMs = millis();
  pumpWater.durationMs = duration;
  digitalWrite(pumpWater.pin, RELAY_ON);

  digitalWrite(PIN_STATUS_LED, HIGH);
  Serial.print(F("START:WATER:"));
  Serial.print(totalMl);
  Serial.print(F("ML:TIME_MS:"));
  Serial.println(duration);
}

void startPourRaspberryLemonade(int totalMl, int raspPercent) {
  if (currentState == STATE_POURING) {
    Serial.println(F("WARN:ALREADY_POURING"));
    return;
  }

  stopAllPumps();
  currentState = STATE_POURING;
  totalPourStartMs = millis();

  raspPercent = constrain(raspPercent, 10, 80);
  int raspMl = (totalMl * raspPercent) / 100;
  int waterMl = totalMl - raspMl;

  unsigned long waterTimeMs = (unsigned long)((waterMl / FLOW_RATE_WATER) * 1000.0f);
  unsigned long raspTimeMs = (unsigned long)((raspMl / FLOW_RATE_RASPBERRY) * 1000.0f);

  // Start both pumps simultaneously for optimal natural blending
  pumpWater.active = true;
  pumpWater.startMs = millis();
  pumpWater.durationMs = waterTimeMs;
  digitalWrite(pumpWater.pin, RELAY_ON);

  pumpRaspberry.active = true;
  pumpRaspberry.startMs = millis();
  pumpRaspberry.durationMs = raspTimeMs;
  digitalWrite(pumpRaspberry.pin, RELAY_ON);

  ${is3Pump ? `// In 3-pump mode, add a splash of lemon juice (approx 10% of total)
  int lemonMl = (totalMl * 10) / 100;
  unsigned long lemonTimeMs = (unsigned long)((lemonMl / FLOW_RATE_LEMON) * 1000.0f);
  pumpLemon.active = true;
  pumpLemon.startMs = millis();
  pumpLemon.durationMs = lemonTimeMs;
  digitalWrite(pumpLemon.pin, RELAY_ON);
  ` : ''}
  digitalWrite(PIN_STATUS_LED, HIGH);
  Serial.print(F("START:RASP_LEMON:TOTAL:"));
  Serial.print(totalMl);
  Serial.print(F("ML:WATER:"));
  Serial.print(waterMl);
  Serial.print(F("ML:RASP:"));
  Serial.print(raspMl);
  Serial.println(F("ML"));
}

// -------------------------------------------------------------
// PUMP UPDATE ROUTINE (called in loop)
// -------------------------------------------------------------
void updatePumps() {
  if (currentState != STATE_POURING) return;

  unsigned long now = millis();
  bool anyPumpActive = false;

  // Check Water Pump
  if (pumpWater.active) {
    if (now - pumpWater.startMs >= pumpWater.durationMs) {
      digitalWrite(pumpWater.pin, RELAY_OFF);
      pumpWater.active = false;
      Serial.println(F("PUMP_OFF:WATER"));
    } else {
      anyPumpActive = true;
    }
  }

  // Check Raspberry Pump
  if (pumpRaspberry.active) {
    if (now - pumpRaspberry.startMs >= pumpRaspberry.durationMs) {
      digitalWrite(pumpRaspberry.pin, RELAY_OFF);
      pumpRaspberry.active = false;
      Serial.println(F("PUMP_OFF:RASPBERRY"));
    } else {
      anyPumpActive = true;
    }
  }

  ${is3Pump ? `// Check Lemon Pump
  if (pumpLemon.active) {
    if (now - pumpLemon.startMs >= pumpLemon.durationMs) {
      digitalWrite(pumpLemon.pin, RELAY_OFF);
      pumpLemon.active = false;
      Serial.println(F("PUMP_OFF:LEMON"));
    } else {
      anyPumpActive = true;
    }
  }
  ` : ''}
  // Safety timeout check
  if (now - totalPourStartMs > maxPourSafetyLimitMs) {
    emergencyStop();
    Serial.println(F("ERR:SAFETY_TIMEOUT_TRIGGERED"));
    return;
  }

  // If all pumps finished, complete cycle
  if (!anyPumpActive) {
    currentState = STATE_IDLE;
    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println(F("COMPLETE:DRINK_READY"));
  }
}

// -------------------------------------------------------------
// MANUAL PRIMING & EMERGENCY STOP
// -------------------------------------------------------------
void setManualPump(int id, bool turnOn) {
  int pin = -1;
  String name = "";

  if (id == 1) { pin = PIN_PUMP_WATER; name = "Water"; }
  else if (id == 2) { pin = PIN_PUMP_RASPBERRY; name = "Raspberry"; }
  ${is3Pump ? `else if (id == 3) { pin = PIN_PUMP_LEMON; name = "Lemon"; }\n  ` : ''}
  if (pin != -1) {
    digitalWrite(pin, turnOn ? RELAY_ON : RELAY_OFF);
    Serial.print(F("MANUAL_PUMP:"));
    Serial.print(name);
    Serial.print(F(":"));
    Serial.println(turnOn ? F("ON") : F("OFF"));
  } else {
    Serial.println(F("ERR:INVALID_PUMP_ID"));
  }
}

void emergencyStop() {
  stopAllPumps();
  currentState = STATE_IDLE;
  digitalWrite(PIN_STATUS_LED, LOW);
  Serial.println(F("ESTOP:ALL_PUMPS_SHUTOFF"));
}

void stopAllPumps() {
  digitalWrite(PIN_PUMP_WATER, RELAY_OFF);
  digitalWrite(PIN_PUMP_RASPBERRY, RELAY_OFF);
  ${is3Pump ? `digitalWrite(PIN_PUMP_LEMON, RELAY_OFF);\n  ` : ''}
  pumpWater.active = false;
  pumpRaspberry.active = false;
  ${is3Pump ? `pumpLemon.active = false;\n  ` : ''}
}

void emitHeartbeat() {
  // Send state ping every 5 seconds when idle
  if (millis() - lastHeartbeatMs > 5000) {
    lastHeartbeatMs = millis();
    if (currentState == STATE_IDLE) {
      Serial.println(F("STATUS:IDLE:READY"));
    }
  }
}
`;
}
