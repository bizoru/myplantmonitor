import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronRight, Send, Eye, EyeOff } from "lucide-react";
import { Leva } from "leva";
import { S } from "../lib/strings";
import { SoundManager } from "../sound/synth";

interface SliderState {
  temperature: number;
  humidity: number;
  soil_moisture: number;
}

interface Props {
  values: SliderState;
  onChange: (next: SliderState) => void;
  lightOn: boolean;
  onToggleLight: () => void;
  autoMode: boolean;
  onToggleAuto: (next: boolean) => void;
  onPublish: () => void;
  showLabels: boolean;
  onToggleLabels: (next: boolean) => void;
}

export function CommandPanel({
  values,
  onChange,
  lightOn,
  onToggleLight,
  autoMode,
  onToggleAuto,
  onPublish,
  showLabels,
  onToggleLabels,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-bg-panel shadow-panel-glow">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wide2 text-text-dim">
          {S.panels.commands}
        </span>
        <div className="flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-accent-cyan/70" />
          <span className="h-1 w-1 rounded-full bg-text-faint" />
        </div>
      </div>

      <div className="mc-scroll flex flex-1 flex-col overflow-y-auto">
        {/* Light toggle. */}
        <Section title={S.buttons.light}>
          <button
            type="button"
            onClick={() => {
              SoundManager.unlock();
              onToggleLight();
            }}
            className={clsx(
              "group relative flex w-full items-center justify-between border px-3 py-3 font-mono text-xs uppercase tracking-wide2 transition-colors",
              lightOn
                ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan shadow-[0_0_24px_rgba(0,212,255,0.25)]"
                : "border-border-subtle bg-bg-base text-text-dim hover:bg-bg-panel-hi",
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={clsx(
                  "h-2 w-2 rounded-full",
                  lightOn ? "bg-accent-cyan" : "bg-text-faint",
                )}
                style={{
                  boxShadow: lightOn ? "0 0 10px #00d4ff" : undefined,
                }}
              />
              {S.buttons.light}
            </span>
            <span className={lightOn ? "text-accent-cyan" : "text-text-faint"}>
              {lightOn ? S.buttons.on : S.buttons.off}
            </span>
          </button>
        </Section>

        {/* Auto-mode + 3D labels. */}
        <Section title={S.panels.settings}>
          <Checkbox
            label={S.buttons.autoMode}
            checked={autoMode}
            onChange={(v) => {
              SoundManager.play("click");
              onToggleAuto(v);
            }}
          />
          <Checkbox
            label={S.buttons.showLabels}
            checked={showLabels}
            onChange={(v) => {
              SoundManager.play("click");
              onToggleLabels(v);
            }}
            icon={
              showLabels ? (
                <Eye size={12} className="text-accent-cyan" />
              ) : (
                <EyeOff size={12} className="text-text-faint" />
              )
            }
          />

          <div className="mt-3 space-y-3">
            <Slider
              label={S.sliders.temperature}
              value={values.temperature}
              min={-5}
              max={45}
              step={0.1}
              unit="°C"
              precision={1}
              disabled={autoMode}
              onChange={(v) =>
                onChange({ ...values, temperature: v })
              }
              onCommit={() => SoundManager.play("click")}
            />
            <Slider
              label={S.sliders.humidity}
              value={values.humidity}
              min={0}
              max={100}
              step={1}
              unit="%"
              precision={0}
              disabled={autoMode}
              onChange={(v) => onChange({ ...values, humidity: v })}
              onCommit={() => SoundManager.play("click")}
            />
            <Slider
              label={S.sliders.soil}
              value={values.soil_moisture}
              min={0}
              max={100}
              step={1}
              unit="%"
              precision={0}
              disabled={autoMode}
              onChange={(v) =>
                onChange({ ...values, soil_moisture: v })
              }
              onCommit={() => SoundManager.play("click")}
            />
          </div>
        </Section>

        {/* Publish button. */}
        <Section>
          <button
            type="button"
            onClick={() => {
              SoundManager.unlock();
              SoundManager.play("click");
              onPublish();
            }}
            className="flex w-full items-center justify-center gap-2 border border-accent-cyan/70 bg-accent-cyan/10 px-3 py-2.5 font-mono text-xs font-medium uppercase tracking-wide2 text-accent-cyan transition-colors hover:bg-accent-cyan/20"
          >
            <Send size={12} />
            {S.buttons.publish}
          </button>
        </Section>

        {/* Advanced (leva) collapse. */}
        <div className="border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wide2 text-text-dim hover:text-text-primary"
          >
            {advancedOpen ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            <span>{S.panels.advanced}</span>
            <span className="ml-auto text-[10px] text-text-faint">
              leva debug
            </span>
          </button>
          {advancedOpen ? (
            <div className="px-3 pb-4">
              <Leva
                fill
                flat
                hideCopyButton
                titleBar={false}
                theme={{
                  colors: {
                    elevation1: "#10151f",
                    elevation2: "#161c2a",
                    elevation3: "#1a2332",
                    accent1: "#00d4ff",
                    accent2: "#00d4ff",
                    accent3: "#00d4ff",
                    highlight1: "#8a96a8",
                    highlight2: "#e8eef5",
                    highlight3: "#e8eef5",
                  },
                  sizes: {
                    rootWidth: "100%",
                    controlWidth: "60%",
                  },
                  fontSizes: {
                    root: "10px",
                  },
                }}
              />
            </div>
          ) : (
            // Render hidden leva so its store still mounts and useControls hooks
            // (called elsewhere) don't error out. Hide visually only.
            <div className="hidden">
              <Leva hidden />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border-subtle px-4 py-3">
      {title ? (
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wide2 text-text-faint">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1 font-mono text-[11px] uppercase tracking-wide2 text-text-dim hover:text-text-primary">
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span
        role="checkbox"
        aria-checked={checked}
        className={clsx(
          "flex h-4 w-4 items-center justify-center border",
          checked
            ? "border-accent-cyan bg-accent-cyan/20 text-accent-cyan"
            : "border-border-strong bg-bg-base text-transparent",
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {checked ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
            <path
              d="M2 6.5 L5 9 L10 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
            />
          </svg>
        ) : null}
      </span>
    </label>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  precision: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  onCommit?: () => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  precision,
  disabled,
  onChange,
  onCommit,
}: SliderProps) {
  return (
    <div className={clsx(disabled && "opacity-50")}>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wide2 text-text-dim">
        <span>{label}</span>
        <span className="tabnum text-accent-cyan">
          {value.toFixed(precision)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="mc-range mt-1.5"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        onKeyUp={onCommit}
      />
    </div>
  );
}
