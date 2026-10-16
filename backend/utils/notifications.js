const { randomUUID } = require('crypto');
const { sendNotificationEmail } = require('./mailer');

function teamRoom(team) {
  const normalizedTeam = String(team || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '');
  return normalizedTeam ? `team:${normalizedTeam}` : '';
}

async function notifyUsers(req, users, {
  title,
  message,
  subject = title,
  details = [],
  event,
  type = 'info'
}) {
  const uniqueUsers = [...new Map(
    (users || []).filter((user) => user?.employeeId).map((user) => [String(user.employeeId), user])
  ).values()];
  const payload = {
    id: randomUUID(),
    title,
    message,
    type,
    timestamp: new Date().toISOString()
  };
  const io = req.app.get('io');

  if (io) {
    for (const user of uniqueUsers) {
      io.to(String(user.employeeId)).emit('new_notification', payload);
      if (event) io.to(String(user.employeeId)).emit(event, payload);
    }
    if (event !== 'task_assigned') io.emit('organization_updated');
  }

  const emailResult = await sendNotificationEmail({
    recipients: uniqueUsers.map((user) => user.email),
    subject,
    message,
    details
  });

  if (!emailResult.success) {
    console.error(`Unable to email notification "${subject}": ${emailResult.error}`);
  }

  return {
    notificationSent: Boolean(io && uniqueUsers.length),
    emailSent: emailResult.success,
    emailError: emailResult.success ? undefined : emailResult.error,
    emailRecipientCount: emailResult.acceptedCount || 0
  };
}

async function notifyTeam(req, User, team, notification, excludedEmployeeIds = []) {
  const normalizedTeam = String(team || '').trim();
  if (!normalizedTeam) {
    return {
      notificationSent: false,
      emailSent: false,
      emailError: 'No team was assigned.'
    };
  }

  const excluded = new Set(excludedEmployeeIds.map(String));
  let members;
  try {
    members = (await User.find({ team: normalizedTeam, status: 'active' }))
      .filter((member) => !excluded.has(String(member.employeeId)));
  } catch (error) {
    console.error(`Unable to load members for team notification "${normalizedTeam}": ${error.message}`);
    return {
      notificationSent: false,
      emailSent: false,
      emailError: 'Unable to load the team member list.'
    };
  }
  const io = req.app.get('io');
  const room = teamRoom(normalizedTeam);
  const payload = {
    id: randomUUID(),
    title: notification.title,
    message: notification.message,
    type: notification.type || 'info',
    timestamp: new Date().toISOString()
  };

  if (io && room) {
    io.to(room).emit('new_notification', payload);
    io.to(room).emit('team_updated', payload);
    io.emit('organization_updated');
  }

  const emailResult = await sendNotificationEmail({
    recipients: members.map((member) => member.email),
    subject: notification.subject || notification.title,
    message: notification.message,
    details: notification.details || []
  });

  if (!emailResult.success) {
    console.error(`Unable to email team "${normalizedTeam}": ${emailResult.error}`);
  }

  return {
    notificationSent: Boolean(io && room),
    emailSent: emailResult.success,
    emailError: emailResult.success ? undefined : emailResult.error,
    emailRecipientCount: emailResult.acceptedCount || 0
  };
}

module.exports = { notifyUsers, notifyTeam, teamRoom };
