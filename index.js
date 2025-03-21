require("dotenv").config();

const { Client, MessageMedia } = require("whatsapp-web.js");
const chromium = require("@sparticuz/chromium");
const qrcode = require("qrcode-terminal");
const express = require("express");
const PostgresAuth = require("./auth/PostgresAuth"); // Import strategi kustom

const app = express();
const port = process.env.PORT || 3000;

// Fungsi utama yang dijalankan secara async
async function main() {
  const sessionId = "my-session-id"; // ID session yang unik

  // Inisialisasi client WhatsApp dengan PostgresAuth
  const client = new Client({
    authStrategy: new PostgresAuth(sessionId), // Gunakan PostgresAuth
    puppeteer: {
      executablePath: await chromium.executablePath(), // Gunakan Chromium dari @sparticuz/chromium
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
    qrcode.generate(qr, { small: true }); // Tampilkan QR code di terminal
    qrCodeData = qr; // Simpan data QR code
    console.log("QR Code Data:", qr); // Log data QR code
  });

  // Ketika sudah terautentikasi
  client.on("ready", () => {
    console.log("Client is ready!");
    qrCodeData = null;
    client.authStrategy.saveSession(client.session); // Simpan session ke PostgreSQL
  });

  client.on("auth_failure", (msg) => {
    console.error("Authentication failed:", msg);
  });

  client.on("disconnected", (reason) => {
    console.log("Client was logged out:", reason);
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
    console.log("QR Code Data saat diakses:", qrCodeData); // Log nilai qrCodeData
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
          <p>Jika QR code tidak muncul dalam beberapa menit, coba refresh halaman ini.</p>
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
  client
    .initialize()
    .then(() => {
      console.log("WhatsApp client initialized successfully.");
    })
    .catch((error) => {
      console.error("Error initializing WhatsApp client:", error);
    });
}

// Jalankan fungsi utama
main().catch((error) => {
  console.error("Error starting the bot:", error);
});
