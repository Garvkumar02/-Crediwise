const mongoose = require("mongoose");

const EligibilitySchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
    },
    income: Number,
    totalEmi: Number,
    foir: Number,
    dti: Number,
    eligibilityStatus: String,
    reason: String,

    // Extended Fields
    age: Number,
    employmentType: String,
    loanPurpose: String,
    loanAmount: Number,
    tenure: Number,
    creditScore: Number,
    isScoreSimulated: Boolean,
    recommendedProducts: [Object], // Store snapshot of recommendations

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Eligibility", EligibilitySchema);