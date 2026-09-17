const mongoose = require('mongoose');
const { Schema } = mongoose;
const { getIsMongo } = require('../db/connection');
const FallbackModel = require('../db/fallbackModel');

class ModelWrapper {
  constructor(name, schema) {
    this.mongoModel = mongoose.model(name, schema);
    this.fallbackModel = new FallbackModel(name.toLowerCase());
  }

  async find(filter = {}) {
    if (getIsMongo()) {
      return this.mongoModel.find(filter).lean();
    }
    return this.fallbackModel.find(filter);
  }

  async findOne(filter = {}) {
    if (getIsMongo()) {
      return this.mongoModel.findOne(filter).lean();
    }
    return this.fallbackModel.findOne(filter);
  }

  async findById(id) {
    if (getIsMongo()) {
      return this.mongoModel.findById(id).lean();
    }
    return this.fallbackModel.findById(id);
  }

  async create(doc) {
    if (getIsMongo()) {
      const newDoc = new this.mongoModel(doc);
      const saved = await newDoc.save();
      return saved.toObject();
    } else {
      return this.fallbackModel.create(doc);
    }
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    if (getIsMongo()) {
      return this.mongoModel.findByIdAndUpdate(id, update, options).lean();
    } else {
      return this.fallbackModel.findByIdAndUpdate(id, update, options);
    }
  }

  async updateOne(filter, update, options = {}) {
    if (getIsMongo()) {
      const res = await this.mongoModel.updateOne(filter, update, options);
      return { modifiedCount: res.modifiedCount };
    } else {
      return this.fallbackModel.updateOne(filter, update, options);
    }
  }

  async deleteOne(filter) {
    if (getIsMongo()) {
      const res = await this.mongoModel.deleteOne(filter);
      return { deletedCount: res.deletedCount };
    } else {
      return this.fallbackModel.deleteOne(filter);
    }
  }

  async deleteMany(filter = {}) {
    if (getIsMongo()) {
      const res = await this.mongoModel.deleteMany(filter);
      return { deletedCount: res.deletedCount };
    } else {
      return this.fallbackModel.deleteMany(filter);
    }
  }

  async countDocuments(filter = {}) {
    if (getIsMongo()) {
      return this.mongoModel.countDocuments(filter);
    } else {
      return this.fallbackModel.countDocuments(filter);
    }
  }
}

// 1. User Schema
const UserSchema = new Schema({
  employeeId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Super Admin', 'HR', 'RM', 'Mentor', 'Intern'], required: true },
  designation: { type: String, default: 'Team Member' },
  department: { type: String, required: true },
  team: { type: String, default: 'General' },
  reportingManager: { type: String }, // RM ID
  mentor: { type: String }, // Mentor ID
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  workMode: { type: String, enum: ['Office', 'WFH', 'Hybrid'], default: 'Office' },
  location: { type: String, default: 'Headquarters' },
  phone: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  joiningDate: { type: Date, default: Date.now },
  internshipStartDate: { type: Date, default: Date.now },
  internshipEndDate: { type: Date },
  durationMonths: { type: Number, default: 6 },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  avatar: { type: String },
  mustChangePassword: { type: Boolean, default: false }
}, { timestamps: true });

// 2. Department Schema
const DepartmentSchema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String },
  description: { type: String },
  head: { type: String }, // User ID or Name
  reportingManagers: [{ type: String }],
  mentors: [{ type: String }],
  interns: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// 2b. Team Schema
const TeamSchema = new Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  reportingManager: { type: String },
  mentors: [{ type: String }],
  interns: [{ type: String }],
  description: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// 3. Attendance Schema
const AttendanceSchema = new Schema({
  userId: { type: String, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'WFH', 'Hybrid', 'Half Day', 'Leave', 'Holiday', 'Weekend'], required: true },
  workMode: { type: String, enum: ['Office', 'WFH', 'Hybrid'], default: 'Office' },
  lat: { type: Number },
  lng: { type: Number },
  checkOutLat: { type: Number },
  checkOutLng: { type: Number },
  distance: { type: Number },
  device: { type: String },
  wfhApproved: { type: Boolean, default: false }
}, { timestamps: true });

// 4. Daily Report Schema
const DailyReportSchema = new Schema({
  internId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  tasksToday: { type: String, required: true },
  completedWork: { type: String, required: true },
  pendingWork: { type: String },
  challenges: { type: String },
  tomorrowPlan: { type: String },
  hoursWorked: { type: Number, default: 9 },
  githubLink: { type: String },
  demoLink: { type: String },
  screenshot: { type: String },
  status: { type: String, enum: ['Not Submitted', 'Submitted', 'Reviewed', 'Needs Revision', 'Approved'], default: 'Submitted' },
  rating: { type: Number, min: 0, max: 5 },
  feedback: { type: String },
  reviewedBy: { type: String }
}, { timestamps: true });

