/* Internet Keeda — end-to-end smoke / Playwright trace.
 *
 * Drives the public surface that doesn't need authentication. Logs
 * each step's pass/fail to stdout and writes a Playwright trace to
 * `traces/e2e-<timestamp>.zip` for later inspection.
 *
 * Steps that DO need authentication (Clerk sign-in, Cashfree subs,
 * Boost flow) are stubbed out with a clear log line — they require
 * test credentials this script doesn't have. The stubs document the
 * exact sequence so a creds-equipped caller can plug them in.
 *
 * Usage:
 *   TARGET_URL=http://localhost:3000 \
 *   CLERK_TEST_EMAIL=tester@example.com \
 *   CLERK_TEST_PASSWORD=... \
 *   CASHFREE_TEST_UPI=testsuccess@gocash \
 *   node scripts/e2e-smoke.cjs
 *
 * Set RUN_AUTHENTICATED=1 to attempt the full chain — otherwise it
 * runs the public smoke and skips the gated steps.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const TARGET = process.env.TARGET_URL || 'http://localhost:3000';
const STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const TRACE_DIR = process.env.TRACE_DIR || path.join(process.cwd(), 'traces');
const TRACE = path.join(TRACE_DIR, `e2e-${STAMP}.zip`);
const SHOTS = process.env.SCREENSHOT_DIR || 'C:/Users/hp/AppData/Local/Temp/screenshots';

fs.mkdirSync(TRACE_DIR, { recursive: true });
fs.mkdirSync(SHOTS, { recursive: true });

const log = (step, status, extra = '') =>
  console.log(`[${status.padEnd(5)}] ${step}${extra ? ' — ' + extra : ''}`);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROME ||
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.tracing.start({ screenshots: true, snapshots: true });
  const page = await ctx.newPage();

  // Surface uncaught page errors as test failures
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  let pass = 0, fail = 0;
  const assert = (cond, step, extra) => {
    if (cond) { pass++; log(step, 'PASS', extra); }
    else      { fail++; log(step, 'FAIL', extra); }
  };

  // Dev-server runs allow longer client-render waits. Override with
  // CLIENT_WAIT_MS=2000 against a production deploy.
  const CLIENT_WAIT = parseInt(process.env.CLIENT_WAIT_MS || '15000', 10);

  try {
    // 1. Home page boots and renders tools
    await page.goto(TARGET + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(CLIENT_WAIT);
    const title = await page.title();
    assert(title.toLowerCase().includes('keeda') || title.toLowerCase().includes('internet'),
           'home loads', `title="${title}"`);
    await page.screenshot({ path: path.join(SHOTS, `e2e-${STAMP}-home.png`), fullPage: false });

    // 2. Submit-tool form loads — and the underlying /api/categories
    //    returns ≥40 entries. (The form uses a radix Select that
    //    portals options outside the form when opened; counting
    //    options without driving the click is fragile, so the
    //    real-world check is the API the form reads from.)
    await page.goto(TARGET + '/submit-tool', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(CLIENT_WAIT);
    const submitTitle = await page.title();
    assert(submitTitle.length > 0, 'submit-tool loads', `title="${submitTitle}"`);
    const catResp = await page.request.get(TARGET + '/api/categories');
    const catJson = catResp.ok() ? await catResp.json() : null;
    const catCount = catJson && Array.isArray(catJson.data) ? catJson.data.length : 0;
    assert(catCount >= 40, 'submit-tool dropdown data has ≥40 categories',
           `api count=${catCount}`);
    await page.screenshot({ path: path.join(SHOTS, `e2e-${STAMP}-submit.png`), fullPage: false });

    // 3. Category page renders and shows tools (give it 6s — client
    //    component fetches /api/tools after first paint).
    await page.goto(TARGET + '/category/image-generation',
                    { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(CLIENT_WAIT);
    // Probe several plausible selectors — different theme variants
    // wrap cards differently.
    const toolCardsOnCategory = await page.evaluate(() => {
      const sel = [
        'article',
        '[data-tool-id]',
        'a[href^="/ai-tools/"]',
        '[class*="ProductCard"]',
        '[class*="product-card"]',
      ];
      const counts = sel.map((s) => document.querySelectorAll(s).length);
      return Math.max(...counts);
    });
    assert(toolCardsOnCategory > 0, 'category page has tools', `cards=${toolCardsOnCategory}`);
    await page.screenshot({ path: path.join(SHOTS, `e2e-${STAMP}-category.png`), fullPage: true });

    // 4. Tool detail page (use the most-viewed seed: notion-ai). Wait
    //    for the H1 to populate from the client fetch rather than
    //    trusting the initial document title.
    await page.goto(TARGET + '/ai-tools/notion-ai',
                    { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(CLIENT_WAIT);
    const detailHeading = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent?.trim() || '' : '';
    });
    assert(detailHeading.length > 0 && /notion/i.test(detailHeading),
           'tool detail loads notion-ai', `h1="${detailHeading.slice(0, 40)}"`);

    // 5. Public API smoke
    const apis = [
      ['/api/categories', (d) => Array.isArray(d.data) && d.data.length >= 40],
      ['/api/tools?limit=5', (d) => Array.isArray(d.data) && d.data.length > 0],
      ['/api/tools/stats', (d) => typeof d.totalTools === 'number' && d.totalTools > 0],
    ];
    for (const [route, check] of apis) {
      const res = await page.request.get(TARGET + route);
      const body = res.ok() ? await res.json() : null;
      assert(res.ok() && body && check(body), `GET ${route}`,
             `status=${res.status()}`);
    }

    // 6. Authenticated chain — Clerk sign-in, ₹499 subscription, boost.
    //    These require credentials and a Cashfree test merchant.
    if (process.env.RUN_AUTHENTICATED === '1') {
      log('authenticated chain', 'TODO', 'Clerk + Cashfree creds required');
      // Pseudo-sequence the creds-equipped caller would run:
      //   await page.goto(TARGET + '/sign-in');
      //   await page.fill('input[name=identifier]', process.env.CLERK_TEST_EMAIL);
      //   await page.click('button[type=submit]');
      //   await page.fill('input[name=password]', process.env.CLERK_TEST_PASSWORD);
      //   await page.click('button[type=submit]');
      //   await page.waitForURL(/\/dashboard/);
      //   await page.goto(TARGET + '/submit-tool');
      //   await page.fill('input[name=name]', 'playwright-final-test');
      //   await page.fill('input[name=websiteUrl]', 'https://example.com');
      //   await page.fill('textarea[name=description]', '…');
      //   await page.selectOption('select[name=category]', 'image-generation');
      //   await page.click('button:has-text("Submit")');
      //   await page.waitForURL(/\/subscription\//);
      //   // Cashfree iframe — fill testsuccess@gocash, submit, wait for return.
      //   await page.waitForURL(/\/subscription\/return/, { timeout: 90000 });
      //   await page.locator('text=Listing activated').waitFor();
      //   await page.locator('button:has-text("Boost")').first().click();
      //   // Repeat Cashfree dance for boost…
      //   await page.waitForURL(/\/payment\/return/, { timeout: 90000 });
      //   await page.locator('text=Boost activated').waitFor();
      //   // Fresh context — verify visibility on category page.
      //   const ctx2 = await browser.newContext();
      //   const p2 = await ctx2.newPage();
      //   await p2.goto(TARGET + '/category/image-generation');
      //   const visible = await p2.locator('text=playwright-final-test').isVisible();
      //   assert(visible, 'submitted tool visible on category page');
      //   // Cleanup — direct Mongo delete with the same script's mongoose
      //   // connection (or a `npx tsx scripts/cleanup-test-tool.ts <slug>`
      //   // companion).
    } else {
      log('authenticated chain', 'SKIP', 'set RUN_AUTHENTICATED=1 with Clerk + Cashfree creds');
    }

    // Any uncaught page errors during the run?
    assert(pageErrors.length === 0, 'no uncaught page errors',
           pageErrors.length ? pageErrors.slice(0, 3).join(' | ') : 'none');
  } catch (e) {
    fail++;
    log('runner exception', 'FAIL', e.message);
  } finally {
    await ctx.tracing.stop({ path: TRACE });
    await browser.close();
  }

  console.log(`\nTRACE: ${TRACE}`);
  console.log(`PASS:  ${pass}`);
  console.log(`FAIL:  ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
})();
