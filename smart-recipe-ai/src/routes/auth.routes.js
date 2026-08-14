const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

// Public Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected Routes
router.get("/me", protect, authController.getMe);

module.exports = router;
 