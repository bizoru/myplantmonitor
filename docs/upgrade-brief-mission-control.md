# Upgrade brief — "Mission Control" aesthetic for simulator-web

This is a self-contained brief for a fresh agent. It transforms the basic
3D simulator at `simulator-web/` into a hyper-polished SpaceX/NASA-style
telemetry interface. Fire when the basic data path (sim → MQTT → Grafana)
is confirmed working.

---

## Project context (no prior conversation)

- Repo: `/Users/steven/repos/myplantmonitor/`
- Subfolder you'll work in: `/Users/steven/repos/myplantmonitor/simulator-web/`
- Owner: Steven Sierra (DevOps/SRE, Bucaramanga, Colombia).
- Real demo user: Abby, 11th grade student in Bogotá. Demo on **2026-05-12**.
  Presentation in Spanish.
- Domain: `miplanta.app`. The simulator is served by Caddy at `https://miplanta.app/sim/`.
- MQTT broker (Mosquitto) is reachable from the browser at `wss://miplanta.app/mqtt`.
- Other services: Node-RED, InfluxDB, Grafana — none of them change in this work.

## Current state of simulator-web (what exists)

- Vite + React 18 + TypeScript.
- Deps: `react-three-fiber`, `drei`, `leva`, `mqtt`.
- Files:
  - `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`
  - `src/main.tsx`, `src/App.tsx`, `src/Scene.tsx`, `src/controls.ts`, `src/mqtt.ts`
- Functional baseline: leva sliders publish sensor JSON to `sensors/sim-web/state`,
  light command subscription on `cmd/sim-web/light` toggles a placeholder light strip.
- Mounted at `/sim/` (Vite `base` is set).

**Do NOT change** the MQTT topic contract or the wire payload shape. Other
components (Node-RED flow, Grafana dashboard, sim-cli) depend on it.

```
sensors/<device_id>/state  →  {"temperature": float, "humidity": float, "soil_moisture": float, "ts": ISO8601}
cmd/<device_id>/light      →  {"on": bool}
state/<device_id>/light    →  {"on": bool}
```

`device_id` for this app stays `sim-web`.

---

## Vision: "Mission Control: Planta-01"

A telemetry interface that feels like a SpaceX webcast or NASA flight
director console. Dark, minimal, monospaced numbers, cyan accents, status
indicators, mission clock, event log. The 3D plant is the hero element,
framed by HUD overlays and surrounded by live telemetry panels.

```
┌─────────────────────────────────────────────────────────────────┐
│ MIPLANTA.APP   MISIÓN: PLANTA-01   T+00:23:14   ● LINK ACTIVE  │
├──────────────────┬──────────────────────────┬──────────────────┤
│ TELEMETRÍA       │                          │ COMANDOS         │
│                  │                          │                  │
│ ▸ TEMPERATURA    │                          │ LUZ      [ ON  ]│
│   22.4 °C  ▂▃▅▆▇ │     [3D PLANTA]          │ AUTO-MODO  [✓]  │
│   NOMINAL        │     ╭──crosshair──╮      │                  │
│                  │     │              │      │ AJUSTES          │
│ ▸ HUMEDAD        │     │   🌿         │      │ T  [====|----]  │
│   61.2 %   ▆▅▆▇▆ │     │              │      │ H  [======|--]  │
│   NOMINAL        │     ╰──────────────╯      │ S  [===|-----]  │
│                  │                          │                  │
│ ▸ SUELO          │     [grid floor / glow]  │ [📤 PUBLICAR]   │
│   68.0 %   ▇▇▆▆▅ │                          │                  │
│   NOMINAL        │                          │ [🔇 SILENCIAR]  │
│                  │                          │                  │
├──────────────────┴──────────────────────────┴──────────────────┤
│ EVENT LOG  [14:32:01] PKT_RX seq=842  [14:31:55] LIGHT_ON ACK  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design system

### Color tokens (Tailwind theme)

| Token            | Hex      | Use                                  |
| ---------------- | -------- | ------------------------------------ |
| `bg.base`        | `#0a0e1a`| App background                       |
| `bg.panel`       | `#10151f`| Panel surfaces                       |
| `bg.panel-hi`    | `#161c2a`| Hovered/raised panels                |
| `border.subtle`  | `#1a2332`| Panel borders, dividers              |
| `border.strong`  | `#2a3650`| Active borders                       |
| `grid.line`      | `#1e2838`| 3D scene grid lines                  |
| `text.primary`   | `#e8eef5`| Main copy                            |
| `text.dim`       | `#8a96a8`| Labels, secondary copy               |
| `text.faint`     | `#4a5468`| Disabled, footer microcopy           |
| `accent.cyan`    | `#00d4ff`| Primary accent, live data, glow      |
| `status.nominal` | `#10b981`| OK / NOMINAL                         |
| `status.warn`    | `#f59e0b`| WARN                                 |
| `status.critical`| `#ef4444`| CRITICAL                             |
| `link.active`    | `#10b981`| Connected MQTT link pulse            |
| `link.lost`      | `#ef4444`| Disconnected link                    |

