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

var globalColor, globalColorDark, globalColorAccent, textClass;
 
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
            drawerColor = "#000000";
            $('head').append('<link rel="stylesheet" href="resources/css/themed-black.css" type="text/css" />');
        } else {
            drawerColor = "#29373d";
        }
    } else {
        textClass = "mdl-color-text--grey-900";
        drawerColor = "#F5F5F5";
    }

    if (hasColoredToolbar()) {

      $(".material-icons").addClass("material-icons-white");
      $("#toolbar-title").css("color", "white");
      $(".icon_logo").addClass("icon_logo_dark").removeClass("icon_logo");
      $(".icon_menu_toggle").addClass("icon_menu_toggle_dark").removeClass("icon_menu_toggle");

      var color = hasGlobalTheme() ? globalColor : "#009688";
      $("#toolbar").css("background-color", color);

    } else {

      $("#toolbar").css("background-color", "#fafafa");
      $("#toolbar-title").css("color", "#666666");
      $(".material-icons").removeClass("material-icons-white");
      $(".icon_logo_dark").addClass("icon_logo").removeClass("icon_logo_dark");
      $(".icon_menu_toggle_dark").addClass("icon_menu_toggle").removeClass("icon_menu_toggle_dark");

    }

    $(".empty").css("background-color", globalColor);
    $(".mdl-layout__header").css("background-color", globalColor);
    $(".mdl-color--primary").css("background-color", globalColor);
    $("#nav-drawer-title").css("background-color", globalColorDark);
    $("#nav-drawer-subtitle").css("background-color", globalColorDark);
    $("#compose").css("background-color", globalColorAccent);
}

function hasColoredToolbar() {
  var coloredToolbar = localStorage.getItem("colored_toolbar");
  return typeof coloredToolbar !== "undefined" && coloredToolbar === "yes";
}

function hasGlobalTheme() {
    var globalTheme = localStorage.getItem("global_color_theme");
    return globalTheme !== null && globalTheme !== "default";
}

function getBaseTheme() {
    return localStorage.getItem("base_theme");
}

function hasRounderBubbles() {
    return localStorage.getItem("rounder_bubbles") === "true";
}

function isNight() {
    var date = new Date();
    var hours = date.getHours();
    return hours < 7 || hours >= 20;
}

function setGlobalColor() {
    var globalTheme = localStorage.getItem("global_color_theme");
    if (globalTheme === null || globalTheme === "default") {
        return;
    } else if (globalTheme === "red") {
        globalColor = "#F44336";
        globalColorDark = "#C62828";
        globalColorAccent = "#536DFE";
    } else if (globalTheme === "pink") {
        globalColor = "#E91E63";
        globalColorDark = "#AD1457";
        globalColorAccent = "#AEEA00";
    } else if (globalTheme === "purple") {
        globalColor = "#9C27B0";
        globalColorDark = "#6A1B9A";
        globalColorAccent = "#00BFA5";
    } else if (globalTheme === "deep_purple") {
        globalColor = "#673AB7";
        globalColorDark = "#4527A0";
        globalColorAccent = "#FF4081";
    } else if (globalTheme === "indigo") {
        globalColor = "#3F51B5";
        globalColorDark = "#283593";
        globalColorAccent = "#FFD600";
    } else if (globalTheme === "blue") {
        globalColor = "#2196F3";
        globalColorDark = "#1565C0";
        globalColorAccent = "#FF6E40";
    } else if (globalTheme === "light_blue") {
        globalColor = "#03A9F4";
        globalColorDark = "#0277BD";
        globalColorAccent = "#E040FB";
    } else if (globalTheme === "cyan") {
        globalColor = "#00BCD4";
        globalColorDark = "#00838F";
        globalColorAccent = "#FFD740";
    } else if (globalTheme === "teal") {
        globalColor = "#009688";
        globalColorDark = "#00695C";
        globalColorAccent = "#FF4081";
    } else if (globalTheme === "green") {
        globalColor = "#4CAF50";
        globalColorDark = "#2E7D32";
        globalColorAccent = "#40C4FF";
    } else if (globalTheme === "light_green") {
        globalColor = "#8BC34A";
        globalColorDark = "#558B2F";
        globalColorAccent = "#FFAB40";
    } else if (globalTheme === "lime") {
        globalColor = "#CDDC39";
        globalColorDark = "#AFB42B";
        globalColorAccent = "#448AFF";
    } else if (globalTheme === "yellow") {
        globalColor = "#FDD835";
        globalColorDark = "#F9A825";
        globalColorAccent = "#FF5252";
    } else if (globalTheme === "amber") {
        globalColor = "#FFC107";
        globalColorDark = "#FF8F00";
        globalColorAccent = "#00B8D4";
    } else if (globalTheme === "orange") {
        globalColor = "#FF9800";
        globalColorDark = "#EF6C00";
        globalColorAccent = "#7C4DFF";
    } else if (globalTheme === "deep_orange") {
        globalColor = "#FF5722";
        globalColorDark = "#D84315";
        globalColorAccent = "#64DD17";
    } else if (globalTheme === "brown") {
        globalColor = "#795548";
        globalColorDark = "#4E342E";
        globalColorAccent = "#FFAB40";
    } else if (globalTheme === "gray") {
        globalColor = "#9E9E9E";
        globalColorDark = "#757575";
        globalColorAccent = "#69F0AE";
    } else if (globalTheme === "blue_gray") {
        globalColor = "#607D8B";
        globalColorDark = "#37474F";
        globalColorAccent = "#FF5252";
    } else if (globalTheme === "black") {
        globalColor = "#000000";
        globalColorDark = "#000000";
        globalColorAccent = "#00BFA5";
    }
}


