const IDP = require("../models/IDP");
const User = require("../models/user");
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
exports.createIDP = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // Extract basic fields
    const { goals, skillsToImprove = [] } = req.body;

    // 1. Fetch user skills
    const user = await User.findById(employeeId).populate("skills.skillId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert user skills for Python format
    const userSkillsFormatted = user.skills.map(s => ({
      skillId: String(s.skillId._id),
      level: s.level
    }));

    // 2. Fetch all skills from DB
    const allSkills = await Skill.find();

    // Convert skills for Python
    const skillsFormatted = allSkills.map(s => ({
      _id: String(s._id),
      name: s.name,
      category: s.category || "",
      description: s.description || ""
    }));

    // 3. Fetch all learning resources
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

    // 4. Prepare Python request body
    const pythonData = {
      user_skills: userSkillsFormatted,
      skills_to_improve: skillsToImprove,
      performance_reports: [],        // OPTIONAL (we can integrate later)
      resources: resourcesFormatted,
      skills: skillsFormatted,
      user_skills_data: [],           // OPTIONAL (no co-occurrence yet)
      limit: 10
    };

    // 5. Call Python recommender
    const aiResponse = await recommenderService.getRecommendedResources(pythonData);

    // Extract recommended resource IDs
    const recommendedResourceIds = aiResponse.recommendations.map(r => r.resourceId);

    // 6. Create new IDP with AI data
    const newIDP = await IDP.create({
      employee: employeeId,
      goals,
      skillsToImprove,                 // Later: AI can refine this
      recommendedResources: recommendedResourceIds,
      status: "draft"
    });

    res.status(201).json({
      message: "AI-powered IDP created successfully",
      aiSummary: {
        recommendedResources: aiResponse.recommendations,
        skillsToImprove: aiResponse.skills_to_improve
      },
      idp: newIDP
    });

  } catch (error) {
    console.error("AI Create IDP Error:", error);
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

    const idp = await IDP.findById(idpId);
    if (!idp) {
      return res.status(404).json({ message: "IDP not found" });
    }

    idp.status = "approved";
    idp.managerFeedback = req.body.managerFeedback || "";
    await idp.save();

    res.json({
      message: "IDP approved successfully",
      idp
    });

  } catch (error) {
    console.error("Approve IDP Error:", error);
    res.status(500).json({ message: "Server error" });
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
