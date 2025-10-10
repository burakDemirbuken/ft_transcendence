FROM node:24-alpine

WORKDIR /app

RUN apk upgrade --no-cache && \
    apk update --no-cache

COPY package*.json ./
COPY . .

RUN npm install

CMD ["npm", "run", "dev"]