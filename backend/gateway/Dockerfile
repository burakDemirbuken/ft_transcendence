FROM node:22-alpine

WORKDIR /app

RUN apk upgrade --no-cache && \
	apk update --no-cache

COPY package*.json ./

RUN npm install

CMD [ "npm", "run", "dev" ]