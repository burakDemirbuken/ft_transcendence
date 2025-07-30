FROM node:22-alpine

RUN apk upgrade --no-cache && \
	apk update --no-cache

WORKDIR /app
COPY package*.json ./

RUN npm install && \
	npm cache clean --force

COPY . .

CMD ["npm", "run", "dev"]