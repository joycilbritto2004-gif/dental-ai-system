const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let failed = false;

  const report = (name, pass, details) => {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
    if (!pass) {
      console.log(`  Details: ${details}`);
      failed = true;
    }
  };

  try {
    console.log('Logging in as Patient...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/patient');

    // Upload valid image
    const filePath = path.join(__dirname, 'dummy_tooth.jpg');
    await page.setInputFiles('input[type="file"]', filePath);
    
    await page.waitForSelector('text="Analyze with DentaAI"', { timeout: 2000 });
    
    const apiPromise = page.waitForResponse(r => r.url().includes('/api/ai/predict') && r.request().method() === 'POST');
    
    await page.locator('text="Analyze with DentaAI"').click();
    
    const res = await apiPromise;
    if (res.ok()) {
      const data = await res.json();
      if (data.condition === 'Mouth_Ulcer' && data.confidence > 90) {
        report('Valid image upload', true, `Condition: ${data.condition}, Confidence: ${data.confidence}`);
        // Wait for UI to show prediction
        await page.waitForSelector('text="AI Analysis Complete"');
        report('Valid image upload UI', true);
      } else {
        report('Valid image upload', false, `Wrong prediction: ${JSON.stringify(data)}`);
      }
    } else {
      report('Valid image upload', false, `API returned error: ${res.status()}`);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed = true;
  } finally {
    await browser.close();
    process.exit(failed ? 1 : 0);
  }
})();
