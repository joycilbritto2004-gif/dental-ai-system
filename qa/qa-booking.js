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
    console.log('Logging in as Patient...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/patient');
    console.log('Navigating to Find Doctor...');
    
    // Go to recommended doctors
    await page.goto('http://localhost:5173/dashboard/patient/recommended-doctors');
    // Wait for doctor cards to load
    await page.waitForSelector('text="Dr. Priya Menon"');
    
    // Click View Profile on Dr. Priya Menon's card
    const doctorCard = page.locator('.card', { hasText: 'Dr. Priya Menon' });
    await doctorCard.locator('text="View Profile"').click();
    
    await page.waitForURL('**/dashboard/patient/doctor/*');
    
    // Click Request Consultation
    await page.locator('a[href*="/consult-request/"]').first().click();
    await page.waitForURL(/\/dashboard\/patient\/consult-request\/.*/);
    
    // Choose Text/Chat
    await page.click('text="Text / Chat"');
    
    // Fill Date / Time
    await page.fill('input[type="date"]', '2026-10-01');
    await page.fill('input[type="time"]', '10:00');
    
    // Check amounts
    const doctorFeeText = await page.locator('span:has-text("Doctor Fee") + span').first().textContent();
    const platformFeeText = await page.locator('span:has-text("Platform Fee") + span').first().textContent();
    const totalAmountText = await page.locator('span:has-text("Total Amount") + span').first().textContent();
    
    console.log(`Doctor Fee: ${doctorFeeText}`);
    console.log(`Platform Fee: ${platformFeeText}`);
    console.log(`Total Amount: ${totalAmountText}`);
    
    report('Verify Doctor Fee', doctorFeeText === '₹500', `Expected ₹500, got ${doctorFeeText}`);
    report('Verify Platform Fee', platformFeeText === '₹49', `Expected ₹49, got ${platformFeeText}`);
    report('Verify Total Amount', totalAmountText === '₹549', `Expected ₹549, got ${totalAmountText}`);
    
    // Proceed to Payment
    await page.click('button:has-text("Proceed to Secure Payment")');
    await page.waitForURL('**/dashboard/patient/payment/checkout');
    
    report('Proceed to payment', true, 'Navigated successfully');

  } catch (err) {
    console.error('Test execution error:', err);
    failed = true;
  } finally {
    await browser.close();
    process.exit(failed ? 1 : 0);
  }
})();
