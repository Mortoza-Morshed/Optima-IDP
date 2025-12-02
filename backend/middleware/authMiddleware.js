const jwt = require("jsonwebtoken");

/**
 * AUTH MIDDLEWARE
 * ----------------------------------------
 * Protects routes by requiring a valid JWT.
 * 
 * How it works:
 * - Reads token from Authorization header
 * - Verifies token using JWT_SECRET
 * - Attaches decoded user data to req.user
 * - Calls next() to continue request
 */

module.exports = (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info (id, role) to request
    req.user = decoded;

    next(); // Allow request to continue
  } 
  catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
