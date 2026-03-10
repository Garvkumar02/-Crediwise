
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

let serviceAccount;

try {
    // Try to load from file
    serviceAccount = require("../../serviceAccountKey.json");
    console.log("[FIREBASE] Loaded serviceAccountKey.json");
} catch (e) {
    // Fallback to Env Vars (for Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log("[FIREBASE] Loaded service account from ENV");
        } catch (err) {
            console.error("[FIREBASE] Failed to parse API env var");
        }
    } else {
        console.warn("[FIREBASE] No service account found. Admin features may fail.");
    }
}

if (!admin.apps.length) {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("[FIREBASE] Admin Initialized with Credentials");
    } else {
        // Fallback or Mock for local dev without keys
        // If no keys, admin.auth() will fail, which is expected.
        // We can initialize app with default (no-op) to avoid "No App" errors on generic calls
        admin.initializeApp();
        console.log("[FIREBASE] Admin Initialized (Default/No Creds)");
    }
}

module.exports = admin;

