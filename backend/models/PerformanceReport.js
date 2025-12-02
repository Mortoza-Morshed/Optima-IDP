const mongoose = require("mongoose");

/**
 * PERFORMANCE REPORT SCHEMA
 * ----------------------------------------------------
 * Stores manager evaluations of employee performance.
 * 
 * Used for:
 * - IDP adjustments
 * - Promotion insights
 * - Skill gap calculation
 */

const PerformanceReportSchema = new mongoose.Schema(
  {
    // Employee being reviewed
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Which manager wrote the review
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Example: "Q1 2025" or "FY 2024"
    reviewPeriod: {
      type: String,
      required: true
    },

    // Manager written sections
    strengths: {
      type: String,
      default: ""
    },

    weaknesses: {
      type: String,
      default: ""
    },

    // Numeric score (1 to 5)
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    // Optional skills this review relates to
    relatedSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill"
      }
    ],

    // Manager’s overall comments
    managerComments: {
      type: String,
      default: ""
    }
  },

  // Adds createdAt and updatedAt automatically
  { timestamps: true }
);

module.exports = mongoose.model("PerformanceReport", PerformanceReportSchema);
