const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const XLSX = require("xlsx");
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

// Database sederhana
const database = {};

// Database untuk keuangan
const financeDB = {
income: [],
expenses: [],
};

// Database untuk note
const noteDB = {};

// Database untuk reminder
const reminderDB = [];

// Daftar quotes acak
const quotes = [
"Hidup adalah perjalanan, bukan tujuan. - Ralph Waldo Emerson",
"Jangan menunggu kesempatan, ciptakanlah. - George Bernard Shaw",
"Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan. - Colin Powell",
"Jadilah perubahan yang ingin kamu lihat di dunia. - Mahatma Gandhi",
"Mimpi besar dan berani bermimpi. - Walt Disney",
"Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas. - Henry Ford",
"Jangan pernah menyerah, karena biasanya itu adalah langkah terakhir sebelum sukses. - Thomas Edison",
"Kamu tidak perlu melihat seluruh tangga, cukup ambil langkah pertama. - Martin Luther King Jr.",
"Hidup ini seperti mengendarai sepeda. Untuk menjaga keseimbangan, kamu harus terus bergerak. - Albert Einstein",
"Kesempatan tidak datang dua kali, tapi kesiapan selalu membawa keberuntungan. - Louis Pasteur",
];

// Fungsi untuk memilih quote acak
function getRandomQuote() {
const randomIndex = Math.floor(Math.random() \* quotes.length);
return quotes[randomIndex];
}

// Fungsi untuk menambahkan pemasukan
function addIncome(amount, description) {
financeDB.income.push({ amount, description, date: new Date() });
}

// Fungsi untuk menambahkan pengeluaran
function addExpense(amount, description) {
financeDB.expenses.push({ amount, description, date: new Date() });
}

// Fungsi untuk menghitung saldo
function calculateBalance() {
const totalIncome = financeDB.income.reduce(
(sum, item) => sum + item.amount,
0
);
const totalExpenses = financeDB.expenses.reduce(
(sum, item) => sum + item.amount,
0
);
return totalIncome - totalExpenses;
}

// Fungsi untuk membuat file Excel
function createExcelFile() {
const workbook = XLSX.utils.book_new();

// Sheet Income
const incomeSheet = XLSX.utils.json_to_sheet(financeDB.income);
XLSX.utils.book_append_sheet(workbook, incomeSheet, "Income");

// Sheet Expenses
const expensesSheet = XLSX.utils.json_to_sheet(financeDB.expenses);
XLSX.utils.book_append_sheet(workbook, expensesSheet, "Expenses");

// Simpan file Excel
const filePath = path.join(\_\_dirname, "finance_report.xlsx");
XLSX.writeFile(workbook, filePath);

return filePath;
}

// Fungsi untuk membuat laporan keuangan
function createFinanceReport() {
const totalIncome = financeDB.income.reduce(
(sum, item) => sum + item.amount,
0
);
const totalExpenses = financeDB.expenses.reduce(
(sum, item) => sum + item.amount,
0
);
const balance = totalIncome - totalExpenses;

const incomeDetails = financeDB.income
.map(
(item) =>
`│ 💵 *${item.amount}* - ${
          item.description
        } (${item.date.toLocaleDateString()})`
)
.join("\n");

const expenseDetails = financeDB.expenses
.map(
(item) =>
`│ 💸 *${item.amount}* - ${
          item.description
        } (${item.date.toLocaleDateString()})`
)
.join("\n");

const report = `╭────────────────🍂
│ 🔑 *LAPORAN KEUANGAN*
├──────── 🌸 ────────╮
│ 📊 *Total Pemasukan:* ${totalIncome}
${incomeDetails}
│
│ 📊 *Total Pengeluaran:* ${totalExpenses}
${expenseDetails}
│
│ 💰 *Saldo Saat Ini:* ${balance}
├──────── 🍃 ────────╯
│ 🎀💖 𝗧𝗲𝗿𝗶𝗺𝗮 𝗞𝗮𝘀𝗶𝗵 𝘀𝘂𝗱𝗮𝗵 𝗺𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗸𝗮𝗻 𝗹𝗮𝘆𝗮𝗻𝗮𝗻 𝗶𝗻𝗶! 💖🎀
█▀▀▀▀▀▀▀▀▀▀▀▀▀█`;

return report;
}

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
` 📌 \`!menu\` - Menampilkan menu command\n`+
     ` 📌 \`!info\` - Info tentang bot\n`+
     ` 📌 \`!get <key>\` - Ambil data berdasarkan key\n`+
     ` 📌 \`!list\` - Daftar semua key yang tersimpan\n`+
     ` 📌 \`!balance\` - Lihat saldo keuangan\n`+
     ` 📌 \`!note\` - Daftar note yang tersimpan\n`+
     ` 📌 \`!feedback\` - Kirim feedback\n`+
     ` 📌 \`!setreminder\` - Atur reminder\n`+
     ` 📌 \`!viewreminders\` - Lihat daftar reminder`
);
}

