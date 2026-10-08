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

    // 1. Upload a non-image file (.txt)
    const filePath = path.join(__dirname, 'dummy_invalid.txt');
    await page.setInputFiles('input[type="file"]', filePath);
    
    // Attempt to click Analyze with DentaAI if visible, or wait for error
    try {
      await page.waitForSelector('text="Analyze with DentaAI"', { timeout: 2000 });
      
      // Wait for response from API
      const apiPromise = page.waitForResponse(r => r.url().includes('/api/ai/predict'));
      
      await page.locator('text="Analyze with DentaAI"').click();
      
      const res = await apiPromise;
      if (!res.ok()) {
        const err = await res.text();
        console.log('API returned error:', res.status(), err);
        // Wait for UI error message
        await page.waitForTimeout(1000);
        const errorMsg = await page.waitForSelector('.alert-danger, text="Failed to connect", text="Allowed file types"', { timeout: 3000 }).catch(() => null);
        if (errorMsg) {
          const text = await errorMsg.textContent();
          report('Upload non-image file', true, `Caught error message on UI: ${text}`);
        } else {
          const bodyText = await page.locator('body').textContent();
          if (bodyText.includes('Allowed file types')) {
             report('Upload non-image file', true, `Caught error in body: Allowed file types`);
          } else {
             report('Upload non-image file', false, 'API returned error, but UI did not show an error message.');
          }
        }
      } else {
        report('Upload non-image file', false, 'API returned 200 OK for a .txt file!');
      }
    } catch (e) {
      // Maybe the UI rejects it instantly without needing to click Analyze with DentaAI
      const pageText = await page.locator('body').textContent();
      if (pageText.toLowerCase().includes('error') || pageText.toLowerCase().includes('invalid')) {
        report('Upload non-image file (instant)', true, 'Instant error caught on UI.');
      } else {
        report('Upload non-image file', false, 'File uploaded, but no "Analyze with DentaAI" button, and no error message.');
      }
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed = true;
  } finally {
    await browser.close();
    process.exit(failed ? 1 : 0);
  }
})();
