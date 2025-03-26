const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// ====================== 📌 UTILITY FUNCTIONS ======================

const normalizePhoneNumber = (number) => {
  if (!number) return null;
  let normalized = number.replace(/\D/g, "");
  if (normalized.startsWith("0")) normalized = "62" + normalized.substring(1);
  else if (!normalized.startsWith("62")) normalized = "62" + normalized;
  return normalized;
};

const getSenderNumber = (msg) => {
  const rawNumber = msg?.author || msg?.from;
  return rawNumber ? normalizePhoneNumber(rawNumber.split("@")[0]) : null;
};

// ====================== 📋 TO-DO LIST MANAGEMENT ======================

// 📌 Tambah Tugas
const handleAddTodoCommand = async (msg, args) => {
  const number = getSenderNumber(msg);
  if (!number) return msg.reply("❌ Gagal mengidentifikasi pengguna.");
  if (args.length < 2)
    return msg.reply("❌ Format: !addtodo [prioritas] [tugas]");

  const priority = args[0].toUpperCase();
  if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) {
    return msg.reply("❌ Prioritas hanya HIGH, MEDIUM, atau LOW.");
  }

  const task = args.slice(1).join(" ").trim();
  if (!task) return msg.reply("❌ Deskripsi tugas tidak boleh kosong.");
  if (task.length > 100)
    return msg.reply("❌ Tugas terlalu panjang (maks 100 karakter).");

  try {
    const exists = await prisma.todo.findFirst({
      where: { userId: number, task, isCompleted: false },
    });
    if (exists) return msg.reply(`⚠️ Tugas sudah ada: "${task}"`);

    await prisma.todo.create({ data: { userId: number, task, priority } });
    return msg.reply(`✅ Tugas ditambahkan: *${task}* (${priority})`);
  } catch (error) {
    console.error("AddTodo error:", error);
    return msg.reply("❌ Gagal menambahkan tugas.");
  }
};

// 📜 Menampilkan Daftar Tugas
const handleListTodoCommand = async (msg) => {
  const number = getSenderNumber(msg);
  if (!number) return;

  try {
    const todos = await prisma.todo.findMany({
      where: { userId: number },
      orderBy: [
        { isCompleted: "asc" },
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });

    if (todos.length === 0) {
      return sendReply(msg, "TODO_LIST", "📋 Anda belum memiliki tugas.");
    }

    let message = "📋 *To-Do List Anda:*\n\n";
    const activeTodos = todos.filter((t) => !t.isCompleted);
    const completedTodos = todos.filter((t) => t.isCompleted);

    if (activeTodos.length > 0) {
      message += "📌 *Tugas Aktif:*\n";
      activeTodos.forEach((todo) => {
        const emoji =
          todo.priority === "HIGH"
            ? "🚨"
            : todo.priority === "MEDIUM"
            ? "⚠️"
            : "🐢";
        message += `${emoji} *${todo.task}*\n`;
      });
      message += "\n";
    }

    if (completedTodos.length > 0) {
      message += "✅ *Tugas Selesai:*\n";
      completedTodos.forEach((todo) => {
        message += `✓ ${todo.task}\n`;
      });
    }

    message += "\nℹ️ Gunakan `!donetodo [nama tugas]` untuk menandai selesai.";
    message += "\nℹ️ Gunakan `!deletetodo [nama tugas]` untuk menghapus tugas.";

    return sendReply(msg, "TODO_LIST", message);
  } catch (error) {
    console.error("ListTodos error:", error);
    return sendReply(msg, "ERROR", "❌ Gagal mengambil daftar tugas.");
  }
};

// ✅ Menandai Selesai
const handleCompleteTodoCommand = async (msg, args) => {
  const number = getSenderNumber(msg);
  if (!number) return msg.reply("❌ Gagal mengidentifikasi pengguna.");
  if (!args.length) return msg.reply("❌ Format: !donetodo [nama tugas]");

  const taskName = args.join(" ").trim();
  if (!taskName) return msg.reply("❌ Nama tugas tidak boleh kosong.");

  try {
    const task = await prisma.todo.findFirst({
      where: {
        userId: number,
        task: { equals: taskName, mode: "insensitive" },
        isCompleted: false,
      },
    });
    if (!task) return msg.reply(`❌ Tugas "${taskName}" tidak ditemukan.`);

    await prisma.todo.update({
      where: { id: task.id },
      data: { isCompleted: true, completedAt: new Date() },
    });
    return msg.reply(`✅ Tugas selesai: *${task.task}*`);
  } catch (error) {
    console.error("CompleteTodo error:", error);
    return msg.reply("❌ Gagal menandai tugas sebagai selesai.");
  }
};

// 🗑️ Menghapus Tugas
const handleDeleteTodoCommand = async (msg, args) => {
  const number = getSenderNumber(msg);
  if (!number) return msg.reply("❌ Gagal mengidentifikasi pengguna.");
  if (!args.length) return msg.reply("❌ Format: !deletetodo [nama tugas]");

  const taskName = args.join(" ").trim();
  if (!taskName) return msg.reply("❌ Nama tugas tidak boleh kosong.");

  try {
    const task = await prisma.todo.findFirst({
      where: {
        userId: number,
        task: { equals: taskName, mode: "insensitive" },
        isDeleted: false,
      },
    });
    if (!task) return msg.reply(`❌ Tugas "${taskName}" tidak ditemukan.`);

    await prisma.todo.update({
      where: { id: task.id },
      data: { isDeleted: true },
    });
    return msg.reply(`🗑️ Tugas dihapus: *${task.task}*`);
  } catch (error) {
    console.error("DeleteTodo error:", error);
    return msg.reply("❌ Gagal menghapus tugas.");
  }
};

// ====================== EXPORT MODULE ======================

module.exports = {
  handleAddTodoCommand,
  handleListTodoCommand,
  handleCompleteTodoCommand,
  handleDeleteTodoCommand,
};

// ====================== END OF FILE ======================