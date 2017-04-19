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
