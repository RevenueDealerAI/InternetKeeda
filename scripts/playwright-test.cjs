const { chromium } = require("playwright-core");
(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto("https://www.internetkeeda.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
    const title = await page.title();
    await page.screenshot({ path: "C:/Users/hp/AppData/Local/Temp/screenshots/home-test.png", fullPage: false });
    await browser.close();
    console.log("OK title:", title);
  } catch (e) {
    console.error("FAIL", e.message);
    process.exit(1);
  }
})();
