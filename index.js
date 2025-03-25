require("dotenv").config();
const express = require("express");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

// Import command handlers
const databaseCommands = require("./commands/databaseCommands");
const noteCommands = require("./commands/noteCommands");
const financeCommands = require("./commands/financeCommands");
const otherCommands = require("./commands/otherCommands");
const loginCommands = require("./commands/loginCommands");
const stickerCommands = require("./commands/stickerCommands");
const todoCommands = require("./commands/todoCommands");

// Setup Express server
const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = null;

// Initialize WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ["--no-sandbox", "--disable-setuid-sandbox"] },
});

// Handle QR Code
client.on("qr", (qr) => {
  console.log("[BOT] Scan QR Code untuk login:");
  qrcode.generate(qr, { small: true });
  qrCodeData = qr;
});

client.on("ready", () => {
  console.log("✅ WhatsApp client siap digunakan.");
  qrCodeData = null;
});

// Command Handler
client.on("message", async (msg) => {
  try {
    if (!msg.body.startsWith("!")) return;
    const args = msg.body.split(" ").slice(1);
    const command = msg.body.split(" ")[0];

    const commands = {
      // General Commands
      "!menu": () => otherCommands.handleMenuCommand(msg),
      "!help": () => otherCommands.handleHelpCommand(msg),
      "!info": () => otherCommands.handleInfoCommand(msg),
      "!feedback": () => otherCommands.handleFeedbackCommand(msg),
      "!Chacabot": () => otherCommands.handleSecretCommand(msg),
      "!resetall": () => otherCommands.handleResetAllCommand(msg),
      "!archive": () => otherCommands.handleArchiveCommand(msg),
      "!restore": () => otherCommands.handleRestoreCommand(msg, args),

      // Database Commands
      "!set": () => databaseCommands.handleSetCommand(msg, args),
      "!get": () => databaseCommands.handleGetCommand(msg, args),
      "!delete": () => databaseCommands.handleDeleteCommand(msg, args),
      "!list": () => databaseCommands.handleListCommand(msg),

      // Notes Commands
      "!setnote": () => noteCommands.handleSetNoteCommand(msg, args),
      "!getnote": () => noteCommands.handleGetNoteCommand(msg, args),
      "!deletenote": () => noteCommands.handleDeleteNoteCommand(msg, args),
      "!note": () => noteCommands.handleListNoteCommand(msg),

      // Finance Commands
      "!income": () => financeCommands.handleIncomeCommand(msg, args),
      "!expense": () => financeCommands.handleExpenseCommand(msg, args),
      "!balance": () => financeCommands.handleBalanceCommand(msg),
      "!report": () => financeCommands.handleReportCommand(msg),
      "!deletefinance": () => financeCommands.handleDeleteFinanceCommand(msg),

      // To-Do Commands
      "!todo": () => todoCommands.handleListTodoCommand(msg),
      "!addtodo": () => todoCommands.handleAddTodoCommand(msg, args),
      "!edittodo": () => todoCommands.handleEditTodoCommand(msg, args),
      "!donetodo": () => todoCommands.handleCompleteTodoCommand(msg, args),
      "!deletetodo": () => todoCommands.handleDeleteTodoCommand(msg, args),

      // Login Commands
      "!login": () => loginCommands.handleLoginCommand(msg),
      "!code": () => loginCommands.handleCodeCommand(msg, args),
      "!logout": () => loginCommands.handleLogoutCommand(msg),
      "!username": () => loginCommands.handleUsernameCommand(msg, args),
      "!listuser": () => loginCommands.handleListUserCommand(msg),
      "!deleteuser": () => loginCommands.handleDeleteUserCommand(msg, args),

      // Sticker Commands
      "!brat": () => stickerCommands.handleBratCommand(msg, args),
    };

    if (commands[command]) {
      commands[command]();
    } else {
      msg.reply("❌ Perintah tidak dikenali. Ketik `!menu` untuk daftar perintah atau `!help` untuk bantuan.");
    }
  } catch (error) {
    console.error("[ERROR] Gagal memproses pesan:", error);
    msg.reply("❌ Terjadi kesalahan saat memproses perintah.");
  }
});

// Express API Routes
app.get("/qr", (req, res) => {
  if (qrCodeData) {
    res.send(
      `<img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData)}&size=300x300" alt="QR Code untuk login ke WhatsApp">`
    );
  } else {
    res.send("✅ Bot sudah terhubung ke WhatsApp.");
  }
});

app.get("/", (req, res) => {
  res.send("JustBot is running!");
});

app.listen(port, () => {
  console.log(`[BOT] Bot berjalan di port ${port}.`);
});

// Start Express Server
// Initialize WhatsApp Client
async function startClient() {
  try {
    await client.initialize();
  } catch (error) {
    console.error("❌ Error saat menginisialisasi WhatsApp client:", error);
  }
}

startClient().catch((error) => console.error("❌ Error saat memulai bot:", error));
