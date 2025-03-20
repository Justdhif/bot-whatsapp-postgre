module.exports = {
  getGreeting: () => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    let wibHours = utcHours + 7; // Konversi ke WIB (UTC+7)

    if (wibHours >= 24) wibHours -= 24;

    let greeting = "";

    if (wibHours >= 5 && wibHours < 11) {
      greeting = `🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗣𝗮𝗴𝗶! 🌷🌞\n`;
    } else if (wibHours >= 11 && wibHours < 15) {
      greeting = `🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗦𝗶𝗮𝗻𝗴! 🌷🌞\n`;
    } else if (wibHours >= 15 && wibHours < 19) {
      greeting = `🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗦𝗼𝗿𝗲! 🌷🌞\n`;
    } else {
      greeting = `🌷🌞 𝗛𝗮𝗶, 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗠𝗮𝗹𝗮𝗺! 🌷🌞\n`;
    }

    return greeting;
  },
};
