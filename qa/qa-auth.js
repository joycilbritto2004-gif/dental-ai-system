const { chromium } = require('playwright');

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
    // 1. Wrong patient password
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForSelector('text="Invalid credentials"', { timeout: 3000 });
      report('Wrong patient password', true);
    } catch (e) {
      try {
        await page.waitForSelector('text="Invalid email or password"', { timeout: 1000 });
        report('Wrong patient password', true);
      } catch(e2) {
        if (page.url().includes('dashboard')) {
          report('Wrong patient password', false, 'Allowed login with wrong password!');
        } else {
          report('Wrong patient password', false, 'No error message shown, but did not login.');
        }
      }
    }

    // 2. Wrong doctor password
    await page.fill('input[type="email"]', 'priya.menon@dentaai.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForSelector('text="Invalid credentials"', { timeout: 3000 });
      report('Wrong doctor password', true);
    } catch (e) {
      try {
        await page.waitForSelector('text="Invalid email or password"', { timeout: 1000 });
        report('Wrong doctor password', true);
      } catch (e2) {
        if (page.url().includes('dashboard')) {
          report('Wrong doctor password', false, 'Allowed login with wrong password!');
        } else {
          report('Wrong doctor password', false, 'No error message shown, but did not login.');
        }
      }
    }

    // 3. Access patient dashboard while logged out
    await page.goto('http://localhost:5173/dashboard/patient');
    await page.waitForTimeout(1000);
    if (!page.url().includes('login')) {
      report('Access patient dashboard while logged out', false, 'Did not redirect to login. URL: ' + page.url());
    } else {
      report('Access patient dashboard while logged out', true);
    }

    // 4. Access doctor dashboard while logged out
    await page.goto('http://localhost:5173/dashboard/doctor');
    await page.waitForTimeout(1000);
    if (!page.url().includes('login')) {
      report('Access doctor dashboard while logged out', false, 'Did not redirect to login. URL: ' + page.url());
    } else {
      report('Access doctor dashboard while logged out', true);
    }

    // 5. Verify unauthorized users cannot access the other role's protected pages
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/patient');
    
    // Now logged in as patient, try to access doctor dashboard
    await page.goto('http://localhost:5173/dashboard/doctor');
    await page.waitForTimeout(1000);
    // It should redirect away or show unauthorized
    if (page.url().includes('dashboard/doctor')) {
      // Check if it renders
      const text = await page.locator('body').textContent();
      if (text.includes('Doctor Analytics') || text.includes('Active Patient Queue')) {
        report('Unauthorized role access (Patient -> Doctor)', false, 'Patient can view Doctor dashboard!');
      } else if (text.includes('Unauthorized') || text.includes('Access Denied') || text.includes('Not Found') || text.includes('Dashboard')) {
        report('Unauthorized role access (Patient -> Doctor)', true);
      } else {
        report('Unauthorized role access (Patient -> Doctor)', false, 'Page loaded without explicit Unauthorized message, but maybe blank?');
      }
    } else {
       report('Unauthorized role access (Patient -> Doctor)', true);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed = true;
  } finally {
    await browser.close();
    process.exit(failed ? 1 : 0);
  }
})();
