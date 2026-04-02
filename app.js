// THE BREAD BOT
// Main application file for Yeasty the Squire Slack Bot

import http from 'node:http';
import pkg from '@slack/bolt';
import { config } from 'dotenv'; // Load environment variables from .env
import { awardButterPoint, checkButterLimit, getLeaderboard, promoteUser } from './firebase-usage.js'; // Firebase integration logic

// Simple health check server for deployment platforms like Render
http
  .createServer((_req, res) => {
    res.writeHead(200);
    res.end('The Squire is awake.');
  })
  .listen(process.env.PORT || 10000);

const { App, LogLevel } = pkg;

config(); // Load configuration from .env file

// ==========================================
// APP INITIALIZATION LETS GOOOOOOO
// ==========================================
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
});

const KING_ID = process.env.KING_ID || 'U088A4UDCAJ';

// ==========================================
// SLASH COMMANDS TO RULE THEM ALL
// ==========================================

// /decree [text] - Post a stylized message from the King
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

// /proof - Daily Questionaire
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

// /bribe-squire - Easter egg command for random quips
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

/**
 * /butter-up
 * Opens a modal to award Butter Points. 
 * Using a modal ensures we capture the target UID reliably.
 */
app.command('/butter-up', async ({ command, ack, client }) => {
  await ack();

  try {
    const canAward = await checkButterLimit(command.user_id);
    if (!canAward) {
      return await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: "You have used all 3 daily butter rations. Try again tomorrow."
      });
    }

    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: "modal",
        callback_id: "butter_up_modal",
        private_metadata: command.channel_id,
        title: { type: "plain_text", text: "Butter Up a Noble" },
        submit: { type: "plain_text", text: "Butter Them Up" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Choose a noble to bestow with royal butter points."
            }
          },
          {
            type: "input",
            block_id: "user_block",
            label: { type: "plain_text", text: "Select Noble" },
            element: {
              type: "users_select",
              action_id: "selected_user",
              placeholder: { type: "plain_text", text: "Search for a name..." }
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Failed to open butter modal:', error);
  }
});

/**
 * /promote
 * King-only command to grant custom titles via a modal interface.
 */
app.command('/promote', async ({ command, ack, client }) => {
  await ack();

  if (command.user_id !== KING_ID) {
    return await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'Insolence! Only the King can grant titles.',
    });
  }

  try {
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: "modal",
        callback_id: "promote_modal",
        private_metadata: command.channel_id,
        title: { type: "plain_text", text: "Royal Promotion" },
        submit: { type: "plain_text", text: "Grant Title" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "user_block",
            label: { type: "plain_text", text: "Who are we promoting?" },
            element: {
              type: "users_select",
              action_id: "selected_user",
              placeholder: { type: "plain_text", text: "Pick someone worthy..." }
            }
          },
          {
            type: "input",
            block_id: "title_block",
            label: { type: "plain_text", text: "What is their new title?" },
            element: {
              type: "plain_text_input",
              action_id: "title_input",
              placeholder: { type: "plain_text", text: "e.g. Master of Crumbs" }
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Promotion modal failed to open:', error);
  }
});

// ==========================================
// MODAL SUBMISSIONS
// Handles responses for both Butter and Promotion modals
// ==========================================
app.view(/.*/, async ({ ack, body, view, client }) => {
  await ack();

  const callbackId = view.callback_id;
  const giver = body.user.id;
  const channelId = view.private_metadata;

  // Handle Butter Point awarding
  if (callbackId === 'butter_up_modal') {
    const receiver = view.state.values.user_block.selected_user.selected_user;
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
    } catch (e) { 
      console.error('Butter logic failed:', e); 
    }
  }

  // Handle Royal Promotions
  if (callbackId === 'promote_modal') {
    const target = view.state.values.user_block.selected_user.selected_user;
    const newTitle = view.state.values.title_block.title_input.value;

    const success = await promoteUser(target, newTitle);
    if (success) {
      await client.chat.postMessage({
        channel: channelId,
        text: `BY ROYAL DECREE: <@${target}> is now officially known as the **${newTitle}**!`,
      });
    }
  }
});

// /court-rankings - Displays the current leaderboard
app.command('/court-rankings', async ({ ack, client, command }) => {
  await ack();
  const leaderboard = await getLeaderboard();

  const leaderboardText =
    leaderboard.length > 0
      ? leaderboard
          .map((user, i) => {
            return `*${i + 1}.* <${user.userId}> — ${user.points} Butter Point${user.points !== 1 ? 's' : ''} | _${user.title || 'Noble'}_`;
          })
          .join('\n')
      : 'The court is currently empty. No nobles have earned Butter Points yet.';

  await client.chat.postMessage({
    channel: command.channel_id,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "The Royal Leaderboard"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: leaderboardText
        }
      }
    ],
    text: "Behold, the Royal Leaderboard!"
  });
});

// Welcoming new members to the channel
app.event('member_joined_channel', async ({ event, client }) => {
  await client.chat.postMessage({
    channel: event.channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Welcome to the Royal Court, <@${event.user}>!\n\nDelighted to have you join our noble ranks. Feel free to leave if you were kidnaped. `,
        },
      },
    ],
  });
});

// Start the Bolt app
(async () => {
  await app.start();
  console.log('Yeasty the Squire is standing guard (Modal-Enabled).');
})();