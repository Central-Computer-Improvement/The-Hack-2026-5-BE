const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { protect, optionalProtect } = require("../middlewares/auth.middleware");

// Generate Zero-Waste Recipes (Optional Auth to track user history)
router.post("/generate-recipes", optionalProtect, aiController.generateRecipes);

// Scan Pantry (Vision AI)
router.post("/scan-pantry", aiController.scanPantry);

// User Recipe History (Protected - Max 10 items)
router.get("/history", protect, aiController.getHistory);
router.delete("/history", protect, aiController.clearHistory);

module.exports = router;

