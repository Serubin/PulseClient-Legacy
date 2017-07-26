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

    var latest_timestamp    = 0;
    var last_notification   = {};
    var socket              = null;

    var callbacks = {
        'thread': undefined,
        'list': undefined,
    }

    function constructor() {
        checkTimestamp();

        socket = new WebSocket("wss://api.messenger.klinkerapps.com/api/v1/stream?account_id=" + account_id);
        
    }

    //events
    //added_message
    //update_conversation_snippet
    //dismissed_notification
    //update_message_type
    
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

        data = data / 1000 >> 0; // Remove ms
        data = data * 1000; // Add back zero timestamp

        // If greater or equal, ignore 
        if(data <= latest_timestamp)
            return;
        
        if(current_conversation != null)
            checkThread(current_conversation);
         else
            checkConversations(getIndex());

        latest_timestamp = data;
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
            
            convo.timestamp = convo.timestamp / 1000 >> 0; // Remove ms
            convo.timestamp = convo.timestamp * 1000; // Add back zero timestamp

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
        last_notification[conversation_id] = data.timestamp;

        var title = data.title || localStorage.getItem(conversation_id + "title");
        var snippet = data.snippet || data.data;
        
        var options = {
            body: snippet,
            icon: "/resources/images/vector/pulse.svg",
        }

        var notifcation = new Notification(title, options);
    }

    function getIndex() {
        if(window.location.pathname.indexOf("archive") < 0)
            return "index_unarchived";
        else
            return "index_archived";
    }

 
    constructor();
}
