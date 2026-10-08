const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 2304, height: 1094 });
  
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'doctor@test.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.goto('http://localhost:5173/dashboard/doctor/profile', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'C:\\Users\\britt\\.gemini\\antigravity-ide\\brain\\2dadbca0-e72f-4336-a106-d1483e6488b4\\screenshot_doctor_profile.png', fullPage: true });
    console.log('Screenshot saved');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
