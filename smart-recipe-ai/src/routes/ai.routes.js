const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");

// Generate Zero-Waste Recipes
router.post("/generate-recipes", aiController.generateRecipes);

// Scan Pantry (Vision AI)
router.post("/scan-pantry", aiController.scanPantry);

module.exports = router;
