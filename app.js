// ✨ OKAY SO THIS IS THE BREAD BOT ✨
// Imports for literally everything we need to run this thing

import http from 'node:http';
import pkg from '@slack/bolt';
import { config } from 'dotenv'; // Load env variables from .env file (super important!!!)
import { awardButterPoint, checkButterLimit, getLeaderboard, promoteUser } from './firebase-usage.js'; // Firebase Admin SDK functions!

http
  .createServer((_req, res) => {
    res.writeHead(200);
    res.end('The Squire is awake!');
  })
  .listen(process.env.PORT || 10000);

const { App, LogLevel } = pkg; // Slack's main app thingy and logging

config(); // LOAD THE .ENV FILE!!! This has all our secret tokens and stuff

// ==========================================
// DATABASE CONFIGURATION (FIREBASE ADMIN!! 🔥)
// ==========================================
// We store all data in Firebase Realtime Database
// - users: { userId: { points: number, title: string, updatedAt: timestamp }, ... }
// - logs: { userId: { date: YYYY-MM-DD, count: number }, ... }
// This lets us keep track of Butter Points with atomic transactions!
// Firebase handles concurrent updates automatically - no race conditions!

// ==========================================
// APP INITIALIZATION (LET'S GOOOO)
// ==========================================
// This is where we actually create the Slack app instance
// It's like waking up the bot and telling it "okay you're ready to go!!"
const app = new App({
  token: process.env.SLACK_BOT_TOKEN, // The token that lets us talk to Slack
  socketMode: true, // We're using socket mode so the bot can listen for events in real time
  appToken: process.env.SLACK_APP_TOKEN, // Another token that lets us connect via WebSocket
  logLevel: LogLevel.DEBUG, // Show ALL the logs so we can debug stuff if it breaks
});

// ==========================================
// KING CONFIGURATION (👑 THE ROYALTY 👑)
// ==========================================
// Only the KING can use the /promote command and have special powers
// To find your own SLACK_USER_ID, just open your Slack profile and look for "Copy member ID"
// You need to set KING_ID in your .env file or it defaults to a placeholder
const KING_ID = process.env.KING_ID || 'U088A4UDCAJ'; // Replace with your actual Slack User ID

// ==========================================
// SLASH COMMANDS (LITERALLY THE COOLEST PART)
// ==========================================