Never use pure black `#000` or pure white `#fff`.

### Typography

- **UI / labels**: Inter or Space Grotesk via Google Fonts.
- **Telemetry numbers**: JetBrains Mono via Google Fonts. Use `font-variant-numeric: tabular-nums` so digits don't shift width on update.
- Labels: `uppercase`, `letter-spacing: 0.08em`, `text.dim`.
- Numbers: large, monospace, `text.primary` (or status color).
- Tracking on hero text (`MIPLANTA.APP`, `MISIÓN:`): `letter-spacing: 0.15em`.

### Spacing & shapes

- Borders: 1px solid `border.subtle`. Active panels: 1px `border.strong`.
- Border radius: `4px` panels, `2px` buttons, `0` for HUD elements (sharp corners feel technical).
- All panels have an extremely subtle inner glow (`box-shadow: inset 0 0 40px rgba(0,212,255,0.03)`).

---

## Layout (concrete)

`src/App.tsx` shell:

```tsx
<div className="grid h-screen grid-rows-[48px_1fr_36px] bg-bg-base text-text-primary font-display">
  <Header />
  <main className="grid grid-cols-[300px_1fr_300px] gap-px bg-border-subtle">
    <TelemetryPanel />
    <SceneStage />        {/* Canvas + HUD overlays */}
    <CommandPanel />
  </main>
  <EventLogStrip />
  <BootSequence />        {/* full-screen overlay, fades out after ~1.5s */}
</div>
```

- 300px sidebars, fluid center.
- 1px gaps between panels filled with `border.subtle` for a "blueprint" grid feel.

---

## Components to build (or rebuild)

### `src/App.tsx` — replace
Full layout shell as above. Wires up the MQTT client, threshold logic, and a
shared store.

