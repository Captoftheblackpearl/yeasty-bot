// THE BREAD BOT
// Imports for necessary modules

import http from 'node:http';
import pkg from '@slack/bolt';
import { config } from 'dotenv'; // Load env variables from .env file
import { awardButterPoint, checkButterLimit, getLeaderboard, promoteUser } from './firebase-usage.js'; // Firebase functions

http
  .createServer((_req, res) => {
    res.writeHead(200);
    res.end('The Squire is awake.');
  })
  .listen(process.env.PORT || 10000);

const { App, LogLevel } = pkg;

config(); // LOAD THE .ENV FILE

// ==========================================
// APP INITIALIZATION
// ==========================================
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
});

const KING_ID = process.env.KING_ID || 'U088A4UDCAJ';

// ==========================================
// SLASH COMMANDS
// ==========================================

// /decree [text]
app.command('/decree', async ({ command, ack, client }) => {
  await ack();
  const decreeText = command.text || 'A silent decree...';
  await client.chat.postMessage({
    channel: command.channel_id,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*A Royal Decree*\n\n> ${decreeText}`,
        },
      },
    ],
  });
});

// /proof - Daily stand-up template
app.command('/proof', async ({ command, ack, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: command.channel_id,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Daily Stand-Up: Proofing Session',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Thread your replies below:*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "COMPLETED: What did you finish?\n\nIN PROGRESS: What are you working on?\n\nBLOCKERS: What is holding you back?",
        },
      },
    ],
  });
});

// /bribe-squire
app.command('/bribe-squire', async ({ command, ack, client }) => {
  await ack();
  const squireSayings = [
    'A bribe? I mean... a "generous donation to the yeast fund"!',
    "I didn't see anything, and for that price, neither did you!",
    "I've forgotten all the King's rules!",
    "The King's crown is just a fancy way to hide a receding hairline.",
    'The royal scepter? He uses it to reach the itchy spot on his back.',
    "Ooh, shiny! Almost as shiny as the King's forehead.",
    'A bribe! Did you know the King wears a corset?',
    'Thanks for the tip!',
  ];

  const randomSaying = squireSayings[Math.floor(Math.random() * squireSayings.length)];

  await client.chat.postMessage({
    channel: command.channel_id,
    text: `${randomSaying}\n\n_${command.text}_`,
  });
});

// /butter-up [@user] - Award 1 Butter Point
app.command('/butter-up', async ({ command, ack, client }) => {
  await ack();

  const giver = command.user_id;

  // SQUIRE DIAGNOSTICS
  console.log('--- SQUIRE DIAGNOSTICS ---');
  console.log('RAW TEXT RECEIVED:', JSON.stringify(command.text));
  
  /**
   * ROBUST ID EXTRACTION
   * This handles standard mentions <@U12345>, 
   * mentions with pipes <@U12345|name>, 
   * and escaped characters &lt;@U12345&gt;
   */
  const match = command.text.match(/(?:<@|&lt;@|@)(?<id>[A-Z0-9]+)(?:\||&gt;|>)?/);
  const receiver = match?.groups?.id;

  console.log('EXTRACTED RECEIVER ID:', receiver);
  console.log('---------------------------');

  // 1. Error Check: No receiver found
  if (!receiver) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: `Squire Error: I saw "${command.text}" but could not find a User ID. Please select the user from the Slack menu so their name is properly highlighted.`
    });
  }

  // 2. Error Check: Self-buttering
  if (giver === receiver) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: 'Shields up! You cannot butter yourself. Find a worthy noble to butter instead.'
    });
  }

  try {
    // 3. Check Daily Limit (3 per day)
    const canAward = await checkButterLimit(giver);
    if (!canAward) {
      return await client.chat.postEphemeral({
        channel: command.channel_id,
        user: giver,
        text: "You have used all 3 daily butter rations. Try again tomorrow."
      });
    }

    // 4. Award the Point in Firebase
    const newPoints = await awardButterPoint(receiver);

    if (newPoints !== null) {
      await client.chat.postMessage({
        channel: command.channel_id,
        text: `<@${giver}> has buttered <@${receiver}>!\n*Total Influence:* ${newPoints} Butter Point${newPoints !== 1 ? 's' : ''}`
      });
    }
  } catch (error) {
    console.error('Butter error:', error);
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: giver,
      text: 'The butter churn is jammed. Please contact the royal architect.'
    });
  }
});

// /promote [@user] [title] - KING ONLY
app.command('/promote', async ({ command, ack, client }) => {
  await ack();

  if (command.user_id !== KING_ID) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'Insolence! Only the King can grant titles.',
    });
  }

  const targetMatch = command.text.match(/(?:<@|&lt;@|@)(?<id>[A-Z0-9]+)/);
  const target = targetMatch?.groups?.id;
  const newTitle = command.text.replace(/<.*?>/, '').trim();

  if (!target || !newTitle) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'Usage: /promote @username New Title Here',
    });
  }

  const success = await promoteUser(target, newTitle);

  if (success) {
    await client.chat.postMessage({
      channel: command.channel_id,
      text: `BY ROYAL DECREE: <@${target}> is hereby known as the **${newTitle}**!`,
    });
  }
});

// /court-rankings - Leaderboard
app.command('/court-rankings', async ({ ack, client, command }) => {
  await ack();
  const leaderboard = await getLeaderboard();

  const leaderboardText =
    leaderboard.length > 0
      ? leaderboard
          .map((user, i) => {
            return `*${i + 1}.* <@${user.userId}> — ${user.points} Butter Point${user.points !== 1 ? 's' : ''} | _${user.title || 'Noble'}_`;
          })
          .join('\n')
      : 'The court is currently empty. No nobles have earned Butter Points yet.';

  await client.chat.postMessage({
    channel: command.channel_id,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'The Royal Leaderboard',
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

// member_joined_channel event
app.event('member_joined_channel', async ({ event, client }) => {
  await client.chat.postMessage({
    channel: event.channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Welcome to the Royal Court, <@${event.user}>!\n\nDelighted to have you join our noble ranks.`,
        },
      },
    ],
  });
});

// START THE BOT
(async () => {
  await app.start();
  console.log('Yeasty the Squire is standing guard.');
})();