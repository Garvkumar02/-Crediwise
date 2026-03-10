const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? "http://localhost:5000/api"
    : "/api";

// State
let user = null;

// DOM Elements
const screens = {
    login: document.getElementById("login-screen"),
    signup: document.getElementById("signup-screen"),
    dashboard: document.getElementById("dashboard-screen"),
    input: document.getElementById("input-screen"),
    result: document.getElementById("result-screen"),
    admin: document.getElementById("admin-screen"),
};

const navLinks = document.getElementById("nav-links");

// Auth Listener
auth.onAuthStateChanged((firebaseUser) => {
    user = firebaseUser;
    updateNavbar();
    if (user) {
        console.log("User logged in:", user.email);
        loadUserData();
        showScreen("dashboard");
    } else {
        console.log("User logged out");
        showScreen("login");
    }
});

// Update Navbar based on auth state
function updateNavbar() {
    if (user) {
        navLinks.innerHTML = `
            <span style="color:var(--text); margin-right:1rem">Hello, ${user.email}</span>
            <button onclick="showScreen('dashboard')" class="btn-primary" style="background:transparent; border:1px solid var(--primary)">Dashboard</button>
            <button onclick="handleLogout()" class="btn-primary" style="background:var(--error); border:none">Logout</button>
        `;
    } else {
        navLinks.innerHTML = `
            <button onclick="showScreen('login')" class="btn-primary" style="background:transparent; border:1px solid var(--primary)">Login</button>
            <button onclick="showScreen('signup')" class="btn-primary">Sign Up</button>
        `;
    }
}

// Auth Actions
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    console.log("Attempting login for:", email);

    // ADMIN BACKDOOR
    if (email === "admin@credwise.com" && password === "admin123") {
        console.log("Admin Backdoor Activated");
        user = { email: "admin@credwise.com", uid: "ADMIN_USER" }; // Mock Admin User
        updateNavbar();
        showAdmin();
        return;
    }

    try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        console.log("Login successful, user:", cred.user);
        // onAuthStateChanged will handle redirect
    } catch (error) {
        console.error("Login Critical Error:", error);
        alert("LOGIN FAILED: " + error.code + " - " + error.message);
    }
});

document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    console.log("Attempting signup for:", email);

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        console.log("User created in Auth:", cred.user.uid);

        // db.collection("users").doc(cred.user.uid) removed.
        console.log("User created, no database write needed on client.");

        // onAuthStateChanged will handle redirect
    } catch (error) {
        console.error("Signup Critical Error:", error);
        alert("SIGNUP FAILED: " + error.code + " - " + error.message);
    }
});

async function handleLogout() {
    try {
        // ADMIN LOGOUT
        if (user && user.uid === "ADMIN_USER") {
            console.log("Admin logged out");
            user = null;
            updateNavbar();
            showScreen("login");
            return;
        }

        await auth.signOut();
    } catch (error) {
        console.error("Logout error", error);
    }
}

