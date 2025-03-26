const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  getGreeting: async (msg) => {
    try {
      const now = new Date();
      const utcHours = now.getUTCHours();
      let wibHours = utcHours + 7; // Konversi ke WIB (UTC+7)

      if (wibHours >= 24) wibHours -= 24;

      // Ambil nomor pengguna
      const phone = msg.from.split("@")[0];

      // Cek apakah pesan berasal dari grup atau personal chat
      const isGroup = msg.from.endsWith("@g.us");
      const senderNumber = isGroup ? msg.author.split("@")[0] : phone;

      // Ambil username dari database berdasarkan nomor telepon
      const user = await prisma.user.findUnique({
        where: { phone: senderNumber },
      });

      // Gunakan username jika ada, jika tidak gunakan nomor telepon
      const username = user?.username || senderNumber;

      // Tentukan greeting berdasarkan waktu
      let timeGreeting = "Halo";
      if (wibHours >= 5 && wibHours < 11) {
        timeGreeting = "Selamat Pagi";
      } else if (wibHours >= 11 && wibHours < 15) {
        timeGreeting = "Selamat Siang";
      } else if (wibHours >= 15 && wibHours < 19) {
        timeGreeting = "Selamat Sore";
      } else {
        timeGreeting = "Selamat Malam";
      }

      // Format pesan greeting
      const greeting = `╭─────────────────────╮
│ ~~~~ 🌸 𝐂𝐡𝐚𝐜𝐚_𝐁𝐨𝐭 🌸 ~~~~ │
╰─────────────────────╯

🌷 ${timeGreeting}, *${username}*! 🌷
`;

      return greeting;
    } catch (error) {
      console.error("Error fetching greeting:", error);
      return "❌ Terjadi kesalahan saat mengambil data pengguna.";
    } finally {
      await prisma.$disconnect();
    }
  },
};
