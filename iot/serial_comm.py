import json
import serial
from serial import SerialException


SERIAL_PORT = "/dev/cu.usbmodem144101"
BAUD_RATE = 9600
TIMEOUT = 2


class SerialManager:
    def __init__(self):
        self.connected = False
        self._port = None
        try:
            self._port = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=TIMEOUT)
            self.connected = True
        except SerialException:
            pass

    def send(self, command: str) -> str:
        if not self.connected:
            raise SerialException("Not connected")
        self._port.write((command + "\n").encode())
        self._port.flush()
        response = self._port.readline().decode().strip()
        return response

    def get_readings(self) -> dict:
        if not self.connected:
            raise SerialException("Not connected")
        self._port.write(b"get readings\n")
        self._port.flush()
        # Sensor acquisition can take several seconds; scan lines until we find JSON.
        old_timeout = self._port.timeout
        self._port.timeout = 10
        try:
            for _ in range(10):
                line = self._port.readline().decode().strip()
                if line.startswith("{"):
                    return json.loads(line)
        finally:
            self._port.timeout = old_timeout
        raise ValueError("No JSON response received from Arduino")
