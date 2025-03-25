const { MessageMedia } = require("whatsapp-web.js");
const sharp = require("sharp");
const fs = require("fs-extra");
const { spawn } = require("child_process");

const handleBratCommand = async (msg) => {
  const userText = msg.body.replace(/^!brat\s*/, "").trim();
  if (!userText) {
    return msg.reply(
      "⚠️ Teks tidak boleh kosong. Gunakan format: `!brat <teks>`"
    );
  }

  fs.ensureDirSync("./temp");

  const imagePath = "./temp/brat-text.png";
  const stickerPath = "./temp/brat-sticker.webp";

  let fontSize = 80;
  if (userText.length > 20) fontSize = 60;
  if (userText.length > 40) fontSize = 45;
  if (userText.length > 60) fontSize = 35;
  if (userText.length > 80) fontSize = 25;
  if (userText.length > 100) fontSize = 20;

  // Format teks dengan padding & peletakan yang lebih rapi
  const pangoText = `pango:<span font='Arial Bold' size='${
    fontSize * 1000
  }' weight='bold' foreground='black'>${userText}</span>`;

  const createText = spawn("magick", [
    "convert",
    "-background",
    "white",
    "-gravity",
    "east", // Rata kiri
    "-size",
    "450x450", // Area teks lebih kecil untuk memberikan padding
    pangoText,
    "-extent",
    "512x512", // Tambahkan padding secara keseluruhan
    imagePath,
  ]);

  createText.stderr.on("data", (data) => {
    console.error("ImageMagick Error:", data.toString());
  });

  createText.on("close", async (code) => {
    if (code !== 0 || !fs.existsSync(imagePath)) {
      return msg.reply("❌ Gagal membuat gambar teks.");
    }

    try {
      await sharp(imagePath)
        .resize(512, 512, { fit: "inside" })
        .toFormat("webp")
        .toFile(stickerPath);

      const sticker = MessageMedia.fromFilePath(stickerPath);
      await msg.reply(sticker, msg.from, { sendMediaAsSticker: true });

      fs.unlinkSync(imagePath);
      fs.unlinkSync(stickerPath);
    } catch (err) {
      console.error("❌ Gagal memproses gambar:", err);
      msg.reply("❌ Terjadi kesalahan saat mengonversi gambar.");
    }
  });
};

module.exports = { handleBratCommand };
