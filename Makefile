# Variables
SRCS_FILE = ./services
COMPOSE_FILE = $(SRCS_FILE)/docker-compose.yml
COMPOSE_CMD = docker-compose -f $(COMPOSE_FILE)

# Service names
SERVICES = authentication gateway sqlite nginx
ALL_SERVICES = authentication gateway gameserver sqlite user livechat nginx frontend

# Volume directories (adjust these paths as needed)
VOLUME_BASE_DIR = ${HOME}/microservice/volumes
NGINX_DATA_DIR = $(VOLUME_BASE_DIR)/nginx_data
GATEWAY_SRC_DIR = $(VOLUME_BASE_DIR)/gateway/srcs
SQLITE_DATA_DIR = $(VOLUME_BASE_DIR)/databases/data

# Colors for output
GREEN = \033[0;32m
RED = \033[0;31m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m

all: volumes up

# Create all volume directories
volumes: $(NGINX_DATA_DIR) $(GATEWAY_SRC_DIR) $(SQLITE_DATA_DIR)
	@echo "$(GREEN)All volume directories created successfully!$(NC)"

# Create nginx data directory
$(NGINX_DATA_DIR):
	@echo "$(YELLOW)Creating nginx data directory...$(NC)"
	@mkdir -p $(NGINX_DATA_DIR)
	@chmod 755 $(NGINX_DATA_DIR)

# Create gateway source directory
$(GATEWAY_SRC_DIR):
	@echo "$(YELLOW)Creating gateway source directory...$(NC)"
	@mkdir -p $(GATEWAY_SRC_DIR)
	@chmod 755 $(GATEWAY_SRC_DIR)

# Create sqlite data directory
$(SQLITE_DATA_DIR):
	@echo "$(YELLOW)Creating sqlite data directory...$(NC)"
	@mkdir -p $(SQLITE_DATA_DIR)
	@chmod 755 $(SQLITE_DATA_DIR)

# Create individual volume directories
create-nginx-volume: $(NGINX_DATA_DIR)
	@echo "$(GREEN)Nginx volume directory created: $(NGINX_DATA_DIR)$(NC)"

create-gateway-volume: $(GATEWAY_SRC_DIR)
	@echo "$(GREEN)Gateway volume directory created: $(GATEWAY_SRC_DIR)$(NC)"

create-sqlite-volume: $(SQLITE_DATA_DIR)
	@echo "$(GREEN)SQLite volume directory created: $(SQLITE_DATA_DIR)$(NC)"

# Remove volume directories
clean-volumes:
	@echo "$(RED)Removing volume directories...$(NC)"
	@rm -rf $(NGINX_DATA_DIR) $(GATEWAY_SRC_DIR) $(SQLITE_DATA_DIR)
	@echo "$(RED)Volume directories removed$(NC)"

# Check volume directories
check-volumes:
	@echo "$(GREEN)Volume directory status:$(NC)"
	@echo "Nginx data: $(if $(wildcard $(NGINX_DATA_DIR)),$(GREEN)EXISTS$(NC),$(RED)MISSING$(NC)) - $(NGINX_DATA_DIR)"
	@echo "Gateway src: $(if $(wildcard $(GATEWAY_SRC_DIR)),$(GREEN)EXISTS$(NC),$(RED)MISSING$(NC)) - $(GATEWAY_SRC_DIR)"
	@echo "SQLite data: $(if $(wildcard $(SQLITE_DATA_DIR)),$(GREEN)EXISTS$(NC),$(RED)MISSING$(NC)) - $(SQLITE_DATA_DIR)"

# Build and start containers
up:
	@echo "$(GREEN)Starting all services...$(NC)"
	@$(COMPOSE_CMD) up -d --build

# Build and start specific service
up-%:
	@echo "$(GREEN)Starting service: $*$(NC)"
	@$(COMPOSE_CMD) up -d --build $*

# Stop containers
down:
	@echo "$(YELLOW)Stopping all services...$(NC)"
	@$(COMPOSE_CMD) down

# Stop specific service
down-%:
	@echo "$(YELLOW)Stopping service: $*$(NC)"
	@$(COMPOSE_CMD) stop $*

# Stop and remove containers
stop:
	@echo "$(YELLOW)Stopping and removing containers...$(NC)"
	@$(COMPOSE_CMD) down --remove-orphans

# Restart specific service
restart-%:
	@echo "$(BLUE)Restarting service: $*$(NC)"
	@$(COMPOSE_CMD) restart $*

# Build specific service
build-%:
	@echo "$(BLUE)Building service: $*$(NC)"
	@$(COMPOSE_CMD) build $*

# Rebuild specific service (no cache)
rebuild-%:
	@echo "$(BLUE)Rebuilding service: $* (no cache)$(NC)"
	@$(COMPOSE_CMD) build --no-cache $*

# Show container status
status:
	@echo "$(GREEN)Container status:$(NC)"
	@$(COMPOSE_CMD) ps

# Show logs
logs:
	@$(COMPOSE_CMD) logs -f

# Show logs for specific service
logs-%:
	@echo "$(GREEN)Showing logs for service: $*$(NC)"
	@$(COMPOSE_CMD) logs -f $*

# Execute shell in specific service
shell-%:
	@echo "$(GREEN)Entering shell for service: $*$(NC)"
	@docker exec -it $* /bin/bash || docker exec -it $* /bin/sh

# Clean non-persistent data
clean: stop
	@echo "$(RED)Cleaning up...$(NC)"
	@docker system prune -f

# Full cleanup
fclean: clean-volumes
	@echo "$(RED)Performing full cleanup...$(NC)"
	@$(COMPOSE_CMD) down --remove-orphans --volumes --rmi all 2>/dev/null || true
	@docker system prune -a --volumes -f
	@docker volume prune -f
	@docker network prune -f

# Restart everything
re: fclean all

# Service-specific shortcuts
authentication: up-authentication
gateway: up-gateway
databases: up-databases
nginx: up-nginx
gameserver: up-gameserver
user: up-user
livechat: up-livechat
frontend: up-frontend

# Development helpers - Quick access to individual services
dev-authentication:
	@echo "$(BLUE)Development mode for authentication service$(NC)"
	@$(COMPOSE_CMD) up -d --build authentication
	@$(COMPOSE_CMD) logs -f authentication

dev-gateway:
	@echo "$(BLUE)Development mode for gateway service$(NC)"
	@$(COMPOSE_CMD) up -d --build gateway
	@$(COMPOSE_CMD) logs -f gateway

dev-databases:
	@echo "$(BLUE)Development mode for databases service$(NC)"
	@$(COMPOSE_CMD) up -d --build databases
	@$(COMPOSE_CMD) logs -f databases

dev-nginx:
	@echo "$(BLUE)Development mode for nginx service$(NC)"
	@$(COMPOSE_CMD) up -d --build nginx
	@$(COMPOSE_CMD) logs -f nginx

dev-gameserver:
	@echo "$(BLUE)Development mode for gameserver service$(NC)"
	@$(COMPOSE_CMD) up -d --build gameserver
	@$(COMPOSE_CMD) logs -f gameserver

dev-user:
	@echo "$(BLUE)Development mode for user service$(NC)"
	@$(COMPOSE_CMD) up -d --build user
	@$(COMPOSE_CMD) logs -f user

dev-livechat:
	@echo "$(BLUE)Development mode for livechat service$(NC)"
	@$(COMPOSE_CMD) up -d --build livechat
	@$(COMPOSE_CMD) logs -f livechat

dev-frontend:
	@echo "$(BLUE)Development mode for frontend service$(NC)"
	@$(COMPOSE_CMD) up -d --build frontend
	@$(COMPOSE_CMD) logs -f frontend

# Health check
health:
	@echo "$(GREEN)Health check:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# List all services
list-services:
	@echo "$(GREEN)Available services:$(NC)"
	@echo "$(YELLOW)Active services:$(NC) $(SERVICES)"
	@echo "$(YELLOW)All services (including commented):$(NC) $(ALL_SERVICES)"

# Show help
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
	@echo "  fclean           - Full cleanup (containers, images, volumes + volume directories)"
	@echo "  re               - Restart everything (fclean + all)"
	@echo "  health           - Show container health status"
	@echo "  list-services    - List all available services"
	@echo ""
	@echo "$(YELLOW)Volume management:$(NC)"
	@echo "  volumes          - Create all volume directories"
	@echo "  create-nginx-volume   - Create nginx volume directory"
	@echo "  create-gateway-volume - Create gateway volume directory"
	@echo "  create-sqlite-volume  - Create sqlite volume directory"
	@echo "  clean-volumes    - Remove all volume directories"
	@echo "  check-volumes    - Check volume directory status"
	@echo ""
	@echo "$(YELLOW)Service-specific commands:$(NC)"
	@echo "  up-<service>     - Start specific service (e.g., up-nginx)"
	@echo "  down-<service>   - Stop specific service (e.g., down-nginx)"
	@echo "  restart-<service> - Restart specific service (e.g., restart-gateway)"
	@echo "  build-<service>  - Build specific service (e.g., build-authentication)"
	@echo "  rebuild-<service> - Rebuild specific service without cache"
	@echo "  logs-<service>   - Show logs for specific service (e.g., logs-sqlite)"
	@echo "  shell-<service>  - Enter container shell (e.g., shell-nginx)"
	@echo ""
	@echo "$(YELLOW)Development shortcuts:$(NC)"
	@echo "  authentication   - Start authentication service"
	@echo "  gateway          - Start gateway service"
	@echo "  sqlite           - Start sqlite service"
	@echo "  nginx            - Start nginx service"
	@echo "  gameserver       - Start gameserver service (if uncommented)"
	@echo "  user             - Start user service (if uncommented)"
	@echo "  livechat         - Start livechat service (if uncommented)"
	@echo "  frontend         - Start frontend service (if uncommented)"
	@echo ""
	@echo "$(YELLOW)Development modes (build + logs):$(NC)"
	@echo "  dev-<service>    - Build, start and follow logs for specific service"
	@echo ""
	@echo "$(BLUE)Volume directories:$(NC)"
	@echo "  Nginx data:   $(NGINX_DATA_DIR)"
	@echo "  Gateway src:  $(GATEWAY_SRC_DIR)"
	@echo "  SQLite data:  $(SQLITE_DATA_DIR)"
	@echo ""
	@echo "$(BLUE)Examples:$(NC)"
	@echo "  make volumes           # Create all volume directories"
	@echo "  make check-volumes     # Check volume status"
	@echo "  make up-nginx          # Start only nginx"
	@echo "  make logs-gateway      # Show gateway logs"
	@echo "  make shell-sqlite      # Enter sqlite container"
	@echo "  make dev-authentication # Development mode for authentication"

.PHONY: all up down stop status logs clean fclean re health list-services help \
        volumes create-nginx-volume create-gateway-volume create-sqlite-volume \
        clean-volumes check-volumes \
        $(addprefix up-,$(ALL_SERVICES)) \
        $(addprefix down-,$(ALL_SERVICES)) \
        $(addprefix restart-,$(ALL_SERVICES)) \
        $(addprefix build-,$(ALL_SERVICES)) \
        $(addprefix rebuild-,$(ALL_SERVICES)) \
        $(addprefix logs-,$(ALL_SERVICES)) \
        $(addprefix shell-,$(ALL_SERVICES)) \
        $(addprefix dev-,$(ALL_SERVICES)) \
        $(ALL_SERVICES)