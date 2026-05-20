import { Canvas } from "@react-three/fiber";
import { Scene } from "../Scene";
import { Crosshair } from "./Crosshair";
import {
  type Status,
  humidityStatus,
  soilStatus as soilStatusFn,
  tempStatus as tempStatusFn,
} from "../lib/threshold";

interface Props {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightOn: boolean;
  showLabels: boolean;
  linkStatus: "connecting" | "connected" | "disconnected" | "error";
}

export function SceneStage({
  temperature,
  humidity,
  soilMoisture,
  lightOn,
  showLabels,
  linkStatus,
}: Props) {
  const tStat: Status = tempStatusFn(temperature);
  const hStat: Status = humidityStatus(humidity);
  const sStat: Status = soilStatusFn(soilMoisture);

  return (
    /*
     * SceneStage is a full-screen background layer (position:absolute fills
     * the fixed root).  The Canvas is inside a div we own — r3f's internal
     * wrappers (position:static / position:relative) live entirely inside
     * this absolutely-positioned subtree and can never influence parent layout.
     */
    <div className="absolute inset-0 bg-bg-base">
      <div className="pointer-events-none absolute inset-0 mc-bg-grid opacity-25" />

      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [4, 2.4, 5], fov: 50 }}
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent" }}
        >
          <Scene
            temperature={temperature}
            humidity={humidity}
            soilMoisture={soilMoisture}
            lightOn={lightOn}
            showLabels={showLabels}
            tempStatus={tStat}
            humStatus={hStat}
            soilStatus={sStat}
          />
        </Canvas>
      </div>

      <Crosshair />

      <div className="pointer-events-none absolute left-3 top-14 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide2 text-text-dim md:left-[316px]">
        <span className="h-1 w-1 rounded-full bg-accent-cyan" />
        <span>SIM-WEB / DEVICE_ID=sim-web</span>
      </div>

      <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-wide2 text-text-faint">
        {linkStatus === "connected"
          ? "TELEMETRY UPLINK · NOMINAL"
          : linkStatus === "connecting"
            ? "TELEMETRY UPLINK · SYNC"
            : "TELEMETRY UPLINK · DEGRADED"}
      </div>
    </div>
  );
}
