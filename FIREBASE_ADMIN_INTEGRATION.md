// 🍞 BREAD BOT + FIREBASE ADMIN SDK INTEGRATION GUIDE
// This shows how to integrate Firebase Admin SDK into your Slack bot commands

// ==========================================
// SETUP: ONE-TIME CONFIGURATION
// ==========================================

// 1. Download Service Account Key from Firebase Console:
//    - Go to Firebase Console > Project Settings > Service Accounts
//    - Click "Generate New Private Key"
//    - Save the JSON file (keep it secret!!!)

// 2. Set environment variable (choose one):
//    Option A - Linux/Mac:
//      export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
//    Option B - Windows:
//      set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccountKey.json
//    Option C - In .env file:
//      Just set FIREBASE_DATABASE_URL and Firebase auto-detects credentials

// 3. Add to your .env file:
//    FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/

// ==========================================
// USAGE: IN YOUR app.js COMMANDS
// ==========================================

// At the top of app.js, add:
// import { awardButterPoint, getLeaderboard, checkButterLimit, promoteUser } from './firebase-usage.js';

// ==========================================
// EXAMPLE 1: UPDATED /butter-up COMMAND
// ==========================================
// This uses atomic transactions to safely award butter points
/*
app.command('/butter-up', async ({ command, ack, client }) => {
  await ack();
  
  const giver = command.user_id;
  const receiverMatch = command.text.match(/<@([A-Z0-9]+)>/);
  const receiver = receiverMatch ? receiverMatch[1] : null;

  if (!receiver) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: '🛈 Usage: `/butter-up @username` to award 1 Butter Point',
    });
  }

  if (giver === receiver) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: 'You cannot butter yourself! Find a worthy noble to butter instead.',
    });
  }

  // ✨ NEW: Check rate limit (3 per day)
  const canAward = await checkButterLimit(giver);
  if (!canAward) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: '⏱️ You\'ve used all 3 daily butter rations! Try again tomorrow.',
    });
  }

  // ✨ NEW: Award butter using atomic transaction
  const newPoints = await awardButterPoint(receiver);

  if (newPoints !== null) {
    await client.chat.postMessage({
      channel: command.channel_id,
      text: `🧈 <@${giver}> has buttered <@${receiver}>!\\nTotal Influence: ${newPoints} Butter Point${newPoints !== 1 ? 's' : ''}`,
    });
  }
});
*/

// ==========================================
// EXAMPLE 2: UPDATED /court-rankings COMMAND
// ==========================================
// This gets the leaderboard from Firebase
/*
app.command('/court-rankings', async ({ ack, client, command }) => {
  await ack();
  
  // ✨ NEW: Get leaderboard from Firebase (sorted!)
  const leaderboard = await getLeaderboard();

  const leaderboardText =
    leaderboard.length > 0
      ? leaderboard
          .map(
            (user, i) =>
              `*${i + 1}.* <@${user.userId}> — ${user.points} Butter Point${user.points !== 1 ? 's' : ''} | _${user.title}_`
          )
          .join('\\n')
      : 'The court is currently empty. No nobles have earned Butter Points yet.';

  await client.chat.postMessage({
    channel: command.channel_id,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '👑 The Royal Leaderboard',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: leaderboardText,
        },
      },
    ],
  });
});
*/

// ==========================================
// EXAMPLE 3: UPDATED /promote COMMAND
// ==========================================
// This updates a user's title in Firebase
/*
app.command('/promote', async ({ command, ack, client }) => {
  await ack();
  
  if (command.user_id !== KING_ID) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: '🚫 Only the King can grant titles.',
    });
  }

  const targetMatch = command.text.match(/<@([A-Z0-9]+)>/);
  const target = targetMatch ? targetMatch[1] : null;
  const newTitle = command.text.replace(/<@([A-Z0-9]+)>/, '').trim();

  if (!target || !newTitle) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: '🛈 Usage: `/promote @username New Title Here`',
    });
  }

  // ✨ NEW: Update user in Firebase
  const success = await promoteUser(target, newTitle);

  if (success) {
    await client.chat.postMessage({
      channel: command.channel_id,
      text: `*BY ROYAL DECREE:* <@${target}> is hereby known as the **${newTitle}**!`,
    });
  }
});
*/

