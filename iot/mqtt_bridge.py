"""
Background thread: polls Arduino readings every PUBLISH_INTERVAL seconds
and publishes them to the MQTT broker as sensors/plant-01/state.
"""

import json
import logging
import os
import threading
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)

DEVICE_ID        = os.getenv("DEVICE_ID", "plant-01")
MQTT_URL         = os.getenv("MQTT_URL", "mqtt://miplanta.app:1883")
MQTT_USER        = os.getenv("MQTT_USER")
MQTT_PASSWORD    = os.getenv("MQTT_PASSWORD")
PUBLISH_INTERVAL = int(os.getenv("PUBLISH_INTERVAL", "5"))

TOPIC = f"sensors/{DEVICE_ID}/state"


def _parse_url(url: str) -> tuple[str, int]:
    """Return (host, port) from an mqtt:// URL."""
    url = url.removeprefix("mqtt://").removeprefix("mqtts://")
    if ":" in url:
        host, port_str = url.rsplit(":", 1)
        return host, int(port_str)
    return url, 1883


def _map_readings(raw: dict) -> dict:
    """Rename Arduino field names to the standard pipeline schema."""
    return {
        "temperature":  raw.get("temp", -1.0),
        "humidity":     raw.get("humidity", -1.0),
        "soil_moisture": raw.get("moisture", -1.0),
        "lux":          raw.get("lux", -1.0),
        "co2":          raw.get("co2", -1.0),
    }


def _is_all_unavailable(readings: dict) -> bool:
    return all(v == -1.0 for v in readings.values())


def check_connection() -> bool:
    """Synchronous one-shot check — returns True if broker accepts credentials."""
    host, port = _parse_url(MQTT_URL)
    result = []
    event = __import__("threading").Event()

    def on_connect(c, u, f, rc, p):
        result.append(rc == 0)
        c.disconnect()
        event.set()

    c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"{DEVICE_ID}-check")
    if MQTT_USER:
        c.username_pw_set(MQTT_USER, MQTT_PASSWORD)
    c.on_connect = on_connect
    try:
        c.connect(host, port, keepalive=5)
        c.loop_start()
        event.wait(timeout=5)
        c.loop_stop()
        return bool(result and result[0])
    except Exception:
        return False


def start(serial_mgr):
    """Start the MQTT publish loop in a daemon thread."""
    thread = threading.Thread(target=_run, args=(serial_mgr,), daemon=True)
    thread.start()
    return thread


def _run(serial_mgr):
    host, port = _parse_url(MQTT_URL)

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                         client_id=f"{DEVICE_ID}-bridge-{os.getpid()}")
    if MQTT_USER:
        client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

    def on_connect(c, userdata, flags, reason_code, properties):
        if reason_code == 0:
            logger.info("[mqtt_bridge] connected  broker=%s:%d  topic=%s", host, port, TOPIC)
            c.subscribe(f"cmd/{DEVICE_ID}/light")
            c.subscribe(f"cmd/{DEVICE_ID}/motor")
            # Publish initial OFF state so Grafana has a baseline from the moment the app starts.
            c.publish(f"state/{DEVICE_ID}/light", json.dumps({"on": False}), retain=True)
            c.publish(f"state/{DEVICE_ID}/motor", json.dumps({"on": False}), retain=True)
        else:
            logger.warning("[mqtt_bridge] connect failed  rc=%s", reason_code)

    def on_disconnect(c, userdata, flags, reason_code, properties):
        logger.warning("[mqtt_bridge] disconnected  rc=%s — will retry", reason_code)

    def on_message(c, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            on = bool(payload.get("on", False))
            if msg.topic == f"cmd/{DEVICE_ID}/light":
                cmd = "lights on" if on else "lights off"
                serial_mgr.send(cmd)
                c.publish(f"state/{DEVICE_ID}/light", json.dumps({"on": on}), retain=True)
                logger.info("[mqtt_bridge] light cmd → Arduino: %s", cmd)
            elif msg.topic == f"cmd/{DEVICE_ID}/motor":
                cmd = "motor on" if on else "motor off"
                serial_mgr.send(cmd)
                c.publish(f"state/{DEVICE_ID}/motor", json.dumps({"on": on}), retain=True)
                logger.info("[mqtt_bridge] motor cmd → Arduino: %s", cmd)
        except Exception as exc:
            logger.warning("[mqtt_bridge] cmd error: %s", exc)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    while True:
        try:
            client.connect(host, port, keepalive=60)
            client.loop_start()
            break
        except Exception as exc:
            logger.error("[mqtt_bridge] connect error: %s — retrying in 10s", exc)
            time.sleep(10)

    while True:
        try:
            if serial_mgr.connected:
                raw = serial_mgr.get_readings()
                readings = _map_readings(raw)
                if not _is_all_unavailable(readings):
                    payload = {
                        **readings,
                        "ts": datetime.now(timezone.utc).isoformat(),
                    }
                    client.publish(TOPIC, json.dumps(payload), qos=0)
                    logger.debug("[mqtt_bridge] published  %s", payload)
                else:
                    logger.debug("[mqtt_bridge] all sensors unavailable — skipped")
            else:
                logger.debug("[mqtt_bridge] Arduino not connected — skipped")
        except Exception as exc:
            logger.warning("[mqtt_bridge] publish error: %s", exc)

        time.sleep(PUBLISH_INTERVAL)
