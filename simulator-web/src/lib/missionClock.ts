import { useEffect, useState } from "react";

const STORAGE_KEY = "miplanta:t0";

function getOrInitT0(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Date.parse(stored);
      if (!Number.isNaN(parsed)) return parsed;
    }
    const now = new Date();
    localStorage.setItem(STORAGE_KEY, now.toISOString());
    return now.getTime();
  } catch {
    return Date.now();
  }
}

function format(elapsedMs: number): string {
  const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `T+${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function useMissionClock(): string {
  const [t0] = useState<number>(() => getOrInitT0());
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return format(now - t0);
}

export function localTimestamp(d: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
