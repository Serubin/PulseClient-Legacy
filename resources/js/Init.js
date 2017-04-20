// CONST
var PAGE_LOGIN      = "login";
var PAGE_THREAD     = "thread";
var PAGE_LIST       = "conversations";

var $content;
var $insert;
var $back_btn;
var $more_btn;

var account_id = localStorage.getItem("account_id");
var page;
var g_setPage;

var key;
var combindedKey;
var aes;

var last_page;
var current_page_id;

$(Init);

function Init(){

    var $navd_title         = $("#nav-drawer-title");
    var $navd_subtitle      = $("#nav-drawer-subtitle");
    var $content            = $("#content");
    var $inserted           = null
    account_id              = localStorage.getItem("account_id");
    $back_btn               = $("#back-button");
    $more_btn               = $("#more-button");

    $(window).on('load', loadPage);
    $(window).on('hashchange', loadPage);
    $(window).on('popstate', loadPage);

    function constructor() {
        if (account_id == null) 
            setPage(config.base_url + PAGE_LOGIN);
        else {
            // Set up encryption
            combinedKey     = account_id + ":" + localStorage.getItem("hash") + "\n";
            key             = sjcl.misc.pbkdf2(combinedKey, localStorage.getItem("salt"), 10000, 256, hmacSHA1);
            aes             = new sjcl.cipher.aes(key);
            sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();
        }   
        
        // Set up base title
        $navd_title.html(localStorage.getItem("name"));
        $navd_subtitle.html(
            formatPhoneNumber(localStorage.getItem("phone_number"))
        );


        $back_btn.hide(); // Hide back button by default
        $more_btn.hide(); // Hide back button by default

    }
    
    /**
     * Enables initial theme
     */
    function enableTheme() {
         setGlobalColor();

        var baseTheme = getBaseTheme();
        if (baseTheme === "dark" || (baseTheme === "day_night" && isNight()) || baseTheme === "black") {
            textClass = "mdl-color-text--white";
            $('head').append('<link rel="stylesheet" href="resources/css/themed-dark.css" type="text/css" />');
            $('.mdl-color-text--grey-900').addClass(textClass).removeClass('mdl-color-text--grey-900');

            if (baseTheme === "black") {
                $('head').append('<link rel="stylesheet" href="resources/css/themed-black.css" type="text/css" />');
            }
        } else {
            textClass = "mdl-color-text--grey-900";
        }
   
        $(".empty").css("background-color", globalColor);
        $(".mdl-layout__header").css("background-color", globalColor);
        $(".mdl-color--primary").css("background-color", globalColor);
        $("#nav-drawer-title").css("background-color", globalColorDark);
        $("#nav-drawer-subtitle").css("background-color", globalColorDark);
        $("#compose").css("background-color", globalColorAccent);
    }
    
    function setPage(url, push_state) {
        if(typeof push_state == "undefined" || push_state)
            history.pushState({}, '', window.location.href.slice(0, window.location.href.lastIndexOf(window.location.pathname)) + config.base_url + url);

        loadPage(config.base_url + url);
    }

    function loadPage(url){
        // Parse url
        var data; // Url data

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
        if(page === last_page)
            return;

        // Handle index
        if(page == "") 
            page = PAGE_LIST;

        // Update  variables on page load
        last_page    = page;
        
            
        // Redirect to login if token isn't set.
        if(account_id == null && page != PAGE_LOGIN) 
            return setPage(PAGE_LOGIN);

        
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
