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

function Notifier() {
    
    var initial_load = true;

    var latest_timestamp = 0;
    var last_notification = {};

    var callbacks = {
        'thread': undefined,
        'list': undefined,
    }

    function constructor() {
        checkTimestamp()
        
    }
    
    function setCallback(type, callback) {
        callbacks[type] = callback;
    }
    this.setCallback = setCallback;

    function checkTimestamp() {
        setTimeout(checkTimestamp, config.refresh_rate_low);
        
        if(initial_load)
            return;

        $.get(getBaseUrl() + "/api/v1/conversations/latest_timestamp?account_id=" + account_id)
            .done(processTimestamp);

        

        var failed = function(xhr, textstatus, errorThrown) { // TODO checking messages failed
            showSnackbar("Operation failed :(");
        }

    }

    function processTimestamp(data) {

        // If greater or equal, ignore 
        if(data <= latest_timestamp)
            return;
        
        if(current_conversation != null)
            checkThread(current_conversation);
         else
            checkConversations("index_unarchived");

        latest_timestamp = data;
    }

    function checkThread(conversation_id, limit) {
        // Set message load limit of not provided
        if (typeof limit == "undefined")
            limit = config.load_limit;

        $.get(getBaseUrl() 
                + "/api/v1/messages?account_id=" + account_id 
                + "&conversation_id=" + conversation_id 
                + "&limit=" + limit)
            .done(processThread)
            .fail(failed);

        function processThread(data) {
            
            var found = false;

            for(var i = 0; i < data.length; i++) {
                var message = data[i];


                try { 
                    mimeType = decrypt(message.mime_type);

                    message.data = decrypt(message.data)
                    message.data = entityEncode(message.data);

                    message.message_from = decrypt(message.message_from);
                } catch (err) {
                    continue;
                }
                
                if(message.timestamp == latest_timestamp)
                    found = true;
            
                if(message.timestamp > last_notification[conversation_id])
                    sendNotification(conversation_id, data)
                
            }

            if(typeof callbacks.thread != "undefined")
                callbacks.thread(data);
            
            if(!found)
                checkConversations();
            
        }

    }


    function checkConversations(index) {
        $.get(getBaseUrl() + "/api/v1/conversations/" + index + "?account_id=" + account_id)
            .done(processConversations)
            .fail(failed);


    }
    this.checkConversations = checkConversations;

    function processConversations(data) {
        for(var i = 0; i < data.length; i++) {
            
            var convo = data[i];

            try {
                convo.title = decrypt(convo.title);
                convo.snippet = decrypt(convo.snippet)
                convo.snippet = entityEncode(convo.snippet)
            } catch (err) {
                continue;
            }

            try {
                convo.phone_numbers = decrypt(convo.phone_numbers);
            } catch (err) {
                convo.phone_numbers = "";
            }
            
            // Only send notification on new messages
            if((!convo.read) && last_notification[convo.device_id] < convo.timestamp && !initial_load)
                sendNotification(convo.device_id, convo);
            else
                last_notification[convo.device_id] = convo.timestamp;
        }

        if(typeof callbacks.list != "undefined")
            callbacks.list(data)

        initial_load = false;
    }


    function sendNotification(conversation_id, data) {
        last_notification[conversation_id] = data.timestamp

        var title = data.title || localStorage.getItem(conversation_id + "title");
        var snippet = data.snippet || data.data;

        var notifcation = new Notification(title);
    }

 
    constructor();
}
