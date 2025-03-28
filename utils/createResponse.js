const fs = require("fs");
const path = require("path");
const { MessageMedia } = require("whatsapp-web.js");

const botName = "Chaca_Bot";
const imagePath = path.join(__dirname, "../public/profile-pic.jpg");

module.exports = {
  createResponse: (title, content) => {
    if (!content || typeof content !== "string") {
      console.error("❌ Error: content tidak valid:", content);
      content = "⚠️ Tidak ada data yang dapat ditampilkan.";
    }

    const formattedContent = content
      .split("\n")
      .map((line) => `│ ${line}`)
      .join("\n");

    const textResponse = `╭────────────────🍂
│ ≽ ⧼ *${title}* ⧽
├──────── 🌸 ────────╮
${formattedContent}
├──────── 🍃 ────────╯
│ 🤖 *${botName}* - by Justdhif 💡
╰────────────────`;

    if (fs.existsSync(imagePath)) {
      const media = MessageMedia.fromFilePath(imagePath);
      return { text: textResponse, media };
    }

    return { text: textResponse };
  },
};
