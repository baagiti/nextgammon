import { BoardState, PlayerId, Move, Card, OpponentCard } from '../types';

export function createInitialBoard(): BoardState {
  const points: BoardState['points'] = Array.from({ length: 24 }, () => []);

  // Player (Cyan) starting position:
  // 2 on point 23
  // 5 on point 12
  // 3 on point 7
  // 5 on point 5
  for (let i = 0; i < 2; i++) points[23].push({ id: `p_23_${i}`, color: 'player' });
  for (let i = 0; i < 5; i++) points[12].push({ id: `p_12_${i}`, color: 'player' });
  for (let i = 0; i < 3; i++) points[7].push({ id: `p_7_${i}`, color: 'player' });
  for (let i = 0; i < 5; i++) points[5].push({ id: `p_5_${i}`, color: 'player' });

  // CPU (Magenta) starting position:
  // 2 on point 0
  // 5 on point 11
  // 3 on point 16
  // 5 on point 18
  for (let i = 0; i < 2; i++) points[0].push({ id: `c_0_${i}`, color: 'cpu' });
  for (let i = 0; i < 5; i++) points[11].push({ id: `c_11_${i}`, color: 'cpu' });
  for (let i = 0; i < 3; i++) points[16].push({ id: `c_16_${i}`, color: 'cpu' });
  for (let i = 0; i < 5; i++) points[18].push({ id: `c_18_${i}`, color: 'cpu' });

  return {
    points,
    bar: { player: 0, cpu: 0 },
    off: { player: 0, cpu: 0 },
  };
}

export interface RollStateFlags {
  barCount?: number;
  endedWithBlot?: boolean;
  wasHitLastTurn?: boolean;
  cowardsTaxTriggered?: boolean;
  failsafeTriggered?: boolean;
  lostPacketTriggered?: boolean;
  isColdRebootReroll?: boolean;
  borneOffLastTurn?: boolean;
}

