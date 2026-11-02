const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const mongoose = require('../backend/node_modules/mongoose');
const User = require('../backend/models/User');
const Consultation = require('../backend/models/Consultation');
const Message = require('../backend/models/Message');

async function runVerification() {
  const screenshotsDir = path.join(__dirname, 'screenshots', 'consultation_activation');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('========================================================================');
  console.log('   VERIFYING AUTOMATIC PATIENT-SIDE CONSULTATION ACTIVATION (DENTAAI)  ');
  console.log('========================================================================');

  // Connect to DB for setup and state assertions
  await mongoose.connect('mongodb://127.0.0.1:27017/dental_ai');

  const doctorUser = await User.findOne({ email: 'priya.menon@dentaai.com' });
  const patientUser = await User.findOne({ email: 'patient@test.com' });

  if (!doctorUser || !patientUser) {
    throw new Error('Required doctor or patient test user not found in DB');
  }

  console.log(`[Setup] Doctor: ${doctorUser.name} (${doctorUser._id}), Patient: ${patientUser.name} (${patientUser._id})`);

  // Clean any lingering test consultations from earlier test runs
  await Consultation.deleteMany({ message: { $regex: /live activation|dashboard notification/i } });

  // Create a clean Pending consultation for Scenario 1
  const testConsultation1 = await Consultation.create({
    transactionId: 'TXN-' + Date.now() + '-1',
    patientId: patientUser._id.toString(),
    patientName: patientUser.name,
    doctorId: doctorUser._id.toString(),
    doctorName: doctorUser.name,
    doctorSpecialization: doctorUser.specialization || 'Endodontics',
    condition: 'Dental Caries',
    confidence: '94%',
    date: new Date().toISOString().split('T')[0],
    time: '10:30 AM',
    fee: 500,
    status: 'Pending',
    message: 'Test consultation for live activation'
  });

  console.log(`[Setup] Created Pending Consultation 1: ${testConsultation1._id}`);

  const browser = await chromium.launch({ headless: true });

  // --------------------------------------------------------------------------
  // SCENARIO 1: Patient on Pending Consultation page while Doctor accepts
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 1: Patient on Pending Consultation page while Doctor accepts ---');

  // Context A: Patient Session
  const patientContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const patientPage = await patientContext.newPage();

  console.log('1.1 Logging in Patient...');
  await patientPage.goto('http://localhost:5173/login');
  const pRoleBtn = await patientPage.$('.role-card:has-text("Patient")');
  if (pRoleBtn) await pRoleBtn.click();
  await patientPage.fill('input[type="email"]', 'patient@test.com');
  await patientPage.fill('input[type="password"]', 'password123');
  await patientPage.click('button[type="submit"]');
  await patientPage.waitForURL('**/dashboard/patient', { timeout: 15000 });
  await patientPage.waitForTimeout(800);

  console.log(`1.2 Patient navigating to pending consultation chat /dashboard/patient/consultation/${testConsultation1._id}/messages...`);
  await patientPage.goto(`http://localhost:5173/dashboard/patient/consultation/${testConsultation1._id}/messages`);
  await patientPage.waitForSelector('.page-header-card', { timeout: 15000 });
  await patientPage.waitForTimeout(1000);

  // Verify chat is initially locked for Pending consultation
  const initialLockStatus = await patientPage.evaluate(() => {
    const lockNotice = document.body.innerText.includes('Messaging will be available after the doctor accepts') ||
                       document.body.innerText.includes('Messaging Locked');
    const inputField = document.querySelector('input[placeholder*="Type a message"]');
    const badge = document.querySelector('.badge');
    return {
      lockNoticeFound: lockNotice,
      hasComposerInput: !!inputField,
      badgeText: badge ? badge.innerText.trim() : null
    };
  });

  console.log('Initial Patient Chat State (Pending):', initialLockStatus);
  await patientPage.screenshot({ path: path.join(screenshotsDir, '1_patient_pending_locked.png') });

  if (!initialLockStatus.lockNoticeFound) {
    throw new Error('Pending consultation did not show locked messaging notice to patient');
  }
  if (initialLockStatus.hasComposerInput) {
    throw new Error('Pending consultation incorrectly exposed message composer input to patient');
  }

  // Context B: Doctor Session (Separate browser context)
  console.log('\n1.3 Logging in Doctor in separate session...');
  const doctorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const doctorPage = await doctorContext.newPage();

  await doctorPage.goto('http://localhost:5173/login');
  const dRoleBtn = await doctorPage.$('.role-card:has-text("Doctor")');
  if (dRoleBtn) await dRoleBtn.click();
  await doctorPage.fill('input[type="email"]', 'priya.menon@dentaai.com');
  await doctorPage.fill('input[type="password"]', 'password123');
  await doctorPage.click('button[type="submit"]');
  await doctorPage.waitForURL('**/dashboard/doctor', { timeout: 15000 });
  await doctorPage.waitForTimeout(800);

  console.log('1.4 Doctor opening consultations queue...');
  await doctorPage.goto('http://localhost:5173/dashboard/doctor/consultations');
  await doctorPage.waitForSelector('.list-item', { timeout: 15000 });
  await doctorPage.waitForTimeout(1000);

  // Find the Accept button for testConsultation1
  console.log(`1.5 Doctor clicking Accept Consultation for ${testConsultation1._id}...`);
  const acceptBtn = await doctorPage.waitForSelector('button:has-text("Accept Consultation")', { timeout: 10000 });
  await acceptBtn.click();
  await doctorPage.waitForTimeout(1500);

  await doctorPage.screenshot({ path: path.join(screenshotsDir, '2_doctor_accepted_queue.png') });

  // 1.6 Check Patient Page - MUST BE UNLOCKED WITHOUT REFRESHING
  console.log('1.6 Checking Patient Page (WITHOUT REFRESH) for live automatic unlock...');
  await patientPage.waitForSelector('input[placeholder*="Type a message"]', { timeout: 10000 });
  await patientPage.waitForTimeout(500);

  const liveUnlockedStatus = await patientPage.evaluate(() => {
    const inputField = document.querySelector('input[placeholder*="Type a message"]');
    const badge = document.querySelector('.badge');
    const lockNotice = document.body.innerText.includes('Messaging will be available after the doctor accepts');
    return {
      hasComposerInput: !!inputField,
      badgeText: badge ? badge.innerText.trim() : null,
      lockNoticeRemaining: lockNotice
    };
  });

  console.log('Live Patient Chat State (After Doctor Accepted):', liveUnlockedStatus);
  await patientPage.screenshot({ path: path.join(screenshotsDir, '3_patient_live_unlocked.png') });

  if (!liveUnlockedStatus.hasComposerInput) {
    throw new Error('Message composer failed to unlock automatically without page refresh');
  }
  if (liveUnlockedStatus.lockNoticeRemaining) {
    throw new Error('Locked notice was still present after doctor acceptance');
  }
  console.log('✅ Automatic patient-side consultation activation verified: composer unlocked live!');

  // --------------------------------------------------------------------------
  // SCENARIO 2: Both Patient and Doctor Exchange Messages in Real Time
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Real-time Message Exchange between Patient and Doctor ---');

  // Patient sends message
  console.log('2.1 Patient sending message: "Hello Doctor, I have mild tooth sensitivity."');
  await patientPage.fill('input[placeholder*="Type a message"]', 'Hello Doctor, I have mild tooth sensitivity.');
  await patientPage.click('button[type="submit"]');
  await patientPage.waitForTimeout(1000);

  // Doctor opens the chat
  console.log('2.2 Doctor opening chat for this consultation...');
  await doctorPage.goto(`http://localhost:5173/dashboard/doctor/consultation/${testConsultation1._id}/messages`);
  await doctorPage.waitForSelector('.page-header-card', { timeout: 15000 });
  await doctorPage.waitForTimeout(1000);

  // Check Doctor received Patient's message
  const doctorSeesPatientMsg = await doctorPage.evaluate(() => {
    return document.body.innerText.includes('Hello Doctor, I have mild tooth sensitivity.');
  });
  console.log('Doctor sees Patient message:', doctorSeesPatientMsg);
  await doctorPage.screenshot({ path: path.join(screenshotsDir, '4_doctor_receives_patient_message.png') });

  if (!doctorSeesPatientMsg) {
    throw new Error('Doctor did not receive Patient message in consultation chat');
  }

  // Doctor sends reply
  console.log('2.3 Doctor sending reply: "Hello! I received your scan and will review it shortly."');
  await doctorPage.fill('input[placeholder*="Type a message"]', 'Hello! I received your scan and will review it shortly.');
  await doctorPage.click('button[type="submit"]');
  await doctorPage.waitForTimeout(1000);

  // Patient sees Doctor's reply
  await patientPage.waitForTimeout(1500);
  const patientSeesDoctorReply = await patientPage.evaluate(() => {
    return document.body.innerText.includes('Hello! I received your scan and will review it shortly.');
  });
  console.log('Patient sees Doctor reply:', patientSeesDoctorReply);
  await patientPage.screenshot({ path: path.join(screenshotsDir, '5_patient_receives_doctor_reply.png') });

  if (!patientSeesDoctorReply) {
    throw new Error('Patient did not receive Doctor reply in real-time');
  }
  console.log('✅ Bidirectional real-time message exchange verified!');

  // --------------------------------------------------------------------------
  // SCENARIO 3: Patient on Dashboard when Doctor accepts (In-App Notification & Open Chat)
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 3: Patient on Dashboard receives In-App Notification with Open Chat ---');

  // Create another consultation
  const testConsultation2 = await Consultation.create({
    transactionId: 'TXN-' + Date.now() + '-2',
    patientId: patientUser._id.toString(),
    patientName: patientUser.name,
    doctorId: doctorUser._id.toString(),
    doctorName: doctorUser.name,
    doctorSpecialization: doctorUser.specialization || 'Endodontics',
    condition: 'Gingivitis',
    confidence: '88%',
    date: new Date().toISOString().split('T')[0],
    time: '2:00 PM',
    fee: 500,
    status: 'Pending',
    message: 'Second consultation for dashboard notification test'
  });

  console.log(`3.1 Patient navigating to Dashboard /dashboard/patient...`);
  await patientPage.goto('http://localhost:5173/dashboard/patient');
  await patientPage.waitForSelector('.page-header-card', { timeout: 15000 });
  await patientPage.waitForTimeout(1000);

  console.log(`3.2 Doctor accepting Consultation 2 (${testConsultation2._id})...`);
  await doctorPage.goto('http://localhost:5173/dashboard/doctor/consultations');
  await doctorPage.waitForSelector('.list-item', { timeout: 15000 });
  await doctorPage.waitForTimeout(1000);

  const acceptBtn2 = await doctorPage.waitForSelector('button:has-text("Accept Consultation")', { timeout: 10000 });
  await acceptBtn2.click();
  await doctorPage.waitForTimeout(1500);

  // Patient on Dashboard receives in-app toast banner
  console.log('3.3 Checking Patient Dashboard for live In-App Acceptance Toast with "Open Chat"...');
  await patientPage.waitForSelector('.in-app-acceptance-toast', { timeout: 10000 });
  await patientPage.waitForTimeout(500);
  await patientPage.screenshot({ path: path.join(screenshotsDir, '6_patient_dashboard_acceptance_toast.png') });

  const toastText = await patientPage.evaluate(() => {
    const toast = document.querySelector('.in-app-acceptance-toast');
    const openChatBtn = toast ? Array.from(toast.querySelectorAll('button')).find(b => b.innerText.includes('Open Chat')) : null;
    return {
      text: toast ? toast.innerText : null,
      hasOpenChat: !!openChatBtn
    };
  });
  console.log('In-App Toast Details:', toastText);

  if (!toastText.hasOpenChat) {
    throw new Error('In-app acceptance notification toast missing "Open Chat" action button');
  }

  // Click Open Chat on toast
  console.log('3.4 Clicking "Open Chat" on the In-App Toast...');
  await patientPage.click('.in-app-acceptance-toast button:has-text("Open Chat")');
  await patientPage.waitForURL(`**/dashboard/patient/consultation/${testConsultation2._id}/messages`, { timeout: 10000 });
  await patientPage.waitForSelector('input[placeholder*="Type a message"]', { timeout: 10000 });
  console.log('✅ In-App Notification Open Chat navigated directly to unlocked chat!');

  // --------------------------------------------------------------------------
  // SCENARIO 4: Patient Consultation List Auto-Update
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 4: Patient Consultation List reflects Accepted status ---');
  await patientPage.goto('http://localhost:5173/dashboard/patient/consultations');
  await patientPage.waitForSelector('.card', { timeout: 15000 });
  await patientPage.waitForTimeout(1000);
  await patientPage.screenshot({ path: path.join(screenshotsDir, '7_patient_consultations_list.png') });

  const listStatuses = await patientPage.evaluate(() => {
    const badges = Array.from(document.querySelectorAll('.card .badge')).map(b => b.innerText.trim());
    const actionButtons = Array.from(document.querySelectorAll('.card a, .card button')).map(el => el.innerText.trim());
    return { badges, actionButtons };
  });
  console.log('Consultation List Badges:', listStatuses.badges);
  const hasAcceptedBadge = listStatuses.badges.some(b => b.includes('Accepted') || b.includes('Confirmed'));
  const hasMessageDoctorAction = listStatuses.actionButtons.some(b => b.includes('Message Doctor'));

  if (!hasAcceptedBadge || !hasMessageDoctorAction) {
    throw new Error('Patient consultation list does not display Accepted status with Message Doctor action');
  }
  console.log('✅ Patient consultation list correctly shows Accepted with "Message Doctor" action!');

  // --------------------------------------------------------------------------
  // SCENARIO 5: Completed & Rejected Consultations Restrictions
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 5: Completed / Restricted Consultation Workflow ---');

  // Complete consultation 1 via Doctor workspace
  console.log('5.1 Completing consultation via Doctor Workspace...');
  await doctorPage.goto(`http://localhost:5173/dashboard/doctor/consultation/${testConsultation1._id}`);
  await doctorPage.waitForSelector('.dashboard-header', { timeout: 15000 });
  await doctorPage.waitForTimeout(1000);

  // Fill in diagnosis & treatment
  await doctorPage.fill('input[placeholder*="caries"]', 'Mild enamel demineralization.').catch(() => {});
  await doctorPage.fill('textarea[placeholder*="clinical"]', 'Routine brushing and dental cleaning in 6 months.').catch(() => {});
  await doctorPage.waitForTimeout(500);

  const completeBtn = await doctorPage.waitForSelector('button:has-text("Complete Consultation")', { timeout: 10000 });
  await completeBtn.click();
  await doctorPage.waitForTimeout(600);

  // Confirm in modal
  const confirmBtn = await doctorPage.waitForSelector('button:has-text("Confirm & Complete"), button:has-text("Confirm & Conclude")', { timeout: 5000 }).catch(() => null);
  if (confirmBtn) {
    await confirmBtn.click();
  }
  await doctorPage.waitForTimeout(2000);

  // Verify Patient view is now Read-Only
  console.log('5.2 Verifying Patient chat switches to Read-Only for Completed consultation...');
  await patientPage.goto(`http://localhost:5173/dashboard/patient/consultation/${testConsultation1._id}/messages`);
  await patientPage.waitForSelector('.page-header-card', { timeout: 15000 });
  await patientPage.waitForTimeout(1000);
  await patientPage.screenshot({ path: path.join(screenshotsDir, '8_completed_read_only.png') });

  const completedLockStatus = await patientPage.evaluate(() => {
    const readOnlyNotice = document.body.innerText.includes('This consultation has ended') ||
                           document.body.innerText.includes('new messages are disabled');
    const inputField = document.querySelector('input[placeholder*="Type a message"]');
    return {
      readOnlyNoticeFound: readOnlyNotice,
      hasComposerInput: !!inputField
    };
  });
  console.log('Completed Consultation Read-Only Status:', completedLockStatus);

  if (!completedLockStatus.readOnlyNoticeFound || completedLockStatus.hasComposerInput) {
    throw new Error('Completed consultation did not properly enforce read-only message restriction');
  }
  console.log('✅ Completed consultation restrictions verified!');

  // Cleanup test consultations
  await Consultation.deleteMany({ _id: { $in: [testConsultation1._id, testConsultation2._id] } });
  await Message.deleteMany({ consultationId: { $in: [testConsultation1._id.toString(), testConsultation2._id.toString()] } });
  await mongoose.disconnect();
  await browser.close();

  console.log('\n========================================================================');
  console.log('   ALL CONSULTATION ACTIVATION SCENARIOS SUCCESSFULLY VERIFIED!         ');
  console.log('========================================================================');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});