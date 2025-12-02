const mongoose = require("mongoose");

/**
 * User Schema
 * ----------------------------------------
 * Stores all users in the system:
 * - Employees
 * - Managers
 * - Admins
 * 
 * Each user has:
 * - name: Full name of the user
 * - email: Unique login email
 * - password: Hashed password
 * - role: Determines access level
 * - skills: Array of skills with skill level
 */

const UserSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique email address for login
    email: {
      type: String,
      required: true,
      unique: true,   // no two users can have the same email
      lowercase: true,
      trim: true
    },

    // Password will be hashed using bcrypt before saving
    password: {
      type: String,
      required: true,
    },

    // User role → controls access permissions
    role: {
      type: String,
      enum: ["employee", "manager", "admin"],
      default: "employee", // default role is employee
    },

    /**
     * Skills array:
     * Each skill entry contains:
     * - skillId: Reference to Skill model
     * - level: How skilled the user is (1–10 scale)
     */
    skills: [
      {
        skillId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Skill",    // reference to Skill model
        },
        level: {
          type: Number,
          min: 1,
          max: 10,
          default: 1,
        }
      }
    ]
  },

  // Automatically adds createdAt and updatedAt timestamps
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);