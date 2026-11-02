const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyAllPortalGlassmorphism() {
  const browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('===============================================================');
  console.log('   VERIFYING PATIENT, DOCTOR & ADMIN GLASSMORPHISM RESTORATION  ');
  console.log('===============================================================');

  // --- 1. PATIENT PORTAL ---
  console.log('\n[1/3] Verifying Patient Portal Glassmorphism & Background...');
  const patientContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const patientPage = await patientContext.newPage();
  await patientPage.goto('http://localhost:5173/login');
  
  const pRoleBtn = await patientPage.$('.role-card:has-text("Patient")');
  if (pRoleBtn) await pRoleBtn.click();
  await patientPage.fill('input[type="email"]', 'patient@test.com');
  await patientPage.fill('input[type="password"]', 'password123');
  await patientPage.click('button[type="submit"]');
  await patientPage.waitForURL('**/dashboard/patient', { timeout: 15000 });
  await patientPage.waitForTimeout(1500);

  const patientStyles = await patientPage.evaluate(() => {
    const layout = document.querySelector('.dashboard-layout');
    const main = document.querySelector('.dashboard-main');
    const sidebar = document.querySelector('.dashboard-sidebar');
    const header = document.querySelector('.dashboard-header-top');
    const banner = document.querySelector('.page-header-card');
    const kpiCards = Array.from(document.querySelectorAll('.patient-kpi-grid > div, .patient-kpi-grid a > div, .kpi-card'));
    const scanCard = document.querySelector('.card:not(.page-header-card):not(.tips-card):not(.chart-card)');

    return {
      layoutBg: layout ? window.getComputedStyle(layout).backgroundImage : null,
      layoutAttachment: layout ? window.getComputedStyle(layout).backgroundAttachment : null,
      mainBg: main ? window.getComputedStyle(main).backgroundColor : null,
      sidebarBg: sidebar ? window.getComputedStyle(sidebar).backgroundColor : null,
      sidebarBlur: sidebar ? window.getComputedStyle(sidebar).backdropFilter : null,
      headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
      headerBlur: header ? window.getComputedStyle(header).backdropFilter : null,
      bannerBg: banner ? window.getComputedStyle(banner).backgroundColor : null,
      bannerBlur: banner ? window.getComputedStyle(banner).backdropFilter : null,
      kpiCount: kpiCards.length,
      kpiBg: kpiCards[0] ? window.getComputedStyle(kpiCards[0]).backgroundColor : null,
      kpiBlur: kpiCards[0] ? window.getComputedStyle(kpiCards[0]).backdropFilter : null,
      scanCardBg: scanCard ? window.getComputedStyle(scanCard).backgroundColor : null,
      scanCardBlur: scanCard ? window.getComputedStyle(scanCard).backdropFilter : null,
    };
  });

  console.log('Patient Layout Background Image:', patientStyles.layoutBg);
  console.log('Patient Main BG (must be transparent):', patientStyles.mainBg);
  console.log('Patient Sidebar (translucent + blur):', { bg: patientStyles.sidebarBg, blur: patientStyles.sidebarBlur });
  console.log('Patient Header (translucent + blur):', { bg: patientStyles.headerBg, blur: patientStyles.headerBlur });
  console.log('Patient Banner Card (glass):', { bg: patientStyles.bannerBg, blur: patientStyles.bannerBlur });
  console.log('Patient KPI Card (glass):', { count: patientStyles.kpiCount, bg: patientStyles.kpiBg, blur: patientStyles.kpiBlur });
  console.log('Patient Scan Card (glass):', { bg: patientStyles.scanCardBg, blur: patientStyles.scanCardBlur });

  const patientScreenshot = path.join(screenshotsDir, 'restored_patient_portal.png');
  await patientPage.screenshot({ path: patientScreenshot, fullPage: false });
  console.log('📸 Saved Patient screenshot to:', patientScreenshot);

  // Assertions for Patient
  if (!patientStyles.layoutBg.includes('doctor-patient-bg')) {
    throw new Error('Patient portal background does not use doctor-patient-bg.png');
  }
  if (!patientStyles.sidebarBlur || patientStyles.sidebarBlur === 'none') {
    throw new Error('Patient sidebar is missing glassmorphism backdrop blur');
  }

  // --- 2. DOCTOR PORTAL ---
  console.log('\n[2/3] Verifying Doctor Portal Glassmorphism & Background...');
  const doctorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const doctorPage = await doctorContext.newPage();
  await doctorPage.goto('http://localhost:5173/login');

  const dRoleBtn = await doctorPage.$('.role-card:has-text("Doctor")');
  if (dRoleBtn) await dRoleBtn.click();
  await doctorPage.fill('input[type="email"]', 'priya.menon@dentaai.com');
  await doctorPage.fill('input[type="password"]', 'password123');
  await doctorPage.click('button[type="submit"]');
  await doctorPage.waitForURL('**/dashboard/doctor', { timeout: 15000 });
  await doctorPage.waitForTimeout(1500);

  const doctorStyles = await doctorPage.evaluate(() => {
    const layout = document.querySelector('.dashboard-layout');
    const main = document.querySelector('.dashboard-main');
    const sidebar = document.querySelector('.dashboard-sidebar');
    const header = document.querySelector('.dashboard-header-top');
    const banner = document.querySelector('.page-header-card');
    const cards = Array.from(document.querySelectorAll('.card'));

    return {
      layoutBg: layout ? window.getComputedStyle(layout).backgroundImage : null,
      layoutAttachment: layout ? window.getComputedStyle(layout).backgroundAttachment : null,
      mainBg: main ? window.getComputedStyle(main).backgroundColor : null,
      sidebarBg: sidebar ? window.getComputedStyle(sidebar).backgroundColor : null,
      sidebarBlur: sidebar ? window.getComputedStyle(sidebar).backdropFilter : null,
      headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
      headerBlur: header ? window.getComputedStyle(header).backdropFilter : null,
      bannerBg: banner ? window.getComputedStyle(banner).backgroundColor : null,
      bannerBlur: banner ? window.getComputedStyle(banner).backdropFilter : null,
      cardsCount: cards.length,
      cardBg: cards[0] ? window.getComputedStyle(cards[0]).backgroundColor : null,
      cardBlur: cards[0] ? window.getComputedStyle(cards[0]).backdropFilter : null,
    };
  });

  console.log('Doctor Layout Background Image:', doctorStyles.layoutBg);
  console.log('Doctor Main BG (must be transparent):', doctorStyles.mainBg);
  console.log('Doctor Sidebar (translucent + blur):', { bg: doctorStyles.sidebarBg, blur: doctorStyles.sidebarBlur });
  console.log('Doctor Header (translucent + blur):', { bg: doctorStyles.headerBg, blur: doctorStyles.headerBlur });
  console.log('Doctor Banner Card (glass):', { bg: doctorStyles.bannerBg, blur: doctorStyles.bannerBlur });
  console.log('Doctor Cards (glass):', { count: doctorStyles.cardsCount, bg: doctorStyles.cardBg, blur: doctorStyles.cardBlur });

  const doctorScreenshot = path.join(screenshotsDir, 'restored_doctor_portal.png');
  await doctorPage.screenshot({ path: doctorScreenshot, fullPage: false });
  console.log('📸 Saved Doctor screenshot to:', doctorScreenshot);

  // Assertions for Doctor
  if (!doctorStyles.layoutBg.includes('dentaai-background')) {
    throw new Error('Doctor portal background does not use dentaai-background.png');
  }
  if (!doctorStyles.sidebarBlur || doctorStyles.sidebarBlur === 'none') {
    throw new Error('Doctor sidebar is missing glassmorphism backdrop blur');
  }

  // --- 3. ADMIN PORTAL ---
  console.log('\n[3/3] Verifying Admin Portal Glassmorphism & Background...');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  await adminPage.goto('http://localhost:5173/login');

  const aRoleBtn = await adminPage.$('.role-card:has-text("Admin")');
  if (aRoleBtn) await aRoleBtn.click();
  await adminPage.fill('input[type="email"]', 'admin@test.com');
  await adminPage.fill('input[type="password"]', 'password123');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/dashboard/admin', { timeout: 15000 });
  await adminPage.waitForTimeout(1500);

  const adminStyles = await adminPage.evaluate(() => {
    const layout = document.querySelector('.dashboard-layout');
    const main = document.querySelector('.dashboard-main');
    const sidebar = document.querySelector('.dashboard-sidebar');
    const header = document.querySelector('.dashboard-header-top');
    const banner = document.querySelector('.page-header-card');
    const cards = Array.from(document.querySelectorAll('.card'));

    return {
      layoutBg: layout ? window.getComputedStyle(layout).backgroundImage : null,
      layoutAttachment: layout ? window.getComputedStyle(layout).backgroundAttachment : null,
      mainBg: main ? window.getComputedStyle(main).backgroundColor : null,
      sidebarBg: sidebar ? window.getComputedStyle(sidebar).backgroundColor : null,
      sidebarBlur: sidebar ? window.getComputedStyle(sidebar).backdropFilter : null,
      headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
      headerBlur: header ? window.getComputedStyle(header).backdropFilter : null,
      bannerBg: banner ? window.getComputedStyle(banner).backgroundColor : null,
      bannerBlur: banner ? window.getComputedStyle(banner).backdropFilter : null,
      cardsCount: cards.length,
      cardBg: cards[0] ? window.getComputedStyle(cards[0]).backgroundColor : null,
      cardBlur: cards[0] ? window.getComputedStyle(cards[0]).backdropFilter : null,
    };
  });

  console.log('Admin Layout Background Image:', adminStyles.layoutBg);
  console.log('Admin Main BG (must be transparent):', adminStyles.mainBg);
  console.log('Admin Sidebar (translucent + blur):', { bg: adminStyles.sidebarBg, blur: adminStyles.sidebarBlur });
  console.log('Admin Header (translucent + blur):', { bg: adminStyles.headerBg, blur: adminStyles.headerBlur });
  console.log('Admin Banner Card (glass):', { bg: adminStyles.bannerBg, blur: adminStyles.bannerBlur });
  console.log('Admin Cards (glass):', { count: adminStyles.cardsCount, bg: adminStyles.cardBg, blur: adminStyles.cardBlur });

  const adminScreenshot = path.join(screenshotsDir, 'restored_admin_portal.png');
  await adminPage.screenshot({ path: adminScreenshot, fullPage: false });
  console.log('📸 Saved Admin screenshot to:', adminScreenshot);

  // Assertions for Admin
  if (!adminStyles.layoutBg.includes('dentaai-background')) {
    throw new Error('Admin portal background does not use dentaai-background.png');
  }
  if (!adminStyles.sidebarBlur || adminStyles.sidebarBlur === 'none') {
    throw new Error('Admin sidebar is missing glassmorphism backdrop blur');
  }

  await browser.close();
  console.log('\n===============================================================');
  console.log('   ALL 3 PORTALS VERIFIED SUCCESSFULLY: GLASSMORPHISM RESTORED  ');
  console.log('===============================================================');
}

verifyAllPortalGlassmorphism().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

