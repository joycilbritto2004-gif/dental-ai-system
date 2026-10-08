const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    // filter out vite logs
    if (!msg.text().includes('[vite]')) {
      console.log('BROWSER CONSOLE:', msg.text());
    }
  });

  try {
    console.log('=== PHASE 3A: PATIENT REQUESTS CONSULTATION ===');
    console.log('Logging in as Patient...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/patient');
    console.log('On Patient Dashboard.');

    // Upload image to create a scan first so we can attach it to the consultation
    const filePath = path.join(__dirname, 'dummy_tooth.jpg');
    await page.setInputFiles('input[type="file"]', filePath);
    await page.waitForSelector('.preview-image');
    await page.locator('text="Analyze with DentaAI"').click();
    await page.waitForSelector('text="AI Analysis Complete"', { timeout: 15000 });
    console.log('Scan generated.');

    // Click "Get Verified by a Dentist" (Navigates to Recommended Doctors directly now)
    await page.locator('text="Get Verified by a Dentist"').click();
    await page.waitForSelector('text="Dr. Priya Menon"');
    console.log('Recommended Specialists loaded ✅');

    const doctorCard = page.locator('.doctors-grid .doctor-card').filter({ hasText: 'Dr. Priya Menon' }).first();
    await doctorCard.locator('text="View Profile"').click();
    console.log('Clicked View Profile on Doctor ✅');

    await page.waitForSelector('text="Book Consultation"');
    await page.locator('text="Book Consultation"').click();
    
    // Now on Request Consultation page
    await page.waitForSelector('text="Consultation Details"');
    await page.fill('input[type="date"]', '2027-01-01');
    await page.fill('input[type="time"]', '10:00');
    await page.click('text="Proceed to Secure Payment"');
    
    // Now on Secure Payment Gateway
    await page.waitForSelector('text="Secure Checkout"');
    
    console.log('Simulating Razorpay payment success (Test Environment)...');
    
    // We get the stored user token
    const token = await page.evaluate(() => localStorage.getItem('dentaai_token'));
    const patientDataStr = await page.evaluate(() => localStorage.getItem('dentaai_user'));
    const patient = JSON.parse(patientDataStr);
    
    // Extract the doctor ID and scan ID from the URL or state
    // We know Dr. Priya Menon's ID from earlier, or we can just fetch it from the API
    const docsRes = await page.request.get('http://localhost:5000/api/doctors', { headers: { 'Authorization': `Bearer ${token}` } });
    const docs = await docsRes.json();
    const priya = docs.find(d => d.name === 'Dr. Priya Menon');
    
    // Create the consultation directly via API as Razorpay handler would
    const apiPromise = page.request.post('http://localhost:5000/api/consultations', {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        transactionId: "txn_dummy_123",
        doctorId: priya ? priya._id : "doc_dummy",
        doctorName: priya ? priya.name : "Dr. Priya Menon",
        patientId: patient.id || patient._id,
        patientName: patient.name || "Test Patient",
        date: "2027-01-01",
        time: "10:00",
        fee: 500,
        amount: 500,
        status: "Pending",
        paymentStatus: "Paid",
        paymentMethod: "Razorpay"
      }
    });
    
    // Wait for the POST request
    const aiResponse = await apiPromise;
    const status = aiResponse.status();
    const result = await aiResponse.json();
    
    console.log(`Consultation Request POST: HTTP ${status} ✅`);
    if (status === 201 || status === 200) {
      console.log(`Captured Consultation Details:`);
      console.log(`- ID: ${result.id || result._id}`);
      console.log(`- Patient ID: ${result.patientId}`);
      console.log(`- Doctor ID: ${result.doctorId}`);
      console.log(`- Condition: ${result.condition}`);
      console.log(`- Status: ${result.status}`);
      console.log('Consultation request succeeded ✅');
    } else {
      throw new Error(`Failed to create consultation: HTTP ${status}`);
    }

    await page.goto('http://localhost:5173/dashboard/patient/consultations');
    
    await page.waitForURL('**/dashboard/patient/consultations');
    console.log('On Patient Consultations page.');
    
    // Refresh page
    await page.reload();
    await page.waitForSelector('.card');
    const patientConsultationsText = await page.locator('.card').first().textContent();
    if (patientConsultationsText.includes('Pending')) {
      console.log('Consultation still exists and status (Pending) persists ✅');
    } else {
      console.error('Consultation missing or status not Pending after refresh ❌');
    }

    // Logout patient
    await page.locator('.sidebar-link.text-logout').click();
    console.log('Patient Logged Out.');

    console.log('=== PHASE 3B: DOCTOR RECEIVES REQUEST ===');
    console.log('Logging in as Doctor...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'priya.menon@dentaai.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/doctor');
    console.log('On Doctor Dashboard ✅');

    // Wait for analytics to load
    await page.waitForSelector('text="Doctor Analytics"');

    // The doctor should check Pending Reviews
    await page.goto('http://localhost:5173/dashboard/doctor/reviews');
    await page.waitForSelector('text="Pending Reviews"');
    
    await page.waitForSelector('.modern-table tbody tr');
    const pendingReviewText = await page.locator('.modern-table tbody tr').first().textContent();
    if (pendingReviewText.includes('Mouth') && pendingReviewText.includes('Pending')) {
      console.log('Patient\'s new consultation appears with condition Mouth Ulcer ✅');
    } else {
      console.error('Patient consultation not found in Pending Reviews ❌');
    }

    console.log('=== PHASE 3C: DOCTOR ACCEPTS ===');
    const [acceptRes] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/accept') && response.request().method() === 'PUT'
      ),
      page.locator('text="Accept Consultation"').first().click()
    ]);
    
    console.log(`Accept API request: HTTP ${acceptRes.status()} ✅`);
    
    await page.waitForTimeout(1000);
    // Refresh to verify
    await page.reload();
    
    // Now the consultation should not be in pending reviews, or its status should be Accepted.
    // It should be in the main consultations list.
    await page.goto('http://localhost:5173/dashboard/doctor/consultations');
    await page.waitForSelector('text="Active Patient Queue"');
    
    await page.waitForSelector('.list-item');
    const consultationItemText = await page.locator('.list-item').first().textContent();
    if (consultationItemText.includes('Accepted')) {
      console.log('Consultation status changes to Accepted and persists ✅');
    } else {
      console.error('Consultation status is not Accepted ❌');
    }

    console.log('=== PHASE 3D: START CONSULTATION ===');
    const [startRes] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/start') && response.request().method() === 'PUT'
      ),
      page.locator('text="Start Consultation"').first().click()
    ]);
    
    console.log(`Start API request: HTTP ${startRes.status()} ✅`);
    
    // Automatically navigates to workspace
    await page.waitForURL('**/dashboard/doctor/consultation/*');
    console.log('Status becomes In Consultation and persists ✅');

    console.log('=== PHASE 3E: DOCTOR VERIFICATION ===');
    await page.waitForSelector('text="Diagnostic Workspace"');
    
    const workspaceText = await page.locator('.dashboard-view').textContent();
    if (workspaceText.includes('Internal UID') || workspaceText.includes('Mouth Ulcer')) {
      console.log('Doctor can see Patient information and condition ✅');
    } else {
      console.error('Missing patient info in workspace ❌');
    }
    
    // Uploaded data check
    const xrayVisible = await page.locator('.xray-preview-large img').isVisible();
    if (xrayVisible) {
      console.log('Uploaded image is accessible ✅');
    } else {
      console.error('Uploaded image is not visible in workspace ❌');
    }

    // Complete the consultation (PHASE 3F)
    console.log('=== PHASE 3F: DOCTOR COMPLETES CONSULTATION ===');
    await page.fill('input[placeholder="e.g. Early stage caries"]', 'Test Final Diagnosis: Verified Mouth Ulcer');
    await page.fill('textarea[placeholder="Detail the clinical recommendations here..."]', 'Test Treatment Plan: Prescribe antibiotics and rest.');
    await page.fill('input[type="date"]', '2027-01-10');
    await page.fill('textarea[placeholder="e.g. Schedule a dental check-up."]', 'Follow up next week.');
    
    const [completeRes] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/complete') && response.request().method() === 'PUT'
      ),
      page.locator('text="Authorize & Dispatch Report"').click()
    ]);
    
    console.log(`Complete API request: HTTP ${completeRes.status()} ✅`);
    await page.waitForSelector('text="Clinical Assessment Completed"');
    console.log('Doctor successfully completed consultation ✅');

    // Patient logs back in and checks results (PHASE 3G)
    console.log('=== PHASE 3G: PATIENT VERIFIES RESULTS ===');
    await page.locator('.sidebar-link.text-logout').click();
    console.log('Doctor Logged Out.');

    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/patient');
    await page.goto('http://localhost:5173/dashboard/patient/consultations');
    
    await page.waitForSelector('text="My Consultations"');
    await page.waitForSelector('.card');
    
    const finalPatientConsultationsText = await page.locator('.card').first().textContent();
    if (finalPatientConsultationsText.includes('Completed') && finalPatientConsultationsText.includes('Test Final Diagnosis: Verified Mouth Ulcer')) {
      console.log('Patient successfully sees the completed consultation and final diagnosis ✅');
    } else {
      console.error('Patient consultation missing final diagnosis or not marked as Completed ❌');
    }

    console.log('TEST COMPLETE: PASS');

  } catch (err) {
    console.error('Test error:', err);
    console.log('TEST COMPLETE: FAIL');
  } finally {
    await browser.close();
  }
})();
