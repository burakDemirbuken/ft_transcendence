FROM node:22-alpine

RUN apk upgrade --no-cache && \
	apk update --no-cache

WORKDIR /app

COPY package*.json ./
COPY . .

RUN apk add --no-cache sqlite

RUN npm install && \
	npm cache clean --force


CMD ["npm", "run", "test:db:watch"]