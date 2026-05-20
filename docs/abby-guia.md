# Guía para Abby — Proyecto Fontana

Hola Abby. Este es **tu** proyecto. Aquí te dejo, en cristiano, qué es cada
pieza y qué papel jugaste tú. Léelo dos veces y vas a poder explicarlo sin
miedo el lunes.

## La idea en una frase

Una planta tiene sensores que cuentan cómo se siente (temperatura, humedad,
qué tan seca está la tierra). Esos datos viajan por internet hasta un tablero
que tú y tu profe pueden ver desde cualquier celular o computador.

## La analogía postal (úsala en la presentación)

Imagínate que cada sensor de la planta es una **persona escribiendo una
cartica** cada minuto. La cartica dice cosas tipo "tengo 22 grados, la tierra
está al 65% de humedad". Pero la persona no sabe a quién mandársela.

- **El MQTT broker (Mosquitto)** es la **oficina de correos** del barrio.
  Recibe todas las carticas y las clasifica por dirección.
- Los **topics** son las **direcciones de buzón**. Por ejemplo
  `sensors/plant-01/state` es como decir "para todos los que quieran saber
  cómo está la planta 1".
- **Node-RED** es el **traductor y organizador** de la oficina. Toma cada
  cartica, le entiende lo que dice, y decide a dónde la guarda.
- **InfluxDB** es el **archivo histórico**. Guarda todas las carticas en
  orden por fecha para poder ver cómo cambia la planta con el tiempo.
- **Grafana** es el **tablero del salón**. Pinta las carticas en gráficas
  bonitas para que cualquiera entienda de un vistazo.
- El **Simulador 3D** es una **planta de mentiras** (en el navegador) que
  manda carticas como si fuera real. Sirve para mostrar el sistema sin
  necesidad de tener la planta física conectada.

## Diagrama (cópialo en la cartelera si quieres)

```
   🪴 Planta + sensores ──cartica──▶ 🏤 Mosquitto ──┐
                                                    ├─▶ 🗂️ InfluxDB ──▶ 📊 Grafana
   💻 Simulador 3D     ──cartica──▶              ──┘            (tablero)
                                       ▲
                                       │
                                  🤖 Node-RED
                                  (organiza)
```

## Glosario rápido (una línea cada uno)

| Concepto       | En una frase                                                                  |
| -------------- | ----------------------------------------------------------------------------- |
| Sensor         | Componente físico que mide algo del mundo real (temperatura, humedad, etc.).  |
| Arduino/ESP32  | El cerebrito que lee los sensores y manda los datos por WiFi.                 |
| MQTT broker    | El cartero central: recibe los mensajes y los reparte a quien los necesita.   |
| Node-RED       | Un editor visual donde arrastras bloques para decir qué hacer con cada dato.  |
| InfluxDB       | Una base de datos especializada en guardar mediciones a lo largo del tiempo.  |
| Grafana        | Un programa que dibuja gráficas a partir de los datos guardados.              |
| Simulador 3D   | Una página web con una planta dibujada en 3D que finge ser una planta real.   |

## Tu papel en el proyecto (esto es importante)

No te dejes decir que "tu papá hizo todo". Estos pedazos los hiciste **tú**:

1. **El flujo de Node-RED**: tú armaste, en la pantalla de Node-RED, el
   camino que siguen los datos cuando llegan. Cada bloque que conectaste es
   una decisión tuya.
2. **El diseño del tablero en Grafana**: los colores, los títulos en
   español, qué gráfica va arriba y cuál va abajo — eso lo elegiste tú.
3. **La planta**: tú escogiste qué planta poner (no es un detalle menor —
   define qué rangos de humedad y temperatura son sanos).
4. **La presentación**: tú vas a explicar el sistema. Eso significa que
   **tú** entiendes el sistema. Eso es lo que el profesor quiere ver.

## Cosas que probablemente te preguntará el profe

- *¿Y si se cae el internet?* → Los sensores siguen midiendo, pero no se
  guarda nada hasta que vuelva. La planta no se muere por eso.
- *¿Quién puede ver los datos?* → Cualquier persona con el link. El tablero
  es público (modo lector). Para editar el flujo se necesita usuario y clave.
- *¿Es seguro?* → Para un proyecto de colegio, sí. Si esto fuera una
  empresa, encriptaríamos también los mensajes de los sensores (hoy van
  en texto plano por simplicidad).
- *¿Cuánto cuesta?* → Como 15 dólares al mes el servidor, más unos 12
  dólares al año el dominio. Más barato que Netflix.

## Si algo se rompe el día de la demo

1. Respira.
2. Si no carga el tablero: usá el simulador 3D, ese vive en tu computador.
3. Si no carga nada: cuenta el proyecto con el diagrama. Tú entiendes el
   sistema; las fallas técnicas no le quitan mérito a eso.

Tú lo tienes. Dale con toda. — pa'