// Data Handling
async function loadUserData() {
    if (!user) return;
    document.getElementById("user-email-display").textContent = user.email;

    // Fetch last check from API
    try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/eligibility/history`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const json = await res.json();

        if (json.success && json.data) {
            const data = json.data;
            const container = document.getElementById("last-result-container");
            container.classList.remove("hidden");

            const statusEl = document.getElementById("last-status");
            statusEl.textContent = data.result.status;
            statusEl.className = `status-badge status-${data.result.status}`;
            statusEl.style.marginBottom = "0";

            document.getElementById(
                "last-foir"
            ).textContent = `${data.result.metrics.foir}%`;
        }
    } catch (error) {
        console.error("Error loading history:", error);
    }
}

// Loan Eligibility Check
document.getElementById("loan-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!user) {
        alert("Please login first");
        return;
    }

    // Gather Data
    const formData = {
        monthlyIncome: parseFloat(document.getElementById("income").value),
        existingEMI: parseFloat(document.getElementById("existing-emi").value),
        employmentType: document.getElementById("employment").value,
        loanAmount: parseFloat(document.getElementById("loan-amount").value),
        loanTenure: parseFloat(document.getElementById("tenure").value),
        age: parseInt(document.getElementById("age").value),
        loanPurpose: document.getElementById("loan-purpose").value,
        creditScore: document.getElementById("score").value, // Optional
    };

    try {
        // 1. Check Eligibility (Node Backend)
        // 1. Check Eligibility (Node Backend)
        let token = null;
        if (user.uid === "ADMIN_USER") {
            // Use mock token for Admin
            token = "mock-admin-token";
        } else {
            token = await user.getIdToken();
        }

        const eligRes = await fetch(`${API_URL}/eligibility/check`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        });
        const eligData = await eligRes.json();

        if (!eligData.success) throw new Error(eligData.error);

        // Render Result
        renderEligibility(eligData.data);
        renderRecommendations(eligData.data.recommendedProducts);
        renderRejectionAnalysis(eligData.data);

        showScreen("result");
    } catch (err) {
        console.error("Critical Error in Loan Form:", err);
        let msg = err.message;
        if (msg === "Failed to fetch") {
            msg = "Connection Failed. Backend server is likely not running or blocking the connection.";
        }
        alert("Error: " + msg);
    }
});

// UI Helpers
function showScreen(screenName) {
    Object.values(screens).forEach((el) => el.classList.add("hidden"));
    if (screens[screenName]) {
        screens[screenName].classList.remove("hidden");
    }
}

function renderEligibility(data) {
    const badge = document.getElementById("eligibility-badge");
    const reason = document.getElementById("result-reason");
    const foirVal = document.getElementById("foir-val");
    const emiVal = document.getElementById("emi-val");

    badge.className = `status-badge status-${data.status}`;
    badge.textContent = data.status;

    // Add Message if available
    let reasonText = data.reason;
    if (data.message) {
        reasonText += `<br><strong>${data.message}</strong>`;
    }
    // Credit Score Info
    if (data.metrics.isScoreSimulated) {
        reasonText += `<br><small style="color:orange">Credit Score Simulated: ${data.metrics.creditScore}</small>`;
    } else if (data.metrics.creditScore) {
        reasonText += `<br><small>Credit Score: ${data.metrics.creditScore}</small>`;
    }

    reason.innerHTML = reasonText;
    foirVal.textContent = `${data.metrics.foir}%`;
    emiVal.textContent = `₹${data.estimatedEMI.toLocaleString()}`;
}

function renderRecommendations(loans) {
    const container = document.getElementById("recommendations");
    container.innerHTML = "";

    if (!loans || loans.length === 0) {
        container.innerHTML =
            "<p>No matching products found based on your criteria.</p>";
        return;
    }

    // Create formatted table for comparison
    const table = document.createElement("table");
    table.className = "comparison-table";
    table.style.width = "100%";
    table.style.marginTop = "1rem";
    table.style.borderCollapse = "collapse";

    table.innerHTML = `
    <thead>
        <tr style="background:rgba(255,255,255,0.1); text-align:left">
            <th style="padding:8px">Lender</th>
            <th style="padding:8px">Interest</th>
            <th style="padding:8px">Est. EMI</th>
            <th style="padding:8px">Total Payable</th>
        </tr>
    </thead>
    <tbody>
        ${loans
            .map(
                (loan) => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
                <td style="padding:8px">
                    <div style="font-weight:bold">${loan.lenderName}</div>
                    <small style="color:var(--primary)">${loan.marketingTag
                    }</small>
                </td>
                <td style="padding:8px">${loan.interestRate}%</td>
                <td style="padding:8px">₹${Math.round(
                        loan.estimatedEMI
                    ).toLocaleString()}</td>
                <td style="padding:8px">₹${Math.round(
                        loan.totalAmountPayable
                    ).toLocaleString()}</td>
            </tr>
        `
            )
            .join("")}
    </tbody>
  `;

    // ... existing renderRecommendations ...

    container.appendChild(table);
}

// -----------------------------------------------------
// NEW: Features Implementation (What-If, Why-Not, AA)
// -----------------------------------------------------

// Feature 2: "Why Not?" Transparency
function renderRejectionAnalysis(data) {
    const section = document.getElementById("rejection-analysis");
    const list = document.getElementById("rejection-list");
    list.innerHTML = "";

    // Identify failed products
    const failedProducts = data.productEvaluations.filter(
        (p) => p.status !== "APPROVED"
    );

    if (failedProducts.length === 0) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block"; // Show section

    failedProducts.forEach((fp) => {
        // Only show first 3 failed to avoid clutter
        // Or show all. Let's show all unique lenders provided list isn't huge.

        // Group reasons
        const reasonsHTML = fp.failedRules
            .map(
                (rule) => `
            <div style="font-size:0.85rem; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                <span style="color:var(--error)">✖ ${rule.metric}</span>: 
                You have <strong>${rule.userValue}</strong>, 
                ${fp.lenderName} requires <strong>${rule.limit}</strong>.
            </div>
        `
            )
            .join("");

        const card = document.createElement("div");
        card.style.background = "rgba(0,0,0,0.2)";
        card.style.padding = "10px";
        card.style.borderRadius = "5px";
        card.innerHTML = `
            <strong style="color:var(--text)">${fp.lenderName}</strong>
            <div style="margin-top:5px">${reasonsHTML}</div>
        `;
        list.appendChild(card);
    });
}

// Feature 1: "What-If" Sliders
function updateSliderLabels() {
    const dEmi = document.getElementById("delta-emi").value;
    const dInc = document.getElementById("delta-income").value;

    document.getElementById("delta-emi-label").textContent = `₹${parseInt(
        dEmi
    ).toLocaleString()}`;
    document.getElementById("delta-income-label").textContent = `₹${parseInt(
        dInc
    ).toLocaleString()}`;
}

async function runWhatIf() {
    if (!user) return;

    // We need current inputs. Ideally we should store them in a state variable
    // or re-read from the form if the user hasn't left the page.
    // For specific accuracy, we use the values currently in the input form (which the user just submitted).

    const currentInputs = {
        monthlyIncome: parseFloat(document.getElementById("income").value),
        existingEMI: parseFloat(document.getElementById("existing-emi").value) || 0,
        employmentType: document.getElementById("employment").value,
        loanAmount: parseFloat(document.getElementById("loan-amount").value),
        loanTenure: parseFloat(document.getElementById("tenure").value),
        age: parseInt(document.getElementById("age").value),
        loanPurpose: document.getElementById("loan-purpose").value,
        creditScore: document.getElementById("score").value,
    };

    // Validation
    if (isNaN(currentInputs.loanAmount) || isNaN(currentInputs.loanTenure)) {
        alert("Please ensure 'Loan Amount' and 'Tenure' are valid in the form above before simulating.");
        return;
    }

    const deltaIncome = document.getElementById("delta-income").value;
    const deltaEMI = document.getElementById("delta-emi").value;

    const resDiv = document.getElementById("simulation-result");

    // Smart Hint: Can't reduce 0 debt
    if (deltaEMI > 0 && currentInputs.existingEMI <= 0) {
        resDiv.style.color = "orange";
        resDiv.textContent = "You don't have any existing EMIs to reduce!";
        return;
    }
    resDiv.textContent = "Simulating...";
    resDiv.style.color = "var(--text-muted)";

    try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/eligibility/what-if`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                currentInputs,
                deltaIncome,
                deltaEMI,
            }),
        });
        const json = await res.json();

        if (json.success) {
            if (json.improvement > 0) {
                resDiv.style.color = "var(--success)";
                resDiv.textContent = `🎉 Good News! You would qualify for ${json.improvement} more lender(s)!`;
            } else if (
                parseFloat(json.simulation.foir) < parseFloat(json.baseline.foir)
            ) {
                resDiv.style.color = "var(--accent)";
                resDiv.textContent = `Your eligibility health improves (FOIR drops to ${json.simulation.foir}%), but you still need better stats to likely qualify.`;
            } else {
                resDiv.style.color = "orange";
                resDiv.textContent = "No significant change in eligibility status.";
            }
        } else {
            resDiv.textContent = "Simulation error.";
        }
    } catch (e) {
        console.error(e);
        resDiv.textContent = "Error running simulation.";
    }
}

// Feature 3: Account Aggregator
function startAAFlow() {
    const modal = document.getElementById("aa-modal");
    modal.classList.remove("hidden");

    // Reset state
    document.getElementById("aa-step-1").classList.remove("hidden");
    document.getElementById("aa-step-2").classList.add("hidden");

    // Simulate Network Delay
    setTimeout(() => {
        document.getElementById("aa-step-1").classList.add("hidden");
        document.getElementById("aa-step-2").classList.remove("hidden");
    }, 3000); // 3 seconds
}

function closeAAModal() {
    document.getElementById("aa-modal").classList.add("hidden");
    // Optional: Trigger a "Verified" badge or re-run check with higher trust score logic
}

// -----------------------------------------------------
// NEW: Advanced Features (OCR & Admin)
// -----------------------------------------------------

// Feature 4: OCR Document Verification
function handleOCR(input) {
    if (input.files && input.files[0]) {
        const statusEl = document.getElementById("ocr-status");
        statusEl.textContent = "Scanning document... ⏳";
        statusEl.style.color = "var(--secondary)";

        // Simulate processing delay
        setTimeout(() => {
            // Mock Extracted Data
            const randomIncome = Math.floor(Math.random() * (85000 - 45000) + 45000);

            document.getElementById("income").value = randomIncome;
            statusEl.innerHTML = "✅ <strong>Verified!</strong> Income extracted from HDFC Statement.";
            statusEl.style.color = "var(--success)";

            // Flash effect
            const incomeInput = document.getElementById("income");
            incomeInput.style.borderColor = "var(--success)";
            setTimeout(() => incomeInput.style.borderColor = "var(--glass-border)", 2000);

        }, 2500);
    }
}

// Feature 5: Admin Dashboard
async function showAdmin() {
    showScreen("admin");
    loadAdminData();
}

async function loadAdminData() {
    if (!user) return;
    try {
        let token = "";
        // Handle Mock Admin
        if (user.uid === "ADMIN_USER") {
            token = "mock-admin-token";
        } else {
            token = await user.getIdToken();
        }

        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Products
        try {
            const prodRes = await fetch(`${API_URL}/super/products`, { headers });
            const prodJson = await prodRes.json();

            if (prodJson.success) {
                renderAdminProducts(prodJson.data);
            }
        } catch (e) {
            console.error("Products Load Error:", e);
        }

        // 2. Fetch Applications
        try {
            const appRes = await fetch(`${API_URL}/super/applications`, { headers });
            const appJson = await appRes.json();

            if (appJson.success) {
                renderAdminApplications(appJson.data);
            }
        } catch (e) {
            console.error("Applications Load Error:", e);
        }

        // 3. Fetch Users
        try {
            const userRes = await fetch(`${API_URL}/super/users`, { headers });
            const userJson = await userRes.json();
            if (userJson.success) {
                renderAdminUsers(userJson.data);
            }
        } catch (e) {
            console.error("Users Load Error:", e);
        }

    } catch (e) {
        console.error("Admin Load Error:", e);
        // alert("Failed to load admin data"); // Suppressed repeated alerts
        console.error("Admin Load Error Detailed:", e);
        alert("Failed to connect to server. Ensure Backend is running (npm start).");
    }
}

function renderAdminUsers(users) {
    const container = document.getElementById("admin-users-list");
    if (!users || users.length === 0) {
        container.innerHTML = "<p>No users found.</p>";
        return;
    }
    container.innerHTML = users.map(u => `
        <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${u.email}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted)">ID: ${u.uid}</div>
            </div>
            <div style="text-align: right; font-size: 0.8rem; color: var(--text-muted)">
                Last Login: ${u.metadata && u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}
            </div>
        </div>
    `).join("");
}

function renderAdminProducts(products) {
    const tbody = document.getElementById("admin-products-list");
    tbody.innerHTML = products.map(p => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)">
            <td style="padding: 10px;">
                <strong>${p.lenderName}</strong>
                <br><small style="color: var(--text-muted)">${p.marketingTag}</small>
            </td>
            <td style="padding: 10px;">${p.loanType}</td>
            <td style="padding: 10px;">
                <input 
                    type="number" 
                    value="${p.interestRate}" 
                    step="0.1"
                    style="width: 80px; padding: 5px;"
                    id="rate-${p.id}"
                >
            </td>
            <td style="padding: 10px;">
                <button 
                    onclick="saveProduct(${p.id})" 
                    class="btn-primary" 
                    style="width: auto; padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;"
                >
                    Save
                </button>
                <button 
                    onclick="deleteProduct(${p.id})" 
                    class="btn-primary" 
                    style="width: auto; padding: 5px 10px; font-size: 0.8rem; background: var(--error);"
                >
                    ✕
                </button>
            </td>
        </tr>
    `).join("");
}

