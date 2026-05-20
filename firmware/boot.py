"""boot.py — runs once on power-on. Brings up WiFi.

Reads SSID/PASSWORD from config.py (copy config.example.py first).
"""

import network
import time

import config


def connect_wifi(timeout_s: int = 20) -> str | None:
    sta = network.WLAN(network.STA_IF)
    sta.active(True)

    if sta.isconnected():
        ip = sta.ifconfig()[0]
        print("wifi: already connected, ip=", ip)
        return ip

    print("wifi: connecting to", config.WIFI_SSID)
    sta.connect(config.WIFI_SSID, config.WIFI_PASSWORD)

    deadline = time.ticks_add(time.ticks_ms(), timeout_s * 1000)
    while not sta.isconnected():
        if time.ticks_diff(deadline, time.ticks_ms()) <= 0:
            print("wifi: connection timed out")
            return None
        time.sleep_ms(250)

    ip = sta.ifconfig()[0]
    print("wifi: connected, ip=", ip)
    return ip


connect_wifi()
