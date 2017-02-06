"use strict";

module.exports = {
	Core: require(__dirname + '/microsoftBotConnector'),
	Events: require(__dirname + '/mbf-events'),
	Activity: {
		ConversationUpdate: require(__dirname + '/activity/conversationUpdateActivity'),
		Message: require(__dirname + '/activity/messageActivity')
	},
    Platform: {
        Viber: require(__dirname + '/platform/viber-platform')
    }
};