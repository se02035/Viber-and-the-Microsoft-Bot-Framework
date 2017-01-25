"use strict";

const DefaultServiceUrl = "https://directline.botframework.com/";
const DefaultConversationAccountName = "Viber conversation";
const DefaultLocale = "en";
const DefaultConversationIsGroup = false;
const DefaultConversationName = "Viber Conversation";

class Activity {
    constructor(activityType, requiredArguments) {

        this._type = activityType; // required
        this._localTimestamp = Date.now();
        this._serviceUrl = requiredArguments.serviceUrl !== undefined ? requiredArguments.clientName : DefaultServiceUrl;
        this._channelId = requiredArguments.channelId;
        this._locale = requiredArguments.locale !== undefined ? requiredArguments.locale : DefaultLocale;
        this._channelData = requiredArguments.channelData;
        this._attachments = requiredArguments.attachments;
        
        this._senderId = requiredArguments.senderId;
        this._senderName = requiredArguments.senderName;

        this._conversationIsGroup = requiredArguments.conversationAccountIsGroup !== undefined ? requiredArguments.conversationAccountIsGroup : DefaultConversationIsGroup;
        this._conversationId = requiredArguments.conversationAccountId;
        this._conversationName = requiredArguments.conversationAccountName !== undefined ? requiredArguments.conversationAccountName : DefaultConversationName;
    };

    getBotActivity() {
        return {
            type: this._type,
            localTimestamp: this._localTimestamp,
            serviceUrl: this._serviceUrl,
            channelId: this._channelId,
            from: {
                id: this._senderId,
                name: this._senderName
            },
            conversationAccount: {
                isGroup: this._conversationIsGroup,
                id: this._conversationId,
                name: this._conversationName
            },
            locale: this._locale,
            text: this._text,
            channelData: this._channelData,
            attachments: this._attachments
        };
    }
}

module.exports.Activity = Activity;