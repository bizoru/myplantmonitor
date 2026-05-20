# simulator-cli

Headless Python plant. Publishes `sensors/<device_id>/state` every
`INTERVAL_SECONDS`, listens to `cmd/<device_id>/light` and
`cmd/<device_id>/water`.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run — local dev (broker on localhost)

```bash
BROKER_HOST=localhost \
MQTT_USER=plant \
MQTT_PASSWORD=changeme \
DEVICE_ID=sim-cli \
INTERVAL_SECONDS=10 \
python simulate.py
```

## Run — against the production broker

```bash
BROKER_HOST=miplanta.app \
BROKER_PORT=1883 \
MQTT_USER=plant \
MQTT_PASSWORD="$(grep MQTT_PASSWORD ../.env | cut -d= -f2)" \
DEVICE_ID=sim-cli \
INTERVAL_SECONDS=60 \
python simulate.py
```

## Env vars

| Var                | Default     | Notes                                |
| ------------------ | ----------- | ------------------------------------ |
| `BROKER_HOST`      | `localhost` | Mosquitto host                       |
| `BROKER_PORT`      | `1883`      | TCP port                             |
| `MQTT_USER`        | `plant`     | passwd file user                     |
| `MQTT_PASSWORD`    | (empty)     | matching password                    |
| `DEVICE_ID`        | `sim-cli`   | identifies this client on MQTT       |
| `INTERVAL_SECONDS` | `60`        | publish interval                     |
| `USE_TLS`          | `false`     | flip to `true` if broker is on 8883  |
| `LOG_LEVEL`        | `INFO`      | `DEBUG` for noisy mode               |
