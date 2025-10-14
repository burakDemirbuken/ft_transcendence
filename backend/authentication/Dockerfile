FROM node:22-alpine

RUN apk upgrade --no-cache && \
	apk update --no-cache

WORKDIR /app

COPY package.json ./

RUN npm install && \
	npm cache clean --force

EXPOSE 3001

COPY . .

CMD ["npm", "run", "dev"]