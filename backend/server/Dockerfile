FROM node:22-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT [ "./entrypoint.sh" ]

# CMD ["npm", "start"]

# CMD ["npm", "run", "devBack"]

# CMD komutları kullanıldığında entrypoint'te sadece şu ikisi açık kalmalı:
# npm run build
# exec "$@"
