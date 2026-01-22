// 🧈 COMPLETE /butter-up COMMAND EXAMPLE
// Copy this into your app.js to replace the old /butter-up command
// This uses Firebase Admin SDK with atomic transactions and rate limiting!

// Add this import at the top of app.js:
// import { awardButterPoint, checkButterLimit } from './firebase-usage.js';

// ==========================================
// /butter-up COMMAND - COMPLETE IMPLEMENTATION
// ==========================================

/*
app.command('/butter-up', async ({ command, ack, client }) => {
  await ack(); // Tell Slack we got the command
  
  const giver = command.user_id;
  const receiverMatch = command.text.match(/<@([A-Z0-9]+)>/);
  const receiver = receiverMatch ? receiverMatch[1] : null;

  // ❌ VALIDATION: No user mentioned
  if (!receiver) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: '🛈 Usage: `/butter-up @username` to award 1 Butter Point',
    });
  }

  // ❌ ABUSE PROTECTION: Can't butter yourself
  if (giver === receiver) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: 'You cannot butter yourself! Find a worthy noble to butter instead.',
    });
  }

  // 📊 RATE LIMITING: Check 3-per-day limit
  const canAward = await checkButterLimit(giver);
  if (!canAward) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: '⏱️ You\'ve used all 3 daily butter rations! Try again tomorrow.',
    });
  }

  // ✨ FIREBASE TRANSACTION: Award butter safely
  const newPoints = await awardButterPoint(receiver);

  if (newPoints !== null) {
    // 🎉 SUCCESS: Post to channel
    await client.chat.postMessage({
      channel: command.channel_id,
      text: `🧈 <@${giver}> has buttered <@${receiver}>!\\nTotal Influence: ${newPoints} Butter Point${newPoints !== 1 ? 's' : ''}`,
    });
  } else {
    // ❌ ERROR: Firebase transaction failed
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: 'Something went wrong! Try again later.',
    });
  }
});
*/

// ==========================================
// /court-rankings COMMAND - COMPLETE IMPLEMENTATION
// ==========================================

// Add this import at the top of app.js:
// import { getLeaderboard } from './firebase-usage.js';

/*
app.command('/court-rankings', async ({ ack, client, command }) => {
  await ack();
  
  // 📊 GET LEADERBOARD FROM FIREBASE (automatically sorted!)
  const leaderboard = await getLeaderboard();

  // 📝 BUILD LEADERBOARD TEXT
  const leaderboardText =
    leaderboard.length > 0
      ? leaderboard
          .map(
            (user, i) =>
              `*${i + 1}.* <@${user.userId}> — ${user.points} Butter Point${
                user.points !== 1 ? 's' : ''
              } | _${user.title}_`
          )
          .join('\\n')
      : 'The court is currently empty. No nobles have earned Butter Points yet.';

  // 🎨 POST FANCY LEADERBOARD
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
// /promote COMMAND - COMPLETE IMPLEMENTATION
// ==========================================

// Add this import at the top of app.js:
// import { promoteUser } from './firebase-usage.js';

/*
app.command('/promote', async ({ command, ack, client }) => {
  await ack();
  
  // 👑 KING CHECK
  if (command.user_id !== KING_ID) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: '🚫 Only the King can grant titles.',
    });
  }

  // 👤 PARSE THE COMMAND
  const targetMatch = command.text.match(/<@([A-Z0-9]+)>/);
  const target = targetMatch ? targetMatch[1] : null;
  const newTitle = command.text.replace(/<@([A-Z0-9]+)>/, '').trim();

  // ❌ VALIDATION: Both user and title required
  if (!target || !newTitle) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: '🛈 Usage: `/promote @username New Title Here`',
    });
  }

  // ✨ FIREBASE UPDATE: Promote the user
  const success = await promoteUser(target, newTitle);

  if (success) {
    // 🎉 SUCCESS
    await client.chat.postMessage({
      channel: command.channel_id,
      text: `*BY ROYAL DECREE:* <@${target}> is hereby known as the **${newTitle}**!`,
    });
  } else {
    // ❌ ERROR
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'Something went wrong! Try again later.',
    });
  }
});
*/

// ==========================================
// WHY FIREBASE ADMIN SDK IS BETTER
// ==========================================

// ATOMIC TRANSACTIONS 🔒
// ✨ Old way (local JSON file):
//   Problem: If 10 people award butter at same time,
//            you might lose updates (race condition!)
//
// ✨ New way (Firebase Admin with transactions):
//   Guaranteed: All 10 awards are counted correctly!
//   Firebase handles concurrent updates automatically.

// REAL-TIME SYNC 🔄
// ✨ Old way:
//   Only this instance knows about the data.
//   If you run 2 instances of the bot, they don't share data!
//
// ✨ New way:
//   All bot instances see the same data instantly.
//   Perfect for production deployments!

// SCALABILITY 📈
// ✨ Old way:
//   Limited to 1 local file.
//   Doesn't scale to thousands of users.
//
// ✨ New way:
//   Firebase handles unlimited users.
//   Automatic backups and redundancy.

// ==========================================
// DEPLOYMENT READY
// ==========================================

// To deploy to Render/Heroku with Firebase:
// 1. Get service account key from Firebase Console
// 2. Add it as an environment variable (base64 encoded)
// 3. Firebase Admin SDK automatically detects it
// 4. Your bot works perfectly in the cloud!

// Example for Render:
// Environment variable name: GOOGLE_APPLICATION_CREDENTIALS_JSON
// Value: (paste base64 encoded service account key)

// ==========================================
// TESTING LOCALLY
// ==========================================

// 1. Download service account key
// 2. Set environment variable:
//    export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
// 3. Run: npm run dev
// 4. Award butter points and watch them sync to Firebase Console!

// ==========================================
// MONITORING
// ==========================================

// Watch your data in real-time:
// 1. Go to Firebase Console
// 2. Select "Realtime Database"
// 3. See all butter points and titles updated instantly!
// 4. Perfect for debugging and monitoring!
