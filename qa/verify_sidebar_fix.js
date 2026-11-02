const { chromium } = require('playwright');

async function testSidebar() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('--- 1. Testing Desktop (1440x900) ---');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'patient@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/patient');

  const checkPage = async (pageName, url) => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const data = await page.evaluate(() => {
      const sidebar = document.querySelector('.dashboard-sidebar');
      const sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;

      const activeLink = document.querySelector('.sidebar-link.active');
      const activeStyle = activeLink ? window.getComputedStyle(activeLink) : null;
      const activeSpan = activeLink ? activeLink.querySelector('span') : null;
      const activeSpanStyle = activeSpan ? window.getComputedStyle(activeSpan) : null;
      const activeSvg = activeLink ? activeLink.querySelector('svg') : null;
      const activeSvgStyle = activeSvg ? window.getComputedStyle(activeSvg) : null;

      const inactiveLinks = Array.from(document.querySelectorAll('.sidebar-nav .sidebar-link:not(.active)'));
      const sampleInactive = inactiveLinks[0];
      const inactiveStyle = sampleInactive ? window.getComputedStyle(sampleInactive) : null;
      const inactiveSpan = sampleInactive ? sampleInactive.querySelector('span') : null;
      const inactiveSpanStyle = inactiveSpan ? window.getComputedStyle(inactiveSpan) : null;
      const inactiveSvg = sampleInactive ? sampleInactive.querySelector('svg') : null;
      const inactiveSvgStyle = inactiveSvg ? window.getComputedStyle(inactiveSvg) : null;

      const logout = document.querySelector('.sidebar-footer .text-logout, .sidebar-footer .sidebar-link');
      const logoutStyle = logout ? window.getComputedStyle(logout) : null;
      const logoutSpan = logout ? logout.querySelector('span') : null;
      const logoutSpanStyle = logoutSpan ? window.getComputedStyle(logoutSpan) : null;
      const logoutSvg = logout ? logout.querySelector('svg') : null;
      const logoutSvgStyle = logoutSvg ? window.getComputedStyle(logoutSvg) : null;
      const footer = document.querySelector('.sidebar-footer');
      const footerStyle = footer ? window.getComputedStyle(footer) : null;

      return {
        sidebarBg: sidebarStyle?.backgroundColor,
        sidebarBackdrop: sidebarStyle?.backdropFilter,
        sidebarBorderRight: sidebarStyle?.borderRight,
        activeText: activeSpan?.innerText,
        activeBg: activeStyle?.backgroundImage || activeStyle?.backgroundColor,
        activeColor: activeSpanStyle?.color,
        activeSvgColor: activeSvgStyle?.color,
        inactiveText: inactiveSpan?.innerText,
        inactiveBg: inactiveStyle?.backgroundColor,
        inactiveColor: inactiveSpanStyle?.color,
        inactiveWeight: inactiveSpanStyle?.fontWeight,
        inactiveSvgColor: inactiveSvgStyle?.color,
        footerBg: footerStyle?.backgroundColor,
        logoutColor: logoutSpanStyle?.color,
        logoutSvgColor: logoutSvgStyle?.color,
      };
    });

    console.log(`\nPage: ${pageName}`);
    console.log(`  Sidebar Background: ${data.sidebarBg}`);
    console.log(`  Sidebar Backdrop Filter: ${data.sidebarBackdrop}`);
    console.log(`  Sidebar Border Right: ${data.sidebarBorderRight}`);
    console.log(`  Active Nav: "${data.activeText}" | Color: ${data.activeColor} | SVG: ${data.activeSvgColor} | Background: ${data.activeBg?.slice(0, 45)}...`);
    console.log(`  Inactive Nav: "${data.inactiveText}" | Color: ${data.inactiveColor} (weight: ${data.inactiveWeight}) | SVG: ${data.inactiveSvgColor} | Bg: ${data.inactiveBg}`);
    console.log(`  Footer Bg: ${data.footerBg} | Logout Text: ${data.logoutColor} | Logout Icon: ${data.logoutSvgColor}`);
  };

  await checkPage('Dashboard', 'http://localhost:5173/dashboard/patient');
  await checkPage('Screening History', 'http://localhost:5173/dashboard/patient/screening-history');
  await checkPage('My Appointments', 'http://localhost:5173/dashboard/patient/consultations');

  console.log('\n--- 2. Testing Mobile (390x844) ---');
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/login');
  await mobilePage.fill('input[type="email"]', 'patient@test.com');
  await mobilePage.fill('input[type="password"]', 'password123');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/dashboard/patient');

  const mobileCheck = await mobilePage.evaluate(() => {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const main = document.querySelector('.dashboard-main');
    const sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
    const mainStyle = main ? window.getComputedStyle(main) : null;
    return {
      sidebarTransform: sidebarStyle?.transform,
      mainMarginLeft: mainStyle?.marginLeft,
      mainWidth: mainStyle?.width,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: window.innerWidth,
    };
  });
  console.log('Mobile Check Results:');
  console.log(`  Sidebar Transform: ${mobileCheck.sidebarTransform}`);
  console.log(`  Main Margin Left: ${mobileCheck.mainMarginLeft}`);
  console.log(`  Horizontal Overflow: ${mobileCheck.scrollWidth > mobileCheck.clientWidth ? 'YES' : 'NO'}`);

  await browser.close();
}

testSidebar().catch(err => {
  console.error(err);
  process.exit(1);
});
