const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

// Inisialisasi client WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.SESSION_DIR || "./session", // Lokasi penyimpanan session
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  }, // Run in headless mode
});

// Database sederhana (gunakan object untuk menyimpan data)
const database = {};
let groupId = null; // Variabel untuk menyimpan ID group

// Variabel untuk menyimpan QR code
let qrCodeData = null;

// Fungsi untuk membuat header dengan format yang konsisten
function createHeader(title) {
  const titleLength = title.length; // Panjang judul
  const lineLength = titleLength + 14; // Panjang garis disesuaikan dengan panjang judul
  const line = "=".repeat(lineLength); // Buat garis dengan panjang yang sesuai
  return `${line}\n>------ ${title} -------<\n${line}`;
}

// Fungsi untuk mengecek apakah bot aktif (jam 6:00 - 22:00 WIB)
function isBotActive() {
  const now = new Date();
  const utcHours = now.getUTCHours(); // Ambil jam dalam UTC
  let wibHours = utcHours + 7; // Konversi ke WIB (UTC+7)

  // Jika hasilnya lebih dari 24, kurangi 24 untuk mendapatkan waktu yang valid
  if (wibHours >= 24) {
    wibHours -= 24;
  }

  console.log(`Waktu UTC: ${utcHours}:${now.getUTCMinutes()}`);
  console.log(`Waktu WIB: ${wibHours}:${now.getUTCMinutes()}`);
  return wibHours >= 6 && wibHours < 22; // Aktif dari jam 6:00 sampai 21:59 WIB
}

// Fungsi untuk mengecek status aktif/non-aktif
function checkActiveTime() {
  if (isBotActive()) {
    console.log("Bot sedang aktif! 🟢");
  } else {
    console.log("Bot sedang non-aktif. 🔴");
  }
}

// Fungsi untuk mengirim pesan ke group ketika bot aktif/non-aktif
async function sendGroupStatusMessage() {
  if (groupId) {
    const groupChat = await client.getChatById(groupId);

    if (isBotActive()) {
      const activeMessage = `
            🌟 *Bot sedang aktif!* 🌟
            🕒 Jam operasional: 6:00 - 22:00 WIB
            🤖 Silakan tag bot dengan perintah yang tersedia:
            - !hai
            - !info
            - !set
            - !edit
            - !delete
            - !list
            - !get
            `;
      groupChat.sendMessage(activeMessage);
    } else {
      const inactiveMessage = `
            🔴 *Bot sedang non-aktif!* 🔴
            🕒 Bot akan aktif kembali besok jam 6:00 WIB.
            😊 Terima kasih telah menggunakan layanan bot!
            `;
      groupChat.sendMessage(inactiveMessage);
    }
  }
}

// Generate QR code untuk login
client.on("qr", (qr) => {
  console.log("QR code generated. Silakan scan di browser.");
  qrcode.generate(qr, { small: true });
  qrCodeData = qr;
  console.log("QR code data:", qrCodeData);
});

// Ketika sudah terautentikasi
client.on("ready", () => {
  console.log("Client is ready!");
  qrCodeData = null; // Reset QR code data
  checkActiveTime(); // Cek waktu aktif saat bot siap
});

// Ketika bot dimasukkan ke dalam group
client.on("group_join", (notification) => {
  groupId = notification.chatId; // Simpan ID group
  console.log(`Bot dimasukkan ke group dengan ID: ${groupId}`);
});

// Fungsi untuk menambahkan nested key-value ke database
function setNestedKey(obj, keys, value) {
  const key = keys.shift(); // Ambil key pertama
  if (!keys.length) {
    obj[key] = value; // Jika tidak ada key lagi, simpan value
  } else {
    if (!obj[key]) obj[key] = {}; // Jika key belum ada, buat objek baru
    setNestedKey(obj[key], keys, value); // Rekursif untuk key berikutnya
  }
}

// Fungsi untuk mengambil nested key-value dari database
function getNestedKey(obj, keys) {
  const key = keys.shift(); // Ambil key pertama
  if (!keys.length) {
    return obj[key]; // Jika tidak ada key lagi, kembalikan value
  } else {
    if (!obj[key]) return null; // Jika key tidak ditemukan, kembalikan null
    return getNestedKey(obj[key], keys); // Rekursif untuk key berikutnya
  }
}

