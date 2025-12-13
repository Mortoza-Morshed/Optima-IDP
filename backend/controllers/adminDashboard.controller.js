const User = require("../models/User");
const IDP = require("../models/idp");
const Resource = require("../models/resource");
const AuditLog = require("../models/AuditLog");
const Announcement = require("../models/Announcement");
const emailService = require("../services/mail.service");

/**
 * Admin Dashboard Controller
 * ----------------------------------------
 * Provides analytics and KPIs for the admin dashboard
 * All data is company-scoped (multi-tenant)
 */

/**
 * Get organization KPIs
 * Total counts by role, active users, pending approvals
 */
exports.getOrgKPIs = async (req, res) => {
    try {
        const { company } = req.user;

        // Total users by role
        const [totalEmployees, totalManagers, totalAdmins] = await Promise.all([
            User.countDocuments({ company, role: "employee" }),
            User.countDocuments({ company, role: "manager" }),
            User.countDocuments({ company, role: "admin" }),
        ]);

        // Active users (7 days and 30 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [activeUsers7d, activeUsers30d] = await Promise.all([
            User.countDocuments({ company, lastLogin: { $gte: sevenDaysAgo } }),
            User.countDocuments({ company, lastLogin: { $gte: thirtyDaysAgo } }),
        ]);

        // Pending approvals (users not yet verified)
        const pendingApprovals = await User.countDocuments({
            company,
            isVerified: false,
        });

        // Company count (always 1 in this model - included for consistency)
        const companyCount = 1;

        res.json({
            totalEmployees,
            totalManagers,
            totalAdmins,
            totalUsers: totalEmployees + totalManagers + totalAdmins,
            activeUsers7d,
            activeUsers30d,
            pendingApprovals,
            companyCount,
        });
    } catch (err) {
        console.error("Error fetching org KPIs:", err);
        res.status(500).json({ message: "Failed to fetch organization KPIs" });
    }
};

/**
 * Get pending user approvals
 * List of users awaiting admin approval
 */
exports.getPendingApprovals = async (req, res) => {
    try {
        const { company } = req.user;

        const pendingUsers = await User.find({
            company,
            isVerified: false,
        })
            .select("name email role createdAt")
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(pendingUsers);
    } catch (err) {
        console.error("Error fetching pending approvals:", err);
        res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
};

/**
 * Approve a user
 * Sets isVerified to true, assigns role, sends email, logs action
 */
exports.approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body; // optional: change role during approval
        const { company } = req.user;

        const userToApprove = await User.findOne({ _id: userId, company });

        if (!userToApprove) {
            return res.status(404).json({ message: "User not found" });
        }

        if (userToApprove.isVerified) {
            return res.status(400).json({ message: "User is already approved" });
        }

        // Update user
        userToApprove.isVerified = true;
        if (role && ["employee", "manager", "admin"].includes(role)) {
            userToApprove.role = role;
        }
        await userToApprove.save();

        // Send approval email
        try {
            await emailService.sendEmail(
                userToApprove.email,
                "Account Approved - Welcome to Optima IDP",
                `<h2>Welcome ${userToApprove.name}!</h2>
         <p>Your account has been approved by an administrator.</p>
         <p><strong>Role:</strong> ${userToApprove.role}</p>
         <p>You can now log in and start using Optima IDP.</p>
         <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login">Login Now</a></p>`
            );
        } catch (emailErr) {
            console.error("Failed to send approval email:", emailErr);
        }

        // Log action
        await AuditLog.log({
            company,
            actor: req.user._id,
            action: "APPROVE_USER",
            target: userId,
            targetType: "user",
            details: { userName: userToApprove.name, role: userToApprove.role },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });

        res.json({
            message: "User approved successfully",
            user: {
                _id: userToApprove._id,
                name: userToApprove.name,
                email: userToApprove.email,
                role: userToApprove.role,
            },
        });
    } catch (err) {
        console.error("Error approving user:", err);
        res.status(500).json({ message: "Failed to approve user" });
    }
};

/**
 * Deny a user
 * Deletes the user account and sends notification email
 */
exports.denyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const { company } = req.user;

        const userToDeny = await User.findOne({ _id: userId, company });

        if (!userToDeny) {
            return res.status(404).json({ message: "User not found" });
        }

        // Send denial email
        try {
            await emailService.sendEmail(
                userToDeny.email,
                "Account Registration Denied",
                `<h2>Hello ${userToDeny.name},</h2>
         <p>We regret to inform you that your account registration has been denied by an administrator.</p>
         ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
         <p>If you believe this is an error, please contact your organization's administrator.</p>`
            );
        } catch (emailErr) {
            console.error("Failed to send denial email:", emailErr);
        }

        // Log action before deleting
        await AuditLog.log({
            company,
            actor: req.user._id,
            action: "DENY_USER",
            target: userId,
            targetType: "user",
            details: { userName: userToDeny.name, reason },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });

        // Delete user
        await User.deleteOne({ _id: userId });

        res.json({ message: "User denied and deleted successfully" });
    } catch (err) {
        console.error("Error denying user:", err);
        res.status(500).json({ message: "Failed to deny user" });
    }
};

