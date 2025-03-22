// utils/getGreeting.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  getGreeting: async (msg) => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    let wibHours = utcHours + 7; // Konversi ke WIB (UTC+7)

    if (wibHours >= 24) wibHours -= 24;

    let greeting = `╭─────────────────────╮
│ ~~~~ 🌸 𝐂𝐡𝐚𝐜𝐚_𝐁𝐨𝐭 🌸 ~~~~ │
╰─────────────────────╯
`;

    if (wibHours >= 5 && wibHours < 11) {
      greeting += `\n🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗣𝗮𝗴𝗶! 🌞🌷\n`; // Pagi
    } else if (wibHours >= 11 && wibHours < 15) {
      greeting += `\n🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗦𝗶𝗮𝗻𝗴! 🌞🌷\n`; // Siang
    } else if (wibHours >= 15 && wibHours < 19) {
      greeting += `\n🌷🌅 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗼𝗺𝗮𝘁 𝗦𝗼𝗿𝗲! 🌅🌷\n`; // Sore
    } else {
      greeting += `\n🌷🌙 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗠𝗮𝗹𝗮𝗺! 🌙🌷\n`; // Malam
    }

    // Ambil nomor telepon pengguna
    const phone = msg.from.split("@")[0];

    // Cek apakah pesan berasal dari grup atau personal chat
    const isGroup = msg.from.endsWith("@g.us");

    // Jika pesan berasal dari grup, ambil nomor pengguna yang mengirim pesan
    const senderNumber = isGroup ? msg.author.split("@")[0] : phone;

    // Cek status login dan username pengguna dari database
    const user = await prisma.user.findUnique({
      where: { phone: senderNumber },
    });

    // Jika pengguna sudah login dan memiliki username, tampilkan username
    if (user && user.isLoggedIn && user.username) {
      greeting += `\n👤 *${user.username}*\n`;
    } else {
      // Jika tidak, tampilkan nomor telepon pengguna
      greeting += `\n📞 *${senderNumber}*\n`;
    }

    return greeting;
  },
};
