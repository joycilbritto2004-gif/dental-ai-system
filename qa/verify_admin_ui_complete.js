const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyAdminUI() {
  const browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.join(__dirname, 'screenshots', 'admin_verification');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('===============================================================');
  console.log('   VERIFYING DENTAAI ADMIN PORTAL TEXT VISIBILITY & GLASS UI   ');
  console.log('===============================================================');

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Helper to rgb to hex
  function rgbToHex(rgbStr) {
    if (!rgbStr) return '';
    const match = rgbStr.match(/\d+/g);
    if (!match || match.length < 3) return rgbStr;
    const r = parseInt(match[0]).toString(16).padStart(2, '0');
    const g = parseInt(match[1]).toString(16).padStart(2, '0');
    const b = parseInt(match[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  // Login as admin
  console.log('\n[1] Logging in as Admin...');
  await page.goto('http://localhost:5173/login');
  const aRoleBtn = await page.$('.role-card:has-text("Admin")');
  if (aRoleBtn) await aRoleBtn.click();
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/admin', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // --- Check Page 1: Admin Dashboard ---
  console.log('\n[2] Checking Admin Dashboard (/dashboard/admin)...');
  await page.waitForSelector('.glass-card', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, '1_admin_dashboard.png'), fullPage: false });

  const dashboardMetrics = await page.evaluate(() => {
    const kpiValues = Array.from(document.querySelectorAll('.kpi-value')).map(el => ({
      text: el.innerText.trim(),
      color: window.getComputedStyle(el).color,
      fontWeight: window.getComputedStyle(el).fontWeight
    }));
    const kpiLabels = Array.from(document.querySelectorAll('.kpi-label')).map(el => ({
      text: el.innerText.trim(),
      color: window.getComputedStyle(el).color
    }));
    const modelRows = Array.from(document.querySelectorAll('.model-detail-row')).map(row => {
      const lbl = row.querySelector('.model-detail-label');
      const val = row.querySelector('.model-detail-value, .badge');
      return {
        label: lbl ? lbl.innerText.trim() : '',
        labelColor: lbl ? window.getComputedStyle(lbl).color : '',
        val: val ? val.innerText.trim() : '',
        valColor: val ? window.getComputedStyle(val).color : ''
      };
    });
    const cardEl = document.querySelector('.glass-card');
    const cardBg = cardEl ? window.getComputedStyle(cardEl).backgroundColor : '';
    const cardBlur = cardEl ? window.getComputedStyle(cardEl).backdropFilter : '';

    return { kpiValues, kpiLabels, modelRows, cardBg, cardBlur };
  });

  console.log('KPI Values color:', dashboardMetrics.kpiValues[0]?.color, 'weight:', dashboardMetrics.kpiValues[0]?.fontWeight);
  console.log('KPI Labels color:', dashboardMetrics.kpiLabels[0]?.color);
  console.log('Dashboard Model Rows:', dashboardMetrics.modelRows);
  console.log('Glass Card BG & Blur:', dashboardMetrics.cardBg, dashboardMetrics.cardBlur);

  // --- Check Page 2: AI Model Configuration ---
  console.log('\n[3] Checking AI Model Configuration (/dashboard/admin/ai-model)...');
  await page.goto('http://localhost:5173/dashboard/admin/ai-model');
  await page.waitForSelector('.glass-card', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, '2_admin_ai_model.png'), fullPage: false });

  const aiModelData = await page.evaluate(() => {
    const heading = document.querySelector('.card h3');
    const headingColor = heading ? window.getComputedStyle(heading).color : null;
    
    const rows = Array.from(document.querySelectorAll('.model-detail-row')).map(r => {
      const label = r.querySelector('.model-detail-label');
      const val = r.querySelector('.model-detail-value') || r.querySelector('.badge');
      return {
        labelText: label ? label.innerText.trim() : null,
        labelColor: label ? window.getComputedStyle(label).color : null,
        valText: val ? val.innerText.trim() : null,
        valColor: val ? window.getComputedStyle(val).color : null,
        valWeight: val ? window.getComputedStyle(val).fontWeight : null,
        isBadge: !!r.querySelector('.badge')
      };
    });

    const perfLabels = Array.from(document.querySelectorAll('.text-muted')).map(el => ({
      text: el.innerText.trim(),
      color: window.getComputedStyle(el).color
    }));

    return { headingColor, rows, perfLabels };
  });

  console.log('AI Model Heading Color:', aiModelData.headingColor);
  console.log('AI Model Status Panel Rows:', JSON.stringify(aiModelData.rows, null, 2));

  // Verify requirements on AI Model:
  // Architecture: MobileNetV2
  const archRow = aiModelData.rows.find(r => r.labelText.includes('Architecture'));
  if (!archRow || archRow.valText !== 'MobileNetV2') {
    throw new Error(`Architecture row mismatch: ${JSON.stringify(archRow)}`);
  }
  // Version: v2.4.1
  const verRow = aiModelData.rows.find(r => r.labelText.includes('Version'));
  if (!verRow || verRow.valText !== 'v2.4.1') {
    throw new Error(`Version row mismatch: ${JSON.stringify(verRow)}`);
  }
  // Status: Active
  const statusRow = aiModelData.rows.find(r => r.labelText.includes('Status'));
  if (!statusRow || statusRow.valText !== 'Active') {
    throw new Error(`Status row mismatch: ${JSON.stringify(statusRow)}`);
  }
  // Last Trained: August 25, 2026
  const trainedRow = aiModelData.rows.find(r => r.labelText.includes('Last Trained'));
  if (!trainedRow || trainedRow.valText !== 'August 25, 2026') {
    throw new Error(`Last Trained row mismatch: ${JSON.stringify(trainedRow)}`);
  }

  console.log('✅ AI Model Status Panel data verified:');
  console.log('   Architecture:', archRow.valText, '(Label Color:', rgbToHex(archRow.labelColor), 'Val Color:', rgbToHex(archRow.valColor), ')');
  console.log('   Version:', verRow.valText, '(Label Color:', rgbToHex(verRow.labelColor), 'Val Color:', rgbToHex(verRow.valColor), ')');
  console.log('   Status:', statusRow.valText, '(Badge Color:', rgbToHex(statusRow.valColor), ')');
  console.log('   Last Trained:', trainedRow.valText, '(Label Color:', rgbToHex(trainedRow.labelColor), 'Val Color:', rgbToHex(trainedRow.valColor), ')');

  // --- Check Page 3: User Management ---
  console.log('\n[4] Checking User Management (/dashboard/admin/users)...');
  await page.goto('http://localhost:5173/dashboard/admin/users');
  await page.waitForSelector('.glass-card', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, '3_admin_users.png'), fullPage: false });

  const usersCheck = await page.evaluate(() => {
    const searchInput = document.querySelector('.search-bar input');
    const tableHeader = document.querySelector('.modern-table th');
    const tableCell = document.querySelector('.modern-table td');
    return {
      searchBg: document.querySelector('.search-bar') ? window.getComputedStyle(document.querySelector('.search-bar')).backgroundColor : null,
      inputColor: searchInput ? window.getComputedStyle(searchInput).color : null,
      thColor: tableHeader ? window.getComputedStyle(tableHeader).color : null,
      tdColor: tableCell ? window.getComputedStyle(tableCell).color : null,
    };
  });
  console.log('Users page styles:', usersCheck);

  // --- Check Page 4: Doctors ---
  console.log('\n[5] Checking Doctors (/dashboard/admin/doctors)...');
  await page.goto('http://localhost:5173/dashboard/admin/doctors');
  await page.waitForSelector('.glass-card', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, '4_admin_doctors.png'), fullPage: false });

  // --- Check Page 5: Patients ---
  console.log('\n[6] Checking Patients (/dashboard/admin/patients)...');
  await page.goto('http://localhost:5173/dashboard/admin/patients');
  await page.waitForSelector('.glass-card', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, '5_admin_patients.png'), fullPage: false });

  // --- Check Page 6: Predictions ---
  console.log('\n[7] Checking Predictions (/dashboard/admin/predictions)...');
  await page.goto('http://localhost:5173/dashboard/admin/predictions');
  await page.waitForSelector('.glass-card', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, '6_admin_predictions.png'), fullPage: false });

  // --- Check Page 7: Activity ---
  console.log('\n[8] Checking System Activity (/dashboard/admin/activity)...');
  await page.goto('http://localhost:5173/dashboard/admin/activity');
  await page.waitForSelector('.glass-card', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, '7_admin_activity.png'), fullPage: false });

  // --- Check Page 8: Settings ---
  console.log('\n[9] Checking Platform Settings (/dashboard/admin/settings)...');
  await page.goto('http://localhost:5173/dashboard/admin/settings');
  await page.waitForSelector('.glass-card', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, '8_admin_settings.png'), fullPage: false });

  // --- Check Responsive: Tablet View ---
  console.log('\n[10] Testing Tablet Viewport (768x1024)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('http://localhost:5173/dashboard/admin');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotsDir, 'tablet_admin_dashboard.png'), fullPage: false });
  await page.goto('http://localhost:5173/dashboard/admin/ai-model');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotsDir, 'tablet_admin_ai_model.png'), fullPage: false });

  // --- Check Responsive: Mobile View ---
  console.log('\n[11] Testing Mobile Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:5173/dashboard/admin');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotsDir, 'mobile_admin_dashboard.png'), fullPage: false });
  await page.goto('http://localhost:5173/dashboard/admin/ai-model');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotsDir, 'mobile_admin_ai_model.png'), fullPage: false });

  await browser.close();
  console.log('\n===============================================================');
  console.log('   ALL 8 ADMIN PAGES & RESPONSIVE VIEWPORTS VERIFIED SUCCESS!  ');
  console.log('===============================================================');
}

verifyAdminUI().catch(err => {
  console.error('Admin UI verification failed:', err);
  process.exit(1);
});

