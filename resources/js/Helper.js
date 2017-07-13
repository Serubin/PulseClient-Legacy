/*
 *  Copyright 2017 Solomon Rubin
 *  Copyright 2016 Jake Klinker
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */


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
    var sPageURL = decodeURIComponent(window.location.href.split('?')[1]),
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
function scrollToBottom(speed) {
    
    if (typeof speed == "undefined")
        speed = 0

    var $document         = $("html");

    $document.animate({"scrollTop": $document[0].scrollHeight}, speed);
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

Object.size = function(obj) {
    return Object.keys(obj).length;
}
