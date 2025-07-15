FROM node:latest

RUN apt update && apt install -y

WORKDIR /home/bkorkut/trancedere

COPY . .

RUN npm install fastify @fastify/static
RUN npm install -g nodemon
RUN npm install tailwindcss @tailwindcss/postcss postcss
# RUN npx tailwindcss init

CMD [ "nodemon", "server.js" ]