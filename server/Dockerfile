FROM node:latest

RUN apt update && apt install -y

WORKDIR /home/bkorkut/trancedere

COPY . .

RUN npm install
RUN npm install fastify @fastify/static
RUN npm install -g nodemon

CMD [ "nodemon", "server.js" ]