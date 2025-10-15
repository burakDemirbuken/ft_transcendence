FROM node:24-alpine

RUN apk upgrade --no-cache && \
	apk update --no-cache

WORKDIR /app

COPY package*.json ./
COPY . .

RUN chown 777 /app/index.html -R

RUN npm install

RUN npm run build

CMD ["npm", "run", "dev"]