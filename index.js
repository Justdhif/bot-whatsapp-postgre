require("dotenv").config();
const express = require("express");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Import command handlers
const databaseCommands = require("./commands/databaseCommands");
const noteCommands = require("./commands/noteCommands");
const financeCommands = require("./commands/financeCommands");
const otherCommands = require("./commands/otherCommands");
const userCommands = require("./commands/userCommands");
const todoCommands = require("./commands/todoCommands");

// Import utility functions
const {
  saveUser,
  handleGroupJoin,
  handleBotRemoved,
  handleGroupRejoin,
  handleNewChat,
} = require("./utils/chatUtils");

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

// Pada event handlers, ubah menjadi:
client.on("group_join", async (notification) => {
  const chat = await notification.getChat();
  await handleGroupJoin(client, chat.id._serialized, chat.name);
});

client.on("group_leave", async (notification) => {
  await handleBotRemoved(notification.id._serialized);
});

client.on("chat_new", (chat) => handleNewChat(client, chat));

// Command Handler
client.on("message", async (msg) => {
  try {
    // Simpan pengirim pesan ke database
    const sender = msg.from;
    if (!msg.from.includes("@g.us")) {
      await saveUser(sender);
    }

    // Lanjutkan dengan command handler yang sudah ada
    if (!msg.body.startsWith("!")) return;
    const args = msg.body.split(" ").slice(1);
    const command = msg.body.split(" ")[0];

    const commands = {
      // General Commands
      "!menu": () => otherCommands.handleMenuCommand(msg),
      "!help": () => otherCommands.handleHelpCommand(msg, args[0]),
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

      // User Commands
      "!username": () => userCommands.handleUsernameCommand(msg, args),
      "!deleteuser": () => userCommands.handleDeleteUserCommand(msg, args),
    };

    if (commands[command]) {
      commands[command]();
    } else {
      msg.reply(
        "❌ Perintah tidak dikenali. Ketik `!menu` untuk daftar perintah atau `!help` untuk bantuan."
      );
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

app.listen(port, () => {
  console.log(`[BOT] Bot berjalan di port ${port}.`);
});

// Start WhatsApp Client
async function startClient() {
  try {
    await client.initialize();
  } catch (error) {
    console.error("❌ Error saat menginisialisasi WhatsApp client:", error);
  }
}

startClient().catch((error) =>
  console.error("❌ Error saat memulai bot:", error)
);
