FROM node:22-alpine

RUN apk upgrade --no-cache && \
	apk update --no-cache

RUN npm install -g npm@latest

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY ./srcs/gateway.js ./

CMD ["npm", "start"]