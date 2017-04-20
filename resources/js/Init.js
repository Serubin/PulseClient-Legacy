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

    function constructor() {
        if (account_id == null) 
            window.location.hash = "#!" + PAGE_LOGIN;
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

    function loadPage(){
        // Update  variables on page load
        lastPage    = page;
        page        = window.location.hash.split('?')[0].toLowerCase().replace("#!", "");
        
        // Do nothing if the page is the same
        if(page === lastPage)
            return;
        // Redirect to login if token isn't set.
        if(account_id == null && page != PAGE_LOGIN) { 
            window.location.hash = "#!" + PAGE_LOGIN;
            return;
        }
        
        var sectionFunc = window[page.ucFirst()]; // Get function
        if(typeof sectionFunc != "function") // Exec function
                window.location.hash = "#!" + PAGE_LIST; // Just kidding, default to transactions page

        $.get("pages/" + page.toLowerCase() + ".html", success);

        function success(data){
            if ($inserted != null) {
                $inserted.off();
                $inserted.remove();
            }

            $inserted = $(data);
            $inserted.attr("data-content", "inserted");

            $content.append($inserted);
            
            componentHandler.upgradeElements($("[data-content=inserted]"));

            sectionFunc();
        }
    }

    forceUpdate = loadPage;

    constructor();
}