/**
 * Get IDP progress metrics
 * % employees with active IDPs, completion rates, overdue actions
 */
exports.getIDPProgress = async (req, res) => {
    try {
        const { company } = req.user;

        // Total employees in company
        const totalEmployees = await User.countDocuments({
            company,
            role: { $in: ["employee", "manager"] },
        });

        // Employees with active IDPs
        const employeesWithIDPs = await IDP.distinct("userId", { company });
        const percentWithIDPs =
            totalEmployees > 0 ? (employeesWithIDPs.length / totalEmployees) * 100 : 0;

        // Get all IDPs for the company
        const idps = await IDP.find({ company });

        // Calculate completion rates
        let totalGoals = 0;
        let completedGoals = 0;
        let overdueActions = 0;
        const completionTimes = [];

        idps.forEach((idp) => {
            idp.goals.forEach((goal) => {
                totalGoals++;
                if (goal.status === "completed") {
                    completedGoals++;

                    // Calculate time to complete (in days)
                    if (goal.targetDate && goal.updatedAt) {
                        const timeDiff = goal.updatedAt - new Date(goal.targetDate);
                        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
                        completionTimes.push(daysDiff);
                    }
                } else if (goal.status === "not_started" || goal.status === "in_progress") {
                    // Check if overdue
                    if (goal.targetDate && new Date(goal.targetDate) < new Date()) {
                        overdueActions++;
                    }
                }
            });
        });

        const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

        // Average time to complete (in days)
        const avgTimeToComplete =
            completionTimes.length > 0
                ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
                : 0;

        res.json({
            totalEmployees,
            employeesWithIDPs: employeesWithIDPs.length,
            percentWithIDPs: Math.round(percentWithIDPs),
            totalGoals,
            completedGoals,
            completionRate: Math.round(completionRate),
            overdueActions,
            avgTimeToCompleteDays: Math.round(avgTimeToComplete),
        });
    } catch (err) {
        console.error("Error fetching IDP progress:", err);
        res.status(500).json({ message: "Failed to fetch IDP progress metrics" });
    }
};

/**
 * Get learning resources analytics
 * Most-used resources, low-engagement resources, broken links
 */
exports.getLearningAnalytics = async (req, res) => {
    try {
        // NOTE: Resources are global, not company-scoped
        // Get all resources
        const resources = await Resource.find({}).lean();

        // Sort by views (most-used)
        const topResources = resources
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5)
            .map((r) => ({
                _id: r._id,
                title: r.title,
                type: r.type,
                views: r.views || 0,
            }));

        // Low-engagement resources (< 5 views)
        const lowEngagement = resources
            .filter((r) => (r.views || 0) < 5)
            .map((r) => ({
                _id: r._id,
                title: r.title,
                type: r.type,
                views: r.views || 0,
            }));

        // Broken links count (resources with isBroken flag - if implemented)
        // For now, we'll check if link field exists and starts with http
        const brokenLinksCount = resources.filter(
            (r) => r.isBroken || (r.link && !r.link.startsWith("http"))
        ).length;

        res.json({
            topResources,
            lowEngagementCount: lowEngagement.length,
            lowEngagementResources: lowEngagement.slice(0, 10), // top 10
            brokenLinksCount,
            totalResources: resources.length,
        });
    } catch (err) {
        console.error("Error fetching learning analytics:", err);
        res.status(500).json({ message: "Failed to fetch learning analytics" });
    }
};

/**
 * Get security & compliance metrics
 * MFA enablement rate, password resets, recent admin actions
 */
exports.getSecurityMetrics = async (req, res) => {
    try {
        const { company } = req.user;

        // MFA enablement rate
        const totalUsers = await User.countDocuments({ company });
        const mfaEnabledUsers = await User.countDocuments({
            company,
            mfaEnabled: true,
        });
        const mfaRate = totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 0;

        // Password reset requests (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const passwordResets = await User.countDocuments({
            company,
            resetPasswordExpires: { $gte: sevenDaysAgo },
        });

        // Recent admin actions (last 10)
        const recentActions = await AuditLog.find({ company })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("actor", "name email")
            .lean();

        res.json({
            mfaEnabledUsers,
            totalUsers,
            mfaRate: Math.round(mfaRate),
            passwordResets7d: passwordResets,
            recentAdminActions: recentActions.map((action) => ({
                action: action.action,
                actor: action.actor?.name || "Unknown",
                timestamp: action.createdAt,
                target: action.target,
            })),
        });
    } catch (err) {
        console.error("Error fetching security metrics:", err);
        res.status(500).json({ message: "Failed to fetch security metrics" });
    }
};

/**
 * Export users to CSV
 * Download all company users as CSV
 */
