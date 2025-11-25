# Variables
COMPOSE_FILE = ./docker-compose.yml
COMPOSE_CMD = docker compose -f $(COMPOSE_FILE)

ALL_SERVICES = authentication gateway gameserver profile room email aiserver nginx frontend friend static

GREEN = \033[0;32m
RED = \033[0;31m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m

# İşletim sistemini algıla
UNAME_S := $(shell uname -s)

ifeq ($(UNAME_S),Linux) # linux
	HOST_IP := $(shell hostname -I | awk '{print $$1}')
endif

ifeq ($(UNAME_S),Darwin) # macOS için
	HOST_IP := $(shell ipconfig getifaddr en0)
endif

ifeq ($(UNAME_S),MINGW64_NT) # Windows (Git Bash) için
	HOST_IP := $(shell hostname -I | awk '{print $$1}')
endif

# Eğer en0 çalışmazsa en1'i dene
ifeq ($(HOST_IP),)
	HOST_IP := $(shell ipconfig getifaddr en1)
endif

$(info Host IP: $(HOST_IP))

# HOST_IP := $(shell hostname -I | awk '{print $$1}')
export HOST_IP

all: up

up:
	@echo "$(GREEN)Starting all services (HOST_IP=$(HOST_IP))$(NC)"
	@$(COMPOSE_CMD) up -d --build
down:
	@echo "$(YELLOW)Stopping all services...$(NC)"
	@$(COMPOSE_CMD) down
stop:
	@echo "$(YELLOW)Stopping and removing containers...$(NC)"
	@$(COMPOSE_CMD) down --remove-orphans
status:
	@echo "$(GREEN)Container status:$(NC)"
	@$(COMPOSE_CMD) ps


logs:
	@$(COMPOSE_CMD) logs -f
log-profile:
	@echo "$(GREEN)Showing logs for profile service$(NC)"
	@$(COMPOSE_CMD) logs -f profile
log-nginx:
	@echo "$(GREEN)Showing logs for nginx service$(NC)"
	@$(COMPOSE_CMD) logs -f nginx
log-auth:
	@echo "$(GREEN)Showing logs for authentication service$(NC)"
	@$(COMPOSE_CMD) logs -f authentication
log-gateway:
	@echo "$(GREEN)Showing logs for gateway service$(NC)"
	@$(COMPOSE_CMD) logs -f gateway
log-friend:
	@echo "$(GREEN)Showing logs for friend service$(NC)"
	@$(COMPOSE_CMD) logs -f friend
log-static:
	@echo "$(GREEN)Showing logs for static service$(NC)"
	@$(COMPOSE_CMD) logs -f static
log-gameserver:
	@echo "$(GREEN)Showing logs for gameserver service$(NC)"
	@$(COMPOSE_CMD) logs -f gameserver
log-room:
	@echo "$(GREEN)Showing logs for room service$(NC)"
	@$(COMPOSE_CMD) logs -f room
log-aiserver:
	@echo "$(GREEN)Showing logs for room service$(NC)"
	@$(COMPOSE_CMD) logs -f aiserver
log-email:
	@echo "$(GREEN)Showing logs for room service$(NC)"
	@$(COMPOSE_CMD) logs -f email


shell-nginx:
	@echo "$(GREEN)Entering shell for nginx service$(NC)"
	@docker exec -it nginx /bin/sh
shell-auth:
	@echo "$(GREEN)Entering shell for authentication service$(NC)"
	@docker exec -it authentication /bin/sh
shell-gateway:
	@echo "$(GREEN)Entering shell for gateway service$(NC)"
	@docker exec -it gateway /bin/sh
shell-profile:
	@echo "$(GREEN)Entering shell for profile service$(NC)"
	@docker exec -it profile /bin/sh
shell-friend:
	@echo "$(GREEN)Entering shell for friend service$(NC)"
	@docker exec -it friend /bin/sh
shell-static:
	@echo "$(GREEN)Entering shell for static service$(NC)"
	@docker exec -it static /bin/sh
shell-email:
	@echo "$(GREEN)Entering shell for email service$(NC)"
	@docker exec -it email /bin/sh
shell-room:
	@echo "$(GREEN)Entering shell for room service$(NC)"
	@docker exec -it room /bin/sh
shell-aiserver:
	@echo "$(GREEN)Entering shell for aiserver service$(NC)"
	@docker exec -it aiserver /bin/sh
shell-gameserver:
	@echo "$(GREEN)Entering shell for gameserver service$(NC)"
	@docker exec -it gameserver /bin/sh


clean-db:
	@echo "$(RED)Cleaning databases...$(NC)"
	@rm -rf backend/profile/database/
	@rm -rf backend/authentication/data/
	@rm -rf backend/friend/database/
	@echo "$(GREEN)Databases cleaned$(NC)"
clean: stop
	@echo "$(RED)Cleaning up...$(NC)"
	@docker system prune -f
fclean: clean clean-db
	@echo "$(RED)Performing full cleanup...$(NC)"
	@$(COMPOSE_CMD) down --remove-orphans --volumes --rmi --rm all 2>/dev/null || true
	@docker system prune -a --volumes -f
	@docker volume prune -a -f
	@docker network prune -f
re: fclean all

dev-authentication:
	@echo "$(BLUE)Development mode for authentication service$(NC)"
	@$(COMPOSE_CMD) up -d --build authentication
	@$(COMPOSE_CMD) logs -f authentication
dev-gateway:
	@echo "$(BLUE)Development mode for gateway service$(NC)"
	@$(COMPOSE_CMD) up -d --build gateway
	@$(COMPOSE_CMD) logs -f gateway
dev-nginx:
	@echo "$(BLUE)Development mode for nginx service$(NC)"
	@$(COMPOSE_CMD) up -d --build nginx
	@$(COMPOSE_CMD) logs -f nginx
dev-gameserver:
	@echo "$(BLUE)Development mode for gameserver service$(NC)"
	@$(COMPOSE_CMD) up -d --build gameserver
	@$(COMPOSE_CMD) logs -f gameserver
dev-room:
	@echo "$(BLUE)Development mode for room service$(NC)"
	@$(COMPOSE_CMD) up -d --build room
	@$(COMPOSE_CMD) logs -f room
dev-profile:
	@echo "$(BLUE)Development mode for profile service$(NC)"
	@$(COMPOSE_CMD) up -d --build profile
	@$(COMPOSE_CMD) logs -f profile
dev-friend:
	@echo "$(BLUE)Development mode for friend service$(NC)"
	@$(COMPOSE_CMD) up -d --build friend
	@$(COMPOSE_CMD) logs -f friend
dev-frontend:
	@echo "$(BLUE)Development mode for frontend service$(NC)"
	@$(COMPOSE_CMD) up -d --build frontend
	@$(COMPOSE_CMD) logs -f frontend
dev-static:
	@echo "$(BLUE)Development mode for static service$(NC)"
	@$(COMPOSE_CMD) up -d --build static
	@$(COMPOSE_CMD) logs -f static
dev-email:
	@echo "$(BLUE)Development mode for email service$(NC)"
	@$(COMPOSE_CMD) up -d --build email
	@$(COMPOSE_CMD) logs -f email
dev-aiserver:
	@echo "$(BLUE)Development mode for aiserver service$(NC)"
	@$(COMPOSE_CMD) up -d --build aiserver
	@$(COMPOSE_CMD) logs -f aiserver

health:
	@echo "$(GREEN)Health check:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

help:
	@echo "$(GREEN)Available targets:$(NC)"
	@echo ""
	@echo "$(YELLOW)Main commands:$(NC)"
	@echo "  all              - Create volumes and start all containers (default)"
	@echo "  up               - Build and start all containers"
	@echo "  down             - Stop containers"
	@echo "  stop             - Stop and remove containers"
	@echo "  status           - Show container status"
	@echo "  logs             - Show logs (follow mode)"
	@echo "  clean            - Stop and remove containers and clean non-persistent data"
	@echo "  clean-db         - Clean all SQLite database files"
	@echo "  fclean           - Full cleanup (containers, images, volumes + databases)"
	@echo "  re               - Restart everything (fclean + all)"
	@echo "  health           - Show container health status"
	@echo ""
	@echo "$(YELLOW)Service-specific commands:$(NC)"
	@echo "  logs-<service>   - Show logs for specific service (e.g., logs-sqlite)"
	@echo "  shell-<service>  - Enter container shell (e.g., shell-nginx)"
	@echo ""
	@echo "$(YELLOW)Development shortcuts:$(NC)"
	@echo "  authentication   - Start authentication service"
	@echo "  gateway          - Start gateway service"
	@echo "  nginx            - Start nginx service"
	@echo "  gameserver       - Start gameserver service (if uncommented)"
	@echo "  frontend         - Start frontend service (if uncommented)"
	@echo ""
	@echo "$(YELLOW)Development modes (build + logs):$(NC)"
	@echo "  dev-<service>    - Build, start and follow logs for specific service"
	@echo ""
	@echo "$(BLUE)Examples:$(NC)"
	@echo "  make up-nginx          # Start only nginx"
	@echo "  make logs-gateway      # Show gateway logs"
	@echo "  make shell-sqlite      # Enter sqlite container"
	@echo "  make dev-authentication # Development mode for authentication"

.PHONY: all up down stop status logs clean clean-db fclean re health help \
        send remove accept \
        $(addprefix up-,$(ALL_SERVICES)) \
        $(addprefix down-,$(ALL_SERVICES)) \
        $(addprefix restart-,$(ALL_SERVICES)) \
        $(addprefix build-,$(ALL_SERVICES)) \
        $(addprefix rebuild-,$(ALL_SERVICES)) \
        $(addprefix logs-,$(ALL_SERVICES)) \
        $(addprefix shell-,$(ALL_SERVICES)) \
        $(addprefix dev-,$(ALL_SERVICES)) \
        $(ALL_SERVICES)
