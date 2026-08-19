const pantryService = require("../services/pantry.service");

/**
 * Get Pantry Items
 * GET /api/pantry
 */
const getPantry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const items = await pantryService.getPantryItems(userId);

    return res.status(200).json({
      success: true,
      count: items.length,
      data: { items },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Pantry Item
 * POST /api/pantry
 */
const addPantry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, quantity, category, isExpiringSoon } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Ingredient name is required",
      });
    }

    const data = await pantryService.addPantryItem(userId, {
      name,
      quantity,
      category,
      isExpiringSoon,
    });

    return res.status(201).json({
      success: true,
      message: "Pantry item added successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Pantry Item
 * PUT /api/pantry/:id
 */
const updatePantry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const updateData = req.body;

    const data = await pantryService.updatePantryItem(userId, itemId, updateData);

    return res.status(200).json({
      success: true,
      message: "Pantry item updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Pantry Item
 * DELETE /api/pantry/:id
 */
const deletePantry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const result = await pantryService.deletePantryItem(userId, itemId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPantry,
  addPantry,
  updatePantry,
  deletePantry,
};
