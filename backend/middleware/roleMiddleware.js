/**
 * ROLE MIDDLEWARE
 * ----------------------------------------------------
 * Usage:
 * router.post("/add-skill", authMiddleware, roleMiddleware("admin"), controller...)
 *
 * Allows only specific roles to access a route.
 */

module.exports = function allowedRoles(...roles) {
    return (req, res, next) => {
      try {
        const userRole = req.user.role;
  
        // Check if the user's role is allowed
        if (!roles.includes(userRole)) {
          return res.status(403).json({
            message: `Access denied: Only ${roles.join(", ")} allowed`
          });
        }
  
        next(); // Access granted
      } catch (error) {
        console.error("Role Middleware Error:", error);
        res.status(500).json({ message: "Server error" });
      }
    };
  };
  