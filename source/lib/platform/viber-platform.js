"use strict";

const BotPlatform = require(__dirname + '/bot-platform.js');

class ViberPlatform extends BotPlatform {
    constructor() {
        super();
    };

    convert(channelId, userData, platformMessage) {
        let botActivity;
        let botActivityArguments = { 
                channelId: channelId, senderId: userData.id, 
                senderName: userData.name, conversationAccountId: userData.id,
                locale: userData.language, channelData: platformMessage.toJson() };

        switch (viberMessage.constructor) {
            case TextMessage:
                botActivity = new MessageActivity(
                    {text: platformMessage.text},
                    botActivityArguments);
                break;
            case UrlMessage:
                botActivity = new MessageActivity({}, botActivityArguments);
                break;
            case ContactMessage:
                botActivity = new MessageActivity({}, botActivityArguments);
                break;
            case PictureMessage:           
                botActivity = new MessageActivity(
                    {text: platformMessage.text, mediaUrl: platformMessage.url},
                    botActivityArguments);
                break;
            case VideoMessage:
                botActivity = new MessageActivity(
                    {text: platformMessage.text, mediaUrl: platformMessage.url},
                    botActivityArguments);
                break;
            case FileMessage:                    
                botActivity = new MessageActivity(
                    {mediaUrl: platformMessage.url},
                    botActivityArguments);
                break;
            case LocationMessage:
                botActivity = new MessageActivity({}, botActivityArguments);
                break;
            case StickerMessage:
                botActivity = new MessageActivity({}, botActivityArguments);
                break;
            default:
                throw new Error('unknown message type'); 
                break;
        }

        return botActivity;        
    };

    parse(activity) {
        let viberMsg;

        if (activity.channelData) {
            switch (activity.channelData.contentType) {
                case "image/png":
                    viberMsg = new PictureMessage(
                        activity.channelData.contentUrl, 
                        activity.text, 
                        activity.channelData.thumbnailUrl);
                    break;
                default:
                    // nothing to do
                    break;
            }
        }
        else {
            viberMsg = new TextMessage(activity.text);
        }

        return viberMsg;
    };
}

module.exports = ViberPlatform;