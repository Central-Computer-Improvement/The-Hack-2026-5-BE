const favoritesService = require("../services/favorites.service");

/**
 * Add Recipe to Favorites
 * POST /api/favorites
 */
const addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recipeData = req.body;

    if (!recipeData || !recipeData.title) {
      return res.status(400).json({
        success: false,
        message: "Recipe payload with at least a 'title' field is required",
      });
    }

    const data = await favoritesService.addFavorite(userId, recipeData);

    return res.status(201).json({
      success: true,
      message: "Recipe added to favorites successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Favorite Recipes
 * GET /api/favorites
 */
const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const favorites = await favoritesService.getFavorites(userId);

    return res.status(200).json({
      success: true,
      count: favorites.length,
      data: { favorites },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Favorite Recipe
 * DELETE /api/favorites/:id
 */
const removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const favoriteId = req.params.id;

    const result = await favoritesService.removeFavorite(userId, favoriteId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite,
};
