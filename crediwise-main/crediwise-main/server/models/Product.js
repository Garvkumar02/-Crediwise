const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    lenderName: { type: String, required: true },
    loanType: {
        type: String,
        enum: ["Personal", "Home", "Education", "Business"],
        required: true,
    },
    interestRate: { type: Number, required: true },
    tenure: { type: Number, required: true }, // Max tenure in months
    maxLoanAmount: { type: Number, required: true },
    marketingTag: { type: String },
    constraints: {
        minCreditScore: { type: Number, default: 0 },
        maxFOIR: { type: Number, default: 60 },
        minIncome: { type: Number, default: 0 },
        allowedEmployment: [{ type: String }], // ["Salaried", "Self-Employed", etc]
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", ProductSchema);
