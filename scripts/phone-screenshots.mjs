import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// Phone store assets. The app is landscape-only on phones, so every profile below is a
// landscape logical viewport whose *smaller* side stays under useIsPhoneViewport's 600px
// cutoff — otherwise the tablet layout would render and the shots would be wrong.
const PROFILES = [
  // App Store 6.5" iPhone slot, landscape: 2778 x 1284 (ASC's required iPhone size)
  { dir: 'ios', width: 926, height: 428, scale: 3 },
  // Play Store phone, landscape 16:9: 1920 x 1080
  { dir: 'android', width: 960, height: 540, scale: 2 },
];

const OUT = process.argv[2] || 'store-assets/phone';

const browser = await chromium.launch();

for (const profile of PROFILES) {
  const dir = path.join(OUT, profile.dir);
  fs.mkdirSync(dir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    deviceScaleFactor: profile.scale,
    locale: 'en-US',
  });
  await context.addInitScript(() => {
    window.localStorage.setItem('i18nextLng', 'en');
    // Seeded Math.random so every run drafts the same card pool and rolls the same dice —
    // store shots stay reproducible, and the pool never includes a card that opens the
    // marked-checker picker over the board.
    let seed = 20260922;
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
  const page = await context.newPage();

  const shot = async (name) => {
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(dir, name) });
    console.log('captured', profile.dir, name, `${profile.width * profile.scale}x${profile.height * profile.scale}`);
  };

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot('01-main-menu.png');

  await page.getByText('START 1V1 MATCH', { exact: false }).first().click();
  await page.waitForTimeout(1000);
  await shot('02-card-draft.png');

  await page.getByText('Start Match with Chosen Card', { exact: false }).first().click();
  await page.waitForTimeout(1400);
  await shot('03-match-board.png');

  // Rolled dice + legal-move highlights make the board read as a live game rather than a setup.
  await page.getByRole('button', { name: /roll/i }).first().click();
  await page.waitForTimeout(1600);
  await shot('04-match-rolled.png');

  await context.close();
}

await browser.close();
