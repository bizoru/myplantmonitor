/**
 * Tiny pub/sub used to ship events from the MQTT layer
 * (and threshold logic) into the Event Log strip.
 */

export type EventLevel = "info" | "warn" | "critical" | "tx" | "rx";

export interface LogEvent {
  id: number;
  ts: Date;
  level: EventLevel;
  text: string;
}

type Listener = (e: LogEvent) => void;

let nextId = 1;
const listeners = new Set<Listener>();

export const eventBus = {
  emit(level: EventLevel, text: string): LogEvent {
    const ev: LogEvent = { id: nextId++, ts: new Date(), level, text };
    listeners.forEach((l) => {
      try {
        l(ev);
      } catch {
        /* swallow listener errors */
      }
    });
    return ev;
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
