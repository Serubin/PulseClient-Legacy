
var config = {
    base_url: "/",
    refresh_rate_high: 20000,
    refresh_rate_low: 2500,
    refresh_rate: 2500,
    load_limit: 60,   
    firebase_config: { // Firebase 
        apiKey: "AIzaSyB0pMWyfvde4mbKO20t23EEGECEb5itD7I",
        authDomain: "messenger-42616.firebaseapp.com",
        databaseURL: "https://messenger-42616.firebaseio.com",
        storageBucket: "messenger-42616.appspot.com",
    },
}


firebase.initializeApp(config.firebase_config);



function Conversations(data, $elem) {
    var page_id;

    if(typeof $elem == "undefined") 
        $elem = $("#conversation-list");


    var $toolbar_title      = $("#toolbar-title");
    var $navd_title         = $("#nav-drawer-title");
    var $navd_subtitle      = $("#nav-drawer-subtitle");
    var $refresh_btn        = $("#refresh-button");

    function constructor() {
        
        if ($("[data-conversation-list=true]").length > 0 )
            $("[data-conversation-list=true]").remove();

        page_id = "conversationlist" + new Date();
        current_page_id = page_id;

        // Set page title
        document.title = "Pulse";
        $toolbar_title.html("Pulse");
        $navd_title.html(localStorage.getItem("name"));
        $navd_subtitle.html(
            formatPhoneNumber(localStorage.getItem("phone_number"))
        );

        $refresh_btn.click(function() {
            $elem.empty();
            $elem.html("<div class=\"spinner\" id=\"loading\">"
                + "<div class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active\"></div>"
                + "</div>");
            
            refreshConversations();
        });

        refreshConversations();
    }

    function refreshConversations() {
        $.get(getBaseUrl() + "/api/v1/conversations/" + getIndex() + "?account_id=" + account_id)
            .done(renderConversation)
            .fail(failed);
    }

    function getIndex() { // TODO, archived support
        return "index_unarchived";
    }
    
    function renderConversation(data) {

        // Create element
        $elem.attr("data-conversation-list", "true");
        $elem.html(""); // Clear contents

        var loading = $("#loading");
        if (loading) {
            loading.remove();
        }
        
        var conversations = [];

        var $pinned_wrap = $("<div></div>").attr("id", "pinned");  
        var $pinned_title = $("<div></div>").addClass("label")
                        .addClass("mdl-color-text--grey-500")
                        .html("Pinned");
            $pinned_wrap.append($pinned_title);

        var $convo_title = $("<div></div>").addClass("label")
                        .addClass("mdl-color-text--grey-500")
                        .html("Conversations");


        for (var i = 0; i < data.length; i++) {
            
            var convo = data[i];
            var read_style      = convo.read ? "" : " bold"

            // if we have multiple items in a row with the same id, don't display any after the first
            if (i != 0 && convo.device_id == data[i - 1].device_id) 
                continue;
            
        

            if (i == 0 && convo.pinned) {
                $elem.append($pinned_wrap);
                $elem.append($convo_title);
            }


            try {
                convo.title = decrypt(convo.title);
            } catch (err) {
                continue;
            }

            try {
                convo.snippet = decrypt(convo.snippet).replace(/<.*>/g, "");
            } catch (err) {
                convo.snippet = "";
            }

            try {
                convo.phone_numbers = decrypt(convo.phone_numbers);
            } catch (err) {
                convo.phone_numbers = "";
            }

            convo.color         = toColor(convo.color);
            convo.color_dark    = toColor(convo.color_dark);
            convo.color_accent  = toColor(convo.color_accent);
            
            $convo_wrap  = $("<div></div>").addClass("conversation-card mdl-card")
                            .addClass("mdl-shadow--2dp mdl-js-button")
                            .addClass("mdl-js-ripple-effect")
                            .attr("id", convo.device_id);

            $icon       = "<svg class=\"contact-img\" height=\"48\" width=\"48\">"
                        + "<circle cx=\"24\" cy=\"24\" r=\"24\" shape-rendering=\"auto\" fill=\"" + (hasGlobalTheme() ? globalColor : data[i].color) + "\"/>"
                        + "</svg>";

            $text_wrap  = $("<p></p>").addClass("conversation-text");

            $title      = $("<span></span>").addClass("conversation-title mdl-card__supporting-text")
                            .addClass(read_style)
                            .html(convo.title);

            $break      = $("<br />");

            $snippet    = $("<span></span>").addClass("conversation-snippet mdl-card__supporting-text")
                            .addClass(read_style)
                            .html(convo.snippet);

            $text_wrap.append($title, $break, $snippet);
            $convo_wrap.append($icon, $text_wrap);
            
            if (convo.pinned) 
                $pinned_wrap.append($convo_wrap);
            else
                $elem.append($convo_wrap);
            
            conversations.push(convo);
        }

        if (conversations.length == 0) {
            $elem.html("<div class=\"empty\"><div class=\"empty-text\">"
                + "No conversations to display!"
                + "</div></div>");

            return
        }

        for (var i = 0; i < conversations.length; i++) {
            var convo = conversations[i];
            $("#" + convo.device_id).on('click', {
                deviceId: convo.device_id,
                title: convo.title,
                color: convo.color,
                colorDark: convo.color_dark,
                colorAccent: convo.color_accent,
                phoneNumbers: convo.phone_numbers,
                read: convo.read,
                archived: convo.archive
            }, function(event) {
                localStorage.setItem(event.data.deviceId + "title", event.data.title);
                localStorage.setItem(event.data.deviceId + "color", event.data.color);
                localStorage.setItem(event.data.deviceId + "colorDark", event.data.colorDark);
                localStorage.setItem(event.data.deviceId + "colorAccent", event.data.colorAccent);
                localStorage.setItem(event.data.deviceId + "phoneNumbers", event.data.phoneNumbers);

                if (!event.data.read) 
                    $.post(getBaseUrl() + "/api/v1/conversations/read/" + event.data.deviceId + "?account_id=" + account_id);

                    setPage(PAGE_THREAD + "/"
                        + event.data.deviceId 
                        + (event.data.archived ? "/archived" : ""));
                
            });
        }

        componentHandler.upgradeElements($elem);
    }

    function updateConversation($elem) {

    }


    constructor();
}