// 📜 /decree [text] - reposts text in a fancy royal block!
// Makes whatever you say look super official and important lol
// Usage: /decree This is a royal decree
app.command('/decree', async ({ command, ack, client }) => {
  await ack(); // Tell Slack "yep we got your command!"

  // Get what the user typed after /decree
  const decreeText = command.text || 'A silent decree...';

  // Post it back looking all fancy and official
  await client.chat.postMessage({
    channel: command.channel_id,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*A Royal Decree*\n\n> ${decreeText}`, // The > makes it a quote block
        },
      },
    ],
  });
});

// 🍞 /proof - Daily stand-up template for the team
// This posts a nice formatted stand-up template so everyone can respond
// Usage: /proof
app.command('/proof', async ({ command, ack, client }) => {
  await ack(); // Acknowledge we got the command

  // Post the stand-up template with headers and sections
  await client.chat.postMessage({
    channel: command.channel_id,
    blocks: [
      {
        type: 'header', // Make it a big bold header
        text: {
          type: 'plain_text',
          text: '🍞 Daily Stand-Up: Proofing Session',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Thread your replies below:*', // Instructions for the team
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "✅ *Completed:* What did you finish?\n\n🔄 *In Progress:* What are you working on?\n\n🚧 *Blockers:* What's holding you back?",
        },
      },
    ],
  });
});

// 🧈 /bribe-squire [text] - Squire responds with random funny sayings
// This is just for fun lol, the squire says something silly back to you
// Usage: /bribe-squire something funny
app.command('/bribe-squire', async ({ command, ack, client }) => {
  await ack(); // Acknowledge we got the command

  // All the funny things the squire can say
  const squireSayings = [
    'A bribe? I mean... a "generous donation to the yeast fund"!',
    "I didn't see anything, and for that price, neither did you!",
    "I've forgotten all the King's rules!",
    "The King's crown is just a fancy way to hide a receding hairline.",
    'The royal scepter? He uses it to reach the itchy spot on his back. Truly majestic.',
    "Ooh, shiny! Almost as shiny as the King's forehead when he is trying to do basic math.",
    'A bribe! Did you know the King wears a corset under that "breastplate"?',
    'For a small fee, I can make the royal taxes "disappear".',
    'You dare offer me a bribe? I will pretend I did not see this... for a price.',
    '...I sall tell the King of this offence... unless you give me more gold!',
    'I once saw the King try to joust... with a baguette. It was... enlightening.',
    'Did you know the King thinks "kneading dough" is a form of meditation?',
    "I'll take the coin, but you're still dressed like a turnip farmer.",
    "A bribe from *you*? I've seen more gold in a dragon's dental records.",
    "Money can buy my silence, but it clearly can't buy you a sense of style.",
    'Thanks for the tip!',
    "I'd help you overthrow the King, but I'm afraid you'd mess up the paperwork.",
    "I'll take the gold, but no amount of coin can fix the fact that your family tree is a shrub.",
    "This bribe is almost as disappointing as your father/'s face when you were born.",
    "You're lucky I'm corrupt, because your personality wouldn't get you past the castle gatehouse.",
    "It's a good thing you're paying me to listen, because your conversation is about as stimulating as watching bread mold.",
    "I'll keep your secret, but mostly because I don't want people to know I associate with someone who wears... *that* outfit.",
    "You call this a bribe? This wouldn't even buy a stale bagel. GUARDS!",
    'My loyalty to the King is absolute! ...Unless you have another bag of gold in that pocket?',
    "Yeasty the Squire is a man of honor! (Check back in five minutes when I'm hungrier).",
    'I shall tell the King of this offense... unless you double the offer immediately!',
    'The King may be a buffoon, but he pays better than you. Try harder, peasant!',
  ];

  // Pick a random saying
  const randomSaying = squireSayings[Math.floor(Math.random() * squireSayings.length)];

  // Post the squire's response
  await client.chat.postMessage({
    channel: command.channel_id,
    text: `${randomSaying}\n\n_${command.text}_`, // Echo back what the user said
  });
});

// 🧈 /butter-up [@user] - Give someone 1 Butter Point!
// THIS IS THE MAIN COMMAND!!! Features:
//   - Can't butter yourself (duh, no cheating)
//   - Max 3 butters per day per person (rate limiting using Firebase)
//   - Atomic transactions ensure safe concurrent updates
// Usage: /butter-up @username
app.command('/butter-up', async ({ command, ack, client }) => {
  await ack(); // Tell Slack we got this

  // WHO IS GIVING THE BUTTER (the person who ran the command)
  const giver = command.user_id;

  // PARSE THE COMMAND TO FIND WHO THEY'RE BUTTERING
  // <@U12345> is how Slack formats mentions, so we extract the user ID
  const receiverMatch = command.text.match(/<@([A-Z0-9]+)>/);
  const receiver = receiverMatch ? receiverMatch[1] : null;

  // ❌ ERROR CHECK: Make sure they actually mentioned someone
  if (!receiver) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: '🛈 Usage: `/butter-up @username` to award 1 Butter Point',
    });
  }

  // ❌ ABUSE PROTECTION: Can't butter yourself lmaooo
  if (giver === receiver) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: 'You cannot butter yourself! Find a worthy noble to butter instead.',
    });
  }

  // 📊 RATE LIMITING: Check if user has exceeded 3 butters per day (Firebase)
  const canAward = await checkButterLimit(giver);
  if (!canAward) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: "⌛ You've used all 3 daily butter rations! Try again tomorrow.",
    });
  }

  // ✨ FIREBASE TRANSACTION: Award butter point safely
  // Atomic transactions ensure data integrity even with concurrent updates!
  const newPoints = await awardButterPoint(receiver);

  if (newPoints !== null) {
    // 📣 POST A SUCCESS MESSAGE TO THE CHANNEL
    await client.chat.postMessage({
      channel: command.channel_id,
      text: `🧈 <@${giver}> has buttered <@${receiver}>!\n*Total Influence:* ${newPoints} Butter Point${newPoints !== 1 ? 's' : ''}`,
    });
  } else {
    // ❌ ERROR
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: 'Something went wrong! Try again later.',
    });
  }
});

// 👑 /promote [@user] [title] - KING ONLY - Give someone a custom title
// Only the King (set in .env) can use this command
// This lets you manually set someone's title to whatever you want
// Usage: /promote @username Earl of Bread
app.command('/promote', async ({ command, ack, client }) => {
  await ack(); // Acknowledge we got the command

  // 👑 CHECK IF THE PERSON RUNNING THIS IS THE KING
  // If not, we tell them to back off (very rudely lol)
  if (command.user_id !== KING_ID) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: '🚫 *Insolence!* Only the King can grant titles. This matter is reserved for royalty alone.',
    });
  }

  // 👤 PARSE WHO WE'RE PROMOTING (find the @mention)
  const targetMatch = command.text.match(/<@([A-Z0-9]+)>/);
  const target = targetMatch ? targetMatch[1] : null;

  // 📝 GET THE NEW TITLE (everything after the @mention)
  // We remove the @mention and trim the whitespace
  const newTitle = command.text.replace(/<@([A-Z0-9]+)>/, '').trim();

  // ❌ ERROR CHECK: Make sure we have both a user and a title
  if (!target || !newTitle) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: '🛈 Usage: `/promote @username New Title Here`',
    });
  }

  // 🏆 UPDATE USER TITLE IN FIREBASE
  const success = await promoteUser(target, newTitle);

  if (success) {
    // 📣 ANNOUNCE THE PROMOTION TO THE CHANNEL
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

// 👑 /court-rankings - SHOW THE LEADERBOARD!!!
// Displays everyone who has earned Butter Points, sorted from most to least
// Shows their titles and everything
// Usage: /court-rankings
app.command('/court-rankings', async ({ ack, client, command }) => {
  await ack(); // Acknowledge we got the command

  // 🏆 GET LEADERBOARD FROM FIREBASE (automatically sorted!)
  const leaderboard = await getLeaderboard();

  // 📝 BUILD THE LEADERBOARD TEXT
  const leaderboardText =
    leaderboard.length > 0
      ? leaderboard
          .map((user, i) => {
            // i starts at 0, so i+1 gives us 1, 2, 3, etc. for the ranking
            return `*${i + 1}.* <@${user.userId}> — ${user.points} Butter Point${user.points !== 1 ? 's' : ''} | _${user.title}_`;
          })
          .join('\n') // Join all the lines with newlines
      : 'The court is currently empty. No nobles have earned Butter Points yet.'; // Message if no one has any points yet

  // 📣 POST THE LEADERBOARD TO THE CHANNEL
  await client.chat.postMessage({
    channel: command.channel_id,
    blocks: [
      {
        type: 'header', // Big bold header
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
          text: leaderboardText, // The actual leaderboard
        },
      },
    ],
  });
});

// ==========================================
// EVENTS (THINGS THAT HAPPEN AUTOMATICALLY)
// ==========================================

// 👋 member_joined_channel - Welcome new people when they join!
// This event fires automatically whenever someone joins a channel that the bot is in
// It's like the bot saying "hey welcome!!" to new members
app.event('member_joined_channel', async ({ event, client }) => {
  // 📣 POST A WELCOME MESSAGE
  await client.chat.postMessage({
    channel: event.channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Welcome to the Royal Court, <@${event.user}>!\n\nOn behalf of the court and @breadman, we are delighted to have you join our noble ranks.`,
        },
      },
    ],
  });
});

// ==========================================
// START THE BOT!!! 🚀
// ==========================================
// This is where the magic happens - we start the server and it listens for events!
(async () => {
  await app.start(); // TURN ON THE BOT!!!
  console.log('🍞 Yeasty the Squire is standing guard!'); // Log that we're running
})();
