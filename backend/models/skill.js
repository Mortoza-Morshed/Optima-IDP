const mongoose = require("mongoose");

/**
 * Skill Schema
 * ----------------------------------------
 * Stores individual skills such as:
 * - "JavaScript"
 * - "React"
 * - "Communication"
 * - "Leadership"
 * 
 * Each skill has:
 * - name: Unique name of the skill
 * - category: "Technical", "Soft Skill", "Management", etc.
 * - description: Optional info about the skill
 */

const SkillSchema = new mongoose.Schema(
  {
    // Unique skill name (e.g., “JavaScript”, “Time Management”)
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // Category of skill (Technical / Soft Skill / Leadership etc.)
    category: {
      type: String,
      required: true
    },

    // Short description of the skill (optional)
    description: {
      type: String,
      default: ""
    }
  },

  // Adds createdAt and updatedAt timestamps automatically
  { timestamps: true }
);

module.exports = mongoose.models.Skill || mongoose.model("Skill", SkillSchema);