/**
 * Enables initial theme
 */
function enableTheme() {
    setGlobalColor();

    var baseTheme = getBaseTheme();
    if (baseTheme === "dark" || (baseTheme === "day_night" && isNight()) || baseTheme === "black") {
        textClass = "mdl-color-text--white";
        $('head').append('<link rel="stylesheet" href="resources/css/themed-dark.css" type="text/css" />');
        $('.mdl-color-text--grey-900').addClass(textClass).removeClass('mdl-color-text--grey-900');

        if (baseTheme === "black") {
            $('head').append('<link rel="stylesheet" href="resources/css/themed-black.css" type="text/css" />');
        }
    } else {
        textClass = "mdl-color-text--grey-900";
    }

    $(".empty").css("background-color", globalColor);
    $(".mdl-layout__header").css("background-color", globalColor);
    $(".mdl-color--primary").css("background-color", globalColor);
    $("#nav-drawer-title").css("background-color", globalColorDark);
    $("#nav-drawer-subtitle").css("background-color", globalColorDark);
    $("#compose").css("background-color", globalColorAccent);
}

function decrypt(data) {
    if (data == null) {
        return "";
    }

    var parts = data.split("-:-");
    return sjcl.codec.utf8String.fromBits(sjcl.mode.cbc.decrypt(aes, sjcl.codec.base64.toBits(parts[1]), sjcl.codec.base64.toBits(parts[0]), null));
}

function decryptToBase64(data) {
    if (data == null) {
        return "";
    }

    var parts = data.split("-:-");
    return sjcl.codec.base64.fromBits(sjcl.mode.cbc.decrypt(aes, sjcl.codec.base64.toBits(parts[1]), sjcl.codec.base64.toBits(parts[0]), null));
}

function random128Hex() {
    function random16Hex() {
        return (0x10000 | Math.random() * 0x10000).toString(16).substr(1); }
    return random16Hex() + random16Hex() + random16Hex() + random16Hex() +
        random16Hex() + random16Hex() + random16Hex() + random16Hex();
}

function toBitArrayCodec(bytes) {
    var out = [], i, tmp=0;
    for (i=0; i<bytes.length; i++) {
        tmp = tmp << 8 | bytes[i];
        if ((i&3) === 3) {
            out.push(tmp);
            tmp = 0;
        }
    }
    if (i&3) {
        out.push(sjcl.bitArray.partial(8*(i&3), tmp));
    }
    return out;
}

function encrypt(data) {
    var iv = sjcl.codec.hex.toBits(random128Hex());
    var cipherbits = sjcl.mode.cbc.encrypt(aes, sjcl.codec.utf8String.toBits(data), iv, null);
    return sjcl.codec.base64.fromBits(iv) + "-:-" + sjcl.codec.base64.fromBits(cipherbits);
}

function encryptData(data) {
    var iv = sjcl.codec.hex.toBits(random128Hex());
    var bits = toBitArrayCodec(data);
    var cipherbits = sjcl.mode.cbc.encrypt(aes, bits, iv, null);
    return sjcl.codec.base64.fromBits(iv) + "-:-" + sjcl.codec.base64.fromBits(cipherbits);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId() {
    return getRandomInt(1, 922337203685477);
}

function formatPhoneNumber(phone) {
    if (!phone) {
        return "";
    }

    if (phone.length > 12) {
        return phone;
    }

    phone = phone.replace(/[^\d]/g, "");
    if (phone.length == 10) {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    } else if (phone.length == 11) {
        return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, "+$1 ($2) $3-$4");
    }

    return phone;
}

function toColor(num) {
    num >>>= 0;
    var b = num & 0xFF,
        g = (num & 0xFF00) >>> 8,
        r = (num & 0xFF0000) >>> 16,
        a = ((num & 0xFF000000) >>> 24) / 255;
    return "rgba(" + [r, g, b, a].join(",") + ")";
}

function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.hash.split('?')[1]),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

function getBaseUrl() {
        return "https://api.messenger.klinkerapps.com";
}

var failed = function(xhr, textstatus, errorThrown) {
    showSnackbar("Operation failed :(");
}

