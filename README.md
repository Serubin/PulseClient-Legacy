# PulseClient for PulseSMS
This project is a remake of the original KlinkerApp PulseSMS web client. It's based on the original Open Source (Apache License) implementation. It aims to help fix some of the short comings of the original app as outlined below under **Features**. 

The original app is located at [messenger.klinkerapps.com](https://messenger.klinkerapps.com/). The current hosted version of this app is located at [pulse.serubin.net](https://pulse.serubin.net). 

## Features
As previously mentioned, this app aims to fix some of the short comings of the original web app. Most notably:
* Faster loading time (Async page loading)
* Better refresh times (Uses a high/low refresh based on page focus)
* New and improved compose new message page.
* Improved logic

## TODO
* Archive pages
* Scheduled messages
* Blacklist 
* Settings
* Contact Management
* Account Overview (My Account)

## Privacy
Like the original app, this version does not save any data onto the host server. It's entirely client based.

## Installation
grunt/grunt-cli is required for installation. Run `npm install` to download the dependencies and then `grunt build` to "compile" the javascript.

## License
The original code is proved under the Apache 2.0 license and PulseClient is distributed under the same license as found in the LICENSE file as well as at the top of each file.
