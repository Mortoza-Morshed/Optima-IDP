const mongoose = require("mongoose");

/**
 * Announcement Schema
 * ----------------------------------------
 * Org-wide announcements posted by admins
 * 
 * Features:
 * - Target specific roles or teams
 * - Track who has viewed the announcement
 * - Optional expiration date for auto-archiving
 */

const AnnouncementSchema = new mongoose.Schema(
    {
        // Company this announcement belongs to (multi-tenant)
        company: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        // Announcement title
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        // Announcement content
        content: {
            type: String,
            required: true,
            maxlength: 5000
        },

        // Admin who posted this announcement
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Optional attachment
        attachment: {
            filename: String,
            mimetype: String,
            data: Buffer // Store file directly in DB for simplicity
        },

        // Target roles (empty array = all roles)
        targetRoles: {
            type: [String],
            enum: ["employee", "manager", "admin", ""],
            default: []
        },

        // Target teams/departments (empty array = all teams)
        // Future enhancement: reference to Team model when implemented
        targetTeams: {
            type: [String],
            default: []
        },

        // Track who has viewed this announcement
        viewedBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                viewedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        // Optional expiration date (for auto-archiving)
        expiresAt: {
            type: Date,
            default: null
        },

        // Soft delete flag
        isArchived: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true // createdAt, updatedAt
    }
);

// Index for efficient querying by company
AnnouncementSchema.index({ company: 1, createdAt: -1 });

// Index for checking expiration
AnnouncementSchema.index({ expiresAt: 1 });

// Virtual: view count
AnnouncementSchema.virtual("viewCount").get(function () {
    return this.viewedBy.length;
});

// Method: Check if user has viewed this announcement
AnnouncementSchema.methods.hasViewed = function (userId) {
    return this.viewedBy.some(
        (view) => view.user.toString() === userId.toString()
    );
};

// Method: Mark as viewed by user
AnnouncementSchema.methods.markAsViewed = function (userId) {
    if (!this.hasViewed(userId)) {
        this.viewedBy.push({ user: userId, viewedAt: new Date() });
    }
};

// Ensure virtuals are included in JSON output
AnnouncementSchema.set("toJSON", { virtuals: true });
AnnouncementSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Announcement", AnnouncementSchema);
