const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcement.controller");
const authMiddleware = require("../middleware/authMiddleware");

// All announcement routes require authentication
router.use(authMiddleware);

// Get announcements (all users - filtered by role in controller)
router.get("/", announcementController.getAnnouncements);

// Mark announcement as viewed (all users)
router.post("/:id/view", announcementController.markAsViewed);

module.exports = router;
