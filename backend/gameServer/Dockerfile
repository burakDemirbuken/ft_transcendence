FROM node:24-alpine

RUN apk update --no-cache && \
	apk upgrade --no-cache

WORKDIR /app

COPY . .

RUN npm install

CMD [ "npm", "run", "dev" ]
