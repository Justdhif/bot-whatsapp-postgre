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

// Fungsi untuk menambahkan garis di sebelah kiri pada setiap baris
function addLeftBorder(content) {
  const lines = content.split("\n"); // Pisahkan konten menjadi baris-baris
  let borderedContent = "";
  lines.forEach((line) => {
    borderedContent += `| ${line}\n`; // Tambahkan garis di sebelah kiri setiap baris
  });
  return borderedContent;
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
        const command = body.split(" ")[0]; // Ambil perintah (contoh: !menu, !set)
        const args = body.split(" ").slice(1).join(" "); // Ambil argumen setelah perintah

        switch (command) {
          case "!menu":
            const menuHeader = createHeader("Menu");
            const menuContent = `
🌟 *Daftar Perintah :* 🌟
📌 *!info* - Info tentang bot
📌 *!get* - Ambil data berdasarkan key
📌 *!list* - Tampilkan daftar key yang tersimpan
`;
            msg.reply(addLeftBorder(`${menuHeader}\n${menuContent}`));
            break;

          case "!info":
            const infoHeader = createHeader("Info");
            const infoContent = `🤖 Ini adalah bot WhatsApp sederhana. ✨\n🕒 Jam operasional: 6:00 - 22:00 WIB`;
            msg.reply(addLeftBorder(`${infoHeader}\n${infoContent}`));
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
              const setContent = `✅ *Data berhasil disimpan!*\n🔑 *${args}* = *${value}* 🎉`;
              msg.reply(addLeftBorder(`${setHeader}\n${setContent}`));
            } else {
              const setContent = `❌ *Silakan reply pesan untuk menyimpan value.* 😊`;
              msg.reply(addLeftBorder(`${setHeader}\n${setContent}`));
            }
            break;

          case "!get":
            const key = args.trim(); // Ambil key yang diminta (bisa key1 atau key2)
            const getHeader = createHeader(key); // Judul diubah sesuai dengan key yang diminta

            // Cek apakah key ada di database
            if (database[key]) {
              // Jika key ada di database dan merupakan objek (ada nested key)
              if (typeof database[key] === "object") {
                let listMessage = "📜 *Daftar List :*\n";
                for (const nestedKey in database[key]) {
                  listMessage += `🔑 *${nestedKey}*\n`; // Hanya tampilkan nested key, tidak tampilkan value
                }
                msg.reply(addLeftBorder(`${getHeader}\n${listMessage}`));
              } else {
                // Jika key ada di database dan merupakan value langsung
                const getContent = `🔑 *${key}* = *${database[key]}*`;
                msg.reply(addLeftBorder(`${getHeader}\n${getContent}`));
              }
            } else {
              // Cek apakah key adalah nested key di dalam key1
              let foundValue = null;
              for (const mainKey in database) {
                if (database[mainKey] && database[mainKey][key]) {
                  foundValue = database[mainKey][key];
                  break;
                }
              }

              if (foundValue) {
                // Jika key adalah nested key di dalam key1
                const newKey = foundValue.split(" ").slice(0, 5).join(" "); // Ambil 5 kata pertama sebagai key baru
                const getContent = `🔑 *${key}* = *${newKey}*`;
                msg.reply(addLeftBorder(`${getHeader}\n${getContent}`));
              } else {
                // Jika key tidak ditemukan
                const notFoundContent = `❌ *Key "${key}" tidak ditemukan.* 😅`;
                msg.reply(addLeftBorder(`${getHeader}\n${notFoundContent}`));
              }
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
> ^ <   ✨
`;

              // Daftar key dengan dekorasi
              let listMessage = "📜 *Daftar List :*\n";
              for (const key in database) {
                listMessage += `🔑 *${key}*\n`; // Hanya tampilkan key utama, tidak tampilkan nested key atau value
              }

              // Footer dengan dekorasi
              const footer = "✨ > dibuat oleh Justdhif ✨";

              // Gabungkan semua pesan
              const fullMessage = `${listHeader}\n${catArt}\n${listMessage}\n${footer}`;
              msg.reply(addLeftBorder(fullMessage));
            } else {
              const listContent = `❌ *Tidak ada data yang tersimpan.*`;
              msg.reply(addLeftBorder(`${listHeader}\n${listContent}`));
            }
            break;

          default:
            const defaultHeader = createHeader("Maaf");
            const defaultContent = `❌ *Maaf, aku tidak mengerti.* 😅 Coba ketik \`!menu\` untuk bantuan ya! 🫶`;
            msg.reply(addLeftBorder(`${defaultHeader}\n${defaultContent}`));
            break;
        }
      } else {
        // Bot sedang non-aktif
        const inactiveHeader = createHeader("Non-Aktif");
        const inactiveContent = `🔴 *Maaf, bot hanya aktif dari jam 6:00 sampai 22:00 WIB.* Silakan coba lagi nanti! 😊`;
        msg.reply(addLeftBorder(`${inactiveHeader}\n${inactiveContent}`));
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