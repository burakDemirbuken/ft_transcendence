FROM node:24-alpine

WORKDIR /app

RUN mkdir -p database

COPY package*.json ./
COPY . .

RUN apk add --no-cache sqlite

RUN npm install

CMD ["node", "server.js"]