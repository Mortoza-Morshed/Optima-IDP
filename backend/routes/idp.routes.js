const express = require("express");
const router = express.Router();

const idpController = require("../controllers/idp.controller");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/**
 * IDP ROUTES
 * ------------------------------------------------------
 * /create                → Employee creates an IDP
 * /my-idps               → Employee sees their IDPs
 * /employee/:id          → Manager/Admin view IDPs of a user
 * /update/:id            → Employee updates their IDP
 * /approve/:id           → Manager approves IDP
 * /all                   → Admin sees all IDPs
 */

// Employee creates their IDP
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("employee", "manager", "admin"),
  idpController.createIDP
);

// Employee sees their own IDPs
router.get(
  "/my-idps",
  authMiddleware,
  roleMiddleware("employee", "manager", "admin"),
  idpController.getMyIDPs
);

// Manager/Admin gets IDP of a specific employee
router.get(
  "/employee/:id",
  authMiddleware,
  roleMiddleware("manager", "admin"),
  idpController.getIDPsByEmployee
);

// Employee updates their own IDP
router.put(
  "/update/:id",
  authMiddleware,
  roleMiddleware("employee", "manager", "admin"),
  idpController.updateIDP
);

// Manager approves an IDP
router.put(
  "/approve/:id",
  authMiddleware,
  roleMiddleware("manager", "admin"),
  idpController.approveIDP
);

// Admin gets all IDPs in the system
router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  idpController.getAllIDPs
);

module.exports = router;