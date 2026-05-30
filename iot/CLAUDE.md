# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Plantmonitor is a Python application that communicates with an Arduino Uno over serial and exposes a local web dashboard to monitor sensors and control actuators.

The web UI provides:
- Turn on/off lights
- Turn on/off motor
- Set the motor level (0–100)
- Read sensor data into a text box
- Collapsible serial log for debugging (shows every command sent and every Arduino echo)

`plantmonitor` is a Python 3.11 project managed with `uv`. The virtual environment is in `.venv`.

## Architecture

```
main.py              Flask app — all HTTP routes
serial_comm.py       SerialManager — pyserial wrapper
templates/
  index.html         Single-page UI (vanilla HTML/JS, no framework)
```

`main.py` creates a module-level `SerialManager` instance on startup. If the Arduino is not connected, `SerialManager.connected` is `False` and all API routes return HTTP 503.

## Serial protocol

**Port:** `/dev/cu.usbmodem11301` — **Baud:** 9600 bps

All commands are sent as plain text with a trailing newline. Control commands echo the accepted command back on a single line. `get readings` echoes the command first, then sends the JSON on a second line after sensor acquisition (which can take several seconds — the read loop uses a 10 s timeout and scans for the first line starting with `{`).

| Action | Command |
|---|---|
| Lights on | `lights on` |
| Lights off | `lights off` |
| Motor on | `motor on` |
| Motor off | `motor off` |
| Set motor level | `motor level <0-100>` (also turns motor on) |
| Get readings | `get readings` |

Sensor readings response:
```json
{"moisture":0,"co2":122.6,"lux":44.2,"temp":-1.0,"humidity":-1.0}
```
A value of `-1.0` means the sensor is unavailable.

## API routes

| Route | Method | Body | Action |
|---|---|---|---|
| `/` | GET | — | Serve `index.html` |
| `/api/lights` | POST | `{"state":"on"\|"off"}` | Toggle lights |
| `/api/motor` | POST | `{"state":"on"\|"off"}` | Toggle motor |
| `/api/motor/level` | POST | `{"level": 0-100}` | Set motor level |
| `/api/readings` | GET | — | Fetch sensor data |

All routes return `{"ok": true, "echo": "..."}` on success or `{"ok": false, "error": "..."}` on failure.

## Build and run

```bash
# Run the app
uv run main.py

# Add a dependency
uv add <package>

# Run tests (once a test suite is added)
uv run pytest
```