/**
* Show's snack bar.
* Allows for data object OR string
* @param message - str or data
*/
function showSnackbar(message) {
    var data = {}

    if(typeof message == "string")
        data = { message: message };
    else
        data = message

    var snackbarContainer = document.querySelector('#snackbar');
    snackbarContainer.MaterialSnackbar.showSnackbar(data);
}

function showConfirmDialog(message, func) {
  $("body").append(
    "<div class=\"confirm\">" +
          "<div class=\"confirm-card mdl-card mdl-shadow--2dp\">" +
              "<div class=\"mdl-card__supporting-text\">" + message + "</div>" +
              "<span class=\"button-bar\">" +
                "<button id=\"ok\" class=\"mdl-button mdl-js-button mdl-button--accent\">Yes</button>" +
                "<button id=\"cancel\" class=\"mdl-button mdl-js-button mdl-button--accent\">Cancel</button>" +
              "</span>" +
          "</div>" +
      "</div>");

  componentHandler.upgradeDom();

  $("#ok").click(function() {
    func();
    $(".confirm").remove();
  });

  $("#cancel").click(function() {
    $(".confirm").remove();
  });
}

/**
 * Scrolls message wrapper to bottom
 */
function scrollToBottom() {
    var $message_wrap         = $("#message-list-wrapper");

    $message_wrap.animate({"scrollTop": $('.mdl-layout__content')[0].scrollHeight}, 0);
}

/**
* Contains element
* @param element value
*/
Array.prototype.contains = function(element) {
    return this.indexOf(element) > -1 ? true : false
}


String.prototype.ucFirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// CONST
var PAGE_LOGIN      = "login";
var PAGE_THREAD     = "thread";
var PAGE_LIST       = "conversations";

var $content;
var $insert;
var $back_btn;
var $more_btn;

var account_id = localStorage.getItem("account_id");
var page;
var g_setPage;

var key;
var combindedKey;
var aes;

var last_page;
var current_page_id;

$(Init);

function Init(){

    var $navd_title         = $("#nav-drawer-title");
    var $navd_subtitle      = $("#nav-drawer-subtitle");
    var $content            = $("#content");
    var $inserted           = null
    account_id              = localStorage.getItem("account_id");
    $back_btn               = $("#back-button");
    $more_btn               = $("#more-button");

    $(window).on('load', loadPage);
    $(window).on('hashchange', loadPage);
    $(window).on('popstate', loadPage);

    function constructor() {
        if (account_id == null) 
            setPage(config.base_url + PAGE_LOGIN);
        else {
            // Set up encryption
            combinedKey     = account_id + ":" + localStorage.getItem("hash") + "\n";
            key             = sjcl.misc.pbkdf2(combinedKey, localStorage.getItem("salt"), 10000, 256, hmacSHA1);
            aes             = new sjcl.cipher.aes(key);
            sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();
        }   
        
        // Set up base title
        $navd_title.html(localStorage.getItem("name"));
        $navd_subtitle.html(
            formatPhoneNumber(localStorage.getItem("phone_number"))
        );

        enableTheme();

        $back_btn.hide(); // Hide back button by default
        $more_btn.hide(); // Hide back button by default

    }
    
    
    
    function setPage(url, push_state) {
        if(typeof push_state == "undefined" || push_state)
            history.pushState({}, '', window.location.href.slice(0, window.location.href.lastIndexOf(window.location.pathname)) + config.base_url + url);

        loadPage(config.base_url + url);
    }

    function loadPage(url){
        // Parse url
        var data; // Url data

        if(typeof url != "string")
            url = window.location.pathname;
        
        // Remove base url (base path)
        if (url.indexOf(config.base_url) == 0)
            url = url.slice(config.base_url.length, url.length)
        
        // Split for use
        url         = url.split('/');
        page        = url[0];
        url_data    = url.splice(1, url.length);


        // Do nothing if the page is the same
        if(window.location.pathname === last_page)
            return;

        // Handle index
        if(page == "") 
            page = PAGE_LIST;

        // Update  variables on page load
        last_page = window.location.pathname;
        
            
        // Redirect to login if token isn't set.
        if(account_id == null && page != PAGE_LOGIN) 
            return setPage(PAGE_LOGIN);

        
        var sectionFunc = window[page.ucFirst()]; // Get function
        if(typeof sectionFunc != "function") // Exec function
            return setPage(PAGE_LIST);

        $.get(config.base_url + "pages/" + page.toLowerCase() + ".html", success);

        function success(data){
            if ($inserted != null) {
                $inserted.off();
                $inserted.remove();
            }

            $inserted = $(data);
            $inserted.attr("data-content", "inserted");

            $content.append($inserted);
            
            componentHandler.upgradeElements($("[data-content=inserted]"));

            sectionFunc(url_data);
        }
    }
    
    window.setPage = setPage

    constructor();
}

