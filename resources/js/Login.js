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

function Login() {

    var $parent             = $("[data-content=inserted]");
    var $username           = $("#username");
    var $password           = $("#password");
    var $login              = $("#login");
    var $navd_title         = $("#nav-drawer-title");
    var $navd_subtitle      = $("#nav-drawer-subtitle");

    function constructor() {
        

        $navd_title.html("Pulse");
        $navd_subtitle.html("Please login");

        $parent.on('click', '#login', do_login);

        $password.on('keyup', login_keyup);

        function do_login() {
            username = $("#username").val();
            password = $("#password").val();
            $.post(getBaseUrl() + "/api/v1/accounts/login", { username: username, password: password })
                .done(store_data)
                .fail(failed_login)
                .statusCode;

        }
        function login_keyup(e) {
            if(e.keyCode == 13)
                do_login()
        }
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
            

        combinedKey     = data.account_id + ":" + localStorage.getItem("hash") + "\n";
        key             = sjcl.misc.pbkdf2(combinedKey, localStorage.getItem("salt"), 10000, 256, hmacSHA1);
        aes             = new sjcl.cipher.aes(key);
        account_id      = data.account_id;

        sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

        if (getUrlParameter("activate") == "true") {
            window.location.replace("activate.html"); //TODO fix urls
        } else {
            setPage(PAGE_LIST)
        }
    }

    function failed_login(xhr, textstatus, errorThrown) {
        var snackbarContainer = document.querySelector('#snackbar');
        snackbarContainer.MaterialSnackbar.showSnackbar({message: "Login failed"});
    }
    
    constructor(); // Start class
}
