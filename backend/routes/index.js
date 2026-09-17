const express = require('express');
const router = express.Router();

const { authenticateJWT, requireRoles } = require('../middlewares/auth');

const authCtrl = require('../controllers/auth');
const attendanceCtrl = require('../controllers/attendance');
const tasksCtrl = require('../controllers/tasks');
const leavesCtrl = require('../controllers/leaves');
const reportsCtrl = require('../controllers/reports');
const orgCtrl = require('../controllers/org');
const aiCtrl = require('../controllers/ai');
const announcementsCtrl = require('../controllers/announcements');
const filesCtrl = require('../controllers/files');
const holidaysCtrl = require('../controllers/holidays');
const calendarCtrl = require('../controllers/calendar');
const telemetryCtrl = require('../controllers/telemetry');

// --- Auth Routes ---
router.post('/auth/login', authCtrl.loginUser);
router.get('/public/telemetry', telemetryCtrl.getPublicTelemetry);
router.post('/auth/register', authenticateJWT, requireRoles(['HR', 'Super Admin']), authCtrl.registerUser);
router.post('/auth/change-password', authenticateJWT, authCtrl.changePassword);
router.put('/auth/change-password', authenticateJWT, authCtrl.changePassword);
router.put('/auth/profile', authenticateJWT, authCtrl.updateProfile);
router.get('/auth/me', authenticateJWT, authCtrl.getMe);
router.get('/auth/settings', authenticateJWT, authCtrl.getSettings);
router.put('/auth/settings', authenticateJWT, requireRoles(['HR', 'Super Admin']), authCtrl.updateSettings);

// --- Attendance & WFH Routes ---
router.post('/attendance/checkin', authenticateJWT, attendanceCtrl.checkIn);
router.post('/attendance/checkout', authenticateJWT, attendanceCtrl.checkOut);
router.get('/attendance/today', authenticateJWT, attendanceCtrl.getTodayStatus);
router.get('/attendance/history', authenticateJWT, attendanceCtrl.getHistory);
router.get('/attendance/stats', authenticateJWT, attendanceCtrl.getDepartmentStats);
router.post('/attendance/wfh-request', authenticateJWT, attendanceCtrl.createWFHRequest);
router.get('/attendance/wfh-requests', authenticateJWT, attendanceCtrl.getWFHRequests);
router.put('/attendance/wfh-requests/:id', authenticateJWT, requireRoles(['RM', 'HR', 'Super Admin']), attendanceCtrl.reviewWFHRequest);

// --- Tasks Routes ---
router.get('/tasks', authenticateJWT, tasksCtrl.getTasks);
router.post('/tasks', authenticateJWT, tasksCtrl.createTask);
router.put('/tasks/:id', authenticateJWT, tasksCtrl.updateTask);
router.post('/tasks/:id/comments', authenticateJWT, tasksCtrl.addTaskComment);

// --- Leaves Routes ---
router.get('/leaves', authenticateJWT, leavesCtrl.getLeaves);
router.post('/leaves', authenticateJWT, leavesCtrl.applyLeave);
router.put('/leaves/:id', authenticateJWT, leavesCtrl.updateLeaveStatus);

// --- Daily Reports Routes ---
router.get('/reports', authenticateJWT, reportsCtrl.getReports);
router.post('/reports', authenticateJWT, reportsCtrl.submitReport);
router.put('/reports/:id/review', authenticateJWT, reportsCtrl.reviewReport);

// --- Org Routes ---
router.get('/org/stats', authenticateJWT, orgCtrl.getOrgStats);
router.get('/org/tree', authenticateJWT, orgCtrl.getOrgTree);
router.get('/org/department-tree', authenticateJWT, orgCtrl.getDepartmentTree);
router.get('/org/directory', authenticateJWT, orgCtrl.getDirectory);
router.get('/org/profile/:id', authenticateJWT, orgCtrl.getEmployeeProfile);
router.put('/org/users/:id/status', authenticateJWT, requireRoles(['HR', 'Super Admin']), orgCtrl.updateAccountStatus);
router.get('/org/departments', authenticateJWT, orgCtrl.getDepartments);
router.post('/org/departments', authenticateJWT, requireRoles(['HR', 'Super Admin']), orgCtrl.createDepartment);
router.get('/org/teams', authenticateJWT, orgCtrl.getTeams);
router.post('/org/teams', authenticateJWT, requireRoles(['HR', 'Super Admin']), orgCtrl.createTeam);
router.post('/org/assignments', authenticateJWT, requireRoles(['HR', 'Super Admin']), orgCtrl.updateAssignments);
router.get('/org/assignments/history/:userId', authenticateJWT, orgCtrl.getAssignmentHistory);

// --- AI Routes ---
router.post('/ai/report-summary', authenticateJWT, aiCtrl.getReportSummary);
router.get('/ai/attendance-insights/:internId', authenticateJWT, aiCtrl.getAttendanceInsights);
router.get('/ai/performance-prediction/:internId', authenticateJWT, aiCtrl.getPerformancePrediction);
router.post('/ai/chat', authenticateJWT, aiCtrl.handleChat);

// --- Announcements & Team Space Routes ---
router.get('/announcements', authenticateJWT, announcementsCtrl.getAnnouncements);
router.post('/announcements', authenticateJWT, announcementsCtrl.createAnnouncement);
router.put('/announcements/:id/react', authenticateJWT, announcementsCtrl.reactToAnnouncement);
router.post('/announcements/:id/comment', authenticateJWT, announcementsCtrl.addComment);

// --- Files Routes ---
router.get('/files', authenticateJWT, filesCtrl.getFiles);
router.post('/files/upload', authenticateJWT, filesCtrl.uploadFile);

// --- Holidays Routes ---
router.get('/holidays', authenticateJWT, holidaysCtrl.getHolidays);
router.post('/holidays', authenticateJWT, requireRoles(['HR', 'Super Admin']), holidaysCtrl.createHoliday);

// --- Calendar Event Routes ---
router.get('/calendar/events', authenticateJWT, calendarCtrl.getEvents);
router.post('/calendar/events', authenticateJWT, requireRoles(['HR', 'Super Admin']), calendarCtrl.createEvent);
router.put('/calendar/events/:id', authenticateJWT, requireRoles(['HR', 'Super Admin']), calendarCtrl.updateEvent);
router.delete('/calendar/events/:id', authenticateJWT, requireRoles(['HR', 'Super Admin']), calendarCtrl.deleteEvent);

module.exports = router;
