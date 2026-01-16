# VibeOS Development Makefile
#
# Usage:
#   make build     - Build Docker image
#   make run       - Run container in background
#   make dev       - Run with docker compose (logs visible)
#   make stop      - Stop and remove container
#   make logs      - View container logs
#   make shell     - Open root shell in container
#   make shell-user - Open shell as vibe user
#   make clean     - Remove container and image
#   make help      - Show this help

.PHONY: build build-fresh run dev dev-fg stop clean logs shell shell-user \
        status restart test-ui install-ui help test test-remote test-automation

# Configuration
IMAGE_NAME := vibeos
CONTAINER_NAME := vibeos-dev
RESOLUTION ?= 1920x1080

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

#------------------------------------------------------------------------------
# Build Commands
#------------------------------------------------------------------------------

## Build the Docker image
build:
	@echo "$(CYAN)Building $(IMAGE_NAME)...$(NC)"
	docker build -t $(IMAGE_NAME) .
	@echo "$(GREEN)Build complete!$(NC)"

## Build without cache (clean build)
build-fresh:
	@echo "$(CYAN)Building $(IMAGE_NAME) (no cache)...$(NC)"
	docker build --no-cache -t $(IMAGE_NAME) .
	@echo "$(GREEN)Build complete!$(NC)"

#------------------------------------------------------------------------------
# Run Commands
#------------------------------------------------------------------------------

## Run the container in background
run: stop
	@echo "$(CYAN)Starting $(CONTAINER_NAME)...$(NC)"
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p 6080:6080 \
		-p 5900:5900 \
		-p 4096:4096 \
		-e RESOLUTION=$(RESOLUTION) \
		--shm-size=2g \
		--security-opt seccomp=unconfined \
		$(IMAGE_NAME)
	@echo ""
	@echo "$(GREEN)=== VibeOS is starting ===$(NC)"
	@echo "Open $(CYAN)http://localhost:6080/vnc.html$(NC) in your browser"
	@echo ""

## Run with docker compose (detached)
dev:
	docker compose up -d --build
	@echo ""
	@echo "$(GREEN)=== VibeOS is starting ===$(NC)"
	@echo "Open $(CYAN)http://localhost:6080/vnc.html$(NC) in your browser"
	@echo "Run 'make logs' to view logs"
	@echo ""

## Run with docker compose (foreground with logs)
dev-fg:
	docker compose up --build --force-recreate

## Run with project directory mounted
run-with-projects: stop
	@echo "$(CYAN)Starting $(CONTAINER_NAME) with projects mount...$(NC)"
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p 6080:6080 \
		-p 5900:5900 \
		-e RESOLUTION=$(RESOLUTION) \
		-v $(PWD)/projects:/home/vibe/projects \
		--shm-size=2g \
		--security-opt seccomp=unconfined \
		$(IMAGE_NAME)
	@echo "$(GREEN)Started! Projects mounted at /home/vibe/projects$(NC)"

#------------------------------------------------------------------------------
# Container Management
#------------------------------------------------------------------------------

## Stop and remove the container
stop:
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true

## View container logs (follow mode)
logs:
	docker logs -f $(CONTAINER_NAME)

## View last 50 lines of logs
logs-tail:
	docker logs --tail 50 $(CONTAINER_NAME)

## Open root shell in container
shell:
	docker exec -it $(CONTAINER_NAME) /bin/bash

## Open shell as vibe user
shell-user:
	docker exec -it -u vibe $(CONTAINER_NAME) /bin/bash

## Check service status inside container
status:
	docker exec $(CONTAINER_NAME) supervisorctl status

## Restart all services inside container
restart:
	docker exec $(CONTAINER_NAME) supervisorctl restart all

## Restart just the shell UI
restart-shell:
	docker exec $(CONTAINER_NAME) supervisorctl restart openbox

#------------------------------------------------------------------------------
# Cleanup
#------------------------------------------------------------------------------

## Remove container and image
clean: stop
	@echo "$(YELLOW)Removing image...$(NC)"
	docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo "$(GREEN)Cleanup complete!$(NC)"

