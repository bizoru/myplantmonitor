import { useMissionClock } from "../lib/missionClock";
import { S } from "../lib/strings";
import { StatusPill } from "./StatusPill";
import type { Status } from "../mqtt";

interface Props {
  status: Status;
}

export function Header({ status }: Props) {
  const t = useMissionClock();

  let pill;
  if (status === "connected") {
    pill = <StatusPill label={S.link.active} tone="active" pulse />;
  } else if (status === "connecting") {
    pill = <StatusPill label={S.link.connecting} tone="warn" pulse />;
  } else {
    pill = <StatusPill label={S.link.lost} tone="lost" />;
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-border-subtle bg-bg-panel px-4 shadow-panel-glow">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Brand monogram. */}
          <div className="flex h-6 w-6 items-center justify-center rounded-sm border border-accent-cyan/60 bg-bg-base">
            <div className="h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-[0_0_6px_#00d4ff]" />
          </div>
          <span className="font-display text-sm font-semibold tracking-hero text-text-primary">
            {S.brand}
          </span>
        </div>
        <span className="hidden h-4 w-px bg-border-subtle md:block" />
        <span className="hidden font-mono text-[11px] uppercase tracking-wide2 text-text-dim md:inline">
          {S.mission}
        </span>
      </div>

      <div className="font-mono text-sm tabnum text-text-primary">{t}</div>

      <div className="flex items-center gap-2">{pill}</div>
    </header>
  );
}
