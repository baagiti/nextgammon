import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT = process.argv[2] || 'out';
fs.mkdirSync(OUT, { recursive: true });

const WIDTH = 2048;
const HEIGHT = 2732;

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

// 1v1 Quick Match -> card draft modal opens automatically
await page.getByText('START 1V1 MATCH', { exact: false }).first().click();
await page.waitForTimeout(1000);
await shot('06-card-draft.png');

// Start match with the CPU's auto-chosen default card
await page.getByText('Start Match with Chosen Card', { exact: false }).first().click();
await page.waitForTimeout(1200);
await shot('07-match-start.png');

// Roll the dice
await page.getByRole('button', { name: /roll/i }).first().click();
await page.waitForTimeout(1000);
await shot('08-match-dice-rolled.png');

// Play a move: click a point with player checkers, then a legal destination.
// Board points are divs with cursor:pointer whose text is the point number.
const clickPoint = async (label) => {
  await page.evaluate((lbl) => {
    const cands = Array.from(document.querySelectorAll('div')).filter((el) => {
      const cs = getComputedStyle(el);
      return cs.cursor === 'pointer' && el.children.length <= 6 && el.getBoundingClientRect().height > 50;
    });
    const target = cands.find((el) => el.innerText.trim() === lbl);
    if (target) target.click();
  }, label);
};

await clickPoint('12');
await page.waitForTimeout(400);
await clickPoint('10'); // 12 minus a 2
await page.waitForTimeout(400);
await clickPoint('6'); // 12 minus a 6, or whichever die remains
await page.waitForTimeout(1000);
await shot('09-match-after-move.png');

await browser.close();
