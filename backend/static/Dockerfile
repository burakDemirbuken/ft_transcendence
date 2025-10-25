FROM node:24-alpine

WORKDIR /app

RUN mkdir -p database \
    && mkdir -p database/uploads \
    && mkdir -p database/default \
    && apk update --no-cache && \
    apk upgrade --no-cache

COPY package*.json ./
COPY default.png ./database/default/
COPY . .

RUN npm install && \
    npm cache clean --force

CMD ["npm", "run", "dev"]