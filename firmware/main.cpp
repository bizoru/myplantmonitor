#include <Arduino.h>
#include <Wire.h>
#include <BH1750.h>
#include <DHT.h>

constexpr int LIGHTS_PIN = DD4;
constexpr int SOIL_SENSOR_PIN = A1;
constexpr int CO_SENSOR_PIN = A0;
constexpr int LUX_SENSOR_SDA = A4;
constexpr int LUX_SENSOR_SCL = A5;
constexpr int TEMP_SENSOR_PIN = DD2;
constexpr int MOTOR_PIN = DD3;

// Capacitive moisture sensor v2.0 calibration values (adjust after in-air / in-water calibration)
constexpr int MOISTURE_DRY = 520;   // raw ADC reading in dry air
constexpr int MOISTURE_WET = 260;   // raw ADC reading fully submerged in water

constexpr unsigned long MOISTURE_INTERVAL_MS = 1000UL; // 1 second

BH1750 lightMeter;
DHT dht(TEMP_SENSOR_PIN, DHT11);

// MQ-135 constants for CO2 curve (from datasheet regression)
constexpr float RL   = 10.0;   // Load resistance on module (kΩ)
constexpr float R0   = 76.63;  // Sensor resistance in clean air (kΩ) — calibrate for accuracy

// Motor PWM range: external 5V supply, motor runs between 1V and 3V
constexpr float MOTOR_SUPPLY_V = 5.0f;
constexpr float MOTOR_MIN_V    = 1.0f;
constexpr float MOTOR_MAX_V    = 3.0f;
constexpr int   MOTOR_PWM_MIN  = static_cast<int>(MOTOR_MIN_V / MOTOR_SUPPLY_V * 255); // 51
constexpr int   MOTOR_PWM_MAX  = static_cast<int>(MOTOR_MAX_V / MOTOR_SUPPLY_V * 255); // 153

static int motorLevel = 0;

void motorOff() {
    analogWrite(MOTOR_PIN, 0);
}

void motorOn() {
    int pwm = static_cast<int>(map(motorLevel, 0, 100, MOTOR_PWM_MIN, MOTOR_PWM_MAX));
    analogWrite(MOTOR_PIN, pwm);
}

// level 0 = 1 V, level 100 = 3 V
void motorSetLevel(int level) {
    motorLevel = constrain(level, 0, 100);
    int pwm = static_cast<int>(map(motorLevel, 0, 100, MOTOR_PWM_MIN, MOTOR_PWM_MAX));
    analogWrite(MOTOR_PIN, pwm);
}

int readMoisturePercent() {
    int raw = analogRead(SOIL_SENSOR_PIN);
    int pct = map(raw, MOISTURE_DRY, MOISTURE_WET, 0, 100);
    return constrain(pct, 0, 100);
}

float readCO2ppm() {
    // Read the raw ADC value (0–1023) from the analog pin
    int raw = analogRead(CO_SENSOR_PIN);

    // Convert the ADC value to voltage (Arduino Uno ADC is 10-bit, reference is 5 V)
    float voltage = raw * (5.0f / 1023.0f);

    // Calculate Rs (sensor resistance) using the voltage divider formula:
    //   Vout = Vc * RL / (Rs + RL)  →  Rs = (Vc - Vout) / Vout * RL
    // Rs drops as gas concentration rises, which is how the sensor signals detection.
    float rs = ((5.0f - voltage) / voltage) * RL;

    // Normalise Rs against R0 (resistance measured in clean air).
    // The ratio Rs/R0 is what the datasheet calibration curve is expressed in.
    float ratio = rs / R0;

    // Apply the CO2 sensitivity curve fitted from the MQ-135 datasheet (log-log regression):
    //   ppm = 116.60 × (Rs/R0)^(−2.769)
    // As Rs/R0 decreases (more CO2), the exponent makes ppm rise.
    return 116.6020682f * powf(ratio, -2.769034857f);
}

float readLux() {
    return lightMeter.readLightLevel();
}
void getReadings() {
    int moisture   = readMoisturePercent();
    float ppm      = readCO2ppm();
    float lux      = readLux();
    float humidity = dht.readHumidity();
    float tempC    = dht.readTemperature();

    Serial.print("{\"moisture\":");
    Serial.print(moisture);
    Serial.print(",\"co2\":");
    Serial.print(ppm, 1);
    Serial.print(",\"lux\":");
    Serial.print(lux, 1);
    Serial.print(",\"temp\":");
    Serial.print(tempC, 1);
    Serial.print(",\"humidity\":");
    Serial.print(humidity, 1);
    Serial.println("}");
}
void handleSerialCommand() {
    static String buf;
    while (Serial.available()) {
        char c = static_cast<char>(Serial.read());
        if (c == '\n') {
            buf.trim();
            buf.toLowerCase();
            if (buf == "motor on") {
                motorOn();
                Serial.println("Motor on");
            } else if (buf == "motor off") {
                motorOff();
                Serial.println("Motor off");
            } else if (buf.startsWith("motor level ")) {
                int level = buf.substring(12).toInt();
                motorSetLevel(level);
                Serial.print("Motor level set to ");
                Serial.println(motorLevel);
            } else if (buf == "get readings") {
                getReadings();
            }
            else if (buf == "lights on") {
                digitalWrite(LIGHTS_PIN, HIGH);
                Serial.println("Lights on");
            }
            else if (buf == "lights off") {
                digitalWrite(LIGHTS_PIN, LOW);
                Serial.println("Lights off");
            }
            else {
                Serial.print("Unknown command: ");
                Serial.println(buf);
            }
            buf = "";
        } else if (c != '\r') {
            buf += c;
        }
    }
}

void setup() {
    Serial.begin(9600);
    Wire.begin();
    lightMeter.begin();
    dht.begin();
    Serial.println("Starting plant monitor...");
    pinMode(LED_BUILTIN, OUTPUT);
    pinMode(LIGHTS_PIN, OUTPUT);
    pinMode(MOTOR_PIN, OUTPUT);
    Serial.println("Setup complete");
}

void loop() {
    static bool ledState = false;

    handleSerialCommand();

    unsigned long now = millis();

    // Blink every second without blocking
    static unsigned long lastBlink = 0;
    if (now - lastBlink >= 1000UL) {
        lastBlink = now;
        ledState = !ledState;
        digitalWrite(LED_BUILTIN, ledState ? HIGH : LOW);
    }
}