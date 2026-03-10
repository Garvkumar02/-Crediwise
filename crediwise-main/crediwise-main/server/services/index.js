const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config(); // Load env vars first
const apiRoutes = require("../routes/api");
const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// DEBUGGING: Log every request (ABSOLUTE TOP)
app.use(async (req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    // Ensure DB is connected for every request (Serverless pattern)
    if (req.url.startsWith('/api')) {
        await connectDB();
    }
    next();
});



// Connect to DB
// Connect to DB
connectDB().then(() => {
    require("./loanProducts").seedProducts();
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// DYNAMIC CONFIG ROUTE
// Must be BEFORE express.static
// DYNAMIC CONFIG ROUTE (Restored for Vercel)
// Must be BEFORE express.static
app.get("/firebase-init.js", (req, res) => {
    console.log("[SERVER] Serving /firebase-init.js dynamic route");
    const config = {
        apiKey: process.env.FIREBASE_API_KEY || "MISSING",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    };

    const code = `
        const firebaseConfig = ${JSON.stringify(config, null, 2)};
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
    `;

    res.set("Content-Type", "application/javascript");
    res.send(code);
});

// DB DEBUG ENDPOINT
app.get("/api/test-db", async (req, res) => {
    try {
        const mongoose = require("mongoose");
        const state = mongoose.connection.readyState;
        const stateMap = {
            0: "Disconnected",
            1: "Connected",
            2: "Connecting",
            3: "Disconnecting",
        };

        // Count records
        const Eligibility = require("../models/Eligibility");
        const count = await Eligibility.countDocuments();

        res.json({
            status: "ok",
            dbState: stateMap[state] || "Unknown",
            recordCount: count,
            env: {
                mongo: !!process.env.MONGO_URI,
            },
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Routes (API MUST BE BEFORE STATIC)
app.use("/api", apiRoutes);

// Serve Static Files
// Use absolute path for safety
const clientPath = path.resolve(__dirname, "../../client");
console.log(`[SERVER] Serving static files from: ${clientPath}`);
app.use(express.static(clientPath));

// Health Check
app.get("/health", (req, res) => {
    res.send("Smart Loan System API is running");
});

// Fallback (404)
// Fallback (404)
app.use((req, res) => {
    console.log(`[SERVER] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: "Not Found", path: req.url, method: req.method });
});

// app.get('*', ...) handled by static above or 404 here

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
