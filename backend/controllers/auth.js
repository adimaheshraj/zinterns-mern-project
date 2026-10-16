const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Settings, AuditLog } = require('../models');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/mailer');
const { notifyTeam, notifyUsers } = require('../utils/notifications');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_zinterns_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkey_zinterns_2026';

function toPublicUserProfile(user) {
  return {
    _id: user._id,
    employeeId: user.employeeId,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    designation: user.designation,
    department: user.department,
    team: user.team,
    reportingManager: user.reportingManager,
    mentor: user.mentor,
    status: user.status,
    workMode: user.workMode,
    location: user.location,
    phone: user.phone,
    gender: user.gender || 'male',
    twoFactorEnabled: user.twoFactorEnabled,
    avatar: user.avatar,
    joiningDate: user.joiningDate,
    internshipStartDate: user.internshipStartDate,
    internshipEndDate: user.internshipEndDate,
    durationMonths: user.durationMonths,
    mustChangePassword: !!user.mustChangePassword,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

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

    let assignedMentor;
    if (normalizedRole === 'Intern' && mentor) {
      assignedMentor = await User.findOne({
        $or: [{ employeeId: mentor }, { _id: mentor }]
      });
      if (!assignedMentor || assignedMentor.role !== 'Mentor' || assignedMentor.status === 'disabled') {
        return res.status(400).json({ error: 'Choose an active mentor before assigning an intern.' });
      }
    }

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

    const requestOrigin = req.headers.origin || (req.protocol && req.get ? `${req.protocol}://${req.get('host')}` : '');
    const appUrl = process.env.PUBLIC_APP_URL || (requestOrigin && !requestOrigin.includes('localhost:5000') ? requestOrigin : 'http://40.192.120.59/');

    // Send credentials directly to employee's email address
    const emailResult = await sendWelcomeEmail({
      email: newUser.email,
      name: newUser.name,
      employeeId: newUser.employeeId,
      username: newUser.username,
      tempPassword,
      role: newUser.role,
      department: newUser.department,
      appUrl
    });

    const teamNotification = await notifyTeam(req, User, newUser.team, {
      title: 'A new teammate has joined',
      subject: `Welcome ${newUser.name} to ${newUser.team}`,
      message: `${newUser.name} has joined the ${newUser.team} team as ${newUser.designation || newUser.role}.`,
      type: 'team',
      details: [
        { label: 'Name', value: newUser.name },
        { label: 'Role', value: newUser.role },
        { label: 'Department', value: newUser.department },
        { label: 'Team', value: newUser.team },
        { label: 'Employee ID', value: newUser.employeeId }
      ]
    }, [newUser.employeeId]);

    let mentorNotification;
    if (newUser.role === 'Intern' && assignedMentor) {
      try {
        mentorNotification = await notifyUsers(req, [assignedMentor, newUser], {
          title: 'New intern assigned',
          message: `${newUser.name} has been assigned to ${assignedMentor.name} as their mentor.`,
          subject: `New intern assigned to you: ${newUser.name}`,
          type: 'team',
          event: 'intern_assigned',
          details: [
            { label: 'Intern', value: newUser.name },
            { label: 'Employee ID', value: newUser.employeeId },
            { label: 'Department', value: newUser.department },
            { label: 'Team', value: newUser.team },
            { label: 'Mentor', value: assignedMentor.name }
          ]
        });
      } catch (notificationError) {
        console.error(`Intern mentor notification failed for ${newUser.employeeId}: ${notificationError.message}`);
        mentorNotification = {
          notificationSent: false,
          emailSent: false,
          emailError: 'The intern was created, but the mentor notification could not be prepared.'
        };
      }
    }

    const emailError = !emailResult.success
      ? emailResult.code === 'EAUTH'
        ? 'Gmail rejected the SMTP login. Use the full Gmail address for SMTP_USER and a Google App Password (without spaces), not the regular account password, for SMTP_PASS.'
        : 'Email delivery failed. Check the backend mailer logs and SMTP settings.'
      : undefined;

    res.status(201).json({
      message: emailResult.success
        ? `Account created successfully. The SMTP server accepted the credentials email for ${newUser.email}.`
        : `Account created successfully, but the credentials email could not be sent to ${newUser.email}. ${emailError}`,
      emailSent: emailResult.success,
      emailError,
      notifications: {
        team: teamNotification,
        mentor: mentorNotification || null
      },
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
      department: user.department,
      team: user.team
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ _id: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: toPublicUserProfile(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
      email: { $regex: `^${escapedEmail}$`, $options: 'i' }
    });

    if (!user) {
      return res.status(404).json({ error: 'No account was found with that email address.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'This account is inactive. Please contact your administrator.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      { $set: { passwordResetToken: hashedToken, passwordResetExpires: expiresAt } }
    );

    const portalUrl = new URL(process.env.PUBLIC_APP_URL || 'http://40.192.120.59/');
    portalUrl.searchParams.set('resetToken', resetToken);
    const emailResult = await sendPasswordResetEmail({ email: user.email, resetUrl: portalUrl.toString() });

    if (!emailResult.success) {
      await User.updateOne(
        { _id: user._id, passwordResetToken: hashedToken },
        { $set: { passwordResetToken: null, passwordResetExpires: null } }
      );
      return res.status(502).json({ error: 'We could not send the reset email. Please try again later.' });
    }

    return res.json({ message: 'Password reset link sent. Check your email.' });
  } catch (error) {
    console.error('Password reset request failed:', error);
    return res.status(500).json({ error: 'Unable to process the password reset request.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (typeof token !== 'string' || !token || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'A valid reset link and a password of at least 8 characters are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken });
    const expiresAt = user?.passwordResetExpires ? new Date(user.passwordResetExpires).getTime() : NaN;
    if (!user || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired. Request a new one.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updateResult = await User.updateOne(
      { _id: user._id, passwordResetToken: hashedToken },
      {
        $set: {
          passwordHash,
          mustChangePassword: false,
          passwordResetToken: null,
          passwordResetExpires: null
        }
      }
    );

    if (updateResult.modifiedCount !== 1) {
      return res.status(400).json({ error: 'This password reset link has already been used. Request a new one.' });
    }

    return res.json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (error) {
    console.error('Password reset failed:', error);
    return res.status(500).json({ error: 'Unable to reset the password.' });
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
      user: toPublicUserProfile(updatedUser)
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
      user: toPublicUserProfile(updatedUser)
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
      user: toPublicUserProfile(user)
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
  requestPasswordReset,
  resetPassword,
  changePassword,
  updateProfile,
  getMe,
  getSettings,
  updateSettings,
  ensureDefaultUsers
};