### `src/components/Header.tsx`
- Left: `MIPLANTA.APP` monogram + `MISIÓN: PLANTA-01`.
- Center: Mission clock `T+HH:MM:SS` since first page load (persisted in `localStorage` so refreshes don't reset).
- Right: link status pill `● LINK ACTIVE` (green pulse) / `● LINK LOST` (red, no pulse).

### `src/components/TelemetryPanel.tsx`
For each metric (temperatura, humedad, suelo):
- Label (uppercase, dim)
- Big monospaced value with unit
- Status text (`NOMINAL` / `WARN` / `CRITICAL`) colored
- 60-point sparkline below (custom SVG, see `Sparkline.tsx`)
- A 1px divider between metrics

### `src/components/CommandPanel.tsx`
- "LUZ" toggle button (publishes `cmd/sim-web/light`). Visual state reflects the latest `state/sim-web/light` echo.
- "AUTO-MODO" checkbox: when on, sliders drift naturally; when off, manual control.
- Three sliders (Temperatura / Humedad / Suelo) styled as range inputs with cyan track + monospace value readout.
- "PUBLICAR" button: forces an immediate publish.
- "SILENCIAR" mute toggle (icon button, persisted in `localStorage`).
- Collapsible "AVANZADO" section that re-exposes leva for fine-grained debug. Collapsed by default.

### `src/components/EventLogStrip.tsx`
Bottom strip, fixed height. Auto-scrolling event feed with the last ~20 events:
- `[HH:MM:SS] PKT_RX seq=842 T=22.4 H=61.2 S=68.0`
- `[HH:MM:SS] CMD_TX light=on`
- `[HH:MM:SS] STATE_RX light=on (latency 87ms)`
- `[HH:MM:SS] LINK_LOST` (in red)

Events come from a small pub/sub helper in `src/lib/eventBus.ts`. MQTT layer
emits events. The strip subscribes.

### `src/components/BootSequence.tsx`
Full-screen overlay on first load (sessionStorage flag prevents replay). Lines
appear one by one over ~1.5s, then the whole overlay fades:

```
> INITIALIZING TELEMETRY UPLINK ........ OK
> CHECKING SENSOR ARRAY .................. OK
> ESTABLISHING BROKER CONNECTION ........ OK
> ALL SYSTEMS NOMINAL
```

(Show in English — feels more "mission control". Spanish is for the live UI.)

Use `framer-motion` for the fade.

### `src/components/Sparkline.tsx`
~50 lines of plain SVG. Props: `points: number[]`, `min`, `max`, `color`.
Smooth Catmull-Rom or simple polyline. No library.

### `src/components/StatusPill.tsx`
Cyan/green/red dot + label. Used for link status and per-metric states.

### `src/components/Crosshair.tsx`
Pure CSS overlay rendered on top of the Canvas (not inside the 3D scene). Four
brackets at the 1/4 / 3/4 viewport positions framing the plant. Looks like a
camera reticle.

### `src/components/MuteToggle.tsx`
Single icon button. `Volume2` / `VolumeX` from lucide-react. Persists in localStorage.

### `src/Scene.tsx` — rewrite
- Camera: perspective, slow 5° auto-orbit (use `OrbitControls` with `autoRotate` and `autoRotateSpeed=0.4`, or animate manually via `useFrame`).
- Lighting: three-point. Cool key from above-left (intensity 1.2, color `#a8d0ff`), warm rim from right (intensity 0.6, color `#ffd9a8`), cyan fill from below (intensity 0.3, color `#00d4ff`).
- Ground: drei `<Grid />` with `cellSize={1}`, `cellColor="#1e2838"`, `sectionColor="#2a3650"`, `infiniteGrid`, `fadeDistance={30}`.
- Plant: `useGLTF('/sim/plant.glb')`. The file already exists — it's a **Fiddle-leaf Plant by Poly by Google** (CC BY 3.0). You MUST surface the attribution somewhere in the UI (recommended: small footer text in the EventLogStrip's right-side or as a line in the boot sequence). Required text: `PLANT MODEL: "Fiddle-leaf Plant" BY POLY BY GOOGLE / CC BY 3.0`. Keep procedural placeholder fallback in case the file is missing during dev.
- LED strip: torus around the pot with `MeshStandardMaterial`. Emissive color `#00d4ff`, `emissiveIntensity` animates from 0 to 2 when light is ON, with a subtle 1Hz pulse via `useFrame`.
- When light is ON, also crank a `pointLight` near the pot to cast cyan light on the plant.
- Floating sensor labels via `<Html />` from drei (position above the leaves), small monospace badges showing `T 22.4°` etc. Hide them when `!showLabels` (toggleable).
- Particle field: ~200 small white dots floating slowly, using `<Points />` with a custom `BufferGeometry`. Subtle (opacity 0.3).

### Postprocessing (`@react-three/postprocessing`)
```tsx
<EffectComposer>
  <Bloom intensity={0.6} luminanceThreshold={0.3} luminanceSmoothing={0.9} />
  <ChromaticAberration offset={[0.0008, 0.0008]} />
  <Vignette eskil={false} offset={0.2} darkness={0.7} />
  <Scanline density={1.2} opacity={0.05} />   {/* very subtle */}
</EffectComposer>
```

---

## Sound design

Library: `howler` (~30KB, MIT, well-maintained).

| Sound        | When                                      | Spec                                     |
| ------------ | ----------------------------------------- | ---------------------------------------- |
| `blip.mp3`   | Telemetry packet RX                       | 2kHz sine, 30ms, -22dB                   |
| `thunk.mp3`  | Command ACK (state echo received)         | 200Hz, 80ms, -16dB                       |
| `click.mp3`  | Slider release / button press             | UI click ~10ms, -24dB                    |
| `chirp.mp3`  | Metric crosses into CRITICAL              | Two short rising beeps, -14dB            |
| `boot.mp3`   | Boot sequence ambience (one-shot)         | Low rumble, 1.5s, -20dB                  |

