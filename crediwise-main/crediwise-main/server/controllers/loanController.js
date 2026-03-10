const { getRecommendations } = require("../services/loanMatcher");

exports.getRecommendations = (req, res) => {
  try {
    const { employmentType, creditScore, tenure } = req.query;

    const products = getRecommendations(
      employmentType,
      parseInt(creditScore) || 0,
      parseInt(tenure) || 12
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
