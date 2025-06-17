DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_FILE = docker-compose.yml

all: run

run:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build -d

stop:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

logs:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs

clean: stop
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --volumes --remove-orphans

re: stop run

.PHONY: all run stop logs

