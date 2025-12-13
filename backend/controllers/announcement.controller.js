const Announcement = require("../models/Announcement");
const AuditLog = require("../models/AuditLog");

/**
 * Announcement Controller
 * ----------------------------------------
 * Manage org-wide announcements
 * Admins create/delete, all users can view and mark as viewed
 */

/**
 * Create a new announcement
 * Admin only
 */
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetRoles, targetTeams, expiresAt } = req.body;
        const { company, _id: authorId } = req.user;

        // Validate required fields
        if (!title || !content) {
            return res
                .status(400)
                .json({ message: "Title and content are required" });
        }

        // Create announcement
        const announcement = await Announcement.create({
            company,
            title,
            content,
            author: authorId,
            targetRoles: targetRoles || [],
            targetTeams: targetTeams || [],
            expiresAt: expiresAt || null,
            attachment: req.file ? {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                data: req.file.buffer
            } : undefined
        });

        // Log action
        await AuditLog.log({
            company,
            actor: authorId,
            action: "CREATE_ANNOUNCEMENT",
            target: announcement._id.toString(),
            targetType: "announcement",
            details: { title },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });

        res.status(201).json({
            message: "Announcement created successfully",
            announcement,
        });
    } catch (err) {
        console.error("Error creating announcement:", err);
        res.status(500).json({ message: "Failed to create announcement" });
    }
};

/**
 * Get announcements
 * Filtered by role if not admin
 */
exports.getAnnouncements = async (req, res) => {
    try {
        const { company, role } = req.user;
        console.log('[ANNOUNCEMENTS] Fetching for company:', company, 'role:', role);

        // Build query
        const query = {
            company,
            isArchived: false,
            $or: [
                { expiresAt: null }, // never expires
                { expiresAt: { $gt: new Date() } }, // not yet expired
            ],
        };

        // If not admin, filter by target roles
        if (role !== "admin") {
            query.$and = [
                {
                    $or: [
                        { targetRoles: { $size: 0 } }, // empty array = all roles
                        { targetRoles: role }, // includes this role
                    ],
                },
            ];
        }

        const announcements = await Announcement.find(query)
            .populate("author", "name")
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        console.log('[ANNOUNCEMENTS] Found', announcements.length, 'announcements');

        // Add viewCount and hasViewed for each
        const userId = req.user._id.toString();
        const enriched = announcements.map((ann) => ({
            ...ann,
            viewCount: ann.viewedBy?.length || 0,
            hasViewed: ann.viewedBy?.some((v) => v.user?.toString() === userId) || false,
        }));

        res.json(enriched);
    } catch (err) {
        console.error("[ANNOUNCEMENTS] Error fetching announcements:", err);
        console.error("[ANNOUNCEMENTS] Error stack:", err.stack);
        res.status(500).json({ message: "Failed to fetch announcements", error: err.message });
    }
};

/**
 * Mark announcement as viewed
 * Any user
 */
exports.markAsViewed = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        // Check if user belongs to same company
        if (announcement.company !== req.user.company) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Mark as viewed (method handles duplicate checking)
        announcement.markAsViewed(userId);
        await announcement.save();

        res.json({ message: "Announcement marked as viewed" });
    } catch (err) {
        console.error("Error marking announcement as viewed:", err);
        res.status(500).json({ message: "Failed to mark as viewed" });
    }
};

/**
 * Delete announcement
 * Admin only (soft delete)
 */
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { company, _id: actorId } = req.user;

        const announcement = await Announcement.findOne({ _id: id, company });

        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        // Soft delete
        announcement.isArchived = true;
        await announcement.save();

        // Log action
        await AuditLog.log({
            company,
            actor: actorId,
            action: "DELETE_ANNOUNCEMENT",
            target: id,
            targetType: "announcement",
            details: { title: announcement.title },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });

        res.json({ message: "Announcement deleted successfully" });
    } catch (err) {
        console.error("Error deleting announcement:", err);
        res.status(500).json({ message: "Failed to delete announcement" });
    }
};

/**
 * Download attachment
 * Any user in same company
 */
exports.downloadAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findById(id);

        if (!announcement || !announcement.attachment || !announcement.attachment.data) {
            return res.status(404).json({ message: "Attachment not found" });
        }

        if (announcement.company !== req.user.company) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.set('Content-Type', announcement.attachment.mimetype);
        res.set('Content-Disposition', `attachment; filename="${announcement.attachment.filename}"`);
        res.send(announcement.attachment.data);
    } catch (err) {
        console.error("Error downloading attachment:", err);
        res.status(500).json({ message: "Failed to download attachment" });
    }
};
