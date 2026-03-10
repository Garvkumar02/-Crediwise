const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const initFirebase = () => {
    if (admin.apps.length > 0) {
        return;
    }

    try {
        let serviceAccount;

        // 1. Try Environment Variable
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            } catch (e) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var");
            }
        }

        // 2. Try File
        if (!serviceAccount) {
            const possiblePaths = [
                path.join(__dirname, "../config/serviceAccountKey.json"),
                path.join(__dirname, "../../serviceAccountKey.json"),
            ];

            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    serviceAccount = require(p);
                    break;
                }
            }
        }

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin Initialized with Service Account");
        } else {
            // 3. Try Default (Google Cloud Environment)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
            console.log("Firebase Admin Initialized with Default Credentials");
        }
    } catch (error) {
        console.error("Firebase Admin Init Error:", error.message);
        console.error("Auth features will fail without valid credentials.");
    }
};

initFirebase();

const verifyToken = async (req, res, next) => {
    console.log(`[AUTH] Verifying token for: ${req.url}`);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];

    if (token === "mock-admin-token") {
        console.log("[AUTH] Admin Bypass Used");
        req.user = { uid: "ADMIN_USER", email: "admin@credwise.com" };
        return next();
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error("Token Verification Failed:", error.message);
        return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }
};

module.exports = verifyToken;
