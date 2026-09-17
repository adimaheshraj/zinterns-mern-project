const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Settings, AuditLog } = require('../models');
const { sendWelcomeEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_zinterns_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkey_zinterns_2026';

// Register User (HR only)
async function registerUser(req, res) {
  try {
    const {
      firstName,
      lastName,
      name: fullNameInput,
      email,
      role,
      designation,
      department: deptInput,
      team,
      reportingManager,
      mentor,
      phone,
      durationMonths,
      joiningDate,
      internshipStartDate,
      internshipEndDate,
      workMode,
      location,
      gender,
      avatar
    } = req.body;

    const name = fullNameInput || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName);
    const department = role === 'HR' || role === 'Super Admin' ? (deptInput || 'HR Dept.') : deptInput;

    if (!name || !email || !role || (role !== 'HR' && role !== 'Super Admin' && !department)) {
      return res.status(400).json({ error: 'Name, email, role and department are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    let employeeId = '';
    if (role === 'Super Admin') {
      const count = await User.countDocuments({ role: 'Super Admin' });
      employeeId = `SA-${String(count + 1).padStart(4, '0')}`;
    } else if (role === 'HR') {
      const count = await User.countDocuments({ role: 'HR' });
      employeeId = `HR-${String(count + 1).padStart(4, '0')}`;
    } else if (role === 'RM' || role === 'REPORTING_MANAGER') {
      const count = await User.countDocuments({ role: { $in: ['RM', 'REPORTING_MANAGER'] } });
      employeeId = `RM-${101 + count}`;
    } else if (role === 'Mentor' || role === 'MENTOR') {
      const count = await User.countDocuments({ role: { $in: ['Mentor', 'MENTOR'] } });
      employeeId = `MEN-${201 + count}`;
    } else if (role === 'Intern' || role === 'INTERN') {
      const count = await User.countDocuments({ role: { $in: ['Intern', 'INTERN'] } });
      employeeId = `INT-${1001 + count}`;
    } else {
      const count = await User.countDocuments({});
      employeeId = `EMP-${100 + count}`;
    }

    // Standardize role name
    let normalizedRole = role;
    if (role === 'REPORTING_MANAGER') normalizedRole = 'RM';
    if (role === 'MENTOR') normalizedRole = 'Mentor';
    if (role === 'INTERN') normalizedRole = 'Intern';

    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = `${cleanName}${Math.floor(100 + Math.random() * 900)}`;

    const tempPassword = '1234567890@M';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const userGender = gender && ['male', 'female', 'other'].includes(gender) ? gender : 'male';

    const newUser = await User.create({
      employeeId,
      username,
      name,
      email,
      passwordHash,
      role: normalizedRole,
      designation: designation || (normalizedRole === 'Intern' ? 'Intern' : normalizedRole),
      department: department || 'General',
      team: team || 'General',
      reportingManager: reportingManager || '',
      mentor: mentor || '',
      phone: phone || '',
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      internshipStartDate: internshipStartDate ? new Date(internshipStartDate) : new Date(),
      internshipEndDate: internshipEndDate ? new Date(internshipEndDate) : null,
      durationMonths: durationMonths || 6,
      workMode: workMode || 'Office',
      location: location || 'Headquarters',
      gender: userGender,
      avatar: avatar || '',
      status: 'active',
      mustChangePassword: true
    });

    // Write Audit Log
    await AuditLog.create({
      userId: req.user?._id || 'SYSTEM',
      userName: req.user?.name || 'HR Admin',
      action: 'Employee Created',
      targetUser: newUser.employeeId,
      targetUserName: newUser.name,
      newValue: `Role: ${newUser.role}, Dept: ${newUser.department}, Team: ${newUser.team}`,
      details: `Account created for ${newUser.name} (${newUser.employeeId}) with temporary credentials.`,
      ip: req.ip || '127.0.0.1'
    });

    console.log(`✉️ Sending Welcome Email to ${email} (Employee ID: ${employeeId})`);

    // Send credentials directly to employee's email address
    const emailResult = await sendWelcomeEmail({
      email: newUser.email,
      name: newUser.name,
      employeeId: newUser.employeeId,
      username: newUser.username,
      tempPassword,
      role: newUser.role,
      department: newUser.department
    });

    res.status(201).json({
      message: emailResult.success
        ? `Account created successfully! Credentials sent to ${newUser.email}`
        : 'Account created successfully (Email delivery attempted)',
      emailSent: emailResult.success,
      user: {
        _id: newUser._id,
        employeeId: newUser.employeeId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        designation: newUser.designation,
        department: newUser.department,
        team: newUser.team,
        reportingManager: newUser.reportingManager,
        mentor: newUser.mentor,
        gender: newUser.gender,
        avatar: newUser.avatar,
        mustChangePassword: newUser.mustChangePassword
      },
      temporaryCredentials: {
        username,
        password: tempPassword
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error during registration' });
  }
}

// Seed the two initial accounts required by the application.
async function ensureDefaultUsers() {
  try {
    const defaultUsers = [
      {
        employeeId: 'SA-0001',
        username: 'amar',
        name: 'Amar',
        email: 'amar@zinterns.com',
        role: 'Super Admin',
        designation: 'Super Admin',
        department: 'Administration',
        status: 'active',
        mustChangePassword: false
      },
      {
        employeeId: 'HR-0001',
        username: 'Bhavani',
        name: 'Bhavani',
        email: 'bhavani@zinterns.com',
        role: 'HR',
        designation: 'HR Admin',
        department: 'Human Resources',
        status: 'active',
        mustChangePassword: false
      }
    ];

    const defaultPasswordHash = await bcrypt.hash('1234567890@M', 10);

    for (const u of defaultUsers) {
      const existing = await User.findOne({
        $or: [
          { employeeId: u.employeeId },
          { username: u.username },
          { email: u.email }
        ]
      });
      if (!existing) {
        await User.create({
          ...u,
          passwordHash: defaultPasswordHash,
          joiningDate: new Date(),
          internshipStartDate: new Date(),
          workMode: 'Office',
          location: 'Headquarters',
          gender: 'male'
        });
        console.log(`✅ Seeded default user: ${u.username} (${u.role})`);
      } else if (existing.username !== u.username || existing.email !== u.email) {
        await User.updateOne(
          { _id: existing._id },
          {
            $set: {
              ...u,
              passwordHash: defaultPasswordHash,
              joiningDate: existing.joiningDate || new Date(),
              internshipStartDate: existing.internshipStartDate || new Date(),
              workMode: existing.workMode || 'Office',
              location: existing.location || 'Headquarters',
              gender: existing.gender || 'male'
            }
          }
        );
        console.log(`✅ Updated default user: ${u.username} (${u.role})`);
      }
    }
  } catch (err) {
    console.error('Error seeding default users:', err.message);
  }
}

// Login User
async function loginUser(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      await ensureDefaultUsers();
      user = await User.findOne({
        $or: [{ username }, { email: username }]
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact HR.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = {
      _id: user._id,
      employeeId: user.employeeId,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ _id: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        reportingManager: user.reportingManager,
        mentor: user.mentor,
        gender: user.gender || 'male',
        twoFactorEnabled: user.twoFactorEnabled,
        avatar: user.avatar,
        mustChangePassword: !!user.mustChangePassword
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
}

// Change Password
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    const user = await User.findById(req.user?._id || '');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(user._id, {
      passwordHash,
      mustChangePassword: false
    }, { new: true });

    res.json({
      message: 'Password updated successfully',
      user: {
        _id: updatedUser._id,
        employeeId: updatedUser.employeeId,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        reportingManager: updatedUser.reportingManager,
        mentor: updatedUser.mentor,
        gender: updatedUser.gender || 'male',
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        avatar: updatedUser.avatar,
        mustChangePassword: false
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Update Profile (Name, Phone, Gender, Avatar)
async function updateProfile(req, res) {
  try {
    const { name, phone, gender, avatar } = req.body;
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (gender && ['male', 'female', 'other'].includes(gender)) updates.gender = gender;
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        employeeId: updatedUser.employeeId,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        reportingManager: updatedUser.reportingManager,
        mentor: updatedUser.mentor,
        phone: updatedUser.phone,
        gender: updatedUser.gender || 'male',
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        avatar: updatedUser.avatar,
        joiningDate: updatedUser.joiningDate,
        durationMonths: updatedUser.durationMonths
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error updating profile' });
  }
}

// Get Logged-in Profile
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user?._id || '');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        reportingManager: user.reportingManager,
        mentor: user.mentor,
        phone: user.phone,
        gender: user.gender || 'male',
        twoFactorEnabled: user.twoFactorEnabled,
        avatar: user.avatar,
        joiningDate: user.joiningDate,
        durationMonths: user.durationMonths,
        mustChangePassword: !!user.mustChangePassword
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Get Office Settings
async function getSettings(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        officeLat: 12.9716,
        officeLng: 77.5946,
        radiusMeters: 100,
        officeCheckInTime: '09:00',
        officeGraceMinutes: 15,
        mandatoryHours: 9,
        googleMapsApiKey: ''
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Update Office Settings (HR only)
async function updateSettings(req, res) {
  try {
    const { officeLat, officeLng, radiusMeters, officeCheckInTime, officeGraceMinutes, mandatoryHours, googleMapsApiKey } = req.body;
    
    if (radiusMeters !== undefined && radiusMeters > 1000) {
      return res.status(400).json({ error: 'Allowed radius cannot exceed 1000 meters (1 km)' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        officeLat: officeLat || 12.9716,
        officeLng: officeLng || 77.5946,
        radiusMeters: radiusMeters || 100,
        officeCheckInTime: officeCheckInTime || '09:00',
        officeGraceMinutes: officeGraceMinutes || 15,
        mandatoryHours: mandatoryHours || 9,
        googleMapsApiKey: googleMapsApiKey || ''
      });
    } else {
      await Settings.findByIdAndUpdate(settings._id, {
        officeLat,
        officeLng,
        radiusMeters,
        officeCheckInTime,
        officeGraceMinutes,
        mandatoryHours,
        googleMapsApiKey
      });
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  updateProfile,
  getMe,
  getSettings,
  updateSettings,
  ensureDefaultUsers
};