export function rollDice(
  turn: PlayerId,
  playerCard?: Card,
  cpuCard?: Card,
  flags: RollStateFlags = {}
): { dice: number[]; isDoubles: boolean; cardNotes: string[]; canColdRebootReroll?: boolean } {
  let d1 = Math.floor(Math.random() * 6) + 1;
  let d2 = Math.floor(Math.random() * 6) + 1;
  const cardNotes: string[] = [];
  let canColdRebootReroll = false;

  const selfCard = turn === 'player'
    ? (playerCard?.category === 'self' ? playerCard : undefined)
    : (cpuCard?.category === 'self' ? cpuCard : undefined);

  const sabotageCard = turn === 'player'
    ? (cpuCard?.category === 'sabotage' ? cpuCard : undefined)
    : (playerCard?.category === 'sabotage' ? playerCard : undefined);

  // BAR STATIC: Opponent has >= 2 checkers on Bar
  if (sabotageCard?.id === 'card_bar_static' && (flags.barCount ?? 0) >= 2) {
    if (d1 >= d2 && d1 > 1) d1 -= 1;
    else if (d2 > d1 && d2 > 1) d2 -= 1;
    cardNotes.push('📻 BAR STATIC: High die reduced by −1 due to 2+ checkers on Bar!');
  }

  const rawD1 = d1;
  const rawD2 = d2;
  const isNaturalDouble = rawD1 === rawD2;

  // PASSIVE DICE BONUSES / PENALTIES (applied on non-double rolls to lower die)
  if (!isNaturalDouble) {
    // OPEN CIRCUIT: Ended previous turn with at least 1 blot
    if (selfCard?.id === 'card_open_circuit' && flags.endedWithBlot) {
      if (d1 <= d2 && d1 < 6) d1 += 1;
      else if (d2 < d1 && d2 < 6) d2 += 1;
      cardNotes.push('⚡ OPEN CIRCUIT: Lower die gained +1 for leaving a blot last turn!');
    }
    // SECOND WIND: Blot was hit last turn
    if (selfCard?.id === 'card_second_wind' && flags.wasHitLastTurn) {
      if (d1 <= d2 && d1 < 6) d1 += 1;
      else if (d2 < d1 && d2 < 6) d2 += 1;
      cardNotes.push('🌬️ SECOND WIND: Lower die gained +1 after your blot was hit!');
    }
    // FAILSAFE: Could not enter from Bar last turn
    if (selfCard?.id === 'card_failsafe' && flags.failsafeTriggered) {
      if (d1 <= d2 && d1 < 6) d1 += 1;
      else if (d2 < d1 && d2 < 6) d2 += 1;
      cardNotes.push('🛡️ FAILSAFE: Lower die gained +1 after failing to enter from Bar!');
    }
    // COWARD'S TAX: Passed legal hit opportunity last turn
    if (sabotageCard?.id === 'card_cowards_tax' && flags.cowardsTaxTriggered) {
      if (d1 <= d2 && d1 > 1) d1 -= 1;
      else if (d2 < d1 && d2 > 1) d2 -= 1;
      cardNotes.push('🙈 COWARD\'S TAX: Lower die taxed −1 for skipping a hit opportunity!');
    }
    // LOST PACKET: Opponent had an unplayable die last turn
    if (sabotageCard?.id === 'card_lost_packet' && flags.lostPacketTriggered) {
      if (d1 <= d2 && d1 > 1) d1 -= 1;
      else if (d2 < d1 && d2 > 1) d2 -= 1;
      cardNotes.push('📦 LOST PACKET: Lower die taxed −1 due to unplayed die!');
    }
    // EVENT HORIZON: Opponent bore off a checker last turn — gravity intensifies the closer they get to escaping
    if (sabotageCard?.id === 'card_event_horizon' && flags.borneOffLastTurn) {
      if (d1 <= d2 && d1 > 1) d1 -= 1;
      else if (d2 < d1 && d2 > 1) d2 -= 1;
      cardNotes.push('🕳️ EVENT HORIZON: Lower die taxed −1 for bearing off into the singularity!');
    }
  }

  // 1. Apply SELF cards
  if (selfCard) {
    if (selfCard.id === 'card_overclock') {
      if (!isNaturalDouble) {
        if (d1 <= d2 && d1 < 6) {
          d1 += 1;
          cardNotes.push(`OVERCLOCK: Low die +1 (${rawD1}->${d1})`);
        } else if (d2 < d1 && d2 < 6) {
          d2 += 1;
          cardNotes.push(`OVERCLOCK: Low die +1 (${rawD2}->${d2})`);
        }
      }
    } else if (selfCard.id === 'card_synchronize') {
      if (!isNaturalDouble && Math.abs(d1 - d2) === 1) {
        if (d1 < d2) d1 += 1;
        else d2 += 1;
        cardNotes.push(`SYNCHRONIZE: Consecutive dice synced (${rawD1},${rawD2} -> ${d1},${d2})`);
      }
    } else if (selfCard.id === 'card_convergence') {
      if (!isNaturalDouble && Math.abs(d1 - d2) >= 3) {
        if (d1 < d2) {
          d1 = Math.min(6, d1 + 2);
          d2 = Math.max(1, d2 - 1);
        } else {
          d2 = Math.min(6, d2 + 2);
          d1 = Math.max(1, d1 - 1);
        }
        cardNotes.push(`CONVERGENCE: Gap narrowed (${rawD1},${rawD2} -> ${d1},${d2})`);
      }
    } else if (selfCard.id === 'card_cold_reboot') {
      if (rawD1 + rawD2 <= 5 && !flags.isColdRebootReroll) {
        canColdRebootReroll = true;
        cardNotes.push(`❄️ COLD REBOOT ACTIVE: Dice sum ${rawD1}+${rawD2}=${rawD1 + rawD2} (≤ 5). Optional reroll available!`);
      }
    }
  }

  // 2. Apply SABOTAGE cards (from opponent)
  if (sabotageCard) {
    if (sabotageCard.id === 'card_compression_field') {
      if (!isNaturalDouble && Math.abs(d1 - d2) >= 3) {
        if (d1 > d2) {
          d1 = Math.max(1, d1 - 2);
          d2 = Math.min(6, d2 + 1);
        } else {
          d2 = Math.max(1, d2 - 2);
          d1 = Math.min(6, d1 + 1);
        }
        cardNotes.push(`COMPRESSION FIELD: Dice compressed (${rawD1},${rawD2} -> ${d1},${d2})`);
      }
    } else if (sabotageCard.id === 'card_overvoltage_trip') {
      if (!isNaturalDouble && rawD1 + rawD2 >= 10) {
        d1 = Math.floor(Math.random() * 6) + 1;
        d2 = Math.floor(Math.random() * 6) + 1;
        cardNotes.push(`OVERVOLTAGE TRIP: High roll (${rawD1}+${rawD2}>=10) forced reroll -> ${d1},${d2}`);
      }
    } else if (sabotageCard.id === 'card_six_tax') {
      if (!isNaturalDouble && (d1 === 6 || d2 === 6)) {
        if (d1 === 6 && d2 > 1) d2 -= 1;
        else if (d2 === 6 && d1 > 1) d1 -= 1;
        cardNotes.push(`SIX TAX: Non-6 die taxed -1 (${rawD1},${rawD2} -> ${d1},${d2})`);
      }
    }
  }

  let diceList: number[] = [];
  let isDoubles = isNaturalDouble;

  if (isNaturalDouble) {
    if (selfCard?.id === 'card_double_tuner') {
      const x = rawD1;
      diceList = [Math.max(1, x - 1), x, x, Math.min(6, x + 1)];
      cardNotes.push(`DOUBLE TUNER: Tuned ${x}-${x} -> [${diceList.join(',')}]`);
      isDoubles = false;
    } else if (selfCard?.id === 'card_doubles_engine') {
      diceList = Array(5).fill(d1);
      cardNotes.push(`DOUBLES ENGINE: 5 moves granted!`);
    } else if (sabotageCard?.id === 'card_double_fault') {
      diceList = Array(3).fill(d1);
      cardNotes.push(`DOUBLE FAULT: Double reduced to 3 moves!`);
    } else {
      diceList = Array(4).fill(d1);
    }
  } else {
    diceList = [d1, d2];
  }

  return { dice: diceList, isDoubles, cardNotes, canColdRebootReroll };
}

export function calculatePipCount(board: BoardState, player: PlayerId): number {
  let count = 0;
  if (player === 'player') {
    count += board.bar.player * 25;
    board.points.forEach((point, idx) => {
      const playerCheckers = point.filter((c) => c.color === 'player').length;
      count += playerCheckers * (idx + 1);
    });
  } else {
    count += board.bar.cpu * 25;
    board.points.forEach((point, idx) => {
      const cpuCheckers = point.filter((c) => c.color === 'cpu').length;
      count += cpuCheckers * (24 - idx);
    });
  }
  return count;
}

export function isHomeBoardReady(board: BoardState, player: PlayerId): boolean {
  if (player === 'player') {
    if (board.bar.player > 0) return false;
    // Points 6 to 23 must have 0 player checkers
    for (let i = 6; i < 24; i++) {
      if (board.points[i].some((c) => c.color === 'player')) return false;
    }
    return true;
  } else {
    if (board.bar.cpu > 0) return false;
    // Points 0 to 17 must have 0 cpu checkers
    for (let i = 0; i < 18; i++) {
      if (board.points[i].some((c) => c.color === 'cpu')) return false;
    }
    return true;
  }
}

export interface ValidMoveResult {
  from: number | 'bar';
  to: number | 'off';
  dieUsed: number;
  isBatchEntry?: boolean;
}

