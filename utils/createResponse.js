module.exports = {
  createResponse: (title, content, isError = false) => {
    const lines = content.split("\n");
    const formattedContent = lines.map((line) => `│ ${line}`).join("\n");

    return `
  ╭────────────────🍂
  │ 🔑 ⧼ *${title}* ⧽
  ├──────── 🌸 ────────╮
  ${formattedContent}
  ├──────── 🍃 ────────╯
  │ 🎀💖 𝗧𝗲𝗿𝗶𝗺𝗮 𝗞𝗮𝘀𝗶𝗵 𝘀𝘂𝗱𝗮𝗵 𝗺𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗸𝗮𝗻 𝗹𝗮𝘆𝗮𝗻𝗮𝗻 𝗶𝗻𝗶! 💖🎀
  █▀▀▀▀▀▀▀▀▀▀▀▀▀█
  `;
  }
};
