# myplantmonitor

A complete IoT plant monitoring system: Arduino UNO (or simulator) → MQTT → Node-RED → InfluxDB → Grafana, fronted by Caddy with automatic TLS. Deployed on a single ARM EC2 instance.

A school project by **Abby Sierra Cubillos** (11th grade, Gimnasio Fontana, Bogotá).
Built using research on IoT, MQTT, and cloud infrastructure.

*[Leer en español](README.es.md)*

## Architecture

![System Architecture](docs/architecture.png)

## URLs (post-deploy)

| URL                            | Description             |
| ------------------------------ | ----------------------- |
| `https://${DOMAIN}/`           | Grafana dashboards      |
| `https://${DOMAIN}/sim`        | 3D web simulator        |
| `https://${DOMAIN}/nodered`    | Node-RED editor (auth)  |
| `wss://${DOMAIN}/mqtt`         | MQTT over WebSocket     |
| `mqtt://${DOMAIN}:1883`        | MQTT (plain TCP)        |

## MQTT topic contract

| Topic                         | Direction         | Payload                                          |
| ----------------------------- | ----------------- | ------------------------------------------------ |
| `sensors/<device_id>/state`   | sensor → broker   | `{temperature, humidity, soil_moisture, ts}`      |
| `cmd/<device_id>/light`       | dashboard → device| `{on: bool}`                                     |
| `state/<device_id>/light`     | device → broker   | `{on: bool}`                                     |

Device IDs in use: `plant-01` (Arduino UNO), `sim-cli` (Python), `sim-web` (browser).

## Deploy

1. **Domain**: `miplanta.app` (registered at name.com).
2. **Provision infra**: `cd infra && cp terraform.tfvars.example terraform.tfvars && make tf-init && make tf-apply`.
   Point an A-record to the EIP from outputs.
3. **Bootstrap secrets**: `cp .env.example .env` and fill in real values.
4. **Ship the stack**: `make deploy` — rsyncs to the EC2 and runs `docker compose up -d`.
5. **First-time setup**: `make ssm`, then on the EC2: `bash mosquitto/setup.sh` and `docker compose restart mosquitto`.

## Local development

- `make sim-cli` — Python sensor simulator against any broker.
- `make sim-web-dev` — 3D simulator with Vite hot reload.
- `make demo` — simulator pointed at the production broker.

## Repository layout

```
infra/            Terraform — EC2, SG, IAM, EIP
stack/            Docker Compose: Mosquitto, Node-RED, InfluxDB, Grafana, Caddy
simulator-cli/    Python paho-mqtt headless simulator
simulator-web/    Vite + React + react-three-fiber 3D simulator
firmware/         Arduino C/C++ for Arduino UNO (plant-01)
docs/             Architecture diagrams and documentation
```

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — full technical architecture
- [`docs/demo-script.md`](docs/demo-script.md) — presentation script (Spanish)

## License

[MIT](LICENSE) — Copyright (c) 2026 Abby Sierra Cubillos
