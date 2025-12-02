const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * USER ROUTES
 * ----------------------------------------
 * /me        → Get logged-in user profile
 * /all       → Get all users (admin only)
 * /:id       → Get single user
 * 
 * All user routes should be protected using JWT.
 */

// Get logged-in user's profile
router.get("/me", authMiddleware, userController.getMyProfile);

// Get all users (admin only)
router.get("/all", authMiddleware, userController.getAllUsers);

// Get user by ID (protected)
router.get("/:id", authMiddleware, userController.getUserById);

module.exports = router;
