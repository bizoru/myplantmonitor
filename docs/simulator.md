# Simulator — How It Works / Cómo Funciona

---

## English

### What is the Simulator?

The web simulator (`sim-web`) is an interactive 3D application that mimics the behavior of a real plant over a full 24-hour day. It generates sensor readings — temperature, humidity, soil moisture, light (lux), CO₂, and oxygen — based on mathematical models of real-world ecosystems. Those readings flow through the same IoT pipeline as a physical Arduino sensor:

```
Browser / Daemon → MQTT → Node-RED → InfluxDB → Grafana
```

There are two components:

| Component | Role |
|---|---|
| **Simulator Web** (`/sim/`) | 3D interactive UI — shows real-time values, controls light and pump |
| **Simulator Daemon** | Server-side process that publishes sensor data to MQTT every 5 seconds |

When the daemon is streaming, the browser displays the daemon's published readings. When streaming is off, the browser computes its own preview locally.

---

### Ecosystem Programs

Each ecosystem is a **pure mathematical function** of the current UTC time of day (`t`, in seconds, 0–86399). No randomness is required — every value is deterministic and reproducible from the clock alone.

The general pattern is a sinusoidal day/night cycle:

```
phase(t) = 2π × t / 86400 − π/2
sin(phase) = +1 at UTC noon, −1 at UTC midnight
```

Available ecosystems:

| ID | Label | Based on |
|---|---|---|
| `bogota` | Bogotá / Menta | Mint plant, indoor window, Bogotá climate |
| `tropical` | Selva Tropical | Hot, humid rainforest |
| `desert` | Desierto | Extreme hot days, cold nights |
| `temperate` | Templado | Mild, stable climate |
| `indoor` | Interior | Artificial indoor environment |
| `manual` | Manual | User-controlled sliders |

---

### Bogotá / Mint Ecosystem — Variable Formulas

This is the primary ecosystem. It models a **mint plant** placed in front of a window inside a house in Bogotá, Colombia.

#### 🌡️ Temperature (°C)
```
temperature = 13.5 + 5.5 × sin(phase)
```
- **Night (midnight):** ~8 °C — cool Bogotá nights
- **Midday:** ~19 °C — warm Bogotá afternoon
- Bogotá sits at 2,600 m altitude, producing mild temperatures year-round.

#### 💧 Humidity (%)
```
humidity = 72 − 1 × sin(phase)
```
- Ranges between **71% and 73%** — very stable.
- Bogotá has consistently high humidity due to its mountainous climate.

#### 🌱 Soil Moisture (%)
```
soil_moisture = clamp(45 − 10 × sin(phase), 30, 60)
```
- Ranges roughly **35–55%** through the day.
- Stays within the mint photosynthesis sweet spot (30–50%) for most of daylight hours.
- Rises toward evening as the plant cools and transpiration slows.

#### ☀️ Lux (Indoor Window)

Bogotá uses **UTC−5** (no daylight saving time):
- Sunrise: 06:00 local = **11:00 UTC** (t = 39,600 s)
- Sunset: 18:00 local = **23:00 UTC** (t = 82,800 s)
- Solar noon: 12:00 local = **17:00 UTC**

An indoor plant behind a window receives indirect light — much less than outdoor direct sun:

```
if 39600 ≤ t ≤ 82800:
    lux = 4500 × sin(π × (t − 39600) / 43200)
else:
    lux = 0
```

- **Night:** 0 lux
- **Peak (solar noon):** ~4,500 lux — typical bright window in Bogotá
- Compare: outdoor direct sun = 65,000+ lux

#### 🌬️ CO₂ (ppm) — Photosynthesis Model

CO₂ is driven by the **photosynthesis rate**, which depends on light and soil conditions:

```
photoActive = lux > 1000 AND 30 ≤ soil_moisture ≤ 50
photoRate   = photoActive ? clamp((lux − 1000) / 3500, 0, 1) : 0

co2 = 440 − 100 × photoRate
```

| Condition | photoRate | CO₂ |
|---|---|---|
| Night (no light) | 0 | 440 ppm |
| Dawn / dusk | ~0.1–0.3 | ~410–430 ppm |
| Peak sun, good soil | 1.0 | 340 ppm |

When the plant photosynthesizes at full rate, it consumes 100 ppm of CO₂ — a clearly visible drop in Grafana.

#### 🫁 Oxygen (%) — Photosynthesis Model

Oxygen is the direct product of photosynthesis. It rises exactly as CO₂ falls:

