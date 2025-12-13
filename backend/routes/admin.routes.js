const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// All routes here are for Admin only
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// /api/admin/system-health
router.get("/system-health", adminController.getSystemHealth);

// /api/admin/queue-health
router.get("/queue-health", adminController.getQueueHealth);

// /api/admin/skill-gaps
router.get("/skill-gaps", adminController.getSkillGaps);

// /api/admin/recommender-config
router.get("/recommender-config", adminController.getRecommenderConfig);
router.put("/recommender-config", adminController.updateRecommenderConfig);

// /api/admin/audit-logs
router.get("/audit-logs", adminController.getAuditLogs);

// ===========================================================================
// SECURITY MANAGEMENT (Company-Scoped)
// ===========================================================================
// /api/admin/security/revoke-company-tokens
router.post("/security/revoke-company-tokens", adminController.revokeCompanyTokens);

// /api/admin/security/company-sessions
router.get("/security/company-sessions", adminController.getCompanySessions);

// /api/admin/security/password-policy
router.get("/security/password-policy", adminController.getPasswordPolicy);

// /api/admin/security/config
router.get("/security/config", adminController.getSecurityConfig);

// /api/admin/security/company-settings
router.put("/security/company-settings", adminController.updateCompanySettings);

// ===========================================================================
// PREFERENCES MANAGEMENT (Company-Scoped)
// ===========================================================================
// /api/admin/preferences
router.get("/preferences", adminController.getCompanyPreferences);
router.put("/preferences", adminController.updateCompanyPreferences);

// ===========================================================================
// DASHBOARD & ANALYTICS
// ===========================================================================
const adminDashboardController = require("../controllers/adminDashboard.controller");

// Organization KPIs
router.get("/dashboard/kpis", adminDashboardController.getOrgKPIs);

// Approvals & User Lifecycle
router.get("/approvals", adminDashboardController.getPendingApprovals);
router.post("/approvals/:userId/approve", adminDashboardController.approveUser);
router.post("/approvals/:userId/deny", adminDashboardController.denyUser);
router.post("/approvals/bulk-approve", adminDashboardController.bulkApproveUsers);
router.post("/users/bulk-assign-role", adminDashboardController.bulkAssignRole);
router.get("/registrations/recent", adminDashboardController.getRecentRegistrations);

// IDP Progress Metrics
router.get("/idp-progress", adminDashboardController.getIDPProgress);

// Learning & Resources Analytics
router.get("/learning-analytics", adminDashboardController.getLearningAnalytics);

// Security & Compliance Metrics
router.get("/security-metrics", adminDashboardController.getSecurityMetrics);

// CSV Export
router.get("/export/users", adminDashboardController.exportUsersCSV);

// ===========================================================================
// ANNOUNCEMENTS
// ===========================================================================
const announcementController = require("../controllers/announcement.controller");

router.post("/announcements", upload.single("attachment"), announcementController.createAnnouncement);
router.get("/announcements", announcementController.getAnnouncements);
router.get("/announcements/:id/attachment", announcementController.downloadAttachment);
router.delete("/announcements/:id", announcementController.deleteAnnouncement);

// ===========================================================================
// ORGANIZATION SETTINGS
// ===========================================================================
const orgSettingsController = require("../controllers/orgSettings.controller");

router.get("/org-settings", orgSettingsController.getOrgSettings);
router.put("/org-settings", orgSettingsController.updateOrgSettings);
router.post("/org-settings/logo", upload.single("logo"), orgSettingsController.uploadLogo);
router.get("/skill-targets", orgSettingsController.getSkillTargets);
router.put("/skill-targets", orgSettingsController.setSkillTargets);

// ===========================================================================
// API KEY MANAGEMENT
// ===========================================================================
router.post("/api-keys", adminController.generateAPIKey);
router.get("/api-keys", adminController.getAPIKeys);
router.delete("/api-keys/:keyId", adminController.revokeAPIKey);

// ===========================================================================
// SESSION MANAGEMENT
// ===========================================================================
router.get("/sessions", adminController.getSessions);
router.delete("/sessions/:sessionId", adminController.revokeSession);
router.get("/login-history", adminController.getLoginHistory);

// ===========================================================================
// USER MANAGEMENT
// ===========================================================================
router.post("/users/invite", adminController.inviteUser);
router.post("/users/:userId/promote-manager", adminController.promoteToManager);
router.post("/users/bulk-import", upload.single("csv"), adminController.bulkImportUsers);

module.exports = router;