export interface TurnContext {
  turnMoveCount?: number;
  lastMoveDest?: number;
  startedWithBlots?: boolean;
  playerCourierPoint?: number | null;
  cpuCourierPoint?: number | null;
  playerDeadweightPoint?: number | null;
  cpuDeadweightPoint?: number | null;
  // Campaign protocol bosses rewrite a core rule for the match. Always directional — it
  // constrains the human player and benefits the CPU boss, never the reverse.
  bossProtocolId?: string;
}

export function getValidMoves(
  board: BoardState,
  player: PlayerId,
  availableDice: number[],
  playerCards: Card[] = [],
  cpuCard?: Card | OpponentCard,
  isDoubles: boolean = false,
  ctx: TurnContext = {}
): ValidMoveResult[] {
  if (availableDice.length === 0) return [];

  let currentDice = [...availableDice];
  const uniqueDice = Array.from(new Set(currentDice));
  let validMoves: ValidMoveResult[] = [];

  const ignoreBlock = false;
  const isBlotShielded = false;

  const opponentColor: PlayerId = player === 'player' ? 'cpu' : 'player';

  const moverHasCard = (cardId: string) => {
    if (player === 'player') {
      return playerCards.some((c) => c.id === cardId);
    } else {
      if (!cpuCard) return false;
      if ('id' in cpuCard && cpuCard.id === cardId) return true;
      if ('card' in cpuCard && (cpuCard as any).card?.id === cardId) return true;
      return false;
    }
  };

  const isOpponentCardActive = (cardId: string) => {
    if (player === 'player') {
      if (!cpuCard) return false;
      if ('id' in cpuCard && cpuCard.id === cardId) return true;
      if ('card' in cpuCard && (cpuCard as any).card?.id === cardId) return true;
      return false;
    } else {
      return playerCards.some((c) => c.id === cardId);
    }
  };

  // Find Rearmost Point for TAILWIND & TRAILING DRAG
  let rearmostPoint: number | null = null;
  if (player === 'player') {
    for (let p = 23; p >= 0; p--) {
      if (board.points[p].some((c) => c.color === 'player')) {
        rearmostPoint = p;
        break;
      }
    }
  } else {
    for (let p = 0; p <= 23; p++) {
      if (board.points[p].some((c) => c.color === 'cpu')) {
        rearmostPoint = p;
        break;
      }
    }
  }

  const hasTailwind = moverHasCard('card_tailwind');
  const hasTrailingDrag = isOpponentCardActive('card_trailing_drag');
  const hasCourier = moverHasCard('card_courier');
  const hasDeadweight = isOpponentCardActive('card_deadweight');
  const hasEchoJam = isOpponentCardActive('card_echo_jam');

  // SABOTAGE CARD CHECK 1: HOME SECURITY
  let homeSecurityActive = false;
  if (isOpponentCardActive('card_home_security')) {
    if (player === 'player') {
      const hasHomeBlot = board.points.slice(0, 6).some((pt) => pt.filter((c) => c.color === 'player').length === 1);
      if (hasHomeBlot) homeSecurityActive = true;
    } else {
      const hasHomeBlot = board.points.slice(18, 24).some((pt) => pt.filter((c) => c.color === 'cpu').length === 1);
      if (hasHomeBlot) homeSecurityActive = true;
    }
  }

  // SABOTAGE CARD CHECK 1B: TERMINATION PROTOCOL (Omega Core exclusive) — every home point must be
  // broken down to a single checker or empty before bear-off is allowed. No stacked shortcuts.
  let terminationProtocolActive = false;
  if (isOpponentCardActive('card_termination_protocol')) {
    const homeSlice = player === 'player' ? board.points.slice(0, 6) : board.points.slice(18, 24);
    const hasStackedHomePoint = homeSlice.some((pt) => pt.filter((c) => c.color === player).length >= 2);
    if (hasStackedHomePoint) terminationProtocolActive = true;
  }

  // SABOTAGE CARD CHECK 2: EXACT LOCK
  const exactLockActive = isOpponentCardActive('card_exact_lock');

  // SABOTAGE CARD CHECK 3: FINAL CHECK
  let finalCheckActive = false;
  if (isOpponentCardActive('card_final_check')) {
    if (player === 'player') {
      const totalPlayerCheckers = board.bar.player + board.points.reduce((sum, pt) => sum + pt.filter((c) => c.color === 'player').length, 0);
      if (totalPlayerCheckers === 1) finalCheckActive = true;
    } else {
      const totalCpuCheckers = board.bar.cpu + board.points.reduce((sum, pt) => sum + pt.filter((c) => c.color === 'cpu').length, 0);
      if (totalCpuCheckers === 1) finalCheckActive = true;
    }
  }

  // Campaign protocol flags — always directional (constrain the player, benefit the boss).
  const isFortifiedVsPlayer = ctx.bossProtocolId === 'fortified' && player === 'player';
  const isPhaseWalkForCpu = ctx.bossProtocolId === 'phase_walk' && player === 'cpu';
  const isSiegeForCpu = ctx.bossProtocolId === 'siege' && player === 'cpu';

  // 1. Bar Re-entry Check
  const barCount = player === 'player' ? board.bar.player : board.bar.cpu;
  if (barCount > 0) {
    // BATCH UPLOAD: exactly 2 on Bar, non-double roll -> both may re-enter together on 1 die
    if (barCount === 2 && !isDoubles && moverHasCard('card_batch_upload')) {
      uniqueDice.forEach((die) => {
        const destPoint = player === 'player' ? 24 - die : die - 1;
        if (destPoint >= 0 && destPoint < 24) {
          const opponentCheckers = board.points[destPoint].filter((c) => c.color === opponentColor);
          if (opponentCheckers.length <= 1 && !(isFortifiedVsPlayer && opponentCheckers.length === 1)) {
            validMoves.push({ from: 'bar', to: destPoint, dieUsed: die, isBatchEntry: true });
          }
        }
      });
    }

    uniqueDice.forEach((die) => {
      let destPoint: number;
      if (player === 'player') {
        destPoint = 24 - die;
      } else {
        destPoint = die - 1;
      }

      if (destPoint >= 0 && destPoint < 24) {
        const destCheckers = board.points[destPoint];
        const opponentCheckers = destCheckers.filter((c) => c.color === opponentColor);

        // PHASE WALK: the boss re-enters ignoring your blocked points entirely.
        let canLand = opponentCheckers.length <= 1 || ignoreBlock || isPhaseWalkForCpu;
        if (opponentCheckers.length === 1 && isBlotShielded) {
          canLand = false;
        }
        // FORTIFIED: the boss's blots can't be hit, even on Bar re-entry.
        if (isFortifiedVsPlayer && opponentCheckers.length === 1) {
          canLand = false;
        }

        if (canLand) {
          validMoves.push({ from: 'bar', to: destPoint, dieUsed: die });
        }
      }
    });

    if (validMoves.length > 0) {
      return validMoves; // Must move from bar first if moves exist
    }

    // BYPASS PROTOCOL (or the boss's SIEGE protocol): if no bar re-entry is possible, allow
    // moving on-board checkers instead of being stuck.
    if (!moverHasCard('card_bypass_protocol') && !isSiegeForCpu) {
      return []; // Stuck on bar without Bypass Protocol
    }
  }

  // 2. Normal On-Board Movements
  const rawCanBearOff = isHomeBoardReady(board, player);
  const effectiveCanBearOff = rawCanBearOff && !homeSecurityActive && !terminationProtocolActive;

  for (let p = 0; p < 24; p++) {
    const checkersOnPoint = board.points[p].filter((c) => c.color === player);
    if (checkersOnPoint.length === 0) continue;

    const isRearmost = rearmostPoint !== null && p === rearmostPoint;
    const isCourierMatch = player === 'player'
      ? (ctx.playerCourierPoint !== undefined && ctx.playerCourierPoint !== null ? p === ctx.playerCourierPoint : p === 23)
      : (ctx.cpuCourierPoint !== undefined && ctx.cpuCourierPoint !== null ? p === ctx.cpuCourierPoint : p === 0);

    const isDeadweightMatch = player === 'player'
      ? (ctx.cpuDeadweightPoint !== undefined && ctx.cpuDeadweightPoint !== null ? p === ctx.cpuDeadweightPoint : p === 23)
      : (ctx.playerDeadweightPoint !== undefined && ctx.playerDeadweightPoint !== null ? p === ctx.playerDeadweightPoint : p === 0);

    // ECHO JAM: second die played on the SAME checker as the previous move this turn, non-double roll
    const isEchoJamMatch = hasEchoJam && !isDoubles && ctx.lastMoveDest !== undefined && p === ctx.lastMoveDest;

    uniqueDice.forEach((die) => {
      let effectiveDie = die;

      if (hasTailwind && isRearmost) {
        const boosted = Math.min(die + 1, 6);
        if (boosted > die) {
          const testBoostedDest = player === 'player' ? p - boosted : p + boosted;
          let canLandBoosted = false;

          if (testBoostedDest >= 0 && testBoostedDest <= 23) {
            const oppCheckers = board.points[testBoostedDest].filter((c) => c.color === opponentColor);
            if (oppCheckers.length <= 1) canLandBoosted = true;
          } else if (player === 'player' && testBoostedDest < 0 && effectiveCanBearOff) {
            if (testBoostedDest === -1 || (!exactLockActive && !finalCheckActive)) canLandBoosted = true;
          } else if (player === 'cpu' && testBoostedDest > 23 && effectiveCanBearOff) {
            if (testBoostedDest === 24 || (!exactLockActive && !finalCheckActive)) canLandBoosted = true;
          }

          if (canLandBoosted) effectiveDie = boosted;
        }
      } else if (hasTrailingDrag && isRearmost) {
        effectiveDie = Math.max(1, die - 1);
      } else if (hasCourier && isCourierMatch) {
        effectiveDie = Math.min(6, die + 1);
      } else if (hasDeadweight && isDeadweightMatch) {
        effectiveDie = Math.max(1, die - 1);
      } else if (isEchoJamMatch) {
        effectiveDie = Math.max(1, die - 1);
      }

      let destPoint: number;
      if (player === 'player') {
        destPoint = p - effectiveDie;
      } else {
        destPoint = p + effectiveDie;
      }

      // Bearing off condition check
      if (player === 'player' && destPoint < 0) {
        if (effectiveCanBearOff) {
          if (destPoint === -1) {
            validMoves.push({ from: p, to: 'off', dieUsed: die });
          } else {
            if (!exactLockActive && !finalCheckActive) {
              let hasHigher = false;
              for (let h = p + 1; h <= 5; h++) {
                if (board.points[h].some((c) => c.color === 'player')) {
                  hasHigher = true;
                  break;
                }
              }
              if (!hasHigher) {
                validMoves.push({ from: p, to: 'off', dieUsed: die });
              }
            }
          }
        }
      } else if (player === 'cpu' && destPoint > 23) {
        if (effectiveCanBearOff) {
          if (destPoint === 24) {
            validMoves.push({ from: p, to: 'off', dieUsed: die });
          } else {
            if (!exactLockActive && !finalCheckActive) {
              let hasLower = false;
              for (let l = 18; l < p; l++) {
                if (board.points[l].some((c) => c.color === 'cpu')) {
                  hasLower = true;
                  break;
                }
              }
              if (!hasLower) {
                validMoves.push({ from: p, to: 'off', dieUsed: die });
              }
            }
          }
        }
      } else if (destPoint >= 0 && destPoint <= 23) {
        const destCheckers = board.points[destPoint];
        const opponentCheckers = destCheckers.filter((c) => c.color === opponentColor);

        let canLand = opponentCheckers.length <= 1 || ignoreBlock;
        if (opponentCheckers.length === 1 && isBlotShielded) {
          canLand = false;
        }
        // FORTIFIED: the boss's blots can't be hit — treated as a made point.
        if (isFortifiedVsPlayer && opponentCheckers.length === 1) {
          canLand = false;
        }
        // FIREWALL: no normal landing anywhere in the boss's home board (points 19-24 / index 18-23).
        if (ctx.bossProtocolId === 'firewall' && player === 'player' && destPoint >= 18 && destPoint <= 23) {
          canLand = false;
        }

        if (canLand) {
          validMoves.push({ from: p, to: destPoint, dieUsed: die });
        }
      }
    });
  }

  // REDUNDANCY: If home board ready, 2 dice available, but 0 moves found, allow using playable die twice!
  if (effectiveCanBearOff && validMoves.length === 0 && uniqueDice.length === 2 && moverHasCard('card_redundancy')) {
    // Check if one die works alone
    const d1Moves = getValidMoves(board, player, [uniqueDice[0]], playerCards, cpuCard, isDoubles, ctx);
    const d2Moves = getValidMoves(board, player, [uniqueDice[1]], playerCards, cpuCard, isDoubles, ctx);
    if (d1Moves.length > 0 && d2Moves.length === 0) {
      return getValidMoves(board, player, [uniqueDice[0], uniqueDice[0]], playerCards, cpuCard, isDoubles, ctx);
    } else if (d2Moves.length > 0 && d1Moves.length === 0) {
      return getValidMoves(board, player, [uniqueDice[1], uniqueDice[1]], playerCards, cpuCard, isDoubles, ctx);
    }
  }

  // POST-PROCESSING FILTERS (SABOTAGE / MANDATORY CARDS)

  // COMPULSORY HIT: If any valid move hits an opponent blot, must perform a hit
  if (isOpponentCardActive('card_compulsory_hit') && validMoves.length > 0) {
    const hitMoves = validMoves.filter((m) => {
      if (typeof m.to !== 'number') return false;
      const pt = board.points[m.to];
      return pt.filter((c) => c.color === opponentColor).length === 1;
    });
    if (hitMoves.length > 0) {
      validMoves = hitMoves;
    }
  }

  // BLOOD MAGNET: Must start turn with a blot move if started with blots
  if (isOpponentCardActive('card_blood_magnet') && ctx.turnMoveCount === 0 && ctx.startedWithBlots && validMoves.length > 0) {
    const blotMoves = validMoves.filter((m) => {
      if (m.from === 'bar') return false;
      return board.points[m.from].filter((c) => c.color === player).length === 1;
    });
    if (blotMoves.length > 0) {
      validMoves = blotMoves;
    }
  }

  // FORCED COMMIT: If 2nd move of turn and last move landed on P, must continue with same checker if possible
  if (isOpponentCardActive('card_forced_commit') && ctx.lastMoveDest !== undefined && validMoves.length > 0) {
    const continuationMoves = validMoves.filter((m) => m.from === ctx.lastMoveDest);
    if (continuationMoves.length > 0) {
      validMoves = continuationMoves;
    }
  }

  return validMoves;
}

