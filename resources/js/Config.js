
var config = {
    refresh_rate: 2500,
    load_limit: 60,   
    firebase_config: { // Firebase 
        apiKey: "AIzaSyB0pMWyfvde4mbKO20t23EEGECEb5itD7I",
        authDomain: "messenger-42616.firebaseapp.com",
        databaseURL: "https://messenger-42616.firebaseio.com",
        storageBucket: "messenger-42616.appspot.com",
    },
}


firebase.initializeApp(config.firebase_config);
