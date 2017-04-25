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
        $expand_btn.hide() // Show expand button by default
        
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

