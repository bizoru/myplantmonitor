import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import clsx from "clsx";
import { SoundManager } from "../sound/synth";

interface Props {
  className?: string;
}

export function MuteToggle({ className }: Props) {
  const [muted, setMuted] = useState<boolean>(SoundManager.isMuted());

  // Re-sync once on mount in case the manager was touched elsewhere.
  useEffect(() => {
    setMuted(SoundManager.isMuted());
  }, []);

  function toggle() {
    SoundManager.unlock();
    const next = SoundManager.toggleMuted();
    setMuted(next);
    if (!next) SoundManager.play("click");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={muted ? "Activar audio" : "Silenciar"}
      className={clsx(
        "inline-flex items-center gap-2 px-2.5 py-1.5 border border-border-subtle bg-bg-panel hover:bg-bg-panel-hi rounded-sm font-mono text-[11px] uppercase tracking-wide2",
        muted ? "text-status-warn" : "text-accent-cyan",
        className,
      )}
    >
      {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      <span>{muted ? "MUTED" : "AUDIO"}</span>
    </button>
  );
}
