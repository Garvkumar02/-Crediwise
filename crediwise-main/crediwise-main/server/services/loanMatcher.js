

/**
 * Mock Loan Products
 */
const LOAN_PRODUCTS = [
    {
        id: 1,
        name: "Flexi Personal Loan",
        minScore: 650,
        maxTenure: 60,
        interestRate: 12.5,
    },
    {
        id: 2,
        name: "Premium Salaried Loan",
        minScore: 750,
        maxTenure: 48,
        interestRate: 10.5,
    },
    {
        id: 3,
        name: "Gig Worker Special",
        minScore: 600,
        maxTenure: 24,
        interestRate: 14.0,
    },
    {
        id: 4,
        name: "Instant Cash",
        minScore: 0,
        maxTenure: 12,
        interestRate: 18.0,
    }, // High rate, low barrier
];

/**
 * Get Loan Recommendations
 * @param {string} employmentType
 * @param {number} creditScore
 * @param {number} requestedTenure
 * @returns {Array} List of matching products
 */
function getRecommendations(employmentType, creditScore = 0, requestedTenure) {
    // Filter based on basic criteria
    const matches = LOAN_PRODUCTS.filter((product) => {
        // Tenure check
        if (requestedTenure > product.maxTenure) return false;

        // Credit Score check (if provided)
        if (creditScore && creditScore < product.minScore) return false;

        // Employment type specific logic (mock)
        if (employmentType === "Gig" && product.name === "Premium Salaried Loan")
            return false;

        return true;
    });

    // Sort by interest rate (lowest first)
    return matches.sort((a, b) => a.interestRate - b.interestRate).slice(0, 3);
}

module.exports = { getRecommendations, LOAN_PRODUCTS };
