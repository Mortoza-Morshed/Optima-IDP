const express = require("express");
const router = express.Router();

const performanceController = require("../controllers/performance.controller");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/**
 * PERFORMANCE ROUTES
 * -------------------------------------------------
 * /add                → Manager adds a performance review
 * /employee/:id       → Manager/Admin get reports for a specific employee
 * /my-reports         → Employee gets their own performance reports
 * /all                → Admin gets all performance reports
 */

// Manager creates a performance report
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("manager", "admin"),
  performanceController.addReport
);

// Employee sees their own performance reports
router.get(
  "/my-reports",
  authMiddleware,
  roleMiddleware("employee", "manager", "admin"),
  performanceController.getMyReports
);

// Manager/Admin sees performance reports for any employee
router.get(
  "/employee/:id",
  authMiddleware,
  roleMiddleware("manager", "admin"),
  performanceController.getReportsByEmployee
);

// Admin sees all performance reports
router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  performanceController.getAllReports
);

module.exports = router;
