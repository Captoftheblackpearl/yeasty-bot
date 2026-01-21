// ✨ OAUTH VERSION OF THE BREAD BOT ✨
// Use this if you want to distribute the app across multiple workspaces
// This file uses OAuth for multi-workspace installations

import { App, FileInstallationStore, LogLevel } from '@slack/bolt';
import { config } from 'dotenv';
import { registerListeners } from './listeners/index.js';

config(); // LOAD THE .ENV FILE!!!

// 🔐 CREATE THE OAUTH APP
const app = new App({
  logLevel: LogLevel.DEBUG,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'my-state-secret', // Used to verify OAuth state
  scopes: ['channels:history', 'chat:write', 'commands'],
  // FileInstallationStore is for development only
  // Read more: https://docs.slack.dev/tools/bolt-js/concepts/authenticating-oauth#installation-store
  installationStore: new FileInstallationStore(),
  installerOptions: {
    // If true, /slack/install redirects installers to the Slack Authorize URL
    // without showing the "Add to Slack" button
    directInstall: false,
  },
});

// 📖 REGISTER ALL THE LISTENERS
// This imports and registers all the commands, events, actions, etc.
registerListeners(app);

// 🚀 START THE OAUTH BOT!!!
// This listens on port 3000 (or whatever PORT is set to)
(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    app.logger.info('⚡️ Yeasty the Squire is running in OAuth mode! ⚡️');
  } catch (error) {
    app.logger.error('Unable to start App', error);
  }
})();
