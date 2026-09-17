require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('./db/connection');
const {
  User,
  Department,
  Attendance,
  DailyReport,
  Task,
  Leave,
  Announcement,
  FileModel,
  Performance,
  Holiday,
  Settings
} = require('./models');

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Attendance.deleteMany({}),
    DailyReport.deleteMany({}),
    Task.deleteMany({}),
    Leave.deleteMany({}),
    Announcement.deleteMany({}),
    FileModel.deleteMany({}),
    Performance.deleteMany({}),
    Holiday.deleteMany({}),
    Settings.deleteMany({})
  ]);
}

async function createBootstrapUser() {
  const required = [
    'BOOTSTRAP_ADMIN_EMPLOYEE_ID',
    'BOOTSTRAP_ADMIN_USERNAME',
    'BOOTSTRAP_ADMIN_NAME',
    'BOOTSTRAP_ADMIN_EMAIL',
    'BOOTSTRAP_ADMIN_PASSWORD',
    'BOOTSTRAP_ADMIN_DEPARTMENT'
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.log('No bootstrap user created. Configure BOOTSTRAP_ADMIN_* environment variables to create one.');
    return;
  }

  await User.create({
    employeeId: process.env.BOOTSTRAP_ADMIN_EMPLOYEE_ID,
    username: process.env.BOOTSTRAP_ADMIN_USERNAME,
    name: process.env.BOOTSTRAP_ADMIN_NAME,
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(process.env.BOOTSTRAP_ADMIN_PASSWORD, 10),
    role: process.env.BOOTSTRAP_ADMIN_ROLE || 'HR',
    department: process.env.BOOTSTRAP_ADMIN_DEPARTMENT,
    status: 'active'
  });
  console.log('Bootstrap user created from environment configuration.');
}

async function seed() {
  console.log('Resetting application data...');
  await connectDB();
  await clearCollections();
  await createBootstrapUser();
  console.log('Application data reset. All business records must be created through the application.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Failed to reset application data:', error);
  process.exit(1);
});