exports.exportUsersCSV = async (req, res) => {
    try {
        const { company } = req.user;

        const users = await User.find({ company })
            .select("name email role createdAt lastLogin isVerified")
            .lean();

        // Create CSV
        const csvHeader = "Name,Email,Role,Created At,Last Login,Verified\n";
        const csvRows = users
            .map(
                (u) =>
                    `"${u.name}","${u.email}","${u.role}","${u.createdAt}","${u.lastLogin || "Never"}","${u.isVerified}"`
            )
            .join("\n");

        const csv = csvHeader + csvRows;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="users-${company}-${Date.now()}.csv"`
        );
        res.send(csv);
    } catch (err) {
        console.error("Error exporting users:", err);
        res.status(500).json({ message: "Failed to export users" });
    }
};

/**
 * Get recent registrations
 * Last 5 user registrations
 */
exports.getRecentRegistrations = async (req, res) => {
    try {
        const { company } = req.user;

        const recentUsers = await User.find({ company })
            .select("name email role createdAt isVerified")
            .sort({ createdAt: -1 })
            .limit(5);

        res.json(recentUsers);
    } catch (err) {
        console.error("Error fetching recent registrations:", err);
        res.status(500).json({ message: "Failed to fetch recent registrations" });
    }
};

/**
 * Bulk approve users
 * Approve multiple users at once
 */
exports.bulkApproveUsers = async (req, res) => {
    try {
        const { userIds, role } = req.body;
        const { company } = req.user;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "User IDs array is required" });
        }

        const usersToApprove = await User.find({
            _id: { $in: userIds },
            company,
            isVerified: false
        });

        if (usersToApprove.length === 0) {
            return res.status(404).json({ message: "No pending users found with provided IDs" });
        }

        // Update all users
        const updatePromises = usersToApprove.map(async (user) => {
            user.isVerified = true;
            if (role && ["employee", "manager", "admin"].includes(role)) {
                user.role = role;
            }
            await user.save();

            // Send approval email
            try {
                await emailService.sendEmail(
                    user.email,
                    "Account Approved - Welcome to Optima IDP",
                    `<h2>Welcome ${user.name}!</h2>
                     <p>Your account has been approved by an administrator.</p>
                     <p><strong>Role:</strong> ${user.role}</p>
                     <p>You can now log in and start using Optima IDP.</p>
                     <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login">Login Now</a></p>`
                );
            } catch (emailErr) {
                console.error("Failed to send approval email:", emailErr);
            }

            return user;
        });

        await Promise.all(updatePromises);

        // Log action
        await AuditLog.log({
            company,
            actor: req.user._id,
            action: "BULK_APPROVE_USERS",
            target: "multiple",
            targetType: "user",
            details: { count: usersToApprove.length, userIds },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });

        res.json({
            message: `${usersToApprove.length} users approved successfully`,
            approvedCount: usersToApprove.length
        });
    } catch (err) {
        console.error("Error bulk approving users:", err);
        res.status(500).json({ message: "Failed to bulk approve users" });
    }
};

/**
 * Bulk assign role to users
 * Change role for multiple users at once
 */
exports.bulkAssignRole = async (req, res) => {
    try {
        const { userIds, newRole } = req.body;
        const { company } = req.user;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "User IDs array is required" });
        }

        if (!["employee", "manager"].includes(newRole)) {
            return res.status(400).json({ message: "Invalid role. Must be 'employee' or 'manager'" });
        }

        const usersToUpdate = await User.find({
            _id: { $in: userIds },
            company
        });

        if (usersToUpdate.length === 0) {
            return res.status(404).json({ message: "No users found with provided IDs" });
        }

        // Update roles
        const updatePromises = usersToUpdate.map(async (user) => {
            const oldRole = user.role;
            user.role = newRole;
            await user.save();

            // Send notification email
            try {
                await emailService.sendEmail(
                    user.email,
                    `Role Updated to ${newRole}`,
                    `<h2>Hello ${user.name},</h2>
                     <p>Your role has been updated from <strong>${oldRole}</strong> to <strong>${newRole}</strong>.</p>
                     <p>Please log in to see your new permissions.</p>`
                );
            } catch (emailErr) {
                console.error("Failed to send role update email:", emailErr);
            }

            return { userId: user._id, oldRole, newRole };
        });

        const results = await Promise.all(updatePromises);

        // Log action
        await AuditLog.log({
            company,
            actor: req.user._id,
            action: "BULK_ASSIGN_ROLE",
            target: "multiple",
            targetType: "user",
            details: { count: usersToUpdate.length, newRole, changes: results },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });

        res.json({
            message: `${usersToUpdate.length} users updated successfully`,
            updatedCount: usersToUpdate.length,
            changes: results
        });
    } catch (err) {
        console.error("Error bulk assigning roles:", err);
        res.status(500).json({ message: "Failed to bulk assign roles" });
    }
};

