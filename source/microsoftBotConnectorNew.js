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

        this._conntectClientsByConversationId = {};
        this._conversationIdByClientId = {};

        this._pollMessages = (client, conversationId) => {
            var self = this;
            var watermark = null;
            
            setInterval(() => {
                client.Conversations.Conversations_GetMessages({ conversationId: conversationId, watermark: watermark })
                    .then((response) => {
                        watermark = response.obj.watermark;  // use watermark so subsequent requests skip old messages 
                        return response.obj.messages;
                    })
                    .then((messages) => {
                        if (messages && messages.length) {
                            // ignore own messages
                            messages = messages.filter((m) => m.from !== self._directLineClientName);

                            if (messages.length) {
                                // all messages will have the same recipient
                                let recipient = this._conntectClientsByConversationId[messages[0].conversationId];

                                // forward message to viber
                                messages.forEach((msg) => {
                                    this.emit(MbfEvents.MBF_MESSAGE_RECEIVED, recipient, this._toViberMessage(msg));
                                }, self);
                            }
                        };
                    })
            }, this._pollInterval);
        };

        this._toViberMessage = (mbfBotMessage) => {
            let viberMsg;

            if (mbfBotMessage.channelData) {
                switch (mbfBotMessage.channelData.contentType) {
                    case "image/png":
                        viberMsg = new PictureMessage(
                            mbfBotMessage.channelData.contentUrl, 
                            mbfBotMessage.text, 
                            mbfBotMessage.channelData.thumbnailUrl);
                        break;
                    default:
                        // nothing to do
                        break;
                }
            }
            else {
                viberMsg = new TextMessage(mbfBotMessage.text);
            }

            return viberMsg;
        }

        this._toMbfBotMessage = (viberMessage) => {
            let botMessage;
            
            if (viberMessage instanceof TextMessage) {
                botMessage = {
                    from: this._directLineClientName,
                    text: viberMessage.text,
                    channelData: null,
                    images: null,
                    attachments: null
                };
            }
            else {
                throw err;
            }

            return botMessage;
        }
    }

    createNewConversation(userProfile) {
        var up = userProfile;
        var self = this;
        // var profile = viberClient.userProfile;

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
            self._client.Conversations.Conversations_NewConversation()                             
                .then((response) => response.obj.conversationId)  
                .then((conversationId) => {
                    logger.debug('Conversation ready. ConversationId: ' + conversationId);

                    // for lookup purposes
                    self._conntectClientsByConversationId[conversationId] = up;
                    self._conversationIdByClientId[up.id] = conversationId;

                    // start polling for new messages sent by the MBF bot
                    self._pollMessages(client, conversationId);                                     

                    self.emit(MbfEvents.MBF_CONVERSATION_STARTED, conversationId);
                });
        });
    }

    sendMessage(userProfile, message) {
        this._client.Conversations.Conversations_PostMessage(
        {
            conversationId: this._conversationIdByClientId[userProfile.id],
            message: this._toMbfBotMessage(message)
        }).catch((err) => this._logger.error('Error sending message:', err));
    }
}

module.exports.MicrosoftBotNew = MicrosoftBotNew;
