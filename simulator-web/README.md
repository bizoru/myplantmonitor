# simulator-web

Vite + React + react-three-fiber + leva + mqtt.js. A 3D plant in the browser
that talks to the same MQTT broker as the real Arduino UNO (`device_id=sim-web`).

## Dev

```bash
npm install
npm run dev
```

Then open http://localhost:5173/sim/?user=plant&pass=changeme

For local dev against a localhost broker, create `.env.local`:

```
VITE_MQTT_URL=ws://localhost:9001
VITE_MQTT_USER=plant
VITE_MQTT_PASSWORD=changeme
```

## Build

```bash
npm run build
```

Output goes to `dist/`. The deploy step rsyncs `dist/` into the
`sim_dist` named volume that Caddy mounts at `/srv/sim`. The SPA is then
reachable at `https://${DOMAIN}/sim/`.

## Connecting

The app reads MQTT credentials from URL query params (`?user=X&pass=Y`) so
the demo URL can carry them. For real usage you'd put credentials behind a
proper login — out of scope for the school project.

## Notes

- Plant model lives at `public/plant.glb` (Fiddle-leaf Plant by Poly by
  Google, CC BY 3.0). Attribution required — see top-level `CREDITS.md`
  and surface it in the UI footer.
- `device_id` is hardcoded to `sim-web` in `src/mqtt.ts`. Change there if
  you want to run multiple browser sims at once.
