UV := $(shell command -v uv 2>/dev/null || echo $(HOME)/.local/bin/uv)

run: sync  ## Start the plant monitor app
	$(UV) run main.py

sync:  ## Install / update dependencies
	$(UV) sync

help:  ## Show this menu
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

.PHONY: run sync help
.DEFAULT_GOAL := run
