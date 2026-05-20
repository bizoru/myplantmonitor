import { useId } from "react";

interface Props {
  points: number[];
  min?: number;
  max?: number;
  color?: string;
  width?: number;
  height?: number;
  /** Show a subtle gradient fill below the line. */
  fill?: boolean;
}

export function Sparkline({
  points,
  min,
  max,
  color = "#00d4ff",
  width = 240,
  height = 36,
  fill = true,
}: Props) {
  const reactId = useId();
  const gradId = `spark-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (points.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        aria-hidden
      >
        <line
          x1="0"
          y1={height - 1}
          x2={width}
          y2={height - 1}
          stroke="#1a2332"
          strokeWidth="1"
        />
      </svg>
    );
  }

  const lo = min ?? Math.min(...points);
  const hi = max ?? Math.max(...points);
  const span = hi - lo || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const coords = points.map((v, i) => {
    const x = i * stepX;
    const y = height - 2 - ((v - lo) / span) * (height - 4);
    return [x, y] as const;
  });

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${(coords[coords.length - 1][0]).toFixed(1)},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 2px ${color}aa)` }}
      />
      {/* End-point dot. */}
      <circle
        cx={coords[coords.length - 1][0]}
        cy={coords[coords.length - 1][1]}
        r={1.6}
        fill={color}
      />
    </svg>
  );
}
