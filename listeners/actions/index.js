// 🎛️ ACTION LISTENERS
// Register all button click and interactive element handlers here

import { sampleActionCallback } from './sample-action.js';

export const register = (app) => {
  // When users click a button with this action_id, run the callback
  app.action('sample_action_id', sampleActionCallback);
};
