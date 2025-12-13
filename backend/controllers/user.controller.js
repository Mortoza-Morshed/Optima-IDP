const User = require("../models/User");
const bcrypt = require("bcryptjs");

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

    const user = await User.findById(userId).select("-password -avatar.data");
    // remove password field for safety

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userObj = user.toObject();

    console.log("DEBUG: Original Avatar field:", user.avatar ? "Exists" : "Null");
    if (user.avatar) console.log("DEBUG: ContentType:", user.avatar.contentType);

    if (user.avatar && user.avatar.contentType) {
      userObj.avatar = `api/user/${user._id}/avatar`;
      console.log("DEBUG: Transformed Avatar URL:", userObj.avatar);
    } else {
      userObj.avatar = "";
    }

    res.json({ user: userObj });
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

    // Get admin's full profile to know their company
    const admin = await User.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin user not found" });

    // Filter users by company
    const users = await User.find({ company: admin.company })
      .select("-password -avatar.data")
      .sort({ createdAt: -1 });

    const usersWithAvatarUrl = users.map(u => {
      const uObj = u.toObject();
      if (u.avatar && u.avatar.contentType) {
        uObj.avatar = `api/user/${u._id}/avatar`;
      } else {
        uObj.avatar = "";
      }
      return uObj;
    });

    res.json(usersWithAvatarUrl);

  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const { sendMail } = require("../services/mail.service");
const { getManagerPromotionEmail } = require("../utils/emailTemplates");

/**
 * UPDATE USER ROLE (ADMIN ONLY)
 * /api/user/:id/role
 */
exports.updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { role } = req.body;
    const { id } = req.params;

    if (!['employee', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, select: 'name email role' }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send styled email notification if promoted to manager
    if (role === 'manager') {
      try {
        const emailHtml = getManagerPromotionEmail(user.name);
        await sendMail({
          to: user.email,
          subject: "Optima IDP: You've been promoted to Manager!",
          text: `Hello ${user.name},\n\nCongratulations! You have been promoted to the Manager role.\n\nYou now have access to team management features, including assigning goals and viewing team progress.\n\nBest regards,\nThe Optima IDP Team`,
          html: emailHtml
        });
        console.log(`Promotion email sent to ${user.email}`);
      } catch (mailErr) {
        console.error("Failed to send promotion email:", mailErr);
        // Don't fail the request if email fails
      }
    }

    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("Update Role Error:", error);
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

    const user = await User.findById(userId).select("-password -avatar.data");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userObj = user.toObject();
    if (user.avatar && user.avatar.contentType) {
      userObj.avatar = `api/user/${user._id}/avatar`;
    } else {
      userObj.avatar = "";
    }

    res.json({ user: userObj });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE USER PROFILE
 * /api/user/me
 * --------------------------------------
 * Allows user to update their own profile.
 * Supporting: name, password.
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, password, newPassword, preferences } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update Avatar (if file uploaded)
    if (req.file) {
      user.avatar.data = req.file.buffer;
      user.avatar.contentType = req.file.mimetype;
    }

    // Update Name (if provided)
    if (name) {
      user.name = name;
    }

    // Update Preferences
    if (preferences) {
      // Use JSON.parse if preferences is sent as a string (common with FormData)
      let prefs = preferences;
      if (typeof preferences === 'string') {
        try {
          prefs = JSON.parse(preferences);
        } catch (e) {
          // invalid json, ignore or handle error
        }
      }

      user.preferences = {
        ...user.preferences,
        ...prefs
      };
    }

    // Update Password
    if (newPassword) {
      // If updating password, require current password for security
      if (!password) {
        return res.status(400).json({ message: "Current password is required to set a new password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      // Check if new password is same as old password
      if (await bcrypt.compare(newPassword, user.password)) {
        return res.status(400).json({ message: "New password cannot be the same as the old password" });
      }

      // Password Complexity Validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          message: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character."
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    let avatarUrl = "";
    if (user.avatar && user.avatar.contentType) {
      avatarUrl = `api/user/${user._id}/avatar`;
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: avatarUrl,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET USER AVATAR
 * /api/user/:id/avatar
 */
exports.getUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar || !user.avatar.data) {
      // Return 404 so frontend can show default placeholder
      return res.status(404).send('No avatar found');
    }
    res.set('Content-Type', user.avatar.contentType);
    res.send(user.avatar.data);
  } catch (e) {
    console.error("Get Avatar Error:", e);
    res.status(500).send("Server error");
  }
};

/**
 * REQUEST PROFILE UPDATE (User)
 * POST /api/user/request-update
 */
exports.requestProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profileUpdateRequest = {
      field: 'name',
      value: name,
      status: 'pending',
      requestedAt: new Date()
    };

    await user.save();

    res.json({ message: "Profile update requested. Awaiting admin approval.", user });

  } catch (error) {
    console.error("Request Update Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * RESOLVE PROFILE UPDATE (Admin)
 * PUT /api/user/:id/resolve-update
 */
exports.resolveProfileUpdate = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.profileUpdateRequest || user.profileUpdateRequest.status !== 'pending') {
      return res.status(400).json({ message: "No pending request found" });
    }

    if (status === 'approved') {
      if (user.profileUpdateRequest.field === 'name') {
        user.name = user.profileUpdateRequest.value;
      }
      user.profileUpdateRequest.status = 'approved';
    } else {
      user.profileUpdateRequest.status = 'rejected';
    }

    await user.save();

    res.json({
      message: `Request ${status} successfully`,
      user: {
        id: user._id,
        name: user.name,
        profileUpdateRequest: user.profileUpdateRequest
      }
    });

  } catch (error) {
    console.error("Resolve Update Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
