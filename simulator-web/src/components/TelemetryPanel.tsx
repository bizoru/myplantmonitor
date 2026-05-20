import { S } from "../lib/strings";
import {
  type Status,
  statusColor,
  statusTextClass,
} from "../lib/threshold";
import { Sparkline } from "./Sparkline";

export interface MetricCard {
  key: "temperature" | "humidity" | "soil";
  label: string;
  value: number;
  unit: string;
  status: Status;
  history: number[];
  min: number;
  max: number;
  precision?: number;
}

interface Props {
  metrics: MetricCard[];
}

export function TelemetryPanel({ metrics }: Props) {
  return (
    <aside className="flex h-full flex-col bg-bg-panel shadow-panel-glow">
      <PanelHeader title={S.panels.telemetry} />
      <div className="flex flex-1 flex-col">
        {metrics.map((m, idx) => (
          <Metric
            key={m.key}
            metric={m}
            divider={idx < metrics.length - 1}
          />
        ))}
      </div>
    </aside>
  );
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
      <span className="font-mono text-[11px] font-medium uppercase tracking-wide2 text-text-dim">
        {title}
      </span>
      <div className="flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-accent-cyan/70" />
        <span className="h-1 w-1 rounded-full bg-text-faint" />
        <span className="h-1 w-1 rounded-full bg-text-faint" />
      </div>
    </div>
  );
}

function Metric({
  metric,
  divider,
}: {
  metric: MetricCard;
  divider: boolean;
}) {
  const color = statusColor(metric.status);
  const statusClass = statusTextClass(metric.status);
  const valStr = metric.value.toFixed(metric.precision ?? 1);

  let statusLabel: string;
  switch (metric.status) {
    case "nominal":
      statusLabel = S.status.nominal;
      break;
    case "warn":
      statusLabel = S.status.warn;
      break;
    case "critical":
      statusLabel = S.status.critical;
      break;
  }

  return (
    <div
      className={`px-4 py-4 ${divider ? "border-b border-border-subtle" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-accent-cyan/80 font-mono text-[10px]"
            aria-hidden
          >
            ▸
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wide2 text-text-dim">
            {metric.label}
          </span>
        </div>
        <span
          className={`font-mono text-[10px] uppercase tracking-wide2 ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`font-mono tabnum text-3xl font-medium ${statusClass}`}
        >
          {valStr}
        </span>
        <span className="font-mono text-xs uppercase tracking-wide2 text-text-dim">
          {metric.unit}
        </span>
      </div>

      <div className="mt-2">
        <Sparkline
          points={metric.history}
          min={metric.min}
          max={metric.max}
          color={color}
          height={32}
        />
      </div>

      <div className="mt-1 flex justify-between font-mono text-[10px] tabnum text-text-faint">
        <span>{metric.min.toFixed(0)}</span>
        <span>{metric.max.toFixed(0)}</span>
      </div>
    </div>
  );
}
