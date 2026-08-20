import { BoardState, PlayerId, Card, OpponentCard } from '../types';
import {
  getValidMoves,
  executeMove,
  calculatePipCount,
  ValidMoveResult,
  ExecuteMoveContext,
} from './backgammonEngine';

// Ported from the tavla-limitless 2-ply engine. Probability (out of 36 two-die rolls) of rolling
// a given pip distance, either directly on one die or as a combination of both — this is what lets
// blot-exposure scoring understand "a checker 8 pips away can still be hit by a 6-2 or 5-3", not
// just direct 1-6 shots.
const SHOT_PROBABILITIES: { [distance: number]: number } = {
  1: 11 / 36,
  2: 12 / 36,
  3: 14 / 36,
  4: 15 / 36,
  5: 15 / 36,
  6: 17 / 36,
  7: 6 / 36,
  8: 6 / 36,
  9: 5 / 36,
  10: 3 / 36,
  11: 2 / 36,
  12: 3 / 36,
};

const opponentOf = (p: PlayerId): PlayerId => (p === 'player' ? 'cpu' : 'player');

// Point index a bar checker re-enters on for a given die — same formula used throughout
// backgammonEngine.ts (getValidMoves' bar-entry / BATCH_UPLOAD logic).
const barEntryPoint = (p: PlayerId, die: number) => (p === 'player' ? 24 - die : die - 1);

function anticipatedHitRisk(board: BoardState, forPlayer: PlayerId): number {
  const opponent = opponentOf(forPlayer);
  let totalExposure = 0;

  for (let i = 0; i < 24; i++) {
    if (board.points[i].filter((c) => c.color === forPlayer).length !== 1) continue; // only blots

    let hitChance = 0;

    // Threat from opponent's bar (single-die direct entry only)
    const oppBar = opponent === 'player' ? board.bar.player : board.bar.cpu;
    if (oppBar > 0) {
      for (let die = 1; die <= 6; die++) {
        if (barEntryPoint(opponent, die) === i) {
          hitChance = Math.max(hitChance, SHOT_PROBABILITIES[die] || 0);
        }
      }
    }

    // Threat from opponent checkers already on the board
    for (let j = 0; j < 24; j++) {
      if (!board.points[j].some((c) => c.color === opponent)) continue;
      const dist = opponent === 'cpu' ? i - j : j - i; // opponent moves toward increasing (cpu) or decreasing (player) index
      if (dist > 0 && dist <= 12) {
        hitChance = Math.max(hitChance, SHOT_PROBABILITIES[dist] || 0);
      }
    }

    // Deeper in your own board = a hit costs more pips
    const severity = forPlayer === 'player' ? i + 1 : 24 - i;
    totalExposure += hitChance * severity * 2.2;
  }

  return totalExposure;
}

/**
 * Position value from `forPlayer`'s perspective — symmetric by construction, so
 * evaluatePosition(board, 'player', ...) === -evaluatePosition(board, 'cpu', ...). That symmetry is
 * what makes the 2-ply search below valid: the same yardstick has to judge both sides' turns.
 */
