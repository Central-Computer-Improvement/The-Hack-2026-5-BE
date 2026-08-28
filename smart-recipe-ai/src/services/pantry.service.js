const prisma = require("../config/db");

// In-memory fallback pantry store: Map<userId, Map<pantryItemId, Item>>
const inMemoryPantry = new Map();

/**
 * Get all pantry items for user
 */
const getPantryItems = async (userId) => {
  if (prisma) {
    try {
      const items = await prisma.pantryItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (items && items.length >= 0) {
        return items;
      }
    } catch (err) {
      console.warn("DB operation failed, fetching in-memory pantry:", err.message);
    }
  }

  const userPantry = inMemoryPantry.get(userId);
  if (!userPantry) return [];
  return Array.from(userPantry.values());
};

/**
 * Add a pantry item
 */
const addPantryItem = async (userId, { name, quantity, category = "Umum", isExpiringSoon = false }) => {
  if (!name) {
    const error = new Error("Ingredient name is required");
    error.statusCode = 400;
    throw error;
  }

  if (prisma) {
    try {
      const item = await prisma.pantryItem.create({
        data: {
          userId,
          name,
          quantity: quantity || "secukupnya",
          category,
          isExpiringSoon: Boolean(isExpiringSoon),
        },
      });
      return item;
    } catch (err) {
      console.warn("DB operation failed, using in-memory store for add pantry:", err.message);
    }
  }

  if (!inMemoryPantry.has(userId)) {
    inMemoryPantry.set(userId, new Map());
  }
  const userPantry = inMemoryPantry.get(userId);

  const itemId = `pantry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const item = {
    id: itemId,
    userId,
    name,
    quantity: quantity || "secukupnya",
    category,
    isExpiringSoon: Boolean(isExpiringSoon),
    createdAt: new Date().toISOString(),
  };

  userPantry.set(itemId, item);
  return item;
};

/**
 * Update a pantry item
 */
const updatePantryItem = async (userId, itemId, updateData) => {
  if (prisma) {
    try {
      const updated = await prisma.pantryItem.updateMany({
        where: { id: itemId, userId },
        data: updateData,
      });
      if (updated) {
        return { message: "Pantry item updated successfully" };
      }
    } catch (err) {
      console.warn("DB operation failed, using in-memory store for update pantry:", err.message);
    }
  }

  const userPantry = inMemoryPantry.get(userId);
  if (userPantry && userPantry.has(itemId)) {
    const existing = userPantry.get(itemId);
    const updated = { ...existing, ...updateData };
    userPantry.set(itemId, updated);
    return updated;
  }

  const error = new Error("Pantry item not found");
  error.statusCode = 404;
  throw error;
};

/**
 * Delete a pantry item
 */
const deletePantryItem = async (userId, itemId) => {
  if (prisma) {
    try {
      const result = await prisma.pantryItem.deleteMany({
        where: { id: itemId, userId },
      });
      if (result.count === 0) {
        const error = new Error("Pantry item not found or unauthorized");
        error.statusCode = 404;
        throw error;
      }
      return { message: "Pantry item deleted successfully" };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn("DB operation failed, using in-memory store for delete pantry:", err.message);
    }
  }

  const userPantry = inMemoryPantry.get(userId);
  if (!userPantry || !userPantry.has(itemId)) {
    const error = new Error("Pantry item not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }
  userPantry.delete(itemId);
  return { message: "Pantry item deleted successfully" };
};

module.exports = {
  getPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
};
