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

function Compose(data, $elem) {
    var page_id;

    var $parent = $("[data-content=inserted]");

    var $page_content       = $(".page-content");
    var $expand_btn         = $("#expand-btn");
    var $toolbar            = $("#toolbar");
    var $toolbar_title      = $("#toolbar-title");
    var $navd_title         = $("#nav-drawer-title");
    var $navd_subtitle      = $("#nav-drawer-subtitle");
    var $refresh_btn        = $("#refresh-button");
    var $send_btn           = $("#send-button");
    var $msg_entry          = $("#message-entry");
    var $input              = $("#recipient");
    var $chip_insert        = $("#chip-insert");
    var $autocomp;
    // Menu Buttons
    var $delete_btn         = $("#delete-btn");
    var $archive_btn        = $("#archive-btn");
    var $blacklist_btn      = $("#blacklist-btn");

    var contacts            = [];
    var contactsByName      = {};
    var selectedContacts    = {};

    var color               = hasGlobalTheme() ? 
                               globalColor : "#2196F3";
    var colorDark           = hasGlobalTheme() ? 
                               globalDarkColor : "#1565C0";
    var colorAccent         = hasGlobalTheme() ? 
                               globalAccentColor :  "#FF6E40" ;

    function constructor() {


        $.get(getBaseUrl() + "/api/v1/contacts/simple?account_id=" + account_id)
        .done(processContacts);

        page_id = "compose" + new Date();
        current_page_id = page_id;

        // Set colors
        if(hasColoredToolbar()) {
            $toolbar.css("background-color", color);

            $("meta[name=theme-color]").attr("content", colorDark);
        }   
        // Set page title
        document.title = "Pulse - Compose";
        $toolbar_title.html("Compose Message");
       
      
        $msg_entry.autoGrow({extraLine: false});

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

        $parent.on('click', '#emoji', function(e) {
            e.preventDefault();
            $msg_entry.emojiPicker({button: false});
            $msg_entry.emojiPicker("toggle");
        });

        // Handle send button event
        $parent.on('click', '#send-button', sendMessage);
        
        // Keyup function
        $parent.on('keyup', '#recipient', processInput);
    }

    // External tracking vars
    var lastLen = -1
    var selectedChip = null;
    var hilightChip = null;

    function processInput(e) {

        len = $input.val().length; // length tracking


        if( e.keyCode == 13 ) {
            if($autocomp == null && !$autocomp.is(':visible')) 
                return; // Do nothing
            
            // Get contact of first item
            var contact = $autocomp.children().first().attr("data-contact");
            contact = JSON.parse(contact);

            return selectContact(contact);
        }

        if( e.keyCode == 188) {
            var val = $input.val();
                val = val.slice(0, val.length - 1); // Remove trailing comma

            var c_id = contactsByName[val.toLowerCase()];

            if( typeof c_id != "undefined" )
                return selectContact(contacts[c_id]);
            

            contact = { 
                'id': val, 
                'name': val, 
                'phone': val 
            };

            chip_error = false
            if (!/^\d+$/.test(val))
                chip_error = true
            
            selectContact(contact, chip_error);

        }

        // Removed hilighted chip
        if(lastLen == 0 && e.keyCode == 8 && hilightChip) {

            selectedChip = $chip_insert.children().last();
                
            delete selectedContacts[selectedChip.attr("data-id")];
            selectedChip.remove()

            lastLen = -1;

            return; // Done
        } 
        
        // Hilight chip
        if ((lastLen != 0 || !hilightChip) && len == 0 && e.keyCode == 8) {

            hilightChip = $chip_insert.children().last(); // Select chip
            hilightChip.addClass("selected");

            lastLen = len; // Update last len

            return; //Done
        } 

        $chip_insert.children().removeClass("selected"); // Clear css select
        hilightChip = null;     // Clear saved hilight value

        lastLen =  len // Last length tracking
        autoComplete($input);
    }


    function sendMessage() {
        var text = $msg_entry.val().trim();
        var to = "";

        if (Object.size(selectedContacts) <= 0)
            return showSnackbar("No recipient");

        if (text.length <= 0)
            return showSnackbar("No message to send");

        $.each(selectedContacts, function(key, value) { // Concat selected contacts
            to += value.phone + ",";
        });
        
        to = to.slice(0, to.length - 1); // Remove trailing comma

        var request = {
            account_id: account_id,
            to: to,
            message: text
        };
        
        // Reset input
        $msg_entry.val(null);
        $msg_entry.autoGrow(); // Get rid of extra lines

        // Send to phone
        $.post(getBaseUrl() + "/api/v1/messages/forward_to_phone", request, "json")
            .done(function() {
                $page_content.html("<div class=\"spinner\" id=\"loading\">"
                    + "<div class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active\"></div>"
                    + "</div>");
                componentHandler.upgradeDom();
                setTimeout(loadThread, 1500);
            })
        .fail(failed);

    }

    function loadThread() {
        
        $.get(getBaseUrl() + "/api/v1/conversations/index_unarchived?account_id=" + account_id)
            .done(getConversationId);

        function getConversationId(data) {
            var thread_id = data[0].device_id;
            setPage(PAGE_THREAD + "/" + thread_id);
        }
    }
    


    /**
     * Process contacts received from server
     * Saves contacts in contacts array
     * Also starts recipient processing
     * @param data, contact request result
     */
    function processContacts(data) {
        var contains = [];
        var duplicates = [];

        var itemSize = 0;

        for (var i = 0; i < data.length; i++) {
            var contact = data[i];

            contact.name = decrypt(contact.name);
            contact.phone_number = decrypt(contact.phone_number);

            if (contains.indexOf(contact.name) < 0) {

                contains[itemSize] = contact.name;  // Tracks for duplicate checking
                contactsByName[contact.name.toLowerCase()] = itemSize; // Contacts by name, index

                contacts[itemSize++] = { 
                    'id': contact.id, 
                    'name': contact.name, 
                    'phone': contact.phone_number 
                };


            } else { // Track duplicates and mark for removal

                duplicates[duplicates.length] = contact.id;

            }
        }
       
        // Remove duplicate contacts
        if (duplicates.length > 0) { 
            var idString = "";

            for (var i = 0; i < duplicates.length && i < 100; i++) {
                idString += duplicates[i];

                if (i != duplicates.length - 1) 
                    idString += ","
            }

            $.post(getBaseUrl() + "/api/v1/contacts/remove_ids/" + idString + "?account_id=" + account_id);
        }
    }

    /**
     * Handles auto complete updates
     * @param input object
     */
    function autoComplete(input) { 

        var val             = input.val();
        var $input_parent   = input.parent();
        $autocomp       = $input_parent.find('.autocomplete-result');

        while($autocomp.length == 0) { // Find autocomplete
            $input_parent   = $input_parent.parent();
            $autocomp       = $input_parent.find('.autocomplete-result');
        }

        $autocomp.empty().hide();     // Clear

        $autocomp.css({
            'left': input.position().left,
            'width': input.width() + parseFloat(input.css('padding-left'),10) + parseInt(input.css('border-left-width'),10) + 1,
            'position': 'absolute',
            'background-color': "white",
            'border': '1px solid #dddddd',
            'max-height': '350px',
            'overflow': 'scroll',
            'overflow-x': 'hidden',
            'font-family': input.css('font-family'),
            'font-size' : input.css('font-size'),
            'z-index' : '10'
        }).insertAfter(input);


        var  auto_comp_data = matchData(val, contacts); // Load data
        if (val == "" || auto_comp_data.length == 0) 
            return $autocomp.hide();

        // Go through each item
        $.each(auto_comp_data, createListItem);
        
        $autocomp.show();

        /**
         * Handles returning matching data using fuzzy search
         *  
         * @param input object
         * @param data_list, list of contacts
         *
         * @return returns list of matching contacts
         */
        function matchData(input, data_list) {
            if (input.indexOf(",") >= 0) 
                input = input.substring(input.lastIndexOf(",") + 1, input.length);
            
            // Regex 'like'
            var reg = new RegExp(input.split('').join('\\w*').replace(/\W/, ""), 'i');

            return data_list.filter(function(data) {
                if (data.name.match(reg)) 
                    return data;
            });
        }
    
        /**
         * Creates and adds autocomplete list item
         * @param item (id)
         * @param value
         *
         */
        function createListItem(item, value) {

            if (selectedContacts.hasOwnProperty(value.id)) // Skip if already selected
                return;

            $list_item = $("<div></div>").addClass("autocomplete-card mdl-card mdl-shadow--2dp mdl-js-button mdl-js-ripple-effect")
            .css({
                'margin': '0px',
                'padding-left': parseInt($input.css('padding-left'),10) + parseInt($input.css('border-left-width'),10)
            });
            
            $list_item.attr("data-contact", JSON.stringify(value));


            var $span = $("<span></span>").addClass("mdl-card__supporting-text");
            $span.append("<b>" + value.name + "</b>");
            $span.append(" (" + value.phone + ")");
            $list_item.append($span);
            
            $list_item.on('click', function() {
                var contact = JSON.parse($(this).attr('data-contact'));
                selectContact(contact);
            });

            $autocomp.append($list_item);

            componentHandler.upgradeDom();
        }
        
    }
    
    /**
     * Adds contact chip
     * @param contact
     */
    function selectContact(contact, error) {

            $autocomp.hide();
            
            // Create chip
            var $chip = $("<span></span>").addClass("mdl-chip mdl-chip--deletable contact-chip")
                        .attr("data-id", contact.id);

            if (error) // Error class
                $chip.addClass("error");

            var $text = $("<span></span>").addClass("mdl-chip__text")
                    .html(contact.name);

            var $cancel = $('<button type="button" class="mdl-chip__action"><i class="material-icons">cancel</i></button>')
                            .on('click', removeSelected);

            $chip.append($text).append($cancel);

            $chip_insert.append($chip);

            var value = $input.val(null);
            
            if (!error)
                selectedContacts[contact.id] = contact; // Add contact to selected

            $input.focus();     // Focus back on input

        }

        /**
         * Removed selected contact
         * based on event object
         */
        function removeSelected() {
            var $this = $(this).parent();

            delete selectedContacts[$this.attr("data-id")]; // Remove selected
            $this.remove();     // Remove dom
        }


    constructor();
}
 
