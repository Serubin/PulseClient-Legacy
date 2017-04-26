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

var config = {
    base_url: "/",
    refresh_rate_high: 20000,
    refresh_rate_low: 2500,
    refresh_rate: 2500,
    load_limit: 60,   
    firebase_config: { // Firebase 
        apiKey: "AIzaSyB0pMWyfvde4mbKO20t23EEGECEb5itD7I",
        authDomain: "messenger-42616.firebaseapp.com",
        databaseURL: "https://messenger-42616.firebaseio.com",
        storageBucket: "messenger-42616.appspot.com",
    },
}

if (typeof firebase != "undefined")
    firebase.initializeApp(config.firebase_config);
