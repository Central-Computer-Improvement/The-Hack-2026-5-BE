const prisma = require("../config/db");

// In-memory store fallback for favorites: Map<userId, Map<favoriteId, Recipe>>
const inMemoryFavorites = new Map();

/**
 * Add a recipe to user's favorites
 */
const addFavorite = async (userId, recipeData) => {
  const {
    id: recipeId,
    title,
    description = "",
    prepTimeMinutes = 15,
    cookingTools = [],
    usedIngredients = [],
    missingIngredients = [],
    estimatedSavings = {},
    steps = [],
  } = recipeData;

  if (!title) {
    const error = new Error("Recipe title is required");
    error.statusCode = 400;
    throw error;
  }

  // Prisma DB Operation
  if (prisma) {
    try {
      const favorite = await prisma.favoriteRecipe.create({
        data: {
          userId,
          recipeId: recipeId || null,
          title,
          description,
          prepTimeMinutes,
          cookingTools,
          usedIngredients,
          missingIngredients,
          estimatedSavings,
          steps,
        },
      });
      return favorite;
    } catch (err) {
      console.warn("DB operation failed, using in-memory favorites store:", err.message);
    }
  }

  // Fallback In-Memory
  if (!inMemoryFavorites.has(userId)) {
    inMemoryFavorites.set(userId, new Map());
  }
  const userFavs = inMemoryFavorites.get(userId);

  const favoriteId = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const favoriteItem = {
    id: favoriteId,
    userId,
    recipeId: recipeId || null,
    title,
    description,
    prepTimeMinutes,
    cookingTools,
    usedIngredients,
    missingIngredients,
    estimatedSavings,
    steps,
    createdAt: new Date().toISOString(),
  };

  userFavs.set(favoriteId, favoriteItem);
  return favoriteItem;
};

/**
 * Get all favorite recipes for a user
 */
const getFavorites = async (userId) => {
  if (prisma) {
    try {
      const favorites = await prisma.favoriteRecipe.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (favorites && favorites.length >= 0) {
        return favorites;
      }
    } catch (err) {
      console.warn("DB operation failed, fetching in-memory favorites:", err.message);
    }
  }

  const userFavs = inMemoryFavorites.get(userId);
  if (!userFavs) return [];
  return Array.from(userFavs.values());
};

/**
 * Remove a recipe from user's favorites
 */
const removeFavorite = async (userId, favoriteId) => {
  if (prisma) {
    try {
      await prisma.favoriteRecipe.deleteMany({
        where: { id: favoriteId, userId },
      });
      return { message: "Favorite recipe removed successfully" };
    } catch (err) {
      console.warn("DB operation failed, using in-memory for remove favorite:", err.message);
    }
  }

  const userFavs = inMemoryFavorites.get(userId);
  if (userFavs) {
    userFavs.delete(favoriteId);
  }
  return { message: "Favorite recipe removed successfully" };
};

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite,
};
