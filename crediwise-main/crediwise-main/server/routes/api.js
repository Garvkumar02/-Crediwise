const express = require("express");
const router = express.Router();
const eligibilityController = require("../controllers/eligibilityController");
const loanController = require("../controllers/loanController");
const authController = require("../controllers/authController");

const adminController = require("../controllers/adminController");

// Super Admin Routes (Renamed from /admin to avoid conflict)
router.get("/super/products", adminController.getProducts);
router.post("/super/products", adminController.createProduct);
router.post("/super/products/:id", adminController.updateProduct);
router.delete("/super/products/:id", adminController.deleteProduct);
router.get("/super/applications", adminController.getApplications);
router.get("/super/users", adminController.getUsers);

// Auth Routes
const verifyToken = require("../middleware/authMiddleware");

// Auth Routes (Legacy/Mock, but could be protected if needed)
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);

// Functional Routes
router.get("/ping", (req, res) => res.json({ message: "pong" }));

router.post(
    "/eligibility/check",
    verifyToken,
    eligibilityController.checkEligibility
);
router.get(
    "/eligibility/history",
    (req, res, next) => {
        console.log("[API] Hit /eligibility/history");
        next();
    },
    verifyToken,
    eligibilityController.getHistory
);
router.post(
    "/eligibility/what-if",
    verifyToken,
    eligibilityController.simulateWhatIf
);
router.get("/loans/recommend", loanController.getRecommendations);




module.exports = router;