function renderAdminApplications(apps) {
    const container = document.getElementById("admin-applications-list");
    if (apps.length === 0) {
        container.innerHTML = "<p>No recent applications.</p>";
        return;
    }
    container.innerHTML = apps.map(app => `
        <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; justify-content: space-between;">
            <div>
                <strong>${app.email}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted)">
                    ${app.loanType || "Loan"} • ₹${(app.loanAmount || 0).toLocaleString()}
                </div>
            </div>
            <div style="text-align: right;">
                <span class="status-badge status-${app.eligibilityStatus}" style="font-size: 0.7rem; padding: 2px 8px; margin: 0;">${app.eligibilityStatus}</span>
                <div style="font-size: 0.8rem; margin-top: 5px;">FOIR: ${app.foir}%</div>
            </div>
        </div>
    `).join("");
}

async function saveProduct(id) {
    const newRate = document.getElementById(`rate-${id}`).value;
    try {
        let headers = {};
        if (user.uid === "ADMIN_USER") {
            headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer mock-admin-token"
            };
        } else {
            const token = await user.getIdToken();
            headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            };
        }

        const res = await fetch(`${API_URL}/super/products/${id}`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ interestRate: newRate })
        });
        const json = await res.json();
        if (json.success) {
            // Remove alert for better UX, or keep it but also refresh
            const btn = document.querySelector(`button[onclick="saveProduct(${id})"]`);
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = "Saved!";
                btn.style.background = "var(--success)";
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = "";
                }, 2000);
            }
        } else {
            alert("Update Failed");
        }
    } catch (e) {
        console.error(e);
        alert("Error updating product");
    }
}