export function evaluatePosition(
  board: BoardState,
  forPlayer: PlayerId,
  playerCards: Card[] = [],
  opponentCard?: OpponentCard
): number {
  const opponent = opponentOf(forPlayer);

  const myBorne = forPlayer === 'player' ? board.off.player : board.off.cpu;
  const oppBorne = forPlayer === 'player' ? board.off.cpu : board.off.player;
  if (myBorne === 15) return 2000;
  if (oppBorne === 15) return -2000;

  let score = (myBorne - oppBorne) * 30;

  const pipDiff = calculatePipCount(board, opponent) - calculatePipCount(board, forPlayer);
  score += pipDiff * 1.6;

  const myBar = forPlayer === 'player' ? board.bar.player : board.bar.cpu;
  const oppBar = forPlayer === 'player' ? board.bar.cpu : board.bar.player;
  score -= myBar * 135;
  score += oppBar * 135;

  const myHomeRange = forPlayer === 'player' ? [0, 5] : [18, 23];
  const oppHomeRange = opponent === 'player' ? [0, 5] : [18, 23];

  let myConsecutive = 0;
  let maxMyPrime = 0;
  let oppConsecutive = 0;
  let maxOppPrime = 0;
  let myHomeMade = 0;

  for (let i = 0; i < 24; i++) {
    const myCount = board.points[i].filter((c) => c.color === forPlayer).length;
    const oppCount = board.points[i].filter((c) => c.color === opponent).length;
    const isMyHome = i >= myHomeRange[0] && i <= myHomeRange[1];

    if (myCount >= 2) {
      myConsecutive++;
      if (myConsecutive > maxMyPrime) maxMyPrime = myConsecutive;
      oppConsecutive = 0;
      score += 35;
      if (isMyHome) {
        myHomeMade++;
        score += 50;
        // Golden point (5-pt), 4-pt, bar-pt — same special-point bonuses regardless of side.
        const fivePt = forPlayer === 'player' ? 4 : 19;
        const fourPt = forPlayer === 'player' ? 3 : 20;
        const barPt = forPlayer === 'player' ? 6 : 17;
        if (i === fivePt) score += 24;
        if (i === fourPt) score += 16;
        if (i === barPt) score += 18;
      }
      if (myCount > 4) score -= (myCount - 4) * 10;
    } else if (oppCount >= 2) {
      oppConsecutive++;
      if (oppConsecutive > maxOppPrime) maxOppPrime = oppConsecutive;
      myConsecutive = 0;
      score -= 30;
      const isOppHome = i >= oppHomeRange[0] && i <= oppHomeRange[1];
      if (isOppHome) score -= 40;
    } else {
      myConsecutive = 0;
      oppConsecutive = 0;
    }
  }

  if (maxMyPrime >= 4) score += Math.pow(maxMyPrime - 2, 2) * 18;
  if (maxOppPrime >= 4) score -= Math.pow(maxOppPrime - 2, 2) * 18;

  if (oppBar > 0 && myHomeMade >= 3) score += myHomeMade * 15 * oppBar;

  // Escaping back checkers — starting-position stragglers still deep in the opponent's territory.
  const backRange = forPlayer === 'player' ? [21, 23] : [0, 2];
  let backCheckers = 0;
  for (let i = backRange[0]; i <= backRange[1]; i++) {
    backCheckers += board.points[i].filter((c) => c.color === forPlayer).length;
  }
  score -= backCheckers * 20;

  score -= anticipatedHitRisk(board, forPlayer) * 1.5;
  score += anticipatedHitRisk(board, opponent) * 1.2;

  // Anchors held in the opponent's home board — defensive outposts.
  for (let i = oppHomeRange[0]; i <= oppHomeRange[1]; i++) {
    if (board.points[i].filter((c) => c.color === forPlayer).length >= 2) {
      score += 20;
      const advancedAnchor = forPlayer === 'player' ? 19 : 4;
      if (i === advancedAnchor) score += 10;
    }
  }

  const hasCheckerOutsideHome = (p: PlayerId, homeRange: [number, number]) => {
    for (let i = 0; i < 24; i++) {
      const outsideHome = p === 'player' ? i > homeRange[1] : i < homeRange[0];
      if (outsideHome && board.points[i].some((c) => c.color === p)) return true;
    }
    return false;
  };

  const myCanBearOff = myBar === 0 && !hasCheckerOutsideHome(forPlayer, myHomeRange as [number, number]);
  if (myCanBearOff) {
    score += 50;
    let emptyHome = 0;
    for (let i = myHomeRange[0]; i <= myHomeRange[1]; i++) {
      if (board.points[i].filter((c) => c.color === forPlayer).length === 0) emptyHome++;
    }
    score -= emptyHome * 8;
  }
  const oppCanBearOff = oppBar === 0 && !hasCheckerOutsideHome(opponent, oppHomeRange as [number, number]);
  if (oppCanBearOff) score -= 50;

  // playerCards/opponentCard are accepted for forward compatibility (e.g. scoring a soon-to-fire
  // mutation) but every card that changes legality or die values is already baked into the board
  // state and the dice by the time evaluatePosition runs — see rollDice() and getValidMoves().
  void playerCards;
  void opponentCard;

  return score;
}

