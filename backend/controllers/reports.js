const { DailyReport, User } = require('../models');

// Submit Daily Report
async function submitReport(req, res) {
  try {
    const userId = req.user?.employeeId || '';
    const { tasksToday, completedWork, pendingWork, challenges, tomorrowPlan, hoursWorked, githubLink, demoLink, screenshot } = req.body;

    if (!tasksToday || !completedWork) {
      return res.status(400).json({ error: 'Today\'s tasks and completed work details are required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Check if report already exists for today
    const existing = await DailyReport.findOne({
      internId: userId,
      date: todayStr
    });

    if (existing) {
      return res.status(400).json({ error: 'Daily report for today has already been submitted' });
    }

    const report = await DailyReport.create({
      internId: userId,
      date: todayStr,
      tasksToday,
      completedWork,
      pendingWork,
      challenges,
      tomorrowPlan,
      hoursWorked: Number(hoursWorked) || 9,
      githubLink,
      demoLink,
      screenshot,
      rating: undefined,
      feedback: undefined,
      reviewedBy: undefined
    });

    res.status(201).json({
      message: 'Daily report submitted successfully',
      report
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Reports List
async function getReports(req, res) {
  try {
    const { employeeId, role, department } = req.user;

    let filter = {};
    if (role === 'Intern') {
      filter.internId = employeeId;
    } else if (role === 'Mentor') {
      const interns = await User.find({ mentor: employeeId });
      const internIds = interns.map(i => i.employeeId);
      filter = { internId: { $in: internIds } };
    } else if (role === 'RM') {
      const deptUsers = await User.find({ department });
      const userIds = deptUsers.map(u => u.employeeId);
      filter = { internId: { $in: userIds } };
    }

    const { internId } = req.query;
    if (internId) filter.internId = internId;

    const list = await DailyReport.find(filter);
    
    // Sort descending by date
    const sorted = list.sort((a, b) => {
      return b.date.localeCompare(a.date);
    });

    const enrichedList = [];
    for (const item of sorted) {
      const intern = await User.findOne({ employeeId: item.internId });
      enrichedList.push({
        ...item,
        internName: intern?.name || 'Unknown Intern',
        internDept: intern?.department || 'N/A'
      });
    }

    res.json(enrichedList);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Review Daily Report (Mentor only)
async function reviewReport(req, res) {
  try {
    const { employeeId, role } = req.user;
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (role !== 'Mentor' && role !== 'RM') {
      return res.status(403).json({ error: 'Only mentors and managers can review reports' });
    }

    if (rating === undefined) {
      return res.status(400).json({ error: 'Rating is required' });
    }

    const report = await DailyReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Daily report not found' });
    }

    const updated = await DailyReport.findByIdAndUpdate(id, {
      rating: Number(rating),
      feedback,
      reviewedBy: employeeId
    }, { new: true });

    res.json({
      message: 'Report reviewed and graded successfully',
      report: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  submitReport,
  getReports,
  reviewReport
};
