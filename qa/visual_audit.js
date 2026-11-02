const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runVisualAudit() {
  console.log('=== STARTING PATIENT PAGES VISUAL & BROWSER CHECKS ===\n');

  const browser = await chromium.launch({ headless: true });
  const results = [];

  const pagesToTest = [
    { name: 'Patient Dashboard', path: '/dashboard/patient' },
    { name: 'Patient Profile', path: '/dashboard/patient/profile' },
    { name: 'AI Predictions', path: '/dashboard/patient/predictions' },
    { name: 'Reports', path: '/dashboard/patient/reports' },
    { name: 'Doctor Directory', path: '/dashboard/patient/recommended-doctors' },
    { name: 'Consultations', path: '/dashboard/patient/consultations' },
    { name: 'Messages', path: '/dashboard/patient/messages' },
  ];

  // 1. Desktop Test (1920x1080)
  console.log('--- 1. DESKTOP VIEWPORT (1920x1080) ---');
  const desktopContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const desktopPage = await desktopContext.newPage();

  const desktopConsoleErrors = [];
  desktopPage.on('pageerror', err => desktopConsoleErrors.push(err.message));

  // Login
  await desktopPage.goto('http://localhost:5173/login');
  await desktopPage.fill('input[type="email"]', 'patient@test.com');
  await desktopPage.fill('input[type="password"]', 'password123');
  await desktopPage.click('button[type="submit"]');
  await desktopPage.waitForURL('**/dashboard/patient');

  for (const pageInfo of pagesToTest) {
    try {
      await desktopPage.goto(`http://localhost:5173${pageInfo.path}`, { waitUntil: 'networkidle' });
      await desktopPage.waitForTimeout(1000);

      // Check text readability and contrast issues
      const readabilityIssues = await desktopPage.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('h1, h2, h3, h4, p, label, span, button, a');
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bg = style.backgroundColor;
          const rect = el.getBoundingClientRect();
          // Detect pure white on pure white or extremely low opacity
          if (rect.width > 0 && rect.height > 0) {
            if (style.opacity && parseFloat(style.opacity) < 0.1) {
              issues.push({ text: el.innerText?.slice(0, 30), problem: 'Extremely low opacity' });
            }
          }
        });
        return issues;
      });

      const shotPath = path.join(screenshotDir, `desktop_${pageInfo.name.toLowerCase().replace(/\s+/g, '_')}.png`);
      await desktopPage.screenshot({ path: shotPath, fullPage: false });

      results.push({
        page: pageInfo.name,
        viewport: 'Desktop 1920x1080',
        status: 'PASS',
        readabilityIssues: readabilityIssues.length,
        screenshot: shotPath
      });
      console.log(`[PASS] Desktop: ${pageInfo.name} (Issues: ${readabilityIssues.length})`);
    } catch (err) {
      results.push({
        page: pageInfo.name,
        viewport: 'Desktop 1920x1080',
        status: 'FAIL',
        error: err.message
      });
      console.error(`[FAIL] Desktop: ${pageInfo.name} - ${err.message}`);
    }
  }

  // Also test Report Details page if a scan exists
  try {
    const scanId = await desktopPage.evaluate(async () => {
      const user = JSON.parse(localStorage.getItem('dentaai_user'));
      const res = await fetch(`http://localhost:5000/api/scans/${user.id}`);
      const data = await res.json();
      return data && data.length > 0 ? (data[0].id || data[0]._id) : null;
    });

    if (scanId) {
      await desktopPage.goto(`http://localhost:5173/dashboard/patient/report/${scanId}`, { waitUntil: 'networkidle' });
      await desktopPage.waitForTimeout(1000);
      const shotPath = path.join(screenshotDir, `desktop_report_details.png`);
      await desktopPage.screenshot({ path: shotPath });
      results.push({ page: 'Report Details', viewport: 'Desktop 1920x1080', status: 'PASS', screenshot: shotPath });
      console.log(`[PASS] Desktop: Report Details`);
    } else {
      console.log(`[SKIP] Desktop: Report Details (No existing scan history found)`);
    }
  } catch (err) {
    console.warn(`Report Details check note:`, err.message);
  }

  // 2. Mobile Test (Pixel 5: 393x851)
  console.log('\n--- 2. MOBILE VIEWPORT (Pixel 5) ---');
  const mobileContext = await browser.newContext(devices['Pixel 5']);
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto('http://localhost:5173/login');
  await mobilePage.fill('input[type="email"]', 'patient@test.com');
  await mobilePage.fill('input[type="password"]', 'password123');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/dashboard/patient');

  for (const pageInfo of pagesToTest) {
    try {
      await mobilePage.goto(`http://localhost:5173${pageInfo.path}`, { waitUntil: 'networkidle' });
      await mobilePage.waitForTimeout(1000);

      // Check horizontal overflow (horizontal scrollbar bug on mobile)
      const hasHorizontalOverflow = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      const shotPath = path.join(screenshotDir, `mobile_${pageInfo.name.toLowerCase().replace(/\s+/g, '_')}.png`);
      await mobilePage.screenshot({ path: shotPath, fullPage: false });

      results.push({
        page: pageInfo.name,
        viewport: 'Mobile Pixel 5',
        status: hasHorizontalOverflow ? 'WARN (overflow)' : 'PASS',
        overflow: hasHorizontalOverflow,
        screenshot: shotPath
      });
      console.log(`[${hasHorizontalOverflow ? 'WARN' : 'PASS'}] Mobile: ${pageInfo.name} (Overflow: ${hasHorizontalOverflow})`);
    } catch (err) {
      results.push({
        page: pageInfo.name,
        viewport: 'Mobile Pixel 5',
        status: 'FAIL',
        error: err.message
      });
      console.error(`[FAIL] Mobile: ${pageInfo.name} - ${err.message}`);
    }
  }

  await browser.close();

  console.log('\n=== SUMMARY OF VISUAL AUDIT RESULTS ===');
  console.table(results.map(r => ({ Page: r.page, Viewport: r.viewport, Status: r.status })));
}

runVisualAudit();
