const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendMail } = require("../services/mail.service");
const { getWelcomeEmail, getPasswordResetEmail } = require("../utils/emailTemplates");
const logger = require("../config/logger");

/**
 * AUTH CONTROLLER
 * ----------------------------------------
 * Handles:
 * - User registration
 * - User login
 * - Password hashing
 * - JWT token generation
 */

// REGISTER a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, company, role, adminSecret } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Role Assignment Logic
    let userRole = 'employee';

    // STRICT check for Admin role
    // If user requests to be admin, strict check the secret.
    if (role === 'admin') {
      if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
        // Log the attempt for debugging/security
        logger.warn(`Failed Admin registration attempt for ${email}. Secret provided: ${adminSecret ? 'Yes (Invalid)' : 'No'}`);
        return res.status(403).json({ message: "Invalid Admin Secret Key. Registration denied." });
      }
      userRole = 'admin';
    } else {
      // If role is undefined or 'employee', force it to employee
      userRole = 'employee';

      // VALIDATE COMPANY EXISTENCE
      // Employees can only join companies that have already been created by an Admin
      const normalizedCompany = company.toLowerCase().trim();
      const companyAdmin = await User.findOne({
        company: normalizedCompany,
        role: 'admin'
      });

      if (!companyAdmin) {
        return res.status(400).json({
          message: "Company not registered. Please contact your administrator to set up the organization first."
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      company: company.toLowerCase().trim(), // Normalize company name
      role: userRole,
      isVerified: true // Everyone is verified by default now
    });

    // Send styled welcome email
    try {
      const emailHtml = getWelcomeEmail(name, company, userRole);
      const emailSubject = userRole === 'admin'
        ? "Welcome to Optima IDP - Admin Access Granted"
        : "Welcome to Optima IDP - Registration Successful";

      await sendMail({
        to: email,
        subject: emailSubject,
        text: `Welcome to Optima IDP, ${name}! You have successfully registered as ${userRole}.`, // Fallback text
        html: emailHtml
      });
      logger.info(`Welcome email sent to ${userRole}: ${email}`);
    } catch (mailError) {
      logger.error(`Failed to send welcome email to ${email}: ${mailError.message}`);
    }

    res.status(201).json({
      message: "User registered successfully",
      user
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// FORGOT PASSWORD - Send reset link
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    // Always respond success to avoid email enumeration
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expires;
    await user.save();

    const frontendBase = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${frontendBase}/reset-password?token=${token}`;

    try {
      const emailHtml = getPasswordResetEmail(resetUrl);
      await sendMail({
        to: email,
        subject: "Reset your Optima IDP password",
        text: `Reset your password using this link: ${resetUrl}`,
        html: emailHtml
      });
    } catch (mailErr) {
      logger.error(`Failed to send reset email: ${mailErr.message}`);
    }

    res.json({ message: "If that email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// RESET PASSWORD - Validate token and update password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null; // force re-login on other devices
    await user.save();

    res.json({ message: "Password reset successful. Please log in." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN user and return tokens
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check approval status
    if (!user.isVerified) {
      return res.status(403).json({ message: "Account pending approval from Admin" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ===========================================================================
    // DUAL TOKEN STRATEGY
    // ===========================================================================
    // 1. Access Token (Short-lived): Used for API requests
    //    - Expires in 15 minutes
    //    - Contains user ID and role
    //    - Sent with every protected request
    //
    // 2. Refresh Token (Long-lived): Used to get new access tokens
    //    - Expires in 7 days
    //    - Stored in database for validation
    //    - Only used when access token expires
    //
    // WHY TWO TOKENS?
    // - Security: If access token is stolen, it's only valid for 15min
    // - Convenience: User doesn't need to login for 7 days
    // - Control: We can revoke refresh tokens (logout) server-side
    // ===========================================================================

    // Create short-lived access token (15 minutes)
    const accessToken = jwt.sign(
      {
        id: user._id,
        _id: user._id, // Added for compatibility
        role: user.role,
        company: user.company // Added for controllers
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Create long-lived refresh token (7 days)
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token to database
    // This allows us to invalidate it on logout or security breach
    user.refreshToken = refreshToken;

    // Track last login timestamp for security auditing
    user.lastLogin = new Date();

    await user.save();

    res.json({
      message: "Login successful",
      accessToken,     // Use this for API requests
      refreshToken,    // Store this securely, use to get new access tokens
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===========================================================================
// REFRESH TOKEN - Get a new access token without logging in again
// ===========================================================================
// This endpoint allows clients to get a new access token when theirs expires
// without requiring the user to enter their credentials again.
//
// FLOW:
// 1. Client's access token expires (after 15 minutes)
// 2. Client sends refresh token to this endpoint
// 3. We verify it's valid and matches database
// 4. We issue a NEW access token
// 5. Client continues using the app
//
// SECURITY:
// - Refresh token must match the one stored in database
// - If refresh token is invalid/expired, user must login again
// - Refresh tokens can be revoked (via logout)
// ===========================================================================
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Validate input
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify the refresh token signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    // Find user and verify refresh token matches database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Security check: Does the refresh token match the one in database?
    // This prevents use of old/stolen tokens after logout
    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Refresh token has been revoked" });
    }

    // All checks passed! Issue a new access token
    const newAccessToken = jwt.sign(
      {
        id: user._id,
        _id: user._id, // Added for compatibility
        role: user.role,
        company: user.company // Added for controllers
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===========================================================================
// LOGOUT - Invalidate refresh token
// ===========================================================================
// This endpoint clears the refresh token from the database, effectively
// logging out the user across all devices.
//
// WHY THIS MATTERS:
// - JWTs are stateless - we can't "revoke" them once issued
// - But we CAN delete the refresh token from database
// - When user tries to refresh, their token won't match → must login
//
// FLOW:
// 1. Client sends logout request (with auth header)
// 2. We extract user ID from access token
// 3. We clear refreshToken field in database
// 4. Client deletes both tokens from storage
// 5. User must login again to get new tokens
// ===========================================================================
exports.logout = async (req, res) => {
  try {
    // Extract user ID from the verified access token
    // Note: This assumes you have auth middleware that sets req.user
    // If you don't have middleware, you'll need to manually verify the token here
    const userId = req.user?.id;

    if (!userId) {
      // If no auth middleware, verify token manually:
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Clear refresh token
        user.refreshToken = null;
        await user.save();

        return res.json({ message: "Logged out successfully" });
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
    }

    // If using auth middleware (recommended):
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    res.json({ message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: Approve a user (Manager)
exports.approveUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isVerified = true;
    await user.save();

    res.json({ message: `User ${user.name} approved successfully`, user });
  } catch (error) {
    console.error("Approve User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
