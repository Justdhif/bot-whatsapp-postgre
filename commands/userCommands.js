const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Perintah untuk mengatur atau mengganti username
const handleUsernameCommand = async (msg, args) => {
  const newUsername = args.join(" ").trim();
  if (!newUsername) {
    return msg.reply("❌ *Format salah!*\nGunakan: `!username [username]`.");
  }

  // Cek apakah username sudah digunakan
  const existingUser = await prisma.user.findUnique({
    where: { username: newUsername },
  });
  if (existingUser) {
    return msg.reply("❌ *Username sudah digunakan! Coba yang lain.*");
  }

  const phone = msg.from.replace("@c.us", ""); // Hilangkan @c.us

  try {
    // Cari user berdasarkan phone number
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (user) {
      // Update username jika user sudah ada
      await prisma.user.update({
        where: { phone },
        data: { username: newUsername },
      });
      msg.reply(`🔄 *Username berhasil diubah menjadi:* *${newUsername}* ✅`);
    } else {
      // Buat user baru jika belum ada
      await prisma.user.create({
        data: {
          phone,
          username: newUsername,
        },
      });
      msg.reply(`🎉 *Username berhasil disimpan sebagai:* *${newUsername}* ✅`);
    }
  } catch (error) {
    console.error("Error handling username command:", error);
    msg.reply("❌ *Terjadi kesalahan saat memproses permintaan.*");
  }
};

// Perintah untuk menghapus user berdasarkan username
const handleDeleteUserCommand = async (msg, args) => {
  const usernameToDelete = args.join(" ").trim();
  if (!usernameToDelete) {
    return msg.reply(
      "❌ *Format salah!*\nGunakan: `!deleteuser [username]`\n📌 Contoh: `!deleteuser JohnDoe`"
    );
  }

  try {
    // Cari dan hapus user berdasarkan username
    const deletedUser = await prisma.user.delete({
      where: { username: usernameToDelete },
    });

    if (deletedUser) {
      msg.reply(
        `🗑️ *Pengguna dengan username ${usernameToDelete} berhasil dihapus!*`
      );
    }
  } catch (error) {
    if (error.code === "P2025") {
      // Error ketika record tidak ditemukan
      msg.reply("❌ *Username tidak ditemukan!*");
    } else {
      console.error("Error deleting user:", error);
      msg.reply("❌ *Terjadi kesalahan saat menghapus pengguna.*");
    }
  }
};

module.exports = {
  handleUsernameCommand,
  handleDeleteUserCommand,
};
