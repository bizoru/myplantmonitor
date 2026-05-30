# firmware — Arduino Uno (C++)

Arduino sketch for the plant monitor. Reads sensors and controls actuators over USB serial. The `iot/` Flask app bridges serial commands to MQTT.

## Hardware wiring

| Component | Pin | Notes |
|---|---|---|
| Lights relay | D4 | Digital HIGH/LOW |
| Motor / pump | D3 | PWM — 5V supply, motor runs 1–3V |
| DHT11 (temp + humidity) | D2 | Data pin |
| MQ-135 (CO2) | A0 | Analog |
| Capacitive soil moisture v2.0 | A1 | Analog — calibrate dry/wet constants |
| BH1750 (lux) | A4 (SDA) / A5 (SCL) | I2C |

## Libraries (Arduino IDE / PlatformIO)

- `BH1750` by Christopher Laws
- `DHT sensor library` by Adafruit
- `Wire` (built-in)

## Serial protocol

**Baud rate:** 9600

All commands are plain text followed by `\n`. The board echoes a confirmation line. `get readings` returns a JSON object.

| Command | Response |
|---|---|
| `lights on` | `Lights on` |
| `lights off` | `Lights off` |
| `motor on` | `Motor on` |
| `motor off` | `Motor off` |
| `motor level <0-100>` | `Motor level set to <N>` |
| `get readings` | `{"moisture":N,"co2":N,"lux":N,"temp":N,"humidity":N}` |

A value of `-1.0` in the JSON means that sensor failed to read.

## Sensor calibration

**Soil moisture** — the capacitive sensor v2.0 returns raw ADC values. Adjust the constants in `main.cpp` for your unit:

```cpp
constexpr int MOISTURE_DRY = 520;  // ADC reading in dry air
constexpr int MOISTURE_WET = 260;  // ADC reading submerged in water
```

**CO2 (MQ-135)** — `R0` is the sensor resistance in clean air. The default `76.63 kΩ` is a typical value; calibrate yours by reading the raw resistance in clean outdoor air and updating:

```cpp
constexpr float R0 = 76.63;
```

**Motor PWM** — the motor runs between 1V and 3V on a 5V supply. PWM range maps to duty cycles 51–153 out of 255. Adjust `MOTOR_MIN_V` / `MOTOR_MAX_V` if your motor specs differ.

## Flash

1. Open `main.cpp` in the Arduino IDE (or use PlatformIO).
2. Select **Board: Arduino Uno**, correct port.
3. Upload.

The onboard LED blinks every second as a heartbeat.
