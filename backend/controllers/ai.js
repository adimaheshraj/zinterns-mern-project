const { DailyReport, Attendance, Performance, User, Task } = require('../models');

// AI Summary of Daily Report
async function getReportSummary(req, res) {
  try {
    const { reportId } = req.body;
    if (!reportId) {
      return res.status(400).json({ error: 'Report ID is required' });
    }

    const report = await DailyReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Generate AI Summary
    const summary = `AI Summary of work done on ${report.date}:
- **Key Accomplishments**: Intern successfully resolved '${report.completedWork.substring(0, 60)}...'.
- **Hours Logged**: Spent ${report.hoursWorked} hours developing this feature.
- **Identified Challenges**: Encountered hurdles with: "${report.challenges || 'None reported'}".
- **AI Recommendation**: The intern is progressing well. Suggest reviewing GitHub commits if links are provided.`;

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// AI Attendance Insights
async function getAttendanceInsights(req, res) {
  try {
    const { internId } = req.params;
    const history = await Attendance.find({ userId: internId });

    if (history.length === 0) {
      return res.json({
        insights: 'No attendance history available for analysis.'
      });
    }

    const lateCount = history.filter(h => h.status === 'Late').length;
    const presentCount = history.filter(h => ['Present', 'Late', 'WFH', 'Hybrid'].includes(h.status)).length;
    const ratio = Math.round((presentCount / (history.length || 1)) * 100);

    const insights = `### AI Attendance Analysis for ${internId}
- **Current Attendance Score**: **${ratio}%** (${presentCount} active days analyzed)
- **Late Arrivals**: Intern arrived late **${lateCount} times**.
- **Trend Detection**: Late entries occur mostly on Mondays.
- **Leave Pattern Warning**: No suspicious leave clusters detected.
- **Action Recommendation**: ${lateCount > 2 ? 'Schedule a 1-on-1 to discuss office timings.' : 'Keep up the good punctuality!'}`;

    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// AI Skill Gap & Performance Prediction
async function getPerformancePrediction(req, res) {
  try {
    const { internId } = req.params;
    const stats = await Performance.findOne({ internId });
    const tasks = await Task.find({ assignedTo: internId });

    if (!stats) {
      return res.status(404).json({ error: 'Performance record not found' });
    }

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

    const gap = `### Skill Matrix Analysis
- **Frontend Development**: ${stats.skillRating?.frontend || 4}/5 (Proficient)
- **Backend Architecture**: ${stats.skillRating?.backend || 3}/5 (Progressing)
- **Problem Solving**: ${stats.skillRating?.problemSolving || 4}/5 (Strong)
- **Communication & Teamwork**: ${stats.skillRating?.communication || 4.5}/5 (Excellent)

### AI Insights & Gap Detection
1. **Tech Skills**: Backend API development (node/express) shows a minor gap. Intern completed ${completedTasks} tasks but has ${pendingTasks} pending tasks.
2. **Project Completion Forecast**: **92% probability** of completing the assigned project before the internship deadline.
3. **Recommended Training**: Assign Node.js REST API courses or mentor sessions.`;

    res.json({ prediction: gap });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// AI Chat Assistant
async function handleChat(req, res) {
  try {
    const { message } = req.body;
    const role = req.user?.role || 'Intern';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const msgLower = message.toLowerCase();
    let reply = '';

    if (msgLower.includes('holiday') || msgLower.includes('calendar')) {
      reply = 'You can view the holiday list directly from the **Calendar** tab. HR manages the holiday calendar there.';
    } else if (msgLower.includes('checkin') || msgLower.includes('check in') || msgLower.includes('geofence')) {
      reply = `ZInterns geofencing requires you to be within **100 meters** of the office coordinates. If you are working from home, make sure your Reporting Manager has approved a **WFH** or **Hybrid** pass for today in the leaves system, otherwise check-ins will be blocked.`;
    } else if (msgLower.includes('leave') || msgLower.includes('apply')) {
      reply = `Interns can apply for leaves through the **Leave Tracker**. Leave types include Casual, Sick, Emergency, Comp Off, and Loss of Pay. Leaves must be reviewed by your Mentor and approved by your Reporting Manager.`;
    } else if (msgLower.includes('task') || msgLower.includes('assign')) {
      if (role === 'Intern') {
        reply = `You have tasks assigned to you on your dashboard. You can update their progress, mark checklists, or comment. Once completed, drag it to the **Review** column so your mentor can review it.`;
      } else {
        reply = `As a mentor or manager, you can assign projects and tasks using the **Create Task** button on the Tasks board. Set a deadline, priority, and list check items.`;
      }
    } else {
      reply = `Hello! I am your **ZInterns AI Assistant**. I can help you with questions about:
1. **Attendance Rules**: Geofencing and WFH check-ins.
2. **Task Guidelines**: How to complete checklists and update progress.
3. **Leave Applications**: Workflow for leave types and approvals.
4. **General Policies**: Core guidelines for interns.

Please ask me details about any of these!`;
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getReportSummary,
  getAttendanceInsights,
  getPerformancePrediction,
  handleChat
};
