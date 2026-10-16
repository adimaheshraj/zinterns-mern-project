const { Holiday } = require('../models');

const defaultGovernmentHolidays = [
  { name: "New Year's Day", date: '2026-01-01', type: 'National', recurring: true },
  { name: 'Republic Day', date: '2026-01-26', type: 'National', recurring: true },
  { name: 'Maha Shivratri', date: '2026-02-15', type: 'Festival', recurring: false },
  { name: 'Holi', date: '2026-03-04', type: 'Festival', recurring: false },
  { name: 'Eid ul-Fitr', date: '2026-03-20', type: 'Public', recurring: false },
  { name: 'Good Friday', date: '2026-04-03', type: 'Public', recurring: false },
  { name: 'Ambedkar Jayanti', date: '2026-04-14', type: 'National', recurring: true },
  { name: 'May Day / Labour Day', date: '2026-05-01', type: 'National', recurring: true },
  { name: 'Independence Day', date: '2026-08-15', type: 'National', recurring: true },
  { name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'Festival', recurring: false },
  { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02', type: 'National', recurring: true },
  { name: 'Dussehra / Vijayadashami', date: '2026-10-20', type: 'Festival', recurring: false },
  { name: 'Diwali / Deepavali', date: '2026-11-08', type: 'Festival', recurring: false },
  { name: 'Christmas Day', date: '2026-12-25', type: 'Public', recurring: true }
];

function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Get Holiday Calendar
async function getHolidays(req, res) {
  try {
    let count = await Holiday.countDocuments();
    if (count === 0) {
      await Promise.all(defaultGovernmentHolidays.map((holiday) => Holiday.create(holiday)));
    }
    const list = await Holiday.find().sort({ date: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Create Holiday (HR / Admin only)
async function createHoliday(req, res) {
  try {
    const { name, date, type, recurring, departments, description } = req.body;

    const validTypes = ['Public', 'National', 'Festival', 'Company', 'Department'];
    if (!name?.trim() || !isValidDateString(date) || !validTypes.includes(type)) {
      return res.status(400).json({ error: 'A holiday name, valid date, and valid holiday type are required.' });
    }

    const holiday = await Holiday.create({
      name: name.trim(),
      date,
      type,
      recurring: recurring === true,
      description: description || '',
      departments: Array.isArray(departments) ? departments : []
    });

    req.app.get('io')?.emit('holiday_updated', { action: 'created', holiday });
    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getHolidays,
  createHoliday
};