```
oxygen = 20.75 + 0.75 × photoRate
```

| Condition | photoRate | O₂ |
|---|---|---|
| Night (respiration only) | 0 | 20.75% |
| Peak sun, good soil | 1.0 | 21.50% |

The CO₂ ↓ / O₂ ↑ correlation is the **proof of photosynthesis** in the data.

> **Note:** Oxygen is only published by `sim-web`. The real Arduino (`plant-01`) has no O₂ sensor, so no oxygen data appears for that device in Grafana.

---

### Physical Effects (Pump & Lamp)

On top of the ecosystem values, two actuators modify the readings:

#### 💦 Pump (Water)
Each 5-second tick while the pump is ON:
```
soilBoost    += 6   (max +35%)
humidityBoost += 0.5 (max +3%)
```
Each tick while OFF:
```
soilBoost    −= 2
humidityBoost −= 0.3
```
The boost decays gradually so the effect is realistic.

#### 💡 Lamp
When the lamp is ON, 12,000 lux is added on top of the ecosystem value:
```
lux = ecosystem_lux + 12000  (clamped to 65,000)
```
This can trigger photosynthesis even at night if soil moisture is in range.

---

### Full Data Pipeline

```
Ecosystem formula (t = UTC seconds)
    ↓
Daemon tick every 5 seconds
    ↓ MQTT: sensors/sim-web/state
Node-RED: tag device_id, write to InfluxDB
    ↓
Grafana: display panels, select device = sim-web
```

---

---

## Español

### ¿Qué es el Simulador?

El simulador web (`sim-web`) es una aplicación 3D interactiva que imita el comportamiento de una planta real durante un día completo de 24 horas. Genera lecturas de sensores — temperatura, humedad, humedad del suelo, luz (lux), CO₂ y oxígeno — basadas en modelos matemáticos de ecosistemas reales. Esas lecturas fluyen por el mismo pipeline IoT que un sensor físico Arduino:

```
Navegador / Daemon → MQTT → Node-RED → InfluxDB → Grafana
```

Tiene dos componentes:

| Componente | Rol |
|---|---|
| **Simulator Web** (`/sim/`) | UI 3D interactiva — muestra valores en tiempo real, controla luz y riego |
| **Simulator Daemon** | Proceso en el servidor que publica datos de sensores a MQTT cada 5 segundos |

Cuando el daemon está transmitiendo, el navegador muestra las lecturas que este publica. Cuando la transmisión está apagada, el navegador calcula su propia vista previa localmente.

---

### Programas de Ecosistema

Cada ecosistema es una **función matemática pura** de la hora UTC actual del día (`t`, en segundos, 0–86399). No se necesita aleatoriedad — cada valor es determinista y reproducible solo a partir del reloj.

El patrón general es un ciclo día/noche sinusoidal:

```
phase(t) = 2π × t / 86400 − π/2
sin(phase) = +1 al mediodía UTC, −1 a medianoche UTC
```

Ecosistemas disponibles:

| ID | Etiqueta | Basado en |
|---|---|---|
| `bogota` | Bogotá / Menta | Planta de menta, ventana interior, clima de Bogotá |
| `tropical` | Selva Tropical | Selva caliente y húmeda |
| `desert` | Desierto | Días extremadamente calientes, noches frías |
| `temperate` | Templado | Clima suave y estable |
| `indoor` | Interior | Ambiente artificial de interior |
| `manual` | Manual | Controles manuales (sliders) |

---

### Ecosistema Bogotá / Menta — Fórmulas de Variables

Este es el ecosistema principal. Modela una **planta de menta** ubicada frente a una ventana al interior de una casa en Bogotá, Colombia.

#### 🌡️ Temperatura (°C)
```
temperatura = 13.5 + 5.5 × sin(phase)
```
- **Noche (medianoche):** ~8 °C — noches frescas de Bogotá
- **Mediodía:** ~19 °C — tarde cálida bogotana
- Bogotá está a 2.600 m de altitud, produciendo temperaturas suaves todo el año.

#### 💧 Humedad del Aire (%)
```
humedad = 72 − 1 × sin(phase)
```
- Varía entre **71% y 73%** — muy estable.
- Bogotá tiene humedad consistentemente alta por su clima de montaña.

#### 🌱 Humedad del Suelo (%)
```
humedad_suelo = clamp(45 − 10 × sin(phase), 30, 60)
```
- Varía aproximadamente entre **35% y 55%** durante el día.
- Se mantiene dentro del rango óptimo para la menta (30–50%) durante la mayor parte de las horas de luz.
- Sube hacia la tarde cuando la planta se enfría y la transpiración disminuye.

