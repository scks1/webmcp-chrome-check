// WebMCP long-poll listing in real Google Chrome (GitHub Actions runner).
// Same method as the local Edge probe: list only, never call a store tool.
// Polls page.webmcp.tools() AND document.modelContext.getTools() every 3s
// for up to 60s; records the timeline so late registration is visible.
// Usage: node probe.mjs <url> <out.json>
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const [url, outPath] = process.argv.slice(2);
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-features=WebMCP', '--no-sandbox', '--disable-dev-shm-usage'],
});
const rec = { url, browser: 'google-chrome', startedAt: new Date().toISOString() };
try {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: 'commit', timeout: 45000 });
  rec.status = resp && resp.status();
  rec.chromeVersion = await browser.version().catch(() => null);
  const timeline = [];
  let last = [];
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(3000);
    let names = [], via = null, err = null;
    try {
      if (page.webmcp && page.webmcp.tools) { const tools = await page.webmcp.tools(); names = tools.map(t => t.name); via = 'page.webmcp'; }
    } catch (e) { err = e.message.split('\n')[0]; }
    if (!names.length) {
      try {
        names = await page.evaluate(async () => {
          const mc = document.modelContext;
          if (!mc || !mc.getTools) return [];
          const raw = await mc.getTools();
          return raw.map(t => t.name);
        });
        via = via || 'modelContext.getTools';
      } catch (e) { err = err || e.message.split('\n')[0]; }
    }
    timeline.push({ s: Math.round((Date.now() - t0) / 1000), count: names.length, names, via, err });
    last = names;
    if (names.length > 0 && i >= 9) break;
  }
  rec.elapsedS = Math.round((Date.now() - t0) / 1000);
  rec.finalCount = last.length;
  rec.finalNames = last;
  rec.timeline = timeline;
  rec.pageState = await page.evaluate(() => ({ title: document.title, href: location.href, hasModelContext: typeof document.modelContext !== 'undefined' })).catch(e => ({ stateError: e.message.split('\n')[0] }));
} catch (e) {
  rec.error = e.message.split('\n')[0];
} finally {
  await browser.close().catch(() => {});
  fs.writeFileSync(outPath, JSON.stringify(rec, null, 1));
  console.log(JSON.stringify(rec, null, 1));
}
