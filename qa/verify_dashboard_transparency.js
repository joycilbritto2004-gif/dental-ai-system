const { chromium } = require('playwright');
const path = require('path');

async function testDashboardTransparency() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Test (1440x900)
  console.log('=== 1. DESKTOP VIEWPORT (1440x900) ===');
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktopContext.newPage();

  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'patient@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/patient');
  await page.waitForTimeout(1000);

  const cardStyles = await page.evaluate(() => {
    const banner = document.querySelector('.page-header-card');
    const kpiCards = Array.from(document.querySelectorAll('.patient-kpi-grid > div, .patient-kpi-grid a > div'));
    const scanCard = document.querySelector('.card:not(.page-header-card):not(.tips-card):not(.chart-card)');
    const tipsCard = document.querySelector('.tips-card');
    const chartCard = document.querySelector('.chart-card');

    return {
      banner: {
        bg: banner ? window.getComputedStyle(banner).backgroundColor : null,
        blur: banner ? window.getComputedStyle(banner).backdropFilter : null,
        border: banner ? window.getComputedStyle(banner).border : null,
      },
      kpiCount: kpiCards.length,
      kpiBgs: kpiCards.map(c => window.getComputedStyle(c).backgroundColor),
      kpiBlurs: kpiCards.map(c => window.getComputedStyle(c).backdropFilter),
      scanCard: {
        bg: scanCard ? window.getComputedStyle(scanCard).backgroundColor : null,
        blur: scanCard ? window.getComputedStyle(scanCard).backdropFilter : null,
        border: scanCard ? window.getComputedStyle(scanCard).border : null,
      },
      tipsCard: {
        bg: tipsCard ? window.getComputedStyle(tipsCard).backgroundColor : null,
        blur: tipsCard ? window.getComputedStyle(tipsCard).backdropFilter : null,
        border: tipsCard ? window.getComputedStyle(tipsCard).border : null,
      },
      chartCard: {
        bg: chartCard ? window.getComputedStyle(chartCard).backgroundColor : null,
        blur: chartCard ? window.getComputedStyle(chartCard).backdropFilter : null,
        border: chartCard ? window.getComputedStyle(chartCard).border : null,
      }
    };
  });

  console.log('Welcome Banner:', cardStyles.banner);
  console.log('KPI Cards Count:', cardStyles.kpiCount);
  console.log('KPI Cards Backgrounds:', cardStyles.kpiBgs);
  console.log('KPI Cards Blurs:', cardStyles.kpiBlurs);
  console.log('Scan Card (Main):', cardStyles.scanCard);
  console.log('Tips Card:', cardStyles.tipsCard);
  console.log('Progression Chart Card:', cardStyles.chartCard);

  const desktopScreenshot = path.join(__dirname, 'screenshots', 'desktop_dashboard_transparent.png');
  await page.screenshot({ path: desktopScreenshot, fullPage: false });
  console.log('Saved desktop screenshot to:', desktopScreenshot);

  // 2. Mobile Viewport (390x844)
  console.log('\n=== 2. MOBILE VIEWPORT (390x844) ===');
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/login');
  await mobilePage.fill('input[type="email"]', 'patient@test.com');
  await mobilePage.fill('input[type="password"]', 'password123');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/dashboard/patient');
  await mobilePage.waitForTimeout(1000);

  const mobileCheck = await mobilePage.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  console.log('Mobile Check:', mobileCheck);

  const mobileScreenshot = path.join(__dirname, 'screenshots', 'mobile_dashboard_transparent.png');
  await mobilePage.screenshot({ path: mobileScreenshot, fullPage: false });
  console.log('Saved mobile screenshot to:', mobileScreenshot);

  await browser.close();
  console.log('\n=== ALL TRANSPARENCY AUDIT CHECKS COMPLETE ===');
}

testDashboardTransparency().catch(err => {
  console.error(err);
  process.exit(1);
});
