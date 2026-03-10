# 🏦 CrediWise - Smart Loan Eligibility System

**CrediWise** is a full-stack financial technology application designed to bridge the gap between borrowers and lenders. It uses a custom **Eligibility Engine** to evaluate financial health, simulate credit scores, and provide transparent approval/rejection analysis.

🌐 **Live Demo:** [credwise-five.vercel.app](https://credwise-five.vercel.app/)

---

## 🚀 Key Features

* **🧠 Smart Eligibility Engine**: Evaluates users against strict lender constraints (Income, FOIR, Credit Score, Employment).
* **📊 Credit Score Simulator**: Estimates creditworthiness using alternative data points if a formal score is unavailable.
* **⚖️ FOIR & DTI Calculation**: Automated Debt-to-Income analysis to prevent over-leveraging.
* **🔍 "Why Not?" Transparency**: Detailed reports explaining exactly why an application was rejected.
* **🔄 What-If Simulator**: Interactive sliders to see how changing income or tenure affects eligibility.
* **🛡️ Secure Auth**: Integrated Firebase Authentication with JWT-protected Node.js routes.
* **💼 Admin Dashboard**: Management portal for lenders to update loan products and view metrics.

---

## 🛠️ Technical Architecture

### Tech Stack
* **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (Mongoose ODM)
* **Auth**: Firebase Auth (Client) + Server-side JWT Verification
* **Deployment**: Vercel

### System Logic (FOIR Thresholds)
| FOIR Range | Status | Outcome |
| :--- | :--- | :--- |
| **< 40%** | ✅ HIGHLY ELIGIBLE | Matches with premium lenders |
| **40% - 50%** | ⚠️ CONDITIONAL | Requires alternative data/higher interest |
| **> 50%** | ❌ REJECTED | Debt-to-Income ratio too high |

---

## 📂 Project Structure

```text
crediwise-main/
├── server/                 # Backend Logic
│   ├── config/             # DB & Firebase configurations
│   ├── controllers/        # Request handlers (API logic)
│   ├── services/           # The "Brain" (Eligibility Engine & Calculators)
│   ├── models/             # Mongoose Schemas
│   ├── routes/             # API Endpoints
│   └── middleware/         # Authentication & Security
├── public/                 # Frontend Assets
│   ├── app.js              # SPA State Management & UI Logic
│   ├── firebase-init.js    # Dynamic Firebase config
│   ├── index.html          # Main Entry Point
│   └── style.css           # Custom UI/UX Design
└── package.json            # Dependencies 