export interface ExecuteMoveResult {
  newBoard: BoardState;
  wasHit: boolean;
  notes: string[];
  boostRemainingDice?: number;
  taxRemainingDice?: number;
  removeOneDie?: boolean;
  updatedPlayerCourierPoint?: number | null;
  updatedCpuCourierPoint?: number | null;
  updatedPlayerDeadweightPoint?: number | null;
  updatedCpuDeadweightPoint?: number | null;
}

export interface ExecuteMoveContext {
  isFirstHitInTurn?: boolean;
  isDoubles?: boolean;
  playerBlackIcePoint?: number | null;
  cpuBlackIcePoint?: number | null;
  playerCourierPoint?: number | null;
  cpuCourierPoint?: number | null;
  playerDeadweightPoint?: number | null;
  cpuDeadweightPoint?: number | null;
  bossProtocolId?: string;
}

export function executeMove(
  board: BoardState,
  player: PlayerId,
  move: ValidMoveResult,
  playerCards: Card[] = [],
  cpuCard?: Card | OpponentCard,
  ctx: ExecuteMoveContext = {}
): ExecuteMoveResult {
  const newBoard: BoardState = {
    points: board.points.map((pt) => [...pt]),
    bar: { ...board.bar },
    off: { ...board.off },
  };

  const notes: string[] = [];
  let wasHit = false;
  let boostRemainingDice = 0;
  let taxRemainingDice = 0;
  let removeOneDie = false;
  let moverSentToBarByMirror = false;
  const opponentColor: PlayerId = player === 'player' ? 'cpu' : 'player';

  const moverHasCard = (cardId: string) => {
    if (player === 'player') {
      return playerCards.some((c) => c.id === cardId);
    } else {
      if (!cpuCard) return false;
      if ('id' in cpuCard && cpuCard.id === cardId) return true;
      if ('card' in cpuCard && (cpuCard as any).card?.id === cardId) return true;
      return false;
    }
  };

  const opponentHasCard = (cardId: string) => {
    if (player === 'player') {
      if (!cpuCard) return false;
      if ('id' in cpuCard && cpuCard.id === cardId) return true;
      if ('card' in cpuCard && (cpuCard as any).card?.id === cardId) return true;
      return false;
    } else {
      return playerCards.some((c) => c.id === cardId);
    }
  };

  // BATCH UPLOAD: both Bar checkers re-enter together on a single die
  if (move.isBatchEntry && move.from === 'bar' && move.to !== 'off') {
    const targetIndex = move.to;
    if (player === 'player') newBoard.bar.player -= 2;
    else newBoard.bar.cpu -= 2;

    const destPoint = newBoard.points[targetIndex];
    const opponentCheckers = destPoint.filter((c) => c.color === opponentColor);
    if (opponentCheckers.length === 1) {
      wasHit = true;
      destPoint.pop();
      if (opponentColor === 'cpu') newBoard.bar.cpu += 1;
      else newBoard.bar.player += 1;
      notes.push(`💥 HIT! ${opponentColor.toUpperCase()} checker hit and sent to Bar!`);
    }

    destPoint.push({ id: `${player}_batch_${Date.now()}_a`, color: player });
    destPoint.push({ id: `${player}_batch_${Date.now()}_b`, color: player });
    notes.push('📤 BATCH UPLOAD! Both Bar checkers re-entered together on a single die!');

    return {
      newBoard,
      wasHit,
      notes,
      boostRemainingDice: 0,
      taxRemainingDice: 0,
      removeOneDie: false,
      updatedPlayerCourierPoint: ctx.playerCourierPoint,
      updatedCpuCourierPoint: ctx.cpuCourierPoint,
      updatedPlayerDeadweightPoint: ctx.playerDeadweightPoint,
      updatedCpuDeadweightPoint: ctx.cpuDeadweightPoint,
    };
  }

  // 1. Remove checker from source
  let movingChecker: { id: string; color: PlayerId };
  if (move.from === 'bar') {
    if (player === 'player') {
      newBoard.bar.player -= 1;
    } else {
      newBoard.bar.cpu -= 1;
    }
    movingChecker = { id: `${player}_bar_${Date.now()}`, color: player };
  } else {
    const pointCheckers = newBoard.points[move.from];
    const idx = pointCheckers.findIndex((c) => c.color === player);
    movingChecker = pointCheckers.splice(idx, 1)[0];
  }

  // 2. Place checker at destination
  if (move.to === 'off') {
    if (player === 'player') {
      newBoard.off.player += 1;
    } else {
      newBoard.off.cpu += 1;
    }
    notes.push(`${player.toUpperCase()} bore off a checker!`);
  } else {
    let targetIndex = move.to;

    // CARD EFFECT: REPULSOR (If opponent lands on own blot to form a point, repelled +1 forward)
    if (opponentHasCard('card_repulsor')) {
      const ownCount = newBoard.points[targetIndex].filter((c) => c.color === player).length;
      if (ownCount === 1) {
        // Landing on own blot to form a gate! REPULSOR repels it +1 further along movement direction
        const repelledIndex = player === 'player' ? targetIndex - 1 : targetIndex + 1;
        if (repelledIndex >= 0 && repelledIndex <= 23) {
          const oppCountAtRepelled = newBoard.points[repelledIndex].filter((c) => c.color === opponentColor).length;
          if (oppCountAtRepelled <= 1) {
            targetIndex = repelledIndex;
            notes.push('⚡ REPULSOR! Point creation prevented, checker repelled +1 forward!');
          }
        }
      }
    }

    // CARD EFFECT: MAGNETIC LINK (If landing 1 point behind own blot, pulled +1 to form point)
    if (moverHasCard('card_magnetic_link')) {
      const aheadIndex = player === 'player' ? targetIndex - 1 : targetIndex + 1;
      if (aheadIndex >= 0 && aheadIndex <= 23) {
        const ownBlotAhead = newBoard.points[aheadIndex].filter((c) => c.color === player).length === 1;
        if (ownBlotAhead) {
          targetIndex = aheadIndex;
          notes.push('🧲 MAGNETIC LINK! Magnetically pulled +1 to form a point with your blot!');
        }
      }
    }

    const destPoint = newBoard.points[targetIndex];
    const opponentCheckers = destPoint.filter((c) => c.color === opponentColor);

    if (opponentCheckers.length === 1) {
      // HIT BLOT!
      wasHit = true;
      const hitChecker = destPoint.pop()!;

      // CARD EFFECT: DEFLECTION (When blot is hit, deflected 1 point backward instead of going to Bar)
      let deflected = false;
      if (opponentHasCard('card_deflection')) {
        const deflectIndex = opponentColor === 'player' ? targetIndex + 1 : targetIndex - 1;
        if (deflectIndex >= 0 && deflectIndex <= 23) {
          const playerCheckersAtDeflect = newBoard.points[deflectIndex].filter((c) => c.color === player).length;
          if (playerCheckersAtDeflect <= 1) {
            newBoard.points[deflectIndex].push(hitChecker);
            deflected = true;
            notes.push('🛡️ DEFLECTION! Hit checker deflected 1 point backward instead of going to Bar!');
          }
        }
      }

      if (!deflected) {
        if (opponentColor === 'cpu') {
          newBoard.bar.cpu += 1;
        } else {
          newBoard.bar.player += 1;
        }
        notes.push(`💥 HIT! ${opponentColor.toUpperCase()} checker hit and sent to Bar!`);
      }

      // CARD EFFECT: MIRROR REFLEX (When own blot is hit, hitting opponent checker also dragged to Bar)
      // The hitting checker itself goes to the Bar instead of landing on the point.
      if (opponentHasCard('card_mirror_reflex')) {
        if (player === 'player') {
          newBoard.bar.player += 1;
        } else {
          newBoard.bar.cpu += 1;
        }
        moverSentToBarByMirror = true;
        notes.push('🪞 MIRROR REFLEX! Hitting checker also dragged to the Bar!');
      }

      // CARD EFFECT: SHATTER BLOT (Adjacent opponent blot immediately ahead is also shattered and sent to Bar)
      if (moverHasCard('card_shatter_blot')) {
        const shatterIndex = player === 'player' ? targetIndex - 1 : targetIndex + 1;
        if (shatterIndex >= 0 && shatterIndex <= 23) {
          const adjOpponentCheckers = newBoard.points[shatterIndex].filter((c) => c.color === opponentColor);
          if (adjOpponentCheckers.length === 1) {
            newBoard.points[shatterIndex].pop();
            if (opponentColor === 'cpu') newBoard.bar.cpu += 1;
            else newBoard.bar.player += 1;
            notes.push('🔨 SHATTER BLOT! Adjacent opponent blot also shattered and sent to Bar!');
          }
        }
      }

      // CARD EFFECT: COUNTERSTRIKE (Re-entering from Bar and hitting boosts remaining dice by +1)
      if (move.from === 'bar' && moverHasCard('card_counterstrike')) {
        boostRemainingDice += 1;
        notes.push('🎯 COUNTERSTRIKE: Re-entered from Bar & hit! Remaining die boosted +1!');
      }

      // CARD EFFECT: DOUBLE TAP (First hit of turn boosts remaining die by +1)
      if (moverHasCard('card_double_tap') && ctx.isFirstHitInTurn) {
        boostRemainingDice += 1;
        notes.push('🎯 DOUBLE TAP: First hit of turn! Remaining die boosted +1!');
      }

      // CARD EFFECT: BLOOD TAX (When opponent hits, next die penalized by -1)
      if (opponentHasCard('card_blood_tax') && ctx.isFirstHitInTurn) {
        taxRemainingDice += 1;
        notes.push('🩸 BLOOD TAX: Hit made! Next die penalized −1!');
      }

      // CARD EFFECT: DOUBLE FRACTURE (Hitting during doubles destroys 1 remaining die move)
      if (ctx.isDoubles && opponentHasCard('card_double_fracture')) {
        removeOneDie = true;
        notes.push('✂️ DOUBLE FRACTURE: Hit on doubles! 1 remaining die move destroyed!');
      }
    }

    const ownCountBefore = destPoint.filter((c) => c.color === player).length;
    if (!moverSentToBarByMirror) {
      destPoint.push(movingChecker);
    }

    // CARD EFFECT: LAUNCHPAD (Re-entering from Bar and forming a point boosts remaining dice by +1)
    if (move.from === 'bar' && !wasHit && ownCountBefore >= 1 && moverHasCard('card_launchpad')) {
      boostRemainingDice += 1;
      notes.push('🚀 LAUNCHPAD: Re-entered from Bar & formed point! Remaining die boosted +1!');
    }

    // CARD EFFECT: BACKLASH (After opponent hit, hitting checker is pushed 1 point backward)
    if (wasHit && !moverSentToBarByMirror && opponentHasCard('card_backlash')) {
      const backlashIndex = player === 'player' ? targetIndex + 1 : targetIndex - 1;
      if (backlashIndex >= 0 && backlashIndex <= 23) {
        const oppAtBacklash = newBoard.points[backlashIndex].filter((c) => c.color === opponentColor).length;
        if (oppAtBacklash <= 1) {
          destPoint.pop();
          newBoard.points[backlashIndex].push(movingChecker);
          notes.push('↩️ BACKLASH! Hitting checker pushed 1 point backward!');
        }
      }
    }

    // CARD EFFECT: BLACK ICE (Landing on icy point sends checker to Bar)
    if (!moverSentToBarByMirror && opponentHasCard('card_black_ice')) {
      const activeIcePoint =
        player === 'player'
          ? (ctx.cpuBlackIcePoint !== undefined && ctx.cpuBlackIcePoint !== null ? ctx.cpuBlackIcePoint : 11)
          : (ctx.playerBlackIcePoint !== undefined && ctx.playerBlackIcePoint !== null ? ctx.playerBlackIcePoint : 11);

      if (targetIndex === activeIcePoint) {
        destPoint.pop();
        if (player === 'player') newBoard.bar.player += 1;
        else newBoard.bar.cpu += 1;
        notes.push(`❄️ BLACK ICE! Checker slipped on icy point ${activeIcePoint + 1} and fell to Bar!`);
      }
    }

    // CARD EFFECT: TAILWIND (Rearmost checker gains +1 extra distance)
    if (!moverSentToBarByMirror && moverHasCard('card_tailwind') && move.from !== 'bar') {
      const actualDist = player === 'player' ? move.from - targetIndex : targetIndex - move.from;
      if (actualDist > move.dieUsed) {
        notes.push('💨 TAILWIND! Rearmost checker pushed +1 extra distance by tailwind!');
      }
    }
  }

  // Track marked point movements (Courier & Deadweight)
  let updatedPlayerCourierPoint = ctx.playerCourierPoint;
  let updatedCpuCourierPoint = ctx.cpuCourierPoint;
  let updatedPlayerDeadweightPoint = ctx.playerDeadweightPoint;
  let updatedCpuDeadweightPoint = ctx.cpuDeadweightPoint;

  if (player === 'player') {
    if (typeof move.from === 'number' && move.from === ctx.playerCourierPoint) {
      updatedPlayerCourierPoint = move.to === 'off' ? null : move.to;
      notes.push('🚀 COURIER! Courier checker moved with +1 boost!');
    }
    if (typeof move.from === 'number' && move.from === ctx.cpuDeadweightPoint) {
      updatedCpuDeadweightPoint = move.to === 'off' ? null : move.to;
      notes.push('⚓ DEADWEIGHT! Heavy checker moved with −1 penalty.');
    }
  } else {
    if (typeof move.from === 'number' && move.from === ctx.cpuCourierPoint) {
      updatedCpuCourierPoint = move.to === 'off' ? null : move.to;
      notes.push('🚀 CPU COURIER! CPU Courier checker advanced with +1 boost!');
    }
    if (typeof move.from === 'number' && move.from === ctx.playerDeadweightPoint) {
      updatedPlayerDeadweightPoint = move.to === 'off' ? null : move.to;
      notes.push('⚓ CPU DEADWEIGHT! Your heavy checker moved with −1 penalty.');
    }
  }

  return {
    newBoard,
    wasHit,
    notes,
    boostRemainingDice,
    taxRemainingDice,
    removeOneDie,
    updatedPlayerCourierPoint,
    updatedCpuCourierPoint,
    updatedPlayerDeadweightPoint,
    updatedCpuDeadweightPoint,
  };
}

