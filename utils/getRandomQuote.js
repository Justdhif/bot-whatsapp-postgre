function getRandomQuote() {
  const quotes = [
    "Hidup adalah perjalanan, bukan tujuan. - Ralph Waldo Emerson",
    "Jangan menunggu kesempatan, ciptakanlah. - George Bernard Shaw",
    "Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan. - Colin Powell",
    "Jadilah perubahan yang ingin kamu lihat di dunia. - Mahatma Gandhi",
    "Mimpi besar dan berani bermimpi. - Walt Disney",
    "Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas. - Henry Ford",
    "Jangan pernah menyerah, karena biasanya itu adalah langkah terakhir sebelum sukses. - Thomas Edison",
    "Kamu tidak perlu melihat seluruh tangga, cukup ambil langkah pertama. - Martin Luther King Jr.",
    "Hidup ini seperti mengendarai sepeda. Untuk menjaga keseimbangan, kamu harus terus bergerak. - Albert Einstein",
    "Kesempatan tidak datang dua kali, tapi kesiapan selalu membawa keberuntungan. - Louis Pasteur",
  ];

  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

module.exports = { getRandomQuote };
