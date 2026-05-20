import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Mounts the SPA at /sim/ behind Caddy (handle_path /sim* → /srv/sim).
export default defineConfig({
  plugins: [react()],
  base: "/sim/",
  server: {
    port: 5173,
    host: true,
  },
});
