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

/*
 * Thread - PulseSms client
 * @author Solomon Rubin (Serubin.net)
 */

var conversations = []

function Thread(data) {
    var $parent = $("[data-content=inserted]");

    // Page id
    var page_id;

    // static options
    var latestTimestamp     = 0;
    var current_timeout
    var refresh_rate        = config.refresh_rate_low;
    
    // global tracking vars
    var initial_load        = true;
    
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
    var $expand_btn         = $("#expand-btn");
    var $mlist_wrap         = $("#message-list-wrapper");
    var $msg_list           = $("#message-list");
    var $archive_conver     = $("#archive-conversation");
    var $toolbar            = $("#toolbar");
    var $toolbar_title      = $("#toolbar-title");
    var $draggable          = $("#draggable");
    var $delete_btn         = $("#delete-conversation");
    var $emoji_btn          = $("#emoji");
    var $attach             = $("#attach");
    var $side_menu          = $("#side-menu-insert");
    var $convo_tab          = $("#" + conversation_id);
    // Menu Buttons
    var $delete_btn         = $("#delete-btn");
    var $archive_btn        = $("#archive-btn");
    var $blacklist_btn      = $("#blacklist-btn");
    
    function constructor() {
        
        notifier.setCallback("thread", renderThread)
        notifier.checkThread(conversation_id)
            
        page_id = "thread" + conversation_id + new Date();
        current_page_id = page_id;
        current_conversation = conversation_id;

        if(!conversations.contains(conversation_id))
            conversations[conversation_id] = [];

        // Set conversation Title
        document.title = "Pulse - " + title;

        $toolbar_title.html(title);

        if(hasColoredToolbar()) {
            $toolbar.css("background-color", color);
            $send_btn.css("background-color", colorAccent);

            $("meta[name=theme-color]").attr("content", colorDark);
        }

        $delete_btn.show(); // show back button by default
        $archive_btn.show(); // show back button by default 
        $blacklist_btn.show(); // show expand button by default

        var archive_btn_text = $archive_btn.find('#archive-btn-text')

        if(archived)
            archive_btn_text.html("Move to Inbox")
        else
            archive_btn_text.html("Archive Conversation")
        
        // EVENTS
        //
        // Window events    
        $(window).on('focus', function(e) {
            clearTimeout(current_timeout)
            refresh_rate = config.refresh_rate_low

            $msg_entry.focus();
            e.preventDefault()
        });

        $(window).on('blur', function() {
            clearTimeout(current_timeout)
            refresh_rate = config.refresh_rate_high
        });

        // On Drag/Dropa events 
        $mlist_wrap.off().on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
            })
        .on('dragover dragenter', function() {
                $draggable.addClass("is-dragover");
            })
        .on('dragleave dragend drop', function() {
                $draggable.removeClass("is-dragover");
            })
        .on('drop', dropListener);

        // Delete button event
        $delete_btn.off().on('click', function() {
            showConfirmDialog("Are you sure you want to delete this conversation?", function() {
            var url = getBaseUrl() 
                    + "/api/v1/conversations/remove/" 
                    + conversation_id + "?account_id=" + account_id
                $.post(url)
                    .done(function(data) { 
                        setPage(PAGE_LIST);
                    }).fail(failed);
            });
        });
        
        // Archive convo button
        $archive_btn.off().on('click', function() {
            if (archived === 'true') {
                var url = getBaseUrl() 
                    + "/api/v1/conversations/unarchive/" 
                    + conversation_id + "?account_id=" + account_id + "&archive=true"
                $.post(url)
                    .done(function(data) { 
                        setPage(PAGE_LIST);
                    }).fail(failed);
            } else {
                var url = getBaseUrl() 
                    + "/api/v1/conversations/archive/" + conversation_id 
                    + "?account_id=" + account_id + "&archive=true"
                $.post(url)
                    .done(function(data) { 
                        setPage(PAGE_ARCHIVE);
                    }).fail(failed);
            }
        });
        
        
        // On scroll - hides snackbar 
        $mlist_wrap.on('scroll', function(){
            if(!snackbarContainer.MaterialSnackbar.active)
                return false;
            
            // If within 200 px of the message, remove snack bar
            if( ($msg_list.height() - $(window).height() - 200) // TODO fix this
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

                event.stopPropagation();
                event.preventDefault();
                return false;
            }

            return true;
        });

        $parent.on('focus', '#message-entry',  function(event) {
            dismissNotification()
        });

        $msg_entry.autoGrow({extraLine: false});
        

        // Handle send button event
        $parent.on('click', '#send-button', function() {
            var text = $msg_entry.val().trim();

            if (text.length > 0) {
                sendSmsMessage(text);

                scrollToBottom(250);

                $msg_entry.val(null);
                $msg_entry.autoGrow(); // Get rid of extra lines
                
            } else {
                showSnackbar("No message to send");
            }
        });
        
        $parent.on('click', '#emoji', function(e) {
            e.preventDefault();
            $msg_entry.emojiPicker({button: false});
            $msg_entry.emojiPicker("toggle");
        });

        $parent.on('click', '#attach', function(e) {
            e.preventDefault();
            var input = $(document.createElement('input'));
            input.attr("type", "file");
            input.trigger('click');
            input.change(dropListener);
        });

        $msg_entry.focus();

        Conversations(null, $("#side-menu-insert"), page_id, true);
        $("[data-conversation-list=inserted]").off(); 

        // Refresh messages event
        $refresh_btn.off().on('click', function() {
            $msg_list.html("<div class=\"spinner\" id=\"loading\">"
                + "<div class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active\"></div>"
                + "</div>");

            // Reset load/currently displayed
            initial_load = true;
            conversations[conversation_id] = []

            componentHandler.upgradeElements($msg_list);
            notifier.checkThread(conversation_id);

            dismissNotification()
        });


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
    * @param mime_type
    *
    */
    function sendMessage(id, data, mime_type) {

        var $convo_tab = $("#" + conversation_id);
        $convo_tab.detach()
        .prependTo("#side-menu-insert");

        var encrypted = encrypt(data);
        var snippetEncrypted = encrypt("You: " + data);

        // Create message for thread
        msg_class = "sent " + textClass + " " + msg_theme;
        
        var msg_content = "";
        if (mime_type == "text/plain")
            msg_content = data.replace(/\n/g, "<br/>");
        else
            msg_content = $("<div  class=\"loading-text\">Loading MMS data...</div>");
           
       var $message = messageFactory(id, msg_class, "", msg_content);


        // Add to page
        add_to_page(id, $message);
        scrollToBottom(250);

        // Define request
        var request = {
            account_id: account_id,
            device_id: id,
            device_conversation_id: conversation_id,
            message_type: 2,
            data: encrypted,
            timestamp: new Date().getTime(),
            mime_type: encrypt(mime_type),
            read: true,
            seen: true
        };

        $.post(getBaseUrl() + "/api/v1/messages/add", request, "json")
            .fail(failed);
        
        $message.attr("title", new Date(request.timestamp).toLocaleString())

        var conversationRequest = {
            account_id: account_id,
            read: true,
            timestamp: new Date().getTime(),
            snippet: mime_type == "text/plain" ? snippetEncrypted : ""
        };

        $.post(getBaseUrl() + "/api/v1/conversations/update/" + conversation_id, conversationRequest, "json");

        if (mime_type != "text/plain") {
            loadImage(id, account_id, mime_type);
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
        var current_size = conversations[conversation_id].length;
        
        // Removing loading spinner
        var $loading = $("#loading");
        if ($loading) 
            $loading.remove();

        var $convo_tab = $("#" + conversation_id);

        if(!initial_load)
            $convo_tab.detach().prependTo("#side-menu-insert");

        // Iterate through received messages
        for (var i = data.length - 1; i >= 0; i--) {
            
            message = data[i];

            // Move on if displayed
            if (conversations[conversation_id].contains(message.device_id)) 
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
            if (message.mime_type == "text/plain") {

                msg_content = message.data.replace(/\n/g, "<br />");
                
            } else if (message.mime_type == "media/youtube") { // If youtube
                var youtubeLink = message.data
                    .replace("https://img.youtube.com/vi/", "")
                    .replace("/maxresdefault.jpg", "");

                youtubeLink = "https://youtube.com/watch?v=" + youtubeLink;
                
                msg_content = $("<a></a>").attr("href", youtubeLink)
                                .attr("target", "_blank");
                var $img = $("<img />").addClass("media")
                                .attr("src", message.data);
                msg_content.append($img)

            } else if (message.mime_type == "media/youtube-v2") {
                var json = JSON.parse(message.data);

                msg_content = $("<a></a>").attr("href", json.url)
                                .attr("target", "_blank");
                var $img = $("<img />").addClass("media")
                                .attr("src", json.thumbnail);
                var $div = $("<div></div>").addClass("article-title")
                                .html("Youtube: " + json.title);

                msg_content.append($img).append($div);

            } else if (message.mime_type == "media/web") {
                try {
                    var json = JSON.parse(message.data);

                    msg_content = $("<a></a>").attr("href", json.url)
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

            if ((message.message_from != null 
                    && message.message_from.length) != 0 
                    && message.message_type == 0 ) {
                var $from = $("<b>" + message.message_from + ":</b><br/>");

                if(typeof msg_content == "string") // If string
                    msg_content = $('<div>').append($from.clone()).html() + 
                        msg_content; // Dirty fix
                else
                    msg_content.prepend($from);
            }

            var $message = messageFactory(message.device_id, 
                    msg_class, msg_style, msg_content);
            $message.attr("title", new Date(message.timestamp).toLocaleString())

            add_to_page(message.device_id, $message);

            // Add media messages to 
            if(msg_is_mms)
                loadImage(message.device_id, account_id, message.mime_type, name)
            
            // Timestamp
            var nextTimestamp;
            if (i == 0) {
                nextTimestamp = new Date();
            } else {
                nextTimestamp = new Date(data[i - 1].timestamp);
            }

            

            var date = compareTimestamps(new Date(message.timestamp), nextTimestamp);
            if (date != null) {
                var date       = compareTimestamps(new Date(message.timestamp), nextTimestamp);
                var $date_wrap = $("<div></div>").addClass("date-wrapper");
                var $date      = $("<div></div>")
                                    .addClass("date-" 
                                        + (message.message_type == 0 ? 
                                            "received" : "sent"))
                                    .addClass("mdl-color-text--grey-500")
                                    .html(date);
                $date_wrap.append($date);
                add_to_page("t-" + message.timestamp, $date_wrap);
            }
        }

        $(".message").linkify();
        $(".linkified").css("color", colorAccent);
        
        var $document = $("html");
        var $body = $("body");

        // Show scroll to bottom snackbar - don't interupt scrolling
        if (current_size != conversations[conversation_id].length && !initial_load) {
            
            var scroll_top = ($body.scrollTop() || $document.scrollTop()) + $document.height();

            // If near bottom
            if (!(($body.height() - 400) > scroll_top) && $msg_list.height() > $document.height()) {
                scrollToBottom(250)
                return
            }

            if (!snackbarContainer.MaterialSnackbar.active) {
                var data = {
                    message: 'New Message',
                    actionHandler: function(event) {
                        snackbarContainer.MaterialSnackbar.cleanup_(); // Hide snackbar
                        scrollToBottom(250);
                    },
                    actionText: 'Show',
                    timeout: 60*60*60 // Hour timeout
                };
                showSnackbar(data);

                setTimeout(function(){ // If snackbar timeout, scroll to bottom
                    scrollToBottom(250)
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
        if(conversations[conversation_id].contains(id))
            return

        $msg_list.append(html);
        conversations[conversation_id].push(id)

        if(typeof $conv_el == "undefined" || $conv_el.length == 0)
            $convo_tab = $("#" + conversation_id);

        updateConversation($convo_tab, html);
    }

    /**
     * Updates single conversation item
     * 
     * @param $el - element
     * @param snippet - text
     * @param read - is read
     */
    function updateConversation($el, snippet) {
        snippet = snippet.find(".message")

        var sent = snippet.hasClass("sent")
        snippet = snippet.html();

        if(sent)
            snippet = "You: " + snippet;

        if(typeof snippet != "undefined")  // If exists. Quick fix
            // Match and remove all iterations of "<br>"
            snippet = snippet.split(/<br ?\/??>/g).join("");

        $el.find(".conversation-snippet").html(snippet);
        
        $el.find("span").removeClass("bold");

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

