'use strict';

// Viber bot specifics
const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;

// Microsoft Bot Framework (MBF) - DirectLine - Connector 
// const MicrosoftBot = require('./microsoftBotConnector').MicrosoftBot;
const MicrosoftBot = require('./microsoftBotConnectorNew').MicrosoftBotNew;
const MbfEvents = require('./mbf-events');

// Utilities
const winston = require('winston');
const toYAML = require('winston-console-formatter');
require('dotenv').config();

// config items
const ViberBotName = 'MBF Connector';
const ViberBotImageUrl = 'https://raw.githubusercontent.com/devrelv/drop/master/151-icon.png';
const ViberPublicAccountAccessTokenKey = '456ce8e1b16fe8fb-cdc7645e68d963b6-284759094aefa713';   // ToDo: Replace with your Viber Public Account access token

const MicrosoftBotDirectLineClientName = 'ViberBotConnector';
// const MicrosoftBotDirectLineSecret = 'fPENbGkZbN4.cwA.Y8Y.QMx5qF83hFJk6xgKB1JFrVyQ2jWGKd6TT5WOfbGIDDI'; // MBF Connector bot
const MicrosoftBotDirectLineSecret = 'PGcHkSeuMzY.cwA.aPA.Xc1RkxPevwjx-FILJ7ngm06wJTkMWjR4Y1bETiqJdl4';           // ToDo: Replace with your Microsoft Bot Framework DirectLine secret

const WebServerUrl = 'https://016d8783.ngrok.io';                     // ToDo: This is the URL where the Viber bot is hosted. Has to be an external URL
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
    recipient.send(message);
});

bot.onSubscribe(response => {
    // create a connection to the MBF bot
    mbfBot.createNewConversation(response);
});

bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
    processIncomingMessage(message, response);
});

function processIncomingMessage(message, response) {
    // this sample implementation only supports Viber text messages
    if (!(message instanceof TextMessage)) {
        reply(response, `Sorry. I can only understand text messages.`);
    }
}

bot.onTextMessage(/./, (message, response) => {
    // send a message to the MBF bot
    if (mbfBot) {
        mbfBot.sendMessage(message.text)
    }
});

function reply(response, message) {
    // send the message to the Viber chat client
    response.send(message);
}

var webHookUrl = process.env.NOW_URL || process.env.HEROKU_URL || WebServerUrl;
if (webHookUrl) {
    const http = require('http');
    const port = process.env.PORT || WebServerPort;

    http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(webHookUrl));
} else {
    logger.debug('Could not find the now.sh/Heroku environment variables. Please make sure you followed readme guide.');
}