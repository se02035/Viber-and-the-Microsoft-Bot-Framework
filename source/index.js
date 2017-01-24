'use strict';

// Viber bot specifics
const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;

// Microsoft Bot Framework (MBF) - DirectLine - Connector 
const MicrosoftBot = require('./microsoftBotConnectorNew').MicrosoftBotNew;
const MbfEvents = require('./mbf-events');

// Utilities
const winston = require('winston');
const toYAML = require('winston-console-formatter');
require('dotenv').config();

// config items
const ViberBotName = 'MBF Connector';
const ViberBotImageUrl = 'https://raw.githubusercontent.com/devrelv/drop/master/151-icon.png';
const ViberPublicAccountAccessTokenKey = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';   // ToDo: Replace with your Viber Public Account access token

const MicrosoftBotDirectLineClientName = 'ViberBotConnector';
const MicrosoftBotDirectLineSecret = 'xxxxxxxxxxxxxxxxxxxxxxxxxxx';           // ToDo: Replace with your Microsoft Bot Framework DirectLine secret

const WebServerUrl = 'HTTPS://YOUR_BOT_SITE';                     // ToDo: This is the URL where the Viber bot is hosted. Has to be an external URL
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
const mbfBot = new MicrosoftBot(logger, {
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

bot.onTextMessage(/./, (message, response) => {
    // send a message to the MBF bot
    if (mbfBot) {
        mbfBot.sendMessage(response.userProfile, message);
    }
});

var webHookUrl = process.env.NOW_URL || process.env.HEROKU_URL || WebServerUrl;
if (webHookUrl) {
    const http = require('http');
    const port = process.env.PORT || WebServerPort;

    http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(webHookUrl));
} else {
    logger.debug('Could not find the now.sh/Heroku environment variables. Please make sure you followed readme guide.');
}