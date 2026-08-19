const express = require("express");
const router = express.Router();
const pantryController = require("../controllers/pantry.controller");
const { protect } = require("../middlewares/auth.middleware");

// Protect all pantry routes
router.use(protect);

router.get("/", pantryController.getPantry);
router.post("/", pantryController.addPantry);
router.put("/:id", pantryController.updatePantry);
router.delete("/:id", pantryController.deletePantry);

module.exports = router;