// Fungsi untuk mendapatkan greeting berdasarkan waktu
function getGreeting() {
const now = new Date();
const utcHours = now.getUTCHours();
let wibHours = utcHours + 7; // Konversi ke WIB (UTC+7)

if (wibHours >= 24) wibHours -= 24;

let greeting = "";

if (wibHours >= 5 && wibHours < 11) {
greeting = `🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗣𝗮𝗴𝗶! 🌷🌞\n`;
} else if (wibHours >= 11 && wibHours < 15) {
greeting = `🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗦𝗶𝗮𝗻𝗴! 🌷🌞\n`;
} else if (wibHours >= 15 && wibHours < 19) {
greeting = `🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗦𝗼𝗿𝗲! 🌷🌞\n`;
} else {
greeting = `🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗠𝗮𝗹𝗮𝗺! 🌷🌞\n`;
}

return greeting;
}

// Fungsi untuk mengecek reminder
function checkReminders() {
const now = new Date();
reminderDB.forEach((reminder, index) => {
const reminderTime = new Date(
reminder.year,
reminder.month - 1, // Bulan dimulai dari 0 (Januari = 0)
reminder.date,
reminder.hour,
reminder.minute
);

    // Hitung selisih waktu dalam milidetik
    const timeDiff = reminderTime - now;

    // Jika waktu reminder sudah lewat, hapus dari database
    if (timeDiff <= 0) {
      reminderDB.splice(index, 1);
      return;
    }

    const oneDayBefore = 86400000; // 1 hari dalam milidetik
    if (timeDiff <= oneDayBefore && !reminder.daysNotificationSent) {
      const notificationMessage = `⏰ *Reminder Notification (1 hari sebelumnya):*\n${
        reminder.message
      }\n\nWaktu reminder: ${reminderTime.toLocaleString()}`;
      if (reminder.chatId.startsWith("group")) {
        // Kirim notifikasi ke grup
        client.sendMessage(reminder.chatId, notificationMessage);
      } else {
        // Kirim notifikasi ke chat pribadi
        client.sendMessage(reminder.chatId, notificationMessage);
      }
      reminder.daysNotificationSent = true; // Tandai notifikasi 1 hari sebelumnya sudah dikirim
    }

    // Kirim notifikasi 1 jam sebelumnya
    const oneHourBefore = 3600000; // 1 jam dalam milidetik
    if (timeDiff <= oneHourBefore && !reminder.hoursNotificationSent) {
      const notificationMessage = `⏰ *Reminder Notification (1 jam sebelumnya):*\n${
        reminder.message
      }\n\nWaktu reminder: ${reminderTime.toLocaleString()}`;
      if (reminder.chatId.startsWith("group")) {
        // Kirim notifikasi ke grup
        client.sendMessage(reminder.chatId, notificationMessage);
      } else {
        // Kirim notifikasi ke chat pribadi
        client.sendMessage(reminder.chatId, notificationMessage);
      }
      reminder.hoursNotificationSent = true; // Tandai notifikasi 1 jam sebelumnya sudah dikirim
    }

});
}

