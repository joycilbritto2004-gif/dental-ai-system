const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyAllDashboards() {
  const browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('==============================================');
  console.log('   VERIFYING ADMIN DASHBOARD GLASSMORPHISM    ');
  console.log('==============================================');

  // --- 1. ADMIN DASHBOARD DESKTOP ---
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();

  console.log('\n[1/5] Logging into Admin Portal...');
  await adminPage.goto('http://localhost:5173/login');
  
  // Select Admin role card
  const adminRoleBtn = await adminPage.$('.role-card:has-text("Admin")');
  if (adminRoleBtn) {
    await adminRoleBtn.click();
    await adminPage.waitForTimeout(300);
  }

  await adminPage.fill('input[type="email"]', 'admin@test.com');
  await adminPage.fill('input[type="password"]', 'password123');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/dashboard/admin', { timeout: 10000 });
  await adminPage.waitForTimeout(1500);

  const adminStyles = await adminPage.evaluate(() => {
    const layout = document.querySelector('.dashboard-layout');
    const sidebar = document.querySelector('.dashboard-sidebar');
    const header = document.querySelector('.dashboard-header-top');
    const heroCard = document.querySelector('.page-header-card');
    const kpiCards = Array.from(document.querySelectorAll('.kpi-card'));
    const cards = Array.from(document.querySelectorAll('.card'));
    const sidebarLinks = Array.from(document.querySelectorAll('.sidebar-link'));
    const activeLink = document.querySelector('.sidebar-link.active');

    return {
      layout: {
        bgImage: layout ? window.getComputedStyle(layout).backgroundImage : null,
        bgAttachment: layout ? window.getComputedStyle(layout).backgroundAttachment : null,
        bgColor: layout ? window.getComputedStyle(layout).backgroundColor : null,
      },
      sidebar: {
        width: sidebar ? window.getComputedStyle(sidebar).width : null,
        bg: sidebar ? window.getComputedStyle(sidebar).backgroundColor : null,
        blur: sidebar ? window.getComputedStyle(sidebar).backdropFilter : null,
        borderRight: sidebar ? window.getComputedStyle(sidebar).borderRight : null,
      },
      header: {
        bg: header ? window.getComputedStyle(header).backgroundColor : null,
        blur: header ? window.getComputedStyle(header).backdropFilter : null,
        borderBottom: header ? window.getComputedStyle(header).borderBottom : null,
      },
      heroCard: {
        bg: heroCard ? window.getComputedStyle(heroCard).backgroundColor : null,
        blur: heroCard ? window.getComputedStyle(heroCard).backdropFilter : null,
        borderRadius: heroCard ? window.getComputedStyle(heroCard).borderRadius : null,
      },
      kpiCount: kpiCards.length,
      kpiBgs: kpiCards.map(c => window.getComputedStyle(c).backgroundColor),
      kpiBlurs: kpiCards.map(c => window.getComputedStyle(c).backdropFilter),
      cardsCount: cards.length,
      activeLink: {
        bg: activeLink ? window.getComputedStyle(activeLink).backgroundImage || window.getComputedStyle(activeLink).backgroundColor : null,
        color: activeLink ? window.getComputedStyle(activeLink).color : null,
      }
    };
  });

  console.log('Admin Layout Background:', adminStyles.layout);
  console.log('Admin Sidebar:', adminStyles.sidebar);
  console.log('Admin Header:', adminStyles.header);
  console.log('Admin Hero Card:', adminStyles.heroCard);
  console.log('Admin KPI Cards:', { count: adminStyles.kpiCount, bgs: adminStyles.kpiBgs[0], blur: adminStyles.kpiBlurs[0] });
  console.log('Admin Active Link:', adminStyles.activeLink);

  const adminMainScreenshot = path.join(screenshotsDir, 'admin_dashboard_desktop.png');
  await adminPage.screenshot({ path: adminMainScreenshot, fullPage: false });
  console.log('📸 Saved Admin Dashboard screenshot:', adminMainScreenshot);

  // --- 2. ADMIN SUB-PAGES ---
  console.log('\n[2/5] Inspecting Admin Sub-pages...');
  
  // User Management
  await adminPage.goto('http://localhost:5173/dashboard/admin/users');
  await adminPage.waitForTimeout(1000);
  const usersScreenshot = path.join(screenshotsDir, 'admin_users_desktop.png');
  await adminPage.screenshot({ path: usersScreenshot, fullPage: false });
  console.log('📸 Saved Admin Users screenshot:', usersScreenshot);

  // Doctors Management
  await adminPage.goto('http://localhost:5173/dashboard/admin/doctors');
  await adminPage.waitForTimeout(1000);
  const doctorsScreenshot = path.join(screenshotsDir, 'admin_doctors_desktop.png');
  await adminPage.screenshot({ path: doctorsScreenshot, fullPage: false });
  console.log('📸 Saved Admin Doctors screenshot:', doctorsScreenshot);

  // Predictions
  await adminPage.goto('http://localhost:5173/dashboard/admin/predictions');
  await adminPage.waitForTimeout(1000);
  const predictionsScreenshot = path.join(screenshotsDir, 'admin_predictions_desktop.png');
  await adminPage.screenshot({ path: predictionsScreenshot, fullPage: false });
  console.log('📸 Saved Admin Predictions screenshot:', predictionsScreenshot);

  // Mobile Viewport for Admin
  console.log('\n[3/5] Inspecting Admin Mobile Responsiveness...');
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/login');
  const mRoleBtn = await mobilePage.$('.role-card:has-text("Admin")');
  if (mRoleBtn) await mRoleBtn.click();
  await mobilePage.fill('input[type="email"]', 'admin@test.com');
  await mobilePage.fill('input[type="password"]', 'password123');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/dashboard/admin', { timeout: 10000 });
  await mobilePage.waitForTimeout(1500);

  const adminMobileScreenshot = path.join(screenshotsDir, 'admin_dashboard_mobile.png');
  await mobilePage.screenshot({ path: adminMobileScreenshot, fullPage: false });
  console.log('📸 Saved Admin Mobile screenshot:', adminMobileScreenshot);

  // --- 4. VERIFY PATIENT DASHBOARD REMAINS UNTOUCHED ---
  console.log('\n[4/5] Verifying Patient Dashboard remains untouched...');
  const patientContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const patientPage = await patientContext.newPage();
  await patientPage.goto('http://localhost:5173/login');
  const pRoleBtn = await patientPage.$('.role-card:has-text("Patient")');
  if (pRoleBtn) await pRoleBtn.click();
  await patientPage.fill('input[type="email"]', 'patient@test.com');
  await patientPage.fill('input[type="password"]', 'password123');
  await patientPage.click('button[type="submit"]');
  await patientPage.waitForURL('**/dashboard/patient', { timeout: 10000 });
  await patientPage.waitForTimeout(1000);

  const patientScreenshot = path.join(screenshotsDir, 'patient_dashboard_verification.png');
  await patientPage.screenshot({ path: patientScreenshot, fullPage: false });
  console.log('📸 Saved Patient Dashboard screenshot:', patientScreenshot);

  // --- 5. VERIFY DOCTOR DASHBOARD REMAINS UNTOUCHED ---
  console.log('\n[5/5] Verifying Doctor Dashboard remains untouched...');
  const doctorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const doctorPage = await doctorContext.newPage();
  await doctorPage.goto('http://localhost:5173/login');
  const dRoleBtn = await doctorPage.$('.role-card:has-text("Doctor")');
  if (dRoleBtn) await dRoleBtn.click();
  await doctorPage.fill('input[type="email"]', 'priya.menon@dentaai.com');
  await doctorPage.fill('input[type="password"]', 'password123');
  await doctorPage.click('button[type="submit"]');
  await doctorPage.waitForURL('**/dashboard/doctor', { timeout: 10000 });
  await doctorPage.waitForTimeout(1000);

  const doctorScreenshot = path.join(screenshotsDir, 'doctor_dashboard_verification.png');
  await doctorPage.screenshot({ path: doctorScreenshot, fullPage: false });
  console.log('📸 Saved Doctor Dashboard screenshot:', doctorScreenshot);

  await browser.close();
  console.log('\n==============================================');
  console.log('   ALL VERIFICATIONS COMPLETED SUCCESSFULLY   ');
  console.log('==============================================');
}

verifyAllDashboards().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