export function evaluateBoardState(
  board: BoardState,
  playerCards: Card[] = [],
  opponentCard?: OpponentCard
): number {
  let score = 0;

  // 1. Bear off score (huge incentive)
  score += board.off.cpu * 200;
  score -= board.off.player * 200;

  // 2. Pip count advantage
  const playerPips = calculatePipCount(board, 'player');
  const cpuPips = calculatePipCount(board, 'cpu');
  score += (playerPips - cpuPips) * 5;

  // 3. Bar status
  score -= board.bar.cpu * 150;     // CPU on bar is very bad
  score += board.bar.player * 120;   // Player on bar is very good

  // 4. Point control & Blots analysis
  let cpuHomeMadePoints = 0;
  let playerHomeMadePoints = 0;

  for (let i = 0; i < 24; i++) {
    const cpuCount = board.points[i].filter((c) => c.color === 'cpu').length;
    const playerCount = board.points[i].filter((c) => c.color === 'player').length;

    // CPU points made (2+ checkers)
    if (cpuCount >= 2) {
      score += 35;
      if (i >= 18 && i <= 23) {
        cpuHomeMadePoints++;
        score += 50; // Extra reward for home board points
      }
      // Bonus for stack height moderation (2-4 checkers is ideal)
      if (cpuCount > 4) score -= (cpuCount - 4) * 10;
    } else if (cpuCount === 1) {
      // CPU Blot (vulnerable)
      let penalty = -25;
      // Is blot in direct hit range (1..6) of a player checker?
      for (let dist = 1; dist <= 6; dist++) {
        const threatIdx = i - dist;
        if (threatIdx >= 0 && board.points[threatIdx].some((c) => c.color === 'player')) {
          penalty -= 40; // Direct hit threat!
          break;
        }
      }
      // If player has checkers on bar, blot in home board is even riskier
      if (board.bar.player > 0 && i >= 18) {
        penalty -= 30;
      }
      score += penalty;
    }

    // Player points made
    if (playerCount >= 2) {
      score -= 30;
      if (i >= 0 && i <= 5) {
        playerHomeMadePoints++;
        score -= 40;
      }
    }
  }

  // 5. Escaping back checkers (CPU starting points 0, 1, 2)
  const backCheckers = board.points[0].filter((c) => c.color === 'cpu').length +
                       board.points[1].filter((c) => c.color === 'cpu').length +
                       board.points[2].filter((c) => c.color === 'cpu').length;
  score -= backCheckers * 20;

  // 6. Home Board Prime strength
  if (cpuHomeMadePoints >= 3) score += 80;
  if (cpuHomeMadePoints >= 5) score += 180;

  return score;
}

