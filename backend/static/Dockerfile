FROM node:24-alpine

WORKDIR /app

RUN apk update --no-cache && \
    apk upgrade --no-cache

COPY package*.json ./

RUN npm install && \
    npm cache clean --force

COPY . .

RUN mkdir -p database && \
    mkdir -p database/avatars && \
    touch database/avatars/a.png

CMD ["npm", "run", "dev"]