## Full cleanup including build cache
clean-all: clean
	@echo "$(YELLOW)Pruning Docker system...$(NC)"
	docker system prune -f
	@echo "$(GREEN)Full cleanup complete!$(NC)"

#------------------------------------------------------------------------------
# Development
#------------------------------------------------------------------------------

## Install shell-ui dependencies locally
install-ui:
	cd shell-ui && npm install

## Test shell-ui locally (requires X11 display)
test-ui:
	cd shell-ui && npm start

## Test shell-ui with dev tools
test-ui-dev:
	cd shell-ui && VIBEOS_DEV=1 npm start

#------------------------------------------------------------------------------
# Testing
#------------------------------------------------------------------------------

## Run all tests (requires running container)
test: test-remote test-automation
	@echo "$(GREEN)All tests complete!$(NC)"

## Run remote API tests (from host)
test-remote:
	@echo "$(CYAN)Running remote API tests...$(NC)"
	@./tests/run-tests.sh remote

## Run in-container automation tests
test-automation:
	@echo "$(CYAN)Running automation tests inside container...$(NC)"
	@docker exec -e DISPLAY=:0 $(CONTAINER_NAME) /home/vibe/tests/run-tests.sh automation

## Run a specific test file
test-file:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make test-file FILE=tests/remote/test-api.sh"; \
	else \
		./tests/run-tests.sh $(FILE); \
	fi

#------------------------------------------------------------------------------
# Debugging
#------------------------------------------------------------------------------

## View supervisor logs
logs-supervisor:
	docker exec $(CONTAINER_NAME) tail -f /var/log/supervisor/supervisord.log

## View openbox/shell logs
logs-shell:
	docker exec $(CONTAINER_NAME) tail -f /var/log/supervisor/openbox.log

## View x11vnc logs
logs-vnc:
	docker exec $(CONTAINER_NAME) tail -f /var/log/supervisor/x11vnc.err

## View all supervisor log files
logs-all:
	docker exec $(CONTAINER_NAME) ls -la /var/log/supervisor/

## Check running processes
ps:
	docker exec $(CONTAINER_NAME) ps aux | grep -E "(supervisor|electron|openbox|x11vnc|websock)"

#------------------------------------------------------------------------------
# Help
#------------------------------------------------------------------------------

## Show this help message
help:
	@echo ""
	@echo "$(CYAN)VibeOS Development Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Build:$(NC)"
	@echo "  make build          Build Docker image"
	@echo "  make build-fresh    Build without cache"
	@echo ""
	@echo "$(GREEN)Run:$(NC)"
	@echo "  make run            Run container in background"
	@echo "  make dev            Run with docker compose"
	@echo "  make dev-fg         Run with logs in foreground"
	@echo ""
	@echo "$(GREEN)Container:$(NC)"
	@echo "  make stop           Stop and remove container"
	@echo "  make logs           View container logs"
	@echo "  make shell          Open root shell"
	@echo "  make shell-user     Open shell as vibe user"
	@echo "  make status         Check service status"
	@echo "  make restart        Restart all services"
	@echo ""
	@echo "$(GREEN)Testing:$(NC)"
	@echo "  make test           Run all tests"
	@echo "  make test-remote    Run remote API tests"
	@echo "  make test-automation Run in-container tests"
	@echo ""
	@echo "$(GREEN)Cleanup:$(NC)"
	@echo "  make clean          Remove container and image"
	@echo "  make clean-all      Full cleanup with prune"
	@echo ""
	@echo "$(GREEN)Debug:$(NC)"
	@echo "  make logs-shell     View shell UI logs"
	@echo "  make logs-vnc       View VNC logs"
	@echo "  make ps             Show running processes"
	@echo ""
	@echo "$(GREEN)Access:$(NC)"
	@echo "  Browser: $(CYAN)http://localhost:6080/beta.html$(NC)"
	@echo "  VNC:     $(CYAN)vnc://localhost:5900$(NC)"
	@echo ""

# Default target
.DEFAULT_GOAL := help
