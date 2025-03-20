require("dotenv").config();

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

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

// Import command handlers
const databaseCommands = require("./commands/databaseCommands");
const noteCommands = require("./commands/noteCommands");
const financeCommands = require("./commands/financeCommands");
const reminderCommands = require("./commands/reminderCommands");
const otherCommands = require("./commands/otherCommands");

// Import utils
const { getGreeting } = require("./utils/getGreeting");
const { createResponse } = require("./utils/createResponse");

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

// Ketika menerima pesan
client.on("message", async (msg) => {
  const chat = await msg.getChat();

  // Cek apakah pesan dimulai dengan "!"
  if (msg.body.startsWith("!") || !isNaN(msg.body.trim())) {
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
