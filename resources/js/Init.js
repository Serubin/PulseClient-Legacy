// CONST
var PAGE_LOGIN      = "Login";
var PAGE_THREAD     = "Thread";
var PAGE_LIST       = "List";

var accountId;
var key;
var combindedKey;
var aes;

var last_page;

$(function(){

    var account_id = localStorage.getItem("account_id");

    if (accountId == null) 
        window.location.hash = "#!" + PAGE_LOGIN;
    
    // Set up encryption
    combinedKey     = accountId + ":" + localStorage.getItem("hash") + "\n";
    key             = sjcl.misc.pbkdf2(combinedKey, localStorage.getItem("salt"), 10000, 256, hmacSHA1);
    aes             = new sjcl.cipher.aes(key);
    sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

    
    // Set up base title
    navDrawerTitle.html(localStorage.getItem("name"));
    navDrawerSubtitle.html(
        formatPhoneNumber(localStorage.getItem("phone_number"))
    );

    $(window).on('load', loadPage);

    $(window).on('hashchange', loadPage);

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
        page        = window.location.hash.toLowerCase().replace("#!", "");
        
        // Do nothing if the page is the same
        if(page === lastPage)
            return;
        // Redirect to login if token isn't set.
        if(account_id == null && page != PAGE_LOGIN) { 
            window.location.hash = "#!" + PAGE_LOGIN;
            return;
        }
        
        var sectionFunc = window[page.ucFirst()]; // Get function
        if(typeof sectionFunc == "function") // Exec function
            sectionFunc();
        else // Panic!
            window.location.hash = "#!" + PAGE_LIST; // Just kidding, default to transactions page
    }
});
