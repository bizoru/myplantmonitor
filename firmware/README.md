# firmware — plant-01 (ESP32, MicroPython)

## Hardware (suggested wiring — adjust to your build)

| Sensor / Output       | Pin    | Notes                                     |
| --------------------- | ------ | ----------------------------------------- |
| DHT22 data            | GPIO15 | 10kΩ pull-up to 3V3 on data line          |
| Soil moisture (ADC)   | GPIO34 | ADC1 channel; capacitive sensors preferred |
| Light strip / relay   | GPIO5  | drives MOSFET gate or relay coil          |

3V3 + GND from the ESP32 dev board. Soil sensor signal pin → GPIO34.

## Flash MicroPython

1. Download MicroPython for ESP32 from <https://micropython.org/download/esp32/>.
2. Erase + flash:

   ```bash
   esptool.py --chip esp32 --port /dev/cu.usbserial-XXXX erase_flash
   esptool.py --chip esp32 --port /dev/cu.usbserial-XXXX --baud 460800 \
     write_flash -z 0x1000 esp32-XXXX.bin
   ```

3. Verify with `mpremote`:

   ```bash
   mpremote connect /dev/cu.usbserial-XXXX repl
   ```

## Copy the firmware

```bash
cp config.example.py config.py
$EDITOR config.py    # fill in WiFi + MQTT creds

mpremote connect /dev/cu.usbserial-XXXX cp boot.py main.py config.py :
mpremote connect /dev/cu.usbserial-XXXX reset
```

The board reboots, connects to WiFi, then loops:

- read DHT22 + soil ADC
- publish to `sensors/plant-01/state` every 60s
- listen on `cmd/plant-01/light`, drive the GPIO, echo `state/plant-01/light`

## Debugging

- `mpremote repl` to see prints from the running firmware.
- If MQTT connect fails: confirm broker is reachable from the WiFi network
  (`mqtt://${DOMAIN}:1883` is open publicly), and that the username/password
  match the `passwd` file on the broker.
- ADC values are noisy; the firmware does no smoothing. Fine for the demo.

## Calibration tip

Soil sensor raw ADC values vary wildly between makes. Drop the sensor in dry
air and write down the value (this is your "0%"). Submerge in water — write
that down too ("100%"). Adjust the formula in `read_sensors()` accordingly.
