const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favorites.controller");
const { protect } = require("../middlewares/auth.middleware");

// All Favorites routes are protected
router.use(protect);

router.post("/", favoritesController.addFavorite);
router.get("/", favoritesController.getFavorites);
router.delete("/:id", favoritesController.removeFavorite);

module.exports = router;
