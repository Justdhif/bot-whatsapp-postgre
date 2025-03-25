const { getGreeting } = require("./getGreeting");
const { createResponse } = require("./createResponse");

const sendReply = async (msg, type, text) => {
  const greeting = await getGreeting(msg);
  const response = createResponse(type, text);
  msg.reply(response.media || `${greeting}\n${response.text}`, undefined, {
    caption: response.media ? `${greeting}\n${response.text}` : undefined,
  });
};

module.exports = { sendReply };
