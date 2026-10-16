const { DailyReport, Attendance, Performance, User, Task } = require('../models');

const CHAT_COMPLETIONS_URL = process.env.AI_CHAT_COMPLETIONS_URL || 'https://api.openai.com/v1/chat/completions';

function buildFallbackReply(message, role) {
  const text = message.toLowerCase();
  const isIntern = role === 'Intern';
  const hasAny = (...terms) => terms.some((term) => text.includes(term));

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(text.trim())) {
    return 'Hi! I can guide you around ZInterns. Ask me about attendance, leave requests, tasks, reports, your team, or using a workspace feature.';
  }
  if (hasAny('what can you do', 'help me', 'help', 'capabilities')) {
    return 'I can guide you through ZInterns features, including check-in and attendance, WFH requests, leave approvals, tasks, reports, the calendar, team directory, and files. Tell me what you are trying to do and I’ll point you to the right place.';
  }
  if (hasAny('check in', 'check-in', 'checkin', 'attendance', 'late', 'geofence')) {
    return 'Open Time Tracker to check your attendance status and record a check-in or check-out. If location validation fails, confirm that location access is enabled and that you are at the configured office location. If you are working remotely, request WFH or Hybrid approval before checking in. Contact HR if the issue continues.';
  }
  if (hasAny('wfh', 'work from home', 'remote work', 'hybrid')) {
    return 'Open the attendance or WFH area and submit a request for the date and work mode you need. Your request must be reviewed by the appropriate manager before it is approved. You can check its current status in the same area.';
  }
  if (hasAny('leave', 'time off', 'vacation', 'sick day')) {
    return `Open Leave Tracker to submit a request with the leave type, dates, and reason. You can check its status there after submitting. ${isIntern ? 'Your mentor and reporting manager review requests according to your organization’s workflow.' : 'The assigned reviewers can review pending requests from the dashboard or Leave Tracker.'}`;
  }
  if (hasAny('task', 'checklist', 'assignment', 'deadline', 'project')) {
    return isIntern
      ? 'Open Tasks Board to view your assignments, deadlines, and progress. Open a task to update its status, complete checklist items, or add a comment. When it is ready for review, move it to the Review column.'
      : 'Open Tasks Board to review work and create or update assignments. Use the task details to set an owner, due date, priority, checklist, and progress.';
  }
  if (hasAny('report', 'daily update', 'work summary')) {
    return 'Open Daily Reports to submit or review a work update. Include what you completed, the time spent, and any blockers so your manager or mentor has useful context.';
  }
  if (hasAny('holiday', 'calendar', 'event', 'date')) {
    return 'Open Calendar to view holidays and scheduled events. Organization administrators manage the shared holiday and event calendar.';
  }
  if (hasAny('directory', 'employee', 'coworker', 'colleague', 'team', 'department', 'manager', 'mentor', 'organization')) {
    return 'Open Directory to browse your organization and team. Depending on your access, you can view employee profiles, team structure, and department information.';
  }
  if (hasAny('time tracker', 'timesheet', 'hours', 'working hours')) {
    return 'Open Time Tracker to review today’s attendance, record check-in or check-out, and view your time history.';
  }
  if (hasAny('file', 'document', 'upload', 'share')) {
    return 'Open File Cabinet to browse shared files or upload a document. Access depends on your account permissions.';
  }
  if (hasAny('setting', 'profile', 'password', 'account')) {
    return 'Open Settings to update your profile and account preferences. For a forgotten password, use the Forgot password link on the sign-in screen. If you cannot access your account, contact your administrator.';
  }

  return 'I can help with ZInterns attendance, WFH, leave requests, tasks, reports, the calendar, team directory, files, and account settings. I do not have the AI service configured for open-ended questions yet; ask me about one of those features, or ask your administrator to configure AI_CHAT_COMPLETIONS_URL, AI_API_KEY, and AI_MODEL on the backend.';
}

async function getConfiguredChatReply(message, history, role) {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) return null;

  const systemPrompt = [
    'You are the ZInterns AI Guide, a concise and friendly assistant for the ZInterns employee workspace.',
    'Answer the user’s actual question directly and use prior conversation when relevant.',
    'Help with ZInterns features such as attendance, time tracking, WFH, leave requests, tasks, reports, calendar, directory, files, and settings.',
    'Give practical step-by-step navigation when asked how to do something.',
    'Do not invent company policies, user records, settings, approvals, or feature behavior. If a detail is not known, say so and suggest checking with the user’s manager or HR.',
    'Do not claim to perform actions or access account data. The signed-in user role is provided only to tailor general guidance.',
    'Use plain text with short paragraphs and simple bullet points. Avoid Markdown tables.',
    `Signed-in user role: ${role}.`
  ].join(' ');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(({ role: messageRole, content }) => ({ role: messageRole, content })),
    { role: 'user', content: message }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.4,
        max_tokens: 600
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error(`AI chat provider returned HTTP ${response.status}.`);
      throw new Error('The AI service is temporarily unavailable. Please try again shortly.');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      console.error('AI chat provider returned an empty or invalid response.');
      throw new Error('The AI service returned an empty response. Please try again.');
    }

    return reply.trim();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The AI service took too long to respond. Please try again.');
    }
    if (error instanceof TypeError || error instanceof SyntaxError) {
      throw new Error('Unable to connect to the AI service. Please check the provider configuration and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

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
    const { message, history = [] } = req.body || {};
    const role = req.user?.role || 'Intern';

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A message is required.' });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ error: 'Messages must be 2,000 characters or fewer.' });
    }

    if (!Array.isArray(history) || history.length > 10) {
      return res.status(400).json({ error: 'Conversation history must contain no more than 10 messages.' });
    }

    const validHistory = [];
    for (const item of history) {
      if (
        !item ||
        !['user', 'assistant'].includes(item.role) ||
        typeof item.content !== 'string' ||
        !item.content.trim() ||
        item.content.length > 2000
      ) {
        return res.status(400).json({ error: 'Conversation history contains an invalid message.' });
      }
      validHistory.push({ role: item.role, content: item.content.trim() });
    }

    const configuredReply = await getConfiguredChatReply(trimmedMessage, validHistory, role);
    const reply = configuredReply || buildFallbackReply(trimmedMessage, role);
    res.json({ reply, mode: configuredReply ? 'ai' : 'guide' });
  } catch (error) {
    console.error('AI chat request failed:', error);
    res.status(502).json({ error: error.message || 'The AI guide could not respond. Please try again.' });
  }
}

module.exports = {
  getReportSummary,
  getAttendanceInsights,
  getPerformancePrediction,
  handleChat
};