// 5. Task Schema
const TaskSchema = new Schema({
  project: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedBy: { type: String, required: true },
  assignedTo: { type: String, required: true },
  deadline: { type: Date, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in_progress', 'review', 'completed'], default: 'todo' },
  progress: { type: Number, default: 0 },
  checklist: [{ text: { type: String }, done: { type: Boolean, default: false } }],
  attachments: [{ name: { type: String }, url: { type: String } }],
  comments: [{ sender: { type: String }, text: { type: String }, timestamp: { type: Date, default: Date.now } }]
}, { timestamps: true });

// 6. Leave Schema
const LeaveSchema = new Schema({
  userId: { type: String, required: true },
  leaveType: { type: String, enum: ['Casual', 'Sick', 'Emergency', 'Comp Off', 'Loss of Pay', 'Half Day'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'mentor_approved', 'approved', 'rejected'], default: 'pending' },
  comments: { type: String }
}, { timestamps: true });

// 6b. WFH Request Schema
const WFHRequestSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  userRole: { type: String },
  department: { type: String },
  team: { type: String },
  date: { type: String, required: true },
  workMode: { type: String, enum: ['WFH', 'Hybrid'], required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: String },
  comments: { type: String }
}, { timestamps: true });

// 7. Announcements & Team Space Schema
const AnnouncementSchema = new Schema({
  department: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedBy: { type: String, required: true },
  type: { type: String, enum: ['announcement', 'discussion', 'mentor_post', 'hr_post'], default: 'announcement' },
  pinned: { type: Boolean, default: false },
  reactions: [{ emoji: { type: String }, users: [{ type: String }] }],
  comments: [{ sender: { type: String }, text: { type: String }, timestamp: { type: Date, default: Date.now } }]
}, { timestamps: true });

// 8. Files Schema
const FileSchema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  type: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  url: { type: String, required: true },
  version: { type: Number, default: 1 },
  history: [{ version: { type: Number }, url: { type: String }, updatedAt: { type: Date, default: Date.now } }]
}, { timestamps: true });

// 9. Performance Schema
const PerformanceSchema = new Schema({
  internId: { type: String, required: true, unique: true },
  mentorRating: { type: Number, default: 4 },
  weeklyRating: { type: Number, default: 4 },
  monthlyRating: { type: Number, default: 4 },
  quarterlyRating: { type: Number, default: 4 },
  skillRating: {
    frontend: { type: Number, default: 0 },
    backend: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    teamwork: { type: Number, default: 0 }
  },
  attendanceScore: { type: Number, default: 100 },
  projectScore: { type: Number, default: 80 },
  learningProgress: { type: Number, default: 50 },
  overallScore: { type: Number, default: 75 }
}, { timestamps: true });

// 10. Holiday Calendar Schema
const HolidaySchema = new Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  type: { type: String, enum: ['Public', 'National', 'Festival', 'Company', 'Department'], required: true },
  recurring: { type: Boolean, default: false },
  departments: [{ type: String }]
}, { timestamps: true });

// 11. Settings Schema
const SettingsSchema = new Schema({
  officeLat: { type: Number, default: 12.9716 },
  officeLng: { type: Number, default: 77.5946 },
  radiusMeters: { type: Number, default: 100 },
  officeCheckInTime: { type: String, default: '09:00' },
  officeGraceMinutes: { type: Number, default: 15 },
  mandatoryHours: { type: Number, default: 9 },
  requireMentorLeaveApproval: { type: Boolean, default: true },
  googleMapsApiKey: { type: String, default: '' }
}, { timestamps: true });

// 12. Audit Log Schema
const AuditLogSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  action: { type: String, required: true },
  targetUser: { type: String },
  targetUserName: { type: String },
  previousValue: { type: String },
  newValue: { type: String },
  details: { type: String },
  ip: { type: String },
  device: { type: String }
}, { timestamps: true });

// 13. Assignment History Schema
const AssignmentHistorySchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  targetType: { type: String, enum: ['mentor', 'manager', 'department', 'team', 'role'], required: true },
  previousValue: { type: String },
  newValue: { type: String },
  assignedBy: { type: String, required: true },
  assignedByName: { type: String }
}, { timestamps: true });

// 14. Calendar Event Schema
const CalendarEventSchema = new Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  type: { type: String, enum: ['event', 'meeting', 'birthday', 'deadline', 'working_day'], default: 'event' },
  description: { type: String, default: '' },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  userId: { type: String, default: '' },
  department: { type: String, default: '' },
  createdBy: { type: String, required: true },
  createdByName: { type: String, default: '' }
}, { timestamps: true });

module.exports = {
  User: new ModelWrapper('User', UserSchema),
  Department: new ModelWrapper('Department', DepartmentSchema),
  Team: new ModelWrapper('Team', TeamSchema),
  Attendance: new ModelWrapper('Attendance', AttendanceSchema),
  DailyReport: new ModelWrapper('DailyReport', DailyReportSchema),
  Task: new ModelWrapper('Task', TaskSchema),
  Leave: new ModelWrapper('Leave', LeaveSchema),
  WFHRequest: new ModelWrapper('WFHRequest', WFHRequestSchema),
  Announcement: new ModelWrapper('Announcement', AnnouncementSchema),
  FileModel: new ModelWrapper('File', FileSchema),
  Performance: new ModelWrapper('Performance', PerformanceSchema),
  Holiday: new ModelWrapper('Holiday', HolidaySchema),
  Settings: new ModelWrapper('Settings', SettingsSchema),
  AuditLog: new ModelWrapper('AuditLog', AuditLogSchema),
  AssignmentHistory: new ModelWrapper('AssignmentHistory', AssignmentHistorySchema),
  CalendarEvent: new ModelWrapper('CalendarEvent', CalendarEventSchema)
};
