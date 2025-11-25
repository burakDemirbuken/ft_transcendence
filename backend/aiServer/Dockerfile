FROM node:18-alpine

# Çalışma dizini
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install --production

# Uygulama dosyalarını kopyala

COPY . .

# Port'u aç
EXPOSE 3003

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3003/health', (r) => {let d='';r.on('data',c=>d+=c);r.on('end',()=>process.exit(JSON.parse(d).status==='ok'?0:1))})"

# Uygulamayı başlat
CMD [ "npm", "run", "dev" ]
