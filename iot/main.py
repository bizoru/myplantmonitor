import logging
import os

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, render_template, request
from serial import SerialException

import mqtt_bridge
from serial_comm import SerialManager

logging.basicConfig(level=logging.WARNING)

app = Flask(__name__)
serial_mgr = SerialManager()


def _startup_check():
    GREEN = "\033[92m"
    RED   = "\033[91m"
    CYAN  = "\033[96m"
    BOLD  = "\033[1m"
    RESET = "\033[0m"
    DIM   = "\033[2m"

    def ok(detail=""):
        return f"{GREEN}✅  OK{RESET}  {DIM}{detail}{RESET}"

    def fail(detail=""):
        return f"{RED}❌  ERROR{RESET}  {DIM}{detail}{RESET}"

    port = int(os.getenv("PORT", "5001"))

    print(f"\n{BOLD}{CYAN}{'─'*46}{RESET}")
    print(f"{BOLD}{CYAN}   🌿  Monitor de Planta — verificando...{RESET}")
    print(f"{BOLD}{CYAN}{'─'*46}{RESET}\n")

    # 1. Arduino
    if serial_mgr.connected:
        status = ok(f"puerto {serial_mgr._port.port}")
    else:
        status = fail("conecta el cable USB y reinicia")
    print(f"  Arduino (serial)   {status}")

    # 2. MQTT broker
    print(f"  Broker MQTT        {DIM}verificando...{RESET}", end="\r")
    mqtt_ok = mqtt_bridge.check_connection()
    broker_label = os.getenv("MQTT_URL", "mqtt://miplanta.app:1883").replace("mqtt://", "")
    if mqtt_ok:
        status = ok(broker_label)
    else:
        status = fail("revisa tu conexión a internet")
    print(f"  Broker MQTT        {status}        ")

    # 3. Web server
    print(f"  Servidor web       {ok(f'http://localhost:{port}')}")

    print(f"\n{BOLD}{'─'*46}{RESET}")
    if not serial_mgr.connected:
        print(f"  {RED}⚠️  Arduino no detectado.{RESET}")
        print(f"  {DIM}Los datos no se publicarán hasta conectarlo.{RESET}")
    if not mqtt_ok:
        print(f"  {RED}⚠️  Sin conexión al broker.{RESET}")
        print(f"  {DIM}Los datos no llegarán a Grafana.{RESET}")
    if serial_mgr.connected and mqtt_ok:
        print(f"  {GREEN}Todo listo. El monitor está activo.{RESET}")
    print(f"{'─'*46}")
    print(f"  {DIM}Presiona Ctrl+C para detener.{RESET}")
    print(f"{'─'*46}\n")


_startup_check()
mqtt_bridge.start(serial_mgr)


def _not_connected():
    return jsonify(ok=False, error="Not connected"), 503


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/lights")
def lights():
    if not serial_mgr.connected:
        return _not_connected()
    state = request.json.get("state")
    if state not in ("on", "off"):
        return jsonify(ok=False, error="state must be 'on' or 'off'"), 400
    try:
        echo = serial_mgr.send(f"lights {state}")
        return jsonify(ok=True, echo=echo)
    except SerialException as e:
        return jsonify(ok=False, error=str(e)), 500


@app.post("/api/motor")
def motor():
    if not serial_mgr.connected:
        return _not_connected()
    state = request.json.get("state")
    if state not in ("on", "off"):
        return jsonify(ok=False, error="state must be 'on' or 'off'"), 400
    try:
        echo = serial_mgr.send(f"motor {state}")
        return jsonify(ok=True, echo=echo)
    except SerialException as e:
        return jsonify(ok=False, error=str(e)), 500


@app.post("/api/motor/level")
def motor_level():
    if not serial_mgr.connected:
        return _not_connected()
    level = request.json.get("level")
    if not isinstance(level, int) or not (0 <= level <= 100):
        return jsonify(ok=False, error="level must be an integer 0–100"), 400
    try:
        echo = serial_mgr.send(f"motor level {level}")
        return jsonify(ok=True, echo=echo)
    except SerialException as e:
        return jsonify(ok=False, error=str(e)), 500


@app.get("/api/readings")
def readings():
    if not serial_mgr.connected:
        return _not_connected()
    try:
        data = serial_mgr.get_readings()
        import json
        return jsonify(ok=True, echo=json.dumps(data), readings=data)
    except SerialException as e:
        return jsonify(ok=False, error=str(e)), 500
    except ValueError as e:
        return jsonify(ok=False, error=f"Bad response from Arduino: {e}"), 502


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    app.run(debug=True, use_reloader=False, port=port)
