import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT = process.argv[2] || 'out';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1284, height: 2778 }, deviceScaleFactor: 1, locale: 'en-US' });
await context.addInitScript(() => {
  window.localStorage.setItem('i18nextLng', 'en');
});
const page = await context.newPage();

await page.goto('http://localhost:3055', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.getByText('START RUN', { exact: false }).first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, 'paywall.png') });
console.log('captured paywall.png');

await browser.close();
