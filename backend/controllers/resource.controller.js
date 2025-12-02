const Resource = require("../models/resource");

/**
 * RESOURCE CONTROLLER
 * ----------------------------------------------------
 * Handles:
 * - Adding single resource (admin only)
 * - Bulk adding resources (admin only)
 * - Getting all resources
 * - Getting resources by skill
 * - Updating resource (admin only)
 * - Deleting resource (admin only)
 */


/**
 * ADD SINGLE RESOURCE (Admin only)
 * /api/resource/add
 */
exports.addResource = async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const { title, type, url, skill, provider, difficulty, description, duration } = req.body;

    const resource = await Resource.create({
      title,
      type,
      url,
      skill,
      provider,
      difficulty,
      description,
      duration
    });

    res.status(201).json({ message: "Resource added successfully", resource });

  } catch (error) {
    console.error("Add Resource Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * BULK ADD RESOURCES (Admin only)
 * /api/resource/bulk-add
 */
exports.bulkAddResources = async (req, res) => {
  try {
    // Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const resources = req.body; // expecting an array

    if (!Array.isArray(resources)) {
      return res.status(400).json({ message: "Expected an array of resources" });
    }

    // Insert all resources at once
    const inserted = await Resource.insertMany(resources);

    res.status(201).json({
      message: "Resources added successfully",
      addedCount: inserted.length,
      resources: inserted
    });

  } catch (error) {
    console.error("Bulk Add Resources Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET ALL RESOURCES
 * /api/resource/all
 */
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find().populate("skill"); // include full skill data
    res.json({ resources });

  } catch (error) {
    console.error("Get All Resources Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET RESOURCES BY SKILL ID
 * /api/resource/skill/:skillId
 */
exports.getResourcesBySkill = async (req, res) => {
  try {
    const { skillId } = req.params;

    const resources = await Resource.find({ skill: skillId });

    res.json({ resources });

  } catch (error) {
    console.error("Get Resources By Skill Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * UPDATE RESOURCE (Admin only)
 * /api/resource/update/:id
 */
exports.updateResource = async (req, res) => {
  try {
    // Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const updates = req.body;

    const resource = await Resource.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource updated successfully", resource });

  } catch (error) {
    console.error("Update Resource Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * DELETE RESOURCE (Admin only)
 * /api/resource/delete/:id
 */
exports.deleteResource = async (req, res) => {
  try {
    // Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource deleted successfully" });

  } catch (error) {
    console.error("Delete Resource Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
