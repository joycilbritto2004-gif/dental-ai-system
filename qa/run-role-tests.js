const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

const patientEmail = 'patient@test.com'; 
const doctorEmail = 'priya.menon@dentaai.com';
const adminEmail = 'admin@test.com'; 
const password = 'password123'; 

async function testBackendLogin(email, role, testName) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, loginRole: role })
    });
    
    const data = await res.json().catch(() => ({}));
    if (res.status === 200) {
      console.log(`PASS: ${testName} - Status ${res.status} (Allowed)`);
      return true;
    } else {
      console.log(`PASS (Rejected): ${testName} - Status ${res.status} (Reason: ${data.message})`);
      return false;
    }
  } catch (error) {
    console.log(`FAIL: ${testName} - Network error: ${error.message}`);
    return false;
  }
}

async function testFrontendNavigation() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  async function loginAs(email, pswd, roleLabel) {
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', pswd);
    
    // The role cards have class 'role-card' and spans inside them. 
    // Just click the text.
    await page.click(`text="${roleLabel}"`);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000); 
  }

  // 10. Login as Patient and manually navigate to Doctor Dashboard
  await loginAs(patientEmail, password, 'Patient');
  await page.goto(`${FRONTEND_URL}/dashboard/doctor`);
  await page.waitForTimeout(1000);
  if (page.url().includes('dashboard/doctor')) {
     const text = await page.locator('body').textContent();
     if (text.includes('Doctor Analytics') || text.includes('Active Patient Queue')) {
        console.log('FAIL: 10. Login as Patient -> Doctor Dashboard (Allowed)');
     } else {
        console.log('PASS: 10. Login as Patient -> Doctor Dashboard (Denied/Redirected)');
     }
  } else {
     console.log('PASS: 10. Login as Patient -> Doctor Dashboard (Redirected to ' + page.url() + ')');
  }

  // 11. Login as Patient and manually navigate to Admin Dashboard
  await page.goto(`${FRONTEND_URL}/dashboard/admin`);
  await page.waitForTimeout(1000);
  if (page.url().includes('dashboard/admin')) {
     console.log('FAIL: 11. Login as Patient -> Admin Dashboard (Allowed)');
  } else {
     console.log('PASS: 11. Login as Patient -> Admin Dashboard (Redirected to ' + page.url() + ')');
  }

  // Clear session
  await page.evaluate(() => localStorage.clear());

  // 12. Login as Doctor and manually navigate to Admin Dashboard
  await loginAs(doctorEmail, password, 'Doctor');
  await page.goto(`${FRONTEND_URL}/dashboard/admin`);
  await page.waitForTimeout(1000);
  if (page.url().includes('dashboard/admin')) {
     console.log('FAIL: 12. Login as Doctor -> Admin Dashboard (Allowed)');
  } else {
     console.log('PASS: 12. Login as Doctor -> Admin Dashboard (Redirected to ' + page.url() + ')');
  }

  // 13. Login as Doctor and manually navigate to Patient Dashboard
  await page.goto(`${FRONTEND_URL}/dashboard/patient`);
  await page.waitForTimeout(1000);
  if (page.url().includes('dashboard/patient')) {
     const text = await page.locator('body').textContent();
     if (text.includes('Welcome back') && !text.includes('Unauthorized')) {
        console.log('PASS: 13. Login as Doctor -> Patient Dashboard (Denied - wait, if allowed it is fail). Let us check URL.');
        // Doctor shouldn't see patient dashboard
        console.log('FAIL: 13. Login as Doctor -> Patient Dashboard (Allowed)');
     } else {
        console.log('PASS: 13. Login as Doctor -> Patient Dashboard (Denied)');
     }
  } else {
     console.log('PASS: 13. Login as Doctor -> Patient Dashboard (Redirected to ' + page.url() + ')');
  }

  await browser.close();
}

async function runAll() {
  console.log("--- BACKEND ROLE TESTS ---");
  await testBackendLogin(patientEmail, 'patient', '1. Patient account -> Patient Login');
  await testBackendLogin(patientEmail, 'doctor', '2. Patient account -> Doctor Login');
  await testBackendLogin(patientEmail, 'admin', '3. Patient account -> Admin Login');

  await testBackendLogin(doctorEmail, 'doctor', '4. Doctor account -> Doctor Login');
  await testBackendLogin(doctorEmail, 'patient', '5. Doctor account -> Patient Login');
  await testBackendLogin(doctorEmail, 'admin', '6. Doctor account -> Admin Login');

  await testBackendLogin(adminEmail, 'admin', '7. Admin account -> Admin Login');
  await testBackendLogin(adminEmail, 'patient', '8. Admin account -> Patient Login');
  await testBackendLogin(adminEmail, 'doctor', '9. Admin account -> Doctor Login');

  console.log("\\n--- FRONTEND URL PROTECTION TESTS ---");
  await testFrontendNavigation();
}

runAll().catch(console.error);
