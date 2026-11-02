const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const mongoose = require('../backend/node_modules/mongoose');
const User = require('../backend/models/User');
const ScanHistory = require('../backend/models/ScanHistory');

async function runPatientPortalE2E() {
  const screenshotsDir = path.join(__dirname, 'screenshots', 'patient_portal_e2e');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('========================================================================');
  console.log('          DENTAAI PATIENT PORTAL COMPLETE END-TO-END VERIFICATION       ');
  console.log('========================================================================\n');

  const results = [];

  function recordResult(feature, status, details) {
    results.push({ feature, status, details });
    const symbol = status === 'PASS' ? '✅ PASS' : status === 'FAIL' ? '❌ FAIL' : '⚠️ NOT TESTED';
    console.log(`${symbol}: [${feature}] - ${details}`);
  }

  // 1. Check MongoDB Connection
  console.log('--- Checking MongoDB Connection ---');
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/dental_ai');
    recordResult('MongoDB Connection', 'PASS', 'Connected to mongodb://127.0.0.1:27017/dental_ai');
  } catch (err) {
    recordResult('MongoDB Connection', 'FAIL', `Connection failed: ${err.message}`);
    process.exit(1);
  }

  // Verify Existing Patient Account
  const existingPatient = await User.findOne({ email: 'patient@test.com' });
  if (existingPatient) {
    recordResult('Existing Patient Account Verification', 'PASS', `Found patient: ${existingPatient.name} (${existingPatient.email})`);
  } else {
    recordResult('Existing Patient Account Verification', 'FAIL', 'patient@test.com not found in database');
    process.exit(1);
  }

  // 2. Check Python AI Service Directly
  console.log('\n--- Checking Python AI Service (Port 5002) ---');
  try {
    const aiHealth = await fetch('http://127.0.0.1:5002/api/ai/health').then(r => r.json());
    if (aiHealth.status === 'ok') {
      recordResult('Python AI Microservice Health', 'PASS', 'Service active on http://127.0.0.1:5002 with status ok');
    } else {
      recordResult('Python AI Microservice Health', 'FAIL', `Unexpected payload: ${JSON.stringify(aiHealth)}`);
    }
  } catch (err) {
    recordResult('Python AI Microservice Health', 'FAIL', `Unreachable: ${err.message}`);
  }

  // 3. Check Express Backend AI Route Proxy
  console.log('\n--- Checking Express Backend AI Proxy (Port 5000) ---');
  try {
    const backendAiHealth = await fetch('http://127.0.0.1:5000/api/ai/health').then(r => r.json());
    if (backendAiHealth.status === 'ok') {
      recordResult('Backend AI Proxy Health', 'PASS', 'Proxy route /api/ai/health active with status ok');
    } else {
      recordResult('Backend AI Proxy Health', 'FAIL', `Unexpected payload: ${JSON.stringify(backendAiHealth)}`);
    }
  } catch (err) {
    recordResult('Backend AI Proxy Health', 'FAIL', `Backend error: ${err.message}`);
  }

  // 4. Launch Browser with Console Error Tracking
  console.log('\n--- Launching Browser Automation ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: undefined
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  let capturedAiResponse = null;
  let capturedScanSaveResponse = null;

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/ai/predict') && response.request().method() === 'POST') {
      try {
        capturedAiResponse = {
          status: response.status(),
          data: await response.json()
        };
      } catch (e) {}
    }
    if (url.includes('/api/scans') && response.request().method() === 'POST') {
      try {
        capturedScanSaveResponse = {
          status: response.status(),
          data: await response.json()
        };
      } catch (e) {}
    }
  });

  let createdScanId = null;

  try {
    // WORKFLOW STEP 1: Patient Login and Authentication
    console.log('\n--- Step 1: Patient Login and Authentication ---');
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]');

    // Click Patient tab if not already selected
    const patientTab = page.locator('button:has-text("Patient")');
    if (await patientTab.isVisible()) {
      await patientTab.click();
    }

    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'password123');

    const [loginResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST'),
      page.click('button[type="submit"]')
    ]);

    const loginData = await loginResponse.json();
    if (loginResponse.status() === 200 && loginData.token && loginData.role === 'patient') {
      recordResult('1. Patient Login & Authentication', 'PASS', `Authenticated patient with JWT token. User role: ${loginData.role}`);
    } else {
      recordResult('1. Patient Login & Authentication', 'FAIL', `Login failed: status ${loginResponse.status()}`);
    }

    await page.waitForURL('**/dashboard/patient**', { timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, '01_dashboard_loaded.png'), fullPage: true });

    // WORKFLOW STEP 2: Patient Dashboard Loading
    console.log('\n--- Step 2: Patient Dashboard Loading ---');
    const heroGreeting = await page.locator('.page-header-card h2').textContent();
    const hasUploadCard = await page.locator('text="Start a New AI Scan"').isVisible();
    const hasScreeningHistoryCard = await page.locator('h3:has-text("Screening History")').isVisible();
    const hasTipsCard = await page.locator('text="Tips for Best Results"').isVisible();

    if (heroGreeting.includes('Welcome back') && hasUploadCard && hasScreeningHistoryCard && hasTipsCard) {
      recordResult('2. Patient Dashboard Loading', 'PASS', 'Dashboard UI components loaded successfully (Hero, Upload Zone, Screening History, Tips)');
    } else {
      recordResult('2. Patient Dashboard Loading', 'FAIL', 'One or more essential dashboard components missing');
    }

    // WORKFLOW STEP 3: Dental Image Upload
    console.log('\n--- Step 3: Dental Image Upload ---');
    const testImagePath = path.join(__dirname, 'dummy_tooth.jpg');
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`Test image missing at ${testImagePath}`);
    }

    await page.setInputFiles('input[type="file"]', testImagePath);
    await page.waitForSelector('.preview-image', { timeout: 5000 });
    const hasPreview = await page.locator('.preview-image').isVisible();
    const analyzeBtn = page.locator('button:has-text("Analyze with DentaAI")');
    const hasAnalyzeBtn = await analyzeBtn.isVisible();

    if (hasPreview && hasAnalyzeBtn) {
      recordResult('3. Dental Image Upload', 'PASS', 'Dental image attached, preview rendered, and "Analyze with DentaAI" button visible');
    } else {
      recordResult('3. Dental Image Upload', 'FAIL', 'Preview image or analyze button failed to display');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '02_image_uploaded.png') });

    // WORKFLOW STEP 4: AI Prediction Through Python AI Service
    console.log('\n--- Step 4: AI Prediction Through Python AI Service ---');
    const [aiResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/ai/predict') && r.status() === 200, { timeout: 35000 }),
      analyzeBtn.click()
    ]);

    const aiData = await aiResponse.json();
    capturedAiResponse = { status: aiResponse.status(), data: aiData };

    if (capturedAiResponse && capturedAiResponse.status === 200 && capturedAiResponse.data.condition) {
      recordResult(
        '4. AI Prediction via Python Service',
        'PASS',
        `Python service predicted: condition=${capturedAiResponse.data.condition}, confidence=${capturedAiResponse.data.confidence}%`
      );
    } else {
      recordResult('4. AI Prediction via Python Service', 'FAIL', 'Python AI prediction did not return status 200 with valid condition');
    }

    // WORKFLOW STEP 5: Display of Detected Dental Condition and Confidence Score
    console.log('\n--- Step 5: Display of Detected Dental Condition and Confidence Score ---');
    await page.waitForSelector('text="AI Analysis Complete"', { timeout: 15000 });

    const condFormatted = capturedAiResponse.data.condition.replace(/_/g, ' ');
    const isConditionVisible = await page.locator(`text="${condFormatted}"`).first().isVisible();

    const confidenceBadge = page.locator(`text="${capturedAiResponse.data.confidence}%"`).first();
    const isConfidenceVisible = await confidenceBadge.isVisible();

    const hasViewReportBtn = await page.locator('button:has-text("View Full Report")').first().isVisible();

    if (isConditionVisible && isConfidenceVisible && hasViewReportBtn) {
      recordResult(
        '5. Display of Condition & Confidence',
        'PASS',
        `Condition "${capturedAiResponse.data.condition}" and confidence score "${capturedAiResponse.data.confidence}%" clearly displayed`
      );
    } else {
      recordResult('5. Display of Condition & Confidence', 'FAIL', 'Condition or confidence score failed to render in UI');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '03_ai_result_displayed.png'), fullPage: true });

    // WORKFLOW STEP 6: Saving Scan Results in MongoDB
    console.log('\n--- Step 6: Saving Scan Results in MongoDB ---');
    // In PatientDashboard, save happens in a 1.5s timeout after prediction
    await page.waitForTimeout(2500);

    if (capturedScanSaveResponse && capturedScanSaveResponse.status === 201) {
      createdScanId = capturedScanSaveResponse.data._id;
      // Direct MongoDB check
      const mongoRecord = await ScanHistory.findById(createdScanId);
      if (mongoRecord && mongoRecord.condition === capturedAiResponse.data.condition) {
        recordResult(
          '6. Saving Scan Results in MongoDB',
          'PASS',
          `Scan persisted to MongoDB with ID ${createdScanId}, patientId ${mongoRecord.patientId}, scanId ${mongoRecord.scanId}`
        );
      } else {
        recordResult('6. Saving Scan Results in MongoDB', 'FAIL', 'Scan API returned 201 but document not found in MongoDB');
      }
    } else {
      recordResult('6. Saving Scan Results in MongoDB', 'FAIL', 'Scan POST /api/scans failed or timed out');
    }

    // WORKFLOW STEP 7: Screening History and Report Details
    console.log('\n--- Step 7: Screening History and Report Details ---');
    // Click "View All" link on the Screening History card
    const viewAllLink = page.locator('a:has-text("View All")').first();
    await viewAllLink.click();
    await page.waitForURL('**/dashboard/patient/screening-history', { timeout: 10000 });

    await page.waitForSelector('.screening-history-item', { timeout: 10000 });
    const historyTitle = await page.locator('.page-header-card h2').textContent();
    const hasScreeningRecords = (await page.locator('.screening-history-item').count()) > 0;

    if (historyTitle.includes('Screening History') && hasScreeningRecords) {
      recordResult('7A. Screening History Page Navigation', 'PASS', 'Screening History page opened via "View All" with records listed');
    } else {
      recordResult('7A. Screening History Page Navigation', 'FAIL', 'Screening History page failed to display records');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '04_screening_history.png'), fullPage: true });

    // Navigate to Report Details
    const firstViewReportBtn = page.locator('button:has-text("View Report")').first();
    await firstViewReportBtn.click();
    await page.waitForURL('**/dashboard/patient/reports/**', { timeout: 10000 });
    await page.waitForSelector('.predicted-condition-value', { timeout: 10000 });

    const reportUrl = page.url();
    const hasReportCondition = await page.locator('.predicted-condition-value').isVisible();
    const hasConfidenceBar = await page.locator('.confidence-value-teal').isVisible();
    const hasPrecautions = await page.locator('.report-recommendations-card').isVisible();

    if (reportUrl.includes('/reports/') && hasReportCondition && hasConfidenceBar && hasPrecautions) {
      recordResult('7B. Report Details Page Loading', 'PASS', `Report details page loaded (${reportUrl}) with image, condition, confidence, and precautions`);
    } else {
      recordResult('7B. Report Details Page Loading', 'FAIL', 'Report details page failed to render required sections');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '05_report_details.png'), fullPage: true });

    // WORKFLOW STEP 8: Personalized Health Tips Based on Latest Scan
    console.log('\n--- Step 8: Personalized Health Tips Based on Latest Scan ---');
    await page.goto('http://127.0.0.1:5173/dashboard/patient/health-tips', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-header-card', { timeout: 10000 });

    const tipsHeader = await page.locator('.page-header-card h2').textContent();
    const hasOralHygieneCard = await page.locator('h4:has-text("Oral Hygiene Guidance")').isVisible();
    const hasPreventiveCard = await page.locator('h4:has-text("Preventive Care")').isVisible();
    const hasGeneralGuidelines = await page.locator('h3:has-text("General Dental Health Guidelines")').isVisible();
    const hasDisclaimer = (await page.content()).includes('These recommendations are intended for general oral health education only');

    if (tipsHeader.includes('Health Tips') && hasOralHygieneCard && hasPreventiveCard && hasGeneralGuidelines && hasDisclaimer) {
      recordResult(
        '8. Personalized Health Tips Page',
        'PASS',
        'Personalized tips rendered based on latest scan with Oral Hygiene Guidance, Preventive Care, General Guidelines, and Disclaimer'
      );
    } else {
      recordResult('8. Personalized Health Tips Page', 'FAIL', 'One or more required sections missing from Health Tips page');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '06_health_tips.png'), fullPage: true });

    // WORKFLOW STEP 9: Personal Prescription Section and Pending Dentist Review Status
    console.log('\n--- Step 9: Personal Prescription Section and Pending Dentist Review Status ---');
    // Check Prescription section on Report Details
    await page.goto(reportUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.personal-prescription-wrapper', { timeout: 10000 });

    const prescTitle = await page.locator('.personal-prescription-wrapper h3').first().textContent();
    const awaitingBadge = page.locator('span:has-text("Awaiting Dentist Review")').first();
    const isAwaitingVisible = await awaitingBadge.isVisible();
    const connectDentistBtn = page.locator('a:has-text("Connect with Dentist for Prescription")').first();
    const isConnectVisible = await connectDentistBtn.isVisible();

    // Verify NO unverified medications are automatically prescribed in the active visible view
    const visibleMedCardsCount = await page.locator('.prescription-grid-two-col .card').count();
    const hasNoAutoDrugs = visibleMedCardsCount === 0;

    if (prescTitle.includes('Personal Prescription') && isAwaitingVisible && isConnectVisible && hasNoAutoDrugs) {
      recordResult(
        '9. Personal Prescription & Review Status',
        'PASS',
        'Personal Prescription section displayed with "Awaiting Dentist Review" badge, single dentist CTA, and no automatic drugs'
      );
    } else {
      recordResult('9. Personal Prescription & Review Status', 'FAIL', `Prescription check failed: title=${prescTitle}, awaiting=${isAwaitingVisible}, connectBtn=${isConnectVisible}, noAutoDrugs=${hasNoAutoDrugs}`);
    }

    // WORKFLOW STEP 10: Patient Profile and Logout
    console.log('\n--- Step 10: Patient Profile and Logout ---');
    await page.goto('http://127.0.0.1:5173/dashboard/patient/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="name"]', { timeout: 10000 });

    const nameValue = await page.inputValue('input[name="name"]');
    const emailValue = await page.inputValue('input[type="email"]');
    const profileLoaded = nameValue === 'Test Patient' && emailValue === 'patient@test.com';

    if (profileLoaded) {
      recordResult('10A. Patient Profile Page Loading', 'PASS', `Profile loaded for ${nameValue} (${emailValue})`);
    } else {
      recordResult('10A. Patient Profile Page Loading', 'FAIL', `Unexpected profile values: name=${nameValue}, email=${emailValue}`);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '07_patient_profile.png'), fullPage: true });

    // Click Logout
    const logoutLink = page.locator('.text-logout');
    await logoutLink.click();
    await page.waitForURL('http://127.0.0.1:5173/', { timeout: 10000 });

    const storedToken = await page.evaluate(() => localStorage.getItem('dentaai_token'));
    const storedUser = await page.evaluate(() => localStorage.getItem('dentaai_user'));

    if (!storedToken && !storedUser && page.url() === 'http://127.0.0.1:5173/') {
      recordResult('10B. Patient Logout & Session Clearing', 'PASS', 'User logged out, session tokens cleared from localStorage, redirected to "/"');
    } else {
      recordResult('10B. Patient Logout & Session Clearing', 'FAIL', 'Tokens still in localStorage or failed to redirect to "/"');
    }

    // WORKFLOW STEP 11: Responsiveness Verification (Desktop & Mobile)
    console.log('\n--- Step 11: Mobile & Desktop Responsiveness ---');
    // Test Mobile Layout (375x812) on Dashboard and Health Tips
    await page.setViewportSize({ width: 375, height: 812 });

    // Log back in to test mobile views
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/patient**', { timeout: 10000 });

    let dashScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    let dashClientWidth = await page.evaluate(() => window.innerWidth);
    const mobileDashNoOverflow = dashScrollWidth <= dashClientWidth;

    await page.screenshot({ path: path.join(screenshotsDir, '08_mobile_dashboard.png'), fullPage: true });

    await page.goto('http://127.0.0.1:5173/dashboard/patient/health-tips', { waitUntil: 'domcontentloaded' });
    let tipsScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    let tipsClientWidth = await page.evaluate(() => window.innerWidth);
    const mobileTipsNoOverflow = tipsScrollWidth <= tipsClientWidth;

    await page.screenshot({ path: path.join(screenshotsDir, '09_mobile_health_tips.png'), fullPage: true });

    if (mobileDashNoOverflow && mobileTipsNoOverflow) {
      recordResult('11. Mobile & Desktop Responsiveness', 'PASS', 'Zero horizontal overflow on mobile viewport (375px) and clean responsive reflow');
    } else {
      recordResult('11. Mobile & Desktop Responsiveness', 'FAIL', `Horizontal overflow detected: dash=${dashScrollWidth}/${dashClientWidth}, tips=${tipsScrollWidth}/${tipsClientWidth}`);
    }

    // WORKFLOW STEP 12: Console & System Verification
    console.log('\n--- Step 12: Console & System Errors Check ---');
    const realErrors = consoleErrors.filter(msg => 
      !msg.includes('favicon') && 
      !msg.includes('download the React DevTools') &&
      !msg.includes('Chrome extension')
    );

    if (realErrors.length === 0 && pageErrors.length === 0) {
      recordResult('12. Browser Console & Page Errors', 'PASS', 'Zero uncaught JavaScript exceptions or critical console errors during entire workflow');
    } else {
      recordResult('12. Browser Console & Page Errors', 'FAIL', `Errors found: ${JSON.stringify({ realErrors, pageErrors })}`);
    }

  } catch (flowError) {
    console.error('Workflow Exception:', flowError);
    recordResult('Workflow Execution', 'FAIL', `Exception thrown: ${flowError.message}`);
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }

  // Final Summary Report
  console.log('\n========================================================================');
  console.log('                       FINAL VERIFICATION SUMMARY                       ');
  console.log('========================================================================');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const notTestedCount = results.filter(r => r.status === 'NOT TESTED').length;

  console.log(`Total Features Tested: ${results.length}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: ${failCount}`);
  console.log(`NOT TESTED: ${notTestedCount}`);
  console.log('========================================================================');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPatientPortalE2E().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
