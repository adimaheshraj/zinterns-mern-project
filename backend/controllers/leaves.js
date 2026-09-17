const { Leave, User } = require('../models');

// Apply Leave
async function applyLeave(req, res) {
  try {
    const userId = req.user?.employeeId || '';
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Leave type, start date, end date and reason are required' });
    }

    const leave = await Leave.create({
      userId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Leave applied successfully, awaiting mentor review.',
      leave
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Leaves List
async function getLeaves(req, res) {
  try {
    const { employeeId, role, department, name, _id } = req.user;
    const userIdStr = String(_id);

    let filter = {};
    if (role === 'Intern') {
      filter.userId = employeeId;
    } else if (role === 'Mentor') {
      const interns = await User.find({
        $or: [
          { mentor: employeeId },
          { mentor: userIdStr },
          { mentor: name }
        ]
      });
      const internIds = interns.map(i => i.employeeId).filter(Boolean);
      filter = { userId: { $in: internIds } };
    } else if (role === 'RM') {
      const deptUsers = await User.find({
        $or: [
          { department },
          { reportingManager: employeeId },
          { reportingManager: userIdStr },
          { reportingManager: name }
        ]
      });
      const userIds = deptUsers.map(u => u.employeeId).filter(Boolean);
      filter = { userId: { $in: userIds } };
    } else if (['HR', 'Super Admin'].includes(role)) {
      filter = {};
    } else {
      filter = {};
    }

    const list = (await Leave.find(filter)).sort((left, right) => {
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });

    const enrichedList = [];
    for (const item of list) {
      const applicant = await User.findOne({ employeeId: item.userId });
      const raw = item._doc ? item._doc : item;
      enrichedList.push({
        ...raw,
        applicantName: applicant?.name || item.applicantName || item.userId,
        applicantRole: applicant?.role || 'Intern',
        applicantDept: applicant?.department || 'N/A',
        applicantAvatar: applicant?.avatar || ''
      });
    }

    res.json(enrichedList);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Update Leave Status
async function updateLeaveStatus(req, res) {
  try {
    const { role } = req.user;
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    let finalStatus = leave.status;

    if (role === 'Mentor') {
      if (status === 'approved' || status === 'mentor_approved') {
        finalStatus = 'mentor_approved';
      } else if (status === 'rejected') {
        finalStatus = 'rejected';
      } else {
        return res.status(400).json({ error: 'Invalid status for mentor' });
      }
    } else if (['RM', 'HR', 'Super Admin'].includes(role)) {
      if (status === 'approved' || status === 'rejected') {
        finalStatus = status;
      } else {
        return res.status(400).json({ error: 'Invalid status for manager/HR' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await Leave.findByIdAndUpdate(id, {
      status: finalStatus,
      comments: comments || leave.comments
    }, { new: true });

    res.json({
      message: `Leave request status updated to ${finalStatus}`,
      leave: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  applyLeave,
  getLeaves,
  updateLeaveStatus
};
