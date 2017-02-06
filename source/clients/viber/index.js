'use strict';

// Viber bot specifics
const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;

// Microsoft Bot Framework (MBF) - DirectLine - Connector 
const MbfBotConnector = require('mbf-directline').Core;
const MbfEvents = require('mbf-directline').Events;
const MbfPlatformViber = require('mbf-directline').Platform.Viber;

// Utilities
const winston = require('winston');
const toYAML = require('winston-console-formatter');
require('dotenv').config();

// config items
const ViberBotName = 'MBF Connector';
const ViberBotImageUrl = 'https://raw.githubusercontent.com/devrelv/drop/master/151-icon.png';
const ViberPublicAccountAccessTokenKey = 'xxxxxxxxxxxxxxxxxx';   // ToDo: Replace with your Viber Public Account access token

const MicrosoftBotDirectLineClientName = 'ViberBotConnector';
const MicrosoftBotDirectLineSecret = 'xxxxxxxxxxxxxxxxxxxxxxx';           // ToDo: Replace with your Microsoft Bot Framework DirectLine secret

const WebServerUrl = 'https://YOUR_BOT_SITE_URL';                     // ToDo: This is the URL where the Viber bot is hosted. Has to be an external URL
const WebServerPort = 8080;                                             // ToDo: This is the port of the Viber bot. 


function createLogger() {
    const logger = new winston.Logger({
        level: "debug" // We recommend using the debug level for development
    });

    logger.add(winston.transports.Console, toYAML.config());
    return logger;
}
const logger = createLogger();

// Creating the bot with access token, name and avatar
const bot = new ViberBot(logger, {
    authToken: process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY || ViberPublicAccountAccessTokenKey,
    name: ViberBotName,
    avatar: ViberBotImageUrl
});

// create the MBF bot instance
const mbfBot = new MbfBotConnector(logger, new MbfPlatformViber(), {
    clientName: MicrosoftBotDirectLineClientName, 
    secret: process.env.MICROSOFT_BOT_DIRECT_LINE_SECRET || MicrosoftBotDirectLineSecret, 
    pollInterval: process.env.MICROSOFT_BOT_POLL_INTERVAL || 1000});

mbfBot.on(MbfEvents.MBF_MESSAGE_RECEIVED, function(recipient, message) {
    // send a MBF bot message back to Viber
    bot.sendMessage(recipient, message);
});

bot.onSubscribe(response => {
    // create a connection to the MBF bot
    mbfBot.createNewConversation(response.userProfile);
});

bot.onUnsubscribe(response => {
    mbfBot.closeConversation(response);
})

bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
    // send an user message to the MBF bot
    mbfBot.sendMessage(response.userProfile, message);
});

var webHookUrl = process.env.WEBSERVER_URL || WebServerUrl;
if (webHookUrl) {
    const http = require('http');
    const port = process.env.WEBSERVER_PORT || WebServerPort;

    http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(webHookUrl));
} else {
    logger.debug('Could not find the now.sh/Heroku environment variables. Please make sure you followed readme guide.');
}