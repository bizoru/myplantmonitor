# Script de Demo — 3 minutos

Para Abby. Léelo en voz alta dos o tres veces antes del lunes. Las frases en
**negrita** son lo que dices; los `> bloques` son lo que haces en pantalla.

## Antes de empezar

- Tener dos pestañas abiertas:
  1. `https://miplanta.app/` (Grafana — tablero)
  2. `https://miplanta.app/sim` (Simulador 3D)
- Tener el simulador-cli corriendo en el portátil para
  que el tablero ya tenga datos cuando lo abras.
- Volumen del computador en silencio (no queremos sustos con sonidos).

## Paso 1 — Apertura (20 segundos)

> Pestaña de Grafana al frente.

**"Buenas. Este proyecto monitorea las condiciones de una planta usando
sensores e Internet. La idea es saber, en tiempo real y desde cualquier
lugar, si la planta tiene calor, frío, sed o si necesita luz."**

## Paso 2 — Mostrar datos en vivo (30 segundos)

> Señalar las gráficas de temperatura, humedad y humedad de suelo.

**"Aquí ven los datos en vivo. Cada minuto los sensores mandan una nueva
medición. Esta línea es la temperatura del aire, esta es la humedad del
aire, y esta es la humedad de la tierra — qué tan seca está."**

> Señalar las cifras grandes (paneles de stat).

**"Y arriba están los valores actuales, en grande, para verlos rápido."**

## Paso 3 — Mostrar el simulador 3D (30 segundos)

> Cambiar a la pestaña del simulador.

**"Para probar el sistema sin tener la planta física conectada armé un
simulador. Es una planta virtual que se comporta como si fuera real: manda
los mismos datos por internet."**

> Mover suavemente el control de la cámara (orbit) para mostrar el 3D.

**"Pueden ver la maceta, la planta, y alrededor una tira de luz LED que
ahora está apagada."**

## Paso 4 — Cambiar un dato y verlo reflejado (40 segundos)

> En el simulador, en el panel de leva (esquina superior derecha), arrastrar
> el slider "🌡️ Temperatura" hacia arriba, hasta unos 35 °C.

**"Voy a subir la temperatura a 35 grados, como si la planta estuviera al
sol."**

> Volver a la pestaña de Grafana. Esperar 5-10 segundos.

**"Y miren cómo el dato sube en el tablero. Lo que pasó es que el simulador
publicó el nuevo valor al broker MQTT, Node-RED lo recibió, lo guardó en la
base de datos, y Grafana lo dibujó. Todo eso en menos de 10 segundos."**

## Paso 5 — Mandar un comando al revés (40 segundos)

> En la pestaña de Grafana, ir al panel "Control de luz" (o al link a
> Node-RED si quedó así). Hacer click en "Encender Luz".

**"Hasta ahora los datos van de la planta hacia nosotros. Pero también
podemos mandarle órdenes a la planta. Voy a encender la luz LED."**

> Cambiar a la pestaña del simulador.

**"Y miren, el comando viajó por internet y la tira LED de la planta
virtual se encendió. Si esto estuviera conectado a una planta real, la luz
real se prendería."**

## Paso 6 — (Opcional, si el Arduino UNO está listo) (20 segundos)

> Si hay tiempo y el Arduino UNO funciona, mostrar la maceta real.

**"Y esto mismo pasa con la planta real, que tiene un microcontrolador
Arduino UNO leyendo sensores de humedad de suelo y temperatura. El sistema no
distingue si los datos vienen del simulador o de la planta de verdad —
para él son lo mismo."**

## Paso 7 — Cierre (30 segundos)

**"En resumen: aprendí a armar un sistema completo de IoT — sensores,
broker MQTT, base de datos de series de tiempo, y dashboards. También
aprendí a desplegar todo en la nube de Amazon, con dominio y certificado
de seguridad. Como próximos pasos quisiera agregar alertas (por ejemplo,
que me avise cuando la tierra esté muy seca) y conectar la planta real."**

**"Gracias."**

## Posibles preguntas del profe (con respuestas)

### 1. "¿Por qué usaste MQTT y no, por ejemplo, una API REST?"

**"MQTT está hecho para dispositivos pequeños como sensores: usa muy poca
batería, muy poco ancho de banda, y permite que muchos aparatos hablen al
mismo tiempo sin saber unos de otros. Una API REST funcionaría, pero
gastaría más recursos del Arduino UNO y sería más complicada para mandar
órdenes en tiempo real."**

### 2. "¿Qué pasa si alguien se conecta y manda datos falsos?"

**"Buen punto. El broker tiene usuario y contraseña, así que un extraño no
puede publicar sin las credenciales. Eso sí, en este proyecto los mensajes
de sensores no van encriptados — se pueden leer si alguien intercepta el
tráfico. Para una planta no importa, pero si esto fuera, por ejemplo, una
empresa con datos sensibles, usaríamos certificados y TLS, o nos
moveríamos a un servicio gestionado como AWS IoT Core."**

### 3. "¿Por qué tantas piezas? ¿No es sobre-ingeniería?"

**"Cada pieza hace una sola cosa muy bien. Mosquitto solo reparte mensajes,
InfluxDB solo guarda series de tiempo, Grafana solo dibuja. Si mañana
quiero cambiar la base de datos, no toco las otras. Es más fácil de
arreglar y de entender que un solo programa que haga todo. En la
industria a esto se le llama "separación de responsabilidades"."**

## Plan B si algo se cae el día de la demo

- **El tablero no carga**: muestra el simulador 3D — vive en tu portátil,
  no depende de internet. Habla del flujo con el diagrama de la cartelera.
- **El simulador 3D no carga**: muestra el tablero con datos viejos.
  Habla del MQTT con la analogía de la oficina de correos.
- **No carga nada**: respira, abre el diagrama en el cuaderno y cuenta el
  sistema con palabras. Tú lo entiendes — eso es lo que el profe va a
  calificar.
