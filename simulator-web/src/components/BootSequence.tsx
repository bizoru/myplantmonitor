import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { S } from "../lib/strings";
import { SoundManager } from "../sound/synth";

const SESSION_KEY = "miplanta:booted";

const LINES = [
  "> INITIALIZING TELEMETRY UPLINK ........ OK",
  "> CHECKING SENSOR ARRAY .................. OK",
  "> ESTABLISHING BROKER CONNECTION ........ OK",
  "> ALL SYSTEMS NOMINAL",
];

export function BootSequence() {
  const [shouldShow] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [visible, setVisible] = useState<boolean>(shouldShow);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (!shouldShow) return;
    SoundManager.play("boot");

    const lineInterval = setInterval(() => {
      setLineIdx((i) => {
        if (i >= LINES.length - 1) {
          clearInterval(lineInterval);
          return i;
        }
        return i + 1;
      });
    }, 320);

    const fadeTimeout = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 1800);

    return () => {
      clearInterval(lineInterval);
      clearTimeout(fadeTimeout);
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-bg-base"
        >
          <div className="absolute inset-0 mc-bg-grid opacity-30" />
          {/* Scan line. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 h-px bg-accent-cyan/30 animate-scan" />
          </div>

          <div className="relative w-[min(560px,90vw)] border border-border-subtle bg-bg-panel/80 p-6 shadow-panel-glow backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="font-display text-sm font-semibold tracking-hero text-accent-cyan">
                {S.brand}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wide2 text-text-dim">
                BOOT SEQUENCE
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs text-text-primary">
              {LINES.slice(0, lineIdx + 1).map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  className={
                    i === LINES.length - 1
                      ? "text-status-nominal"
                      : "text-text-primary"
                  }
                >
                  {line}
                </motion.div>
              ))}
              {lineIdx < LINES.length - 1 && (
                <motion.span
                  className="inline-block h-3 w-1.5 bg-accent-cyan"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
              )}
            </div>

            <div className="mt-5 border-t border-border-subtle pt-3 font-mono text-[10px] uppercase tracking-wide2 text-text-faint">
              {S.attribution}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
