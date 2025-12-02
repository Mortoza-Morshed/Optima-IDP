// Role middleware
const roleMiddleware = require("../middleware/roleMiddleware");
const express = require("express");
const router = express.Router();

const skillController = require("../controllers/skill.controller");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * SKILL ROUTES
 * ----------------------------------------
 * /add        → Add new skill (admin only)
 * /all        → Get all skills
 * /:id        → Get single skill
 * /update/:id → Update skill (admin only)
 * /delete/:id → Delete skill (admin only)
 */

// Add a new skill (admin only)
router.post("/add", authMiddleware, roleMiddleware("admin"), skillController.addSkill);

// Get all skills
router.get("/all", authMiddleware, skillController.getAllSkills);

// Get a single skill by ID
router.get("/:id", authMiddleware, skillController.getSkillById);

// Update a skill (admin only)
router.put("/update/:id", authMiddleware, roleMiddleware("admin"), skillController.updateSkill);

// Delete a skill (admin only)
router.delete("/delete/:id", authMiddleware, roleMiddleware("admin"), skillController.deleteSkill);

// Bulk add skills (admin only)
router.post("/bulk-add", authMiddleware, roleMiddleware("admin"), skillController.bulkAddSkills);


module.exports = router;
