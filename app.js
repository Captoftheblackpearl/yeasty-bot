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

// /butter-up - Trigger Modal for reliable UID collection
app.command('/butter-up', async ({ command, ack, client }) => {
  await ack();

  try {
    // Check limit first to save them the effort of filling the modal
    const canAward = await checkButterLimit(command.user_id);
    if (!canAward) {
      return await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: "You have used all 3 daily butter rations. Try again tomorrow."
      });
    }

    // Open Modal
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: "modal",
        callback_id: "butter_up_modal",
        private_metadata: command.channel_id, // Store channel ID to post message later
        title: { type: "plain_text", text: "Butter Up a Noble" },
        submit: { type: "plain_text", text: "Butter Them Up" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "user_block",
            label: { type: "plain_text", text: "Which noble deserves butter?" },
            element: {
              type: "users_select",
              action_id: "selected_user",
              placeholder: { type: "plain_text", text: "Select a user" }
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error(error);
  }
});

// Handle Modal Submission
app.view("butter_up_modal", async ({ ack, body, view, client }) => {
  await ack();

  const giver = body.user.id;
  const receiver = view.state.values.user_block.selected_user.selected_user;
  const channelId = view.private_metadata;

  // Note: Self-buttering check remains as it's a logical rule, 
  if (giver === receiver) {
    return await client.chat.postEphemeral({
      channel: channelId,
      user: giver,
      text: "You cannot butter yourself, noble. Find someone else to praise!"
    });
  }

  try {
    const newPoints = await awardButterPoint(receiver);
    if (newPoints !== null) {
      await client.chat.postMessage({
        channel: channelId,
        text: `<@${giver}> has buttered <@${receiver}>!\n*Total Influence:* ${newPoints} Butter Point${newPoints !== 1 ? 's' : ''}`
      });
    }
  } catch (error) {
    console.error('Butter error:', error);
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

  const targetMatch = command.text.match(/[UW][A-Z0-9]{8,12}/);
  const target = targetMatch ? targetMatch[0] : null;
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