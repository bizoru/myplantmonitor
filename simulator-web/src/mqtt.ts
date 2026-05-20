import mqtt, { type MqttClient } from "mqtt";
import { useEffect, useRef, useState } from "react";
import { eventBus } from "./lib/eventBus";
import { SoundManager } from "./sound/synth";

const DEVICE_ID = "sim-web";

interface Readings {
  temperature: number;
  humidity: number;
  soil_moisture: number;
}

export type Status = "connecting" | "connected" | "disconnected" | "error";

/**
 * Connects to wss://${window.location.host}/mqtt with credentials from URL
 * query params (?user=X&pass=Y) — convenient for the demo. Falls back to env-
 * baked values for `npm run dev` (set in .env.local as VITE_MQTT_*).
 */
export function useMqtt() {
  const [status, setStatus] = useState<Status>("connecting");
  const [lightOn, setLightOn] = useState(false);
  const [seq, setSeq] = useState<number>(0);
  const seqRef = useRef<number>(0);
  const clientRef = useRef<MqttClient | null>(null);
  const lastCmdAtRef = useRef<number | null>(null);

  useEffect(() => {
    const url =
      import.meta.env.VITE_MQTT_URL ?? `wss://${window.location.host}/mqtt`;

    const params = new URLSearchParams(window.location.search);
    const username =
      params.get("user") ?? import.meta.env.VITE_MQTT_USER ?? "plant";
    const password =
      params.get("pass") ?? import.meta.env.VITE_MQTT_PASSWORD ?? "";

    const client = mqtt.connect(url, {
      username,
      password,
      clientId: `sim-web-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 3000,
    });

    clientRef.current = client;

    let connectedOnce = false;
    client.on("connect", () => {
      setStatus("connected");
      if (!connectedOnce) {
        eventBus.emit("info", "LINK_UP broker=mqtt/wss");
        connectedOnce = true;
      } else {
        eventBus.emit("info", "LINK_UP (reconnect)");
      }
      client.subscribe(`cmd/${DEVICE_ID}/light`);
    });
    client.on("reconnect", () => setStatus("connecting"));
    client.on("close", () => {
      setStatus("disconnected");
      if (connectedOnce) {
        eventBus.emit("critical", "LINK_LOST reconnecting…");
        connectedOnce = false;
      }
    });
    client.on("error", (err) => {
      console.error("mqtt error", err);
      setStatus("error");
      eventBus.emit("critical", `LINK_ERR ${String(err?.message ?? err)}`);
    });

    client.on("message", (topic, payload) => {
      if (topic !== `cmd/${DEVICE_ID}/light`) return;
      try {
        const msg = JSON.parse(payload.toString()) as { on?: boolean };
        const on = Boolean(msg.on);
        setLightOn(on);
        // Compute latency vs the last local CMD_TX, if any.
        const latency =
          lastCmdAtRef.current != null
            ? Date.now() - lastCmdAtRef.current
            : null;
        eventBus.emit(
          "info",
          `STATE_RX light=${on ? "on" : "off"}${latency != null ? ` (latency ${latency}ms)` : ""}`,
        );
        SoundManager.play("thunk");
        // Echo state back so other subscribers can see canonical state.
        client.publish(`state/${DEVICE_ID}/light`, JSON.stringify({ on }), {
          retain: true,
        });
      } catch (e) {
        console.warn("bad cmd payload", e);
      }
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
  }, []);

  function publish(readings: Readings) {
    const c = clientRef.current;
    if (!c || !c.connected) return;
    const payload = {
      temperature: readings.temperature,
      humidity: readings.humidity,
      soil_moisture: readings.soil_moisture,
      ts: new Date().toISOString(),
    };
    c.publish(`sensors/${DEVICE_ID}/state`, JSON.stringify(payload));
    seqRef.current += 1;
    setSeq(seqRef.current);
    eventBus.emit(
      "rx",
      `PKT_RX seq=${seqRef.current} T=${readings.temperature.toFixed(1)} H=${readings.humidity.toFixed(1)} S=${readings.soil_moisture.toFixed(1)}`,
    );
    SoundManager.play("blip");
  }

  /** Publish a light command from the UI. */
  function commandLight(on: boolean) {
    const c = clientRef.current;
    if (!c || !c.connected) return;
    lastCmdAtRef.current = Date.now();
    c.publish(`cmd/${DEVICE_ID}/light`, JSON.stringify({ on }));
    eventBus.emit("tx", `CMD_TX light=${on ? "on" : "off"}`);
    SoundManager.play("click");
  }

  return { status, lightOn, publish, commandLight, seq };
}
