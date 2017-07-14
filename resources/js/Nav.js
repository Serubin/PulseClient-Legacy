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

            setEvents();
        
    }
 
    function setEvents() {
        var $conversation_link      = $("#conversations-link");
        var $archive_link           = $("#archive-link");
        var $settings_btn           = $("#settings-btn");
        var $logout_btn             = $("#logout-btn");


        $conversation_link.on('click', function(e) {
            setPage(PAGE_LIST);

            e.preventDefault();
            return false;
        });

        $archive_link.on('click', function(e) {
            setPage(PAGE_ARCHIVE);

            e.preventDefault();
            return false;
        });

        $settings_btn.on('click', function(e) {
            setPage(PAGE_SETTINGS);

            e.preventDefault();
            return false;
        });

        $logout_btn.on('click', function(e) {
            account_id = null;

            localStorage.removeItem("account_id");
            localStorage.removeItem("hash");
            localStorage.removeItem("salt");
            localStorage.removeItem("phone_number");
            localStorage.removeItem("name");
            setPage(PAGE_LOGIN);

            e.preventDefault();
            return false;
        });
    }
    constructor();
}
