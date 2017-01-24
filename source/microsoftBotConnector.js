const EventEmitter = require('events');
const MbfEvents = require('./mbf-events');

const Swagger = require('swagger-client');
const open = require('open');
const directLineSpec = require('./directline-swagger.json');
const mime = require('mime-types');
const url = require('url');
const path = require('path');

// incoming message translation
const TextMessage = require('viber-bot').Message.Text;
const PictureMessage = require('viber-bot').Message.Picture;
const UrlMessage = require('viber-bot').Message.Url;
const ContactMessage = require('viber-bot').Message.Contact;
const VideoMessage = require('viber-bot').Message.Video;
const LocationMessage = require('viber-bot').Message.Location;
const StickerMessage = require('viber-bot').Message.Sticker;
const FileMessage = require('viber-bot').Message.File;

// config items
const defaultPollInterval = 1000;
const defaultDirectLineClientName = 'ViberBotConnector';
const defaultDirectLineSecret = 'xxxxxxxxxxxxxxxxxxxxx'; // ToDo: Replace with your Microsoft Bot Framework DirectLine secret

class MicrosoftBot extends EventEmitter {
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
            let parsedUrl;
            let fileName;
            
            let botMessage = {
                        from: this._directLineClientName,
                        text: viberMessage.text,
                        channelData: viberMessage.toJson(),
                        images: null,
                        attachments: null
                    };

            switch (viberMessage.constructor) {
                case TextMessage:
                    // nothing to do here
                    break;
                case UrlMessage:
                    break;
                case ContactMessage:
                    break;
                case PictureMessage:
                    botMessage.images = [viberMessage.url];
                    
                    parsedUrl = url.parse(viberMessage.url);
                    fileName = path.basename(parsedUrl.pathname);
                    
                    botMessage.attachments = [
                        {
                            "contentType": mime.lookup(fileName),
                            "contentUrl": viberMessage.url,
                            "name": fileName
                        }
                    ];
                    break;
                case VideoMessage:
                    botMessage.images = [viberMessage.url];

                    parsedUrl = url.parse(viberMessage.url);
                    fileName = path.basename(parsedUrl.pathname);
                    
                    botMessage.attachments = [
                        {
                            "contentType": mime.lookup(fileName),
                            "contentUrl": viberMessage.url,
                            "name": fileName
                        }
                    ];
                    break;
                case FileMessage:                    
                    botMessage.attachments = [
                        {
                            "contentType": mime.lookup(viberMessage.filename),
                            "contentUrl": viberMessage.url,
                            "name": viberMessage.filename
                        }
                    ];

                    break;
                case LocationMessage:
                    break;
                case StickerMessage:
                    break;
                default:
                    throw new Error('unknown message type'); 
                    break;
            }

            return botMessage;
        }
    };


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

module.exports.MicrosoftBot = MicrosoftBot;
