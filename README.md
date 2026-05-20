# myplantmonitor

A small IoT plant monitoring stack: ESP32 (or simulator) → MQTT → Node-RED →
InfluxDB → Grafana, fronted by Caddy with auto TLS. Runs on a single ARM EC2.

A school project by **Abby Sierra Cubillos** (11th grade, Gimnasio Fontana, Bogotá).
Built using research on IoT, MQTT, and cloud infrastructure.

## Architecture

```
                                    ┌─────────────┐
                ┌───────MQTT────────▶│  Mosquitto  │◀──WSS───┐
                │   1883 (tcp)       │  broker     │  9001   │
                │                    └──────┬──────┘         │
                │                           │                │
   ┌─────────┐  │                           ▼                │  ┌──────────────┐
   │  ESP32  │──┤                    ┌─────────────┐         ├──│ 3D Simulator │
   │ plant-01│  │                    │  Node-RED   │         │  │  sim-web     │
   └─────────┘  │                    │  routing    │         │  └──────────────┘
                │                    └──────┬──────┘         │
   ┌─────────┐  │                           │                │
   │ sim-cli │──┘                           ▼                │
   └─────────┘                       ┌─────────────┐         │
                                     │  InfluxDB   │         │
                                     │  sensors/30d│         │
                                     └──────┬──────┘         │
                                            │                │
                                            ▼                │
                                     ┌─────────────┐         │
                                     │   Grafana   │         │
                                     └──────┬──────┘         │
                                            │                │
                                ┌───────────┴────────────────┘
                                ▼
                          ┌──────────┐
                          │  Caddy   │  443 / 80
                          │  TLS, LE │
                          └──────────┘
                                ▲
                                │
                              public
```

## URLs (post-deploy)

| URL                                  | What                  |
| ------------------------------------ | --------------------- |
| `https://${DOMAIN}/`                 | Grafana dashboards    |
| `https://${DOMAIN}/sim`              | 3D web simulator      |
| `https://${DOMAIN}/nodered`          | Node-RED editor (auth)|
| `wss://${DOMAIN}/mqtt`               | MQTT over WebSocket   |
| `mqtt://${DOMAIN}:1883`              | MQTT (plain TCP)      |

## MQTT topic contract

- `sensors/<device_id>/state` — sensor → broker. JSON: `{temperature, humidity, soil_moisture, ts}`.
- `cmd/<device_id>/light` — dashboard → device. JSON: `{on: bool}`.
- `state/<device_id>/light` — device → broker (echo). JSON: `{on: bool}`.

Device IDs in use: `plant-01` (ESP32), `sim-cli` (Python), `sim-web` (browser).

## Deploy in 5 steps

1. **Buy domain** `miplanta.app` (already done — registered at name.com).
2. **Provision infra**: `cd infra && cp terraform.tfvars.example terraform.tfvars && make tf-init && make tf-apply`.
   Note the EIP from outputs and point an A-record to it at your registrar.
3. **Bootstrap secrets**: `cp .env.example .env` and fill in real values
   (long random tokens for `INFLUXDB_TOKEN`, strong passwords).
4. **Ship the stack**: `make deploy` (rsyncs `stack/` + `.env` to the EC2 and
   `docker compose up -d`s it).
5. **First-time setup on the box**: `make ssm`, then inside the EC2:
   `cd ~/myplantmonitor/stack && bash mosquitto/setup.sh` to create the
   Mosquitto password file. Then `docker compose restart mosquitto`.

After that visit `https://${DOMAIN}/` and you should land on Grafana.

## Local dev

- `make sim-cli` — run the Python sensor simulator against any broker.
- `make sim-web-dev` — run the 3D simulator with Vite hot reload.
- `make demo` — same as `sim-cli` but pointed at the production broker.

## Repo layout

```
infra/            Terraform — EC2, SG, IAM, EIP
stack/            Docker compose stack: mosquitto, nodered, influxdb, grafana, caddy
simulator-cli/    Python paho-mqtt headless simulator
simulator-web/    Vite + React + react-three-fiber 3D simulator
firmware/         MicroPython for ESP32 (plant-01)
docs/             architecture (EN), abby-guia (ES), demo-script (ES)
```

## Docs

- [`docs/architecture.md`](docs/architecture.md) — full technical view
- [`docs/abby-guia.md`](docs/abby-guia.md) — guía para Abby (Spanish)
- [`docs/demo-script.md`](docs/demo-script.md) — script de presentación (Spanish)