/**
 * Greedily plays out the given dice pool on `board` for `player`, always taking the option that
 * maximizes evaluatePosition after the full pool is used (or exhausted / blocked). This is the
 * "assume this side plays this turn well" building block reused both for the CPU's own candidate
 * turns and — mirrored onto 'player' — for approximating the opponent's reply during 2-ply search.
 */
function bestTurnBoard(
  board: BoardState,
  player: PlayerId,
  dice: number[],
  playerCards: Card[],
  cpuCard: Card | OpponentCard | undefined,
  isDoubles: boolean,
  ctx: ExecuteMoveContext
): { finalBoard: BoardState; firstMove: ValidMoveResult | null } {
  if (dice.length === 0) return { finalBoard: board, firstMove: null };

  const options = getValidMoves(board, player, dice, playerCards, cpuCard, isDoubles, ctx);
  if (options.length === 0) return { finalBoard: board, firstMove: null };

  let bestFinalBoard = board;
  let bestFirstMove: ValidMoveResult | null = null;
  let bestScore = -Infinity;

  for (const move of options) {
    const res = executeMove(board, player, move, playerCards, cpuCard, ctx);
    let newDice = [...dice];
    const idx = newDice.indexOf(move.dieUsed);
    if (idx >= 0) newDice.splice(idx, 1);
    if (res.boostRemainingDice) newDice = newDice.map((d) => Math.min(6, d + res.boostRemainingDice!));
    if (res.taxRemainingDice) newDice = newDice.map((d) => Math.max(1, d - res.taxRemainingDice!));
    if (res.removeOneDie && newDice.length > 0) newDice.pop();

    const rest = bestTurnBoard(res.newBoard, player, newDice, playerCards, cpuCard, isDoubles, ctx);
    const score = evaluatePosition(rest.finalBoard, player, playerCards, cpuCard as OpponentCard | undefined);
    if (score > bestScore) {
      bestScore = score;
      bestFinalBoard = rest.finalBoard;
      bestFirstMove = move;
    }
  }

  return { finalBoard: bestFinalBoard, firstMove: bestFirstMove };
}

// Every distinct dice-roll outcome (21 combinations), weighted by how many of the 36 physical
// two-die rolls produce it (doubles: 1/36, others: 2/36).
const ALL_ROLLS: { dice: number[]; weight: number; isDoubles: boolean }[] = (() => {
  const rolls: { dice: number[]; weight: number; isDoubles: boolean }[] = [];
  for (let a = 1; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      rolls.push({ dice: a === b ? [a, a, a, a] : [a, b], weight: a === b ? 1 : 2, isDoubles: a === b });
    }
  }
  return rolls;
})();

/**
 * 2-ply equity for the CPU: from a resulting board, averages over every possible reply roll the
 * human player could get (weighted by probability), assuming they reply with their own best turn.
 */
function evaluateTwoPly(
  board: BoardState,
  playerCards: Card[],
  opponentCard: OpponentCard | undefined,
  moveCtx: ExecuteMoveContext
): number {
  let weightedTotal = 0;
  for (const { dice, weight, isDoubles } of ALL_ROLLS) {
    const reply = bestTurnBoard(board, 'player', dice, playerCards, opponentCard, isDoubles, moveCtx);
    weightedTotal += evaluatePosition(reply.finalBoard, 'cpu', playerCards, opponentCard) * weight;
  }
  return weightedTotal / 36;
}

type Tier = 'easy' | 'medium' | 'hard' | 'master';

// Difficulty is read off the opponent, not passed in separately, so this is a drop-in replacement
// at the one call site in App.tsx. Two different numeric scales feed OpponentCard.difficulty:
//   - Campaign bosses (App.tsx's per-stage `opponent` object): difficulty = campaign stage, 1-44,
//     id is always `stage_<n>` — this is how Act-ending Protocol Bosses naturally land in the
//     hard/master tier without a separate "boss mode" flag.
//   - Quick-match / OPPONENT_BOSSES entries: difficulty is a flat 1-6 scale, id is `boss_<name>`.
function pickTier(opponentCard?: OpponentCard): Tier {
  if (!opponentCard) return 'hard';
  if (opponentCard.id.startsWith('stage_')) {
    const stage = opponentCard.difficulty;
    if (stage <= 14) return 'easy';
    if (stage <= 28) return 'medium';
    if (stage <= 40) return 'hard';
    return 'master';
  }
  const d = opponentCard.difficulty;
  if (d <= 2) return 'easy';
  if (d <= 4) return 'medium';
  return 'hard';
}

