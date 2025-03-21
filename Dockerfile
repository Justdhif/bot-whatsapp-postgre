# Gunakan Node.js versi terbaru
FROM node:22

# Set work directory
WORKDIR /app

# Salin package.json dan install dependencies
COPY package*.json ./
RUN npm install

# Salin semua file ke dalam container
COPY . .

# Ekspos port
EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["node", "index.js"]