// Find best sequence of moves for CPU using multi-step depth search
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

  let bestMove: ValidMoveResult = validMoves[0];
  let bestSequenceScore = -999999;

  for (const move of validMoves) {
    // Simulate executing this move
    const { newBoard } = executeMove(board, 'cpu', move, playerCards, opponentCard, moveCtx);
    
    // Remaining dice after using this move
    const remainingDice = [...availableDice];
    const dieIdx = remainingDice.indexOf(move.dieUsed);
    if (dieIdx >= 0) remainingDice.splice(dieIdx, 1);

    let moveScore = 0;

    if (remainingDice.length > 0) {
      // Recursively evaluate next move outcome
      const nextMoves = getValidMoves(newBoard, 'cpu', remainingDice, playerCards, opponentCard, isDoubles, moveCtx);
      if (nextMoves.length > 0) {
        let maxNextScore = -999999;
        for (const nextMove of nextMoves) {
          const { newBoard: finalBoard } = executeMove(newBoard, 'cpu', nextMove, playerCards, opponentCard);
          const evalScore = evaluateBoardState(finalBoard, playerCards, opponentCard);
          if (evalScore > maxNextScore) maxNextScore = evalScore;
        }
        moveScore = maxNextScore;
      } else {
        moveScore = evaluateBoardState(newBoard, playerCards, opponentCard);
      }
    } else {
      moveScore = evaluateBoardState(newBoard, playerCards, opponentCard);
    }

    // Direct immediate incentives
    if (move.to === 'off') moveScore += 150;
    if (typeof move.to === 'number' && board.points[move.to].filter((c) => c.color === 'player').length === 1) {
      moveScore += 100; // Hit player blot!
    }

    if (moveScore > bestSequenceScore) {
      bestSequenceScore = moveScore;
      bestMove = move;
    }
  }

  return bestMove;
}

export function shouldCpuColdReboot(
  board: BoardState,
  currentDice: number[],
  equippedCards: Card[] = [],
  opponentCard?: Card,
  isDoubles: boolean = false,
  moveCtx: ExecuteMoveContext = {}
): boolean {
  const validMoves = getValidMoves(board, 'cpu', currentDice, equippedCards, opponentCard, isDoubles, moveCtx);

  // If CPU has no valid moves with current low roll, rerolling is strictly better!
  if (validMoves.length === 0) return true;

  // Check if any move hits a player blot or bears off a checker
  for (const move of validMoves) {
    if (move.to === 'off') return false; // Keep roll to bear off
    const res = executeMove(board, 'cpu', move, equippedCards, opponentCard, moveCtx);
    if (res.wasHit) return false; // Keep roll to hit player blot!
  }

  // If CPU has checkers on Bar, check if current roll allowed leaving Bar
  if (board.bar.cpu > 0) {
    const escapesBar = validMoves.some((m) => m.from === 'bar');
    if (escapesBar) return false; // Keep roll to escape bar!
  }

  // Low dice (sum <= 5) without hit, bear-off, or bar-exit -> Reroll for expected higher average roll (~7)
  return true;
}