/**
 * Find best single-die move for CPU using the tavla-limitless 2-ply engine, ported onto this
 * game's board representation and card-aware move generator. Returns exactly one move (using one
 * of `availableDice`), matching the existing per-die call contract in App.tsx — the game loop
 * re-invokes this once per remaining die, so no caller changes are needed.
 */
export function getBestCpuMove(
  board: BoardState,
  availableDice: number[],
  opponentCard?: OpponentCard,
  playerCards: Card[] = [],
  isDoubles: boolean = false,
  moveCtx: ExecuteMoveContext = {}
): ValidMoveResult | null {
  const validMoves = getValidMoves(board, 'cpu', availableDice, playerCards, opponentCard, isDoubles, moveCtx);
  if (validMoves.length === 0) return null;
  if (validMoves.length === 1) return validMoves[0];

  const tier = pickTier(opponentCard);

  if (tier === 'easy') {
    const rand = Math.random();
    if (rand < 0.35) return validMoves[Math.floor(Math.random() * validMoves.length)];
    if (rand < 0.7) {
      // Naive: push whichever move covers the most ground, ignoring safety.
      return [...validMoves].sort((a, b) => b.dieUsed - a.dieUsed)[0];
    }
    let best = validMoves[0];
    let bestScore = -Infinity;
    for (const move of validMoves) {
      const { newBoard } = executeMove(board, 'cpu', move, playerCards, opponentCard, moveCtx);
      const score = evaluatePosition(newBoard, 'cpu', playerCards, opponentCard) + (Math.random() - 0.5) * 80;
      if (score > bestScore) {
        bestScore = score;
        best = move;
      }
    }
    return best;
  }

  // Rank every legal single-die move by "commit to this now, then play the rest of this turn's
  // dice well" — cheap relative to 2-ply since it reuses bestTurnBoard's greedy solver once per
  // candidate rather than searching all 21 opponent replies yet.
  const ranked = validMoves
    .map((move) => {
      const res = executeMove(board, 'cpu', move, playerCards, opponentCard, moveCtx);
      let newDice = [...availableDice];
      const idx = newDice.indexOf(move.dieUsed);
      if (idx >= 0) newDice.splice(idx, 1);
      if (res.boostRemainingDice) newDice = newDice.map((d) => Math.min(6, d + res.boostRemainingDice!));
      if (res.taxRemainingDice) newDice = newDice.map((d) => Math.max(1, d - res.taxRemainingDice!));
      if (res.removeOneDie && newDice.length > 0) newDice.pop();

      const rest = bestTurnBoard(res.newBoard, 'cpu', newDice, playerCards, opponentCard, isDoubles, moveCtx);
      return { move, finalBoard: rest.finalBoard, zeroPlyScore: evaluatePosition(rest.finalBoard, 'cpu', playerCards, opponentCard) };
    })
    .sort((a, b) => b.zeroPlyScore - a.zeroPlyScore);

  if (tier === 'medium') {
    let best = ranked[0];
    let bestScore = -Infinity;
    for (const r of ranked) {
      const score = r.zeroPlyScore + (Math.random() - 0.5) * 12;
      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }
    return best.move;
  }

  // Hard / master: deepen the top candidates with a full 2-ply search (opponent's best reply
  // averaged over all 21 weighted dice rolls). Unbounded 2-ply over every legal move is too slow —
  // each candidate re-runs full move generation 21 times — so only the top-ranked candidates by
  // 0-ply score get deepened. Master deepens more candidates than Hard.
  const candidateWidth = tier === 'master' ? 14 : 5;
  const candidates = ranked.slice(0, candidateWidth);

  let bestMove = candidates[0].move;
  let bestScore = -Infinity;
  for (const c of candidates) {
    const score = evaluateTwoPly(c.finalBoard, playerCards, opponentCard, moveCtx);
    if (score > bestScore) {
      bestScore = score;
      bestMove = c.move;
    }
  }
  return bestMove;
}
