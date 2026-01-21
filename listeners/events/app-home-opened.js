// 🏠 APP HOME OPENED EVENT
// This fires when a user opens the app's home tab
// It's our chance to show them a nice welcome message!
const appHomeOpenedCallback = async ({ client, event, logger }) => {
  // Ignore the `app_home_opened` event for anything but the Home tab
  if (event.tab !== 'home') return;

  try {
    await client.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Welcome home, <@${event.user}> :house:*`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Learn how home tabs can be more useful and interactive <https://api.slack.com/surfaces/tabs/using|*in the documentation*>.',
            },
          },
        ],
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

export { appHomeOpenedCallback };
