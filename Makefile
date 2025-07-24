# Variables
SRCS_FILE = ./services
LOGIN = ulyildiz
DATA_FILE = ${HOME}/${LOGIN}/data
COMPOSE_FILE = $(SRCS_FILE)/docker-compose.yml
COMPOSE_CMD = docker-compose -f $(COMPOSE_FILE)

# Colors for output
GREEN = \033[0;32m
RED = \033[0;31m
YELLOW = \033[1;33m
NC = \033[0m

all: up

# Create data directories
$(DATA_FILE):
	@echo "$(YELLOW)Creating data directories...$(NC)"
	@mkdir -p $(DATA_FILE)/mariadb
	@mkdir -p $(DATA_FILE)/wordpress

# Build and start containers
up: $(DATA_FILE)
	@echo "$(GREEN)Starting Docker Inception...$(NC)"
	@$(COMPOSE_CMD) up -d --build

# Stop containers
down:
	@echo "$(YELLOW)Stopping Docker Inception...$(NC)"
	@$(COMPOSE_CMD) down

# Stop and remove containers
stop:
	@echo "$(YELLOW)Stopping and removing containers...$(NC)"
	@$(COMPOSE_CMD) down --remove-orphans

# Show container status
status:
	@echo "$(GREEN)Container status:$(NC)"
	@$(COMPOSE_CMD) ps

# Show logs
logs:
	@$(COMPOSE_CMD) logs -f

# Clean non-persistent data
clean: stop
	@echo "$(RED)Cleaning up...$(NC)"
	@docker system prune -f

# Full cleanup
fclean:
	@echo "$(RED)Performing full cleanup...$(NC)"
	@$(COMPOSE_CMD) down --remove-orphans --volumes --rmi all 2>/dev/null || true
	@rm -rf $(DATA_FILE)
	@docker system prune -a --volumes -f
	@docker volume rm $$(docker volume ls -q | grep -E "(mariadb|wordpress)") 2>/dev/null || true
	@docker network rm inception 2>/dev/null || true

# Restart everything
re: fclean all

# Enter a container shell
shell-mariadb:
	@docker exec -it mariadb /bin/sh

shell-wordpress:
	@docker exec -it wordpress /bin/sh

shell-nginx:
	@docker exec -it nginx /bin/sh

# Development helpers
dev-logs-mariadb:
	@$(COMPOSE_CMD) logs -f mariadb

dev-logs-wordpress:
	@$(COMPOSE_CMD) logs -f wordpress

dev-logs-nginx:
	@$(COMPOSE_CMD) logs -f nginx

# Health check
health:
	@echo "$(GREEN)Health check:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show help
help:
	@echo "$(GREEN)Available targets:$(NC)"
	@echo "  all          - Build and start all containers (default)"
	@echo "  up           - Build and start all containers"
	@echo "  down         - Stop containers"
	@echo "  stop         - Stop and remove containers"
	@echo "  status       - Show container status"
	@echo "  logs         - Show logs (follow mode)"
	@echo "  clean        - Stop and remove containers and clean non-persistent data"
	@echo "  fclean       - Full cleanup (containers, images, volumes, data)"
	@echo "  re           - Restart everything (fclean + all)"
	@echo "  shell-*      - Enter container shell (mariadb, wordpress, nginx)"
	@echo "  dev-logs-*   - Show logs for specific service"
	@echo "  health       - Show container health status"
	@echo "  help         - Show this help message"

.PHONY: all up down stop status logs clean fclean re shell-mariadb shell-wordpress shell-nginx dev-logs-mariadb dev-logs-wordpress dev-logs-nginx health help