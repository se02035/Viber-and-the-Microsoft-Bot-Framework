
# Connect the Viber bot platform with the Microsoft Bot Framework

Currently, the Microsoft Bot Framework (MBF) provides a couple of channels which enables bot developers to easily connect their bot to a limited number of platforms (e.g. Skype, Facebook Messenger, Telegram, etc). To due the openness of MBF, it is also possible to other applications/platforms. 

This NodeJS solution demonstrates how to connect a Viber bot with Microsoft's Bot Framework (MBF). 

## Prerequisites

- Install Node.js ([https://nodejs.org/en/download/](https://nodejs.org/en/download/ "https://nodejs.org/en/download/"))
- Install the Viber app. Ensure that the version supports 'Public Accounts' (currently, this functioanlity is only available on [Android](https://play.google.com/store/apps/details?id=com.viber.voip&hl=de) or [iOS](https://itunes.apple.com/us/app/viber/id382617920?mt=8)). 
- An Microsoft Bot Framework account (basically, this is a Live/Hotmail/Outlook.com account). Sign up at the Microsoft Bot Framework portal [https://dev.botframework.com/](https://dev.botframework.com/ "https://dev.botframework.com/")
- *(Optional). A Microsoft Azure account if you want use the Azure Bot Service and want to host your bot on Azure. You can start your free trial on this official Azure web page ([https://azure.microsoft.com/en-us/](https://azure.microsoft.com/en-us/ "https://azure.microsoft.com/en-us/"))* 
- *(Optional). A QnA Maker account ([https://qnamaker.ai/](https://qnamaker.ai/ "https://qnamaker.ai/")). This is only required if you want to use the Q&A APIs in your bot implementation.*
 

## The Solution

### Overview
The approached used in this implementation 

### Create a Viber Public Account
Its super easy to create you own public Account. Just apply for a Public Account at [https://www.viber.com/en/public-accounts](https://www.viber.com/en/public-accounts "https://www.viber.com/en/public-accounts"). It shouldn't take too long until your application gets approved (in fact, if everything goes well, it's supposed to be matter of minutes).

Once it's approved start creating your Public Account by following the procedure described on Viber's Developer Hub ([https://developers.viber.com/public-accounts/index.html#public-accounts](https://developers.viber.com/public-accounts/index.html#public-accounts "https://developers.viber.com/public-accounts/index.html#public-accounts")). 

> **Important**: Ensure that you copy your authentication token. This is needed in your bot implementation and allows your Viber bot to integrate with the Public Account platform.

### Create a simple Q&A bot using the Microsoft Bot Framework

For simplicity reasons (and since we want to focus on the Viber integration not the bot itself) we will use one of the available bot templates to create our Q&A bot, called 'MBF-QandA-Bot. 

[This](https://blogs.msdn.microsoft.com/bluesky/2016/12/22/introduction-to-qna-maker-en/) blog article ([https://blogs.msdn.microsoft.com/bluesky/2016/12/22/introduction-to-qna-maker-en/](https://blogs.msdn.microsoft.com/bluesky/2016/12/22/introduction-to-qna-maker-en/ "https://blogs.msdn.microsoft.com/bluesky/2016/12/22/introduction-to-qna-maker-en/")) describes how to create a Q&A bot with no coding and host it on the Azure Bot Service. 

#### Enable Direct Line support

As the MBF doesn't come with a out-of-box Viber channel, we have to use something else here. The MBF's Directline channel acts as a multi-purpose communication channel that enables the integration of MBF bots into any application. 

This channel has to enabled and configured per bot. To do so, go to the Microsoft Bot Framework portal and open the specific in your 'My Bots' collection.

![this is my test image](./doc/img/02-BotService-DirectLine01.PNG)

No scroll down to the available channels and add the 'Direct Line' channel. 

![this is my test image](./doc/img/02-BotService-DirectLine02.PNG)

Create a new Direct Line site, called 'Viber'. Each site comes with a pair of secrets which are required when connecting to this channel. 

![this is my test image](./doc/img/02-BotService-DirectLine03.PNG)

Copy one the secrets (doesn't matter which one you take) as we'll need it in the Viber-MBF connector. When done finish the Direct Line configuration by clicking on the button at the bottom. Once Direct Line is enabled for a bot the channel will have the 'Enabled' property set to 'Yes'

![this is my test image](./doc/img/02-BotService-DirectLine04.PNG)

### Connect the Viber bot with your MBF bot

> Note: Voiber provides some good documentation on how to get started with the bot development on the Viber platform. Just navigate to [Viber's Development Hub](https://developers.viber.com/) ([https://developers.viber.com/](https://developers.viber.com/ "https://developers.viber.com/")) and select your preferred technology ([Node.js](https://developers.viber.com/api/nodejs-bot-api/index.html), [Python](https://developers.viber.com/api/python-bot-api/index.html), [Java](https://developers.viber.com/api/java-bot-api/index.html) or [REST](https://developers.viber.com/api/rest-bot-api/index.html)).

The Viber demo bot described in this repository is Node.js based. Navigate to [https://developers.viber.com/api/nodejs-bot-api/index.html](https://developers.viber.com/api/nodejs-bot-api/index.html "https://developers.viber.com/api/nodejs-bot-api/index.html") to start building your Viber bot. Viber published a demo Viber bot on Github ([https://github.com/Viber/sample-bot-isitup](https://github.com/Viber/sample-bot-isitup "https://github.com/Viber/sample-bot-isitup")). 


## Resources
- Viber Public Accounts ([https://www.viber.com/en/public-accounts](https://www.viber.com/en/public-accounts "https://www.viber.com/en/public-accounts"))
- Viber Developers Hub ([https://developers.viber.com/](https://developers.viber.com/ "https://developers.viber.com/"))
- Azure Bot Service ([https://azure.microsoft.com/en-us/services/bot-service/](https://azure.microsoft.com/en-us/services/bot-service/ "https://azure.microsoft.com/en-us/services/bot-service/"))
