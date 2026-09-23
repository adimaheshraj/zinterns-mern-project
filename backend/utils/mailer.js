const nodemailer = require('nodemailer');

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || (port === 465)).toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in backend/.env.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  console.log(`📧 SMTP configured: host=${host} port=${port} secure=${secure} user=${user}`);
  try {
    await transporter.verify();
    console.log('📧 SMTP connection verified. Real email delivery is enabled.');
  } catch (error) {
    console.error(`❌ SMTP connection verification failed: ${error.message}`);
    throw error;
  }

  cachedTransporter = transporter;
  return cachedTransporter;
}

/**
 * Send Welcome & Account Credentials Email
 */
async function sendWelcomeEmail({ email, name, employeeId, username, tempPassword, role, department, appUrl }) {
  try {
    const transporter = await getTransporter();
    const portalUrl = appUrl || process.env.PUBLIC_APP_URL || 'http://40.192.120.59:3000';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 12px 24px; border-radius: 12px; color: white; font-weight: 900; font-size: 20px; letter-spacing: 1px;">
            ZInterns Enterprise Management
          </div>
        </div>

        <div style="background: white; padding: 28px; border-radius: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 22px;">Welcome to ZInterns, ${name}!</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Your account has been created successfully. Below are your account login credentials and assignment details.
          </p>

          <div style="background-color: #f1f5f9; padding: 18px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #6366f1;">
            <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Website Link:</strong> <a href="${portalUrl}" style="color: #4f46e5; font-weight: bold; word-break: break-all;">${portalUrl}</a></p>
            <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Employee ID:</strong> <span style="font-family: monospace; color: #4f46e5; font-weight: bold;">${employeeId}</span></p>
            <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Registered Email:</strong> ${email}</p>
            <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Username:</strong> <span style="font-family: monospace; font-weight: bold;">${username}</span></p>
            <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e0e7ff; padding: 2px 8px; border-radius: 4px; color: #3730a3; font-weight: bold;">${tempPassword}</span></p>
            <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Assigned Role:</strong> ${role}</p>
            <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Department:</strong> ${department || 'General'}</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${portalUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700;">Open ZInterns Portal</a>
            <p style="color: #64748b; font-size: 12px; margin: 10px 0 0; word-break: break-all;"><a href="${portalUrl}" style="color: #4f46e5; text-decoration: underline;">${portalUrl}</a></p>
          </div>

          <div style="background-color: #fff7ed; padding: 16px; border-radius: 12px; border: 1px solid #ffedd5; color: #c2410c; font-size: 13px; margin-bottom: 20px; line-height: 1.5;">
            🔒 <strong>MANDATORY FIRST-TIME SECURITY STEP:</strong><br />
            When you log in with these temporary credentials for the first time, you will be automatically prompted to <strong>Change Your Password</strong> before accessing your workspace dashboard.
          </div>

          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
            If you have any questions, please contact your HR Administrator.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
          © 2026 ZInterns Enterprise Platform. All rights reserved.
        </div>
      </div>
    `;

    const senderEmail = process.env.SMTP_USER || 'noreply@zinterns.com';
    const mailOptions = {
      from: process.env.SMTP_FROM || `"ZInterns HR Team" <${senderEmail}>`,
      to: email,
      subject: `Welcome to ZInterns - Your Account Credentials (${employeeId})`,
      html: htmlContent,
      text: [
        `Welcome to ZInterns, ${name}!`,
        '',
        'Your account has been created successfully. Below are your account login credentials and portal details:',
        `Website Link: ${portalUrl}`,
        `Employee ID: ${employeeId}`,
        `Registered Email: ${email}`,
        `Username: ${username}`,
        `Temporary Password: ${tempPassword}`,
        `Assigned Role: ${role}`,
        `Department: ${department || 'General'}`,
        '',
        `Open the ZInterns Portal: ${portalUrl}`,
        '',
        'You must change your temporary password after your first login.'
      ].join('\n')
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✉️ SMTP delivery accepted by server.');
    console.log(`   recipient=${email}`);
    console.log(`   messageId=${info.messageId || 'not provided'}`);
    console.log(`   envelope=${JSON.stringify(info.envelope || {})}`);
    console.log(`   accepted=${JSON.stringify(info.accepted || [])}`);
    console.log(`   rejected=${JSON.stringify(info.rejected || [])}`);
    console.log(`   response=${info.response || 'not provided'}`);

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      response: info.response || ''
    };
  } catch (error) {
    console.error(`❌ SMTP delivery failed for ${email}: ${error.message}`);
    console.error(`   code=${error.code || 'unknown'} responseCode=${error.responseCode || 'unknown'}`);
    console.error(`   response=${error.response || 'not provided'}`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendWelcomeEmail
};
