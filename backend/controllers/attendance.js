const { Attendance, Leave, Settings, User, WFHRequest, AuditLog } = require('../models');

// Helper to calculate Haversine distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const R = 6371e3; // earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getTodayRange() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);
  return { $gte: startOfDay, $lte: endOfDay };
}

// Check-in with Backend Geofence & WFH Validation
async function checkIn(req, res) {
  try {
    if (req.user?.role === 'Super Admin') {
      return res.status(400).json({ error: 'Check-in is disabled for Super Admin role.' });
    }

    const userId = req.user?.employeeId || '';
    const { lat, lng, device, workMode: requestedWorkMode } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'GPS coordinates (lat, lng) are required for check-in' });
    }

    const userIds = [req.user.employeeId, String(req.user._id)].filter(Boolean);
    const existing = await Attendance.findOne({
      userId: { $in: userIds },
      checkIn: getTodayRange()
    });

    if (existing) {
      if (existing.checkOut) {
        return res.status(400).json({
          error: 'Check-in Blocked: You have already completed your check-in and check-out for today. Multiple check-ins per day are not allowed.'
        });
      }
      return res.status(400).json({ error: 'Already checked in for today.' });
    }

    let config = await Settings.findOne();
    if (!config) {
      config = { officeLat: 12.9716, officeLng: 77.5946, radiusMeters: 100, officeCheckInTime: '09:00', officeGraceMinutes: 15, mandatoryHours: 9 };
    }

    const distance = getDistance(Number(lat), Number(lng), config.officeLat, config.officeLng);
    const radiusMeters = config.radiusMeters || 100;

    const todayStr = new Date().toISOString().split('T')[0];

    // Check for approved WFH/Hybrid pass in WFHRequest model
    const approvedWfhPass = await WFHRequest.findOne({
      userId,
      date: todayStr,
      status: 'approved'
    });

    const isRemoteRequested = requestedWorkMode === 'WFH' || requestedWorkMode === 'Hybrid';

    // Enforcement: If checking in as Office, check geofence distance
    if (!isRemoteRequested && !approvedWfhPass) {
      if (distance > radiusMeters) {
        return res.status(400).json({
          error: `Check-in Not Allowed: You are ${Math.round(distance)} meters from office. You must be within ${radiusMeters} meters of company location.`,
          distance: Math.round(distance),
          allowedRadius: radiusMeters
        });
      }
    }

    // Enforcement: If remote check-in is requested, verify approval
    if (isRemoteRequested && !approvedWfhPass) {
      return res.status(403).json({
        error: 'Remote check-in is not authorized. Please obtain Reporting Manager approval for WFH/Hybrid pass first.'
      });
    }

    const selectedWorkMode = approvedWfhPass ? approvedWfhPass.workMode : (requestedWorkMode || 'Office');

    const now = new Date();
    const [targetHour, targetMin] = config.officeCheckInTime.split(':').map(Number);
    const graceTime = new Date();
    graceTime.setHours(targetHour, targetMin + (config.officeGraceMinutes || 15), 0, 0);

    let status = 'Present';
    if (selectedWorkMode === 'WFH' || selectedWorkMode === 'Hybrid') {
      status = selectedWorkMode;
    } else if (now > graceTime) {
      status = 'Late';
    }

    const attendance = await Attendance.create({
      userId,
      checkIn: now,
      status,
      workMode: selectedWorkMode,
      lat: Number(lat),
      lng: Number(lng),
      distance: Math.round(distance),
      device: device || 'Web Browser',
      wfhApproved: !!approvedWfhPass
    });

    res.status(201).json({
      message: 'Check-in successful',
      attendance,
      distance: Math.round(distance)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error during check-in' });
  }
}

