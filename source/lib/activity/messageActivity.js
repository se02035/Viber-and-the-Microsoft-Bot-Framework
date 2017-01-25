"use strict";

const mime = require('mime-types');
const url = require('url');
const path = require('path');

const Activity = require(__dirname + '/activity.js').Activity;

class MessageActivity extends Activity {
    constructor(messageArguments, requiredArguments) {
        super("message", requiredArguments);
        
        this._text = messageArguments.text;
        this._mediaUrl = messageArguments.mediaUrl;
    };

    getBotActivity() {
        let activity = super.getBotActivity();

        // text
        activity["text"] = this._text;

        // media urls
        if (this._mediaUrl) {
            let parsedUrl = url.parse(this._mediaUrl);
            let fileName = path.basename(parsedUrl.pathname);

            activity["attachments"] = {
                    "contentType": mime.lookup(fileName),
                    "contentUrl": this._mediaUrl,
                    "name": fileName
                }
        }


        return activity;
    };
}

module.exports.MessageActivity = MessageActivity;