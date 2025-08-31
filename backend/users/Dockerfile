FROM node:22-alpine

WORKDIR /app

RUN mkdir -p data

COPY package*.json ./
COPY . .

RUN npm install

CMD ["node", "server.js"]