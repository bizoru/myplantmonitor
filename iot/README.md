# iot — Arduino → MQTT Bridge

Python application that reads real sensor data from an Arduino Uno over USB serial and publishes it to the MQTT broker every 5 seconds. Integrates with the existing Node-RED → InfluxDB → Grafana pipeline under device ID `plant-01`.

Also exposes a local web dashboard to monitor sensors and control actuators directly.

## Architecture

```
main.py              Flask app — HTTP routes + startup health check
mqtt_bridge.py       Background thread: serial → MQTT publish + command subscribe
serial_comm.py       SerialManager — pyserial wrapper
templates/
  index.html         Local control UI (vanilla HTML/JS)
```

## Data flow

```
Arduino (USB serial)
  → Flask / SerialManager
    → MQTT  sensors/plant-01/state   (publishes every 5s)
      → Node-RED → InfluxDB → Grafana

Node-RED dashboard button
  → MQTT  cmd/plant-01/light | cmd/plant-01/motor
    → mqtt_bridge.py subscribes
      → serial → Arduino (turns lamp / pump on/off)
```

## Serial protocol

**Port:** `/dev/cu.usbmodem144101` — **Baud:** 9600 bps

Commands are plain text with a trailing newline. Control commands echo back on one line. `get readings` returns JSON after sensor acquisition (up to 10 s).

| Action | Command |
|---|---|
| Lights on/off | `lights on` / `lights off` |
| Motor on/off | `motor on` / `motor off` |
| Set motor level | `motor level <0-100>` |
| Get readings | `get readings` |

Arduino JSON response:
```json
{"moisture": 45, "co2": 850, "lux": 1200, "temp": 22.3, "humidity": 68.0}
```
`-1.0` means the sensor is unavailable.

Field mapping to pipeline schema:

| Arduino | MQTT payload |
|---|---|
| `temp` | `temperature` |
| `moisture` | `soil_moisture` |
| `co2`, `lux`, `humidity` | unchanged |

## API routes

| Route | Method | Body | Action |
|---|---|---|---|
| `/` | GET | — | Local control dashboard |
| `/api/lights` | POST | `{"state":"on"\|"off"}` | Toggle lamp |
| `/api/motor` | POST | `{"state":"on"\|"off"}` | Toggle pump |
| `/api/motor/level` | POST | `{"level": 0-100}` | Set pump level |
| `/api/readings` | GET | — | Fetch live sensor data |

All routes return `{"ok": true, ...}` on success or `{"ok": false, "error": "..."}` on failure. Returns HTTP 503 if Arduino is not connected.

## Setup

```bash
cp .env.example .env   # fill in MQTT credentials
make run               # installs deps + starts the app
```

Required `.env` variables:

| Variable | Default | Description |
|---|---|---|
| `MQTT_URL` | `mqtt://miplanta.app:1883` | Broker URL |
| `MQTT_USER` | — | MQTT username |
| `MQTT_PASSWORD` | — | MQTT password |
| `DEVICE_ID` | `plant-01` | Device identifier in MQTT topics |
| `PUBLISH_INTERVAL` | `5` | Seconds between publishes |
| `PORT` | `5001` | Flask web server port |
