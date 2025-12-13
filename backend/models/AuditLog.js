const mongoose = require("mongoose");

/**
 * AuditLog Schema
 * ----------------------------------------
 * Comprehensive audit trail for all admin and critical actions
 * 
 * Tracks:
 * - User management (approvals, role changes, deletions)
 * - Settings changes
 * - Security events
 * - Resource management
 */

const AuditLogSchema = new mongoose.Schema(
    {
        // Company (multi-tenant)
        company: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        // User who performed the action
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Action type
        action: {
            type: String,
            required: true,
            enum: [
                // User management
                "APPROVE_USER",
                "DENY_USER",
                "PROMOTE_USER",
                "DEMOTE_USER",
                "DELETE_USER",
                "INVITE_USER",
                "BULK_IMPORT_USERS",

                // Role management
                "CHANGE_ROLE",
                "ASSIGN_MANAGER",

                // Settings
                "UPDATE_ORG_SETTINGS",
                "UPDATE_BRANDING",
                "UPDATE_POLICIES",
                "UPDATE_SKILL_TARGETS",
                "UPDATE_RECOMMENDER_WEIGHTS",

                // Resources
                "CREATE_RESOURCE",
                "UPDATE_RESOURCE",
                "DELETE_RESOURCE",
                "PUBLISH_RESOURCE",

                // Announcements
                "CREATE_ANNOUNCEMENT",
                "DELETE_ANNOUNCEMENT",

                // Security
                "GENERATE_API_KEY",
                "REVOKE_API_KEY",
                "ENABLE_MFA",
                "DISABLE_MFA",
                "REVOKE_SESSION",
                "PASSWORD_RESET",

                // Integrations
                "CREATE_WEBHOOK",
                "UPDATE_WEBHOOK",
                "DELETE_WEBHOOK",

                // IDP
                "OVERRIDE_IDP",
                "LOCK_GOAL",

                // System
                "SYSTEM_RESTART",
                "MAINTENANCE_MODE"
            ]
        },

        // Target of the action (user ID, resource ID, etc.)
        target: {
            type: String,
            default: null
        },

        // Target type for better categorization
        targetType: {
            type: String,
            enum: ["user", "resource", "announcement", "webhook", "settings", "system", null],
            default: null
        },

        // Additional details (free-form JSON)
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // IP address of actor
        ip: {
            type: String,
            default: null
        },

        // User agent
        userAgent: {
            type: String,
            default: null
        },

        // Status of the action
        status: {
            type: String,
            enum: ["success", "failure", "pending"],
            default: "success"
        },

        // Error message if action failed
        errorMessage: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true // createdAt, updatedAt
    }
);

// Indexes for efficient querying
AuditLogSchema.index({ company: 1, createdAt: -1 });
AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ target: 1 });

// Static method: Create audit log entry
AuditLogSchema.statics.log = async function (data) {
    try {
        return await this.create(data);
    } catch (err) {
        console.error("Failed to create audit log:", err);
        // Don't throw - audit logging should never break the main flow
        return null;
    }
};

// Static method: Get recent logs for company
AuditLogSchema.statics.getRecent = async function (company, limit = 20) {
    return await this.find({ company })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("actor", "name email")
        .lean();
};

// Static method: Get logs by actor
AuditLogSchema.statics.getByActor = async function (actorId, limit = 50) {
    return await this.find({ actor: actorId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

module.exports = mongoose.model("AuditLog", AuditLogSchema);
