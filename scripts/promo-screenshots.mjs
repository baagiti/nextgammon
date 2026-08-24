import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SRC = process.argv[2];
const OUT = process.argv[3];
if (!SRC || !OUT) {
  console.error('usage: node promo-screenshots.mjs <src-dir> <out-dir>');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const WIDTH = 2732;
const HEIGHT = 2048;

const SLIDES = [
  {
    file: 'menu.png',
    out: '01-menu.png',
    eyebrow: 'CYBER BACKGAMMON',
    headline: 'CLASSIC BACKGAMMON.\nREWRITTEN RULES.',
    sub: 'Same board, same dice, same pip counting — with a synthwave soundtrack that never lets up.',
    align: 'bottom',
  },
  {
    file: 'gameplay.png',
    out: '02-gameplay.png',
    eyebrow: 'REAL BACKGAMMON AT THE CORE',
    headline: 'ROLL, RACE,\nBEAR OFF.',
    sub: 'Every rule you already know is still here — nothing about real backgammon is cut or dumbed down.',
    align: 'top',
  },
  {
    file: 'mutation.png',
    out: '03-mutation.png',
    eyebrow: '44 MUTATION CARDS',
    headline: 'BEND THE RULES.\nNOT THE GAME.',
    sub: 'Skip a roll, jam a checker, steal tempo — one equipped card changes how the whole match plays out.',
    align: 'top',
  },
  {
    file: 'equip.png',
    out: '04-draft.png',
    eyebrow: 'STRATEGIZE',
    headline: 'EVERY CARD\nCHANGES SOMETHING.',
    sub: 'Draft the mutation that turns this match into your match — then out-think an opponent doing the exact same thing.',
    align: 'bottom',
  },
  {
    file: 'campaign-act1.png',
    out: '05-campaign.png',
    eyebrow: 'A CYBERPUNK CAMPAIGN',
    headline: '44 STAGES.\n7 ACTS. 7 BOSSES.',
    sub: 'Climb from Boot Sector to Singularity, collecting cards and clearing rule-breaking Protocol Bosses.',
    align: 'top',
  },
  {
    file: 'campaign-act7.png',
    out: '06-endgame.png',
    eyebrow: 'HOW FAR CAN YOU PUSH IT',
    headline: 'ALL THE WAY TO\nOMEGA CORE.',
    sub: 'The deeper the run, the stranger the rules get — every Act adds cards that twist backgammon further.',
    align: 'top',
  },
  {
    file: 'cyberlab.png',
    out: '07-cyberlab.png',
    eyebrow: 'THE CYBER LAB',
    headline: 'COLLECT CARDS.\nBUILD YOUR DECK.',
    sub: 'Earn Neon Chips, recover captured cards, and shape your own strategy run after run.',
    align: 'top',
  },
];

const html = (imgDataUrl, s) => `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Chakra+Petch:wght@500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #050608; font-family: 'Chakra Petch', sans-serif; }
  .frame { position: relative; width: 100%; height: 100%; }
  .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }
  .scrim-top { position: absolute; top: 0; left: 0; right: 0; height: 44%; background: linear-gradient(to bottom, rgba(3,5,8,0.96) 0%, rgba(3,5,8,0.8) 60%, rgba(3,5,8,0) 100%); }
  .scrim-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 44%; background: linear-gradient(to top, rgba(3,5,8,0.96) 0%, rgba(3,5,8,0.8) 60%, rgba(3,5,8,0) 100%); }
  .text-block { position: absolute; left: 100px; right: 100px; z-index: 5; }
  .text-block.top { top: 66px; }
  .text-block.bottom { bottom: 84px; }
  .eyebrow { display: inline-block; font-family: 'Chakra Petch', sans-serif; font-weight: 600; font-size: 30px; letter-spacing: 0.28em; color: #00e5ff; text-shadow: 0 0 24px rgba(0,229,255,0.7); padding: 10px 22px; border: 2px solid rgba(0,229,255,0.6); border-radius: 8px; background: rgba(0,229,255,0.08); margin-bottom: 26px; }
  .headline { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 92px; line-height: 1.03; letter-spacing: 0.01em; text-transform: uppercase; white-space: pre-line; background: linear-gradient(90deg, #ffffff 0%, #d7f6ff 55%, #9fe8ff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 46px rgba(0,229,255,0.35); margin-bottom: 24px; }
  .sub { font-family: 'Chakra Petch', sans-serif; font-weight: 500; font-size: 33px; line-height: 1.4; color: #b9d6dc; max-width: 1560px; }
  .brand { position: absolute; top: 54px; right: 92px; z-index: 6; display: flex; align-items: center; gap: 16px; }
  .brand .nx { width: 64px; height: 64px; border-radius: 17px; background: linear-gradient(135deg, #ff2d78, #00e5ff); display: flex; align-items: center; justify-content: center; font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 29px; color: #050608; }
  .brand .word { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 34px; letter-spacing: 0.12em; color: #eaf7fa; }
</style></head>
<body>
  <div class="frame">
    <img class="bg" src="${imgDataUrl}" />
    <div class="${s.align === 'top' ? 'scrim-top' : 'scrim-bottom'}"></div>
    <div class="brand"><div class="nx">NX</div><div class="word">NEXTGAMMON</div></div>
    <div class="text-block ${s.align}">
      <div class="eyebrow">${s.eyebrow}</div>
      <div class="headline">${s.headline}</div>
      <div class="sub">${s.sub}</div>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

for (const s of SLIDES) {
  const imgPath = path.join(SRC, s.file);
  const imgBuf = fs.readFileSync(imgPath);
  const dataUrl = `data:image/png;base64,${imgBuf.toString('base64')}`;
  await page.setContent(html(dataUrl, s), { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, s.out) });
  console.log('rendered', s.out);
}

await browser.close();
