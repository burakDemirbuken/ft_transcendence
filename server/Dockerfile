# En güncel Node.js sürümünü kullan
FROM node:latest

# Sistemi güncelle ve temel araçları kur
RUN apt update && apt install -y

# Çalışma dizinine geç
WORKDIR /home/bkorkut/trancedere

COPY ../ .

ENTRYPOINT ["/home/bkorkut/trancedere/server/entrypoint.sh"]

# Sunucuyu başlat
CMD [ "nodemon", "server/server.js" ]