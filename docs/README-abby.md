# 🌱 Mi Planta — Guía de Abby

Hola Abby! Este archivo explica **qué hace el proyecto, cómo funciona y cómo mostrárselo a tu profesora**.

---

## ¿Qué es este proyecto?

Creamos un sistema completo de monitoreo para una planta usando tecnología real de Internet de las Cosas (IoT — *Internet of Things*). La planta tiene sensores que miden temperatura, humedad del aire y humedad de la tierra. Esos datos viajan por internet hasta una pantalla en tiempo real.

---

## Las tres partes del proyecto

### 1. El sensor (ESP32 — la "cartita")
Es un microcontrolador pequeño conectado a la planta. Tiene:
- **Sensor DHT22** → mide temperatura y humedad del aire
- **Sensor de humedad de suelo** → detecta si la tierra está seca o húmeda
- **Tira de LEDs** → luz de crecimiento que se puede encender y apagar desde la app

Cada 60 segundos el ESP32 *publica* los datos al internet, como si enviara una cartita.

### 2. La nube (servidor en Amazon AWS)
Tu papá configuró un servidor en la nube que recibe las cartitas y las guarda. Tiene varios programas trabajando juntos:

| Programa | ¿Qué hace? |
|---|---|
| **Mosquitto** | El "cartero" — recibe y distribuye mensajes MQTT |
| **Node-RED** | El "asistente" — procesa los mensajes y los guarda en la base de datos |
| **InfluxDB** | La "biblioteca" — guarda todos los datos de sensores con fecha y hora |
| **Grafana** | La "pantalla" — muestra gráficas bonitas de los datos |
| **Caddy** | El "portero" — protege todo con HTTPS y dirige el tráfico |

### 3. El simulador 3D (para la demo)
Como el ESP32 puede no estar presente en la presentación, creamos un simulador que muestra la planta en **3D** con la misma interfaz de control. Se ve como el centro de control de la NASA. 😄

---

## Protocolo MQTT — ¿cómo se comunica la planta?

**MQTT** es el protocolo que usa la planta para enviar datos. Piénsalo como WhatsApp para máquinas:

- La planta **publica** en el tema: `sensors/plant-01/state`
  ```json
  { "temperature": 22.5, "humidity": 61, "soil_moisture": 75 }
  ```
- El servidor **escucha** ese tema y guarda los datos
- La app puede **publicar** en `cmd/plant-01/light` para encender la luz:
  ```json
  { "on": true }
  ```

El ESP32 confirma que recibió la orden publicando el nuevo estado en `state/plant-01/light`.

---

## URLs del proyecto

| ¿Qué? | Dirección | ¿Para quién? |
|---|---|---|
| Dashboard de Grafana | https://miplanta.app/ | Todos pueden ver (sin contraseña) |
| Simulador 3D | https://miplanta.app/sim/ | Demo interactiva |
| Editor de flujos (Node-RED) | https://miplanta.app/nodered/ | Abby (usuario: `abby`) |
| Panel de control de luz | https://miplanta.app/nodered/ui | Abby (mismo usuario) |

---

## Cómo hacer la demo (3 minutos)

### Parte 1 — Los datos en vivo (1 minuto)
1. Abre **https://miplanta.app/** en el navegador
2. Muestra las gráficas de temperatura, humedad y suelo
3. Explica: *"Estos datos vienen del sensor cada minuto. InfluxDB los guarda durante 30 días."*

### Parte 2 — El simulador 3D (1 minuto)
1. Abre **https://miplanta.app/sim/**
2. Mueve los sliders de temperatura y humedad → los valores cambian en tiempo real
3. Presiona **PUBLICAR** → los datos se envían al servidor por MQTT
4. Explica: *"El dato viaja por internet hasta el servidor y en 10 segundos aparece en Grafana."*

### Parte 3 — Controlar la luz (1 minuto)
1. En el simulador, activa el interruptor de **LUZ**
2. La tira LED de la planta 3D se enciende
3. Abre Grafana y muestra el panel "Estado de la luz"
4. Explica: *"El comando viajó del navegador hasta el ESP32 en la planta real."*

---

## Preguntas que puede hacer la profesora

**P: ¿Qué es IoT?**
> IoT significa *Internet of Things* (Internet de las Cosas). Es cuando objetos físicos — como una planta — se conectan a internet y envían datos. Lo mismo hacen los termostatos inteligentes, los relojes deportivos y los sensores de tráfico.

**P: ¿Por qué usaron MQTT y no HTTP normal?**
> MQTT usa muy poca batería y ancho de banda — perfecto para sensores pequeños. HTTP está pensado para páginas web. MQTT está pensado para máquinas que envían datos pequeños con frecuencia.

**P: ¿Dónde están guardados los datos?**
> En un servidor en AWS (Amazon Web Services) en Virginia, EE.UU. La base de datos se llama InfluxDB y está diseñada especialmente para datos de series de tiempo, como temperaturas que cambian con el tiempo.

**P: ¿Qué aprendiste tú con este proyecto?**
> Aprendí a usar Node-RED para crear flujos de datos sin escribir mucho código. También entendí cómo los sensores se comunican por internet y cómo visualizar datos en tiempo real.

---

## Glosario rápido

| Término | Explicación simple |
|---|---|
| **IoT** | Objetos físicos conectados a internet |
| **MQTT** | Protocolo de mensajes para máquinas (como WhatsApp pero para sensores) |
| **Broker** | El servidor que recibe y distribuye mensajes MQTT (Mosquitto) |
| **Topic** | El "canal" de un mensaje MQTT, ej. `sensors/plant-01/state` |
| **Node-RED** | Programa visual para conectar sensores con bases de datos |
| **InfluxDB** | Base de datos especializada en guardar datos que cambian con el tiempo |
| **Grafana** | Programa para hacer gráficas bonitas de datos en tiempo real |
| **ESP32** | Microcontrolador pequeño con WiFi que conecta los sensores al internet |
| **API** | Interfaz para que programas se hablen entre sí por internet |
| **HTTPS** | Protocolo seguro para navegar por internet (el candado en el navegador) |
| **Docker** | Sistema que empaqueta programas para que funcionen igual en cualquier servidor |
| **AWS** | Amazon Web Services — los servidores en la nube de Amazon |

---

## Plan B (si algo falla el día de la demo)

1. **Si el internet no funciona:** el simulador guarda los últimos valores en la pantalla — muestra la interfaz sin conexión y explica el concepto con los sliders
2. **Si Grafana no carga:** muestra capturas de pantalla guardadas en el celular
3. **Si el servidor está caído:** usa las capturas + el video de demostración que hiciste antes
4. **Si preguntan algo que no sabes:** "Eso lo diseñó mi papá — yo me encargué de los flujos en Node-RED y de entender cómo funciona el protocolo MQTT"

---

*Hecho con ❤️ por papá. ¡Tú puedes, Abby! 🌿*
