export type Status = "nominal" | "warn" | "critical";

export function tempStatus(c: number): Status {
  if (c >= 18 && c <= 30) return "nominal";
  if (c >= 10 && c <= 35) return "warn";
  return "critical";
}

export function humidityStatus(h: number): Status {
  if (h >= 40 && h <= 70) return "nominal";
  if (h >= 20 && h <= 90) return "warn";
  return "critical";
}

export function soilStatus(s: number): Status {
  if (s >= 40 && s <= 80) return "nominal";
  if (s >= 20) return "warn";
  return "critical";
}

export function statusColor(s: Status): string {
  switch (s) {
    case "nominal":
      return "#10b981";
    case "warn":
      return "#f59e0b";
    case "critical":
      return "#ef4444";
  }
}

export function statusTextClass(s: Status): string {
  switch (s) {
    case "nominal":
      return "text-status-nominal";
    case "warn":
      return "text-status-warn";
    case "critical":
      return "text-status-critical";
  }
}
