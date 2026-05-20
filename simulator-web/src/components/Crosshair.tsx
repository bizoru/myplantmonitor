/**
 * Pure CSS overlay: 4 corner brackets framing the plant, like a camera reticle.
 * Sits on top of the Canvas (pointer-events: none).
 */
export function Crosshair() {
  const arm = "h-4 w-4 border-accent-cyan/70";
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden="true"
    >
      {/* Bracket frame at 1/4 / 3/4. */}
      <div className="absolute" style={{ top: "25%", left: "25%" }}>
        <div className={`${arm} border-t border-l`} />
      </div>
      <div className="absolute" style={{ top: "25%", right: "25%" }}>
        <div className={`${arm} border-t border-r`} />
      </div>
      <div className="absolute" style={{ bottom: "25%", left: "25%" }}>
        <div className={`${arm} border-b border-l`} />
      </div>
      <div className="absolute" style={{ bottom: "25%", right: "25%" }}>
        <div className={`${arm} border-b border-r`} />
      </div>

      {/* Center reticle. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-12 w-12 opacity-60">
          <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-accent-cyan/60" />
          <div className="absolute left-1/2 bottom-0 h-3 w-px -translate-x-1/2 bg-accent-cyan/60" />
          <div className="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 bg-accent-cyan/60" />
          <div className="absolute top-1/2 right-0 h-px w-3 -translate-y-1/2 bg-accent-cyan/60" />
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-cyan/70" />
        </div>
      </div>

      {/* Corner annotations. */}
      <div className="absolute left-3 top-3 font-mono text-[10px] tracking-wide2 text-accent-cyan/70">
        CAM-01
      </div>
      <div className="absolute right-3 top-3 font-mono text-[10px] tracking-wide2 text-accent-cyan/70">
        REC ●
      </div>
      <div className="absolute left-3 bottom-3 font-mono text-[10px] tracking-wide2 text-accent-cyan/50">
        FOV 50°
      </div>
      <div className="absolute right-3 bottom-3 font-mono text-[10px] tracking-wide2 text-accent-cyan/50">
        ORBIT AUTO
      </div>
    </div>
  );
}
