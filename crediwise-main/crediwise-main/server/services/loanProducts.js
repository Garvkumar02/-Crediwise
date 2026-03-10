const Product = require("../models/Product");

// Initial Seed Data (from original static file)
const DEFAULT_PRODUCTS = [
  // --- PERSONAL LOANS ---
  {
    id: 1,
    lenderName: "SBI",
    loanType: "Personal",
    interestRate: 10.5,
    tenure: 60,
    maxLoanAmount: 2000000,
    marketingTag: "Low Interest for Salaried",
    constraints: {
      minCreditScore: 750,
      maxFOIR: 50,
      minIncome: 30000, // Note: original was inside constraints
      allowedEmployment: ["Salaried"],
    },
  },
  {
    id: 2,
    lenderName: "HDFC Bank",
    loanType: "Personal",
    interestRate: 11.25,
    tenure: 48,
    maxLoanAmount: 1500000,
    marketingTag: "Quick Approval (10 Mins)",
    constraints: {
      minCreditScore: 700,
      maxFOIR: 60,
      minIncome: 25000,
      allowedEmployment: ["Salaried", "Self-Employed"],
    },
  },
  {
    id: 4,
    lenderName: "Bajaj Finserv",
    loanType: "Personal",
    interestRate: 14.0,
    tenure: 36,
    maxLoanAmount: 500000,
    marketingTag: "Instant Cash - Minimum Docs",
    constraints: {
      minCreditScore: 650,
      maxFOIR: 65,
      minIncome: 15000,
      allowedEmployment: ["Salaried", "Self-Employed", "Gig"],
    },
  },
  {
    id: 5,
    lenderName: "KreditBee",
    loanType: "Personal",
    interestRate: 18.0,
    tenure: 24,
    maxLoanAmount: 200000,
    marketingTag: "Startups & Gig Workers Welcome",
    constraints: {
      minCreditScore: 600,
      maxFOIR: 70,
      minIncome: 10000,
      allowedEmployment: ["Salaried", "Self-Employed", "Gig", "Student"],
    },
  },
  {
    id: 6,
    lenderName: "ICICI Bank",
    loanType: "Personal",
    interestRate: 10.99,
    tenure: 60,
    maxLoanAmount: 2500000,
    marketingTag: "Pre-Approved for Existing Customers",
    constraints: {
      minCreditScore: 725,
      maxFOIR: 55,
      minIncome: 35000,
      allowedEmployment: ["Salaried"],
    },
  },

  // --- EDUCATION LOANS ---
  {
    id: 3,
    lenderName: "CrediWise Student Aid",
    loanType: "Education",
    interestRate: 8.5,
    tenure: 84,
    maxLoanAmount: 4000000,
    marketingTag: "Zero Collateral for Top Unis",
    constraints: {
      minCreditScore: 0,
      maxFOIR: 100,
      minIncome: 0,
      allowedEmployment: ["Student"],
    },
  },
  {
    id: 7,
    lenderName: "Avanse Financial",
    loanType: "Education",
    interestRate: 10.0,
    tenure: 120, // 10 years
    maxLoanAmount: 5000000,
    marketingTag: "Study Abroad Special",
    constraints: {
      minCreditScore: 0,
      maxFOIR: 100,
      minIncome: 0,
      allowedEmployment: ["Student"],
    },
  },
  {
    id: 8,
    lenderName: "SBI Scholar",
    loanType: "Education",
    interestRate: 8.15,
    tenure: 180, // 15 years
    maxLoanAmount: 2000000,
    marketingTag: "Lowest Rates in India",
    constraints: {
      minCreditScore: 0,
      maxFOIR: 100,
      minIncome: 0,
      allowedEmployment: ["Student"],
    },
  },

  // --- HOME LOANS ---
  {
    id: 9,
    lenderName: "LIC Housing Finance",
    loanType: "Home",
    interestRate: 8.4,
    tenure: 240, // 20 years
    maxLoanAmount: 10000000,
    marketingTag: "Low EMIs for First Time Buyers",
    constraints: {
      minCreditScore: 720,
      maxFOIR: 50,
      minIncome: 30000,
      allowedEmployment: ["Salaried", "Self-Employed"],
    },
  },
  {
    id: 10,
    lenderName: "HDFC Reach",
    loanType: "Home",
    interestRate: 9.5,
    tenure: 180, // 15 years
    maxLoanAmount: 5000000,
    marketingTag: "For Informal Income Earners",
    constraints: {
      minCreditScore: 650,
      maxFOIR: 60,
      minIncome: 20000,
      allowedEmployment: ["Salaried", "Self-Employed", "Gig"],
    },
  },

  // --- BUSINESS LOANS ---
  {
    id: 11,
    lenderName: "LendingKart",
    loanType: "Business",
    interestRate: 15.0,
    tenure: 36,
    maxLoanAmount: 1000000,
    marketingTag: "Approved on GST Returns",
    constraints: {
      minCreditScore: 650,
      maxFOIR: 75,
      minIncome: 50000,
      allowedEmployment: ["Self-Employed"],
    },
  },
  {
    id: 12,
    lenderName: "Tata Capital",
    loanType: "Business",
    interestRate: 12.5,
    tenure: 48,
    maxLoanAmount: 3000000,
    marketingTag: "Flexible Repayment",
    constraints: {
      minCreditScore: 700,
      maxFOIR: 60,
      minIncome: 40000,
      allowedEmployment: ["Self-Employed"],
    },
  },
];

/**
 * Initialize DB with default products if empty
 */
async function seedProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log("Seeding initial products to DB...");
      await Product.insertMany(DEFAULT_PRODUCTS);
      console.log("Products seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding products:", error);
  }
}

// Run seed on load (called from index.js via require usually, or we call it explicitly)
// Ideally, this should be called at server startup.
// For now, we export a function to get products that ensures we have data.

async function getAllProducts() {
  // Ensure data exists (lazy seed check)
  //   await seedProducts(); // In prod, better to run once at startup
  return await Product.find().sort({ interestRate: 1 });
}

module.exports = {
  getAllProducts,
  seedProducts,
  // We export the raw list as fallback ONLY if DB fails? No, let's stick to DB.
};
