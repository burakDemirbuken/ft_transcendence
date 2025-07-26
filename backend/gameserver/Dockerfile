FROM node:latest

RUN apt update && apt install -y

WORKDIR /app

RUN npm install

CMD [ "npm", "run", "dev" ]