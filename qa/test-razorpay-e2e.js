const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
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
    console.log('--- STARTING RAZORPAY E2E TEST ---');

    console.log('1. Logging in as Patient...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/patient');
    report('Patient Login', true, 'Success');

    console.log('2. Requesting Consultation with Dr. Priya Menon...');
    await page.goto('http://localhost:5173/dashboard/patient/recommended-doctors');
    await page.waitForSelector('text="Dr. Priya Menon"');
    const doctorCard = page.locator('.card', { hasText: 'Dr. Priya Menon' }).first();
    await doctorCard.locator('text="View Profile"').click();
    await page.waitForURL('**/dashboard/patient/doctor/*');
    
    // Choose consultation details
    await page.locator('a[href*="/consult-request/"]').first().click();
    await page.waitForURL(/\/dashboard\/patient\/consult-request\/.*/);
    await page.click('text="Text / Chat"');
    await page.fill('input[type="date"]', '2027-10-01');
    await page.fill('input[type="time"]', '10:00');
    
    await page.click('button:has-text("Proceed to Secure Payment")');
    await page.waitForURL('**/dashboard/patient/payment/checkout');
    report('Proceed to Secure Checkout', true, 'Success');

    console.log('3. Interacting with Razorpay Widget...');
    
    // Intercept create order
    const orderPromise = page.waitForResponse(r => r.url().includes('/api/payment/create-order') && r.request().method() === 'POST');

    // Fill in required form field (UPI ID is default method)
    await page.fill('input[placeholder="username@upi"]', 'test@upi');

    // Click "Pay Securely"
    await page.click('button:has-text("Pay Securely")');

    // Wait for the create order backend call to succeed
    const orderRes = await orderPromise;
    report('Backend Create Order', orderRes.ok(), `HTTP ${orderRes.status()}`);
    
    // Wait for the Razorpay Iframe to appear
    console.log('Waiting for Razorpay iframe...');
    const iframeElement = await page.waitForSelector('.razorpay-checkout-frame', { state: 'attached', timeout: 15000 });
    report('Razorpay Widget Opened', !!iframeElement, 'Iframe loaded successfully');

    // Due to the complexity and cross-origin security of the Razorpay iframe,
    // attempting to automate clicking inside the iframe (Test cards/Netbanking) often fails in Playwright 
    // because Razorpay dynamically obfuscates elements and opens popups.
    // However, we will use page.evaluate to trigger the success handler directly, 
    // simulating a successful payment from the Razorpay API to test the backend verification!
    
    console.log('4. Simulating Razorpay Success Callback (Backend Signature Verification)...');
    
    // We will evaluate a mock script inside the page to call the Razorpay handler
    // Wait, the Razorpay handler is passed in options. We can intercept the /verify network call
    // by triggering the global Razorpay if we saved it, but we didn't. 
    // Instead of automating the iframe, let's manually trigger the verification using fetch on the page context 
    // because interacting with the iframe cross-origin is extremely brittle.
    // Wait, the instructions say: "Complete a test payment using Razorpay's official test payment methods."
    
    // Find the Razorpay frame by URL
    const frame = page.frames().find(f => f.url().includes('api.razorpay.com'));
    if (!frame) {
      throw new Error('Razorpay frame not found by URL');
    }

    try {
      // Razorpay uses dynamic classes, but typically has a "Netbanking" button or a generic bank list.
      // We will look for standard text inside the frame.
      console.log('Waiting for Netbanking button...');
      await frame.waitForSelector('text="Netbanking"', { timeout: 15000 });
      await frame.click('text="Netbanking"');
      
      console.log('Waiting for SBI option...');
      await frame.waitForSelector('text="SBI"', { timeout: 15000 });
      await frame.click('text="SBI"');
      
      console.log('Clicking Pay...');
      await frame.waitForSelector('button:has-text("Pay")', { timeout: 15000 });
      const [bankPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 15000 }),
        frame.click('button:has-text("Pay")')
      ]);

      console.log('Mock bank page opened.');
      await bankPage.waitForLoadState();
      
      console.log('Clicking Success on mock bank...');
      // Usually Razorpay's mock bank page has a button with text "Success" or value "Success"
      await bankPage.waitForSelector('button:has-text("Success"), input[value="Success"], button.success', { timeout: 15000 });
      const successBtn = bankPage.locator('button:has-text("Success"), input[value="Success"], button.success').first();
      await successBtn.click();
      console.log('Clicked Success on mock bank.');

    } catch (e) {
      console.log("Iframe automation failed (common with Razorpay Test Mode UI changes):", e.message);
      throw e;
    }

    // Wait for the Verify API call
    console.log('Waiting for /verify backend call...');
    const verifyPromise = page.waitForResponse(r => r.url().includes('/api/payment/verify') && r.request().method() === 'POST');
    const verifyRes = await verifyPromise;
    report('Backend Verify Signature', verifyRes.ok(), `HTTP ${verifyRes.status()}`);

    // Wait for the Consultation Create API call
    const createConsultPromise = page.waitForResponse(r => r.url().includes('/api/consultations') && r.request().method() === 'POST');
    const consultRes = await createConsultPromise;
    report('Consultation Created & Marked Paid', consultRes.ok(), `HTTP ${consultRes.status()}`);

    // Wait for redirect to consultations
    await page.waitForURL('**/dashboard/patient/consultations', { timeout: 15000 });
    report('Redirected to Consultations', true, 'Success');

    // Refresh page
    await page.reload();
    await page.waitForSelector('.card');
    
    const pageText = await page.locator('.card').first().textContent();
    report('Paid Status Persists', pageText.includes('Pending'), 'Consultation is successfully logged as Paid/Pending Doctor Review');

  } catch (err) {
    console.error('Test execution error:', err);
    failed = true;
  } finally {
    await browser.close();
    process.exit(failed ? 1 : 0);
  }
})();
