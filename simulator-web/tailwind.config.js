/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0a0e1a",
          panel: "#10151f",
          "panel-hi": "#161c2a",
        },
        border: {
          subtle: "#1a2332",
          strong: "#2a3650",
        },
        grid: {
          line: "#1e2838",
        },
        text: {
          primary: "#e8eef5",
          dim: "#8a96a8",
          faint: "#4a5468",
        },
        accent: {
          cyan: "#00d4ff",
        },
        status: {
          nominal: "#10b981",
          warn: "#f59e0b",
          critical: "#ef4444",
        },
        link: {
          active: "#10b981",
          lost: "#ef4444",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        hero: "0.15em",
        wide2: "0.08em",
      },
      boxShadow: {
        "panel-glow": "inset 0 0 40px rgba(0,212,255,0.03)",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
        scan: "scan 6s linear infinite",
      },
    },
  },
  plugins: [],
};
