const express = require("express");
const router = express.Router();
const recommendController = require("../controllers/recommend.controller");

/**
 * RECOMMENDATION ROUTES
 * ----------------------------------------------------
 * Base URL: /api/recommend
 */

// Recommended resources
router.post("/resources", recommendController.recommendResources);

// Similar skills
router.post("/similar-skills", recommendController.recommendSimilarSkills);

module.exports = router;
