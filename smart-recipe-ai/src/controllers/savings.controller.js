const savingsService = require("../services/savings.service");

/**
 * Record a new saving when user finishes cooking a recipe
 * POST /api/savings
 */
const recordSaving = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { recipeTitle, moneySavedRupiah, foodSavedKg } = req.body;

    if (!recipeTitle || typeof recipeTitle !== "string" || recipeTitle.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "'recipeTitle' is required and must be a non-empty string",
      });
    }

    if (moneySavedRupiah === undefined || moneySavedRupiah === null || typeof moneySavedRupiah !== "number" || moneySavedRupiah < 0) {
      return res.status(400).json({
        success: false,
        message: "'moneySavedRupiah' is required and must be a number greater than or equal to 0",
      });
    }

    if (foodSavedKg === undefined || foodSavedKg === null || typeof foodSavedKg !== "number" || foodSavedKg < 0) {
      return res.status(400).json({
        success: false,
        message: "'foodSavedKg' is required and must be a number greater than or equal to 0",
      });
    }

    const data = await savingsService.recordSaving(userId, {
      recipeTitle,
      moneySavedRupiah,
      foodSavedKg,
    });

    return res.status(201).json({
      success: true,
      message: "Saving record created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all savings for the authenticated user
 * GET /api/savings
 */
const getSavings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const savings = await savingsService.getSavings(userId);

    return res.status(200).json({
      success: true,
      count: savings.length,
      data: { savings },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get savings summary and growth metrics for the authenticated user
 * GET /api/savings/summary
 */
const getSavingsSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const summary = await savingsService.getSavingsSummary(userId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordSaving,
  getSavings,
  getSavingsSummary,
};
