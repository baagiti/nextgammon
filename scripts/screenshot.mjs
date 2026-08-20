import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT = process.argv[2] || 'out';
fs.mkdirSync(OUT, { recursive: true });

const WIDTH = Number(process.argv[3]) || 1284;
const HEIGHT = Number(process.argv[4]) || 2778;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, locale: 'en-US' });
await context.addInitScript(() => {
  window.localStorage.setItem('i18nextLng', 'en');
});
const page = await context.newPage();

const shot = async (name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, name) });
  console.log('captured', name);
};

await page.goto('http://localhost:3055', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

// 1. Main menu
await shot('01-main-menu.png');

// 2. Start run -> Map
await page.getByText('START RUN', { exact: false }).first().click();
await page.waitForTimeout(800);
await shot('02-run-map.png');

// 3. Battle opponent -> card draft
await page.getByText('BATTLE OPPONENT', { exact: false }).first().click();
await page.waitForTimeout(900);
await shot('03-boss-intro-or-draft.png');

// 4. Equip & engage -> match board
await page.getByText('EQUIP & ENGAGE', { exact: false }).first().click();
await page.waitForTimeout(1500);
await shot('04-match-board.png');

// 5. Cyber Lab (Meta Lab) — permanent button in header, has chip count text
await page.locator('button').filter({ hasText: /^\d+$/ }).first().click();
await page.waitForTimeout(900);
await shot('05-cyber-lab.png');
await browser.close();