// contants
var MAIN_CONTENT_SIZE = 950;
var MINI_VERSION_SIZE = 750;
var SIDE_MENU_WIDTH = 269;

$(window).on('resize', function () {
	resizeMargins();
});

$(document).ready(function() {
	resizeMargins();

	$("#outside-side-menu").click(function() { $("#logo").click(); });
});

function resizeMargins() {
	var margin = 0;
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();

	if (windowWidth > MAIN_CONTENT_SIZE) {
		margin = (windowWidth - MAIN_CONTENT_SIZE) / 2;
	}

	$("#toolbar_inner").css("margin-left", margin + "px");
	$("#all_holder").css("margin-left", margin + "px");
	$("#side-menu").css("height", windowHeight + "px");
	//$("#content").css("height", windowHeight + "px");

	if (windowWidth < MINI_VERSION_SIZE) {
		loadMiniVersion();
	} else {
		loadFullVersion();
	}
}

function loadMiniVersion() {
	var $logo_image = $("#logo-image");
	$logo_image.removeClass(hasColoredToolbar() ? "icon_logo_dark" : "icon_logo");
	$logo_image.addClass(hasColoredToolbar() ? "icon_menu_toggle_dark" : "icon_menu_toggle");
	$logo_image.css("margin-top", "1px");

	$("#side-menu").css("margin-left", "-269px");
	$("#content").css("margin-left", "0px");

	$("#logo").off().on("click", function() {
		var $html = $("html");
		var $sidemenu = $("#side-menu");
		var $outside_sidemenu = $("#outside-side-menu");

		if ($sidemenu.is(":visible")) {
			$html.removeClass("side-menu_show");
			$sidemenu.css("margin-left", "-269px");
			$outside_sidemenu.hide();
		} else {
			$html.addClass("side-menu_show");
			$sidemenu.css("margin-left", "0px");
			$outside_sidemenu.show();
		}
	});
}

function loadFullVersion() {
	$("html").removeClass("side-menu_show");
	$("#content").css("margin-left", SIDE_MENU_WIDTH + "px");

	$("#logo").show();
    $("#side-menu").css("margin-left", "0px");
	$("#side-menu_toggle").hide();
	$("#side-menu_toggle").off();

	var $logo_image = $("#logo-image");
	$logo_image.removeClass(hasColoredToolbar() ? "icon_menu_toggle_dark" : "icon_menu_toggle");
	$logo_image.addClass(hasColoredToolbar() ? "icon_logo_dark" : "icon_logo");
	$logo_image.css("margin-top", "2px");
}

