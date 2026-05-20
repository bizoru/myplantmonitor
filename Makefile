# myplantmonitor — friendly entrypoints
# Run `make` (or `make help`) for the menu.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ---- config (override via environment) -------------------------------------
SSH_USER       ?= ubuntu
EC2_HOST       ?= $(shell cd infra && terraform output -raw eip 2>/dev/null)
INSTANCE_ID    ?= $(shell cd infra && terraform output -raw instance_id 2>/dev/null)
AWS_REGION     ?= us-east-1
SSH_TARGET     := $(SSH_USER)@$(EC2_HOST)
REMOTE_DIR     := /home/$(SSH_USER)/myplantmonitor
# .env lives at repo root; compose runs from stack/, so pass it explicitly.
COMPOSE        := docker compose --env-file ../.env

# ---- preflight -------------------------------------------------------------
.env:
	@echo "ERROR: .env missing. Copy .env.example → .env and fill in real values." >&2
	@exit 1

# Generate Mosquitto passwd from .env on demand. mosquitto/setup.sh is idempotent.
stack/mosquitto/passwd: .env stack/mosquitto/setup.sh
	bash stack/mosquitto/setup.sh

passwd: stack/mosquitto/passwd  ## Generate the Mosquitto password file from .env

# Caddy needs sim-dist/ to exist (bind mount). Empty is fine for stack startup.
sim-dist:
	mkdir -p sim-dist

# ---- local stack -----------------------------------------------------------
up: .env stack/mosquitto/passwd sim-dist  ## Start local stack (docker compose up -d)
	cd stack && $(COMPOSE) build nodered
	cd stack && $(COMPOSE) up -d
	@echo
	@echo "Local stack up. Visit:"
	@echo "  http://localhost:80/        (Caddy → Grafana, no TLS locally — see below)"
	@echo "  Grafana direct:  http://localhost:3000  (only if you expose port — not by default)"
	@echo "Note: Caddy will fail ACME on localhost. For local dev, point a browser at http://localhost"
	@echo "      and accept that Grafana proxying works but cert provisioning won't until DNS resolves."

down:         ## Stop local stack
	cd stack && $(COMPOSE) down

restart:      ## Restart local stack
	cd stack && $(COMPOSE) restart

logs:         ## Tail logs from local stack
	cd stack && $(COMPOSE) logs -f --tail=200

ps:           ## Show local stack status
	cd stack && $(COMPOSE) ps

# ---- simulators ------------------------------------------------------------
demo: .env    ## Run CLI simulator pointed at the production broker (uses DOMAIN from .env)
	set -a; source ./.env; set +a; \
	cd simulator-cli && BROKER_HOST=$$DOMAIN python simulate.py

sim-cli: .env ## Run CLI simulator pointed at localhost
	set -a; source ./.env; set +a; \
	cd simulator-cli && BROKER_HOST=localhost python simulate.py

sim-web-dev:  ## Run 3D simulator with Vite hot reload
	cd simulator-web && npm run dev

# ---- deploy ----------------------------------------------------------------
deploy: .env  ## rsync stack + .env to EC2, build, bring up the stack, bootstrap mosquitto
	@test -n "$(EC2_HOST)" || (echo "EC2_HOST not set; run 'make tf-apply' first"; exit 1)
	rsync -avz --delete --inplace \
	  --exclude '.env' --exclude 'mosquitto/passwd' \
	  stack/ $(SSH_TARGET):$(REMOTE_DIR)/stack/
	scp .env $(SSH_TARGET):$(REMOTE_DIR)/.env
	ssh $(SSH_TARGET) "set -e; \
	  mkdir -p $(REMOTE_DIR)/sim-dist; \
	  touch $(REMOTE_DIR)/stack/mosquitto/passwd; \
	  cd $(REMOTE_DIR)/stack && \
	    docker compose --env-file ../.env build nodered && \
	    docker compose --env-file ../.env up -d && \
	    bash mosquitto/setup.sh && \
	    docker compose --env-file ../.env restart mosquitto"
	@echo
	@DOMAIN=$$(grep ^DOMAIN .env | cut -d= -f2); \
	echo "Deploy complete. Visit https://$$DOMAIN/  (TLS provisioning takes ~30s on first boot)"

deploy-sim: .env ## Build simulator-web and rsync dist into the EC2 sim bind mount
	cd simulator-web && npm run build
	@test -n "$(EC2_HOST)" || (echo "EC2_HOST not set; run 'make tf-apply' first"; exit 1)
	rsync -avz --delete simulator-web/dist/ $(SSH_TARGET):$(REMOTE_DIR)/sim-dist/
	@DOMAIN=$$(grep ^DOMAIN .env | cut -d= -f2); \
	echo "Sim deployed. Visit https://$$DOMAIN/sim/"

ssm:          ## Open an SSM session into the EC2 instance
	aws ssm start-session --target $(INSTANCE_ID) --region $(AWS_REGION)

# ---- terraform -------------------------------------------------------------
tf-init:      ## terraform init
	cd infra && terraform init

tf-plan:      ## terraform plan
	cd infra && terraform plan

tf-apply:     ## terraform apply
	cd infra && terraform apply

# ---- meta ------------------------------------------------------------------
help:         ## Show this menu
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

.PHONY: passwd up down restart logs ps demo sim-cli sim-web-dev deploy deploy-sim ssm tf-init tf-plan tf-apply help
