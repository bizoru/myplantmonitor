/**
 * Node-RED settings for myplantmonitor.
 *
 * Mounted read-only at /data/settings.js. The container picks this up
 * automatically because /data is the userDir.
 *
 * adminAuth uses bcrypt. The hash for ${NODERED_PASSWORD} must be generated
 * once and pasted below. To generate:
 *
 *   docker exec -it nodered \
 *     node -e "console.log(require('bcryptjs').hashSync(process.env.NODERED_PASSWORD, 8))"
 *
 * Then edit this file with the hash and `docker compose restart nodered`.
 *
 * The placeholder hash below corresponds to the literal string "changeme"
 * (cost 8). It exists only so the container starts on a fresh install. CHANGE
 * IT before exposing /nodered to the internet.
 */

module.exports = {
    flowFile: "flows.json",

    adminAuth: {
        type: "credentials",
        users: [
            {
                username: "abby",
                password: "$2a$08$cf//B7MKuiG5mL9vZp8Eeuiyn3OTk5jObtFEnInWdWeNF1hmvWMUW",
                permissions: "*"
            }
        ]
    },

    credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || "myplantmonitor-changeme",

    // Editor and dashboard share the container port; Caddy proxies /nodered/*.
    httpAdminRoot: "/",
    httpNodeRoot: "/",
    ui: { path: "ui" },
    uiPort: 1880,

    // Trim startup noise; keep enough for debugging.
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    },

    // Node-RED 4.x recommended exports.
    runtimeState: { enabled: false, ui: false },
    diagnostics: { enabled: true, ui: false },

    editorTheme: {
        page: { title: "myplantmonitor — Node-RED" },
        header: { title: "myplantmonitor" },
        projects: { enabled: false }
    },

    functionGlobalContext: {}
};
