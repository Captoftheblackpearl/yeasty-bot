// 📨 SAMPLE MESSAGE HANDLER
// This handles when someone sends a message in a channel the bot listens to
const sampleMessageCallback = async ({ context, say, logger }) => {
  try {
    const greeting = context.matches[0];
    await say(`${greeting}, how are you?`);
  } catch (error) {
    logger.error(error);
  }
};

export { sampleMessageCallback };
