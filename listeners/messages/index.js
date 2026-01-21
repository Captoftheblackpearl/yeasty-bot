// 📧 MESSAGE LISTENERS
// Register message patterns that trigger callbacks

import { sampleMessageCallback } from './sample-message.js';

export const register = (app) => {
  // When a message matches this pattern, run the callback
  app.message(/^(hi|hello|hey).*/, sampleMessageCallback);
};
