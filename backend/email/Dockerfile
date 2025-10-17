FROM node:18-alpine

WORKDIR /app

RUN apk update --no-cache && \
    apk upgrade --no-cache

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]
