import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { TelemetryPanel, type MetricCard } from "./components/TelemetryPanel";
import { CommandPanel } from "./components/CommandPanel";
import { EventLogStrip } from "./components/EventLogStrip";
import { BootSequence } from "./components/BootSequence";
import { SceneStage } from "./components/SceneStage";
import { useMqtt } from "./mqtt";
import { S } from "./lib/strings";
import {
  humidityStatus,
  soilStatus,
  tempStatus,
  type Status,
} from "./lib/threshold";
import { SoundManager } from "./sound/synth";
import { useDebugControls } from "./controls";

const HISTORY_MAX = 60;

interface Readings {
  temperature: number;
  humidity: number;
  soil_moisture: number;
}

export default function App() {
  const { status, lightOn, publish, commandLight } = useMqtt();

  const [readings, setReadings] = useState<Readings>({
    temperature: 22,
    humidity: 60,
    soil_moisture: 70,
  });
  const [autoMode, setAutoMode] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  const [tHistory, setTHistory] = useState<number[]>([]);
  const [hHistory, setHHistory] = useState<number[]>([]);
  const [sHistory, setSHistory] = useState<number[]>([]);

  const prevStatuses = useRef<{ t: Status; h: Status; s: Status }>({
    t: "nominal",
    h: "nominal",
    s: "nominal",
  });

  useEffect(() => {
    if (!autoMode) return;
    const id = setInterval(() => {
      setReadings((r) => ({
        temperature: clamp(r.temperature + (Math.random() - 0.5) * 0.4, 5, 38),
        humidity: clamp(r.humidity + (Math.random() - 0.5) * 1.2, 15, 95),
        soil_moisture: clamp(r.soil_moisture + (Math.random() - 0.5) * 0.8, 15, 90),
      }));
    }, 1500);
    return () => clearInterval(id);
  }, [autoMode]);

  const publishTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (publishTimerRef.current != null) window.clearTimeout(publishTimerRef.current);
    publishTimerRef.current = window.setTimeout(() => publish(readings), 250);
    return () => {
      if (publishTimerRef.current != null) window.clearTimeout(publishTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings.temperature, readings.humidity, readings.soil_moisture, status]);

  useEffect(() => {
    const id = setInterval(() => publish(readings), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings.temperature, readings.humidity, readings.soil_moisture]);

  useEffect(() => {
    const id = setInterval(() => {
      setTHistory((h) => trim([...h, readings.temperature]));
      setHHistory((h) => trim([...h, readings.humidity]));
      setSHistory((h) => trim([...h, readings.soil_moisture]));
    }, 1000);
    return () => clearInterval(id);
  }, [readings]);

  useDebugControls({
    onForcePublish: () => publish(readings),
    onForceCommand: (on) => commandLight(on),
  });

  useEffect(() => {
    const t = tempStatus(readings.temperature);
    const h = humidityStatus(readings.humidity);
    const s = soilStatus(readings.soil_moisture);
    const prev = prevStatuses.current;
    if (
      (t === "critical" && prev.t !== "critical") ||
      (h === "critical" && prev.h !== "critical") ||
      (s === "critical" && prev.s !== "critical")
    ) {
      SoundManager.play("chirp");
    }
    prevStatuses.current = { t, h, s };
  }, [readings.temperature, readings.humidity, readings.soil_moisture]);

  const metrics: MetricCard[] = [
    {
      key: "temperature",
      label: S.metrics.temperature,
      value: readings.temperature,
      unit: S.metrics.tempUnit,
      status: tempStatus(readings.temperature),
      history: tHistory,
      min: 0,
      max: 40,
      precision: 1,
    },
    {
      key: "humidity",
      label: S.metrics.humidity,
      value: readings.humidity,
      unit: S.metrics.pctUnit,
      status: humidityStatus(readings.humidity),
      history: hHistory,
      min: 0,
      max: 100,
      precision: 0,
    },
    {
      key: "soil",
      label: S.metrics.soil,
      value: readings.soil_moisture,
      unit: S.metrics.pctUnit,
      status: soilStatus(readings.soil_moisture),
      history: sHistory,
      min: 0,
      max: 100,
      precision: 0,
    },
  ];

  return (
    /* Root: fixed full-screen so nothing can ever overflow or scroll */
    <div
      className="fixed inset-0 overflow-hidden bg-bg-base font-display text-text-primary"
      onClick={() => SoundManager.unlock()}
    >
      {/* 3D canvas fills the entire screen as background */}
      <SceneStage
        temperature={readings.temperature}
        humidity={readings.humidity}
        soilMoisture={readings.soil_moisture}
        lightOn={lightOn}
        showLabels={showLabels}
        linkStatus={status}
      />

      {/* Header — full width, top */}
      <div className="absolute inset-x-0 top-0 z-20">
        <Header status={status} />
      </div>

      {/* Left panel — hidden on narrow screens */}
      <div className="absolute bottom-9 left-0 top-12 z-10 hidden w-[300px] border-r border-border-subtle md:block">
        <TelemetryPanel metrics={metrics} />
      </div>

      {/* Right panel — hidden on narrow screens */}
      <div className="absolute bottom-9 right-0 top-12 z-10 hidden w-[300px] border-l border-border-subtle md:block">
        <CommandPanel
          values={readings}
          onChange={setReadings}
          lightOn={lightOn}
          onToggleLight={() => commandLight(!lightOn)}
          autoMode={autoMode}
          onToggleAuto={setAutoMode}
          onPublish={() => publish(readings)}
          showLabels={showLabels}
          onToggleLabels={setShowLabels}
        />
      </div>

      {/* Event log — full width, bottom */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <EventLogStrip />
      </div>

      <BootSequence />
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function trim(arr: number[]): number[] {
  if (arr.length <= HISTORY_MAX) return arr;
  return arr.slice(arr.length - HISTORY_MAX);
}
