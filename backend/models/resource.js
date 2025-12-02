const mongoose = require("mongoose");

/**
 * Resource Schema
 * ----------------------------------------
 * A "Resource" is ANY material that helps an employee improve a skill.
 *
 * Examples:
 * - Courses (Udemy, Coursera, YouTube)
 * - Articles or PDFs
 * - Videos
 * - Certifications
 * - Internal company documents
 *
 * This model is used by:
 * - Recommendation system (Python service)
 * - Employee dashboard (suggested learning)
 * - IDP generation (skill improvement path)
 */

const ResourceSchema = new mongoose.Schema(
  {
    // Title of the resource (e.g., "React Beginner Course")
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Type of resource (course, article, video, certification, etc.)
    type: {
      type: String,
      required: true,
      enum: ["course", "video", "article", "certification", "document", "other"],
      default: "course"
    },

    // URL link to the resource
    url: {
      type: String,
      required: true,
      trim: true
    },

    // Which skill this resource helps improve
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true
    },

    // Provider of the resource (Udemy, Coursera, YouTube, Internal, etc.)
    provider: {
      type: String,
      default: "Unknown"
    },

    // Difficulty: beginner / intermediate / advanced
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },

    // Optional description of the resource
    description: {
      type: String,
      default: ""
    },

    // Optional duration (e.g., "3 hours", "2 weeks")
    duration: {
      type: String,
      default: ""
    }
  },

  // Automatically adds createdAt and updatedAt fields
  { timestamps: true }
);

module.exports = mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);

