"use strict";

const EventEmitter = require('events');
const MbfEvents = require(__dirname + '/mbf-events');

const Swagger = require('swagger-client');
const open = require('open');

// ATTENTION this implementation does only support the V3 bots
const directLineSpecV3 = require(__dirname + '/directline-swagger-v3.json');

// Viber Messages
const TextMessage = require('viber-bot').Message.Text;
const PictureMessage = require('viber-bot').Message.Picture;
const UrlMessage = require('viber-bot').Message.Url;
const ContactMessage = require('viber-bot').Message.Contact;
const VideoMessage = require('viber-bot').Message.Video;
const LocationMessage = require('viber-bot').Message.Location;
const StickerMessage = require('viber-bot').Message.Sticker;
const FileMessage = require('viber-bot').Message.File;

// MBF Activities
const MessageActivity = require(__dirname + '/activity/messageActivity.js').MessageActivity;

// config items
const defaultPollInterval = 1000;
const defaultDirectLineClientName = 'ViberBotConnector';
const defaultDirectLineSecret = 'xxxxxxxxxxxxxxxxxxxxx'; // ToDo: Replace with your Microsoft Bot Framework DirectLine secret

class MicrosoftBot extends EventEmitter {
    constructor(logger, platform, options) {
        super();

        this._logger = logger;
        this._platform = platform;

        this._directLineClientName = options.clientName !== undefined ? options.clientName : defaultDirectLineClientName;
        this._directLineSecrect = options.secret;
        this._pollInterval = options.pollInterval !== undefined ? options.pollInterval : defaultPollInterval;
        this._client;

        this._connectedClientsByConversationId = new Map();
        this._conversationIdByClientId = new Map();

        this._pollMessages = (client, conversationId) => {
            var self = this;
            var watermark = null;
            
            setInterval(() => {
                client.Conversations.Conversations_GetActivities({ conversationId: conversationId, watermark: watermark })
                    .then((response) => {
                        watermark = response.obj.watermark;  // use watermark so subsequent requests skip old messages 
                        return response.obj.activities;
                    })
                    .then((activities) => {
                        if (activities && activities.length) {
                            // get the right Viber recipient for this conversation
                            let recipient = this._connectedClientsByConversationId.get(activities[0].conversation.id);
                            if (recipient) {

                                // ignore own messages -- only show replies to my messages
                                activities = activities.filter((a) => a.from.id !== recipient.id);

                                if (activities.length) {
                                    // forward message to viber
                                    activities.forEach((activity) => {
                                        this.emit(MbfEvents.MBF_MESSAGE_RECEIVED, recipient, this._platform.parse(activity));
                                    }, self);
                                }
                            }
                        };
                    })
            }, this._pollInterval);
        };

        this._postActivity = (conversationId, activity) => {
            this._client.Conversations.Conversations_PostActivity(
            {
                conversationId: conversationId,
                activity: activity.getBotActivity()
            }).catch((err) => this._logger.error('Error sending message:', err));
        };

        this._createNewConversation = (userProfile) => {
            var self = this;

            self._client.Conversations.Conversations_StartConversation()                             
                .then((response) => response.obj.conversationId)  
                .then((conversationId) => {
                    logger.debug('Conversation ready. ConversationId: ' + conversationId);

                    // for lookup purposes
                    self._connectedClientsByConversationId.set(conversationId, userProfile);
                    self._conversationIdByClientId.set(userProfile.id, conversationId);

                    // start polling for new messages sent by the MBF bot
                    self._pollMessages(self._client, conversationId);                                     

                    self.emit(MbfEvents.MBF_CONVERSATION_STARTED, conversationId);
                }).catch((err) => logger.error('Error initializing DirectLine conversation', err));
        };
    };

    createNewConversation(userProfile) {
        var up = userProfile;
        var self = this;

        var logger = this._logger;
        var directLineSecret = this._directLineSecrect;

        // create the directline connection here
        let directLineClient = new Swagger(
            {
                spec: directLineSpecV3,
                usePromise: true,
            }).then((client) => {
                logger.debug('Swagger client ready');

                // add authorization header
                client.clientAuthorizations.add('AuthorizationBotConnector', new Swagger.ApiKeyAuthorization('Authorization', 'Bearer ' + directLineSecret, 'header'));
                
                return client;
            }).catch((err) =>
                logger.error('Error initializing DirectLine client', err));

        // once the client is ready, create a new conversation 
        directLineClient.then((client) => {
            this._client = client;
            this._createNewConversation(up);
        });
    }

    closeConversation(clientId) {
        let conversationId = this._conversationIdByClientId.get(clientId);
        
        this._conversationIdByClientId.delete(clientId);
        // ensure that there is already a conversation
        if (conversationId !== undefined) {
            this._connectedClientsByConversationId.delete(conversationId);
        }
    }

    sendMessage(userProfile, message) {
        let conversationId = this._conversationIdByClientId.get(userProfile.id);
        let userMessage = this._platform.convert(conversationId, userProfile, message);

        this._postActivity(conversationId, userMessage);
    }
}

module.exports = MicrosoftBot;
