# En güncel Node.js sürümünü kullan
FROM node:latest

# Sistemi güncelle ve temel araçları kur
RUN apt update && apt install -y

# Çalışma dizinine geç
WORKDIR /app

# Uygulama dosyalarını kopyala
COPY . .

# Bağımlılıkları yükle
RUN npm install

# Sunucuyu başlat
CMD [ "node", "server.js" ]
