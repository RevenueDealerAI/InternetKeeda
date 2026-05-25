const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Categories endpoint itself
  const apiResp = await page.request.get("https://www.internetkeeda.com/api/categories");
  const apiBody = await apiResp.json();
  const cats = apiBody.data || [];
  console.log("API category count:", cats.length);
  console.log("First 8 names:", cats.slice(0, 8).map((c) => c.name).join(" | "));
  console.log("Alpha-sorted?", cats.slice(0, 8).every((c, i, a) => i === 0 || c.name.toLowerCase() >= a[i - 1].name.toLowerCase()));

  // Server-side slug validation — POST a bogus category
  const bogus = await page.request.post("https://www.internetkeeda.com/api/tools/submit", {
    data: { name: "Bogus", websiteUrl: "https://example.com", description: "this is a description longer than twenty characters for validation", category: "totally-fake-slug-xyz" },
  });
  console.log("Bogus slug submit status:", bogus.status());

  await browser.close();
})();
