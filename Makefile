all: run

run:
	nodemon server/server.js

.PHONY: all run
