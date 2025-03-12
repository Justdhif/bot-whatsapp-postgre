---

# 📖 Daftar Command Bot WhatsApp

Bot ini dirancang untuk membantu manajemen grup WhatsApp, menyimpan data, mengelola keuangan, dan memberikan informasi. Berikut adalah daftar command yang tersedia:

---

## 🛠️ **Command Umum**

### `!menu`

- **Deskripsi**: Menampilkan daftar command yang tersedia.
- **Contoh**: `!menu`

### `!info`

- **Deskripsi**: Menampilkan informasi tentang bot.
- **Contoh**: `!info`

### `!get <key>`

- **Deskripsi**: Mengambil nilai dari key yang disimpan.
- **Contoh**: `!get nama`

### `!list`

- **Deskripsi**: Menampilkan daftar semua key yang tersimpan.
- **Contoh**: `!list`

### `!balance`

- **Deskripsi**: Menampilkan saldo keuangan saat ini.
- **Contoh**: `!balance`

---

## 🔐 **Command Admin**

### `!login`

- **Deskripsi**: Memulai proses login untuk menjadi admin.
- **Contoh**: `!login`

### `!username <username>`

- **Deskripsi**: Mengatur username untuk admin.
- **Contoh**: `!username admin123`

### `!code <kode>`

- **Deskripsi**: Memverifikasi kode untuk menyelesaikan proses login.
- **Contoh**: `!code 123456`

---

## 📝 **Command Penyimpanan Data**

### `!set <key>`

- **Deskripsi**: Menyimpan value ke dalam key. Harus reply pesan yang berisi value.
- **Contoh**: `!set nama` (lalu reply pesan dengan value)

### `!edit <key>`

- **Deskripsi**: Mengedit value dari key yang sudah ada. Harus reply pesan yang berisi value baru.
- **Contoh**: `!edit nama` (lalu reply pesan dengan value baru)

### `!delete <key>`

- **Deskripsi**: Menghapus key dan value yang tersimpan.
- **Contoh**: `!delete nama`

### `!delete all`

- **Deskripsi**: Menghapus semua data yang tersimpan.
- **Contoh**: `!delete all`

---

## 💰 **Command Keuangan**

### `!addincome <jumlah> <deskripsi>`

- **Deskripsi**: Menambahkan pemasukan ke dalam catatan keuangan.
- **Contoh**: `!addincome 100000 Gaji bulanan`

### `!addexpense <jumlah> <deskripsi>`

- **Deskripsi**: Menambahkan pengeluaran ke dalam catatan keuangan.
- **Contoh**: `!addexpense 50000 Belanja bulanan`

### `!downloadfinance`

- **Deskripsi**: Mengunduh laporan keuangan dalam format Excel.
- **Contoh**: `!downloadfinance`

---

## 🕒 **Command Waktu Operasional Bot**

Bot akan mengirim pesan otomatis pada:

- **Jam 5:00 WIB**: Bot aktif dan mengirim pesan "Bot sedang aktif!".
- **Jam 22:00 WIB**: Bot non-aktif dan mengirim pesan "Bot sedang non-aktif!".

---

## 🚀 **Cara Menggunakan Bot**

1. **Scan QR Code**: Buka server web bot untuk mendapatkan QR code dan scan menggunakan WhatsApp.
2. **Login sebagai Admin**:
   - Kirim `!login` untuk memulai proses login.
   - Set username dengan `!username <username>`.
   - Verifikasi kode dengan `!code <kode>`.
3. **Gunakan Command**: Gunakan command yang tersedia sesuai kebutuhan.

---

## 📂 **Struktur Database**

- **Database Utama**: Menyimpan key-value sederhana.
- **Database Keuangan**: Menyimpan catatan pemasukan dan pengeluaran.

---

## 🛑 **Batasan**

- Beberapa command seperti `!addincome`, `!addexpense`, dan `!downloadfinance` hanya bisa digunakan di chat pribadi.
- Command seperti `!set`, `!edit`, `!delete`, dan lainnya hanya bisa digunakan oleh admin.

---

## 📄 **Laporan Keuangan**

Laporan keuangan dapat diunduh dalam format Excel dengan command `!downloadfinance`. File akan berisi:

- **Sheet Income**: Daftar pemasukan.
- **Sheet Expenses**: Daftar pengeluaran.

---

## 🎉 **Quote Hari Ini**

Bot akan mengirim quote acak setiap hari sebagai motivasi.

---