#### ☀️ Luminosidad — Ventana Interior (lux)

Bogotá usa **UTC−5** (sin horario de verano):
- Amanecer: 06:00 local = **11:00 UTC** (t = 39.600 s)
- Atardecer: 18:00 local = **23:00 UTC** (t = 82.800 s)
- Mediodía solar: 12:00 local = **17:00 UTC**

Una planta de interior detrás de una ventana recibe luz indirecta — mucho menos que el sol directo al exterior:

```
si 39600 ≤ t ≤ 82800:
    lux = 4500 × sin(π × (t − 39600) / 43200)
si no:
    lux = 0
```

- **Noche:** 0 lux
- **Pico (mediodía solar):** ~4.500 lux — ventana brillante típica en Bogotá
- Comparación: sol directo al exterior = más de 65.000 lux

#### 🌬️ CO₂ (ppm) — Modelo de Fotosíntesis

El CO₂ es impulsado por la **tasa de fotosíntesis**, que depende de la luz y las condiciones del suelo:

```
fotoActiva = lux > 1000 Y 30 ≤ humedad_suelo ≤ 50
fotoTasa   = fotoActiva ? clamp((lux − 1000) / 3500, 0, 1) : 0

co2 = 440 − 100 × fotoTasa
```

| Condición | Tasa foto | CO₂ |
|---|---|---|
| Noche (sin luz) | 0 | 440 ppm |
| Amanecer / atardecer | ~0.1–0.3 | ~410–430 ppm |
| Sol pico, suelo óptimo | 1.0 | 340 ppm |

Cuando la planta fotosintiza a plena capacidad, consume 100 ppm de CO₂ — una caída claramente visible en Grafana.

#### 🫁 Oxígeno (%) — Modelo de Fotosíntesis

El oxígeno es el producto directo de la fotosíntesis. Sube exactamente cuando el CO₂ baja:

```
oxigeno = 20.75 + 0.75 × fotoTasa
```

| Condición | Tasa foto | O₂ |
|---|---|---|
| Noche (solo respiración) | 0 | 20.75% |
| Sol pico, suelo óptimo | 1.0 | 21.50% |

La correlación CO₂ ↓ / O₂ ↑ es la **prueba de la fotosíntesis** en los datos.

> **Nota:** El oxígeno solo es publicado por `sim-web`. El Arduino real (`plant-01`) no tiene sensor de O₂, por lo que no aparecen datos de oxígeno para ese dispositivo en Grafana.

---

### Efectos Físicos (Bomba y Lámpara)

Además de los valores del ecosistema, dos actuadores modifican las lecturas:

#### 💦 Bomba (Riego)
Cada tick de 5 segundos mientras la bomba está ENCENDIDA:
```
boostSuelo    += 6   (máximo +35%)
boostHumedad  += 0.5 (máximo +3%)
```
Cada tick con la bomba APAGADA:
```
boostSuelo    −= 2
boostHumedad  −= 0.3
```
El efecto decae gradualmente para que sea realista.

#### 💡 Lámpara
Cuando la lámpara está ENCENDIDA, se suman 12.000 lux al valor del ecosistema:
```
lux = lux_ecosistema + 12000  (máximo 65.000)
```
Esto puede activar la fotosíntesis incluso de noche si la humedad del suelo está en el rango óptimo.

---

### Pipeline Completo de Datos

```
Fórmula del ecosistema (t = segundos UTC)
    ↓
Tick del daemon cada 5 segundos
    ↓ MQTT: sensors/sim-web/state
Node-RED: etiqueta device_id, escribe en InfluxDB
    ↓
Grafana: paneles de visualización, dispositivo = sim-web
```

---

### Condiciones para que ocurra la Fotosíntesis

Para que la planta de menta muestre fotosíntesis activa en la simulación se deben cumplir **las dos condiciones al mismo tiempo**:

| Condición | Rango requerido | Por qué |
|---|---|---|
| Luminosidad | > 1.000 lux | La planta necesita luz para producir energía |
| Humedad del suelo | 30% – 50% | Muy seco = estrés hídrico; muy húmedo = raíces anegadas |

Si alguna de las dos condiciones no se cumple, `fotoTasa = 0` y el CO₂ y el O₂ regresan a sus valores nocturnos (440 ppm / 20.75%).
