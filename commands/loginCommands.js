const { PrismaClient } = require("@prisma/client");
const { getGreeting } = require("../utils/getGreeting");
const { createResponse } = require("../utils/createResponse");

const prisma = new PrismaClient();
const LOGIN_CODE = "08122008"; // Kode login yang sudah ditentukan

// Fungsi untuk memeriksa status login pengguna
const checkLogin = async (msg) => {
  const phone = msg.from.endsWith("@g.us")
    ? msg.author.split("@")[0]
    : msg.from.split("@")[0];
  const user = await prisma.user.findUnique({ where: { phone } });
  return user && user.isLoggedIn;
};

module.exports = {
  handleLoginCommand: async (msg) => {
    const greeting = await getGreeting(msg); // Tambahkan await dan parameter msg
    msg.reply(`${greeting} 📝 *Silakan masukkan kode login \`!code <kode>\`.`);
  },

  handleCodeCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await dan parameter msg

    // Debugging: Cetak nilai args
    console.log("Args:", args);

    // Ambil argumen setelah command (ignore the first element)
    const code = args.slice(1).join(" ").trim(); // Gabungkan semua argumen setelah command dan hapus spasi

    // Debugging: Cetak nilai code dan LOGIN_CODE
    console.log("Kode yang dimasukkan:", code);
    console.log("Kode yang benar:", LOGIN_CODE);

    if (!code) {
      msg.reply(`${greeting} ❌ *Format salah!* gunakan \`!code <kode>\`.`);
      return;
    }

    if (code === LOGIN_CODE) {
      const phone = msg.from.split("@")[0]; // Ambil nomor telepon pengguna
      await prisma.user.upsert({
        where: { phone },
        update: { isLoggedIn: true }, // Set status login ke true
        create: { phone, isLoggedIn: true }, // Buat user baru jika belum ada
      });
      msg.reply(
        `${greeting} ✅ *Kode verifikasi berhasil!* Sekarang, set username anda \`!username <username>\`.`
      );
    } else {
      msg.reply(`${greeting} ❌ *Kode login salah!*`);
    }
  },

  handleUsernameCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await dan parameter msg
    const username = args.slice(1).join(" ").trim(); // Gabungkan semua argumen sebagai username

    if (!username) {
      msg.reply(
        `${greeting} ❌ *Format salah!* Gunakan: \`!username <username>\`.`
      );
      return;
    }

    const phone = msg.from.split("@")[0];
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || !user.isLoggedIn) {
      msg.reply(`${greeting} ❌ *Anda harus login terlebih dahulu!*`);
      return;
    }

    await prisma.user.update({
      where: { phone },
      data: { username }, // Set username
    });

    msg.reply(
      `${greeting} ✅ *Username berhasil di-set!* Selamat datang, *${username}*.`
    );
  },

  handleLogoutCommand: async (msg) => {
    const greeting = await getGreeting(msg); // Tambahkan await dan parameter msg
    const phone = msg.from.split("@")[0];
    await prisma.user.update({
      where: { phone },
      data: { isLoggedIn: false },
    });
    msg.reply(`${greeting} ✅ *Logout berhasil!*`);
  },

  handleListUserCommand: async (msg) => {
    const greeting = await getGreeting(msg); // Tambahkan await dan parameter msg

    // Cek apakah pengguna yang menjalankan command sudah login (admin)
    const isLoggedIn = await checkLogin(msg);

    if (!isLoggedIn) {
      msg.reply(`${greeting} ❌ *Anda harus login terlebih dahulu!*`);
      return;
    }

    // Ambil semua user
    const allUsers = await prisma.user.findMany();

    if (allUsers.length === 0) {
      msg.reply(`${greeting} ❌ *Tidak ada user yang terdaftar.*`);
      return;
    }

    // Format daftar user
    const userList = allUsers
      .map(
        (user) =>
          `📞 *${user.phone}*\n👤 *${user.username || "Belum di-set"}*\n` +
          `🔒 Status: ${user.isLoggedIn ? "🟢 Login" : "🔴 Logout"}\n`
      )
      .join("\n");

    // Gunakan createResponse untuk menampilkan daftar user
    const response = createResponse("LIST USER", userList);

    if (response.media) {
      msg.reply(response.media, undefined, {
        caption: `${greeting}\n${response.text}`,
      });
    } else {
      msg.reply(`${greeting}\n${response.text}`);
    }
  },

  handleDeleteUserCommand: async (msg, args) => {
    const greeting = await getGreeting(msg); // Tambahkan await dan parameter msg
    const phoneToDelete = args[0]; // Nomor telepon user yang akan dihapus

    if (!phoneToDelete) {
      msg.reply(
        `${greeting} ❌ *Format salah!* Gunakan: \`!deleteuser <nomor_telepon>\`.`
      );
      return;
    }

    // Cek apakah pengguna yang menjalankan command sudah login (admin)
    const isLoggedIn = await checkLogin(msg);

    if (!isLoggedIn) {
      msg.reply(`${greeting} ❌ *Anda harus login terlebih dahulu!*`);
      return;
    }

    // Cari user yang akan dihapus
    const userToDelete = await prisma.user.findUnique({
      where: { phone: phoneToDelete },
    });

    if (!userToDelete) {
      msg.reply(
        `${greeting} ❌ *User dengan nomor ${phoneToDelete} tidak ditemukan.*`
      );
      return;
    }

    // Hanya bisa menghapus user yang status loginnya false
    if (userToDelete.isLoggedIn) {
      msg.reply(
        `${greeting} ❌ *User dengan nomor ${phoneToDelete} masih login!*\n` +
          `Anda hanya bisa menghapus user yang sudah logout.`
      );
      return;
    }

    // Hapus user
    await prisma.user.delete({
      where: { phone: phoneToDelete },
    });

    msg.reply(
      `${greeting} ✅ *User dengan nomor ${phoneToDelete} berhasil dihapus!*`
    );
  },
};
