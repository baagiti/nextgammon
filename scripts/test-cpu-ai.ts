import { createInitialBoard, getValidMoves, executeMove } from '../src/game/backgammonEngine';
import { getBestCpuMove } from '../src/game/cpuAI';
import type { OpponentCard } from '../src/types';

function timeIt<T>(label: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const ms = performance.now() - start;
  console.log(`${label}: ${ms.toFixed(1)}ms`);
  return result;
}

function opponent(id: string, difficulty: number): OpponentCard {
  return {
    id,
    bossName: 'TEST',
    bossTitle: 'test',
    avatarSeed: 'x',
    accentColor: '#fff',
    quote: '',
    difficulty,
    signatureCardId: '',
  };
}

// Play a handful of CPU-vs-itself turns from the opening position to reach a mid-game-ish board,
// using a fixed dice sequence (deterministic, no card effects) just to get realistic structure.
let board = createInitialBoard();
const openingRolls: [number, number][] = [
  [3, 5], [6, 2], [4, 1], [5, 5], [2, 6], [1, 3], [4, 4], [6, 3],
];

for (const [d1, d2] of openingRolls) {
  for (const turn of ['player', 'cpu'] as const) {
    const isDoubles = d1 === d2;
    const dice = isDoubles ? [d1, d1, d1, d1] : [d1, d2];
    let remaining = [...dice];
    let guard = 0;
    while (remaining.length > 0 && guard < 6) {
      guard++;
      const moves = getValidMoves(board, turn, remaining, [], undefined, isDoubles, {});
      if (moves.length === 0) break;
      const move = moves[0]; // dumb fixed choice, just to build a plausible mid-game board
      const res = executeMove(board, turn, move, [], undefined, {});
      board = res.newBoard;
      const idx = remaining.indexOf(move.dieUsed);
      if (idx >= 0) remaining.splice(idx, 1);
    }
  }
}

console.log('--- Mid-game board built, testing getBestCpuMove at each tier ---');
console.log(JSON.stringify({ bar: board.bar, off: board.off }));

for (const [label, diff] of [
  ['easy (quick-match GLITCH-9, difficulty=1)', 1],
  ['medium (difficulty=4)', 4],
  ['hard (campaign stage 30)', 30],
  ['master (campaign stage 44, OMEGA CORE)', 44],
] as const) {
  const opp = label.includes('stage')
    ? opponent(`stage_${diff}`, diff)
    : opponent('boss_test', diff);
  timeIt(label, () => getBestCpuMove(board, [3, 5], opp, [], false, {}));
}

console.log('--- Doubles case (4 dice), hard tier ---');
timeIt('hard, doubles [4,4,4,4]', () =>
  getBestCpuMove(board, [4, 4, 4, 4], opponent('stage_30', 30), [], true, {})
);

console.log('OK — no crashes.');
