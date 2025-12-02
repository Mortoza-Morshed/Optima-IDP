const mongoose = require("mongoose");

/**
 * IDP SCHEMA (Individual Development Plan)
 * ----------------------------------------------------
 * Each employee can have one or multiple IDPs.
 * 
 * Includes:
 * - employee: who the IDP belongs to
 * - skillsToImprove: list of skills and target levels
 * - recommendedResources: resources assigned to employee
 * - goals: personal improvement goals
 * - managerFeedback: manager notes/comments
 * - status: draft / pending / approved / completed
 */

const IDPSchema = new mongoose.Schema(
  {
    // The employee who owns this IDP
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Skills the employee needs to work on
    skillsToImprove: [
      {
        skill: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Skill",
          required: true,
        },
        currentLevel: { type: Number, default: 1 },
        targetLevel: { type: Number, default: 5 }
      }
    ],

    // Recommended learning resources
    recommendedResources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource"
      }
    ],

    // Employee’s goals (free text)
    goals: {
      type: String,
      default: ""
    },

    // Manager's comments/feedback
    managerFeedback: {
      type: String,
      default: ""
    },

    // Status of the IDP
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "completed"],
      default: "draft"
    }
  },

  // Timestamps
  { timestamps: true }
);

module.exports = mongoose.model("IDP", IDPSchema);