// Jadwalkan pengecekan reminder setiap 1 menit
setInterval(checkReminders, 60000);

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
if (msg.body.startsWith("!")) {
if (checkAndSendMessage()) {
const body = msg.body.trim();
const command = body.split(" ")[0];
const args = body.split(" ").slice(1);

      // Tambahkan greeting berdasarkan waktu
      const greeting = getGreeting();

      switch (command) {
        case "!menu":
          const menuContent = createResponse(
            "MENU",
            `📌 *Command Database:*\n` +
              ` 🔑 \`!set <key>\` - Simpan data\n` +
              ` 🔑 \`!get <key>\` - Ambil data\n` +
              ` 🔑 \`!edit <key>\` - Edit data\n` +
              ` 🔑 \`!delete <key>\` - Hapus data\n` +
              ` 🔑 \`!list\` - Lihat semua data\n\n` +
              `📌 *Command Note:*\n` +
              ` 📝 \`!note\` - Lihat semua note\n` +
              ` 📝 \`!setnote <key>\` - Simpan note\n` +
              ` 📝 \`!getnote <key>\` - Ambil note\n` +
              ` 📝 \`!editnote <key>\` - Edit note\n` +
              ` 📝 \`!deletenote <key>\` - Hapus note\n\n` +
              `📌 *Command Keuangan:*\n` +
              ` 💰 \`!income <jumlah> <deskripsi>\` - Tambah pemasukan\n` +
              ` 💰 \`!expense <jumlah> <deskripsi>\` - Tambah pengeluaran\n` +
              ` 💰 \`!balance\` - Lihat saldo\n` +
              ` 💰 \`!report\` - Unduh laporan keuangan\n` +
              ` 💰 \`!deletefinance <income/expense> <index>\` - Hapus data keuangan\n\n` +
              `📌 *Command Reminder:*\n` +
              ` ⏰ \`!remind <tanggal> <bulan> <tahun> <jam> <menit> <pesan>\` - Atur reminder\n` +
              ` ⏰ \`!reminders\` - Lihat daftar reminder\n` +
              ` ⏰ \`!deletereminder <ID>\` - Hapus reminder\n\n` +
              `📌 *Lainnya:*\n` +
              ` ℹ️ \`!info\` - Info bot\n` +
              ` 📤 \`!feedback\` - Kirim feedback\n` +
              ` 🗑️ \`!resetall\` - Reset semua data`
          );
          msg.reply(`${greeting}${menuContent}`);
          break;

        case "!set":
          if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const value = quotedMsg.body;
            const key = args[0] ? args[0].trim() : null; // Ambil elemen pertama dan trim
            if (key) {
              database[key] = value;
              msg.reply(
                `${greeting}${createResponse(
                  "SET",
                  `🔑 *${key}* = *${value}* 🎉`
                )}`
              );
            } else {
              msg.reply(
                `${greeting}${createResponse(
                  "SET",
                  "❌ *Format salah!* Gunakan: `!set <key>` dan reply pesan untuk value. 😊",
                  true
                )}`
              );
            }
          } else {
            msg.reply(
              `${greeting}${createResponse(
                "SET",
                "❌ *Silakan reply pesan untuk menyimpan value.* 😊",
                true
              )}`
            );
          }
          break;

        case "!get":
          const key = args[0] ? args[0].trim() : null; // Ambil elemen pertama dan trim
          if (key && database[key]) {
            msg.reply(
              `${greeting}${createResponse(
                "GET",
                `🔑 *${key}* = *${database[key]}*`
              )}`
            );
          } else {
            msg.reply(
              `${greeting}${createResponse(
                "GET",
                `❌ *Key "${key}" tidak ditemukan.*`,
                true
              )}`
            );
          }
          break;

        case "!edit":
          if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const value = quotedMsg.body;
            const key = args[0] ? args[0].trim() : null; // Ambil elemen pertama dan trim
            if (key && database[key]) {
              database[key] = value;
              msg.reply(
                `${greeting}${createResponse(
                  "EDIT",
                  `🔑 *${key}* = *${value}* 🎉`
                )}`
              );
            } else {
              msg.reply(
                `${greeting}${createResponse(
                  "EDIT",
                  `❌ *Key "${key}" tidak ditemukan.*`,
                  true
                )}`
              );
            }
          } else {
            msg.reply(
              `${greeting}${createResponse(
                "EDIT",
                "❌ *Silakan reply pesan untuk mengedit value.* 😊",
                true
              )}`
            );
          }
          break;

        case "!delete":
          const keyToDelete = args[0] ? args[0].trim() : null; // Ambil elemen pertama dan trim
          if (keyToDelete && database[keyToDelete]) {
            delete database[keyToDelete];
            msg.reply(
              `${greeting}${createResponse(
                "DELETE",
                `🗑️ *Key "${keyToDelete}" berhasil dihapus!* ✨`
              )}`
            );
          } else {
            msg.reply(
              `${greeting}${createResponse(
                "DELETE",
                `❌ *Key "${keyToDelete}" tidak ditemukan.*`,
                true
              )}`
            );
          }
          break;

        case "!list":
          const keys = Object.keys(database);
          const listMessage =
            keys.length > 0
              ? `📜 *Daftar Data:*\n${keys
                  .map((key) => `🔑 *${key}*`)
                  .join("\n")}`
              : `❌ *Tidak ada data yang tersimpan.*`;
          msg.reply(`${greeting}${createResponse("LIST", listMessage)}`);
          break;

        case "!setnote":
          if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const value = quotedMsg.body;
            const key = args[0] ? args[0].trim() : null; // Ambil elemen pertama dan trim
            if (key) {
              noteDB[key] = value;
              msg.reply(
                `${greeting}${createResponse(
                  "SET NOTE",
                  `📝 *${key}* berhasil disimpan di note! 🎉`
                )}`
              );
            } else {
              msg.reply(
                `${greeting}${createResponse(
                  "SET NOTE",
                  "❌ *Format salah!* Gunakan: `!setnote <key>` dan reply pesan untuk value. 😊",
                  true
                )}`
              );
            }
          } else {
            msg.reply(
              `${greeting}${createResponse(
                "SET NOTE",
                "❌ *Silakan reply pesan untuk menyimpan value.* 😊",
                true
              )}`
            );
          }
          break;

        case "!getnote":
          const noteKey = args[0] ? args[0].trim() : null; // Ambil elemen pertama dan trim
          if (noteKey && noteDB[noteKey]) {
            msg.reply(
              `${greeting}${createResponse(
                "GET NOTE",
                `📝 *${noteKey}* = *${noteDB[noteKey]}*`
              )}`
            );
          } else {
            msg.reply(
              `${greeting}${createResponse(
                "GET NOTE",
                `❌ *Note "${noteKey}" tidak ditemukan.*`,
                true
              )}`
            );
          }
          break;

        case "!editnote":
          if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const value = quotedMsg.body;
            const noteKeyToEdit = args[0] ? args[0].trim() : null; // Ambil elemen pertama dan trim
            if (noteKeyToEdit && noteDB[noteKeyToEdit]) {
              noteDB[noteKeyToEdit] = value;
              msg.reply(
                `${greeting}${createResponse(
                  "EDIT NOTE",
                  `📝 *${noteKeyToEdit}* berhasil diubah menjadi: *${value}* 🎉`
                )}`
              );
            } else {
              msg.reply(
                `${greeting}${createResponse(
                  "EDIT NOTE",
                  `❌ *Note "${noteKeyToEdit}" tidak ditemukan.*`,
                  true
                )}`
              );
            }
          } else {
            msg.reply(
              `${greeting}${createResponse(
                "EDIT NOTE",
                "❌ *Silakan reply pesan untuk mengedit value.* 😊",
                true
              )}`
            );
          }
          break;

        case "!deletenote":
          const noteKeyToDelete = args[0] ? args[0].trim() : null; // Ambil elemen pertama dan trim
          if (noteKeyToDelete && noteDB[noteKeyToDelete]) {
            delete noteDB[noteKeyToDelete];
            msg.reply(
              `${greeting}${createResponse(
                "DELETE NOTE",
                `🗑️ *Note "${noteKeyToDelete}" berhasil dihapus!* ✨`
              )}`
            );
          } else {
            msg.reply(
              `${greeting}${createResponse(
                "DELETE NOTE",
                `❌ *Note "${noteKeyToDelete}" tidak ditemukan.*`,
                true
              )}`
            );
          }
          break;

        case "!note":
          const noteKeys = Object.keys(noteDB);
          const noteListMessage =
            noteKeys.length > 0
              ? `📜 *Daftar Note:*\n${noteKeys
                  .map((key) => `📝 *${key}*`)
                  .join("\n")}`
              : `❌ *Tidak ada note yang tersimpan.*`;
          msg.reply(`${greeting}${createResponse("NOTE", noteListMessage)}`);
          break;

        case "!income":
          if (chat.isGroup) {
            msg.reply(
              `${greeting}${createResponse(
                "INCOME",
                "❌ *Perintah ini hanya bisa digunakan di chat pribadi.* 😊",
                true
              )}`
            );
          } else {
            const [amount, ...description] = args[0]
              ? args[0].split(" ")
              : null;
            if (!amount || isNaN(amount)) {
              msg.reply(
                `${greeting}${createResponse(
                  "INCOME",
                  "❌ *Format salah!* Gunakan: `!income <jumlah> <deskripsi>`. 😊",
                  true
                )}`
              );
            } else {
              addIncome(parseFloat(amount), description.join(" "));
              msg.reply(
                `${greeting}✅ Pemasukan sebesar *${amount}* telah ditambahkan.`
              );
            }
          }
          break;

        case "!expense":
          if (chat.isGroup) {
            msg.reply(
              `${greeting}${createResponse(
                "EXPENSE",
                "❌ *Perintah ini hanya bisa digunakan di chat pribadi.* 😊",
                true
              )}`
            );
          } else {
            const [amount, ...description] = args[0].split(" ");
            if (!amount || isNaN(amount)) {
              msg.reply(
                `${greeting}${createResponse(
                  "EXPENSE",
                  "❌ *Format salah!* Gunakan: `!expense <jumlah> <deskripsi>`. 😊",
                  true
                )}`
              );
            } else {
              addExpense(parseFloat(amount), description.join(" "));
              msg.reply(
                `${greeting}✅ Pengeluaran sebesar *${amount}* telah ditambahkan.`
              );
            }
          }
          break;

        case "!balance":
          const balance = calculateBalance();
          msg.reply(`${greeting}💰 Saldo saat ini: *${balance}*`);
          break;

        case "!report":
          if (chat.isGroup) {
            msg.reply(
              `${greeting}${createResponse(
                "REPORT",
                "❌ *Perintah ini hanya bisa digunakan di chat pribadi.* 😊",
                true
              )}`
            );
          } else {
            const filePath = createExcelFile();
            const media = MessageMedia.fromFilePath(filePath);
            msg.reply(media, null, {
              caption: `${greeting}📊 Laporan keuangan telah diunduh.`,
            });
          }
          break;

        case "!deletefinance":
          financeDB.income = []; // Hapus semua pemasukan
          financeDB.expenses = []; // Hapus semua pengeluaran
          msg.reply(
            `${greeting}${createResponse(
              "DELETE FINANCE",
              "🗑️ *Semua data keuangan (income dan expense) berhasil dihapus! Saldo sekarang: 0.* ✨"
            )}`
          );
          break;

        case "!remind":
          if (args.length < 6) {
            msg.reply(
              `${greeting}${createResponse(
                "REMIND",
                "❌ *Format salah!* Gunakan: `!remind <tanggal> <bulan> <tahun> <jam> <menit> <pesan>`. 😊",
                true
              )}`
            );
          } else {
            const [date, month, year, hour, minute, ...messageParts] = args;
            const message = messageParts.join(" ");
            const reminder = setReminder(
              date,
              month,
              year,
              hour,
              minute,
              message,
              chat.id._serialized
            );
            msg.reply(`${greeting}${createResponse("REMIND", reminder)}`);
          }
          break;

        case "!reminders":
          const reminders = viewReminders();
          msg.reply(`${greeting}${createResponse("REMINDERS", reminders)}`);
          break;

        case "!deleteremind":
          const reminderMessage = args.join(" "); // Gabungkan semua argumen sebagai pesan/nama reminder
          if (!reminderMessage) {
            msg.reply(
              `${greeting}${createResponse(
                "DELETE REMIND",
                "❌ *Format salah!* Gunakan: `!deleteremind <pesan/nama reminder>`.",
                true
              )}`
            );
            break;
          }

          const reminderIndex = reminderDB.findIndex(
            (reminder) =>
              reminder.message.toLowerCase() === reminderMessage.toLowerCase()
          );

          if (reminderIndex === -1) {
            msg.reply(
              `${greeting}${createResponse(
                "DELETE REMIND",
                `❌ *Reminder dengan pesan/nama "${reminderMessage}" tidak ditemukan.*`,
                true
              )}`
            );
          } else {
            const deletedReminder = reminderDB.splice(reminderIndex, 1)[0];
            msg.reply(
              `${greeting}${createResponse(
                "DELETE REMIND",
                `🗑️ *Reminder berhasil dihapus!*\n` +
                  `⏰ Waktu: *${new Date(
                    deletedReminder.year,
                    deletedReminder.month - 1,
                    deletedReminder.date,
                    deletedReminder.hour,
                    deletedReminder.minute
                  ).toLocaleString()}*\n` +
                  `📝 Pesan: *${deletedReminder.message}*`
              )}`
            );
          }
          break;

        case "!info":
          const infoContent = createResponse(
            "INFO",
            `🤖 Hai perkenalkan aku adalah JustBot yang dirancang untuk kebutuhan MPK OSIS.\n` +
              `Aku berfungsi untuk menyimpan segala keperluan mulai dari jobdesk setiap event, catatan hasil eval, dan lain-lain.\n` +
              `Kalian bisa ketik \`!menu\` untuk melihat detailnya.\n` +
              `Jam kerja bot sudah diatur mulai dari jam 5.00 sampai 10.00 WIB.\n` +
              `Selamat mencoba! ✨`
          );
          msg.reply(`${greeting}${infoContent}`);
          break;

        case "!feedback":
          const googleFormLink = "https://bot-advice.netlify.app/";
          msg.reply(
            `${greeting}${createResponse(
              "FEEDBACK",
              `📝 *Terima kasih atas ketertarikan Anda memberikan feedback!*\n\n` +
                `Silakan isi formulir di sini untuk memberikan saran atau masukan:\n${googleFormLink}`
            )}`
          );
          break;

        case "!resetall":
          // Hapus semua data
          Object.keys(database).forEach((key) => delete database[key]);
          Object.keys(noteDB).forEach((key) => delete noteDB[key]);
          financeDB.income = [];
          financeDB.expenses = [];
          reminderDB.length = 0;

          msg.reply(
            `${greeting}${createResponse(
              "RESET ALL",
              "🗑️ *Semua data (database, note, keuangan, dan reminder) berhasil direset!* ✨"
            )}`
          );
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

