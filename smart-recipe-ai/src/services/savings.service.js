const prisma = require("../config/db");

// In-memory fallback store for savings: Map<userId, Array<SavingRecord>>
const inMemorySavings = new Map();

/**
 * Record a new saving when user finishes cooking a recipe
 * @param {string} userId
 * @param {Object} savingData
 * @param {string} savingData.recipeTitle
 * @param {number} savingData.moneySavedRupiah
 * @param {number} savingData.foodSavedKg
 */
const recordSaving = async (userId, savingData) => {
  const { recipeTitle, moneySavedRupiah, foodSavedKg } = savingData;

  // Validation
  if (!recipeTitle || typeof recipeTitle !== "string" || recipeTitle.trim() === "") {
    const error = new Error("Recipe title is required and must be a non-empty string");
    error.statusCode = 400;
    throw error;
  }

  const parsedMoney = Number(moneySavedRupiah);
  if (isNaN(parsedMoney) || parsedMoney < 0) {
    const error = new Error("moneySavedRupiah must be a valid number greater than or equal to 0");
    error.statusCode = 400;
    throw error;
  }

  const parsedFood = Number(foodSavedKg);
  if (isNaN(parsedFood) || parsedFood < 0) {
    const error = new Error("foodSavedKg must be a valid number greater than or equal to 0");
    error.statusCode = 400;
    throw error;
  }

  const normalizedMoney = Math.round(parsedMoney);
  const normalizedFood = parseFloat(parsedFood.toFixed(3));

  // Prisma DB Operation
  if (prisma) {
    try {
      const saving = await prisma.savingRecord.create({
        data: {
          userId,
          recipeTitle: recipeTitle.trim(),
          moneySavedRupiah: normalizedMoney,
          foodSavedKg: normalizedFood,
        },
      });
      return saving;
    } catch (err) {
      console.warn("DB operation failed, using in-memory savings store:", err.message);
    }
  }

  // Fallback In-Memory Storage
  if (!inMemorySavings.has(userId)) {
    inMemorySavings.set(userId, []);
  }
  const userSavings = inMemorySavings.get(userId);

  const savingId = `saving_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const savingRecord = {
    id: savingId,
    userId,
    recipeTitle: recipeTitle.trim(),
    moneySavedRupiah: normalizedMoney,
    foodSavedKg: normalizedFood,
    createdAt: new Date().toISOString(),
  };

  userSavings.unshift(savingRecord);
  return savingRecord;
};

/**
 * Get all savings for a user ordered by createdAt descending
 * @param {string} userId
 */
const getSavings = async (userId) => {
  // Prisma DB Operation
  if (prisma) {
    try {
      const savings = await prisma.savingRecord.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (savings && Array.isArray(savings)) {
        return savings;
      }
    } catch (err) {
      console.warn("DB operation failed, using in-memory savings store:", err.message);
    }
  }

  // Fallback In-Memory Storage
  const userSavings = inMemorySavings.get(userId) || [];
  return [...userSavings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Get savings summary for a user
 * Computes:
 * - totalMoneySaved
 * - totalFoodSaved
 * - thisMonth (money saved this month)
 * - lastMonth (money saved last month)
 * - growthPercentage (((thisMonth - lastMonth) / lastMonth) * 100)
 * @param {string} userId
 */
const getSavingsSummary = async (userId) => {
  const savings = await getSavings(userId);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear = currentYear - 1;
  }

  let totalMoneySaved = 0;
  let totalFoodSaved = 0;
  let thisMonth = 0;
  let lastMonth = 0;

  for (const record of savings) {
    const recordMoney = Number(record.moneySavedRupiah) || 0;
    const recordFood = Number(record.foodSavedKg) || 0;

    totalMoneySaved += recordMoney;
    totalFoodSaved += recordFood;

    const recordDate = new Date(record.createdAt);
    const recYear = recordDate.getFullYear();
    const recMonth = recordDate.getMonth();

    if (recYear === currentYear && recMonth === currentMonth) {
      thisMonth += recordMoney;
    } else if (recYear === prevYear && recMonth === prevMonth) {
      lastMonth += recordMoney;
    }
  }

  let growthPercentage = 0;
  if (lastMonth > 0) {
    growthPercentage = Number((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(2));
  } else {
    // If lastMonth is 0, avoid Infinity/NaN, return safe 0
    growthPercentage = 0;
  }

  return {
    totalMoneySaved,
    totalFoodSaved: parseFloat(totalFoodSaved.toFixed(3)),
    thisMonth,
    lastMonth,
    growthPercentage,
  };
};

module.exports = {
  recordSaving,
  getSavings,
  getSavingsSummary,
};
