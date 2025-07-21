FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT [ "./entrypoint.sh" ]

# CMD ["npm", "start"]

# BETUL: Front end üzerinde çalışırken, değişiklik halinde dosyaların güncellenmesi
# için node otomatik olarak yeniden başlamalı (nodemon) ve .ts dosyalarının değişiklik halinde
# tekrar derlenip .js dosyasına çevirilmesi için tsc -w (--watch) flagi ile çalışmalı.

# Eski düzen için yorum satırları kaldırılıp ENTRYPOINT içerisindeki bazı satırlar yoruma alınmalı.

