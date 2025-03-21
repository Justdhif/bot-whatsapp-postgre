require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const puppeteer = require("puppeteer");
const express = require("express");
const PostgresAuth = require("./auth/PostgresAuth");
const qrcode = require("qrcode");

const app = express();
const port = process.env.PORT || 3000;

const databaseCommands = require("./commands/databaseCommands");
const noteCommands = require("./commands/noteCommands");
const financeCommands = require("./commands/financeCommands");
const reminderCommands = require("./commands/reminderCommands");
const otherCommands = require("./commands/otherCommands");

async function main() {
  const sessionId = "my-session-id";
  let qrCodeData = null;

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: "/tmp/.wwebjs_auth", // Gunakan /tmp untuk session agar bisa di Vercel
    }),
    puppeteer: {
      executablePath: puppeteer.executablePath(),
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

  client.on("qr", async (qr) => {
    console.log("QR code generated. Silakan scan di browser.");
    qrCodeData = await qrcode.toDataURL(qr);
  });

  client.on("ready", () => {
    qrCodeData = null;
    console.log("✅ WhatsApp client siap digunakan.");
  });

  client.on("message", async (msg) => {
    const commands = {
      "!menu": () => otherCommands.handleMenuCommand(msg),
      "!help": () => otherCommands.handleHelpCommand(msg),
      "!set": () =>
        databaseCommands.handleSetCommand(msg, msg.body.split(" ").slice(1)),
      "!get": () =>
        databaseCommands.handleGetCommand(msg, msg.body.split(" ").slice(1)),
      "!edit": () =>
        databaseCommands.handleEditCommand(msg, msg.body.split(" ").slice(1)),
      "!delete": () =>
        databaseCommands.handleDeleteCommand(msg, msg.body.split(" ").slice(1)),
      "!list": () => databaseCommands.handleListCommand(msg),
      "!setnote": () =>
        noteCommands.handleSetNoteCommand(msg, msg.body.split(" ").slice(1)),
      "!getnote": () =>
        noteCommands.handleGetNoteCommand(msg, msg.body.split(" ").slice(1)),
      "!editnote": () =>
        noteCommands.handleEditNoteCommand(msg, msg.body.split(" ").slice(1)),
      "!deletenote": () =>
        noteCommands.handleDeleteNoteCommand(msg, msg.body.split(" ").slice(1)),
      "!income": () =>
        financeCommands.handleIncomeCommand(msg, msg.body.split(" ").slice(1)),
      "!expense": () =>
        financeCommands.handleExpenseCommand(msg, msg.body.split(" ").slice(1)),
      "!balance": () => financeCommands.handleBalanceCommand(msg),
      "!report": () => financeCommands.handleReportCommand(msg),
      "!deletefinance": () => financeCommands.handleDeleteFinanceCommand(msg),
      "!remind": () =>
        reminderCommands.handleRemindCommand(msg, msg.body.split(" ").slice(1)),
      "!reminders": () => reminderCommands.handleRemindersCommand(msg),
      "!deleteremind": () =>
        reminderCommands.handleDeleteRemindCommand(
          msg,
          msg.body.split(" ").slice(1)
        ),
      "!info": () => otherCommands.handleInfoCommand(msg),
      "!feedback": () => otherCommands.handleFeedbackCommand(msg),
      "!resetall": () => otherCommands.handleResetAllCommand(msg),
    };

    const command = msg.body.split(" ")[0];
    if (commands[command]) {
      commands[command]();
    } else {
      msg.reply(
        "❌ Perintah tidak dikenali. Ketik `!menu` untuk daftar perintah."
      );
    }
  });

  app.get("/qr-code", (req, res) => {
    if (!client.info?.wid && qrCodeData) {
      res.send(
        `<h1>Scan QR Code untuk Login</h1><img src="${qrCodeData}" alt="QR Code" />`
      );
    } else {
      res.send("<h1>Bot sudah terhubung!</h1>");
    }
  });

  app.listen(port, () =>
    console.log(`🚀 Server berjalan di http://localhost:${port}`)
  );

  try {
    await client.initialize();
  } catch (error) {
    console.error("❌ Error saat menginisialisasi WhatsApp client:", error);
  }
}

main().catch((error) => console.error("❌ Error saat memulai bot:", error));
