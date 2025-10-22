FROM node:22-alpine

RUN apk update --no-cache && \
	apk upgrade --no-cache

WORKDIR /app

COPY package.json ./

RUN npm install && \
	npm cache clean --force

COPY . .

CMD ["npm", "run", "dev"]