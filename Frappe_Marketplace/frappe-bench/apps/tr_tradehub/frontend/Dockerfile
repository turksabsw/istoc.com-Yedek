FROM node:20-alpine

WORKDIR /app

# Bağımlılıkları önce kopyala (cache katmanı)
COPY package.json package-lock.json ./
RUN npm ci

# Kaynak kodları kopyala
COPY . .

EXPOSE 8082

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
