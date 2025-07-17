DOCKER_COMPOSE       = docker compose
DOCKER_COMPOSE_FILE  = docker-compose.yml


all: run

build:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build

run: stop build
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up

stop:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

logs:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f

clean: stop
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --volumes --remove-orphans

list:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) ps -a

nodejs:
	docker exec -it node_service sh

re: stop run

.PHONY: all build run stop logs clean nodejs re
