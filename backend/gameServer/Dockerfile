FROM node:24-alpine

RUN apk upgrade --no-cache && \
	apk update --no-cache

WORKDIR /app

COPY . .

RUN npm install

CMD [ "npm", "run", "dev" ]
