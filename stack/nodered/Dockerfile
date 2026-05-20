# Custom Node-RED image with the palettes our flow uses pre-installed.
#
# node-red-dashboard       → ui_button / ui_tab / ui_group (light controls)
# node-red-contrib-influxdb → influxdb out node (sensor + light_state writes)
#
# Built by docker-compose (`build: ./nodered`). Published image pulled from
# Docker Hub at `nodered/node-red:4.0` is multi-arch (amd64 + arm64), so this
# builds correctly on both Steven's M-series Mac and the t4g EC2.

FROM nodered/node-red:4.0

USER root
RUN npm install --prefix /usr/src/node-red --no-save --no-audit --no-fund \
      node-red-dashboard \
      node-red-contrib-influxdb
USER node-red
