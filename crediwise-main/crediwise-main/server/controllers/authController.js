// Mock Auth Controller for MVP
// In a real app, this would verify Firebase tokens or handle backend auth logic

exports.register = (req, res) => {
    const { email, password } = req.body;
    // Mock user creation
    console.log(`[MOCK] Registering user: ${email}`);
    res.json({
        success: true,
        message: "User registered successfully (Mock)",
        items: { email },
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    // Mock login
    console.log(`[MOCK] Logging in user: ${email}`);
    res.json({
        success: true,
        token: "mock-jwt-token-123",
        message: "Login successful (Mock)",
    });
};