// Ketika menerima pesan
client.on("message", async (msg) => {
  const chat = await msg.getChat(); // Ambil info chat
  const mentionedIds = await msg.getMentions(); // Ambil daftar nomor yang ditag

  // Cek apakah pesan ditujukan ke bot (ditag)
  const isBotMentioned = mentionedIds.some(
    (mention) => mention.id._serialized === client.info.wid._serialized
  );

  if (isBotMentioned) {
    const body = msg.body.replace(`@${client.info.wid.user}`, "").trim(); // Hapus tag dari pesan

    // Cek jika pesan diawali dengan tanda seru (!)
    if (body.startsWith("!")) {
      // Cek apakah bot sedang aktif
      if (isBotActive()) {
        const command = body.split(" ")[0]; // Ambil perintah (contoh: !hai, !set)
        const args = body.split(" ").slice(1).join(" "); // Ambil argumen setelah perintah

        switch (command) {
          case "!hai":
            const haiHeader = createHeader("Hai");
            msg.reply(`${haiHeader}\n🌟 Halo! Ada yang bisa saya bantu? 😊`);
            break;

          case "!info":
            const infoHeader = createHeader("Info");
            msg.reply(
              `${infoHeader}\n🤖 Ini adalah bot WhatsApp sederhana. ✨\n🕒 Jam operasional: 6:00 - 22:00 WIB`
            );
            break;

          case "!set":
            const setHeader = createHeader("Set");
            // Cek apakah pesan ini adalah reply
            if (msg.hasQuotedMsg) {
              const quotedMsg = await msg.getQuotedMessage(); // Ambil pesan yang di-reply
              const keys = args.split("/"); // Pisahkan key1/key2
              const value = quotedMsg.body; // Ambil value dari pesan yang di-reply

              // Simpan data ke database
              setNestedKey(database, keys, value);
              msg.reply(
                `${setHeader}\n✅ *Data berhasil disimpan!*\n🔑 *${args}* = *${value}* 🎉`
              );
            } else {
              msg.reply(
                `${setHeader}\n❌ *Silakan reply pesan untuk menyimpan value.* 😊`
              );
            }
            break;

          case "!get":
            const getHeader = createHeader("Get");
            const keys = args.split("/"); // Pisahkan key1/key2
            const value = getNestedKey(database, [...keys]); // Ambil value dari database

            if (value) {
              if (typeof value === "object") {
                // Jika value adalah objek (ada nested key)
                let listMessage = "📜 *Daftar List :*\n";
                for (const key in value) {
                  listMessage += `🔑 *${key}* = *${value[key]}*\n`;
                }
                msg.reply(`${getHeader}\n${listMessage}`);
              } else {
                // Jika value adalah string
                msg.reply(`${getHeader}\n🔑 *${args}* = *${value}*`);
              }
            } else {
              msg.reply(`${getHeader}\n❌ *Key ${args} tidak ditemukan.* 😅`);
            }
            break;

          case "!delete":
            const deleteHeader = createHeader("Delete");
            const keysToDelete = args.split("/"); // Pisahkan key1/key2
            const parentKey = keysToDelete.slice(0, -1); // Ambil parent key
            const lastKey = keysToDelete[keysToDelete.length - 1]; // Ambil key terakhir

            const parentObj = getNestedKey(database, [...parentKey]);
            if (parentObj && parentObj[lastKey]) {
              delete parentObj[lastKey]; // Hapus key terakhir
              msg.reply(
                `${deleteHeader}\n🗑️ *Key ${args} berhasil dihapus!* ✨`
              );
            } else {
              msg.reply(
                `${deleteHeader}\n❌ *Key ${args} tidak ditemukan.* 😅`
              );
            }
            break;

          case "!list":
            const listHeader = createHeader("List");
            if (Object.keys(database).length > 0) {
              // Gambar kucing lucu ASCII
              const catArt = `
🌟 *Selamat datang di* 🌟
/\\_/\\
( o.o )  🐱
/> ^ <   ✨
`;

              // Daftar key dengan dekorasi
              let listMessage = "📜 *Daftar List :*\n";
              for (const key in database) {
                listMessage += `🔑 *${key}* = *${JSON.stringify(
                  database[key]
                )}*\n`;
              }

              // Footer dengan dekorasi
              const footer = "> dibuat oleh nadhif ✨";

              // Gabungkan semua pesan
              const fullMessage = `${listHeader}\n${catArt}\n${listMessage}\n${footer}`;
              msg.reply(fullMessage);
            } else {
              msg.reply(
                `${listHeader}\n❌ *Tidak ada data yang tersimpan.* 😅`
              );
            }
            break;

          default:
            const defaultHeader = createHeader("Maaf");
            msg.reply(
              `${defaultHeader}\n❌ *Maaf, aku tidak mengerti.* 😅 Coba ketik \`!info\` untuk bantuan ya! 🫶`
            );
        }
      } else {
        // Bot sedang non-aktif
        const inactiveHeader = createHeader("Non-Aktif");
        msg.reply(
          `${inactiveHeader}\n🔴 *Maaf, bot hanya aktif dari jam 6:00 sampai 22:00 WIB.* Silakan coba lagi nanti! 😊`
        );
      }
    }
  }
});

// Buat server web untuk menampilkan QR code
app.get("/", (req, res) => {
  if (!client.info) {
    // Jika client belum terautentikasi, tampilkan QR code
    if (qrCodeData) {
      console.log("Mengirim QR code ke browser:", qrCodeData);
      res.send(`
        <h1>Scan QR Code untuk Login</h1>
        <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
          qrCodeData
        )}&size=300x300" alt="QR Code" />
        <p>Silakan buka WhatsApp di ponsel Anda, pilih "Linked Devices", dan scan QR code di atas.</p>
      `);
    } else {
      console.log("Menunggu QR code...");
      res.send(`
        <h1>Menunggu QR code...</h1>
        <p>Silakan tunggu sebentar, QR code akan segera muncul.</p>
      `);
    }
  } else {
    // Jika client sudah terautentikasi, tampilkan pesan
    res.send(`
      <h1>Bot sudah terautentikasi!</h1>
      <p>Tidak perlu scan QR code lagi. Bot sedang berjalan.</p>
    `);
  }
});

// Jalankan server web
app.listen(port, () => {
  console.log(`Server web berjalan di http://localhost:${port}`);
});

// Start client
client.initialize();

// Cek waktu aktif setiap menit dan kirim pesan ke group
setInterval(async () => {
  checkActiveTime();
  await sendGroupStatusMessage();
}, 60000); // 60000 ms = 1 menit