function Login() {
    var $password   = $("#password");
    var $login      = $("#login");

    function constructor() {
        $login.on('click', function() {
            username = $("#username").val();
            password = $("#password").val();
            $.post(getBaseUrl() + "/api/v1/accounts/login", { username: username, password: password })
                .done(store_data)
                .fail(failed_login);
        });

        $login.on('keyup', function(event){
            if(event.keyCode == 13)
                $login.click();
        });
    }

    function store_data(data) {
        var derivedKey1 = sjcl.misc.pbkdf2(password, data.salt2, 10000, 256, hmacSHA1);
        var base64Key = sjcl.codec.base64.fromBits(derivedKey1);

        localStorage.setItem("account_id", data.account_id);
        localStorage.setItem("hash", base64Key);
        localStorage.setItem("salt", data.salt1);
        localStorage.setItem("phone_number", data.phone_number);
        localStorage.setItem("name", data.name);
        localStorage.setItem("global_color_theme", data.global_color_theme);
        localStorage.setItem("base_theme", data.base_theme);
        localStorage.setItem("rounder_bubbles", data.rounder_bubbles + "");
            

        combinedKey     = account_id + ":" + localStorage.getItem("hash") + "\n";
        key             = sjcl.misc.pbkdf2(combinedKey, localStorage.getItem("salt"), 10000, 256, hmacSHA1);
        aes             = new sjcl.cipher.aes(key);
        sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

        if (getUrlParameter("activate") == "true") {
            window.location.replace("activate.html"); //TODO fix urls
        } else {
            window.location.hash = "#!" + PAGE_LIST;
        }
    }

    function failed_login(xhr, textstatus, errorThrown) {
        var snackbarContainer = document.querySelector('#snackbar');
        snackbarContainer.MaterialSnackbar.showSnackbar({message: "Login failed"});
    }
    
    constructor(); // Start class
}

var globalColor, globalColorDark, globalColorAccent, textClass;
    
/**
 * Enables initial theme
 */
function enableTheme() {
    setGlobalColor();

    var baseTheme = getBaseTheme();
    if (baseTheme === "dark" || (baseTheme === "day_night" && isNight()) || baseTheme === "black") {
        textClass = "mdl-color-text--white";
        $('head').append('<link rel="stylesheet" href="resources/css/themed-dark.css" type="text/css" />');
        $('.mdl-color-text--grey-900').addClass(textClass).removeClass('mdl-color-text--grey-900');

        if (baseTheme === "black") {
            $('head').append('<link rel="stylesheet" href="resources/css/themed-black.css" type="text/css" />');
        }
    } else {
        textClass = "mdl-color-text--grey-900";
    }

    $(".empty").css("background-color", globalColor);
    $(".mdl-layout__header").css("background-color", globalColor);
    $(".mdl-color--primary").css("background-color", globalColor);
    $("#nav-drawer-title").css("background-color", globalColorDark);
    $("#nav-drawer-subtitle").css("background-color", globalColorDark);
    $("#compose").css("background-color", globalColorAccent);
}

function hasGlobalTheme() {
    var globalTheme = localStorage.getItem("global_color_theme");
    return globalTheme !== null && globalTheme !== "default";
}

function getBaseTheme() {
    return localStorage.getItem("base_theme");
}

function hasRounderBubbles() {
    return localStorage.getItem("rounder_bubbles") === "true";
}

function isNight() {
    var date = new Date();
    var hours = date.getHours();
    return hours < 7 || hours >= 20;
}

function setGlobalColor() {
    var globalTheme = localStorage.getItem("global_color_theme");
    if (globalTheme === null || globalTheme === "default") {
        return;
    } else if (globalTheme === "red") {
        globalColor = "#F44336";
        globalColorDark = "#C62828";
        globalColorAccent = "#536DFE";
    } else if (globalTheme === "pink") {
        globalColor = "#E91E63";
        globalColorDark = "#AD1457";
        globalColorAccent = "#AEEA00";
    } else if (globalTheme === "purple") {
        globalColor = "#9C27B0";
        globalColorDark = "#6A1B9A";
        globalColorAccent = "#00BFA5";
    } else if (globalTheme === "deep_purple") {
        globalColor = "#673AB7";
        globalColorDark = "#4527A0";
        globalColorAccent = "#FF4081";
    } else if (globalTheme === "indigo") {
        globalColor = "#3F51B5";
        globalColorDark = "#283593";
        globalColorAccent = "#FFD600";
    } else if (globalTheme === "blue") {
        globalColor = "#2196F3";
        globalColorDark = "#1565C0";
        globalColorAccent = "#FF6E40";
    } else if (globalTheme === "light_blue") {
        globalColor = "#03A9F4";
        globalColorDark = "#0277BD";
        globalColorAccent = "#E040FB";
    } else if (globalTheme === "cyan") {
        globalColor = "#00BCD4";
        globalColorDark = "#00838F";
        globalColorAccent = "#FFD740";
    } else if (globalTheme === "teal") {
        globalColor = "#009688";
        globalColorDark = "#00695C";
        globalColorAccent = "#FF4081";
    } else if (globalTheme === "green") {
        globalColor = "#4CAF50";
        globalColorDark = "#2E7D32";
        globalColorAccent = "#40C4FF";
    } else if (globalTheme === "light_green") {
        globalColor = "#8BC34A";
        globalColorDark = "#558B2F";
        globalColorAccent = "#FFAB40";
    } else if (globalTheme === "lime") {
        globalColor = "#CDDC39";
        globalColorDark = "#AFB42B";
        globalColorAccent = "#448AFF";
    } else if (globalTheme === "yellow") {
        globalColor = "#FDD835";
        globalColorDark = "#F9A825";
        globalColorAccent = "#FF5252";
    } else if (globalTheme === "amber") {
        globalColor = "#FFC107";
        globalColorDark = "#FF8F00";
        globalColorAccent = "#00B8D4";
    } else if (globalTheme === "orange") {
        globalColor = "#FF9800";
        globalColorDark = "#EF6C00";
        globalColorAccent = "#7C4DFF";
    } else if (globalTheme === "deep_orange") {
        globalColor = "#FF5722";
        globalColorDark = "#D84315";
        globalColorAccent = "#64DD17";
    } else if (globalTheme === "brown") {
        globalColor = "#795548";
        globalColorDark = "#4E342E";
        globalColorAccent = "#FFAB40";
    } else if (globalTheme === "gray") {
        globalColor = "#9E9E9E";
        globalColorDark = "#757575";
        globalColorAccent = "#69F0AE";
    } else if (globalTheme === "blue_gray") {
        globalColor = "#607D8B";
        globalColorDark = "#37474F";
        globalColorAccent = "#FF5252";
    } else if (globalTheme === "black") {
        globalColor = "#000000";
        globalColorDark = "#000000";
        globalColorAccent = "#00BFA5";
    }
}


