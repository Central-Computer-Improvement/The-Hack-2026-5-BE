const aiService = require("../services/ai.service");

/**
 * Generate Recipes Endpoint
 * POST /api/ai/generate-recipes
 */
const generateRecipes = async (req, res, next) => {
  try {
    const { ingredients, kitchenFilters } = req.body;
    const userId = req.user?.id || null;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one ingredient must be provided in the 'ingredients' array",
      });
    }

    const data = await aiService.generateRecipes({ ingredients, kitchenFilters, userId });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Scan Pantry Endpoint (Vision Input)
 * POST /api/ai/scan-pantry
 */
const scanPantry = async (req, res, next) => {
  try {
    const { imageBase64, imageUrl } = req.body;

    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "'imageBase64' or 'imageUrl' field is required for pantry vision scanning",
      });
    }

    const data = await aiService.scanPantryImage({ imageBase64, imageUrl });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Get Recipe History Endpoint (Max 10 Items)
 * GET /api/ai/history
 */
const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await aiService.getRecipeHistory(userId);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: { history },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear Recipe History Endpoint
 * DELETE /api/ai/history
 */
const clearHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await aiService.clearRecipeHistory(userId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateRecipes,
  scanPantry,
  getHistory,
  clearHistory,
};

