DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_FILE = server/docker-compose.yml

all: run

run: build
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up

build:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build

stop:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

clean:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --remove-orphans

logs:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs

re: stop run

.PHONY: all run stop logs