// Check-out
async function checkOut(req, res) {
  try {
    if (req.user?.role === 'Super Admin') {
      return res.status(400).json({ error: 'Check-out is disabled for Super Admin role.' });
    }

    const userId = req.user?.employeeId || '';
    const { lat, lng } = req.body || {};

    const attendance = await Attendance.findOne({
      userId,
      checkIn: getTodayRange()
    });

    if (!attendance) {
      return res.status(400).json({ error: 'No check-in record found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out for today' });
    }

    const now = new Date();
    const checkInTime = new Date(attendance.checkIn);
    const diffMs = now.getTime() - checkInTime.getTime();
    const hoursWorked = diffMs / (1000 * 60 * 60);

    let finalStatus = attendance.status;
    if (hoursWorked < 5 && attendance.status !== 'WFH' && attendance.status !== 'Hybrid') {
      finalStatus = 'Half Day';
    }

    const updates = {
      checkOut: now,
      status: finalStatus
    };
    if (lat !== undefined && lng !== undefined) {
      updates.checkOutLat = Number(lat);
      updates.checkOutLng = Number(lng);
    } else {
      updates.checkOutLat = attendance.lat;
      updates.checkOutLng = attendance.lng;
    }

    const updated = await Attendance.findByIdAndUpdate(attendance._id, updates, { new: true });

    res.json({
      message: 'Check-out successful',
      attendance: updated,
      hoursWorked: parseFloat(hoursWorked.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error during check-out' });
  }
}

// Apply for WFH/Hybrid Remote Pass
async function createWFHRequest(req, res) {
  try {
    if (req.user?.role !== 'Intern') {
      return res.status(403).json({ error: 'Only interns can submit WFH requests.' });
    }

    const { date, workMode, reason } = req.body;
    if (!date || !reason) {
      return res.status(400).json({ error: 'Date and reason are required for WFH request' });
    }

    const currentUser = await User.findOne({ employeeId: req.user.employeeId });

    const newRequest = await WFHRequest.create({
      userId: req.user.employeeId,
      userName: req.user.name,
      userRole: req.user.role,
      department: currentUser?.department || 'General',
      team: currentUser?.team || 'General',
      date,
      workMode: workMode || 'WFH',
      reason,
      status: 'pending'
    });

    res.status(201).json({ message: 'WFH request submitted successfully', request: newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get WFH Requests
async function getWFHRequests(req, res) {
  try {
    const userRole = req.user.role;
    let filter = {};

    if (userRole === 'Intern') {
      filter.userId = req.user.employeeId;
    } else if (userRole === 'RM') {
      const rmIdStr = String(req.user._id);
      const rmEmpId = req.user.employeeId;
      const rmName = req.user.name;
      const rmDept = req.user.department;

      const teamInterns = await User.find({
        $or: [
          { reportingManager: rmEmpId },
          { reportingManager: rmIdStr },
          { reportingManager: rmName },
          { department: rmDept }
        ]
      });
      const internIds = teamInterns.map(i => i.employeeId).filter(Boolean);
      filter.userId = { $in: internIds };
    } else if (userRole === 'Mentor') {
      const mentorIdStr = String(req.user._id);
      const mentorEmpId = req.user.employeeId;
      const mentorName = req.user.name;

      const assignedInterns = await User.find({
        $or: [
          { mentor: mentorEmpId },
          { mentor: mentorIdStr },
          { mentor: mentorName }
        ]
      });
      filter.userId = { $in: assignedInterns.map(i => i.employeeId).filter(Boolean) };
    } else if (['HR', 'Super Admin'].includes(userRole)) {
      filter = {};
    } else {
      filter = {};
    }

    const requests = (await WFHRequest.find(filter)).sort((left, right) => {
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });

    const enriched = [];
    for (const item of requests) {
      const applicant = await User.findOne({ employeeId: item.userId });
      enriched.push({
        ...(item._doc ? item._doc : item),
        userName: item.userName || applicant?.name || item.userId,
        department: item.department || applicant?.department || 'N/A',
        userRole: item.userRole || applicant?.role || 'Intern',
        applicantAvatar: applicant?.avatar || ''
      });
    }

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Approve / Reject WFH Request
async function reviewWFHRequest(req, res) {
  try {
    const userRole = req.user?.role;
    if (!['RM', 'HR', 'Super Admin', 'Mentor'].includes(userRole)) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to review WFH requests.' });
    }

    const { id } = req.params;
    const { status, comments } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved or rejected) is required' });
    }

    const request = await WFHRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'WFH Request not found' });
    }

    const updated = await WFHRequest.findByIdAndUpdate(id, {
      status,
      approvedBy: req.user.name,
      comments: comments || ''
    }, { new: true });

    if (!updated) {
      return res.status(404).json({ error: 'WFH Request not found' });
    }

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      action: `WFH ${status.toUpperCase()}`,
      targetUser: updated.userId,
      targetUserName: updated.userName,
      newValue: status,
      details: `WFH pass for ${updated.date} set to ${status}`
    });

    res.json({ message: `WFH Pass ${status}`, request: updated });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Today's Status
async function getTodayStatus(req, res) {
  try {
    const userId = req.user?.employeeId || '';

    const attendance = await Attendance.findOne({
      userId,
      checkIn: getTodayRange()
    });

    res.json({ attendance: attendance || null });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Attendance History & All Employee Tracks
async function getHistory(req, res) {
  try {
    const isExecutive = ['Super Admin', 'HR', 'RM'].includes(req.user?.role);
    const fetchAll = req.query.all === 'true' || (isExecutive && !req.query.userId);

    if (!fetchAll && req.query.userId && req.query.userId !== req.user?.employeeId && req.user?.role === 'Intern') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let filter = {};
    if (!fetchAll) {
      filter.userId = req.query.userId || req.user?.employeeId || '';
    }

    const list = await Attendance.find(filter);
    const allUsers = await User.find({});
    const userMap = {};
    allUsers.forEach(u => {
      userMap[u.employeeId] = u;
    });

    const enriched = list.map(record => {
      const u = userMap[record.userId] || {};
      const checkInDate = record.checkIn ? new Date(record.checkIn) : null;
      const checkOutDate = record.checkOut ? new Date(record.checkOut) : null;
      let hoursWorked = 0;
      if (checkInDate && checkOutDate) {
        hoursWorked = parseFloat(((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(2));
      } else if (checkInDate) {
        hoursWorked = parseFloat(((new Date().getTime() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(2));
      }

      return {
        ...record,
        userName: u.name || record.userId,
        userRole: u.role || 'Employee',
        userDepartment: u.department || 'N/A',
        userEmail: u.email || '',
        userAvatar: u.avatar || '',
        workMode: record.workMode || (record.status === 'WFH' ? 'WFH' : 'Office'),
        hoursWorked: record.checkOut ? hoursWorked : (checkInDate ? hoursWorked : 0)
      };
    });

    const sorted = enriched.sort((a, b) => {
      return new Date(b.createdAt || b.checkIn).getTime() - new Date(a.createdAt || a.checkIn).getTime();
    });

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Department Attendance Stats
async function getDepartmentStats(req, res) {
  try {
    if (req.user?.role === 'Intern') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(todayStr);
    const endOfDay = new Date(todayStr);
    endOfDay.setHours(23, 59, 59, 999);

    const todayRecords = await Attendance.find({
      checkIn: { $gte: startOfDay, $lte: endOfDay }
    });

    const present = todayRecords.filter(r => ['Present', 'Late', 'WFH', 'Hybrid'].includes(r.status)).length;
    const absent = todayRecords.filter(r => r.status === 'Absent').length;
    const wfh = todayRecords.filter(r => r.status === 'WFH').length;
    const hybrid = todayRecords.filter(r => r.status === 'Hybrid').length;
    const late = todayRecords.filter(r => r.status === 'Late').length;

    res.json({
      totalToday: todayRecords.length,
      present,
      absent,
      wfh,
      hybrid,
      late
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  checkIn,
  checkOut,
  createWFHRequest,
  getWFHRequests,
  reviewWFHRequest,
  getTodayStatus,
  getHistory,
  getDepartmentStats
};