**Where to get them**: pixabay.com/sound-effects (search "ui blip", "click",
"radio chirp"; filter "Pixabay License" = no attribution required), or
freesound.org with CC0 filter.

**Or generate procedurally**: a small `src/sound/synth.ts` using Web Audio
API can synthesize blip/click/thunk in <30 lines without any audio assets.
This is the preferred approach for the smallest bundle and zero licensing
worry. Use this unless it sounds bad — fall back to MP3s if so.

**Mute toggle**: persisted in `localStorage` as `miplanta:muted`. Default off
(sound on) but make the mute button very visible. `SoundManager` exports
`play(name)` which respects the mute flag.

---

## Tech additions to install

```jsonc
// package.json additions
"dependencies": {
  "framer-motion": "^11",
  "@react-three/postprocessing": "^2",
  "lucide-react": "^0.460",
  "howler": "^2.2",
  "clsx": "^2"
},
"devDependencies": {
  "tailwindcss": "^3.4",
  "postcss": "^8",
  "autoprefixer": "^10",
  "@types/howler": "^2.2"
}
```

Tailwind setup: standard `tailwind.config.js` + `postcss.config.js` + `src/styles/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;` plus the color tokens from above mapped under `theme.extend.colors`.

Fonts: `index.html` `<link>` to Google Fonts for Inter (400/500/600) + JetBrains Mono (400/500). Define `font-display` and `font-mono` in Tailwind theme.

---

## Threshold logic — `src/lib/threshold.ts`

```ts
export type Status = 'nominal' | 'warn' | 'critical';

export function tempStatus(c: number): Status {
  if (c >= 18 && c <= 30) return 'nominal';
  if (c >= 10 && c <= 35) return 'warn';
  return 'critical';
}
export function humidityStatus(h: number): Status {
  if (h >= 40 && h <= 70) return 'nominal';
  if (h >= 20 && h <= 90) return 'warn';
  return 'critical';
}
export function soilStatus(s: number): Status {
  if (s >= 40 && s <= 80) return 'nominal';
  if (s >= 20) return 'warn';
  return 'critical';
}
```

When status transitions to `critical`, play `chirp` once.

---

## Mission clock — `src/lib/missionClock.ts`

- Read `localStorage.miplanta:t0` (ISO timestamp). If missing, set to `now`.
- `useMissionClock()` hook returns formatted `T+HH:MM:SS`, ticks every second.
- Resets only if user clears localStorage. (Don't reset on refresh.)

---

## Spanish strings — `src/lib/strings.ts`

Centralize all Spanish UI strings here. Header, panel labels, button labels,
event-log verbs, etc. Keep boot sequence in English (it's an aesthetic choice
— mission control feels English).

---

## What NOT to do

- Don't break MQTT topics or payloads.
- Don't add a state management library — `useState` + `useReducer` + a small
  context for the MQTT client is enough.
- Don't add React Router — single page.
- Don't add tests, lint configs, CI, prettier configs — out of scope.
- Don't add a backend, an API server, or analytics.
- Don't replace leva entirely — keep it tucked behind an "AVANZADO" collapse
  for power-user debugging.
- Don't ship plant.glb. Steven will drop the file. Code must gracefully fall
  back to procedural placeholder.
- Don't rename existing files unless necessary; if you do, update imports.
- Don't introduce TypeScript strict-mode errors. Existing tsconfig is the floor.

---

## Quality bar

- `npm install && npm run build` succeeds with zero errors and only minor
  warnings.
- First paint under 2s on broadband. GLB lazy-loaded. Postprocessing
  effects are stable at 60fps on a 2020+ laptop.
- All Spanish strings centralized in `src/lib/strings.ts`.
- All times use the user's local timezone for display (Bogotá UTC-5 in
  practice).
- Boot sequence runs once per session (sessionStorage flag).
- Sound respects mute toggle persisted in localStorage.
- Visual: looks like a NASA mission control station, not a hobby dashboard.

---

## Final deliverable

A summary message listing every file you created/modified, plus:

1. **Bundle size** (gzipped) of the production build.
2. **Any visual compromises** you made due to time/complexity (be honest).
3. **A 5-line "what to test"** checklist for Steven to validate before the demo.

When done, Steven will run `npm install && npm run dev` to validate, then
`npm run build` and the build artifacts will be rsync'd to the EC2 by his
`make deploy` flow.
