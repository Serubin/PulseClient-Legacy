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

function Conversations(data, elem, page, small) {
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
    var $refresh_btn        = $("#refresh-button");
    var $compose_btn        = $("#compose");
    // Menu Buttons
    var $delete_btn         = $("#delete-btn");
    var $archive_btn        = $("#archive-btn");
    var $blacklist_btn      = $("#blacklist-btn");

    var color               = hasGlobalTheme() ? 
                               globalColor : "#2196F3";
    var colorDark           = hasGlobalTheme() ? 
                               globalDarkColor : "#1565C0";
    var colorAccent         = hasGlobalTheme() ? 
                               globalAccentColor :  "#FF6E40" ;

    var archive             = false;
    var initial_load        = true;

    function constructor() {
        
        notifier.setCallback('list', renderConversation);

        $refresh_btn.off();

        if ($("[data-conversation-list=true]").length > 0 && typeof elem == "undefined")
            $("[data-conversation-list=true]").html("")
                    .removeAttr("data-conversations-list");

        if(data == "archive")
            archive = true;


        if(typeof elem == "undefined") {
            page_id = "conversationlist" + new Date();
            current_page_id = page_id;

            // Set colors
            if(hasColoredToolbar()) {
                $toolbar.css("background-color", color);

                $("meta[name=theme-color]").attr("content", colorDark);
            }

            // Set page title
            document.title = "Pulse";
            $toolbar_title.html("Conversations");

            if(archive)
                $toolbar_title.html("Archive");
            
        }
        

        if(typeof page != "undefined") {
            page_id = page;
        }

        $refresh_btn.on('click', function() { // TODO make work
            initial_load = true
            $elem.empty();
            $elem.html("<div class=\"spinner\" id=\"loading\">"
                + "<div class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active\"></div>"
                + "</div>");
            

        });

        $compose_btn.on('click', function() {
            setPage(PAGE_COMPOSE);
        })

        notifier.checkConversations(getIndex());

    }


    function getIndex() { // TODO, archived support
        if(!archive)
            return "index_unarchived";
        else
            return "index_archived";
    }
    
    function renderConversation(data) {

        // Create element
        $elem.attr("data-conversation-list", "true");
        $elem.html(""); // Clear contents

        var loading = $("#loading");
        if (loading) 
            loading.remove();
        
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


            convo.color         = toColor(convo.color);
            convo.color_dark    = toColor(convo.color_dark);
            convo.color_accent  = toColor(convo.color_accent);
            
            $conv_el    = $("#"+ convo.device_id);

            if($conv_el.length == 0) { // If conversation item doesn't exist yet
                
                $convo_wrap  = $("<div></div>").addClass("conversation-card mdl-card")
                                .addClass("mdl-shadow--2dp mdl-js-button")
                                .addClass("mdl-js-ripple-effect")
                                .attr("id", convo.device_id)
                                .attr("data-timestamp", convo.timestamp);

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

                if (small) {
                    $convo_wrap.addClass("conversation-card-small");
                    $convo_wrap.removeClass("mdl-shadow--2dp");
                    $text_wrap.addClass("conversation-text-small");
                    $title.addClass("conversation-title-small");
                    $snippet.addClass("conversation-snippet-small");
                    $icon = "<svg class=\"contact-img contact-img-small\" height=\"24\" width=\"24\">"
                            + "<circle cx=\"12\" cy=\"12\" r=\"12\" shape-rendering=\"auto\" fill=\"" + (hasGlobalTheme() ? globalColor : data[i].color) + "\"/>"
                            + "</svg>";
                } else {
                    $icon = "<svg class=\"contact-img\" height=\"48\" width=\"48\">"
                            + "<circle cx=\"24\" cy=\"24\" r=\"24\" shape-rendering=\"auto\" fill=\"" + (hasGlobalTheme() ? globalColor : data[i].color) + "\"/>"
                            + "</svg>";
                }

                $text_wrap.append($title, $break, $snippet);
                $convo_wrap.append($icon, $text_wrap);
                
                if (convo.pinned) 
                    $pinned_wrap.append($convo_wrap);
                else
                    $elem.append($convo_wrap);
                
                conversations.push(convo);

            } else { // If already exists in dom

                // If unchanged, continue
                if($conv_el.attr("data-timestamp") == convo.timestamp)
                    continue;


                try { // Decrypt snippet
                    convo.snippet = decrypt(convo.snippet).replace(/<.*>/g, "");
                } catch (err) {
                    convo.snippet = "";
                }

                // Update with snippet
                $conv_el.find(".conversation-snippet").html(convo.snippet);
                $conv_el.attr("data-timestamp", convo.timestamp);
                

                // Read / not read
                $conv_el.find("span").removeClass("bold");
                if(read_style != "")
                    $conv_el.find("span").addClass("bold");

                // Move to top
                $conv_el.detach().prependTo("#" + $elem.attr("id"));
            }
        }

        if($conv_el.length >= 1) // If structure exists - we're done.
            return;

        if (conversations.length == 0) {
            $elem.html("<div class=\"empty\"><div class=\"empty-text\">"
                + "No conversations to display!"
                + "</div></div>");

            return;
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

    constructor();
}



