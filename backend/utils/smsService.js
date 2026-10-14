const axios = require('axios');
const NotificationLog = require('../models/NotificationLog');

// Approved SMS Templates
const SMS_TEMPLATES = {
  REGISTRATION: ({ name = 'User', role = 'patient' }) =>
    `[DentaAI] Welcome to DentaAI, ${name}! Your ${role} account has been registered successfully. Login at https://dentaai.health`,

  CONSULTATION_BOOKING: ({ doctorName = 'Specialist', date = 'N/A', time = 'N/A', ref = '' }) =>
    `[DentaAI] Booking Confirmed: Your consultation with Dr. ${doctorName} on ${date} at ${time} has been scheduled. Ref: ${ref}`,

  PAYMENT_VERIFIED: ({ amount = '0', doctorName = 'Specialist', transactionId = '' }) =>
    `[DentaAI] Payment Verified: INR ${amount} received for consultation with Dr. ${doctorName}. Txn ID: ${transactionId}.`,

  DOCTOR_APPROVAL: ({ doctorName = 'Specialist' }) =>
    `[DentaAI] Consultation Accepted: Dr. ${doctorName} has accepted your consultation request. View status in your dashboard.`,

  CONSULTATION_COMPLETED: ({ doctorName = 'Specialist' }) =>
    `[DentaAI] Consultation Completed: Dr. ${doctorName} has issued your clinical assessment and treatment plan. View at https://dentaai.health`,
};

// In-memory test store for automated testing without sending real SMS
const sentSMSLog = [];
const inMemoryKeys = new Set();

/**
 * Checks if notification key was already processed
 */
const checkDuplicate = async (key) => {
  if (!key) return false;
  if (inMemoryKeys.has(key)) return true;

  try {
    const existing = await NotificationLog.findOne({ key, channel: 'sms' });
    if (existing && existing.status === 'sent') {
      return true;
    }
  } catch (err) {
    // If DB is offline, rely on in-memory keys
  }
  return false;
};

/**
 * Records notification delivery
 */
const recordDelivery = async ({ key, recipient, event, status, errorMessage, metadata }) => {
  if (key) inMemoryKeys.add(key);

  try {
    if (key) {
      await NotificationLog.findOneAndUpdate(
        { key },
        {
          key,
          channel: 'sms',
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
 * Dispatches an SMS using Twilio REST API or mock provider
 * @param {Object} options
 * @param {string} options.to - Recipient phone number (e.g. +919876543210)
 * @param {string} options.templateName - One of SMS_TEMPLATES keys
 * @param {Object} options.templateData - Template interpolation parameters
 * @param {string} [options.customMessage] - Override message text
 * @param {string} [options.deduplicationKey] - Idempotency key
 * @returns {Promise<{success: boolean, messageId?: string, duplicate?: boolean, error?: string}>}
 */
const sendSMS = async ({ to, templateName, templateData = {}, customMessage, deduplicationKey }) => {
  // If SMS is disabled / postponed, safely exit without attempting delivery
  if (process.env.SMS_ENABLED !== 'true') {
    return { success: true, disabled: true, message: 'SMS notifications are postponed/disabled' };
  }

  // Validate recipient phone
  if (!to || typeof to !== 'string' || to.trim().length < 6) {
    return { success: false, error: 'Recipient phone number is missing or invalid' };
  }

  const cleanPhone = to.trim();

  // Deduplication check
  if (deduplicationKey && (await checkDuplicate(deduplicationKey))) {
    return { success: true, duplicate: true };
  }

  // Build message content
  let body = customMessage;
  if (!body && templateName && SMS_TEMPLATES[templateName]) {
    body = SMS_TEMPLATES[templateName](templateData);
  } else if (!body) {
    body = `[DentaAI] Notification for your account.`;
  }

  // Determine if running in mock/test mode
  const isTestMode =
    process.env.NODE_ENV === 'test' ||
    process.env.MOCK_SMS === 'true' ||
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    process.env.TWILIO_ACCOUNT_SID.includes('placeholder') ||
    process.env.SMS_ENABLED !== 'true';

  const entry = {
    to: cleanPhone,
    message: body,
    templateName: templateName || 'CUSTOM',
    deduplicationKey,
    timestamp: new Date().toISOString(),
    isMock: isTestMode,
  };

  sentSMSLog.push(entry);

  if (isTestMode) {
    await recordDelivery({
      key: deduplicationKey,
      recipient: cleanPhone,
      event: templateName,
      status: 'sent',
      metadata: { mock: true, body },
    });
    return { success: true, messageId: `mock_sms_${Date.now()}`, isMock: true };
  }

  // Live Twilio REST API integration
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('To', cleanPhone);
    params.append('From', fromPhone);
    params.append('Body', body);

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await axios.post(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader,
      },
      timeout: 10000,
    });

    await recordDelivery({
      key: deduplicationKey,
      recipient: cleanPhone,
      event: templateName,
      status: 'sent',
      metadata: { sid: response.data?.sid },
    });

    return { success: true, messageId: response.data?.sid };
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message;
    console.error('DentaAI SMS delivery failed:', errorMsg);

    await recordDelivery({
      key: deduplicationKey,
      recipient: cleanPhone,
      event: templateName,
      status: 'failed',
      errorMessage: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
};

const getSentSMSLog = () => [...sentSMSLog];
const clearSentSMSLog = () => {
  sentSMSLog.length = 0;
  inMemoryKeys.clear();
};

module.exports = {
  sendSMS,
  SMS_TEMPLATES,
  getSentSMSLog,
  clearSentSMSLog,
};