// ==========================================
// FIREBASE REALTIME DATABASE STRUCTURE
// ==========================================
// Your database will look like:
//
// royal_vault/
//   users/
//     U12345/
//       points: 10
//       title: "Earl of Bread"
//       updatedAt: 1705862400000
//     U67890/
//       points: 5
//       title: "Flour Peasant"
//       updatedAt: 1705848000000
//   logs/
//     U12345/
//       date: "2026-01-21"
//       count: 2
//     U67890/
//       date: "2026-01-21"
//       count: 1

// ==========================================
// KEY DIFFERENCES: Admin SDK vs Client SDK
// ==========================================
// Admin SDK (what we're using now) ✨
//   ✅ Runs on server (Node.js)
//   ✅ Atomic transactions (safe concurrent updates)
//   ✅ Full read/write permissions
//   ✅ No API key exposure
//   ✅ Perfect for Slack bots

// Client SDK (old approach)
//   ❌ Runs in browser (not ideal for server)
//   ❌ Less safe for concurrent updates
//   ❌ Requires API keys
//   ❌ Limited server-side capabilities

// ==========================================
// BENEFITS OF THIS APPROACH
// ==========================================
// 1. ATOMIC TRANSACTIONS
//    If 10 people award butter simultaneously, all tracked correctly!
//    No race conditions or lost updates.

// 2. REAL-TIME SYNC
//    Changes appear instantly in Firebase Console
//    Multiple instances of your bot stay in sync

// 3. SCALABILITY
//    Handle thousands of users without local file conflicts
//    Firebase handles backups and data integrity

// 4. ANALYTICS
//    View all data changes in Firebase Console in real-time
//    Set up automated backups

// 5. SECURITY
//    No API keys exposed (uses service account)
//    Can set up security rules in Firebase

// ==========================================
// FIREBASE SECURITY RULES (OPTIONAL)
// ==========================================
// Add these rules to Firebase Console > Database > Rules
// to control who can read/write data:
/*
{
  "rules": {
    "royal_vault": {
      "users": {
        ".read": true,
        ".write": "auth.uid != null",
        "$uid": {
          ".validate": "newData.hasChildren(['points', 'title'])",
          "points": { ".validate": "newData.isNumber()" },
          "title": { ".validate": "newData.isString()" }
        }
      },
      "logs": {
        ".read": "auth.uid != null",
        ".write": "auth.uid == $uid",
        "$uid": {
          ".validate": "newData.hasChildren(['date', 'count'])"
        }
      }
    }
  }
}
*/

// ==========================================
// TROUBLESHOOTING
// ==========================================

// Q: "Cannot find module 'firebase-admin'"
// A: Run: npm install firebase-admin

// Q: "Missing GOOGLE_APPLICATION_CREDENTIALS"
// A: Download service account key and set the environment variable
//    OR set FIREBASE_DATABASE_URL in .env

// Q: "Permission denied" errors
// A: Make sure your service account has Realtime Database access
//    In Firebase Console > Service Accounts > Roles: Add "Firebase Realtime Database Admin"

// Q: Data not saving?
// A: Check browser console and Firebase Console for errors
//    Make sure FIREBASE_DATABASE_URL is correct (includes trailing slash!)

// Q: How do I view my data?
// A: Firebase Console > Realtime Database tab - see all your data in real-time!

// ==========================================
// RESOURCES
// ==========================================
// Firebase Admin SDK: https://firebase.google.com/docs/database/admin/start
// Service Account Setup: https://firebase.google.com/docs/admin/setup
// Security Rules: https://firebase.google.com/docs/database/security
// Slack Bolt Docs: https://tools.slack.dev/bolt-js/
