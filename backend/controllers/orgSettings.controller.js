const OrgSettings = require("../models/OrgSettings");
const AuditLog = require("../models/AuditLog");
const multer = require("multer");
const path = require("path");

/**
 * OrgSettings Controller
 * ----------------------------------------
 * Manage organization-level settings
 * Admin only access
 */

/**
 * Get organization settings
 */
exports.getOrgSettings = async (req, res) => {
    try {
        const { company } = req.user;

        // Get or create settings for this company
        const settings = await OrgSettings.getOrCreate(company);

        res.json(settings);
    } catch (err) {
        console.error("Error fetching org settings:", err);
        res.status(500).json({ message: "Failed to fetch organization settings" });
    }
};

/**
 * Update organization settings
 */
exports.updateOrgSettings = async (req, res) => {
    try {
        const { company } = req.user;
        const updates = req.body;

        // Find and update settings
        let settings = await OrgSettings.findOne({ company });

        if (!settings) {
            settings = await OrgSettings.create({ company, ...updates });
        } else {
            // Merge updates
            Object.assign(settings, updates);
            await settings.save();
        }

        // Log action
        await AuditLog.log({
            company,
            actor: req.user._id,
            action: "UPDATE_ORG_SETTINGS",
            target: settings._id.toString(),
            targetType: "settings",
            details: { updatedFields: Object.keys(updates) },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });

        res.json({
            message: "Organization settings updated successfully",
            settings,
        });
    } catch (err) {
        console.error("Error updating org settings:", err);
        res.status(500).json({ message: "Failed to update organization settings" });
    }
};

/**
 * Upload company logo
 */
exports.uploadLogo = async (req, res) => {
    try {
        const { company } = req.user;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Convert to base64 for storage (or save to cloud storage)
        const logoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

        // Update settings
        let settings = await OrgSettings.findOne({ company });
        if (!settings) {
            settings = await OrgSettings.create({ company });
        }

        settings.branding.logo = logoBase64;
        await settings.save();

        // Log action
        await AuditLog.log({
            company,
            actor: req.user._id,
            action: "UPDATE_BRANDING",
            target: settings._id.toString(),
            targetType: "settings",
            details: { action: "logo_upload" },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });

        res.json({
            message: "Logo uploaded successfully",
            logo: logoBase64,
        });
    } catch (err) {
        console.error("Error uploading logo:", err);
        res.status(500).json({ message: "Failed to upload logo" });
    }
};

/**
 * Get skill targets
 */
exports.getSkillTargets = async (req, res) => {
    try {
        const { company } = req.user;

        const settings = await OrgSettings.findOne({ company });

        if (!settings) {
            return res.json({ skillTargets: [] });
        }

        res.json({ skillTargets: settings.skillTargets || [] });
    } catch (err) {
        console.error("Error fetching skill targets:", err);
        res.status(500).json({ message: "Failed to fetch skill targets" });
    }
};

/**
 * Set/update skill targets
 */
exports.setSkillTargets = async (req, res) => {
    try {
        const { company } = req.user;
        const { skillTargets } = req.body;

        if (!Array.isArray(skillTargets)) {
            return res.status(400).json({ message: "skillTargets must be an array" });
        }

        // Get or create settings
        let settings = await OrgSettings.findOne({ company });
        if (!settings) {
            settings = await OrgSettings.create({ company });
        }

        settings.skillTargets = skillTargets;
        await settings.save();

        // Log action
        await AuditLog.log({
            company,
            actor: req.user._id,
            action: "UPDATE_SKILL_TARGETS",
            target: settings._id.toString(),
            targetType: "settings",
            details: { targetCount: skillTargets.length },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });

        res.json({
            message: "Skill targets updated successfully",
            skillTargets: settings.skillTargets,
        });
    } catch (err) {
        console.error("Error setting skill targets:", err);
        res.status(500).json({ message: "Failed to set skill targets" });
    }
};
