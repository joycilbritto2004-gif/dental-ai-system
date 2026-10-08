const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (!msg.text().includes('[vite]')) {
      console.log('BROWSER CONSOLE:', msg.text());
    }
  });

  try {
    console.log('=== PHASE 4: DOCTOR VERIFICATION & COMPLETION ===');
    console.log('Logging in as Doctor...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'priya.menon@dentaai.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/doctor');
    console.log('On Doctor Dashboard ✅');

    // The doctor checks active consultations
    await page.goto('http://localhost:5173/dashboard/doctor/consultations');
    await page.waitForSelector('text="Active Patient Queue"');
    
    // Find the 'In Consultation' consultation and click 'Open Workspace'
    await page.locator('text="Open Workspace"').first().click();
    console.log('Navigated to Diagnostic Workspace ✅');

    await page.waitForSelector('text="Diagnostic Workspace"');

    // Verify workspace has patient info, AI prediction
    const workspaceText = await page.locator('.dashboard-view').textContent();
    if (workspaceText.includes('Internal UID') || workspaceText.includes('Mouth Ulcer')) {
      console.log('Doctor can see Patient information and AI prediction ✅');
    } else {
      throw new Error('Missing patient info in workspace');
    }

    // Fill in diagnosis and treatment
    await page.fill('input[placeholder="e.g. Early stage caries"]', 'Confirmed Mouth Ulcer due to stress.');
    await page.fill('textarea[placeholder="Detail the clinical recommendations here..."]', 'Apply prescribed topical gel twice a day. Rest and hydrate.');
    await page.fill('input[type="date"]', '2027-01-15');
    await page.fill('textarea[placeholder="e.g. Schedule a dental check-up."]', 'Check if ulcer has reduced in size.');

    console.log('Filled in diagnosis, treatment plan, and follow-up ✅');

    // Intercept PUT request
    const apiPromise = page.waitForResponse(response => 
      response.url().includes('/complete') && response.request().method() === 'PUT'
    );

    // Submit
    await page.click('text="Authorize & Dispatch Report"');
    
    const aiResponse = await apiPromise;
    console.log(`Completion API request: HTTP ${aiResponse.status()} ✅`);
    if (aiResponse.status() !== 200) throw new Error('API failed');

    await page.waitForSelector('text="Clinical Assessment Completed"');
    console.log('Consultation marked as Completed in UI ✅');

    // Log out doctor
    await page.locator('.sidebar-link.text-logout').click();
    console.log('Doctor Logged Out.');

    console.log('=== PHASE 5: PATIENT CONFIRMATION ===');
    console.log('Logging in as Patient...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/patient');
    console.log('On Patient Dashboard ✅');
    
    // Check for follow up date/note on Dashboard
    await page.waitForSelector('text="Upcoming Follow-up"');
    const dashboardText = await page.locator('.dashboard-view').textContent();
    if (dashboardText.includes('Check if ulcer has reduced in size.')) {
        console.log('Patient can see the follow-up note on dashboard ✅');
    } else {
        throw new Error('Patient cannot see the follow-up note on dashboard!');
    }

    // Go to My Consultations
    await page.goto('http://localhost:5173/dashboard/patient/consultations');
    await page.waitForSelector('text="My Consultations"');
    
    // Wait for the final diagnosis content to appear in the card
    await page.waitForSelector('text="Doctor\'s Final Diagnosis"');
    
    const detailsText = await page.locator('.dashboard-view').textContent();
    
    if (detailsText.includes('Confirmed Mouth Ulcer due to stress.') && detailsText.includes('Apply prescribed topical gel')) {
      console.log('Patient can see the final diagnosis and treatment plan ✅');
    } else {
      throw new Error('Patient cannot see all the details!');
    }

    // Refresh page
    await page.reload();
    await page.waitForSelector('text="My Consultations"');
    await page.waitForSelector('text="Doctor\'s Final Diagnosis"');
    
    const detailsTextReload = await page.locator('.dashboard-view').textContent();
    if (detailsTextReload.includes('Confirmed Mouth Ulcer due to stress.')) {
      console.log('Details persist after refresh ✅');
    } else {
      throw new Error('Details do not persist after refresh!');
    }

    console.log('TEST COMPLETE: PASS');

  } catch (err) {
    console.error('Test error:', err);
    console.log('TEST COMPLETE: FAIL');
  } finally {
    await browser.close();
  }
})();
