/* Visit the local admin dashboard headlessly and screenshot whatever
 * renders. For unauthenticated visits this captures the auth bounce
 * page — still useful to verify the page boots without runtime
 * errors. */
const { chromium } = require('playwright-core');
const path = require('path');

const OUT = process.env.SCREENSHOT_DIR || 'C:/Users/hp/AppData/Local/Temp/screenshots';
const URL = process.env.TARGET_URL || 'http://localhost:3000/admin';
const NAME = process.env.SHOT_NAME || 'admin-default';

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROME ||
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
    });

    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const dp = await desktop.newPage();
    await dp.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await dp.waitForTimeout(2500);
    const dPath = path.join(OUT, `${NAME}-desktop.png`);
    await dp.screenshot({ path: dPath, fullPage: true });
    console.log('desktop:', dPath, 'title:', await dp.title());

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mp = await mobile.newPage();
    await mp.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mp.waitForTimeout(2500);
    const mPath = path.join(OUT, `${NAME}-mobile.png`);
    await mp.screenshot({ path: mPath, fullPage: true });
    console.log('mobile:', mPath);

    await browser.close();
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    console.error('FAIL', e.message);
    process.exit(1);
  }
})();
