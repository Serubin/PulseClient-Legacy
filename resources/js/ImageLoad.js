var loadImage = function(deviceId, accountId, mimeType, prepend) {
    if (prepend === undefined) {
        prepend = "";
    }
    
    // IndexedDB
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
        IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
        dbVersion = 1.0;

    // Create/open database
    var request = indexedDB.open("imageFiles", dbVersion),
        db,
        createObjectStore = function(dataBase) {
            // Create an objectStore
            console.log("Creating objectStore")
            dataBase.createObjectStore("images");
        },

        getImageFile = function() {
            console.log("getting image file from network");
            $.get(getBaseUrl() + "/api/v1/media/" + deviceId + "?account_id=" + accountId)
                .done(function(data, status) {
                    putImageInDb(decryptToBase64(data));
                    getImageFromDb();
                });
        },

        putImageInDb = function(blob) {
            console.log("Putting image in IndexedDB");
            var transaction = getTransaction();

            // Put the blob into the dabase
            transaction.objectStore("images").put(blob, deviceId);
        },

        getTransaction = function() {
            console.log("getting transaction");

            // Open a transaction to the database
            var readWriteMode = typeof IDBTransaction.READ_WRITE == "undefined" ? "readwrite" : IDBTransaction.READ_WRITE;
            return db.transaction(["images"], readWriteMode);
        },

        getImageFromDb = function() {
            console.log("getting image from db");
            var transaction = getTransaction();

            // Retrieve the file that was just stored
            var req = transaction.objectStore("images").get(deviceId);
            req.onsuccess = function(event) {
                var imgFile = event.target.result;

                if (imgFile == null) {
                    console.log("failed to get media from db, so looking on network");
                    getImageFile();
                } else {
                    console.log("Got media!");

                    if (mimeType.startsWith("image/")) {
                        var link = "/image.html?mime_type=" + mimeType + "&device_id=" + deviceId + "&account_id=" + accountId;
                        $("#" + deviceId).html(prepend + "<a href=\"" + link + "\" target=\"_blank\"><img class=\"media\" src=\"data:" + mimeType + ";base64," + imgFile + "\"/></a>")
                    } else if (mimeType.startsWith("video/")) {
                        $("#" + deviceId).html(prepend + "<video controls class=\"media\" src=\"data:" + mimeType + ";base64," + imgFile + "\"/>")
                    } else if (mimeType.startsWith("audio/")) {
                        $("#" + deviceId).html(prepend + "<audio controls class=\"media\" src=\"data:" + mimeType + ";base64," + imgFile + "\" />");
                    } else {
                        $("#" + deviceId).html(prepend + "<i>This media type not supported on the web.</i>");
                    }
                }
            };
        };

    request.onerror = function(event) {
        console.log("Error creating/accessing IndexedDB database");
    };

    request.onsuccess = function(event) {
        console.log("Success creating/accessing IndexedDB database");
        db = request.result;

        db.onerror = function(event) {
            console.log("Error creating/accessing IndexedDB database");
        };

        // Interim solution for Google Chrome to create an objectStore. Will be deprecated
        if (db.setVersion) {
            if (db.version != dbVersion) {
                var setVersion = db.setVersion(dbVersion);
                setVersion.onsuccess = function() {
                    createObjectStore(db);
                    getImageFromDb();
                };
            } else {
                getImageFromDb();
            }
        } else {
            getImageFromDb();
        }
    }

    // For future use. Currently only in latest Firefox versions
    request.onupgradeneeded = function(event) {
        createObjectStore(event.target.result);
    };
};
