FROM node:18-alpine

WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Uygulama dosyalarını kopyala
COPY . .

# Port'u aç
EXPOSE 3003

# Sağlık kontrolü ekle
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3003', (r) => {process.exit(r.statusCode === 426 ? 0 : 1)})"

# Uygulamayı başlat
CMD ["npm", "run", "dev"]
