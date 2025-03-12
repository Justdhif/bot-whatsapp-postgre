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
  const randomIndex = Math.floor(Math.random() * quotes.length);
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
  const filePath = path.join(__dirname, "finance_report.xlsx");
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

  const report = `
╭────────────────🍂
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
█▀▀▀▀▀▀▀▀▀▀▀▀▀█
`;

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
    const quote = getRandomQuote();
    const activeMessage = createResponse(
      "BOT AKTIF",
      `🟢 Bot sedang aktif! Jam operasional: 5:00 - 22:00 WIB.\n💬 *Quote Hari Ini:*\n"${quote}"\n\n📌 *Daftar Command Umum:*\n` +
        `│ 📌 \`!menu\` - Menampilkan menu command\n` +
        `│ 📌 \`!info\` - Info tentang bot\n` +
        `│ 📌 \`!get <key>\` - Ambil data berdasarkan key\n` +
        `│ 📌 \`!list\` - Daftar semua key yang tersimpan\n` +
        `│ 📌 \`!balance\` - Lihat saldo keuangan\n` +
        `│ 📌 \`!note\` - Daftar note yang tersimpan\n\n` +
        `🎀💖 𝗧𝗲𝗿𝗶𝗺𝗮 𝗸𝗮𝘀𝗶𝗵 𝘀𝘂𝗱𝗮𝗵 𝗺𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗸𝗮𝗻 𝗹𝗮𝘆𝗮𝗻𝗮𝗻 𝗶𝗻𝗶! 💖🎀`
    );
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

