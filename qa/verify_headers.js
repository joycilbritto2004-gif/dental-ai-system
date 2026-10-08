const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let headerFound = false;
  
  page.on('request', request => {
    if (request.url().includes('/api/consultations')) {
      const headers = request.headers();
      if (headers['authorization'] && headers['authorization'].startsWith('Bearer ')) {
        headerFound = true;
        console.log(`✅ Success: Found Authorization header for ${request.url()}`);
      }
    }
  });

  await page.goto('http://localhost:5173/login');
  
  // Login as Patient
  await page.click('text=Patient');
  await page.fill('input[type="email"]', 'patient@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard and API calls
  await page.waitForURL('**/dashboard/patient*');
  // Wait a bit for fetches to happen
  await page.waitForTimeout(2000);

  if (headerFound) {
    console.log('Test PASSED: Authorization header is successfully attached.');
  } else {
    console.error('Test FAILED: Authorization header was not found.');
  }

  await browser.close();
})();
