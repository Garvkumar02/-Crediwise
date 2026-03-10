/**
 * Caclulate EMI
 * Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * @param {number} principal - Loan amount
 * @param {number} rate - Annual interest rate (percentage)
 * @param {number} tenureMonths - Tenure in months
 * @returns {number} Monthly EMI
 */
function calculateEMI(principal, rate, tenureMonths) {
    if (!principal || !rate || !tenureMonths) return 0;

    // Convert annual rate to monthly rate and percentage to decimal
    const monthlyRate = rate / 12 / 100;

    // Calculate EMI
    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;

    const emi = numerator / denominator;
    return Math.round(emi); // Return rounded EMI
}

module.exports = { calculateEMI };


