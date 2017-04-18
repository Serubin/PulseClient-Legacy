/*
 * Thread - PulseSms client
 * @author Solomon Rubin (Serubin.net)
 */

function Thread(conversationId) {
    
    // static options
    var latestTimestamp     = 0;
    
    // global tracking vars
    var initial_load        = true;
    var currently_displayed = [];

    // Theming info
    var archived            = getUrlParameter("archived");
    var title               = localStorage.getItem(conversationId + "title");
    var color               = hasGlobalTheme() ? 
                               globalColor : 
                                localStorage.getItem(conversationId + "color");
    var colorDark           = hasGlobalTheme() ? 
                               globalDarkColor : 
                                localStorage.getItem(conversationId + "colorDark");
    var colorAccent         = hasGlobalTheme() ? 
                               globalAccentColor : 
                                localStorage.getItem(conversationId + "colorAccent");
    var phoneNumbers        = localStorage.getItem(conversationId + "phoneNumbers");
    var msg_theme           = (hasRounderBubbles() ? "message-round " : "message ");

    // DOM objects  
    var $msg_entry          = $("#message-entry");
    var $send_btn           = $("#send-button");
    var $refresh_btn        = $("#refresh-button");
    var $back_btn           = $("#back-button");
    var $mlist_wrap         = $("#message-list-wrapper");
    var $msg_list           = $("#message-list");
    var $archive_conver     = $("#archive-conversation");
    var $toolbar            = $("#toolbar");
    var $toolbar_title      = $("#toolbar-title");
    var $draggable          = $("#draggable");
    var $delete_btn         = $("#delete-conversation");
    var $emoji_btn          = $("#emoji");
    var $attach             = $("#attach");
    var $navd_title = $("#nav-drawer-title";
    var $navd_subtitle = $("#nav-drawer-subtitle");

    function constructor() {

        // Set conversation Title
        document.title("Pulse - " + title);
        $navd_title.html(title);
        $navd_subtitle.html(formatPhoneNumber(phoneNumbers));

        $toolbar_title.html(title);

        $toolbar.css("background-color", color);
        $navd_title.css("background-color", colorDark);
        $navd_subtitle.css("background-color", colorDark);
        $send_btn.css("background-color", colorAccent);
        $("head").append("<meta name=\"theme-color\" content=\"" + colorDark + "\">")
    

        if (archived === 'true') {
            $back_btn.click(function() {
                window.location.replace("archived.html");
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
        $mlist_wrap.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
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
        $delete_btn.on('click', function() {
            showConfirmDialog("Are you sure you want to delete this conversation?", function() {
            var url = getBaseUrl() 
                    + "/api/v1/conversations/remove/" 
                    + conversationId + "?account_id=" + accountId
                $.post(url)
                    .done(function(data) { 
                        window.location.replace("conversations.html");  // TODO change this
                    }).fail(failed);
            });
        });
        
        // Archive convo button
        $archive_conver.on('click', function() {
            if (archived === 'true') {
                var url = getBaseUrl() 
                    + "/api/v1/conversations/unarchive/" 
                    + conversationId + "?account_id=" + accountId + "&archive=true"
                $.post()
                    .done(function(data) { 
                        window.location.replace("archived.html"); 
                    }).fail(failed);
            } else {
                var url = getBaseUrl() 
                    + "/api/v1/conversations/archive/" + conversationId 
                    + "?account_id=" + accountId + "&archive=true"
                $.post()
                    .done(function(data) { 
                        window.location.replace("conversations.html"); // TODO Change this
                    }).fail(failed);
            }
        });
        
        // Refresh messages event
        $refresh_btn.on('click', function() {
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
        $mlist_wrap.scroll(function(){
            if(!snackbarContainer.MaterialSnackbar.active)
                return false;
            
            // If within 200 px of the message, remove snack bar
            if( ($msg_list.height() - $(window).height() - 200)
                < $mlist_wrap.scrollTop())
                snackbarContainer.MaterialSnackbar.cleanup_();
        });

        // Message entry fixes (prevent default)
        $msg_entry.on('keydown', function(event) {
            if(event.keyCode == 13 && !event.shiftKey) {
                event.preventDefault();
                return false;
            }

            return true;
        });

        $msg_entry.on('keyup', function(event) {
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
        $send_btn.on('click', function() {
            var text = $$msg_entry.val().trim();

            if (text.length > 0) {
                sendSmsMessage(text);
                scrollToBottom();
                $msg_entry.val(null);
                $msg_entry.autoGrow(); // Get rid of extra lines
                
            } else {
                showSnackbar("No message to send");
            }
        });

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
                + "/api/v1/messages?account_id=" + accountId 
                + "&conversation_id=" + conversationId 
                + "&limit=" + limit)
            .done(listConversation)
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
        $conversation_snippet   = $("#conversation-snippet-" + conversationId);
        $conversation_title     = $("#conversation-title-" + conversationId);

        var encrypted = encrypt(data);
        var snippetEncrypted = encrypt("You: " + data);

        // Update conversation sidebar
        $conversation_snippet.html("You: " + data);
        $conversation_snippet.removeClass("bold");
        $conversation_title.removeClass("bold");
    

        // Create message for thread
        msg_class = "sent " + textClass + msg_theme;
        
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
            account_id: accountId,
            device_id: id,
            device_conversation_id: conversationId,
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
            account_id: accountId,
            read: true,
            timestamp: new Date().getTime(),
            snippet: mimeType == "text/plain" ? snippetEncrypted : ""
        };

        $.post(getBaseUrl() + "/api/v1/conversations/update/" + conversationId, conversationRequest, "json");

        if (mimeType != "text/plain") {
            loadImage(id, accountId, mimeType);
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
                    var accountRef = storageRef.child(accountId);
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
            msg_class += msg_theme

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

            if (data[i].message_from != null 
                    && data[i].message_from.length) != 0 
                    && data[i].message_type == 0 )
                var $from = $("<b>" + data[i].message_from + ":</b><br/>")

            msg_content.prepend($from);

            var $message = messageFactory(message.device_id, 
                    msg_class, msg_style, msg_content);

            add_to_page(message.device_id, $message);

            // Add media messages to 
            if(msg_is_mms)
                loadImage(message.device_id, accountId, mimeType, name)
            
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


    /**
     * Scrolls message wrapper to bottom
     */
    function scrollToBottom() {
       $message_wrap.animate({"scrollTop": $('.mdl-layout__content')[0].scrollHeight}, 0);
    }

    function dismissNotification() {
            $.post(getBaseUrl() + "/api/v1/accounts/dismissed_notification?account_id=" + accountId + "&id=" + conversationId);
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

}

