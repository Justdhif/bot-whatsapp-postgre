const { PrismaClient } = require("@prisma/client");
const { sendReply } = require("../utils/sendReply");

const prisma = new PrismaClient();

// Helper function yang disesuaikan
const getSourceInfo = (msg) => {
  const isGroup = msg.id.remote.includes("@g.us");
  const sourceId = isGroup
    ? msg.id.remote.replace("@g.us", "")
    : msg.from.replace("@c.us", "").replace(/\D/g, "");
  return {
    isGroup,
    sourceId,
    identifier: isGroup ? { groupId: sourceId } : { phone: sourceId },
  };
};

// ====================== 📋 TO-DO LIST MANAGEMENT ======================

const handleAddTodoCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { isGroup, sourceId } = getSourceInfo(msg);

    if (args.length < 2) {
      return msg.reply("❌ Format: !addtodo [prioritas] [tugas]");
    }

    const priority = args[0].toUpperCase();
    if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) {
      return msg.reply("❌ Prioritas hanya HIGH, MEDIUM, atau LOW.");
    }

    const task = args.slice(1).join(" ").trim();
    if (!task) return msg.reply("❌ Deskripsi tugas tidak boleh kosong.");
    if (task.length > 100) {
      return msg.reply("❌ Tugas terlalu panjang (maks 100 karakter).");
    }

    // Pastikan Group/Chat sudah ada
    if (isGroup) {
      await prismaInstance.group.upsert({
        where: { groupId: sourceId },
        create: {
          groupId: sourceId,
          name: `Group-${sourceId}`,
          isActive: true,
        },
        update: {},
      });
    } else {
      await prismaInstance.chat.upsert({
        where: { phone: sourceId },
        create: {
          phone: sourceId,
          isActive: true,
        },
        update: {},
      });
    }

    // Cek apakah tugas sudah ada
    const exists = await prismaInstance.todo.findFirst({
      where: {
        task,
        isCompleted: false,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
      },
    });
    if (exists) return msg.reply(`⚠️ Tugas sudah ada: "${task}"`);

    // Buat data todo dengan relasi
    const createData = {
      task,
      priority,
      createdBy: msg.from.replace("@c.us", "").replace(/\D/g, ""),
    };

    if (isGroup) {
      createData.group = { connect: { groupId: sourceId } };
    } else {
      createData.chat = { connect: { phone: sourceId } };
    }

    await prismaInstance.todo.create({
      data: createData,
    });
    return msg.reply(`✅ Tugas ditambahkan: *${task}* (${priority})`);
  } catch (error) {
    console.error("AddTodo error:", error);
    return msg.reply("❌ Gagal menambahkan tugas.");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

const handleListTodoCommand = async (msg) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { isGroup, sourceId } = getSourceInfo(msg);

    const todos = await prismaInstance.todo.findMany({
      where: {
        isDeleted: false,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
      },
      orderBy: [
        { isCompleted: "asc" },
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });

    if (todos.length === 0) {
      return sendReply(msg, "TODO LIST", "📋 Belum ada tugas untuk chat ini.");
    }

    let message = "📋 *Daftar Tugas:*\n\n";
    const activeTodos = todos.filter((t) => !t.isCompleted);
    const completedTodos = todos.filter((t) => t.isCompleted);

    if (activeTodos.length > 0) {
      message += "📌 *Tugas Aktif:*\n";
      activeTodos.forEach((todo, index) => {
        const emoji =
          todo.priority === "HIGH"
            ? "🚨"
            : todo.priority === "MEDIUM"
            ? "⚠️"
            : "🐢";
        message += `${index + 1}. ${emoji} *${todo.task}*\n`;
      });
      message += "\n";
    }

    if (completedTodos.length > 0) {
      message += "✅ *Tugas Selesai:*\n";
      completedTodos.forEach((todo, index) => {
        message += `${index + 1}. ✓ ${todo.task}\n`;
      });
    }

    message +=
      "\nℹ️ Gunakan `!donetodo [nomor/teks tugas]` untuk menandai selesai.";
    message +=
      "\nℹ️ Gunakan `!deletetodo [nomor/teks tugas]` untuk menghapus tugas.";

    return sendReply(msg, "TODO LIST", message);
  } catch (error) {
    console.error("ListTodos error:", error);
    return sendReply(msg, "ERROR", "❌ Gagal mengambil daftar tugas.");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

const handleCompleteTodoCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { isGroup, sourceId } = getSourceInfo(msg);

    if (!args.length)
      return msg.reply("❌ Format: !donetodo [nomor/teks tugas]");
    const taskQuery = args.join(" ").trim();
    if (!taskQuery) return msg.reply("❌ Nama tugas tidak boleh kosong.");

    // Cari tugas yang belum selesai
    const todos = await prismaInstance.todo.findMany({
      where: {
        isCompleted: false,
        isDeleted: false,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    let taskToComplete;
    const taskNumber = parseInt(taskQuery);
    if (!isNaN(taskNumber) && taskNumber > 0 && taskNumber <= todos.length) {
      taskToComplete = todos[taskNumber - 1];
    } else {
      taskToComplete = todos.find((t) =>
        t.task.toLowerCase().includes(taskQuery.toLowerCase())
      );
    }

    if (!taskToComplete) {
      return msg.reply(`❌ Tugas "${taskQuery}" tidak ditemukan.`);
    }

    await prismaInstance.todo.update({
      where: { id: taskToComplete.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
    return msg.reply(`✅ Tugas selesai: *${taskToComplete.task}*`);
  } catch (error) {
    console.error("CompleteTodo error:", error);
    return msg.reply("❌ Gagal menandai tugas sebagai selesai.");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

const handleDeleteTodoCommand = async (msg, args) => {
  let prismaInstance;
  try {
    prismaInstance = new PrismaClient();
    const { isGroup, sourceId } = getSourceInfo(msg);

    if (!args.length)
      return msg.reply("❌ Format: !deletetodo [nomor/teks tugas]");
    const taskQuery = args.join(" ").trim();
    if (!taskQuery) return msg.reply("❌ Nama tugas tidak boleh kosong.");

    const todos = await prismaInstance.todo.findMany({
      where: {
        isDeleted: false,
        OR: [
          { group: isGroup ? { groupId: sourceId } : null },
          { chat: !isGroup ? { phone: sourceId } : null },
        ],
      },
      orderBy: [
        { isCompleted: "asc" },
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });

    let taskToDelete;
    const taskNumber = parseInt(taskQuery);
    if (!isNaN(taskNumber) && taskNumber > 0 && taskNumber <= todos.length) {
      taskToDelete = todos[taskNumber - 1];
    } else {
      taskToDelete = todos.find((t) =>
        t.task.toLowerCase().includes(taskQuery.toLowerCase())
      );
    }

    if (!taskToDelete) {
      return msg.reply(`❌ Tugas "${taskQuery}" tidak ditemukan.`);
    }

    await prismaInstance.todo.update({
      where: { id: taskToDelete.id },
      data: { isDeleted: true },
    });
    return msg.reply(`🗑️ Tugas dihapus: *${taskToDelete.task}*`);
  } catch (error) {
    console.error("DeleteTodo error:", error);
    return msg.reply("❌ Gagal menghapus tugas.");
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
    }
  }
};

module.exports = {
  handleAddTodoCommand,
  handleListTodoCommand,
  handleCompleteTodoCommand,
  handleDeleteTodoCommand,
};
