require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");

const databaseCommands = require("./commands/databaseCommands");
const noteCommands = require("./commands/noteCommands");
const financeCommands = require("./commands/financeCommands");
const reminderCommands = require("./commands/reminderCommands");
const otherCommands = require("./commands/otherCommands");

const app = express();
const port = process.env.PORT || 3000;

let qrCodeData = null; // Menyimpan QR Code sementara untuk akses di browser

async function main() {
  const client = new Client({
    authStrategy: new LocalAuth(), // Gunakan penyimpanan sesi 
    puppeteer: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Hindari error root
    },
  });

  client.on("qr", async (qr) => {
    console.log("[BOT] Scan QR Code untuk login:");
    qrcode.generate(qr, { small: true });

    // Simpan QR Code sebagai string agar bisa diakses dari browser
    qrCodeData = qr;
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp client siap digunakan.");
    qrCodeData = null; // Hapus QR setelah login sukses
  });

  client.on("message", async (msg) => {
    try {
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
          databaseCommands.handleDeleteCommand(
            msg,
            msg.body.split(" ").slice(1)
          ),
        "!list": () => databaseCommands.handleListCommand(msg),
        "!setnote": () =>
          noteCommands.handleSetNoteCommand(msg, msg.body.split(" ").slice(1)),
        "!getnote": () =>
          noteCommands.handleGetNoteCommand(msg, msg.body.split(" ").slice(1)),
        "!editnote": () =>
          noteCommands.handleEditNoteCommand(msg, msg.body.split(" ").slice(1)),
        "!deletenote": () =>
          noteCommands.handleDeleteNoteCommand(
            msg,
            msg.body.split(" ").slice(1)
          ),
        "!income": () =>
          financeCommands.handleIncomeCommand(
            msg,
            msg.body.split(" ").slice(1)
          ),
        "!expense": () =>
          financeCommands.handleExpenseCommand(
            msg,
            msg.body.split(" ").slice(1)
          ),
        "!balance": () => financeCommands.handleBalanceCommand(msg),
        "!report": () => financeCommands.handleReportCommand(msg),
        "!deletefinance": () => financeCommands.handleDeleteFinanceCommand(msg),
        "!remind": () =>
          reminderCommands.handleRemindCommand(
            msg,
            msg.body.split(" ").slice(1)
          ),
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
    } catch (error) {
      console.error("[ERROR] Gagal memproses pesan:", error);
      msg.reply("❌ Terjadi kesalahan saat memproses perintah.");
    }
  });

  // Endpoint untuk mengakses QR Code di browser
  app.get("/qr", (req, res) => {
    if (qrCodeData) {
      res.send(
        `<img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
          qrCodeData
        )}&size=300x300" alt="QR Code untuk login ke WhatsApp">`
      );
    } else {
      res.send("✅ Bot sudah terhubung ke WhatsApp.");
    }
  });

  app.get("/", (req, res) => {
    res.send("JustBot is running!");
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
