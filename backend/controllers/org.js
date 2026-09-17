const { User, Department, Team, Performance, Attendance, DailyReport, Task, Leave, FileModel, AuditLog, AssignmentHistory } = require('../models');

// Get Unified Dashboard Statistics (For Charts and KPIs)
async function getOrgStats(req, res) {
  try {
    const totalUsers = await User.countDocuments({});
    const activeInterns = await User.countDocuments({ role: 'Intern', status: 'active' });
    const totalRMs = await User.countDocuments({ role: 'RM', status: 'active' });
    const totalMentors = await User.countDocuments({ role: 'Mentor', status: 'active' });

    // Today's attendance count
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(todayStr);
    const endOfDay = new Date(todayStr);
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayAttendance = await Attendance.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const present = todayAttendance.filter(r => ['Present', 'Late', 'WFH', 'Hybrid'].includes(r.status)).length;
    const late = todayAttendance.filter(r => r.status === 'Late').length;
    const wfh = todayAttendance.filter(r => r.status === 'WFH').length;
    const hybrid = todayAttendance.filter(r => r.status === 'Hybrid').length;
    const absent = Math.max(0, activeInterns - present);

    const activeUsers = await User.find({ status: 'active' });
    const departmentCounts = activeUsers.reduce((counts, currentUser) => {
      if (currentUser.department) {
        counts[currentUser.department] = (counts[currentUser.department] || 0) + 1;
      }
      return counts;
    }, {});
    const deptBreakdown = Object.entries(departmentCounts).map(([name, count]) => ({ name, count }));

    const teamCounts = activeUsers.reduce((counts, currentUser) => {
      if (currentUser.team) {
        counts[currentUser.team] = (counts[currentUser.team] || 0) + 1;
      }
      return counts;
    }, {});
    const teamBreakdown = Object.entries(teamCounts).map(([name, count]) => ({ name, count }));

    // Intern performance
    const internFilter = { role: 'Intern', status: 'active' };
    if (req.user?.role === 'RM' || req.user?.role === 'Mentor') {
      internFilter[req.user.role === 'RM' ? 'department' : 'mentor'] = req.user.role === 'RM'
        ? req.user.department
        : req.user.employeeId;
    }
    const interns = await User.find(internFilter);
    const performances = await Performance.find({});
    const reviewedReports = await DailyReport.find({ rating: { $gte: 0 } });
    const perfByIntern = new Map(performances.map((performance) => [performance.internId, performance]));
    const reportRatings = reviewedReports.reduce((ratings, report) => {
      if (!ratings.has(report.internId)) ratings.set(report.internId, []);
      ratings.get(report.internId).push(Number(report.rating));
      return ratings;
    }, new Map());

    const perfDetails = interns.map((intern) => {
      const performance = perfByIntern.get(intern.employeeId);
      const ratings = reportRatings.get(intern.employeeId) || [];
      const reportRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null;
      return {
        name: intern.name,
        rating: performance?.mentorRating ?? reportRating,
        attendance: performance?.attendanceScore ?? null,
        tasks: performance?.projectScore ?? null
      };
    });

    res.json({
      totalEmployees: totalUsers,
      activeInterns,
      reportingManagers: totalRMs,
      mentors: totalMentors,
      presentToday: present,
      absentToday: absent,
      wfhToday: wfh,
      hybridToday: hybrid,
      lateToday: late,
      departmentsBreakdown: deptBreakdown,
      teamsBreakdown: teamBreakdown,
      internPerformance: perfDetails
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Hierarchy Tree
async function getOrgTree(req, res) {
  try {
    const allUsers = await User.find({ status: 'active' });
    
    const hrs = allUsers.filter(u => u.role === 'HR').map(u => ({
      _id: u._id,
      employeeId: u.employeeId,
      name: u.name,
      role: u.role,
      designation: u.designation || u.role,
      department: u.department,
      team: u.team,
      reportingManager: u.reportingManager,
      gender: u.gender || 'male',
      avatar: u.avatar
    }));

    const executives = allUsers.filter(u => u.role === 'Super Admin').map(u => ({
      _id: u._id,
      employeeId: u.employeeId,
      name: u.name,
      role: u.role,
      designation: u.designation || 'Chief Executive Officer',
      department: u.department,
      team: u.team,
      gender: u.gender || 'male',
      avatar: u.avatar
    }));

    const rms = allUsers.filter(u => u.role === 'RM').map(u => ({
      _id: u._id,
      employeeId: u.employeeId,
      name: u.name,
      role: u.role,
      designation: u.designation || 'Reporting Manager',
      department: u.department,
      team: u.team,
      gender: u.gender || 'male',
      avatar: u.avatar
    }));

    const mentors = allUsers.filter(u => u.role === 'Mentor').map(u => ({
      _id: u._id,
      employeeId: u.employeeId,
      name: u.name,
      role: u.role,
      designation: u.designation || 'Mentor',
      department: u.department,
      team: u.team,
      reportingManager: u.reportingManager,
      gender: u.gender || 'male',
      avatar: u.avatar
    }));

    const interns = allUsers.filter(u => u.role === 'Intern').map(u => ({
      _id: u._id,
      employeeId: u.employeeId,
      name: u.name,
      role: u.role,
      designation: u.designation || 'Software Intern',
      department: u.department,
      team: u.team,
      mentor: u.mentor,
      gender: u.gender || 'male',
      avatar: u.avatar
    }));

    // Assemble structure
    const tree = rms.map(rm => {
      const rmMentors = mentors.filter(m => String(m.reportingManager) === String(rm.employeeId) || String(m.reportingManager) === String(rm._id));
      const rmMentorsTree = rmMentors.map(m => {
        const mInterns = interns.filter(i => String(i.mentor) === String(m.employeeId) || String(i.mentor) === String(m._id));
        return {
          ...m,
          directReportsCount: mInterns.length,
          interns: mInterns
        };
      });
      const totalDirectReports = rmMentorsTree.reduce((acc, m) => acc + m.interns.length, 0) + rmMentors.length;
      return {
        ...rm,
        directReportsCount: totalDirectReports,
        mentors: rmMentorsTree
      };
    });

    res.json({
      hrRoots: executives.length > 0 ? executives : hrs,
      hrReports: executives.length > 0 ? hrs.filter(hr => executives.some(executive => String(hr.reportingManager) === String(executive.employeeId) || String(hr.reportingManager) === String(executive._id))) : [],
      tree
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Department Tree with Live Metrics
async function getDepartmentTree(req, res) {
  try {
    const departments = await Department.find();
    const teams = await Team.find();
    const users = await User.find({ status: 'active' });

    const todayStr = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(todayStr);
    const endOfDay = new Date(todayStr);
    endOfDay.setHours(23, 59, 59, 999);
    const todayAttendance = await Attendance.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const activeLeaves = await Leave.find({
      status: 'approved',
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    });

    const smartbridgeDeptNames = [
      'Accounts Dept',
      'Business Development Dept',
      'HR Dept',
      'Marketing Dept.',
      'Operations Dept.',
      'Product Dept',
      'Sales Dept',
      'ServiceNow Dept'
    ];

    const technicalDeptNames = [
      'AI-ML Dept',
      'Full Stack Dept',
      'Salesforce Dept'
    ];

    const processDeptMetrics = (deptName, parentGroup) => {
      const deptUsers = users.filter(u =>
        u.department === deptName ||
        u.team === deptName ||
        (deptName === 'Full Stack Dept' && (u.department === 'Technical' || u.team === 'Full Stack Development')) ||
        (deptName === 'AI-ML Dept' && (u.team === 'AI / ML' || u.department === 'AI / ML')) ||
        (deptName === 'Salesforce Dept' && (u.team === 'Salesforce' || u.department === 'Salesforce')) ||
        (deptName === 'HR Dept' && (u.department === 'HR Dept.' || u.department === 'HR'))
      );

      const teamUserIds = deptUsers.map(u => String(u._id));
      const teamEmpIds = deptUsers.map(u => String(u.employeeId));

      const teamAttendance = todayAttendance.filter(a => teamUserIds.includes(String(a.userId)) || teamEmpIds.includes(String(a.userId)));
      const presentCount = teamAttendance.filter(a => ['Present', 'Late'].includes(a.status)).length;
      const wfhCount = teamAttendance.filter(a => ['WFH', 'Hybrid'].includes(a.status)).length;
      const leaveCount = activeLeaves.filter(l => teamUserIds.includes(String(l.userId)) || teamEmpIds.includes(String(l.userId))).length;
      const absentCount = Math.max(0, deptUsers.length - presentCount - wfhCount - leaveCount);

      const mentors = deptUsers.filter(u => u.role === 'Mentor');
      const interns = deptUsers.filter(u => u.role === 'Intern');
      const rm = deptUsers.find(u => u.role === 'RM') || users.find(u => u.role === 'RM' && (u.department === deptName || parentGroup === 'Technical Dept'));

      return {
        id: deptName,
        name: deptName,
        parent: parentGroup,
        strength: deptUsers.length,
        mentorsCount: mentors.length,
        internsCount: interns.length,
        reportingManager: rm ? rm.name : 'Unassigned',
        presentToday: presentCount,
        wfhToday: wfhCount,
        onLeave: leaveCount,
        absentToday: absentCount,
        mentors,
        interns
      };
    };

    const smartbridgeList = smartbridgeDeptNames.map(d => processDeptMetrics(d, 'Smartbridge'));
    const technicalList = technicalDeptNames.map(d => processDeptMetrics(d, 'Technical Dept'));

    const techTotalStrength = technicalList.reduce((acc, d) => acc + d.strength, 0);
    const smartbridgeTotalStrength = smartbridgeList.reduce((acc, d) => acc + d.strength, 0) + techTotalStrength;

    res.json({
      organization: 'Smartbridge',
      smartbridgeCount: smartbridgeDeptNames.length + 1, // 8 main + Technical Dept
      smartbridgeTotalStrength,
      smartbridgeDepartments: smartbridgeList,
      technicalDeptGroup: {
        name: 'Technical Dept',
        count: technicalDeptNames.length, // 3: AI-ML Dept, Full Stack Dept, Salesforce Dept
        totalStrength: techTotalStrength,
        subDepartments: technicalList
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Employee Directory
async function getDirectory(req, res) {
  try {
    const { search, role, department, team, mentor, reportingManager, workMode, status } = req.query;

    let filter = {};
    if (role && role !== 'All') filter.role = role;
    if (department && department !== 'All') filter.department = department;
    if (team && team !== 'All') filter.team = team;
    if (mentor && mentor !== 'All') filter.mentor = mentor;
    if (reportingManager && reportingManager !== 'All') filter.reportingManager = reportingManager;
    if (workMode && workMode !== 'All') filter.workMode = workMode;
    if (status && status !== 'All') filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    const list = await User.find(filter);
    
    const cleanList = list.map(u => ({
      _id: u._id,
      employeeId: u.employeeId,
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role,
      designation: u.designation || u.role,
      department: u.department,
      team: u.team || 'General',
      reportingManager: u.reportingManager,
      mentor: u.mentor,
      workMode: u.workMode || 'Office',
      location: u.location || 'Headquarters',
      phone: u.phone,
      joiningDate: u.joiningDate,
      internshipStartDate: u.internshipStartDate || u.joiningDate,
      internshipEndDate: u.internshipEndDate,
      durationMonths: u.durationMonths,
      gender: u.gender || 'male',
      avatar: u.avatar,
      status: u.status,
      mustChangePassword: u.mustChangePassword
    }));

    res.json(cleanList);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Comprehensive Employee Profile
async function getEmployeeProfile(req, res) {
  try {
    const { id } = req.params; // ID or employeeId
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    let targetUser = isObjectId ? await User.findById(id) : null;
    if (!targetUser) {
      targetUser = await User.findOne({ employeeId: id });
    }
    if (!targetUser) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const empId = targetUser.employeeId;
    const userId = String(targetUser._id);

    // Fetch related records concurrently
    const [
      userAttendance,
      userReports,
      userTasks,
      userLeaves,
      userFiles,
      userPerformance,
      auditHistory
    ] = await Promise.all([
      Attendance.find({ $or: [{ userId: empId }, { userId: userId }] }),
      DailyReport.find({ internId: empId }),
      Task.find({ $or: [{ assignedTo: empId }, { assignedTo: userId }] }),
      Leave.find({ $or: [{ userId: empId }, { userId: userId }] }),
      FileModel.find({ uploadedBy: empId }),
      Performance.findOne({ internId: empId }),
      AssignmentHistory.find({ userId: empId })
    ]);

    // Calculate attendance percentage
    const presentCount = userAttendance.filter(a => ['Present', 'Late', 'WFH', 'Hybrid'].includes(a.status)).length;
    const attendancePct = userAttendance.length > 0 ? Math.round((presentCount / userAttendance.length) * 100) : 100;

    // Fetch mentor and manager names
    let mentorUser = null;
    let managerUser = null;
    if (targetUser.mentor) {
      mentorUser = await User.findOne({ employeeId: targetUser.mentor });
    }
    if (targetUser.reportingManager) {
      managerUser = await User.findOne({ employeeId: targetUser.reportingManager });
    }

    res.json({
      profile: {
        ...targetUser,
        mentorName: mentorUser ? mentorUser.name : (targetUser.mentor || 'Unassigned'),
        reportingManagerName: managerUser ? managerUser.name : (targetUser.reportingManager || 'Unassigned')
      },
      stats: {
        attendancePercentage: attendancePct,
        completedTasks: userTasks.filter(t => t.status === 'completed').length,
        totalTasks: userTasks.length,
        submittedReports: userReports.length,
        leaveBalance: 12 - userLeaves.filter(l => l.status === 'approved').length
      },
      attendance: userAttendance,
      dailyReports: userReports,
      tasks: userTasks,
      leaves: userLeaves,
      files: userFiles,
      performance: userPerformance || {
        mentorRating: 4.5,
        attendanceScore: attendancePct,
        projectScore: 85,
        learningProgress: 75,
        overallScore: 80
      },
      assignmentHistory: auditHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Manage Account Status (HR only)
async function updateAccountStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const updated = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    await AuditLog.create({
      userId: req.user?._id || 'HR',
      userName: req.user?.name || 'HR Admin',
      action: 'Account Status Updated',
      targetUser: updated.employeeId,
      targetUserName: updated.name,
      newValue: status,
      details: `Account status set to ${status}`
    });

    res.json({ message: `Account status updated to ${status}`, userStatus: updated.status });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Departments
async function getDepartments(req, res) {
  try {
    const list = await Department.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Create Department (HR only)
async function createDepartment(req, res) {
  try {
    const { name, code, description, head } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'Department already exists' });
    }

    const newDept = await Department.create({
      name,
      code: code || name.slice(0, 4).toUpperCase(),
      description: description || '',
      head: head || '',
      reportingManagers: [],
      mentors: [],
      interns: [],
      status: 'active'
    });

    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Teams
async function getTeams(req, res) {
  try {
    const list = await Team.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Create Team (HR only)
async function createTeam(req, res) {
  try {
    const { name, department, description, reportingManager } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Team name and department are required' });
    }

    const newTeam = await Team.create({
      name,
      department,
      reportingManager: reportingManager || '',
      description: description || '',
      mentors: [],
      interns: [],
      status: 'active'
    });

    res.status(201).json(newTeam);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Re-assign Employee (HR only)
async function updateAssignments(req, res) {
  try {
    const { userId, mentor, reportingManager, department, team, role, designation } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID or Employee ID is required' });
    }

    let targetUser = await User.findById(userId);
    if (!targetUser) {
      targetUser = await User.findOne({ employeeId: userId });
    }
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    const changes = [];

    if (mentor !== undefined && mentor !== targetUser.mentor) {
      changes.push({ type: 'mentor', prev: targetUser.mentor, next: mentor });
      updates.mentor = mentor;
    }

    if (reportingManager !== undefined && reportingManager !== targetUser.reportingManager) {
      changes.push({ type: 'manager', prev: targetUser.reportingManager, next: reportingManager });
      updates.reportingManager = reportingManager;
    }

    if (department !== undefined && department !== targetUser.department) {
      changes.push({ type: 'department', prev: targetUser.department, next: department });
      updates.department = department;
    }

    if (team !== undefined && team !== targetUser.team) {
      changes.push({ type: 'team', prev: targetUser.team, next: team });
      updates.team = team;
    }

    if (role !== undefined && role !== targetUser.role) {
      changes.push({ type: 'role', prev: targetUser.role, next: role });
      updates.role = role;
    }

    if (designation !== undefined) updates.designation = designation;

    const updatedUser = await User.findByIdAndUpdate(targetUser._id, updates, { new: true });

    // Write assignment history logs
    for (const change of changes) {
      await AssignmentHistory.create({
        userId: targetUser.employeeId,
        userName: targetUser.name,
        targetType: change.type,
        previousValue: change.prev || 'None',
        newValue: change.next || 'None',
        assignedBy: req.user?.employeeId || 'HR Admin',
        assignedByName: req.user?.name || 'HR'
      });

      await AuditLog.create({
        userId: req.user?._id || 'HR',
        userName: req.user?.name || 'HR',
        action: `${change.type.toUpperCase()} Changed`,
        targetUser: targetUser.employeeId,
        targetUserName: targetUser.name,
        previousValue: change.prev || 'None',
        newValue: change.next || 'None',
        details: `Updated ${change.type} for ${targetUser.name}`
      });
    }

    res.json({
      message: 'Employee assignments updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Assignment History
async function getAssignmentHistory(req, res) {
  try {
    const { userId } = req.params;
    const history = await AssignmentHistory.find({ userId });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getOrgStats,
  getOrgTree,
  getDepartmentTree,
  getDirectory,
  getEmployeeProfile,
  updateAccountStatus,
  getDepartments,
  createDepartment,
  getTeams,
  createTeam,
  updateAssignments,
  getAssignmentHistory
};
