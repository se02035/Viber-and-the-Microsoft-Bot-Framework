var Swagger = require('swagger-client');
var open = require('open');
var directLineSpec = require('./directline-swagger.json');

// incoming message translation
const TextMessage = require('viber-bot').Message.Text;
const PictureMessage = require('viber-bot').Message.Picture;

// config items
var defaultPollInterval = 1000;
var defaultDirectLineClientName = 'ViberBotConnector';
var defaultDirectLineSecret = 'xxxxxxxxxxxxxxxxxxxxx'; // ToDo: Replace with your Microsoft Bot Framework DirectLine secret

function MicrosoftBot(logger, options) {  
    this._logger = logger;

    this._directLineClientName = options.clientName !== undefined ? options.clientName : defaultDirectLineClientName;
    this._directLineSecrect = options.secret;
    this._pollInterval = options.pollInterval !== undefined ? options.pollInterval : defaultPollInterval;

    this._client;
    this._conversationId;
    this._sendBotReply;
}

MicrosoftBot.prototype.createNewConversation = function(sendBotReply) {
    const self = this;

    this._sendBotReply = sendBotReply;

    // create the directline connection here
    var directLineClient = new Swagger(
        {
            spec: directLineSpec,
            usePromise: true,
        }).then((client) => {
            this._logger.debug('Swagger client ready');

            // add authorization header
            client.clientAuthorizations.add('AuthorizationBotConnector', new Swagger.ApiKeyAuthorization('Authorization', 'BotConnector ' + this._directLineSecrect, 'header'));
            return client;
        }).catch((err) =>
            this._logger.error('Error initializing DirectLine client', err));

    // once the client is ready, create a new conversation 
    directLineClient.then((client) => {
        self._client = client;
        self._client.Conversations.Conversations_NewConversation()                              // create conversation
            .then((response) => response.obj.conversationId)                                    // obtain id
            .then((conversationId) => {
                this._logger.debug('Conversation ready. ConversationId: ' + conversationId);

                self._conversationId = conversationId;
                pollMessages(self, client, conversationId);                                     // start polling messages from bot
            });
    });
};

MicrosoftBot.prototype.sendMessage = function(message) {
    if (this._client == null || this._conversationId == null) {
        this._logger.error('Error sending message: client or conversation not ready');
        return;
    }

        // send message
    this._client.Conversations.Conversations_PostMessage(
    {
        conversationId: this._conversationId,
        message: {
            from: this._directLineClientName,
            text: message
        }
    }).catch((err) => this._logger.error('Error sending message:', err));
}

// Poll Messages from conversation using DirectLine client
function pollMessages(botInstance, client, conversationId) {
    var watermark = null;
    setInterval(() => {
        client.Conversations.Conversations_GetMessages({ conversationId: conversationId, watermark: watermark })
            .then((response) => {
                watermark = response.obj.watermark;                                 // use watermark so subsequent requests skip old messages 
                return response.obj.messages;
            })
            .then((messages) => {
                if (messages && messages.length) {
                    // ignore own messages
                    messages = messages.filter((m) => m.from !== botInstance._directLineClientName);

                    if (messages.length) {
                        // forward message to viber
                        messages.forEach(forwardMessageToViber, botInstance);
                    }
                };
            })
    }, botInstance._pollInterval);
}

function forwardMessageToViber(message) {   
    let viberMsg;

    if (message.channelData) {
        switch (message.channelData.contentType) {
            case "image/png":
                viberMsg = new PictureMessage(message.channelData.contentUrl, message.text, message.channelData.thumbnailUrl);
                break;
            default:
                // nothing to do
                break;
        }
    }
    else {
        viberMsg = new TextMessage(message.text);
    }

    this._sendBotReply(viberMsg);
}

module.exports.MicrosoftBot = MicrosoftBot;
