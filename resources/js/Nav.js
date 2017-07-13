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

function Nav() {


    function constructor() {
        throw "Deprecated: Nav"
        return;

        $.get("/pages/nav.html", function(data) {
            $("#side-menu-insert").html(data).attr("data-conversation-list", "true");

            setEvents();
        });

        
    }
 
    function setEvents() {
        var $logout_btn         = $("#logout");

        $logout_btn.on('click', function() {
            account_id = null;

            localStorage.removeItem("account_id");
            localStorage.removeItem("hash");
            localStorage.removeItem("salt");
            localStorage.removeItem("phone_number");
            localStorage.removeItem("name");
            setPage(PAGE_LOGIN);

        })
    }
    constructor();
}
