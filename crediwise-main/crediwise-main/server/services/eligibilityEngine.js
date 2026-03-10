const { getAllProducts } = require("./loanProducts");
const { calculateEMI } = require("./emiCalculator");

// NEW: Evaluate User Against Specific Product Constraints
function evaluateProductForUser(product, user, loanTenure) {
    const failures = [];
    const constraints = product.constraints;

    if (!constraints)
        return {
            productId: product.id,
            lenderName: product.lenderName,
            status: "APPROVED",
            failedRules: [],
            productDetails: product,
        };

    // 1. Employment Check
    if (
        constraints.allowedEmployment &&
        !constraints.allowedEmployment.includes(user.employmentType)
    ) {
        failures.push({
            metric: "Employment Type",
            userValue: user.employmentType,
            limit: constraints.allowedEmployment.join("/"),
            message: `Lender requires ${constraints.allowedEmployment.join(" or ")}`,
        });
    }

    // 1.5 Tenure Check
    if (loanTenure && product.tenure && loanTenure > product.tenure) {
        failures.push({
            metric: "Loan Tenure",
            userValue: `${loanTenure} months`,
            limit: `${product.tenure} months`,
            message: `Lender max tenure is ${product.tenure} months`,
        });
    }

    // 2. Income Check
    if (user.monthlyIncome < constraints.minIncome) {
        failures.push({
            metric: "Monthly Income",
            userValue: user.monthlyIncome,
            limit: constraints.minIncome,
            message: `Income below lender minimum of ₹${constraints.minIncome}`,
        });
    }

    // 3. Credit Score Check (if user has one)
    if (user.creditScore && user.creditScore < constraints.minCreditScore) {
        failures.push({
            metric: "Credit Score",
            userValue: user.creditScore,
            limit: constraints.minCreditScore,
            message: `Score below lender minimum of ${constraints.minCreditScore}`,
        });
    }

    // 4. FOIR Check
    if (user.foir > constraints.maxFOIR) {
        failures.push({
            metric: "FOIR (Debt Ratio)",
            userValue: `${user.foir.toFixed(1)}%`,
            limit: `${constraints.maxFOIR}%`,
            message: `Your debt obligation (${user.foir.toFixed(
                1
            )}%) exceeds limit (${constraints.maxFOIR}%)`,
        });
    }

    return {
        productId: product.id,
        lenderName: product.lenderName,
        status: failures.length === 0 ? "APPROVED" : "REJECTED",
        failedRules: failures,
        productDetails: product,
    };
}

function simulateCreditScore(income, existingEMI, employmentType) {
    let baseScore = 650; // Initial baseline
    if (employmentType === "Salaried") baseScore += 50;
    if (income > 50000) baseScore += 40;

    // Debt impact
    const ratio = existingEMI / income;
    if (ratio < 0.3) baseScore += 30;
    else if (ratio > 0.6) baseScore -= 50;

    return Math.min(900, Math.max(300, baseScore));
}

async function checkEligibility({
    monthlyIncome,
    existingEMI,
    newEMI,
    employmentType,
    age,
    loanAmount,
    loanTenure,
    loanPurpose,
    providedScore,
}) {
    // 0. Fetch Products dynamically
    const products = await getAllProducts(); // NEW: Await DB fetch
    // 1. Determine Credit Score
    let creditScore = providedScore;
    let isScoreSimulated = false;

    if (!creditScore) {
        creditScore = simulateCreditScore(
            monthlyIncome,
            existingEMI,
            employmentType
        );
        isScoreSimulated = true;
    }

    // 2. Calculate FOIR & DTI
    // Note: For now, reusing monthlyIncome for both Net (FOIR) and Gross (DTI)
    // In a real scenario, we would ask for separate Net/Gross incomes.
    const totalObligations = existingEMI + newEMI;
    const foir = (totalObligations / monthlyIncome) * 100;
    const dti = foir; // Same logic for now, but conceptualized differently

    // 3. Determine Core Engine Status based on FOIR
    let foirStatus = "REJECTED";
    let coreAction = "";

    if (foir < 40) {
        foirStatus = "HIGHLY_ELIGIBLE";
        coreAction = "Matches with premium, low-interest lenders.";
    } else if (foir >= 40 && foir <= 50) {
        foirStatus = "CONDITIONAL";
        coreAction =
            "May require 'Alternative Data' (GST, Utility bills) to qualify.";
    } else {
        // > 50%
        foirStatus = "REJECTED";
        coreAction = "Triggers 'Transparent Logic' to explain the rejection.";
    }

    // 4. Detailed Product Analysis ("Why Not?")
    const productEvaluations = products
        .filter((p) => !p.loanType || p.loanType === loanPurpose) // Filter by Purpose first
        .map((product) =>
            evaluateProductForUser(product, {
                monthlyIncome,
                employmentType,
                creditScore,
                foir,
            }, loanTenure)
        );

    // 5. Select Recommended Products (Approved ones)
    // If FOIR > 50%, we strictly reject in the main status, regardless of individual product config
    // unless we want to allow lenient products. The prompt implies >50% is "Rejected".

    let recommendedProducts = [];

    if (foir <= 50) {
        recommendedProducts = productEvaluations
            .filter((productEval) => productEval.status === "APPROVED")
            .map((productEval) => {
                const p = productEval.productDetails;
                return {
                    id: p.id,
                    lenderName: p.lenderName,
                    loanType: p.loanType,
                    marketingTag: p.marketingTag,
                    interestRate: p.interestRate,
                    maxTenure: p.tenure,
                    estimatedEMI: calculateEMI(loanAmount, p.interestRate, loanTenure),
                    totalAmountPayable:
                        calculateEMI(loanAmount, p.interestRate, loanTenure) * loanTenure,
                };
            })
            .sort((a, b) => a.estimatedEMI - b.estimatedEMI)
            .slice(0, 3);
    }

    // 6. Overall Status
    let overallStatus = foirStatus === "REJECTED" ? "REJECTED" : "CONDITIONAL";

    if (recommendedProducts.length > 0) {
        overallStatus = "ELIGIBLE";
    }

    // Override if FOIR status is strictly REJECTED (Rule of thumb > 50%)
    if (foirStatus === "REJECTED") {
        overallStatus = "REJECTED";
    } else if (overallStatus === "ELIGIBLE" && foirStatus === "CONDITIONAL") {
        // Keep as ELIGIBLE but maybe warn? Or strictly follow the prompt's status?
        // The prompt says "Conditional" status for 40-50%.
        // If we found products but fall in 40-50 range, maybe we flag it.
        // For this implementation, I will treat ELIGIBLE as the final API status if products are found,
        // but pass the granular foirStatus for the UI to display.
    }

    return {
        status: overallStatus,
        foirStatus: foirStatus, // New Field
        coreAction: coreAction, // New Field
        message: coreAction, // Exposed to Frontend
        reason:
            overallStatus === "ELIGIBLE"
                ? `You qualify for ${recommendedProducts.length} loan product(s).`
                : overallStatus === "REJECTED" && foir > 50
                    ? "Your Fixed Obligations > 50% of income. High Risk."
                    : "You do not meet the strict criteria for any lender.",
        metrics: {
            foir: foir.toFixed(2),
            dti: dti.toFixed(2), // New Field
            creditScore,
            isScoreSimulated,
        },
        // RETURN FULL EVALUATIONS FOR "WHY NOT" UI
        productEvaluations: productEvaluations.map((e) => ({
            lenderName: e.lenderName,
            status: e.status,
            failedRules: e.failedRules,
        })),
        recommendedProducts,
    };
}

module.exports = {
    checkEligibility,
    simulateCreditScore,
};
