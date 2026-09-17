const { Holiday } = require('../models');

const defaultGovernmentHolidays = [
  { name: "New Year's Day", date: '2026-01-01', type: 'National', recurring: true },
  { name: 'Republic Day', date: '2026-01-26', type: 'Gazetted', recurring: true },
  { name: 'Maha Shivratri', date: '2026-02-15', type: 'Gazetted', recurring: false },
  { name: 'Holi', date: '2026-03-04', type: 'Gazetted', recurring: false },
  { name: 'Eid ul-Fitr', date: '2026-03-20', type: 'Gazetted', recurring: false },
  { name: 'Good Friday', date: '2026-04-03', type: 'Gazetted', recurring: false },
  { name: 'Ambedkar Jayanti', date: '2026-04-14', type: 'Gazetted', recurring: true },
  { name: 'May Day / Labour Day', date: '2026-05-01', type: 'National', recurring: true },
  { name: 'Independence Day', date: '2026-08-15', type: 'Gazetted', recurring: true },
  { name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'Gazetted', recurring: false },
  { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02', type: 'Gazetted', recurring: true },
  { name: 'Dussehra / Vijayadashami', date: '2026-10-20', type: 'Gazetted', recurring: false },
  { name: 'Diwali / Deepavali', date: '2026-11-08', type: 'Gazetted', recurring: false },
  { name: 'Christmas Day', date: '2026-12-25', type: 'Gazetted', recurring: true }
];

// Get Holiday Calendar
async function getHolidays(req, res) {
  try {
    let count = await Holiday.countDocuments();
    if (count === 0) {
      await Holiday.insertMany(defaultGovernmentHolidays);
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

    if (!name || !date || !type) {
      return res.status(400).json({ error: 'Name, date and type are required' });
    }

    const holiday = await Holiday.create({
      name,
      date,
      type,
      recurring: recurring === true,
      description: description || '',
      departments: departments || []
    });

    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getHolidays,
  createHoliday
};
