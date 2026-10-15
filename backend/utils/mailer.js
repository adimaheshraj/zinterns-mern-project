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
    const missing = [!host && 'SMTP_HOST', !user && 'SMTP_USER', !pass && 'SMTP_PASS'].filter(Boolean).join(', ');
    console.error(`❌ SMTP configuration is incomplete. Missing: ${missing}`);
    console.error('   → Set these variables in backend/.env and restart the server.');
    throw new Error(`SMTP configuration is incomplete. Set ${missing} in backend/.env.`);
  }

  // Always strip spaces — Gmail App Passwords are displayed with spaces but must be sent without
  const smtpPassword = pass.replace(/\s/g, '');

  console.log(`📧 Creating SMTP transporter: host=${host} port=${port} secure=${secure} user=${user}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: user.trim(), pass: smtpPassword },
    tls: {
      // Accept self-signed certs in dev; Gmail has valid certs anyway
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified. Real email delivery is ENABLED.');
    console.log(`   host=${host} port=${port} user=${user}`);
  } catch (error) {
    // Do NOT cache a broken transporter
    console.error(`❌ SMTP connection verification FAILED.`);
    console.error(`   code=${error.code || 'unknown'}`);
    console.error(`   message=${error.message}`);
    console.error(`   response=${error.response || 'none'}`);
    if (error.code === 'EAUTH') {
      console.error('');
      console.error('🔑 FIX: Gmail rejected the login.');
      console.error('   1. SMTP_USER must be your full Gmail address (e.g. you@gmail.com)');
      console.error('   2. SMTP_PASS must be a 16-char Google App Password (no spaces).');
      console.error('      Generate one at: https://myaccount.google.com/apppasswords');
      console.error('      Example: qqbvkukazmxhkvps  ← no spaces!');
      console.error('   3. 2-Step Verification must be ON for your Google account.');
      console.error('');
    }
    throw error; // let the caller handle it; cache remains null
  }

  cachedTransporter = transporter;
  return cachedTransporter;
}

/**
 * Send Welcome & Account Credentials Email
 */
async function sendWelcomeEmail({ email, name, employeeId, username, tempPassword, role, department, appUrl }) {
  try {
    if (!email || !String(email).trim()) {
      throw new Error('A recipient email address is required.');
    }

    const recipient = String(email).trim();
    console.log(`\n📨 Sending welcome email → ${recipient} (${employeeId})`);

    const transporter = await getTransporter();
    const portalUrl = appUrl || process.env.PUBLIC_APP_URL || 'http://40.192.120.59/';

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
      to: recipient,
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
    const accepted = info.accepted || [];
    const rejected = info.rejected || [];
    const recipientAccepted = accepted.some(
      (address) => String(address).toLowerCase() === recipient.toLowerCase()
    );

    if (!recipientAccepted || rejected.some(
      (address) => String(address).toLowerCase() === recipient.toLowerCase()
    )) {
      throw new Error(`SMTP server did not accept the recipient ${recipient}.`);
    }

    console.log('✅ Email successfully accepted by SMTP server.');
    console.log(`   recipient=${recipient}`);
    console.log(`   messageId=${info.messageId || 'not provided'}`);
    console.log(`   accepted=${JSON.stringify(accepted)}`);
    console.log(`   rejected=${JSON.stringify(rejected)}`);
    console.log(`   response=${info.response || 'not provided'}`);

    return {
      success: true,
      messageId: info.messageId,
      accepted,
      rejected,
      response: info.response || ''
    };
  } catch (error) {
    console.error(`\n❌ Email delivery FAILED for ${email || 'unknown recipient'}`);
    console.error(`   code=${error.code || 'unknown'}`);
    console.error(`   responseCode=${error.responseCode || 'unknown'}`);
    console.error(`   message=${error.message}`);
    console.error(`   response=${error.response || 'not provided'}`);

    if (error.code === 'EAUTH') {
      console.error('');
      console.error('🔑 GMAIL AUTHENTICATION ERROR — How to fix:');
      console.error('   1. Make sure SMTP_USER is your full Gmail address.');
      console.error('   2. Generate a 16-char App Password at https://myaccount.google.com/apppasswords');
      console.error('   3. Set SMTP_PASS=<16chars_no_spaces> in backend/.env');
      console.error('   4. Restart the backend server.');
    } else if (error.code === 'ECONNECTION' || error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('🌐 SMTP CONNECTION ERROR — How to fix:');
      console.error('   • Check SMTP_HOST and SMTP_PORT in backend/.env');
      console.error('   • For Gmail use: SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_SECURE=false');
    }

    // Clear cache so next request tries a fresh transporter
    cachedTransporter = null;

    return { success: false, error: error.message, code: error.code || 'UNKNOWN' };
  }
}

module.exports = {
  sendWelcomeEmail
};
