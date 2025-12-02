const recommenderService = require("../services/recommender.service");

/**
 * RECOMMENDATION CONTROLLER
 * ----------------------------------------------------
 * Handles:
 * - Sending data to Python service
 * - Getting recommended resources
 * - Getting similar skills
 */

module.exports = {

  // POST → Get recommended resources
  async recommendResources(req, res) {
    try {
      const result = await recommenderService.getRecommendedResources(req.body);
      res.json(result);

    } catch (error) {
      console.error("Recommend Resources Error:", error);
      res.status(500).json({ message: "Failed to fetch recommended resources" });
    }
  },

  // POST → Get similar skills
  async recommendSimilarSkills(req, res) {
    try {
      const result = await recommenderService.getSimilarSkills(req.body);
      res.json(result);

    } catch (error) {
      console.error("Similar Skills Error:", error);
      res.status(500).json({ message: "Failed to fetch similar skills" });
    }
  }

};
