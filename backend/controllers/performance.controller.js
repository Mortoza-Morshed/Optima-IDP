const PerformanceReport = require("../models/PerformanceReport");

/**
 * PERFORMANCE CONTROLLER
 * ----------------------------------------------------
 * Handles manager evaluations, employee access,
 * and admin oversight of performance reports.
 */



/**
 * ADD A PERFORMANCE REPORT (Manager/Admin)
 * POST /api/performance/add
 */
exports.addReport = async (req, res) => {
  try {
    const managerId = req.user.id; // manager/admin creating the report
    const {
      employee,
      reviewPeriod,
      strengths,
      weaknesses,
      rating,
      relatedSkills,
      managerComments
    } = req.body;

    const report = await PerformanceReport.create({
      employee,
      manager: managerId,
      reviewPeriod,
      strengths,
      weaknesses,
      rating,
      relatedSkills,
      managerComments
    });

    res.status(201).json({
      message: "Performance report added successfully",
      report
    });

  } catch (error) {
    console.error("Add Performance Report Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * GET LOGGED-IN USER'S PERFORMANCE REPORTS (Employee)
 * GET /api/performance/my-reports
 */
exports.getMyReports = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const reports = await PerformanceReport.find({ employee: employeeId })
      .populate("manager")
      .populate("relatedSkills")
      .sort({ createdAt: -1 });

    res.json({ reports });

  } catch (error) {
    console.error("Get My Reports Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * GET REPORTS FOR A SPECIFIC EMPLOYEE (Manager/Admin)
 * GET /api/performance/employee/:id
 */
exports.getReportsByEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const reports = await PerformanceReport.find({ employee: employeeId })
      .populate("manager")
      .populate("relatedSkills")
      .sort({ createdAt: -1 });

    res.json({ reports });

  } catch (error) {
    console.error("Get Reports By Employee Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * GET ALL PERFORMANCE REPORTS (Admin Only)
 * GET /api/performance/all
 */
exports.getAllReports = async (req, res) => {
  try {
    const reports = await PerformanceReport.find()
      .populate("employee")
      .populate("manager")
      .populate("relatedSkills")
      .sort({ createdAt: -1 });

    res.json({ reports });

  } catch (error) {
    console.error("Get All Reports Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