function createResponse(title, content, isError = false) {
const lines = content.split("\n");
const formattedContent = lines.map((line) => `│ ${line}`).join("\n");

return `╭────────────────🍂
│ 🔑 *${title}*
├──────── 🌸 ────────╮
${formattedContent}
├──────── 🍃 ────────╯
│ 🎀💖 𝗧𝗲𝗿𝗶𝗺𝗮 𝗞𝗮𝘀𝗶𝗵 𝘀𝘂𝗱𝗮𝗵 𝗺𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗸𝗮𝗻 𝗹𝗮𝘆𝗮𝗻𝗮𝗻 𝗶𝗻𝗶! 💖🎀
█▀▀▀▀▀▀▀▀▀▀▀▀▀█`;
}

// Buat server web untuk menampilkan QR code
app.get("/", (req, res) => {
if (!client.info) {
if (qrCodeData) {
res.send(`  <h1>Scan QR Code untuk Login</h1>
        <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
          qrCodeData
        )}&size=300x300" alt="QR Code" />
        <p>Silakan buka WhatsApp di ponsel Anda, pilih "Linked Devices", dan scan QR code di atas.</p>`);
} else {
res.send(`  <h1>Menunggu QR code...</h1>
        <p>Silakan tunggu sebentar, QR code akan segera muncul.</p>`);
}
} else {
res.send(`  <h1>Bot sudah terautentikasi!</h1>
      <p>Tidak perlu scan QR code lagi. Bot sedang berjalan.</p>`);
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
