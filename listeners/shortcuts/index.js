// ⚡ SHORTCUT LISTENERS
// Register shortcuts that users can trigger from right-click menus

import { sampleShortcutCallback } from './sample-shortcut.js';

export const register = (app) => {
  // When users trigger this shortcut, run the callback
  app.shortcut('sample_shortcut_id', sampleShortcutCallback);
};
