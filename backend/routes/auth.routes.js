const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

/**
 * AUTH ROUTES
 * --------------------------------------
 * /register  → Create a new user
 * /login     → User login + get JWT
 */

// Register route
router.post("/register", authController.register);

// Login route
router.post("/login", authController.login);

module.exports = router;