/*
 * Thread - PulseSms client
 * @author Solomon Rubin (Serubin.net)
 */

function Thread(data) {
    var $parent = $("[data-content=inserted]");

    // Page id
    var page_id;

    // static options
    var latestTimestamp     = 0;
    
    // global tracking vars
    var initial_load        = true;
    var currently_displayed = [];
    
    // Parameters
    var conversation_id     = 0
    var archived            = null;
    if (data.length >= 1)
        conversation_id     = data[0];

    if (data.length >= 2 && data[1].toLowerCase() == "archived")
        archived            = "true";

    var title               = localStorage.getItem(conversation_id + "title");

    // Theming info
    var color               = hasGlobalTheme() ? 
                               globalColor : 
                                localStorage.getItem(conversation_id + "color");
    var colorDark           = hasGlobalTheme() ? 
                               globalDarkColor : 
                                localStorage.getItem(conversation_id + "colorDark");
    var colorAccent         = hasGlobalTheme() ? 
                               globalAccentColor : 
                                localStorage.getItem(conversation_id + "colorAccent");
    var phoneNumbers        = localStorage.getItem(conversation_id + "phoneNumbers");
    var msg_theme           = (hasRounderBubbles() ? "message-round " : "message ");

    // DOM objects  
    var snackbarContainer   = document.querySelector('#snackbar');
    var $msg_entry          = $("#message-entry");
    var $send_btn           = $("#send-button");
    var $refresh_btn        = $("#refresh-button");
    var $mlist_wrap         = $("#message-list-wrapper");
    var $msg_list           = $("#message-list");
    var $archive_conver     = $("#archive-conversation");
    var $toolbar            = $("#toolbar");
    var $toolbar_title      = $("#toolbar-title");
    var $draggable          = $("#draggable");
    var $delete_btn         = $("#delete-conversation");
    var $emoji_btn          = $("#emoji");
    var $attach             = $("#attach");
    var $navd_title         = $("#nav-drawer-title");
    var $navd_subtitle      = $("#nav-drawer-subtitle");
    
    function constructor() {
        
        Conversations(null, $("#side-menu-insert"));

        page_id = "thread" + conversation_id + new Date();
        current_page_id = page_id;

        // Set conversation Title
        document.title = "Pulse - " + title;
        $navd_title.html(title);
        $navd_subtitle.html(formatPhoneNumber(phoneNumbers));

        $toolbar_title.html(title);

        $toolbar.css("background-color", color);
        $navd_title.css("background-color", colorDark);
        $navd_subtitle.css("background-color", colorDark);
        $send_btn.css("background-color", colorAccent);
        $("head").append("<meta name=\"theme-color\" content=\"" + colorDark + "\">")
    
        
        $back_btn.show(); // Hide back button by default
        $more_btn.show(); // Hide back button by default
        
        $back_btn.on('click', function() {
            setPage(PAGE_LIST)
        });

        if (archived === 'true') {
            $back_btn.click(function() {
                setPage(PAGE_LIST + "/archived");
            });
            $archive_conver.html("Move to Inbox");
        }

        // EVENTS
        //TODO on focus, up the refresh amount and refresh immidately
        //TODO on blur, reduce
        //TODO these changes assume someone is using the chrome extention for notifications
        // Window events    
        $(window).on('focus', function() {
            $msg_entry.focus();
        });

        // On Drag/Dropa events 
        $parent.on('drag dragstart dragend dragover dragenter dragleave drop', '#message-list-wrapper', function(e) {
            e.preventDefault();
            e.stopPropagation();
        })
        .on('dragover dragenter', '#message-list-wrapper' ,function() {
            $draggable.addClass("is-dragover");
        })
        .on('dragleave dragend drop', '#message-list-wrapper', function() {
            $draggable.removeClass("is-dragover");
        })
        .on('drop','#message-list-wrapper', dropListener);


        // Delete button event
        $parent.on('click', '#delete-button', function() {
            showConfirmDialog("Are you sure you want to delete this conversation?", function() {
            var url = getBaseUrl() 
                    + "/api/v1/conversations/remove/" 
                    + conversation_id + "?account_id=" + account_id
                $.post(url)
                    .done(function(data) { 
                        window.location.replace("conversations.html");  // TODO change this
                    }).fail(failed);
            });
        });
        
        // Archive convo button
        $parent.on('click', '#archive-conversation', function() {
            if (archived === 'true') {
                var url = getBaseUrl() 
                    + "/api/v1/conversations/unarchive/" 
                    + conversation_id + "?account_id=" + account_id + "&archive=true"
                $.post()
                    .done(function(data) { 
                        window.location.replace("archived.html"); 
                    }).fail(failed);
            } else {
                var url = getBaseUrl() 
                    + "/api/v1/conversations/archive/" + conversation_id 
                    + "?account_id=" + account_id + "&archive=true"
                $.post()
                    .done(function(data) { 
                        window.location.replace("conversations.html"); // TODO Change this
                    }).fail(failed);
            }
        });
        
        // Refresh messages event
        $parent.on('click', '#refresh-button', function() {
            $msg_list.html("<div class=\"spinner\" id=\"loading\">"
                + "<div class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active\"></div>"
                + "</div>");
            
            // Reset load/currently displayed
            initial_load = true;
            currently_displayed = []

            dismissNotification()
            refreshMessages();
        });
        
        // On scroll - hides snackbar 
        $mlist_wrap.on('scroll', function(){
            if(!snackbarContainer.MaterialSnackbar.active)
                return false;
            
            // If within 200 px of the message, remove snack bar
            if( ($msg_list.height() - $(window).height() - 200)
                < $mlist_wrap.scrollTop())
                snackbarContainer.MaterialSnackbar.cleanup_();
        });

        // Message entry fixes (prevent default)
        $parent.on('keydown', '#message-entry', function(event) {
            if(event.keyCode == 13 && !event.shiftKey) {
                event.preventDefault();
                return false;
            }

            return true;
        });

        $parent.on('keyup', '#message-entry',  function(event) {
            if(event.keyCode == 13 && !event.shiftKey) {
                $send_btn.click();
                scrollToBottom()
                event.stopPropagation();
                event.preventDefault();
                return false;
            }

            return true;
        })

        $msg_entry.autoGrow({extraLine: false});
        

        // Handle send button event
        $parent.on('click', '#send-button', function() {
            var text = $msg_entry.val().trim();

            if (text.length > 0) {
                sendSmsMessage(text);
                scrollToBottom();
                $msg_entry.val(null);
                $msg_entry.autoGrow(); // Get rid of extra lines
                
            } else {
                showSnackbar("No message to send");
            }
        });
        
        refreshMessages();
        setTimeout(checkNewMessages, config.refresh_rate);
        $msg_entry.focus();
    }
    
    function checkNewMessages() {

        if (current_page_id != page_id)
            return;

        $.get(getBaseUrl() 
                + "/api/v1/messages?account_id=" + account_id 
                + "&conversation_id=" + conversation_id 
                + "&limit=1")
            .done(function (data, status) {
                if (data.length > 0 
                        && !currently_displayed.contains(data[0].device_id))
                    refreshMessages();
            });

        setTimeout(checkNewMessages, config.refresh_rate);
    }

    /**
     * refresh Messages
     * Grabs messages from servera
     * @param limit (optional) - how many messages to grab
     */
    function refreshMessages(limit) {
        // Set message load limit of not provided
        if (typeof limit == "undefined")
            limit = config.load_limit;

        $.get(getBaseUrl() 
                + "/api/v1/messages?account_id=" + account_id 
                + "&conversation_id=" + conversation_id 
                + "&limit=" + limit)
            .done(renderThread)
            .fail(failed);
    }
    
    /**
     * Send sms message
     *
     * @param text - message
     */
    function sendSmsMessage(text) {
        sendMessage(generateId(), text, "text/plain");
    }

    /**
    * sendMessage
    *
    * @param id
    * @param data
    * @param mimeType
    *
    */
    function sendMessage(id, data, mimeType) {
        $conversation_snippet   = $("#conversation-snippet-" + conversation_id);
        $conversation_title     = $("#conversation-title-" + conversation_id);

        var encrypted = encrypt(data);
        var snippetEncrypted = encrypt("You: " + data);

        // Update conversation sidebar
        $conversation_snippet.html("You: " + data);
        $conversation_snippet.removeClass("bold");
        $conversation_title.removeClass("bold");
    

        // Create message for thread
        msg_class = "sent " + textClass + " " + msg_theme;
        
        var msg_content = "";
        if (mimeType == "text/plain")
            msg_content = data.replace(/\n/g, "<br/>");
        else
            msg_content = $("<div  class=\"loading-text\">Loading MMS data...</div>");
           
       var $message = messageFactory(id, msg_class, "", msg_content);


        // Add to page
        add_to_page(id, $message);

        // Define request
        var request = {
            account_id: account_id,
            device_id: id,
            device_conversation_id: conversation_id,
            message_type: 2,
            data: encrypted,
            timestamp: new Date().getTime(),
            mime_type: encrypt(mimeType),
            read: true,
            seen: true
        };

        $.post(getBaseUrl() + "/api/v1/messages/add", request, "json")
            .fail(failed);


        var conversationRequest = {
            account_id: account_id,
            read: true,
            timestamp: new Date().getTime(),
            snippet: mimeType == "text/plain" ? snippetEncrypted : ""
        };

        $.post(getBaseUrl() + "/api/v1/conversations/update/" + conversation_id, conversationRequest, "json");

        if (mimeType != "text/plain") {
            loadImage(id, account_id, mimeType);
        }

        $(".message").linkify();
        $(".linkified").css("color", colorAccent);
    }

    /**
     * handles sending image files
     * @param file
     *
     */
    function sendImageFile(file) {
        if (file.size > 1024 * 1024) 
           return  showSnackbar("Media too large, max is 1MB!");
        
        if (!file.type.startsWith("image/") 
                && !file.type.startsWith("video/") 
                && !file.type.startsWith("audio/")) 
            return showSnackbar("Only images, video and audio are supported!");

        showConfirmDialog("Are you sure you want to send this image?", function() {
            $("body").append(
                "<div class=\"uploading\">" +
                    "<div class=\"uploading-card mdl-card mdl-shadow--2dp\">" +
                        "<div class=\"uploading-text mdl-card__supporting-text\">Uploading...</div>" +
                        "<div class=\"uploading-spinner mdl-spinner mdl-js-spinner is-active\"></div>" +
                    "</div>" +
                "</div>"
            );
            componentHandler.upgradeDom();

            var reader = new FileReader();
            reader.onload = (function(f) {
                return function(e) {
                    var encoder = new TextEncoder("utf-8");
                    var encrypted = encoder.encode(encryptData(new Uint8Array(e.target.result)));

                    var storageRef = firebase.storage().ref();
                    var accountRef = storageRef.child(account_id);
                    var messageId = generateId();
                    var messageRef = accountRef.child(messageId + "");
                    messageRef.put(encrypted).then(function(snapshot) {
                        sendMessage(messageId, "firebase -1", file.type);
                        $(".uploading").remove();
                    });
                };
            })(file);
            reader.readAsArrayBuffer(file);
        });
}

    /**
     * Creates message jq dom object
     *
     * @param id - message id
     * @param mclass - class
     * @param style 
     * @param data
     *
     * @return jq dom object
     */
    function messageFactory(id, mclass, style, data) {
        var $message_wrap = $("<div></div>").addClass("message-wrapper");
        var $message = $("<div></div>").addClass(mclass)
                        .attr("style", style)
                        .attr("id", id)
                        .html(data);
        $message_wrap.append($message)
        
        return $message_wrap;
    }
 
    /**
     * Renders messages to thread
     *
     * @param data - encrypted data from server
     * @param stats - from xhr request
     */
    function renderThread(data, status) {
        var current_size = currently_displayed.length;
        
        // Removing loading spinner
        var $loading = $("#loading");
        if ($loading) 
            $loading.remove();

        // Iterate through received messages
        for (var i = data.length - 1; i >= 0; i--) {
            
            message = data[i];

            var mimeType = "";

            // Decrypt messages
            try { 
                mimeType = decrypt(message.mime_type);
                message.data = decrypt(message.data).replace(/<.*>/g, "");
                message.message_from = decrypt(message.message_from);
            } catch (err) {
                continue;
            }

            // Move on if displayed
            if (currently_displayed.contains(message.device_id)) 
                continue;
            
    
            // Set message style and class based on message type
            var msg_style   = "";
            var msg_class   = "";
            var msg_content = "";
            var msg_is_mms = false

            if (message.message_type == 0 || message.message_type == 6) { // received or media
                msg_class = "received";
                msg_style = "background: " +  color
                    + "; border-color: " +  color + " transparent;" ;

                latestTimestamp = message.timestamp;
            } else if (message.message_type == 3) {
                msg_class = "error";
            } else if (message.message_type == 5) {
                msg_class = "info mdl-color-text--grey-700";
            } else {
                msg_class = "sent " + textClass;
            }

            // Add rounded messages - or not
            msg_class += " " + msg_theme

            // If text message
            if (mimeType == "text/plain") {
                //TODO move to after all the ifs
                msg_content = message.data.replace(/\n/g, "<br />");
                
            } else if (mimeType == "media/youtube") { // If youtube
                var youtubeLink = message.data
                    .replace("https://img.youtube.com/vi/", "")
                    .replace("/maxresdefault.jpg", "");

                youtubeLink = "https://youtube.com/watch?v=" + youtubeLink;
                
                var msg_content = $("<a></a>").attr("href", youtubeLink)
                                .attr("target", "_blank");
                var $img = $("<img />").addClass("media")
                                .attr("src", message.data);
                msg_content.append($img)

            } else if (mimeType == "media/youtube-v2") {
                var json = JSON.parse(message.data);

                var msg_content = $("<a></a>").attr("href", json.url)
                                .attr("target", "_blank");
                var $img = $("<img />").addClass("media")
                                .attr("src", json.thumbnail);
                var $div = $("<div></div>").addClass("article-title")
                                .html("Youtube: " + json.title);

                msg_content.append($img).append($div);

            } else if (mimeType == "media/web") {
                try {
                    var json = JSON.parse(message.data);

                    var msg_content = $("<a></a>").attr("href", json.url)
                                    .attr("target", "_blank");
                    var $img = $("<img />").addClass("media")
                                    .attr("src", json.thumbnail);
                    var $title = $("<div></div>").addClass("article-title")
                                    .html(json.title);
                    var $snippet = $("<div></div>").addClass("article-snippet")
                                    .html(json.description);

                    msg_content.append($img).append($title).append($snippet);

                } catch (err) {
                    msg_content = "";
                }
            } else {
                msg_content = $("<div></div>")
                    .addClass("loading-text")
                    .html("Loading MMS...");

                msg_is_mms = true;
            }

            if ((data[i].message_from != null 
                    && data[i].message_from.length) != 0 
                    && data[i].message_type == 0 ) {
                var $from = $("<b>" + data[i].message_from + ":</b><br/>")
                console.log(msg_content);
                msg_content.prepend($from);
            }

            var $message = messageFactory(message.device_id, 
                    msg_class, msg_style, msg_content);

            add_to_page(message.device_id, $message);

            // Add media messages to 
            if(msg_is_mms)
                loadImage(message.device_id, account_id, mimeType, name)
            
            // TODO revisit later
            var nextTimestamp;
            if (i == 0) {
                nextTimestamp = new Date();
            } else {
                nextTimestamp = new Date(data[i - 1].timestamp);
            }

            

            // TODO fix later
            var date = null;
            if (date != null && false) {
                var date = compareTimestamps(new Date(message.timestamp), nextTimestamp);
                var $dateWrap = $("<div></div>").addClass("data-wrapper");
                var $date     = $("<div></div>")
                                    .addClass("data-" 
                                        + (message.message_type == 0 ? 
                                            "received" : "sent"))
                                    .addClass("mdl-color-text--grey-500");
                $dataWrap.append($date);
                add_to_page("t-" + message.timestamp, $dateWrap);
            }
        }

        $(".message").linkify();
        $(".linkified").css("color", colorAccent);

        // Show scroll to bottom snackbar - don't interupt scrolling
        if (current_size != currently_displayed.length && !initial_load) {

            // If near bottom
            if (!(($("#message-list").height() - $(window).height() - 400) > $("#message-list-wrapper").scrollTop())) {
                scrollToBottom()
                return
            }

            if (!snackbarContainer.MaterialSnackbar.active) {
                var data = {
                    message: 'New Message',
                    actionHandler: function(event) {
                        snackbarContainer.MaterialSnackbar.cleanup_(); // Hide snackbar
                        scrollToBottom();
                    },
                    actionText: 'Show',
                    timeout: 60*60*60 // Hour timeout
                };
                showSnackbar(data);

                setTimeout(function(){ // If snackbar timeout, scroll to bottom
                    scrollToBottom()
                }, 60*60*60);
            }
        }
        
        // Intial load
        if (initial_load) {
            scrollToBottom();
            initial_load = false
        }
    }
    

    /**
     * Handles drop events
     * Sends files on drop
     *
     * @param e - event
     */
    function dropListener(e) {
        var file;

        if (e.originalEvent.dataTransfer) {
        file = e.originalEvent.dataTransfer.files[0]
        } else {
        file = e.target.files[0];
        }

        sendImageFile(file);
    }



    function dismissNotification() {
            $.post(getBaseUrl() + "/api/v1/accounts/dismissed_notification?account_id=" + account_id + "&id=" + conversation_id);
        console.log("Notifcations Dismissed");
    }

    /**
    * Adds message to page. Will ignore if id is already being displayed
    * @param id - message id or "device_id"
    * @param html - html to add
    */
    function add_to_page(id, html) {
        if(currently_displayed.contains(id))
            return

        $("#message-list").append(html);
        currently_displayed.push(id)
    }
 
    function setVariables(data, status) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].device_id == conversation_id) {
                try {
                    title = decrypt(data[i].title);
                    phoneNumbers = decrypt(data[i].phone_numbers);
                    color = toColor(data[i].color);
                    colorDark = toColor(data[i].color_dark);
                    colorAccent = toColor(data[i].color_accent);
                } catch (err) { }
                break;
            }
        }

        // write them back so that they are available immediately next time
        localStorage.setItem(conversation_id + "title", title);
        localStorage.setItem(conversation_id + "phoneNumbers", phoneNumbers);
        localStorage.setItem(conversation_id + "color", color);
        localStorage.setItem(conversation_id + "colorDark", colorDark);
        localStorage.setItem(conversation_id + "colorAccent", colorAccent);
    

        constructor();
    }

    if (phoneNumbers === null) {
        // need to make an ajax request since it isn't stored locally.
        // this happens when you haven't loaded a conversation on the web app
        // and you try to open a notification from the chrome app/extension
        $.get(getBaseUrl() + "/api/v1/conversations?account_id=" + account_id)
            .done(setVariables)
            .fail(failed);
    } else {
        constructor();
    }

    
}

