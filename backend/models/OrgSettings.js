const mongoose = require("mongoose");

/**
 * OrgSettings Schema
 * ----------------------------------------
 * Organization-level settings and configurations
 * One record per company (multi-tenant)
 * 
 * Includes:
 * - Branding (logo, colors)
 * - Security policies
 * - Data retention settings
 * - Skill targets
 * - Recommender defaults
 */

const OrgSettingsSchema = new mongoose.Schema(
    {
        // Company name (unique, one settings doc per company)
        company: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },

        // Company branding
        branding: {
            logo: {
                type: String, // URL or base64-encoded image
                default: null
            },
            primaryColor: {
                type: String,
                default: "#9333ea" // purple-600
            },
            secondaryColor: {
                type: String,
                default: "#3b82f6" // blue-500
            }
        },

        // Allowed email domains for auto-approval
        allowedDomains: {
            type: [String],
            default: [],
            lowercase: true
        },

        // Data retention policies
        dataRetention: {
            archiveInactiveUsersAfterDays: {
                type: Number,
                default: 90
            },
            deleteLogsAfterDays: {
                type: Number,
                default: 365
            },
            complianceMode: {
                type: Boolean,
                default: false
            }
        },

        // Security and access policies
        policies: {
            approvalRequired: {
                type: Boolean,
                default: true // new users need admin approval
            },
            passwordPolicy: {
                minLength: {
                    type: Number,
                    default: 8
                },
                requireUppercase: {
                    type: Boolean,
                    default: true
                },
                requireNumbers: {
                    type: Boolean,
                    default: true
                },
                requireSpecialChars: {
                    type: Boolean,
                    default: false
                }
            },
            mfaEnforced: {
                type: Boolean,
                default: false // require all users to enable MFA
            },
            sessionTimeoutMinutes: {
                type: Number,
                default: 480 // 8 hours
            }
        },

        // Organization-level skill targets
        skillTargets: [
            {
                skill: {
                    type: String,
                    required: true,
                    trim: true
                },
                targetLevel: {
                    type: Number,
                    min: 1,
                    max: 10,
                    required: true
                },
                priority: {
                    type: String,
                    enum: ["critical", "high", "medium", "low"],
                    default: "medium"
                },
                description: {
                    type: String,
                    maxlength: 500
                }
            }
        ],

        // Default recommender weights for new users
        recommenderDefaults: {
            skill_gap: { type: Number, default: 0.35 },
            skill_relevance: { type: Number, default: 0.25 },
            difficulty_match: { type: Number, default: 0.20 },
            collaborative: { type: Number, default: 0.20 },
            resource_type: { type: Number, default: 0.00 },
            skill_similarity: { type: Number, default: 0.00 }
        },

        // Company info
        companyInfo: {
            industry: {
                type: String,
                default: null
            },
            size: {
                type: String,
                enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
                default: null
            },
            timezone: {
                type: String,
                default: "UTC"
            },
            website: {
                type: String,
                default: null
            }
        },

        // Notification defaults
        notificationDefaults: {
            newUserRegistration: {
                type: Boolean,
                default: true
            },
            pendingApprovals: {
                type: Boolean,
                default: true
            },
            systemAlerts: {
                type: Boolean,
                default: true
            },
            digestCadence: {
                type: String,
                enum: ["realtime", "daily", "weekly"],
                default: "daily"
            }
        }
    },
    {
        timestamps: true
    }
);

// Static method: Get or create org settings for a company
OrgSettingsSchema.statics.getOrCreate = async function (company) {
    let settings = await this.findOne({ company });
    if (!settings) {
        settings = await this.create({ company });
    }
    return settings;
};

module.exports = mongoose.model("OrgSettings", OrgSettingsSchema);
