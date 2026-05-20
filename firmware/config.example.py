"""Copy to config.py and fill in. config.py is gitignored."""

# WiFi
WIFI_SSID = "your-wifi"
WIFI_PASSWORD = "your-wifi-password"

# MQTT broker — host or IP. Use the EIP or DOMAIN from infra outputs.
MQTT_BROKER = "miplanta.app"
MQTT_PORT = 1883
MQTT_USER = "plant"
MQTT_PASSWORD = "changeme"

# Identity on MQTT
DEVICE_ID = "plant-01"

# Pinout — adjust to your wiring
DHT_PIN = 15    # DHT22 data line
SOIL_PIN = 34   # ADC1 channel for capacitive/resistive soil sensor
LIGHT_PIN = 5   # relay or LED strip MOSFET gate
