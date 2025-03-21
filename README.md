# 🚀 JustBot - WhatsApp Bot dengan Node.js & Prisma

JustBot adalah bot WhatsApp canggih yang dibangun dengan **Node.js** dan **whatsapp-web.js**, serta didukung oleh **Prisma** dan **PostgreSQL** untuk pengelolaan data. Bot ini menawarkan berbagai fitur seperti pencatatan, pengingat, manajemen keuangan, dan masih banyak lagi! 💡✨

## 🎯 Fitur Utama

✅ **Database berbasis Prisma & PostgreSQL** - Data tersimpan dengan aman  
✅ **Pencatatan & Pengingat** - Simpan dan kelola catatan serta pengingat  
✅ **Manajemen Keuangan** - Catat pemasukan, pengeluaran, dan buat laporan finansial  
✅ **Akses QR Code via Browser** - Mudah dihubungkan melalui browser  
✅ **Perintah Interaktif** - Daftar perintah lengkap untuk navigasi yang mudah  

## 🛠 Instalasi & Konfigurasi

### 1️⃣ Clone Repository
```bash
git clone https://github.com/Justdhif/bot-whatsapp-postgre.git
cd justbot
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Konfigurasi Database (Prisma & PostgreSQL)
- Pastikan PostgreSQL sudah berjalan
- Buat file `.env` dan atur **DATABASE_URL**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```
- Jalankan perintah berikut untuk migrasi database:
```bash
npx prisma migrate dev --name init
```

### 4️⃣ Jalankan Bot 🚀
```bash
npm start
```
Kemudian, buka `http://localhost:3000/qr` di browser untuk memindai QR Code WhatsApp.

## 🔥 Perintah Bot
| Perintah      | Fungsi |
|--------------|--------|
| `!menu`      | Menampilkan menu utama |
| `!set <key> <value>` | Menyimpan data ke database |
| `!get <key>` | Mengambil data berdasarkan key |
| `!income <jumlah> <deskripsi>` | Mencatat pemasukan |
| `!expense <jumlah> <deskripsi>` | Mencatat pengeluaran |
| `!remind <tanggal> <pesan>` | Membuat pengingat |

## 📌 Teknologi yang Digunakan
- **Node.js** + Express.js
- **whatsapp-web.js**
- **Prisma ORM**
- **PostgreSQL**
- **Railway.app** (Opsional untuk deployment)

## 🚀 Deployment ke Railway
Untuk deploy ke **Railway**, lakukan langkah berikut:
```bash
railway init
railway up
```
Pastikan `DATABASE_URL` sudah dikonfigurasi di Railway.

## 💡 Kontribusi & Dukungan
Suka dengan proyek ini? ⭐ Star repository ini dan ajukan **Pull Request** jika ingin berkontribusi! Jika mengalami masalah, buka **Issues** atau hubungi saya. 😊

---

© 2025 JustBot | Made with ❤️ by Justdhif
