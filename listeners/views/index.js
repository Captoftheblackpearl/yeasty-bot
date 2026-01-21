// 🎨 VIEW LISTENERS
// Register modal and view submission handlers

import { sampleViewCallback } from './sample-view.js';

export const register = (app) => {
  // When users submit a view/modal with this callback_id, run the callback
  app.view('sample_view_id', sampleViewCallback);
};
