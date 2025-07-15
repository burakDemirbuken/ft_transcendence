DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_FILE = docker-compose.yml

all: run

build:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build

run: stop build
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

stop:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

logs:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs

clean: stop
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --volumes --remove-orphans


nodejs:
	docker exec -it ft_transcendence_node bash
re: stop run

.PHONY: all run stop logs

