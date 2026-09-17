const { User, Settings } = require('../models');

async function getPublicTelemetry(req, res) {
  try {
    const users = await User.find({ status: 'active' });
    const settings = await Settings.findOne();
    const departments = new Set(users.map(user => user.department).filter(Boolean));

    res.json({
      allocatedUsers: users.length,
      departmentCount: departments.size,
      radiusMeters: settings?.radiusMeters || 100,
      socketIoEnabled: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load platform telemetry' });
  }
}

module.exports = { getPublicTelemetry };