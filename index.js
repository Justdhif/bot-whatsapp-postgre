const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

require("dotenv").config();

// Inisialisasi client WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.SESSION_DIR || "./session",
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
  },
});

let qrCodeData = null;
let groupId = null; // Simpan ID grup di sini

// Import command handlers
const databaseCommands = require("./commands/databaseCommands");
const noteCommands = require("./commands/noteCommands");
const financeCommands = require("./commands/financeCommands");
const reminderCommands = require("./commands/reminderCommands");
const otherCommands = require("./commands/otherCommands");

// Import utils
const { getGreeting } = require("./utils/getGreeting");
const { createResponse } = require("./utils/createResponse");
const { getRandomQuote } = require("./utils/getRandomQuote");

// Fungsi untuk mengirim pesan ke grup
async function sendMessageToGroup(message) {
  if (groupId) {
    try {
      const chat = await client.getChatById(groupId);
      await chat.sendMessage(message);
      console.log("Pesan berhasil dikirim ke grup:", message);
    } catch (error) {
      console.error("Gagal mengirim pesan ke grup:", error);
    }
  } else {
    console.log("ID grup belum diset. Bot belum dimasukkan ke grup.");
  }
}

// Variabel untuk menandai apakah pesan aktif/non-aktif sudah dikirim
let activeMessageSent = false;
let inactiveMessageSent = false;

// Fungsi untuk memeriksa waktu dan mengirim pesan
function checkAndSendMessage() {
  const now = new Date();
  const utcHours = now.getUTCHours();
  let wibHours = utcHours + 7; // Konversi ke WIB (UTC+7)

  if (wibHours >= 24) wibHours -= 24;

  if (wibHours === 5 && !activeMessageSent) {
    const activeMessage = createActiveMessage();
    sendMessageToGroup(activeMessage);
    activeMessageSent = true;
    inactiveMessageSent = false; // Reset status pesan non-aktif
  } else if (wibHours === 22 && !inactiveMessageSent) {
    const quote = getRandomQuote();
    const inactiveMessage = createResponse(
      "BOT NON-AKTIF",
      `🔴 Bot sedang non-aktif. Jam operasional: 5:00 - 22:00 WIB.\n💬 *Quote Hari Ini:*\n"${quote}"`
    );
    sendMessageToGroup(inactiveMessage);
    inactiveMessageSent = true;
    activeMessageSent = false; // Reset status pesan aktif
  }

  console.log(`Waktu UTC: ${utcHours}:${now.getUTCMinutes()}`);
  console.log(`Waktu WIB: ${wibHours}:${now.getUTCMinutes()}`);
  return wibHours >= 5 && wibHours < 22; // Aktif dari jam 5:00 sampai 21:59 WIB
}

// Fungsi untuk membuat pesan bot aktif
function createActiveMessage() {
  const quote = getRandomQuote();
  return createResponse(
    "BOT AKTIF",
    `🟢 Bot sedang aktif! Jam operasional: 5:00 - 22:00 WIB.\n💬 *Quote Hari Ini:*\n"${quote}"\n\n📌 *Daftar Command Umum:*\n` +
      ` 📌 \`!menu\` - Menampilkan menu command\n` +
      ` 📌 \`!info\` - Info tentang bot\n` +
      ` 📌 \`!get <key>\` - Ambil data berdasarkan key\n` +
      ` 📌 \`!list\` - Daftar semua key yang tersimpan\n` +
      ` 📌 \`!balance\` - Lihat saldo keuangan\n` +
      ` 📌 \`!note\` - Daftar note yang tersimpan\n` +
      ` 📌 \`!feedback\` - Kirim feedback\n` +
      ` 📌 \`!setreminder\` - Atur reminder\n` +
      ` 📌 \`!viewreminders\` - Lihat daftar reminder`
  );
}

// Generate QR code untuk login
client.on("qr", (qr) => {
  console.log("QR code generated. Silakan scan di browser.");
  qrcode.generate(qr, { small: true });
  qrCodeData = qr;
});

// Ketika sudah terautentikasi
client.on("ready", () => {
  console.log("Client is ready!");
  qrCodeData = null;
});

// Ketika bot dimasukkan ke grup
client.on("group_join", (notification) => {
  groupId = notification.chatId; // Simpan ID grup
  console.log(`Bot dimasukkan ke group dengan ID: ${groupId}`);
});

