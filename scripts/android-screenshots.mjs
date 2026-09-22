import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT = process.argv[2] || 'store-assets/android/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const WIDTH = 2560;
const HEIGHT = 1440;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, locale: 'en-US' });
await context.addInitScript(() => {
  window.localStorage.setItem('i18nextLng', 'en');
});
const page = await context.newPage();

const shot = async (name) => {
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, name) });
  console.log('captured', name);
};

await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await shot('01-main-menu.png');

await page.getByText('START 1V1 MATCH', { exact: false }).first().click();
await page.waitForTimeout(1000);
await shot('02-card-draft.png');

await page.getByText('Start Match with Chosen Card', { exact: false }).first().click();
await page.waitForTimeout(1200);
await shot('03-match-board.png');

await browser.close();
