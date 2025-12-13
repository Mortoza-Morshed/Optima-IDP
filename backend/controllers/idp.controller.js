const IDP = require("../models/idp");
const User = require("../models/User");
const Skill = require("../models/skill");
const Resource = require("../models/resource");
const recommenderService = require("../services/recommender.service");

/**
 * CREATE IDP WITH AI-POWERED RECOMMENDATIONS
 * ------------------------------------------------------------
 * When employee creates an IDP:
 * 1. Fetch user skills
 * 2. Fetch all skills + resources from DB
 * 3. Send data to Python AI recommender
 * 4. Auto-fill recommendedResources + skillsToImprove
 * 5. Save IDP in MongoDB
 */
const queueService = require("../services/queue.service");

/**
 * CREATE IDP (ASYNC)
 * ------------------------------------------------------------
 * 1. Create IDP in "processing" state
 * 2. Push job to Redis queue
 * 3. Return IDP to user immediately
 * 4. Python worker will pick up job, generate recommendations, and update IDP
 */
exports.createIDP = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { goals, skillsToImprove = [], recommendedResources = [] } = req.body;

    // 1. Create IDP
    // If resources are provided (from the AI wizard), set status to 'pending' (or 'draft') instead of 'processing'
    // and skip the background queue.
    const initialStatus = recommendedResources.length > 0 ? "draft" : "processing";

    const newIDP = await IDP.create({
      employee: employeeId,
      goals,
      skillsToImprove,
      recommendedResources,
      status: initialStatus
    });

    // 2. Push job to queue ONLY if no resources were provided (old flow)
    if (recommendedResources.length === 0) {
      const jobAdded = await queueService.addJob({
        userId: employeeId,
        idpId: newIDP._id
      });

      if (!jobAdded) {
        console.error("Failed to add job to queue");
      }
    }


    if (!jobAdded) {
      // Fallback or error handling if queue fails
      // For now, just log it. In production, might want to retry or fail.
      console.error("Failed to add job to queue");
    }

    res.status(201).json({
      message: "IDP created. Generating recommendations in background...",
      idp: newIDP,
      status: "processing"
    });

  } catch (error) {
    console.error("Create IDP Error:", error);
    res.status(500).json({ message: "Failed to create IDP", error: error.message });
  }
};




/**
 * GET LOGGED-IN USER'S IDPs
 * GET /api/idp/my-idps
 */
