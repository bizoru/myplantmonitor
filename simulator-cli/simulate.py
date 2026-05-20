"""Headless plant simulator for myplantmonitor.

Publishes realistic-looking sensor data to MQTT every INTERVAL_SECONDS,
subscribes to cmd/<device_id>/light and cmd/<device_id>/water.

Usage:
    BROKER_HOST=localhost MQTT_USER=plant MQTT_PASSWORD=changeme \\
        python simulate.py
"""

from __future__ import annotations

import json
import logging
import os
import random
import signal
import ssl
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import paho.mqtt.client as mqtt


# ─── config ─────────────────────────────────────────────────────────────────


@dataclass
class Config:
    broker_host: str
    broker_port: int
    mqtt_user: str
    mqtt_password: str
    device_id: str
    interval_seconds: float
    use_tls: bool

    @classmethod
    def from_env(cls) -> "Config":
        return cls(
            broker_host=os.getenv("BROKER_HOST", "localhost"),
            broker_port=int(os.getenv("BROKER_PORT", "1883")),
            mqtt_user=os.getenv("MQTT_USER", "plant"),
            mqtt_password=os.getenv("MQTT_PASSWORD", ""),
            device_id=os.getenv("DEVICE_ID", "sim-cli"),
            interval_seconds=float(os.getenv("INTERVAL_SECONDS", "60")),
            use_tls=os.getenv("USE_TLS", "false").lower() == "true",
        )


# ─── plant state ────────────────────────────────────────────────────────────


@dataclass
class PlantState:
    """Slow-drift simulation. Soil dries down; everything else jitters."""

    temperature: float = 22.0
    humidity: float = 60.0
    soil_moisture: float = 80.0
    light_on: bool = False

    def tick(self) -> None:
        # Temperature jitters ±0.4°C around its current value, anchored to 22.
        self.temperature += random.uniform(-0.4, 0.4) + (22.0 - self.temperature) * 0.05
        self.temperature = max(-5.0, min(45.0, self.temperature))

        # Humidity jitters ±2% around 60.
        self.humidity += random.uniform(-2.0, 2.0) + (60.0 - self.humidity) * 0.05
        self.humidity = max(0.0, min(100.0, self.humidity))

        # Soil moisture decays slowly: ~0.5%/tick toward 20%.
        self.soil_moisture += random.uniform(-0.7, -0.3)
        self.soil_moisture = max(20.0, min(100.0, self.soil_moisture))

    def water(self) -> None:
        self.soil_moisture = 80.0


# ─── topics ─────────────────────────────────────────────────────────────────


def t_state(device_id: str) -> str:
    return f"sensors/{device_id}/state"


def t_cmd_light(device_id: str) -> str:
    return f"cmd/{device_id}/light"


def t_cmd_water(device_id: str) -> str:
    return f"cmd/{device_id}/water"


def t_state_light(device_id: str) -> str:
    return f"state/{device_id}/light"


# ─── runtime ────────────────────────────────────────────────────────────────


def build_payload(plant: PlantState) -> dict[str, Any]:
    return {
        "temperature": round(plant.temperature, 2),
        "humidity": round(plant.humidity, 2),
        "soil_moisture": round(plant.soil_moisture, 2),
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def main() -> int:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(message)s",
    )
    log = logging.getLogger("simulate")

    cfg = Config.from_env()
    plant = PlantState()
    stop = False

    def handle_sigint(_signum: int, _frame: Any) -> None:
        nonlocal stop
        log.info("shutdown requested")
        stop = True

    signal.signal(signal.SIGINT, handle_sigint)
    signal.signal(signal.SIGTERM, handle_sigint)

    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=f"sim-cli-{cfg.device_id}",
        clean_session=True,
    )

    if cfg.mqtt_user:
        client.username_pw_set(cfg.mqtt_user, cfg.mqtt_password)

    if cfg.use_tls:
        client.tls_set(cert_reqs=ssl.CERT_REQUIRED)

    def on_connect(_client: mqtt.Client, _ud: Any, _flags: Any, rc: Any, _props: Any = None) -> None:
        log.info("connected rc=%s", rc)
        client.subscribe(t_cmd_light(cfg.device_id), qos=0)
        client.subscribe(t_cmd_water(cfg.device_id), qos=0)

    def on_disconnect(_c: mqtt.Client, _ud: Any, _flags: Any, rc: Any, _props: Any = None) -> None:
        log.warning("disconnected rc=%s", rc)

    def on_message(_c: mqtt.Client, _ud: Any, msg: mqtt.MQTTMessage) -> None:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            log.warning("bad payload on %s: %r", msg.topic, msg.payload)
            return

        if msg.topic == t_cmd_light(cfg.device_id):
            on = bool(payload.get("on"))
            plant.light_on = on
            log.info("light → %s", "ON" if on else "OFF")
            client.publish(
                t_state_light(cfg.device_id),
                json.dumps({"on": on}),
                qos=0,
                retain=True,
            )
        elif msg.topic == t_cmd_water(cfg.device_id):
            plant.water()
            log.info("watered → soil_moisture=%.1f", plant.soil_moisture)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    log.info(
        "connecting to %s:%s as device_id=%s tls=%s",
        cfg.broker_host, cfg.broker_port, cfg.device_id, cfg.use_tls,
    )
    client.connect(cfg.broker_host, cfg.broker_port, keepalive=60)
    client.loop_start()

    try:
        while not stop:
            plant.tick()
            payload = build_payload(plant)
            client.publish(t_state(cfg.device_id), json.dumps(payload), qos=0)
            log.info(
                "publish %s temp=%.1f hum=%.1f soil=%.1f",
                t_state(cfg.device_id),
                payload["temperature"],
                payload["humidity"],
                payload["soil_moisture"],
            )

            # Sleep in small chunks so SIGINT is responsive.
            slept = 0.0
            while slept < cfg.interval_seconds and not stop:
                time.sleep(0.5)
                slept += 0.5
    finally:
        client.loop_stop()
        client.disconnect()
        log.info("bye")

    return 0


if __name__ == "__main__":
    sys.exit(main())
