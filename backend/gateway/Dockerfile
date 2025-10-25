FROM node:24-alpine

RUN apk update --no-cache && \
	apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./
COPY . .

RUN apk add --no-cache sqlite

RUN npm install 


CMD ["npm", "run", "dev"]