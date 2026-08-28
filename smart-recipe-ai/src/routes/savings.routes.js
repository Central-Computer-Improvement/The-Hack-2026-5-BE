const express = require("express");
const router = express.Router();
const savingsController = require("../controllers/savings.controller");
const { protect } = require("../middlewares/auth.middleware");

// All Savings routes are protected (require Bearer Token)
router.use(protect);

// Routes
router.post("/", savingsController.recordSaving);
router.get("/summary", savingsController.getSavingsSummary);
router.get("/", savingsController.getSavings);

module.exports = router;
