function Login() {
    var $password   = $("#password");
    var $login      = $("#login");

    function constructor() {
        $login.on('click', function() {
            username = $("#username").val();
            password = $("#password").val();
            $.post(getBaseUrl() + "/api/v1/accounts/login", { username: username, password: password })
                .done(store_data)
                .fail(failed_login);
        });

        $login.on('keyup', function(event){
            if(event.keyCode == 13)
                $login.click();
        });
    }

    function store_data(data) {
        var derivedKey1 = sjcl.misc.pbkdf2(password, data.salt2, 10000, 256, hmacSHA1);
        var base64Key = sjcl.codec.base64.fromBits(derivedKey1);

        localStorage.setItem("account_id", data.account_id);
        localStorage.setItem("hash", base64Key);
        localStorage.setItem("salt", data.salt1);
        localStorage.setItem("phone_number", data.phone_number);
        localStorage.setItem("name", data.name);
        localStorage.setItem("global_color_theme", data.global_color_theme);
        localStorage.setItem("base_theme", data.base_theme);
        localStorage.setItem("rounder_bubbles", data.rounder_bubbles + "");
            

        combinedKey     = account_id + ":" + localStorage.getItem("hash") + "\n";
        key             = sjcl.misc.pbkdf2(combinedKey, localStorage.getItem("salt"), 10000, 256, hmacSHA1);
        aes             = new sjcl.cipher.aes(key);
        sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

        if (getUrlParameter("activate") == "true") {
            window.location.replace("activate.html"); //TODO fix urls
        } else {
            window.location.hash = "#!" + PAGE_LIST;
        }
    }

    function failed_login(xhr, textstatus, errorThrown) {
        var snackbarContainer = document.querySelector('#snackbar');
        snackbarContainer.MaterialSnackbar.showSnackbar({message: "Login failed"});
    }
    
    constructor(); // Start class
}
