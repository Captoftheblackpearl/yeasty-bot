// 📋 EVENT LISTENERS
// Register all Slack events that trigger automatically

import { appHomeOpenedCallback } from './app-home-opened.js';

export const register = (app) => {
  // When a user opens the app's home tab, run the callback
  app.event('app_home_opened', appHomeOpenedCallback);
};