exports.getMyIDPs = async (req, res) => {
  try {
    const idps = await IDP.find({ employee: req.user.id })
      .populate("skillsToImprove.skill")
      .populate("recommendedResources");

    res.json({ idps });

  } catch (error) {
    console.error("Get My IDPs Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * GET IDPs OF A SPECIFIC EMPLOYEE (Manager/Admin)
 * GET /api/idp/employee/:id
 */
exports.getIDPsByEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const idps = await IDP.find({ employee: employeeId })
      .populate("skillsToImprove.skill")
      .populate("recommendedResources");

    res.json({ idps });

  } catch (error) {
    console.error("Get IDPs By Employee Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * UPDATE AN EXISTING IDP (Employee)
 * ------------------------------------------------------------
 * PUT /api/idp/update/:id
 *
 * NEW FEATURE:
 * If req.body.refreshAI === true:
 * → Fetch user skills + all skills/resources
 * → Call Python AI recommender
 * → Refresh recommendedResources automatically
 *
 * If refreshAI is false/missing:
 * → Normal update without AI
 */
exports.updateIDP = async (req, res) => {
  try {
    const idpId = req.params.id;

    // 1️⃣ Find IDP
    const idp = await IDP.findById(idpId);
    if (!idp) {
      return res.status(404).json({ message: "IDP not found" });
    }

    // Ensure only the owner can update
    if (idp.employee.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Extract AI refresh flag
    const refreshAI = req.body.refreshAI === true;
    let aiSummary = null;

    // Prepare normal update data
    const updateData = { ...req.body };
    delete updateData.refreshAI; // Remove flag before DB update

    // 2️⃣ If user requests AI-based refresh
    if (refreshAI) {
      console.log("🔄 AI Refresh Triggered for IDP:", idpId);

      // --- Fetch and format USER SKILLS ---
      const user = await User.findById(req.user.id).populate("skills.skillId");
      const userSkillsFormatted = user.skills.map(s => ({
        skillId: String(s.skillId._id),
        level: s.level
      }));

      // --- Fetch and format ALL SKILLS ---
      const allSkills = await Skill.find();
      const skillsFormatted = allSkills.map(s => ({
        _id: String(s._id),
        name: s.name,
        category: s.category || "",
        description: s.description || ""
      }));

      // --- Fetch and format ALL RESOURCES ---
      const allResources = await Resource.find().populate("skill");
      const resourcesFormatted = allResources.map(r => ({
        _id: String(r._id),
        title: r.title,
        type: r.type,
        difficulty: r.difficulty,
        url: r.url,
        provider: r.provider,
        skill: r.skill
          ? { _id: String(r.skill._id), name: r.skill.name }
          : { _id: "", name: "" }
      }));

      // --- Prepare data for Python recommender ---
      const pythonData = {
        user_skills: userSkillsFormatted,
        skills_to_improve: req.body.skillsToImprove || [],
        performance_reports: [],
        resources: resourcesFormatted,
        skills: skillsFormatted,
        user_skills_data: [],
        limit: 10
      };

      // --- Call Python AI Recommender ---
      const aiResponse = await recommenderService.getRecommendedResources(pythonData);

      // --- Update recommended resource IDs ---
      updateData.recommendedResources = aiResponse.recommendations.map(r => r.resourceId);

      // --- Summary returned to frontend ---
      aiSummary = {
        recommendedResources: aiResponse.recommendations,
        skillsToImprove: aiResponse.skills_to_improve
      };
    }

    // 3️⃣ Apply update in DB
    const updatedIDP = await IDP.findByIdAndUpdate(idpId, updateData, { new: true });

    return res.json({
      message: refreshAI
        ? "IDP updated + AI recommendations refreshed"
        : "IDP updated successfully",
      idp: updatedIDP,
      aiSummary
    });

  } catch (error) {
    console.error("Update IDP Error:", error);
    res.status(500).json({
      message: "Failed to update IDP",
      error: error.message
    });
  }
};




/**
 * MANAGER APPROVES IDP
 * PUT /api/idp/approve/:id
 */
exports.approveIDP = async (req, res) => {
  try {
    const idpId = req.params.id;
    const { status, managerFeedback } = req.body;

    const idp = await IDP.findById(idpId);
    if (!idp) {
      return res.status(404).json({ message: "IDP not found" });
    }

    // Allow Approved or Rejected
    if (status && ["approved", "rejected", "needs_revision"].includes(status)) {
      idp.status = status;
    } else {
      idp.status = "approved"; // Default fallback
    }

    idp.managerFeedback = managerFeedback || "";
    await idp.save();

    res.json({
      message: `IDP ${idp.status} successfully`,
      idp
    });

  } catch (error) {
    console.error("Approve IDP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET PENDING IDPs (Manager View)
 * GET /api/idp/pending
 * Returns all IDPs with status 'draft' or 'pending'
 */
exports.getPendingIDPs = async (req, res) => {
  try {
    // In a real app, we would filter by company or direct reports
    // For this project, we fetch all pending/draft IDPs
    const idps = await IDP.find({
      status: { $in: ["draft", "pending", "processing"] }
    })
      .populate("employee", "name email avatar") // Fetch employee details
      .populate("skillsToImprove.skill", "name")
      .sort({ createdAt: -1 });

    res.json({ idps });
  } catch (error) {
    console.error("Get Pending IDPs Error:", error);
    res.status(500).json({ message: "Failed to fetch pending IDPs" });
  }
};




/**
 * GET ALL IDPs (Admin only)
 * GET /api/idp/all
 */
exports.getAllIDPs = async (req, res) => {
  try {
    const idps = await IDP.find()
      .populate("employee")
      .populate("skillsToImprove.skill")
      .populate("recommendedResources");

    res.json({ idps });

  } catch (error) {
    console.error("Get All IDPs Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET EMPLOYEE METRICS
 * GET /api/idp/metrics/employee
 */
exports.getEmployeeMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalIDPs = await IDP.countDocuments({ employee: userId });
    const completedIDPs = await IDP.countDocuments({ employee: userId, status: 'completed' });
    const inProgressIDPs = await IDP.countDocuments({
      employee: userId,
      status: { $in: ['approved', 'processing', 'pending', 'draft'] }
    });

    // Derive Recent Activity from IDP updates
    const recentActivityRaw = await IDP.find({ employee: userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("skillsToImprove.skill");

    const recentActivity = recentActivityRaw.map(idp => ({
      id: idp._id,
      action: `Updates on "${idp.skillsToImprove[0]?.skill?.name || 'General Goal'}"`,
      date: idp.updatedAt,
      status: idp.status
    }));

    // Derive Skill Growth from Completed IDPs (Cumulative)
    // Logic: Every completed IDP adds "1 level" virtual growth for visualization
    const completedHistory = await IDP.find({ employee: userId, status: 'completed' })
      .sort({ updatedAt: 1 }); // Oldest first

    let currentLevel = 2; // Baseline
    const skillGrowth = completedHistory.map(idp => {
      currentLevel += 0.5; // Arbitrary growth increment per IDP
      return {
        month: new Date(idp.updatedAt).toLocaleString('default', { month: 'short' }),
        level: currentLevel
      };
    });

    // If no history, provide a baseline
    if (skillGrowth.length === 0) {
      skillGrowth.push({ month: 'Start', level: 2 });
    }

    res.json({
      totalIDPs,
      completedIDPs,
      inProgressIDPs,
      skillGrowth,
      recentActivity
    });
  } catch (error) {
    console.error("Get Employee Metrics Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET TEAM METRICS (Manager)
 * GET /api/idp/metrics/team
 */
exports.getTeamMetrics = async (req, res) => {
  try {
    // Manager's Company
    const manager = await User.findById(req.user.id);
    const company = manager.company;

    // Find all employees in the same company
    const teamMembers = await User.find({ company, role: 'employee' });
    const teamMemberIds = teamMembers.map(u => u._id);

    const totalReports = teamMembers.length;

    // Pending Approvals (Global for team)
    const pendingApprovals = await IDP.countDocuments({
      employee: { $in: teamMemberIds },
      status: { $in: ['draft', 'pending'] }
    });

    // Team Average Skill (across all their skills)
    let totalSkillSum = 0;
    let totalSkillCount = 0;

    teamMembers.forEach(member => {
      member.skills.forEach(s => {
        totalSkillSum += s.level;
        totalSkillCount++;
      });
    });

    const teamAvgSkill = totalSkillCount > 0
      ? (totalSkillSum / totalSkillCount).toFixed(1)
      : 0;

    res.json({
      totalReports,
      pendingApprovals,
      teamAvgSkill
    });
  } catch (error) {
    console.error("Get Team Metrics Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET SYSTEM METRICS (Admin)
 * GET /api/idp/metrics/system
 */
exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeIDPs = await IDP.countDocuments({ status: { $ne: 'completed' } });
    const totalResources = await Resource.countDocuments();

    // Check Redis/Service health (Mock logic for now, or check DB connection)
    const systemStatus = "Healthy";

    res.json({
      totalUsers,
      activeIDPs,
      totalResources,
      systemStatus
    });
  } catch (error) {
    console.error("Get System Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
