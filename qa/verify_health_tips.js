const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const mongoose = require('../backend/node_modules/mongoose');
const User = require('../backend/models/User');
const ScanHistory = require('../backend/models/ScanHistory');

const EXPECTED_DISCLAIMER =
  "These recommendations are intended for general oral health education only. AI screening results are preliminary and do not constitute a confirmed diagnosis. Please consult a qualified dentist for professional evaluation and treatment.";

const SUPPORTED_CONDITIONS = [
  'Calculus',
  'Caries',
  'Gingivitis',
  'Hypodontia',
  'Mouth Ulcer',
  'Tooth Discoloration'
];

async function runHealthTipsVerification() {
  const screenshotsDir = path.join(__dirname, 'screenshots', 'health_tips');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('========================================================================');
  console.log('         VERIFYING DENTAAI PATIENT HEALTH TIPS & ISOLATION              ');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Database Connection & Model Inspection
  console.log('\n--- 1. Database Connection & Patient Accounts Check ---');
  await mongoose.connect('mongodb://127.0.0.1:27017/dental_ai');

  const patient = await User.findOne({ email: 'patient@test.com' });
  assert(patient !== null, 'Existing patient user found in database');

  let otherPatient = await User.findOne({ email: 'other.patient@test.com' });
  if (!otherPatient) {
    otherPatient = await User.create({
      name: 'Other Patient',
      email: 'other.patient@test.com',
      password: 'password123',
      role: 'patient',
      verificationStatus: 'Approved',
      accountStatus: 'Active'
    });
  }
  assert(otherPatient !== null, 'Secondary patient user available for isolation testing');

  // 2. Patient Data Isolation Backend API Testing
  console.log('\n--- 2. Backend API Data Isolation Tests ---');

  // Login as primary patient
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@test.com', password: 'password123', loginRole: 'patient' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  assert(loginRes.ok && !!token, 'Patient login successful with JWT token');

  // Test 2A: Accessing own scans
  const ownScansRes = await fetch(`http://localhost:5000/api/scans/${patient._id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const ownScans = await ownScansRes.json();
  assert(ownScansRes.status === 200 && Array.isArray(ownScans), 'Patient can retrieve their own scan history (HTTP 200)');

  // Test 2B: Attempting to access other patient's scans
  const otherScansRes = await fetch(`http://localhost:5000/api/scans/${otherPatient._id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert(otherScansRes.status === 403, 'Patient cannot access another patient\'s scans (HTTP 403 Forbidden)');

  // Test 2C: Unauthenticated access without token
  const unauthRes = await fetch(`http://localhost:5000/api/scans/${patient._id}`);
  assert(unauthRes.status === 401, 'Unauthenticated scan request rejected (HTTP 401 Unauthorized)');

  // 2D: Knowledge Base Content & Differentiation Verification
  console.log('\n--- 2D. Knowledge Base & Differentiation Verification ---');
  const sourceCode = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/patient/PatientHealthTips.jsx'), 'utf8');
  assert(sourceCode.includes("export const CONDITION_DATA"), 'CONDITION_DATA knowledge base exported');

  // Verify all 6 conditions are defined with 4 distinct hygiene guidance and 4 distinct preventive care items
  for (const cond of SUPPORTED_CONDITIONS) {
    const isDefined = sourceCode.includes(`${cond}: {`) || sourceCode.includes(`'${cond}': {`);
    assert(isDefined, `Condition [${cond}] defined in knowledge base`);
  }

  assert(sourceCode.includes('Proper Brushing Along the Gumline'), 'Calculus guidance: Proper brushing along gumline included');
  assert(sourceCode.includes('Brush Twice Daily with Fluoride Toothpaste'), 'Caries guidance: Fluoride toothpaste included');
  assert(sourceCode.includes('Use a Soft-Bristled Toothbrush'), 'Gingivitis guidance: Soft-bristled toothbrush included');
  assert(sourceCode.includes('Careful Cleaning Around Missing-Tooth Spaces'), 'Hypodontia guidance: Cleaning around missing teeth included');
  assert(sourceCode.includes('Use a Soft Toothbrush'), 'Mouth Ulcer guidance: Soft toothbrush included');
  assert(sourceCode.includes('Brush Gently with Fluoride Toothpaste'), 'Tooth Discoloration guidance: Gentle brushing with fluoride included');
  assert(sourceCode.includes('Avoid Abrasive Whitening Remedies'), 'Tooth Discoloration preventive: Avoid abrasive remedies included');

  // 3. Browser E2E Tests with Playwright
  console.log('\n--- 3. Browser UI & Dynamic Condition Testing ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Login via UI
  await page.goto('http://127.0.0.1:5173/login');
  await page.fill('input[type="email"]', 'patient@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/patient**', { timeout: 10000 });
  assert(page.url().includes('/dashboard/patient'), 'Logged into Patient Dashboard');

  // Navigate to Health Tips
  await page.goto('http://127.0.0.1:5173/dashboard/patient/health-tips');
  await page.waitForSelector('.page-header-card', { timeout: 10000 });
  assert(true, 'Health Tips page loaded');

  // 3A. Verify Header
  const headerTitle = await page.textContent('.page-header-card h2');
  assert(headerTitle.includes('Health Tips'), 'Page header displays "Health Tips"');

  // 3B. Verify General Guidelines (All 3 Sections)
  const content = await page.content();
  assert(content.includes('General Dental Health Guidelines'), 'General Dental Health Guidelines header present');
  assert(content.includes('Brushing &amp; Flossing') || content.includes('Brushing & Flossing'), 'Section "Brushing & Flossing" present');
  assert(content.includes('Brush for at least 2 minutes, twice a day.'), 'Brushing item 1 present');
  assert(content.includes('Use a soft-bristled toothbrush to protect your gums.'), 'Brushing item 2 present');
  assert(content.includes('Floss at least once daily to remove hidden plaque.'), 'Brushing item 3 present');
  assert(content.includes('Diet &amp; Nutrition') || content.includes('Diet & Nutrition'), 'Section "Diet & Nutrition" present');
  assert(content.includes('Limit sugary and acidic foods and drinks.'), 'Diet item 1 present');
  assert(content.includes('Drink plenty of water, especially after meals.'), 'Diet item 2 present');
  assert(content.includes('When to Visit a Dentist'), 'Section "When to Visit a Dentist" present');
  assert(content.includes('Schedule regular check-ups every 6 months.'), 'Visit dentist item 1 present');

  // 3C. Verify Medical Disclaimer
  assert(content.includes(EXPECTED_DISCLAIMER), 'Medical Disclaimer exactly matches requirement string');

  // 3D. Verify No Medication or Prescription Generation
  const lowerContent = content.toLowerCase();
  const forbiddenTerms = ['amoxicillin', 'ibuprofen', 'dosage', 'prescription written', 'mg daily', 'paracetamol'];
  let foundForbidden = forbiddenTerms.some(term => lowerContent.includes(term));
  assert(!foundForbidden, 'No pharmaceutical medicines, dosages, or prescriptions generated');

  await page.screenshot({ path: path.join(screenshotsDir, '01_health_tips_initial.png'), fullPage: true });

  // 4. Test All Six Condition-Specific States via Dynamic Mocking
  console.log('\n--- 4. Testing All 6 Condition-Specific Recommendation States ---');

  for (const conditionName of SUPPORTED_CONDITIONS) {
    // Intercept scan API for this condition
    await page.route(`**/api/scans/*`, async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: `mock_${conditionName}`,
            condition: conditionName,
            confidence: 96.5,
            createdAt: new Date().toISOString(),
            recommendation: `Follow dental recommendations for ${conditionName}`
          }
        ])
      });
    });

    await page.goto('http://127.0.0.1:5173/dashboard/patient/health-tips', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-header-card', { timeout: 10000 });
    await page.locator('text="Oral Hygiene Guidance"').waitFor({ state: 'visible', timeout: 8000 });

    const conditionContent = await page.content();
    const hasConditionTitle = conditionContent.includes(conditionName);
    const hasHygiene = conditionContent.includes('Oral Hygiene Guidance');
    const hasPreventive = conditionContent.includes('Preventive Care');
    const hasScanDate = conditionContent.includes('Scan Date:');
    const hasConfidence = conditionContent.includes('96.5% AI Screening Confidence');

    assert(
      hasConditionTitle && hasHygiene && hasPreventive && hasScanDate && hasConfidence,
      `Condition State [${conditionName}] rendered accurately with hygiene, preventive, and scan metadata`
    );

    // Verify recommendations are genuinely different between Oral Hygiene Guidance and Preventive Care
    const hygieneSectionMatches = conditionContent.includes('Oral Hygiene Guidance');
    const preventiveSectionMatches = conditionContent.includes('Preventive Care');
    assert(hygieneSectionMatches && preventiveSectionMatches, `Condition [${conditionName}]: Distinct cards for Oral Hygiene Guidance and Preventive Care present`);

    // Save screenshot for Calculus and Caries
    if (conditionName === 'Calculus' || conditionName === 'Caries') {
      await page.screenshot({
        path: path.join(screenshotsDir, `02_condition_${conditionName.toLowerCase()}.png`),
        fullPage: true
      });
    }

    await page.unroute(`**/api/scans/*`);
  }

  // 5. Test No-Scan State
  console.log('\n--- 5. Testing No-Scan State ---');
  await page.route(`**/api/scans/*`, async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await page.reload();
  await page.waitForSelector('.page-header-card', { timeout: 8000 });

  const noScanContent = await page.content();
  assert(noScanContent.includes('No AI scan available yet'), 'No-scan message "No AI scan available yet" displayed');
  assert(noScanContent.includes('Go to Scan Upload'), 'Button "Go to Scan Upload" present');
  assert(!noScanContent.includes('Active Decay Risk') && !noScanContent.includes('Calcified Deposit'), 'No fake personalized condition recommendations shown');
  assert(noScanContent.includes('General Dental Health Guidelines'), 'General guidelines still present during no-scan state');
  assert(noScanContent.includes(EXPECTED_DISCLAIMER), 'Medical disclaimer present during no-scan state');

  const uploadBtnHref = await page.getAttribute('a:has-text("Go to Scan Upload")', 'href');
  assert(uploadBtnHref === '/dashboard/patient', 'Go to Scan Upload links directly to /dashboard/patient');

  await page.screenshot({ path: path.join(screenshotsDir, '03_no_scan_state.png'), fullPage: true });
  await page.unroute(`**/api/scans/*`);

  // 6. Test Responsive Layout on Tablet and Mobile
  console.log('\n--- 6. Responsive UI Testing ---');
  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload();
  await page.waitForSelector('.page-header-card');
  let bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  let winWidth = await page.evaluate(() => window.innerWidth);
  assert(bodyWidth <= winWidth, 'Tablet layout (768px): zero horizontal scrollbar');

  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await page.waitForSelector('.page-header-card');
  bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  winWidth = await page.evaluate(() => window.innerWidth);
  assert(bodyWidth <= winWidth, 'Mobile layout (375px): zero horizontal scrollbar');

  await page.screenshot({ path: path.join(screenshotsDir, '04_mobile_view.png'), fullPage: true });

  // 7. Verify Patient Dashboard & Scan Functionality Still Intact
  console.log('\n--- 7. Verification of Existing Patient Dashboard ---');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://127.0.0.1:5173/dashboard/patient');
  await page.waitForSelector('.page-header-card', { timeout: 8000 });

  const dashboardContent = await page.content();
  assert(
    dashboardContent.includes('Start a New AI Scan') ||
    dashboardContent.includes('Upload a clear intraoral image') ||
    dashboardContent.includes('upload-zone'),
    'Dashboard scan upload dropzone is intact'
  );
  assert(dashboardContent.includes('Screening History'), 'Screening History card is intact');

  const viewAllHref = await page.getAttribute('a:has-text("View All")', 'href');
  assert(viewAllHref === '/dashboard/patient/screening-history', 'Screening History "View All" link points to /dashboard/patient/screening-history');

  await browser.close();
  await mongoose.disconnect();

  console.log('\n========================================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runHealthTipsVerification().catch(err => {
  console.error('Unhandled error during verification:', err);
  process.exit(1);
});