// Ketika menerima pesan
client.on("message", async (msg) => {
  const chat = await msg.getChat();

  // Cek apakah pesan dimulai dengan "!"
  if (msg.body.startsWith("!") || !isNaN(msg.body.trim())) {
    if (checkAndSendMessage()) {
      const body = msg.body.trim();
      let command = body.split(" ")[0];
      const args = body.split(" ").slice(1);

      // Jika command adalah angka, ubah ke number
      if (!isNaN(command)) {
        command = parseInt(command, 10); // Ubah string ke number
      }

      // Tambahkan greeting berdasarkan waktu
      const greeting = getGreeting();

      switch (command) {
        case "!menu":
          otherCommands.handleMenuCommand(msg);
          break;

        case "!help":
          otherCommands.handleHelpCommand(msg);
          break;

        case "!set":
          databaseCommands.handleSetCommand(msg, args);
          break;

        case "!get":
          databaseCommands.handleGetCommand(msg, args);
          break;

        case "!edit":
          databaseCommands.handleEditCommand(msg, args);
          break;

        case "!delete":
          databaseCommands.handleDeleteCommand(msg, args);
          break;

        case 1:
        case "!list":
          databaseCommands.handleListCommand(msg);
          break;

        case "!setnote":
          noteCommands.handleSetNoteCommand(msg, args);
          break;

        case "!getnote":
          noteCommands.handleGetNoteCommand(msg, args);
          break;

        case "!editnote":
          noteCommands.handleEditNoteCommand(msg, args);
          break;

        case "!deletenote":
          noteCommands.handleDeleteNoteCommand(msg, args);
          break;

        case 2:
        case "!note":
          noteCommands.handleNoteCommand(msg);
          break;

        case "!income":
          financeCommands.handleIncomeCommand(msg, args);
          break;

        case "!expense":
          financeCommands.handleExpenseCommand(msg, args);
          break;

        case 3:
        case "!balance":
          financeCommands.handleBalanceCommand(msg);
          break;

        case "!report":
          financeCommands.handleReportCommand(msg);
          break;

        case "!deletefinance":
          financeCommands.handleDeleteFinanceCommand(msg);
          break;

        case "!remind":
          reminderCommands.handleRemindCommand(msg, args);
          break;

        case 4:
        case "!reminders":
          reminderCommands.handleRemindersCommand(msg);
          break;

        case "!deleteremind":
          reminderCommands.handleDeleteRemindCommand(msg, args);
          break;

        case "!info":
          otherCommands.handleInfoCommand(msg);
          break;

        case "!feedback":
          otherCommands.handleFeedbackCommand(msg);
          break;

        case "!resetall":
          otherCommands.handleResetAllCommand(msg);
          break;

        case "!editbot":
          editBotCommands.handleEditBotCommand(msg);
          break;

        case "!editname":
          editBotCommands.handleEditNameCommand(msg);
          break;

        case "!editbio":
          editBotCommands.handleEditBioCommand(msg);
          break;

        case "!editprofile":
          editBotCommands.handleEditProfilePictureCommand(msg);
          break;

        default:
          msg.reply(
            `${greeting}${createResponse(
              "DEFAULT",
              "❌ *Maaf, aku tidak mengerti.* Coba ketik `!menu` untuk bantuan ya! 🫶",
              true
            )}`
          );
          break;
      }
    } else {
      // Tambahkan greeting berdasarkan waktu
      const greeting = getGreeting();
      msg.reply(
        `${greeting}${createResponse(
          "INACTIVE",
          "🔴 *Maaf, bot hanya aktif dari jam 5:00 sampai 22:00 WIB.* Silakan coba lagi nanti! 😊",
          true
        )}`
      );
    }
  }
});

// Buat server web untuk menampilkan QR code
app.get("/", (req, res) => {
  if (!client.info) {
    if (qrCodeData) {
      res.send(`
        <h1>Scan QR Code untuk Login</h1>
        <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
          qrCodeData
        )}&size=300x300" alt="QR Code" />
        <p>Silakan buka WhatsApp di ponsel Anda, pilih "Linked Devices", dan scan QR code di atas.</p>
      `);
    } else {
      res.send(`
        <h1>Menunggu QR code...</h1>
        <p>Silakan tunggu sebentar, QR code akan segera muncul.</p>
      `);
    }
  } else {
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

// Jadwalkan pengecekan
setInterval(checkAndSendMessage, 50000); // 1 menit
