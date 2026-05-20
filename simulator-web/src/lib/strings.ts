/**
 * Centralized Spanish UI strings for Mission Control.
 * Boot sequence is intentionally English — feels more "mission control".
 */
export const S = {
  brand: "MIPLANTA.APP",
  mission: "MISIÓN: PLANTA-01",
  link: {
    active: "LINK ACTIVE",
    lost: "LINK LOST",
    connecting: "LINK SYNC…",
  },
  panels: {
    telemetry: "TELEMETRÍA",
    commands: "COMANDOS",
    settings: "AJUSTES",
    advanced: "AVANZADO",
    eventLog: "EVENT LOG",
  },
  metrics: {
    temperature: "TEMPERATURA",
    humidity: "HUMEDAD",
    soil: "SUELO",
    tempUnit: "°C",
    pctUnit: "%",
  },
  status: {
    nominal: "NOMINAL",
    warn: "ATENCIÓN",
    critical: "CRÍTICO",
  },
  buttons: {
    light: "LUZ",
    on: "ON",
    off: "OFF",
    autoMode: "AUTO-MODO",
    publish: "PUBLICAR",
    mute: "SILENCIAR",
    unmute: "ACTIVAR AUDIO",
    expand: "EXPANDIR",
    collapse: "OCULTAR",
    showLabels: "ETIQUETAS 3D",
  },
  sliders: {
    temperature: "TEMP",
    humidity: "HUM",
    soil: "SUELO",
  },
  events: {
    pktRx: "PKT_RX",
    cmdTx: "CMD_TX",
    stateRx: "STATE_RX",
    linkLost: "LINK_LOST",
    linkUp: "LINK_UP",
    bootOk: "BOOT_OK",
    critical: "ALERT_CRITICAL",
  },
  attribution: 'PLANT MODEL: "Fiddle-leaf Plant" BY POLY BY GOOGLE / CC BY 3.0',
} as const;
