# PulseClient for PulseSMS

## This version is deprecated. The new repo can be found at [Serubin/PulseClient-Vue](https://github.com/Serubin/PulseClient-Vue].

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

### Nginx Config
This goes under the `server` block and must be run at the root of a domain (or subdomain). This requirement may change in the future.
```
    root /var/www/pulse;

    # Add index.php to the list if you are using PHP
    index index.php index.html index.htm index.nginx-debian.html;


    location / {
        index  index.html index.htm;
        try_files $uri $uri/ /index.html?$args;
    }


    location ~* \.(?:ico|css|js|jpe?g|png|gif|svg|pdf|mov|mp4|mp3|woff|html)$ {
        try_files $uri $uri/ =404;
    }
```

## License
The original code is provided under the Apache 2.0 license and PulseClient is distributed under the same license as found in the LICENSE file as well as at the top of each file.

