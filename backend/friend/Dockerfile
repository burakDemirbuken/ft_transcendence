FROM node:24-alpine

WORKDIR /app

RUN apk update --no-cache && \
    apk upgrade --no-cache
RUN mkdir -p database 

COPY package*.json ./
COPY . .

RUN apk add --no-cache sqlite
RUN npm install

CMD ["npm", "run", "dev"]