async function addProduct() {
    const lender = prompt("Enter Lender Name:");
    if (!lender) return;
    const type = prompt("Enter Loan Type (Personal, Home, Education, Business):", "Personal");
    const rate = prompt("Enter Interest Rate:", "10.0");

    try {
        let headers = {};
        if (user.uid === "ADMIN_USER") {
            headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer mock-admin-token"
            };
        } else {
            headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await user.getIdToken()}`
            };
        }

        const res = await fetch(`${API_URL}/super/products`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                lenderName: lender,
                loanType: type,
                interestRate: parseFloat(rate),
                tenure: 60, // Default
                maxLoanAmount: 1000000, // Default
                marketingTag: "New Lender"
            })
        });
        const json = await res.json();
        if (json.success) {
            alert("Product Added!");
            loadAdminData(); // Refresh list
        }
    } catch (e) {
        console.error(e);
        alert("Error creating product");
    }
}

async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        let headers = {};
        if (user.uid === "ADMIN_USER") {
            headers = { "Authorization": "Bearer mock-admin-token" };
        } else {
            headers = { Authorization: `Bearer ${await user.getIdToken()}` };
        }

        const res = await fetch(`${API_URL}/super/products/${id}`, {
            method: "DELETE",
            headers
        });
        const json = await res.json();
        if (json.success) {
            if (json.success) {
                loadAdminData(); // Refresh
            } else {
                alert("Delete failed on server");
            }
        }
    } catch (e) {
        console.error(e);
        alert("Error deleting product");
    }
}
