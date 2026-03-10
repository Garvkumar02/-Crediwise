
// Generated at 2025-12-20T17:19:41.625Z
const firebaseConfig = {
    "apiKey": "AIzaSyD4XBO6w1UE7WUKxcIAoCkHaWstrl5TQmk",
    "authDomain": "crediwise-37e06.firebaseapp.com",
    "projectId": "crediwise-37e06",
    "storageBucket": "crediwise-37e06.firebasestorage.app",
    "messagingSenderId": "19269861104",
    "appId": "1:19269861104:web:bdfefc4b384bd02e6c0c35",
    "measurementId": "G-GK0TFFZPWL"
};

if (typeof firebase !== 'undefined') {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("[CLIENT] Firebase Initialized");
        }
        window.auth = firebase.auth();
        var auth = window.auth;
    } catch (e) {
        console.error("[CLIENT] Firebase Init Error:", e);
    }
} else {
    console.error("[CLIENT] Firebase SDK missing");
}

