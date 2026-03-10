const Product = require("../models/Product");
const Eligibility = require("../models/Eligibility");
const admin = require("firebase-admin");

// Get all products
exports.getProducts = async (req, res) => {
    console.log("[DEBUG] getProducts controller hit");
    try {
        const products = await Product.find().sort({ id: 1 });
        res.json({ success: true, count: products.length, data: products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        console.log(`[DEBUG] Updating product ${id} with:`, updates);

        // Protect immutable fields if needed, or allow full update
        const product = await Product.findOneAndUpdate({ id: parseInt(id) }, updates, {
            new: true,
            runValidators: true,
        });

        if (!product) {
            console.log(`[DEBUG] Product ${id} not found for update`);
            return res.status(404).json({ success: false, error: "Product not found" });
        }

        console.log(`[DEBUG] Product ${id} updated successfully`);
        res.json({ success: true, data: product });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const { lenderName, loanType, interestRate, tenure, maxLoanAmount, marketingTag } = req.body;
        console.log("[DEBUG] Creating product:", req.body);

        // Simple ID generation (find max ID + 1)
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const newId = lastProduct ? lastProduct.id + 1 : 1;
        console.log(`[DEBUG] Generated new ID: ${newId}`);

        const product = await Product.create({
            id: newId,
            lenderName,
            loanType,
            interestRate,
            tenure,
            maxLoanAmount,
            marketingTag,
            constraints: {
                // Default constraints
                minCreditScore: 650,
                maxFOIR: 60,
                minIncome: 20000,
                allowedEmployment: ["Salaried", "Self-Employed"]
            }
        });

        console.log("[DEBUG] Product created:", product);
        res.json({ success: true, data: product });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[DEBUG] Deleting product ${id}`);
        const result = await Product.findOneAndDelete({ id: parseInt(id) });

        if (!result) {
            console.log(`[DEBUG] Product ${id} not found for deletion`);
            return res.status(404).json({ success: false, error: "Product not found" });
        }

        console.log(`[DEBUG] Product ${id} deleted`);
        res.json({ success: true, message: "Product deleted" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

// Get recent applications (for dashboard)
exports.getApplications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const applications = await Eligibility.find()
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json({ success: true, count: applications.length, data: applications });
    } catch (error) {
        console.error("Error fetching applications (Using Mock):", error.message);

        // MOCK DATA FALLBACK
        const mockApps = [
            {
                email: "jane.smith@example.com",
                loanType: "Home",
                loanAmount: 5000000,
                eligibilityStatus: "REJECTED",
                foir: 56.25
            },
            {
                email: "john.doe@example.com",
                loanType: "Personal",
                loanAmount: 200000,
                eligibilityStatus: "APPROVED",
                foir: 30
            }
        ];
        res.json({ success: true, count: mockApps.length, data: mockApps, isMock: true });
    }
};

// Get all users (Firebase Auth)
exports.getUsers = async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers(100);
        const users = listUsersResult.users.map(u => ({
            uid: u.uid,
            email: u.email,
            metadata: u.metadata
        }));
        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.warn("Error fetching users (likely missing Admin Creds), returning MOCKS:", error.message);

        // MOCK USERS FALLBACK (for development without service account)
        const mockUsers = [
            {
                uid: "mock-user-1",
                email: "testuser@example.com",
                metadata: { lastSignInTime: new Date().toISOString() }
            },
            {
                uid: "mock-user-2",
                email: "demo@credwise.com",
                metadata: { lastSignInTime: new Date(Date.now() - 86400000).toISOString() }
            },
            {
                uid: "ADMIN_USER",
                email: "admin@credwise.com",
                metadata: { lastSignInTime: new Date().toISOString() }
            }
        ];

        res.json({ success: true, count: mockUsers.length, data: mockUsers, isMock: true });
    }
};
