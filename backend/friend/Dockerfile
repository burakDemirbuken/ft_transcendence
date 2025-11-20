FROM node:24-alpine

WORKDIR /app

RUN apk update && \
    apk upgrade
RUN mkdir -p database

COPY package*.json ./
COPY . .

RUN apk add --no-cache sqlite python3 make g++
RUN npm install

CMD ["npm", "run", "dev"]
