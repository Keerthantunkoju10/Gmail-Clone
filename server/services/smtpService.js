const nodemailer = require('nodemailer');

function createTransporter(email, appPassword) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS
    auth: {
      user: email,
      pass: appPassword,
    },
  });
}

/**
 * Send an email through the specified account's Gmail SMTP
 */
async function sendEmail(account, options) {
  const { to, cc, bcc, subject, text, html, attachments, inReplyTo, references } = options;

  if (!account || !account.email || !account.appPassword) {
    throw new Error('Account credentials not found');
  }

  if (!to) {
    throw new Error('Recipient (To) is required');
  }

  const transporter = createTransporter(account.email, account.appPassword);

  const mailOptions = {
    from: `"${account.name || account.email}" <${account.email}>`,
    to: to,
    cc: cc || undefined,
    bcc: bcc || undefined,
    subject: subject || '(no subject)',
    text: text || undefined,
    html: html || undefined,
    attachments: attachments || [],
    inReplyTo: inReplyTo || undefined,
    references: references || undefined,
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
    response: info.response,
  };
}

module.exports = {
  sendEmail,
};
