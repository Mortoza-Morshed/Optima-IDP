const express = require("express");
const router = express.Router();

const resourceController = require("../controllers/resource.controller");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * RESOURCE ROUTES
 * -------------------------------------------------
 * /add            → Add a new resource (admin only)
 * /bulk-add       → Bulk add resources (admin only)
 * /all            → Get all resources
 * /skill/:skillId → Get resources for a specific skill
 * /update/:id     → Update resource (admin only)
 * /delete/:id     → Delete resource (admin only)
 */

// Add a single resource (admin only)
router.post("/add", authMiddleware, resourceController.addResource);

// Bulk add resources (admin only)
router.post("/bulk-add", authMiddleware, resourceController.bulkAddResources);

// Get all resources
router.get("/all", authMiddleware, resourceController.getAllResources);

// Get resources by skill ID
router.get("/skill/:skillId", authMiddleware, resourceController.getResourcesBySkill);

// Update a resource (admin only)
router.put("/update/:id", authMiddleware, resourceController.updateResource);

// Delete a resource (admin only)
router.delete("/delete/:id", authMiddleware, resourceController.deleteResource);

module.exports = router;
