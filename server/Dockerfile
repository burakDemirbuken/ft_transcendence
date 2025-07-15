# En güncel Node.js sürümünü kullan
FROM debian:latest

# Sistemi güncelle ve temel araçları kur
RUN apt update && apt install -y \
    nodejs \
    npm \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN npm init -y

RUN npm install fastify 

COPY server.js /app/server.js

EXPOSE 3000

CMD ["node", "server.js"]