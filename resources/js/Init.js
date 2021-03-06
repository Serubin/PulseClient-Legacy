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

// CONST
var PAGE_LOGIN      = "login";
var PAGE_THREAD     = "thread";
var PAGE_COMPOSE    = "compose";
var PAGE_LIST       = "conversations";
var PAGE_ARCHIVE    = "conversations/archive";
var PAGE_SETTINGS   = "settings";

var $content;
var $insert;
var $back_btn;
var $more_btn;
var snackbarContainer;

var account_id = localStorage.getItem("account_id");
var page;
var g_setPage;

var key;
var combindedKey;
var aes;

var last_page;
var current_page_id;
var current_conversation;

var notifier;

$(Init);

function Init(){

    var $side_menu          = $("#side-menu");
    var $content            = $("#content");
    var $toolbar            = $("#toolbar");
    var $toolbar_title      = $("#toolbar-title");
    var snackbarContainer   = document.querySelector('#snackbar');
    var $inserted           = null;

    var color               =  "#2196F3";
    var colorDark           =  "#1565C0";
    var colorAccent         =  "#FF6E40" ;

    account_id              = localStorage.getItem("account_id");

    var $delete_btn         = $("#delete-btn");
    var $archive_btn        = $("#archive-btn");
    var $blacklist_btn      = $("#blacklist-btn");

    $(window).on('hashchange', loadPage);
    $(window).on('popstate', loadPage);

    function constructor() {

        $( document ).ajaxError(function( event, jqxhr, settings, thrownError ) {
            if (thrownError === "Unauthorized")
                logout();
        });

        Nav();

        notifier = new Notifier();

        // Set colors
        if(hasColoredToolbar()) {
            $toolbar.css("background-color", color);

            $("meta[name=theme-color]").attr("content", colorDark);
        }

        $("style").remove(); // Enables snack bars

        $(".mdl-snackbar")
            .attr("style", "display: flex !important");

        if (account_id == null) 
            setPage(config.base_url + PAGE_LOGIN);
        else {
            // Set up encryption
            combinedKey     = account_id + ":" + localStorage.getItem("hash") + "\n";
            key             = sjcl.misc.pbkdf2(combinedKey, localStorage.getItem("salt"), 10000, 256, hmacSHA1);
            aes             = new sjcl.cipher.aes(key);
            sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();
        }   
        
        if(window.location.pathname.split('/')[0] == "image")
            return;

        // Set up base title

        enableTheme();

        loadPage();
    }
    
    
    
    function setPage(url, push_state) {
        if(typeof push_state == "undefined" || push_state)
            history.pushState({}, '', window.location.href.slice(0, window.location.href.lastIndexOf(window.location.pathname)) + config.base_url + url);

        loadPage(config.base_url + url);
    }

    function loadPage(url){
        // Parse url
        var data; // Url data

        // Set page title
        document.title = "Pulse";
        $toolbar_title.html("Pulse");


        if(typeof url != "string")
            url = window.location.pathname;
        
        // Remove base url (base path)
        if (url.indexOf(config.base_url) == 0)
            url = url.slice(config.base_url.length, url.length)
        
        // Split for use
        url         = url.split('/');
        page        = url[0];
        url_data    = url.splice(1, url.length);


        // Do nothing if the page is the same
        if(window.location.pathname === last_page)
            return;

        // Handle index
        if(page == "") 
            page = PAGE_LIST;

        // Update  variables on page load
        last_page = window.location.pathname;
        
            
        // Redirect to login if token isn't set.
        if(account_id == null && page != PAGE_LOGIN) 
            return setPage(PAGE_LOGIN);

        if(account_id != null && page == PAGE_LOGIN) 
            return setPage(PAGE_LIST);
        
        $delete_btn.hide(); // Hide back button by default
        $archive_btn.hide(); // Hide back button by default 
        $blacklist_btn.hide(); // Hide expand button by default

        current_conversation = null;

        if(!full_theme && $side_menu.css("margin-left") == "0px") 
            $("#logo").click();

        var sectionFunc = window[page.ucFirst()]; // Get function
        if(typeof sectionFunc != "function") // Exec function
            return setPage(PAGE_LIST);

        $.get(config.base_url + "pages/" + page.toLowerCase() + ".html", success);

        function success(data){
            if ($inserted != null) {
                $inserted.off();
                $inserted.remove();
            }

            $inserted = $(data);
            $inserted.attr("data-content", "inserted");

            $content.append($inserted);
            
            componentHandler.upgradeElements($("[data-content=inserted]"));

            sectionFunc(url_data);
        }
    }
    
    window.setPage = setPage

    constructor();
}
