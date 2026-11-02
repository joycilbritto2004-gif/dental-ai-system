const { sendSMS, SMS_TEMPLATES, getSentSMSLog, clearSentSMSLog } = require('../backend/utils/smsService');
const sendEmail = require('../backend/utils/emailService');
const { getSentEmailLog, clearSentEmailLog } = sendEmail;
const mongoose = require('../backend/node_modules/mongoose');

async function runNotificationResilienceTests() {
  console.log('--- STARTING NOTIFICATIONS RESILIENCE & DEDUPLICATION TESTS ---');
  let pass = 0;
  let fail = 0;

  await mongoose.connect('mongodb://127.0.0.1:27017/dental_ai');

  const assert = (condition, desc) => {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      pass++;
    } else {
      console.error(`[FAIL] ${desc}`);
      fail++;
    }
  };

  try {
    clearSentSMSLog();
    clearSentEmailLog();

    // 1. Test SMS Disabled / Postponed Mode (Default Safe State)
    console.log('\n1. Testing SMS Postponed / Disabled Mode (Safe Default):');
    process.env.SMS_ENABLED = 'false';
    const disabledSmsRes = await sendSMS({
      to: '+919876543210',
      templateName: 'REGISTRATION',
      templateData: { name: 'Test User', role: 'patient' },
      deduplicationKey: 'test_disabled_sms_key'
    });
    assert(disabledSmsRes.success === true && disabledSmsRes.disabled === true, 'SMS safely bypassed when SMS_ENABLED is false');
    assert(getSentSMSLog().length === 0, 'No SMS logged or sent in disabled mode');

    // 2. Test Email Notifications (Unbroken & Fully Active)
    console.log('\n2. Testing Active Email Notifications & Safe Retry/Deduplication:');
    const emailKey = `test_email_key_${Date.now()}`;
    const firstEmail = await sendEmail({
      email: 'patient@test.com',
      subject: 'Consultation Booking Confirmed - DentaAI',
      message: 'Your consultation has been scheduled.',
      deduplicationKey: emailKey,
      event: 'consultation_booking'
    });
    assert(firstEmail.success === true, 'Email notification dispatches successfully');

    const duplicateEmail = await sendEmail({
      email: 'patient@test.com',
      subject: 'Consultation Booking Confirmed - DentaAI',
      message: 'Your consultation has been scheduled.',
      deduplicationKey: emailKey,
      event: 'consultation_booking'
    });
    assert(duplicateEmail.success === true && duplicateEmail.duplicate === true, 'Duplicate email with same key safely skipped without re-sending');

    const emailLogs = getSentEmailLog();
    assert(emailLogs.filter(l => l.deduplicationKey === emailKey).length === 1, 'Only one email record was processed for the deduplication key');

    // 3. Test Approved SMS Templates
    console.log('\n3. Testing Approved SMS Templates (Preserved for Future Release):');
    const regTpl = SMS_TEMPLATES.REGISTRATION({ name: 'John Doe', role: 'patient' });
    assert(regTpl.includes('Welcome to DentaAI, John Doe') && regTpl.includes('patient account'), 'Registration template formatted correctly');

    const bookTpl = SMS_TEMPLATES.CONSULTATION_BOOKING({ doctorName: 'Priya Menon', date: '2027-01-01', time: '10:00', ref: 'AB1234' });
    assert(bookTpl.includes('Dr. Priya Menon') && bookTpl.includes('AB1234'), 'Consultation Booking template formatted correctly');

    const payTpl = SMS_TEMPLATES.PAYMENT_VERIFIED({ amount: '500', doctorName: 'Priya Menon', transactionId: 'pay_123' });
    assert(payTpl.includes('INR 500') && payTpl.includes('pay_123'), 'Payment Verified template formatted correctly');

    const acceptTpl = SMS_TEMPLATES.DOCTOR_APPROVAL({ doctorName: 'Priya Menon' });
    assert(acceptTpl.includes('Dr. Priya Menon has accepted'), 'Doctor Approval template formatted correctly');

    const compTpl = SMS_TEMPLATES.CONSULTATION_COMPLETED({ doctorName: 'Priya Menon' });
    assert(compTpl.includes('Dr. Priya Menon has issued your clinical assessment'), 'Consultation Completed template formatted correctly');

    // 4. Test Error Handling Resilience
    console.log('\n4. Testing Non-blocking Error Handling & Missing Credentials:');
    process.env.SMS_ENABLED = 'true';
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    const missingCredsSms = await sendSMS({
      to: '+919876543210',
      templateName: 'DOCTOR_APPROVAL',
      templateData: { doctorName: 'Dr. Test' }
    });
    assert(missingCredsSms.success === true, 'Missing SMS credentials gracefully fallback without crashing caller');

    const invalidEmailRes = await sendEmail({ email: '', subject: 'Test' });
    assert(invalidEmailRes.success === false && invalidEmailRes.error, 'Invalid email handled gracefully without throwing');

    // Restore safe disabled state
    process.env.SMS_ENABLED = 'false';

    console.log(`\n========================================`);
    console.log(`NOTIFICATIONS RESILIENCE: ${pass} PASS / ${fail} FAIL`);
    console.log(`========================================`);

  } catch (err) {
    console.error('Fatal Test Error:', err);
    fail++;
  } finally {
    await mongoose.disconnect();
  }

  process.exit(fail === 0 ? 0 : 1);
}

runNotificationResilienceTests();
