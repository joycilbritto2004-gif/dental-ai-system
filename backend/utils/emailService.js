const nodemailer = require('nodemailer');
const NotificationLog = require('../models/NotificationLog');

// In-memory log for testing
const sentEmailLog = [];
const inMemoryKeys = new Set();

/**
 * Checks if email with deduplication key was already sent
 */
const checkDuplicate = async (key) => {
  if (!key) return false;
  if (inMemoryKeys.has(key)) return true;

  try {
    const existing = await NotificationLog.findOne({ key, channel: 'email' });
    if (existing && existing.status === 'sent') {
      return true;
    }
  } catch (err) {
    // If DB is offline, fall back to in-memory check
  }
  return false;
};

/**
 * Records email delivery status
 */
const recordDelivery = async ({ key, recipient, event, status, errorMessage, metadata }) => {
  if (key) inMemoryKeys.add(key);

  try {
    if (key) {
      await NotificationLog.findOneAndUpdate(
        { key },
        {
          key,
          channel: 'email',
          recipient,
          event: event || 'generic',
          status,
          errorMessage,
          metadata,
          createdAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (err) {
    // Non-blocking
  }
};

/**
 * Sleep helper for retry delays
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends an email with retry logic and deduplication
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.message] - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {string} [options.deduplicationKey] - Idempotency key
 * @param {string} [options.event] - Event type
 * @returns {Promise<{success: boolean, duplicate?: boolean, messageId?: string, error?: string}>}
 */
const sendEmail = async (options) => {
  const { email, subject, message, html, deduplicationKey, event } = options;

  if (!email) {
    return { success: false, error: 'Recipient email is missing' };
  }

  // Deduplication check
  if (deduplicationKey && (await checkDuplicate(deduplicationKey))) {
    return { success: true, duplicate: true };
  }

  // Check if running in mock/test mode
  const isTestMode =
    process.env.NODE_ENV === 'test' ||
    process.env.MOCK_EMAIL === 'true' ||
    !process.env.GMAIL_USER ||
    !process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_USER.includes('placeholder');

  const entry = {
    to: email,
    subject,
    message,
    html,
    deduplicationKey,
    event,
    timestamp: new Date().toISOString(),
    isMock: isTestMode,
  };

  sentEmailLog.push(entry);

  if (isTestMode) {
    await recordDelivery({
      key: deduplicationKey,
      recipient: email,
      event: event || 'email_notification',
      status: 'sent',
      metadata: { mock: true, subject },
    });
    return { success: true, messageId: `mock_email_${Date.now()}`, isMock: true };
  }

  // Gmail SMTP transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    // Prevent hanging connections
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const mailOptions = {
    from: `"DentaAI System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    text: message,
    html,
  };

  // Safe retry loop (up to 3 attempts with exponential backoff)
  let lastError = null;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      await recordDelivery({
        key: deduplicationKey,
        recipient: email,
        event: event || 'email_notification',
        status: 'sent',
        metadata: { messageId: info.messageId, attempts: attempt },
      });
      return { success: true, messageId: info.messageId, attempts: attempt };
    } catch (error) {
      lastError = error;
      console.warn(`[DentaAI Email] Attempt ${attempt}/${maxAttempts} failed for ${email}: ${error.message}`);
      if (attempt < maxAttempts) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
        await delay(waitTime);
      }
    }
  }

  // If all retries failed, record failure safely without breaking caller
  await recordDelivery({
    key: deduplicationKey,
    recipient: email,
    event: event || 'email_notification',
    status: 'failed',
    errorMessage: lastError?.message,
  });

  return { success: false, error: lastError?.message || 'Email delivery failed after retries' };
};

const getSentEmailLog = () => [...sentEmailLog];
const clearSentEmailLog = () => {
  sentEmailLog.length = 0;
  inMemoryKeys.clear();
};

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.getSentEmailLog = getSentEmailLog;
module.exports.clearSentEmailLog = clearSentEmailLog;
