const nodemailer = require("nodemailer");

/**
 * Creates and returns a Nodemailer transporter based on current environment variables.
 * Supports Gmail, custom SMTP, Resend/SendGrid/Postmark SMTP, or test transporter.
 */
const createTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (user && pass) {
    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === "production",
        },
      });
    }

    // Default to Gmail service if user/pass provided without specific host
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  // Development Fallback: Ethereal test transporter if no credentials set
  if (process.env.NODE_ENV !== "production") {
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log("[Email Service] Initialized dev fallback test account via Ethereal");
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn("[Email Service] Could not generate test account. Falling back to console logger.");
      return null;
    }
  }

  return null;
};

/**
 * Sends a formatted notification email whenever a contact form is submitted.
 * Sets the visitor's email address as the Reply-To header.
 */
const sendContactNotification = async ({ name, email, subject, message, createdAt }) => {
  const recipientEmail = process.env.CONTACT_EMAIL || "aryan21sharma04@gmail.com";
  const fromEmail =
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    '"Portfolio Notifications" <no-reply@aryansharma.dev>';
  const safeSubject = subject || `Inquiry from ${name}`;
  const timestamp = (createdAt ? new Date(createdAt) : new Date()).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "Asia/Kolkata",
  });

  const plainTextContent = `New Portfolio Contact Message
From: ${name}
Email: ${email}
Subject: ${safeSubject}
Message:
${message}
Received: ${timestamp}
`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Portfolio Contact Message</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      margin: 0;
      padding: 24px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      color: #030712;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .content {
      padding: 28px 24px;
    }
    .meta-card {
      background: #1e293b;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      border-left: 4px solid #06b6d4;
    }
    .meta-row {
      display: flex;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      width: 90px;
      font-weight: 600;
      color: #94a3b8;
    }
    .meta-value {
      flex: 1;
      color: #f1f5f9;
      word-break: break-all;
    }
    .meta-value a {
      color: #38bdf8;
      text-decoration: none;
    }
    .message-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 18px;
      font-size: 15px;
      line-height: 1.6;
      color: #f8fafc;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .message-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .actions {
      margin-top: 24px;
      text-align: center;
    }
    .reply-btn {
      display: inline-block;
      background: #0ea5e9;
      color: #030712 !important;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }
    .footer {
      padding: 16px 24px;
      background: #0b0f19;
      border-top: 1px solid #1e293b;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>New Portfolio Contact Message</h1>
    </div>
    <div class="content">
      <div class="meta-card">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; width: 90px; color: #94a3b8; font-weight: 600;">From:</td>
            <td style="padding: 4px 0; color: #f1f5f9; font-weight: 600;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94a3b8; font-weight: 600;">Email:</td>
            <td style="padding: 4px 0; color: #38bdf8;"><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94a3b8; font-weight: 600;">Subject:</td>
            <td style="padding: 4px 0; color: #f1f5f9;">${safeSubject}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94a3b8; font-weight: 600;">Received:</td>
            <td style="padding: 4px 0; color: #94a3b8; font-size: 13px;">${timestamp}</td>
          </tr>
        </table>
      </div>

      <div class="message-title">Message Content</div>
      <div class="message-box">${escapeHtml(message)}</div>

      <div class="actions">
        <a href="mailto:${email}?subject=Re:%20${encodeURIComponent(safeSubject)}" class="reply-btn">
          Reply Directly to ${escapeHtml(name)} &rarr;
        </a>
      </div>
    </div>
    <div class="footer">
      This notification was automatically generated by Aryan Sharma's Portfolio API.<br>
      You can directly click Reply in your email client to contact ${escapeHtml(name)}.
    </div>
  </div>
</body>
</html>
`;

  try {
    const transporter = await createTransporter();

    if (!transporter) {
      console.log("--------------------------------------------------");
      console.log("[Email Service: Log Fallback]");
      console.log(plainTextContent);
      console.log("--------------------------------------------------");
      return {
        success: true,
        method: "console_logged",
        messageId: "console-fallback-" + Date.now(),
      };
    }

    const mailOptions = {
      from: fromEmail,
      to: recipientEmail,
      replyTo: `"${name}" <${email}>`,
      subject: `[Portfolio Contact] ${safeSubject}`,
      text: plainTextContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Notification sent successfully. Message ID: ${info.messageId}`);

    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[Email Service] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info) || null,
    };
  } catch (error) {
    console.error(`[Email Service] Failed to send email notification: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = {
  sendContactNotification,
};
