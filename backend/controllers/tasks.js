const { Task, User } = require('../models');

// Get Tasks
async function getTasks(req, res) {
  try {
    const { employeeId, role, department } = req.user;

    let filter = {};
    if (role === 'Intern') {
      filter.assignedTo = employeeId;
    } else if (role === 'Mentor') {
      const interns = await User.find({ mentor: employeeId });
      const internIds = interns.map(i => i.employeeId);
      filter = {
        $or: [
          { assignedBy: employeeId },
          { assignedTo: { $in: internIds } }
        ]
      };
    } else if (role === 'RM') {
      const deptUsers = await User.find({ department });
      const userIds = deptUsers.map(u => u.employeeId);
      filter = {
        $or: [
          { assignedBy: employeeId },
          { assignedTo: { $in: userIds } }
        ]
      };
    }

    const { assignedTo, status } = req.query;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;

    const list = await Task.find(filter);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Create Task
async function createTask(req, res) {
  try {
    const { employeeId, role } = req.user;

    if (role === 'Intern') {
      return res.status(403).json({ error: 'Interns cannot assign tasks' });
    }

    if (role === 'HR') {
      return res.status(403).json({ error: 'HR cannot assign tasks' });
    }


    const { project, title, description, assignedTo, deadline, priority, checklist } = req.body;

    if (!project || !title || !assignedTo || !deadline) {
      return res.status(400).json({ error: 'Project, title, assignedTo and deadline are required' });
    }

    const assignee = await User.findOne({ employeeId: assignedTo });
    if (!assignee) {
      return res.status(404).json({ error: 'Assignee not found' });
    }

    const task = await Task.create({
      project,
      title,
      description,
      assignedBy: employeeId,
      assignedTo,
      deadline: new Date(deadline),
      priority: priority || 'medium',
      status: 'todo',
      progress: 0,
      checklist: checklist || [],
      attachments: [],
      comments: []
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Update Task
async function updateTask(req, res) {
  try {
    const { role } = req.user;
    const { id } = req.params;
    const { status, progress, checklist, title, description, deadline, priority } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (progress !== undefined) updates.progress = progress;
    if (checklist !== undefined) updates.checklist = checklist;

    if (role !== 'Intern') {
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (deadline !== undefined) updates.deadline = new Date(deadline);
      if (priority !== undefined) updates.priority = priority;
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Add Comment
async function addTaskComment(req, res) {
  try {
    const { name } = req.user;
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comment = { sender: name, text, timestamp: new Date() };
    const comments = [...(task.comments || []), comment];

    const updatedTask = await Task.findByIdAndUpdate(id, { comments }, { new: true });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getTasks,
  createTask,
  updateTask,
  addTaskComment
};
