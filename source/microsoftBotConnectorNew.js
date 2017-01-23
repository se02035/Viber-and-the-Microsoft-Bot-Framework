const EventEmitter = require('events');
const MbfEvents = require('./mbf-events');

const Swagger = require('swagger-client');
const open = require('open');
const directLineSpec = require('./directline-swagger.json');

// incoming message translation
const TextMessage = require('viber-bot').Message.Text;
const PictureMessage = require('viber-bot').Message.Picture;

// config items
const defaultPollInterval = 1000;
const defaultDirectLineClientName = 'ViberBotConnector';
const defaultDirectLineSecret = 'xxxxxxxxxxxxxxxxxxxxx'; // ToDo: Replace with your Microsoft Bot Framework DirectLine secret

class MicrosoftBotNew extends EventEmitter {
    constructor(logger, options) {
        super();

        this._logger = logger;
        this._directLineClientName = options.clientName !== undefined ? options.clientName : defaultDirectLineClientName;
        this._directLineSecrect = options.secret;
        this._pollInterval = options.pollInterval !== undefined ? options.pollInterval : defaultPollInterval;

        this._client;
        this._conversationId;
        this._viberClient;

        this._pollMessages = (client, conversationId) => {
            var self = this;
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
                            messages = messages.filter((m) => m.from !== self._directLineClientName);

                            if (messages.length) {
                                // forward message to viber
                                messages.forEach(forwardMessageToViber, self);
                            }
                        };
                    })
            }, self._pollInterval);
        };

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

            this.emit(MbfEvents.MBF_MESSAGE_RECEIVED, this._viberClient, viberMsg);
        };
    }

    createNewConversation(viberClient) {
        this._viberClient = viberClient;
        var self = this;
        var profile = viberClient.userProfile;

        var logger = this._logger;
        var directLineSecret = this._directLineSecrect;

        // create the directline connection here
        let directLineClient = new Swagger(
            {
                spec: directLineSpec,
                usePromise: true,
            }).then((client) => {
                logger.debug('Swagger client ready');

                // add authorization header
                client.clientAuthorizations.add('AuthorizationBotConnector', new Swagger.ApiKeyAuthorization('Authorization', 'BotConnector ' + directLineSecret, 'header'));
                return client;
            }).catch((err) =>
                logger.error('Error initializing DirectLine client', err));

        // once the client is ready, create a new conversation 
        directLineClient.then((client) => {
            self._client = client;
            self._client.Conversations.Conversations_NewConversation()                              // create conversation
                .then((response) => response.obj.conversationId)                                    // obtain id
                .then((conversationId) => {
                    logger.debug('Conversation ready. ConversationId: ' + conversationId);

                    self._conversationId = conversationId;
                    self._pollMessages(client, conversationId);                                     // start polling messages from bot

                    self.emit(MbfEvents.MBF_CONVERSATION_STARTED, conversationId);
                });
        });
    }

    sendMessage(message) {
        if (this._client == null || this._conversationId == null) {
            this._logger.error('Error sending message: client or conversation not ready');
            return;
        }

        // Step 1: Get conversationId

        // Step 2: Get 

        // send message
        this._client.Conversations.Conversations_PostMessage(
        {
            conversationId: this._conversationId,
            message: {
                from: this._directLineClientName,
                text: message,
                channelData: null,
                images: null,
                attachments: null
            }
        }).catch((err) => this._logger.error('Error sending message:', err));
    }
}

module.exports.MicrosoftBotNew = MicrosoftBotNew;
