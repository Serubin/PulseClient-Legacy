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

function Conversations(data, elem) {
    var page_id;
    var $elem;

    if(typeof elem == "undefined") 
        $elem = $("#conversation-list");
    else
        $elem = elem;

    var $parent = $("[data-content=inserted]");

    var $expand_btn         = $("#expand-btn");
    var $toolbar            = $("#toolbar");
    var $toolbar_title      = $("#toolbar-title");
    var $navd_title         = $("#nav-drawer-title");
    var $navd_subtitle      = $("#nav-drawer-subtitle");
    var $refresh_btn        = $("#refresh-button");
    var $compose_btn        = $("#compose");

    var color               = hasGlobalTheme() ? 
                               globalColor : "#2196F3";
    var colorDark           = hasGlobalTheme() ? 
                               globalDarkColor : "#1565C0";
    var colorAccent         = hasGlobalTheme() ? 
                               globalAccentColor :  "#FF6E40" ;

    function constructor() {
    
        $refresh_btn.off();

        if ($("[data-conversation-list=true]").length > 0 )
            $("[data-conversation-list=true]").html("")
                    .removeAttr("data-conversations-list");

        page_id = "conversationlist" + new Date();
        current_page_id = page_id;

        $back_btn.hide(); // Hide back button by default
        $more_btn.hide(); // Hide back button by default
        $expand_btn.css("display", "") // Show expand button by default

        // Set colors
        $toolbar.css("background-color", color);
        $navd_title.css("background-color", colorDark);
        $navd_subtitle.css("background-color", colorDark);

        $("meta[name=theme-color]").attr("content", colorDark);

        // Set page title
        document.title = "Pulse";
        $toolbar_title.html("Pulse");
        $navd_title.html(localStorage.getItem("name"));
        $navd_subtitle.html(
            formatPhoneNumber(localStorage.getItem("phone_number"))
        );
        
        if(typeof elem == "undefined") 
            Nav();

        $refresh_btn.on('click', function() {
            $elem.empty();
            $elem.html("<div class=\"spinner\" id=\"loading\">"
                + "<div class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active\"></div>"
                + "</div>");
            

            refreshConversations();
        });

        $compose_btn.on('click', function() {
            setPage(PAGE_COMPOSE);
        })

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



