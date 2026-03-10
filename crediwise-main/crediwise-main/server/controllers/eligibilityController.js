const { calculateEMI } = require("../services/emiCalculator");
const { checkEligibility } = require("../services/eligibilityEngine");

exports.checkEligibility = async (req, res) => {
    try {
        const {
            monthlyIncome,
            existingEMI,
            loanAmount,
            loanTenure,
            employmentType,
            age, // NEW
            loanPurpose, // NEW
            creditScore, // NEW
        } = req.body;

        // Basic validation
        if (!monthlyIncome || !loanAmount || !loanTenure || !age || !loanPurpose) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newEMI = calculateEMI(loanAmount, 12, loanTenure); // Base estimation

        const eligibility = await checkEligibility({ // AWAIT ADDED
            monthlyIncome,
            existingEMI: existingEMI || 0,
            newEMI,
            employmentType,
            age: parseInt(age),
            loanAmount,
            loanTenure,
            loanPurpose,
            providedScore: creditScore ? parseInt(creditScore) : null,
        });

        const resultData = {
            ...eligibility,
            estimatedEMI: newEMI,
        };

        // Save to MongoDB if user is authenticated
        console.log("[ELIGIBILITY] Saving? User:", req.user ? req.user.uid : "No User");
        if (req.user && req.user.uid) {
            try {
                const Eligibility = require("../models/Eligibility");
                await Eligibility.create({
                    uid: req.user.uid,
                    email: req.user.email,
                    income: monthlyIncome,
                    totalEmi: (existingEMI || 0) + newEMI,
                    foir: parseFloat(eligibility.metrics.foir),
                    dti: parseFloat(eligibility.metrics.dti),
                    eligibilityStatus: eligibility.status,
                    reason: eligibility.reason,

                    // NEW FIELDS
                    age,
                    employmentType,
                    loanPurpose,
                    loanAmount,
                    tenure: loanTenure,
                    creditScore: eligibility.metrics.creditScore,
                    isScoreSimulated: eligibility.metrics.isScoreSimulated,
                    recommendedProducts: eligibility.recommendedProducts || [],
                });
            } catch (dbError) {
                console.error("Error saving to MongoDB:", dbError.message);
            }
        }

        res.json({
            success: true,
            data: resultData,
        });
    } catch (error) {
        console.error("Error in checkEligibility:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const Eligibility = require("../models/Eligibility");
        // Fetch latest record
        const latest = await Eligibility.findOne({ uid: req.user.uid }).sort({
            createdAt: -1,
        });

        if (!latest) {
            return res.json({ success: true, data: null });
        }

        // Format rich history
        const formatted = {
            result: {
                status: latest.eligibilityStatus,
                reason: latest.reason,
                metrics: {
                    foir: latest.foir,
                    creditScore: latest.creditScore,
                    isScoreSimulated: latest.isScoreSimulated,
                },
                recommendedProducts: latest.recommendedProducts,
            },
            timestamp: latest.createdAt,
            inputs: {
                loanPurpose: latest.loanPurpose,
                loanAmount: latest.loanAmount,
                monthlyIncome: latest.income, // Needed for What-If
                totalEmi: latest.totalEmi, // Needed for What-If
            },
        };

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.simulateWhatIf = async (req, res) => {
    try {
        const {
            currentInputs, // { monthlyIncome, existingEMI, ... all original inputs ... }
            deltaIncome, // e.g. +5000
            deltaEMI, // e.g. -2000
        } = req.body;

        // Helper to prepare inputs for service
        const prepareInputs = (inputs) => {
            console.log("[DEBUG] Preparing inputs:", JSON.stringify(inputs));
            const loanAmount = parseFloat(inputs.loanAmount);
            const loanTenure = parseFloat(inputs.loanTenure);
            if (isNaN(loanAmount) || isNaN(loanTenure)) throw new Error("Invalid Loan Amount or Tenure");

            const newEMI = calculateEMI(loanAmount, 12, loanTenure);
            return {
                monthlyIncome: parseFloat(inputs.monthlyIncome),
                existingEMI: parseFloat(inputs.existingEMI || 0),
                newEMI: newEMI,
                employmentType: inputs.employmentType,
                age: parseInt(inputs.age),
                loanAmount: loanAmount,
                loanTenure: loanTenure,
                loanPurpose: inputs.loanPurpose,
                providedScore: inputs.creditScore ? parseInt(inputs.creditScore) : null
            };
        };

        const baselineInputs = prepareInputs(currentInputs);
        // 1. Run Baseline Check (to double check current state)
        const baseline = await checkEligibility(baselineInputs);
        const baselineCount = baseline.recommendedProducts ? baseline.recommendedProducts.length : 0;

        // 2. Prepare Simulated Inputs (Modify the RAW inputs first)
        // DEBUG LOGGING
        console.log(`[SIMULATION] Income: ${currentInputs.monthlyIncome} + ${deltaIncome}`);
        console.log(`[SIMULATION] EMI: ${currentInputs.existingEMI} - ${deltaEMI}`);

        const rawSimulatedInputs = {
            ...currentInputs,
            monthlyIncome:
                (parseFloat(currentInputs.monthlyIncome) || 0) + (parseFloat(deltaIncome) || 0),
            existingEMI: Math.max(
                0,
                (parseFloat(currentInputs.existingEMI) || 0) - (parseFloat(deltaEMI) || 0)
            ),
        };
        console.log(`[SIMULATION] New EMI: ${rawSimulatedInputs.existingEMI}`);

        const simulatedServiceInputs = prepareInputs(rawSimulatedInputs);

        // 3. Run Simulated Check
        const simulation = await checkEligibility(simulatedServiceInputs);
        const simulationCount = simulation.recommendedProducts.length;

        // 4. Calculate Improvement
        const improvement = simulationCount - baselineCount;

        // 5. Generate Insight Text
        let message = "No change in eligibility.";
        if (improvement > 0) {
            message = `You qualify for ${improvement} MORE lender(s)!`;
        } else if (parseFloat(simulation.metrics.foir) < parseFloat(baseline.metrics.foir)) {
            message = `Your Financial Health improves (FOIR: ${baseline.metrics.foir}% → ${simulation.metrics.foir}%), but no new lenders yet.`;
        }

        res.json({
            success: true,
            baseline: {
                foir: baseline.metrics.foir,
                eligibleCount: baselineCount,
            },
            simulation: {
                foir: simulation.metrics.foir,
                eligibleCount: simulationCount,
            },
            improvement,
            message,
        });
    } catch (error) {
        console.error("Error in What-If:", error);
        res.status(500).json({ error: "Simulation Failed" });
    }
};
