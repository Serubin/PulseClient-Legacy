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

    var $expand_btn         = $("#expand-btn");
    var $toolbar            = $("#toolbar");
    var $toolbar_title      = $("#toolbar-title");
    var $navd_title         = $("#nav-drawer-title");
    var $navd_subtitle      = $("#nav-drawer-subtitle");
    var $refresh_btn        = $("#refresh-button");
    var $input              = $("#recipient");
    var $chip_insert        = $("#chip-insert");
    var $autocomp;

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
        

    }

    function processContacts(data) {
        var contacts = [];
        var contains = [];
        var duplicates = [];

        var itemSize = 0;

        for (var i = 0; i < data.length; i++) {
            var contact = data[i];

            contact.name = decrypt(contact.name);
            contact.phone_number = decrypt(contact.phone_number);

            if (contains.indexOf(contact.name) < 0) {
                contains[itemSize] = contact.name;  // Tracks for duplicate checking
                contacts[itemSize++] = { 'id': contact.id, 'name': contact.name, 'phone': contact.phone_number };
            } else { // Track duplicates and mark for removal
                duplicates[duplicates.length] = contact.id;
            }
        }

        autoComplete($input, contacts);
        var lastLen = -1
        var selectedChip = null;
        var hilightChip = null;

        // TODO comment and clean up logic

        $input.on('keyup', function(e) {

            len = $input.val().length; // length tracking

            if(lastLen == 0 && e.keyCode == 8 && hilightChip) { // Remove selected
                selectedChip = $chip_insert.children().last();
                    
                delete selectedContacts[selectedChip.attr("data-id")];
                selectedChip.remove()

                lastLen = -1;

                return;
            } else if ((lastLen != 0 || !hilightChip) && len == 0 && e.keyCode == 8) { // Add selection
                hilightChip = $chip_insert.children().last();
                hilightChip.addClass("selected");
                lastLen = $input.val().length;

                return;
            } 

            $chip_insert.children().removeClass("selected"); // Clear css select
            hilightChip = null;     // Clear saved hilight value

            lastLen =  len // Last length tracking
            autoComplete($input, contacts);
        });

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


    function autoComplete(input, contacts) {

        var val             = input.val();
        var $input_parent   = input.parent();
        var $res            = $input_parent.find('.autocomplete-result');

        while($res.length == 0) { // Find autocomplete
            $input_parent   = $input_parent.parent();
            $res            = $input_parent.find('.autocomplete-result');
        }

        $res.empty().hide();     // Clear

        $res.css({
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
            return $res.hide();

        // Go through each item
        $.each(auto_comp_data, createListItem);
        
        $res.show();

        /**
         * Handles returning matching data
         */
        function matchData(input, data_list) {
            if (input.indexOf(",") >= 0) 
                input = input.substring(input.lastIndexOf(",") + 1, input.length);
            
            // Regex 'like'
            var reg = new RegExp(input.split('').join('\\w*').replace(/\W/, "") + '\\w*', 'i');

            return data_list.filter(function(data) {
                if (data.name.match(reg)) 
                    return data;
            });
        }
    

        function createListItem(item, value) {
            if (selectedContacts.hasOwnProperty(value.id)) // Skip if already selected
                return;

            $autocomp = $("<div></div>").addClass("autocomplete-card mdl-card mdl-shadow--2dp mdl-js-button mdl-js-ripple-effect")
            .css({
                'margin': '0px',
                'padding-left': parseInt($input.css('padding-left'),10) + parseInt($input.css('border-left-width'),10)
            });
            
            $autocomp.attr("data-contact", JSON.stringify(value));


            var $span = $("<span></span>").addClass("mdl-card__supporting-text");
            $span.append("<b>" + value.name + "</b>");
            $span.append(" (" + value.phone + ")");
            $autocomp.append($span);
            
            $autocomp.on('click', selectContact);

            $res.append($autocomp);

            componentHandler.upgradeDom();

        }

        function selectContact() {
            var $this = $(this);
            
            $(".autocomplete-result").hide();

            var contact = JSON.parse($this.attr('data-contact'));

            var $chip = $("<span></span>").addClass("mdl-chip mdl-chip--deletable contact-chip")
                        .attr("data-id", contact.id);

            var $text = $("<span></span>").addClass("mdl-chip__text")
                    .html(contact.name);

            var $cancel = $('<button type="button" class="mdl-chip__action"><i class="material-icons">cancel</i></button>')
                            .on('click', removeSelected);

            $chip.append($text).append($cancel);

            $chip_insert.append($chip);

            var value = $input.val("");

            selectedContacts[contact.id] = contact;

            $input.focus();

        }

        function removeSelected() {
            var $this = $(this).parent();

            delete selectedContacts[$this.attr("data-id")];
            $this.remove()
        }

    }
    
    constructor();
}
 
