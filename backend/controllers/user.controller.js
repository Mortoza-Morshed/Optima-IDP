const User = require("../models/user");

/**
 * USER CONTROLLER
 * ----------------------------------------------------
 * Contains the logic for:
 * - Getting logged-in user's profile
 * - Getting all users (admin only)
 * - Getting a specific user by ID
 */


/**
 * GET LOGGED-IN USER PROFILE
 * /api/user/me
 * --------------------------------------
 * This uses the decoded token (req.user.id)
 * to return the user's own profile.
 */
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id; // comes from JWT middleware

    const user = await User.findById(userId).select("-password");  
    // remove password field for safety

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get My Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET ALL USERS (ADMIN ONLY)
 * /api/user/all
 * --------------------------------------
 * Only an admin should be allowed to access this.
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Check if the user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const users = await User.find().select("-password");
    res.json({ users });

  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET SINGLE USER BY ID
 * /api/user/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
