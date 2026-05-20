# Architecture

A pragmatic, hobby-grade IoT stack. One ARM EC2, docker compose, MQTT spine.

## Components

| Layer            | Tool          | Why                                                    |
| ---------------- | ------------- | ------------------------------------------------------ |
| Sensor edge      | Arduino UNO   | Cheap, runs on 5V USB, Arduino C/C++ is hackable.        |
| Sim (headless)   | Python paho   | Easy to script, useful in CI / demos without hardware. |
| Sim (visual)     | r3f + leva    | 3D plant for the demo; teacher-friendly.               |
| Transport        | Mosquitto 2.0 | Tiny, well-known, websockets for the browser sim.      |
| Routing/glue     | Node-RED 4.0  | Abby can edit flows visually. Low blast radius.        |
| Time-series      | InfluxDB 2.7  | Native MQTT-shaped data model, Flux for Grafana.       |
| Visualization    | Grafana 11    | Default dashboards, anonymous viewer for demo.         |
| Reverse proxy    | Caddy 2.8     | Auto Let's Encrypt, single Caddyfile.                  |
| Compute          | EC2 t4g.small | $13/mo on-demand, ARM is plenty for this load.         |
| IaC              | Terraform     | One folder, local state for now.                       |

## Data flow

1. Each device samples every 60s and publishes JSON to `sensors/<id>/state`.
2. Mosquitto fans out. Node-RED is the only durable subscriber: it parses
   the payload and writes a measurement into InfluxDB bucket `sensors`.
3. Grafana queries InfluxDB on dashboard load (5-10s refresh).
4. The dashboard exposes a "light on/off" control. The button publishes to
   `cmd/<id>/light`. Devices that own that ID react and echo state on
   `state/<id>/light`. Node-RED also persists state echoes for audit.
5. The browser sim talks the same MQTT, just over `wss://` via Caddy.

## Why each tech (one line each)

- **Mosquitto** — battle-tested, smallest viable broker, zero ceremony.
- **Node-RED** — Abby owns this layer; visual flows are her contribution.
- **InfluxDB 2** — line protocol matches MQTT 1:1, retention is a config flag.
- **Grafana** — anonymous viewer means the teacher doesn't need a login.
- **Caddy** — TLS in two lines of config; no certbot cron jobs.
- **t4g.small ARM** — cheap, and the whole stack uses <1.5GB RAM idle.

## Security posture

This is **hobby grade**. Documented gaps:

- MQTT runs **plaintext on 1883**, public. Username/password only. Any
  passive network observer can read sensor data and credentials. Acceptable
  because: the data is not sensitive (a houseplant's humidity), and the
  attacker can't do much with `cmd/plant-01/light`.
- The Caddy-fronted services (Grafana, Node-RED, simulator) **are** TLS-only.
- Node-RED admin is behind bcrypt-hashed `adminAuth` (`abby` user).
- Grafana admin password from env. Anonymous role is `Viewer` (read-only).
- InfluxDB is not exposed to the public internet.
- SG opens 22/80/443/1883. SSH should be locked to Steven's IP via
  `allowed_ssh_cidr` — current default `0.0.0.0/0` is for first-deploy
  convenience only.
- IAM role on the box is `AmazonSSMManagedInstanceCore` only. No app
  credentials live on the box.
- No backup automation. InfluxDB volume is ephemeral if the EC2 dies.
  Acceptable for a school demo. If we keep this past June 2026, snapshot
  the EBS volume on a schedule.

## Upgrade path (when this stops being a school project)

| If you want…             | Move to                               |
| ------------------------ | ------------------------------------- |
| Mutual TLS, X.509 ID     | AWS IoT Core (replaces Mosquitto)     |
| Long-term storage        | Amazon Timestream or InfluxDB Cloud   |
| HA / multiple plants     | ECS or Fargate behind ALB             |
| Auth + per-user dashboards | Grafana OSS w/ OAuth or Grafana Cloud |
| Real OTA updates         | AWS IoT Jobs                          |

The MQTT topic contract is the migration boundary. As long as the
`sensors/<id>/state` shape is preserved, the firmware never has to change.

## Cost estimate (steady state)

| Item                       | Monthly USD |
| -------------------------- | ----------- |
| EC2 t4g.small on-demand    | ~$12.30     |
| EBS gp3 20GB               | ~$1.60      |
| EIP (attached, free)       | $0.00       |
| Route53 hosted zone        | $0.50 (if used) |
| Data transfer out          | ~$0.50      |
| **Total**                  | **~$15/mo** |

Domain is a separate ~$10-12/yr at name.com.

## Operational notes

- All persistence lives in named docker volumes. `make down` does **not**
  wipe data; only `docker compose down -v` does.
- Mosquitto's passwd file is created **on the box** with `setup.sh`, not
  committed to the repo. The `.env` MQTT_PASSWORD is the source of truth.
- Caddy's ACME state is on a named volume — don't blow it away or you'll
  hit Let's Encrypt rate limits during testing.
- Node-RED palette additions (`node-red-contrib-influxdb`,
  `node-red-dashboard`) must be installed inside the container the first
  time; documented in `stack/nodered/` flow setup.
