const { CalendarEvent } = require('../models');

const ADMIN_ROLES = ['HR', 'Super Admin'];
const EVENT_TYPES = ['event', 'meeting', 'birthday', 'deadline', 'working_day'];

function canManageCalendar(user) {
  return ADMIN_ROLES.includes(user?.role);
}

async function getEvents(req, res) {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month && year) {
      const monthValue = String(month).padStart(2, '0');
      filter.date = { $regex: `^${year}-${monthValue}-` };
    }

    if (!canManageCalendar(req.user)) {
      filter.$or = [
        { userId: '' },
        { userId: req.user.employeeId },
        ...(req.user.department ? [{ department: req.user.department }] : [])
      ];
    }

    res.json(await CalendarEvent.find(filter));
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

async function createEvent(req, res) {
  try {
    if (!canManageCalendar(req.user)) {
      return res.status(403).json({ error: 'Only HR or Super Admin can manage calendar events.' });
    }

    const { title, date, type, description, startTime, endTime, userId, department } = req.body;
    if (!title || !date || !type || !EVENT_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Title, date and a valid event type are required.' });
    }

    const event = await CalendarEvent.create({
      title,
      date,
      type,
      description: description || '',
      startTime: startTime || '',
      endTime: endTime || '',
      userId: userId || '',
      department: department || '',
      createdBy: req.user.employeeId || String(req.user._id),
      createdByName: req.user.name || ''
    });
    req.app.get('io')?.emit('calendar_updated', { action: 'created', event });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

async function updateEvent(req, res) {
  try {
    if (!canManageCalendar(req.user)) {
      return res.status(403).json({ error: 'Only HR or Super Admin can manage calendar events.' });
    }
    const updated = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Calendar event not found.' });
    req.app.get('io')?.emit('calendar_updated', { action: 'updated', event: updated });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

async function deleteEvent(req, res) {
  try {
    if (!canManageCalendar(req.user)) {
      return res.status(403).json({ error: 'Only HR or Super Admin can manage calendar events.' });
    }
    const result = await CalendarEvent.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ error: 'Calendar event not found.' });
    req.app.get('io')?.emit('calendar_updated', { action: 'deleted', eventId: req.params.id });
    res.json({ message: 'Calendar event deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };