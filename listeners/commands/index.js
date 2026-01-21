// 💬 SLASH COMMAND LISTENERS
// Register all /slash commands here

import { sampleCommandCallback } from './sample-command.js';

export const register = (app) => {
  // When users type /sample-command, run the callback
  app.command('/sample-command', sampleCommandCallback);
};