// Fungsi untuk mendapatkan greeting berdasarkan waktu
function getGreeting(senderNumber) {
  const now = new Date();
  const utcHours = now.getUTCHours();
  let wibHours = utcHours + 7; // Konversi ke WIB (UTC+7)

  if (wibHours >= 24) wibHours -= 24;

  let greeting = "";

  if (wibHours >= 5 && wibHours < 11) {
    greeting = `🌷🌞 ｡･ﾟﾟ･ 𝗛𝗮𝗶 @${senderNumber}, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗣𝗮𝗴𝗶! ･ﾟﾟ･｡ 🌷🌞\n`;
  } else if (wibHours >= 11 && wibHours < 15) {
    greeting = `🌷🌞 ｡･ﾟﾟ･ 𝗛𝗮𝗶 @${senderNumber}, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗦𝗶𝗮𝗻𝗴! ･ﾟﾟ･｡ 🌷🌞\n`;
  } else if (wibHours >= 15 && wibHours < 19) {
    greeting = `🌷🌞 ｡･ﾟﾟ･ 𝗛𝗮𝗶 @${senderNumber}, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗦𝗼𝗿𝗲! ･ﾟﾟ･｡ 🌷🌞\n`;
  } else {
    greeting = `🌷🌞 ｡･ﾟﾟ･ 𝗛𝗮𝗶 @${senderNumber}, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗠𝗮𝗹𝗮𝗺! ･ﾟﾟ･｡ 🌷🌞\n`;
  }

  return greeting;
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
  const mentionedIds = await msg.getMentions();

  // Cek apakah pesan ditujukan ke bot (ditag)
  const isBotMentioned = mentionedIds.some(
    (mention) => mention.id._serialized === client.info.wid._serialized
  );

  if (isBotMentioned || !chat.isGroup) {
    const body = msg.body.replace(`@${client.info.wid.user}`, "").trim();

    // Cek jika pesan diawali dengan tanda seru (!)
    if (body.startsWith("!")) {
      if (checkAndSendMessage()) {
        const command = body.split(" ")[0];
        const args = body.split(" ").slice(1).join(" ");

        // Ambil nomor pengguna yang mengirim pesan
        const senderNumber = chat.isGroup
          ? msg.author || msg.from.split("@")[0] // Gunakan msg.author untuk grup
          : msg.from.split("@")[0]; // Gunakan msg.from untuk chat pribadi

        // Tambahkan greeting berdasarkan waktu
        const greeting = getGreeting(senderNumber);

        switch (command) {
          case "!set":
            if (msg.hasQuotedMsg) {
              const quotedMsg = await msg.getQuotedMessage();
              const value = quotedMsg.body;
              const keys = args.split(" in ");

              if (keys.length === 2 && keys[1].trim() === "note") {
                const key = keys[0].trim(); // Ambil key dari args
                noteDB[key] = value; // Simpan value ke dalam noteDB
                msg.reply(
                  `${greeting}${createResponse(
                    "SET NOTE",
                    `📝 *${key}* berhasil disimpan di note! 🎉`
                  )}`
                );
              } else {
                // Logika untuk menyimpan ke database biasa
                const key = args.trim();
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
                      "❌ *Format salah!* Gunakan: `!set <key>` atau `!set <key> in note` dan reply pesan untuk value. 😊",
                      true
                    )}`
                  );
                }
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

          case "!edit":
            if (msg.hasQuotedMsg) {
              const quotedMsg = await msg.getQuotedMessage();
              const value = quotedMsg.body;
              const key = args.trim(); // Ambil key dari args

              if (key && database[key]) {
                database[key] = value; // Update value dari key
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
            const deleteArgs = args.split(" from ");
            const keyToDelete = deleteArgs[0].trim();
            const deleteFrom = deleteArgs[1] ? deleteArgs[1].trim() : null;

            if (keyToDelete === "list") {
              // Hapus semua key di database biasa
              Object.keys(database).forEach((key) => delete database[key]);
              msg.reply(
                `${greeting}${createResponse(
                  "DELETE LIST",
                  "🗑️ *Semua key di list berhasil dihapus!* ✨"
                )}`
              );
            } else if (keyToDelete === "note") {
              // Hapus semua key di noteDB
              Object.keys(noteDB).forEach((key) => delete noteDB[key]);
              msg.reply(
                `${greeting}${createResponse(
                  "DELETE NOTE",
                  "🗑️ *Semua key di note berhasil dihapus!* ✨"
                )}`
              );
            } else if (keyToDelete === "all") {
              // Hapus semua data di database biasa dan noteDB
              Object.keys(database).forEach((key) => delete database[key]);
              Object.keys(noteDB).forEach((key) => delete noteDB[key]);
              msg.reply(
                `${greeting}${createResponse(
                  "DELETE ALL",
                  "🗑️ *Semua data di list dan note berhasil dihapus!* ✨"
                )}`
              );
            } else if (deleteFrom === "note") {
              // Hapus key tertentu dari noteDB
              if (noteDB[keyToDelete]) {
                delete noteDB[keyToDelete];
                msg.reply(
                  `${greeting}${createResponse(
                    "DELETE NOTE",
                    `🗑️ *Key "${keyToDelete}" di note berhasil dihapus!* ✨`
                  )}`
                );
              } else {
                msg.reply(
                  `${greeting}${createResponse(
                    "DELETE NOTE",
                    `❌ *Key "${keyToDelete}" tidak ditemukan di note.*`,
                    true
                  )}`
                );
              }
            } else {
              // Hapus key tertentu dari database biasa
              if (database[keyToDelete]) {
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
            }
            break;

          case "!addincome":
            if (chat.isGroup) {
              msg.reply(
                `${greeting}${createResponse(
                  "ADD INCOME",
                  "❌ *Perintah ini hanya bisa digunakan di chat pribadi.* 😊",
                  true
                )}`
              );
            } else {
              const [incomeAmount, ...incomeDescription] = args.split(" ");
              if (!incomeAmount || isNaN(incomeAmount)) {
                msg.reply(
                  `${greeting}${createResponse(
                    "ADD INCOME",
                    "❌ *Format salah!* Gunakan: `!addincome <jumlah> <deskripsi>`. 😊",
                    true
                  )}`
                );
              } else {
                addIncome(
                  parseFloat(incomeAmount),
                  incomeDescription.join(" ")
                );
                msg.reply(
                  `${greeting}✅ Pemasukan sebesar *${incomeAmount}* telah ditambahkan.`
                );
              }
            }
            break;

          case "!addexpense":
            if (chat.isGroup) {
              msg.reply(
                `${greeting}${createResponse(
                  "ADD EXPENSE",
                  "❌ *Perintah ini hanya bisa digunakan di chat pribadi.* 😊",
                  true
                )}`
              );
            } else {
              const [expenseAmount, ...expenseDescription] = args.split(" ");
              if (!expenseAmount || isNaN(expenseAmount)) {
                msg.reply(
                  `${greeting}${createResponse(
                    "ADD EXPENSE",
                    "❌ *Format salah!* Gunakan: `!addexpense <jumlah> <deskripsi>`. 😊",
                    true
                  )}`
                );
              } else {
                addExpense(
                  parseFloat(expenseAmount),
                  expenseDescription.join(" ")
                );
                msg.reply(
                  `${greeting}✅ Pengeluaran sebesar *${expenseAmount}* telah ditambahkan.`
                );
              }
            }
            break;

          case "!downloadfinance":
            if (chat.isGroup) {
              msg.reply(
                `${greeting}${createResponse(
                  "DOWNLOAD FINANCE",
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

          case "!reset":
            if (args === "finance") {
              financeDB.income = [];
              financeDB.expenses = [];
              msg.reply(
                `${greeting}${createResponse(
                  "RESET FINANCE",
                  "💰 *Data keuangan berhasil direset!* ✨"
                )}`
              );
            } else {
              msg.reply(
                `${greeting}${createResponse(
                  "RESET",
                  "❌ *Format salah!* Gunakan: `!reset finance`.",
                  true
                )}`
              );
            }
            break;

          case "!menu":
            const menuContent = createResponse(
              "MENU",
              `📌 \`*!info*\` - Info bot\n\n📌 \`*!get <key>*\` - Ambil data key\n\n📌 \`*!list*\` - Daftar key\n\n📌 \`*!balance*\` - Lihat saldo\n\n📌 \`*!note*\` - Daftar note`
            );
            msg.reply(`${greeting}${menuContent}`);
            break;

          // Tambahkan command !note
          case "!note":
            if (Object.keys(noteDB).length > 0) {
              let noteMessage = `📜 *Daftar Note :*\n`;
              for (const key in noteDB) {
                noteMessage += `│ 📝 *${key}*\n`;
              }
              msg.reply(`${greeting}${createResponse("NOTE", noteMessage)}`);
            } else {
              msg.reply(
                `${greeting}${createResponse(
                  "NOTE",
                  "❌ *Tidak ada note yang tersimpan.*",
                  true
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

          case "!get":
            const getArgs = args.split(" from ");
            const key = getArgs[0].trim();
            const parentKey = getArgs[1] ? getArgs[1].trim() : null;

            if (parentKey === "note") {
              if (noteDB[key]) {
                msg.reply(
                  `${greeting}${createResponse(
                    "GET NOTE",
                    `📝 *${key}* = *${noteDB[key]}*`
                  )}`
                );
              } else {
                msg.reply(
                  `${greeting}${createResponse(
                    "GET NOTE",
                    `❌ *Note "${key}" tidak ditemukan.*`,
                    true
                  )}`
                );
              }
            } else {
              // Logika untuk mengambil data dari database biasa
              if (database[key]) {
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
            }
            break;

          case "!list":
            let listMessage = "";

            // Tampilkan daftar dari database biasa
            if (Object.keys(database).length > 0) {
              listMessage += `📜 *Daftar Data :*\n`;
              for (const key in database) {
                listMessage += `🔑 *${key}*\n`;
              }
              listMessage += "\n"; // Tambahkan baris kosong untuk pemisah
            } else {
              listMessage += `📜 *Daftar Data :*\n`;
              listMessage += `❌ *Tidak ada data yang tersimpan.*\n`;
              listMessage += "\n"; // Tambahkan baris kosong untuk pemisah
            }

            // Tampilkan daftar dari noteDB
            if (Object.keys(noteDB).length > 0) {
              listMessage += `📝 *Daftar Note :*\n`;
              for (const key in noteDB) {
                listMessage += `📝 *${key}*\n`;
              }
            } else {
              listMessage += `📝 *Daftar Note :*\n`;
              listMessage += `❌ *Tidak ada note yang tersimpan.*\n`;
            }

            // Kirim pesan
            msg.reply(`${greeting}${createResponse("LIST", listMessage)}`);
            break;

          case "!balance":
            if (chat.isGroup) {
              const balance = calculateBalance();
              msg.reply(`${greeting}💰 Saldo saat ini: *${balance}*`);
            } else {
              const balanceReport = createFinanceReport();
              msg.reply(`${greeting}${balanceReport}`);
            }
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
        const senderNumber = msg.from.split("@")[0];
        const greeting = getGreeting(senderNumber);
        msg.reply(
          `${greeting}${createResponse(
            "INACTIVE",
            "🔴 *Maaf, bot hanya aktif dari jam 5:00 sampai 22:00 WIB.* Silakan coba lagi nanti! 😊",
            true
          )}`
        );
      }
    }
  }
});

function createResponse(title, content, isError = false) {
  const lines = content.split("\n");
  const formattedContent = lines.map((line) => `│ ${line}`).join("\n");

  return `
╭────────────────🍂
│ 🔑 *${title}*
├──────── 🌸 ────────╮
${formattedContent}
├──────── 🍃 ────────╯
│ 🎀💖 𝗧𝗲𝗿𝗶𝗺𝗮 𝗞𝗮𝘀𝗶𝗵 𝘀𝘂𝗱𝗮𝗵 𝗺𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗸𝗮𝗻 𝗹𝗮𝘆𝗮𝗻𝗮𝗻 𝗶𝗻𝗶! 💖🎀
█▀▀▀▀▀▀▀▀▀▀▀▀▀█
`;
}

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
