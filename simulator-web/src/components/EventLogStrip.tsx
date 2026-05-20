import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { eventBus, type LogEvent } from "../lib/eventBus";
import { localTimestamp } from "../lib/missionClock";
import { S } from "../lib/strings";
import { MuteToggle } from "./MuteToggle";

const MAX_EVENTS = 40;

export function EventLogStrip() {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return eventBus.subscribe((e) => {
      setEvents((prev) => {
        const next = [...prev, e];
        if (next.length > MAX_EVENTS) next.splice(0, next.length - MAX_EVENTS);
        return next;
      });
    });
  }, []);

  // Auto-scroll to right edge as new events arrive.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [events]);

  return (
    <footer className="flex h-9 items-center gap-3 border-t border-border-subtle bg-bg-panel px-3">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide2 text-text-dim">
        {S.panels.eventLog}
      </span>
      <div
        ref={trackRef}
        className="mc-scroll flex flex-1 items-center gap-4 overflow-x-auto whitespace-nowrap font-mono text-[11px] tabnum"
      >
        {events.length === 0 ? (
          <span className="text-text-faint">awaiting telemetry…</span>
        ) : (
          events.map((e) => (
            <span
              key={e.id}
              className={clsx("flex items-center gap-1.5", colorFor(e.level))}
            >
              <span className="text-text-faint">[{localTimestamp(e.ts)}]</span>
              <span>{e.text}</span>
            </span>
          ))
        )}
      </div>

      <span
        className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wide2 text-text-faint md:inline"
        title="Plant model attribution"
      >
        {S.attribution}
      </span>

      <MuteToggle className="shrink-0" />
    </footer>
  );
}

function colorFor(level: LogEvent["level"]): string {
  switch (level) {
    case "tx":
      return "text-accent-cyan";
    case "rx":
      return "text-text-primary";
    case "warn":
      return "text-status-warn";
    case "critical":
      return "text-status-critical";
    default:
      return "text-text-dim";
  }
}
