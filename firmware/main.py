"""main.py — myplantmonitor ESP32 firmware (plant-01).

Loop:
  - read DHT22 (temperature + humidity)
  - read soil moisture from ADC
  - publish JSON to sensors/<DEVICE_ID>/state every 60s
  - subscribe to cmd/<DEVICE_ID>/light, drive the GPIO + echo state/<DEVICE_ID>/light
"""

import json
import time

import dht
import machine
from machine import ADC, Pin
from umqtt.simple import MQTTClient

import config


# ─── topics ─────────────────────────────────────────────────────────────────

T_STATE = "sensors/{}/state".format(config.DEVICE_ID).encode()
T_CMD_LIGHT = "cmd/{}/light".format(config.DEVICE_ID).encode()
T_STATE_LIGHT = "state/{}/light".format(config.DEVICE_ID).encode()


# ─── hardware ───────────────────────────────────────────────────────────────

dht_sensor = dht.DHT22(Pin(config.DHT_PIN))
soil_adc = ADC(Pin(config.SOIL_PIN))
soil_adc.atten(ADC.ATTN_11DB)  # 0..3.3V range
light_pin = Pin(config.LIGHT_PIN, Pin.OUT, value=0)


def read_sensors() -> dict:
    """Returns a JSON-ready dict matching the sensors/<id>/state contract."""
    dht_sensor.measure()
    raw_soil = soil_adc.read()  # 0..4095
    # Many capacitive soil sensors are inverted: lower ADC = wetter.
    # If yours is the resistive kind, drop the (1 -) below.
    soil_pct = max(0.0, min(100.0, (1 - raw_soil / 4095) * 100))
    return {
        "temperature": dht_sensor.temperature(),
        "humidity": dht_sensor.humidity(),
        "soil_moisture": round(soil_pct, 1),
        "ts": _iso_now(),
    }


def _iso_now() -> str:
    # ESP32 RTC may not be NTP-synced; this is "best effort". Node-RED can
    # overwrite with server time if needed.
    t = time.localtime()
    return "{:04d}-{:02d}-{:02d}T{:02d}:{:02d}:{:02d}Z".format(
        t[0], t[1], t[2], t[3], t[4], t[5]
    )


# ─── MQTT ───────────────────────────────────────────────────────────────────


def on_message(topic: bytes, payload: bytes) -> None:
    if topic != T_CMD_LIGHT:
        return
    try:
        msg = json.loads(payload)
    except (ValueError, TypeError):
        print("bad cmd payload:", payload)
        return

    on = bool(msg.get("on"))
    light_pin.value(1 if on else 0)
    print("light ->", "ON" if on else "OFF")

    # Echo state (retained so Node-RED + browser sims see the latest).
    client.publish(T_STATE_LIGHT, json.dumps({"on": on}), retain=True)


def make_client() -> MQTTClient:
    c = MQTTClient(
        client_id=config.DEVICE_ID,
        server=config.MQTT_BROKER,
        port=config.MQTT_PORT,
        user=config.MQTT_USER,
        password=config.MQTT_PASSWORD,
        keepalive=60,
    )
    c.set_callback(on_message)
    return c


def connect_with_retry() -> MQTTClient:
    while True:
        try:
            c = make_client()
            c.connect()
            c.subscribe(T_CMD_LIGHT)
            print("mqtt: connected to", config.MQTT_BROKER)
            return c
        except OSError as e:
            print("mqtt: connect failed:", e, "— retry in 5s")
            time.sleep(5)


# ─── main loop ──────────────────────────────────────────────────────────────

client = connect_with_retry()
last_publish = 0


def loop() -> None:
    global client, last_publish
    while True:
        try:
            client.check_msg()  # non-blocking; fires on_message if any

            now = time.ticks_ms()
            if time.ticks_diff(now, last_publish) >= 60_000:
                payload = read_sensors()
                client.publish(T_STATE, json.dumps(payload))
                print("publish:", payload)
                last_publish = now

            time.sleep_ms(200)
        except OSError as e:
            print("mqtt: dropped:", e, "— reconnecting")
            try:
                client.disconnect()
            except Exception:  # noqa: BLE001
                pass
            client = connect_with_retry()


loop()
