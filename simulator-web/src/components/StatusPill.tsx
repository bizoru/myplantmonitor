import clsx from "clsx";

interface Props {
  label: string;
  tone?: "active" | "lost" | "warn" | "neutral";
  pulse?: boolean;
  className?: string;
}

const toneMap = {
  active: { dot: "bg-status-nominal", text: "text-status-nominal" },
  lost: { dot: "bg-status-critical", text: "text-status-critical" },
  warn: { dot: "bg-status-warn", text: "text-status-warn" },
  neutral: { dot: "bg-text-dim", text: "text-text-dim" },
} as const;

export function StatusPill({
  label,
  tone = "active",
  pulse = false,
  className,
}: Props) {
  const t = toneMap[tone];
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 px-2.5 py-1 border border-border-subtle bg-bg-panel/70 rounded-sm font-mono text-[11px] tracking-wide2 uppercase",
        t.text,
        className,
      )}
    >
      <span
        className={clsx(
          "inline-block h-2 w-2 rounded-full",
          t.dot,
          pulse && "animate-pulseDot",
        )}
        style={{ boxShadow: pulse ? "0 0 8px currentColor" : undefined }}
      />
      <span>{label}</span>
    </div>
  );
}
