const aiService = require("../services/ai.service");

/**
 * Generate Recipes Endpoint
 * POST /api/ai/generate-recipes
 */
const generateRecipes = async (req, res, next) => {
  try {
    const { ingredients, kitchenFilters } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one ingredient must be provided in the 'ingredients' array",
      });
    }

    const data = await aiService.generateRecipes({ ingredients, kitchenFilters });

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
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: "'imageBase64' field is required for pantry vision scanning",
      });
    }

    const data = await aiService.scanPantryImage({ imageBase64 });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateRecipes,
  scanPantry,
};
