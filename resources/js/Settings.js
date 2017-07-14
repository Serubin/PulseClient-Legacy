/*
 *  Copyright 2017 Solomon Rubin
 *  tCopyright 2016 Jake Klinker
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

function Settings(data, $elem) {
    var page_id;

    var $parent = $("[data-content=inserted]");

    var $page_content       = $(".page-content");
    var $account_list       = $("#account-list");
    var $toolbar            = $("#toolbar");
    var $colored_toolbar    = $("#colored-toolbar");
    var $toolbar_title      = $("#toolbar-title");
    var $refresh_settings   = $("#refresh_settings");
    // Menu Buttons
    var $delete_btn         = $("#delete-btn");
    var $archive_btn        = $("#archive-btn");
    var $blacklist_btn      = $("#blacklist-btn");

    var color               = hasGlobalTheme() ? 
                               globalColor : "#2196F3";
    var colorDark           = hasGlobalTheme() ? 
                               globalDarkColor : "#1565C0";
    var colorAccent         = hasGlobalTheme() ? 
                               globalAccentColor :  "#FF6E40" ;

    function constructor() {

        page_id = "settings" + new Date();
        current_page_id = page_id;

        // Set colors
        if(hasColoredToolbar()) {
            $toolbar.css("background-color", color);

            $("meta[name=theme-color]").attr("content", colorDark);
        }   
        // Set page title
        document.title = "Pulse - Settings";
        $toolbar_title.html("Settings");

        $delete_btn.hide(); // Hide back button by default
        $archive_btn.hide(); // Hide back button by default 
        $blacklist_btn.hide(); // Hide expand button by default

        var globalColor = localStorage.getItem("global_color_theme")
        var baseTheme = localStorage.getItem("base_theme");
        var rounderBubbles = localStorage.getItem("rounder_bubbles");
        var coloredToolbarPref = localStorage.getItem("colored_toolbar");


        // Englishify Settings
        if (globalColor !== null) 
            globalColor = toTitleCase(globalColor.replace("_", " "));
        else 
            globalColor = "Default";

        if (baseTheme !== null) {
            baseTheme = toTitleCase(baseTheme.replace("_", "/"));

            if (baseTheme === "Day/night")
                baseTheme = "Day/Night";

        } else {
            baseTheme = "Day/Night";
        }

        if (rounderBubbles !== null) 
            rounderBubbles = rounderBubbles
                                .replace("true", "Yes").replace("false", "No");
        else 
            rounderBubbles = "No";
       
        // Create static setting items
        var items = [];
        items.push( createSetting("Color", globalColor) );
        items.push( createSetting("Base Theme", baseTheme) );
        items.push( createSetting("Rounder Bubbles", rounderBubbles) );
        
        $account_list.html(items);

        var checked = hasColoredToolbar() ? true : false;

        $account_list.append("<br/><br/>");

        // Color bar switch
        var $colored_toolbar = $("<label></label>")
                                .addClass("mdl-switch mdl-js-switch mdl-js-ripple-effect")
                                .attr("for", "colored-toolbar");

        var $label           = $("<input/>").addClass("mdl-switch__input")
                                .attr("id", "colored-toolbar")
                                .attr("type", "checkbox")
                                .prop('checked', checked)

        var $span            = $("<span></span>").addClass("mdl-switch__label " + textClass)
                                .html("Use colored toolbar")
        
        $colored_toolbar.append($label).append($span);
        $account_list.append($colored_toolbar);


        /**
         * On change for color toolbar switch
         */
        function colored_toolbar_change() {
            if ($(this).is(':checked')) 
                localStorage.setItem("colored_toolbar", "yes");
            else 
                localStorage.setItem("colored_toolbar", "no");

            enableTheme();
        }
        $parent.on('change', '#colored-toolbar', colored_toolbar_change);

        $account_list.append("<br/><br/>");

        var checked = allowNotification() ? true : false;

        // Notification toggle
        var $notification_toggle = $("<label></label>")
                                .addClass("mdl-switch mdl-js-switch mdl-js-ripple-effect")
                                .attr("for", "notification-toggle");

        var $label           = $("<input/>").addClass("mdl-switch__input")
                                .attr("id", "notification-toggle")
                                .attr("type", "checkbox")
                                .prop('checked', checked)

        var $span            = $("<span></span>").addClass("mdl-switch__label " + textClass)
                                .html("Allow Notifications from the Web App")
        
        $notification_toggle.append($label).append($span);
        $account_list.append($notification_toggle);


        /**
         * On change for color toolbar switch
         */
        function notification_toggle_change() {
            if ($(this).is(':checked')) 
                localStorage.setItem("notifications", "yes");
            else 
                localStorage.setItem("notifications", "no");

            if(allowNotification())
                Notification.requestPermission()

        }
        $parent.on('change', '#notification-toggle', notification_toggle_change);




        // Refresh from phone button
        var $refresh = $("<div></div>").addClass("click-item")
                                .attr("id", "refresh_settings")
        var $title   = $("<div></div>").addClass(textClass)
                                .html("Refresh settings from phone");
        var $value   = $("<div></div>").addClass("mdl-color-text--grey-600")
                                .html("These settings are pulled right from the app");
        
        $refresh.append($title).append($value);

        $account_list.prepend($refresh);

        componentHandler.upgradeElements($("[data-content=inserted]"));

        /**
         * Update settings
         */
        function update_settings_click() {
            $.get(getBaseUrl() + "/api/v1/accounts/settings?account_id=" + account_id)
                    .done(updateSettings);
        }
        $refresh_settings.on('click', update_settings_click);

    
	}
    
    /**
     * Create dom settings entry
     */
    function createSetting(title, value) {
        var $retval =   $("<div></div>").addClass("item");
        var $title =    $("<div></div>").addClass(textClass)
                                        .html(title);
        var $value =    $("<div></div>").addClass("mdl-color-text--grey-600")
                                        .html(value);

        $retval.append($title).append($value)
        
        return $retval
    }

    /**
     * Makes titles pretty
     */
    function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
    }

    /**
     * Updates settings success
     */
    function updateSettings(data, status) {
        localStorage.setItem("global_color_theme", data.global_color_theme);
        localStorage.setItem("base_theme", data.base_theme);
        localStorage.setItem("rounder_bubbles", data.rounder_bubbles + "");
    }

    constructor();
}
 
