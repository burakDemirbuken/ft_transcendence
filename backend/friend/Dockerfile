FROM node:24-alpine

WORKDIR /app

RUN mkdir -p database \
    && apk upgrade --no-cache && \
    apk update --no-cache

COPY package*.json ./
COPY . .

RUN apk add --no-cache sqlite

RUN npm install

CMD ["npm", "run", "dev"]
