

function Conversations() {
    function constructor() {

    }
    
    

}


function renderConversation($elem) {

    // Create element
    $elem.attr("data-conversation-list", "true");

    var loading = $("#loading");
    if (loading) {
        loading.remove();
    }
    
    var items = [];
    var decrypted = [];
    var itemSize = 0;
    var decryptedSize = 0;

    var $pinned_wrap = $("<div></div>").attr("id", "pinned");  

    for (var i = 0; i < data.length; i++) {
        if (i != 0)  // if we have multiple items in a row with the same id, don't display any after the first
            if (data[i].device_id == data[i - 1].device_id) 
                continue;
        
    

        if (i == 0 && data[i].pinned)
            $("<div></div>").addClass("label")
                    .addClass("mdl-color-text--grey-500")
                    .html("Pinned");
            items[itemSize++] = "<div class=\"label mdl-color-text--grey-500\">Pinned</div>";
        else if (i != 0 && !data[i].pinned && data[i-1].pinned) 
            items[itemSize++] = "<div class=\"label mdl-color-text--grey-500\">Conversations</div>";
        

        try {
          data[i].title = decrypt(data[i].title);
        } catch (err) {
          continue;
        }

        try {
          data[i].snippet = decrypt(data[i].snippet).replace(/<.*>/g, "");
        } catch (err) {
          data[i].snippet = "";
        }

        try {
          data[i].phone_numbers = decrypt(data[i].phone_numbers);
        } catch (err) {
          data[i].phone_numbers = "";
        }

        data[i].color = toColor(data[i].color);
        data[i].color_dark = toColor(data[i].color_dark);
        data[i].color_accent = toColor(data[i].color_accent);
        decrypted[decryptedSize++] = data[i];

        items[itemSize++] =
              "<div class=\"conversation-card mdl-card mdl-shadow--2dp mdl-js-button mdl-js-ripple-effect\" id=\"" + data[i].device_id + "\">"
            + "<svg class=\"contact-img\" height=\"48\" width=\"48\">"
            + "<circle cx=\"24\" cy=\"24\" r=\"24\" shape-rendering=\"auto\" fill=\"" + (hasGlobalTheme() ? globalColor : data[i].color) + "\"/>"
            + "</svg>"
            + "<p class=\"conversation-text\">"
            + "<span class=\"conversation-title mdl-card__supporting-text" + (data[i].read ? "" : " bold") +"\">" + data[i].title + "</span><br/>"
            + "<span class=\"conversation-snippet mdl-card__supporting-text" + (data[i].read ? "" : " bold") +"\">" + data[i].snippet + "</span>"
            + "</p>"
            + "</div>";
    }

    if (items.length > 0) {
        $("#conversation-list").html(items.join(''));

        for (var i = 0; i < decrypted.length; i++) {
            $("#" + decrypted[i].device_id).click({
                deviceId: decrypted[i].device_id,
                title: decrypted[i].title,
                color: decrypted[i].color,
                colorDark: decrypted[i].color_dark,
                colorAccent: decrypted[i].color_accent,
                phoneNumbers: decrypted[i].phone_numbers,
                read: decrypted[i].read,
                archived: decrypted[i].archive
            }, function(event) {
                localStorage.setItem(event.data.deviceId + "title", event.data.title);
                localStorage.setItem(event.data.deviceId + "color", event.data.color);
                localStorage.setItem(event.data.deviceId + "colorDark", event.data.colorDark);
                localStorage.setItem(event.data.deviceId + "colorAccent", event.data.colorAccent);
                localStorage.setItem(event.data.deviceId + "phoneNumbers", event.data.phoneNumbers);

                if (!event.data.read) {
                    $.post(getBaseUrl() + "/api/v1/conversations/read/" + event.data.deviceId + "?account_id=" + accountId);
                    //$.post(getBaseUrl() + "/api/v1/accounts/dismissed_notification?account_id=" + accountId + "&id=" + event.data.deviceId);
                }

                if(event.data.archived) {
                    window.location.href = "messages.html?conversation_id=" + event.data.deviceId + "&archived=true";
                } else {
                    window.location.href = "messages.html?conversation_id=" + event.data.deviceId;
                }
            });
        }

        componentHandler.upgradeDom();
    } else {
        $("#conversation-list").remove();
        $(".mdl-layout__content").html("<div class=\"empty\"><div class=\"empty-text\">"
            + "No conversations to display!"
            + "</div></div>");
    }
}
}

function updateConversation($elem) {

}
