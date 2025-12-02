const Skill = require("../models/skill");

/**
 * SKILL CONTROLLER
 * ----------------------------------------------------
 * Handles:
 * - Adding new skills (admin only)
 * - Getting all skills
 * - Getting skill by ID
 * - Updating skill (admin only)
 * - Deleting skill (admin only)
 */


/**
 * ADD A NEW SKILL (Admin only)
 * /api/skill/add
 */
exports.addSkill = async (req, res) => {
  try {
    // Only admins can add skills
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const { name, category, description } = req.body;

    // Check if skill already exists
    const existing = await Skill.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Skill already exists" });
    }

    const skill = await Skill.create({
      name,
      category,
      description,
    });

    res.status(201).json({ message: "Skill added successfully", skill });

  } catch (error) {
    console.error("Add Skill Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET ALL SKILLS
 * /api/skill/all
 */
exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json({ skills });

  } catch (error) {
    console.error("Get All Skills Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET SKILL BY ID
 * /api/skill/:id
 */
exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.json({ skill });

  } catch (error) {
    console.error("Get Skill Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * UPDATE SKILL (Admin only)
 * /api/skill/update/:id
 */
exports.updateSkill = async (req, res) => {
  try {
    // Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const { name, category, description } = req.body;

    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { name, category, description },
      { new: true }
    );

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.json({ message: "Skill updated successfully", skill });

  } catch (error) {
    console.error("Update Skill Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * BULK ADD SKILLS (Admin only)
 * /api/skill/bulk-add
 * Accepts an array of skills:
 * [
 *   { "name": "ReactJS", "category": "Technical", "description": "..." },
 *   { "name": "NodeJS", "category": "Technical", "description": "..." },
 * ]
 */
exports.bulkAddSkills = async (req, res) => {
    try {
      // Check admin permission
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admin only" });
      }
  
      const skills = req.body; // expecting an array
  
      if (!Array.isArray(skills)) {
        return res.status(400).json({ message: "Expected an array of skills" });
      }
  
      // Optional: prevent duplicates by checking existing names
      const names = skills.map((s) => s.name);
      const existing = await Skill.find({ name: { $in: names } });
  
      if (existing.length > 0) {
        return res.status(400).json({
          message: "Some skills already exist",
          existingSkills: existing.map((s) => s.name)
        });
      }
  
      // Insert all skills at once
      const inserted = await Skill.insertMany(skills);
  
      res.status(201).json({
        message: "Skills added successfully",
        addedCount: inserted.length,
        skills: inserted
      });
  
    } catch (error) {
      console.error("Bulk Add Skills Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };  


/**
 * DELETE SKILL (Admin only)
 * /api/skill/delete/:id
 */
exports.deleteSkill = async (req, res) => {
  try {
    // Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const skill = await Skill.findByIdAndDelete(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.json({ message: "Skill deleted successfully" });

  } catch (error) {
    console.error("Delete Skill Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
