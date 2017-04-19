var globalColor, globalColorDark, globalColorAccent, textClass;
    
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
