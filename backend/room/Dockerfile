FROM node:24-alpine

WORKDIR /app

RUN apk update --no-cache && \
    apk upgrade --no-cache

COPY package*.json ./
COPY . .

RUN npm install

CMD ["npm", "run", "dev"]