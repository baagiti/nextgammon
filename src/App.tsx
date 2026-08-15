import React, { useState, useEffect, useRef } from 'react';
import {
  GameSettings,
  MetaData,
  RunState,
  BoardState,
  PlayerId,
  Card,
  OpponentCard,
} from './types';
import {
  loadMetaData,
  saveMetaData,
  startNewRun,
  getOpponentForStage,
  generateCardDraftChoices,
  purchaseMetaUpgrade,
} from './game/runManager';
import { CAMPAIGN_STAGES, BOSS_PROTOCOLS, STARTER_CARD_ID } from './game/campaignData';
import {
  createInitialBoard,
  rollDice,
  getValidMoves,
  executeMove,
  getBestCpuMove,
  shouldCpuColdReboot,
  calculatePipCount,
  ValidMoveResult,
} from './game/backgammonEngine';
import { soundFx } from './game/soundEngine';
import confetti from 'canvas-confetti';
import cyberpunkBeat from './assets/audio/cyberpunk-beat.mp3';
import gameplayAmbient from './assets/audio/gameplay-ambient.mp3';

import { PlatformFrame } from './components/PlatformFrame';
import { ViewStage } from './components/CyberSkyline';
import { OpponentHeader } from './components/OpponentHeader';
import { NeonBoard } from './components/NeonBoard';
import { CardWidget } from './components/CardWidget';
import { DraftModal } from './components/DraftModal';
import { ShopModal } from './components/ShopModal';
import { MetaLabModal } from './components/MetaLabModal';
import { RunMapModal } from './components/RunMapModal';

import { CardSelectModal } from './components/CardSelectModal';
import { BossIntroOverlay } from './components/BossIntroOverlay';
import { CardDetailModal } from './components/CardDetailModal';
import { MarkedCheckerModal, SelectionType } from './components/MarkedCheckerModal';
import { PLAYER_CARDS } from './game/cardsData';

import { Play, Sparkles, Layers, RotateCcw, Shield, Dices, ChevronRight, Swords, Trophy, Skull } from 'lucide-react';

function fireBearOffConfetti() {
  confetti({
    particleCount: 28,
    spread: 45,
    startVelocity: 28,
    gravity: 1.1,
    origin: { x: 0.5, y: 0.75 },
    colors: ['#00e5ff', '#34d399', '#ffffff'],
    scalar: 0.7,
    ticks: 90,
  });
}

function fireVictoryConfetti() {
  const colors = ['#00e5ff', '#34d399', '#a855f7', '#ffffff'];
  confetti({ particleCount: 90, spread: 80, startVelocity: 45, origin: { x: 0.5, y: 0.5 }, colors });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors }), 150);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors }), 150);
}

export default function App() {
  // Settings & Meta state
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    sfxVolume: 0.5,
    crtEffect: true,
    viewMode: 'desktop',
    diceSkin: 'neon_cyan',
    boardDirection: 'counter_clockwise',
    boardTheme: 'neon',
  });

  const [meta, setMeta] = useState<MetaData>(loadMetaData);
  const [run, setRun] = useState<RunState | null>(null);

  // Active View Screen: 'MAIN_MENU' | 'MAP' | 'MATCH' | 'DRAFT' | 'SHOP' | 'META_LAB'
  const [activeScreen, setActiveScreen] = useState<string>('MAIN_MENU');

  // Match State
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [turn, setTurn] = useState<PlayerId>('player');
  const [dice, setDice] = useState<number[]>([]);
  const [isDoubles, setIsDoubles] = useState<boolean>(false);
  const [cardNotes, setCardNotes] = useState<string[]>([]);
  const [currentOpponent, setCurrentOpponent] = useState<OpponentCard | null>(null);
  const [activePlayerCard, setActivePlayerCard] = useState<Card | null>(null);
  const [activeCpuCard, setActiveCpuCard] = useState<Card | null>(null);

  // Turn tracking flags for passive card effects
  const [turnMoveCount, setTurnMoveCount] = useState<number>(0);
  const [lastMoveDest, setLastMoveDest] = useState<number | undefined>(undefined);
  const [startedWithBlots, setStartedWithBlots] = useState<boolean>(false);
  // Last-turn condition flags for self/sabotage cards (Open Circuit, Second Wind, Failsafe, Coward's
  // Tax, Lost Packet, Event Horizon) — kept PER SIDE, not shared, because turns alternate
  // Player -> CPU -> Player. A shared flag gets overwritten by the opponent's turn before the
  // owning side ever gets to roll again, silently breaking every one of these cards.
  const [playerEndedWithBlot, setPlayerEndedWithBlot] = useState<boolean>(false);
  const [cpuEndedWithBlot, setCpuEndedWithBlot] = useState<boolean>(false);
  const [playerWasHitLastTurn, setPlayerWasHitLastTurn] = useState<boolean>(false);
  const [cpuWasHitLastTurn, setCpuWasHitLastTurn] = useState<boolean>(false);
  const [shakeToken, setShakeToken] = useState<number>(0);
  const [viewStage, setViewStage] = useState<ViewStage>('table');
  const cycleViewStage = () => {
    setViewStage((s) => (s === 'table' ? 'peek' : s === 'peek' ? 'panorama' : 'table'));
  };
  const [playerFailsafeTriggered, setPlayerFailsafeTriggered] = useState<boolean>(false);
  const [cpuFailsafeTriggered, setCpuFailsafeTriggered] = useState<boolean>(false);
  const [playerCowardsTaxTriggered, setPlayerCowardsTaxTriggered] = useState<boolean>(false);
  const [cpuCowardsTaxTriggered, setCpuCowardsTaxTriggered] = useState<boolean>(false);
  const [playerLostPacketTriggered, setPlayerLostPacketTriggered] = useState<boolean>(false);
  const [cpuLostPacketTriggered, setCpuLostPacketTriggered] = useState<boolean>(false);
  const [firstHitInTurn, setFirstHitInTurn] = useState<boolean>(true);
  // EVENT HORIZON (Singularity exclusive): did the mover bear off a checker at any point last turn?
  const [turnHadBearOff, setTurnHadBearOff] = useState<boolean>(false);
  const [playerBorneOffLastTurn, setPlayerBorneOffLastTurn] = useState<boolean>(false);
  const [cpuBorneOffLastTurn, setCpuBorneOffLastTurn] = useState<boolean>(false);
  // COWARD'S TAX: did the mover have a hit available at some point this turn and never take one?
  const [turnSkippedHitOpportunity, setTurnSkippedHitOpportunity] = useState<boolean>(false);

  // "MUTATION ACTIVATED" flash: fires whenever a card actually altered dice/movement this turn,
  // so effects don't silently blend into what would otherwise look like plain backgammon.
  // The 'protocol' variant (red) fires when a boss protocol is what actually bit this turn.
  const [mutationFlashToken, setMutationFlashToken] = useState<number>(0);
  const [mutationFlashText, setMutationFlashText] = useState<string>('');
  const [mutationFlashVariant, setMutationFlashVariant] = useState<'card' | 'protocol'>('card');
  const triggerMutationFlash = (notes: string[], variant: 'card' | 'protocol' = 'card') => {
    if (notes.length === 0) return;
    setMutationFlashText(notes[0]);
    setMutationFlashVariant(variant);
    setMutationFlashToken((t) => t + 1);
  };
  // executeMove() narrates plain backgammon events (a hit, a bear-off) into the same
  // `notes` array card/protocol effects use for the game log — filter those out before
  // they reach the flash, since they happen on every hit/bear-off with no card involved.
  const isBaseGameNote = (note: string) => note.startsWith('💥 HIT!') || note.endsWith('bore off a checker!');

  // Movement-distance cards (Tailwind, Trailing Drag, Courier, Deadweight, Echo Jam) resolve silently
  // inside getValidMoves — dieUsed stays the raw die while the actual point distance is boosted/reduced.
  // Comparing the two after a move catches every one of them without duplicating that logic here.
  const MOVEMENT_DISTANCE_CARD_LABELS: Record<string, string> = {
    card_tailwind: '💨 TAILWIND: Rearmost checker caught a tailwind — moved further than the die!',
    card_trailing_drag: "🐌 TRAILING DRAG: Opponent's rearmost checker dragged — moved less than the die!",
    card_courier: '📮 COURIER: Marked checker expedited — moved further than the die!',
    card_deadweight: '⚓ DEADWEIGHT: Marked checker weighed down — moved less than the die!',
    card_echo_jam: '📡 ECHO JAM: Same checker jammed on repeat — moved less than the die!',
  };
  const detectDistanceMutation = (move: ValidMoveResult, ownCard?: Card, oppCard?: Card): string | null => {
    if (move.isBatchEntry) return '📦 BATCH UPLOAD: Both Bar checkers re-entered together on one die!';
    if (typeof move.from !== 'number' || typeof move.to !== 'number') return null;
    const rawDistance = Math.abs(move.to - move.from);
    if (rawDistance === move.dieUsed) return null;
    const candidateId = [ownCard?.id, oppCard?.id].find((id) => id && MOVEMENT_DISTANCE_CARD_LABELS[id]);
    return candidateId ? MOVEMENT_DISTANCE_CARD_LABELS[candidateId] : '🔀 MUTATION: A card altered this move\'s distance!';
  };

  // Forcing sabotage cards silently narrow the offered move set instead of altering a chosen move.
  // Comparing against the same getValidMoves call with the sabotage card stripped out reveals the narrowing.
  const FORCING_CARD_LABELS: Record<string, string> = {
    card_compulsory_hit: '🔥 COMPULSORY HIT: A hit was available — forced to take it!',
    card_blood_magnet: '🧲 BLOOD MAGNET: Started turn with a blot — forced to move it first!',
    card_forced_commit: '🔒 FORCED COMMIT: Continuing the same checker was mandatory!',
  };

  // Gating cards (Home Security, Exact Lock, Final Check, Termination Protocol) block bear-off
  // entirely rather than firing on one move — surfaced as a persistent badge in NeonBoard instead
  // of a one-off flash here.

  // Card Point Selection States (Black Ice, Deadweight, Courier)
  const [playerBlackIcePoint, setPlayerBlackIcePoint] = useState<number | null>(null);
  const [cpuBlackIcePoint, setCpuBlackIcePoint] = useState<number | null>(null);

  const [playerDeadweightPoint, setPlayerDeadweightPoint] = useState<number | null>(null);
  const [cpuDeadweightPoint, setCpuDeadweightPoint] = useState<number | null>(null);

  const [playerCourierPoint, setPlayerCourierPoint] = useState<number | null>(null);
  const [cpuCourierPoint, setCpuCourierPoint] = useState<number | null>(null);

  const [canColdRebootReroll, setCanColdRebootReroll] = useState<boolean>(false);

  const [showMarkedModal, setShowMarkedModal] = useState<boolean>(false);
  const [markedModalType, setMarkedModalType] = useState<SelectionType>('black_ice');

  // Equip selection state (repurposed from the old 3-card draft into a full-collection equip screen)
  const [showCardSelectModal, setShowCardSelectModal] = useState<boolean>(false);
  const [draftPlayerChoices, setDraftPlayerChoices] = useState<Card[]>([]);
  const [draftCpuChoice, setDraftCpuChoice] = useState<Card | null>(null);

  // Campaign protocol boss state
  const [activeBossProtocolId, setActiveBossProtocolId] = useState<string | null>(null);
  const [showBossIntro, setShowBossIntro] = useState<boolean>(false);

  // Card Zoom / Inspection modal state
  const [inspectedCard, setInspectedCard] = useState<{ card: Card; ownerLabel: string } | null>(null);

  const [isMatchOver, setIsMatchOver] = useState<boolean>(false);
  const [matchWinner, setMatchWinner] = useState<PlayerId | null>(null);

  // History stack for current player turn (enables Undo Move & Reset Turn)
  const [turnHistory, setTurnHistory] = useState<{ board: BoardState; dice: number[] }[]>([]);

  // Post-match draft choices state
  const [draftChoices, setDraftChoices] = useState<Card[]>([]);

  // Sound settings sync
  useEffect(() => {
    soundFx.setEnabled(settings.soundEnabled);
    soundFx.setVolume(settings.sfxVolume);
  }, [settings.soundEnabled, settings.sfxVolume]);

  // Looping background music: plays on the main menu and the pre-match card draft screen only.
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = bgMusicRef.current;
    if (!audio) return;
    audio.volume = 0.08 * settings.sfxVolume;
    const shouldPlay = settings.soundEnabled && (activeScreen === 'MAIN_MENU' || showCardSelectModal);
    if (shouldPlay) {
      audio.play().catch(() => {
        // Browser blocked autoplay until a user gesture — retry on the next click.
        const retryOnGesture = () => {
          audio.play().catch(() => {});
        };
        window.addEventListener('pointerdown', retryOnGesture, { once: true });
        return () => window.removeEventListener('pointerdown', retryOnGesture);
      });
    } else {
      audio.pause();
    }
  }, [activeScreen, showCardSelectModal, settings.soundEnabled, settings.sfxVolume]);

  // Looping ambient city sound bed: plays only during live gameplay (the match board itself).
  const gameplayAmbientRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = gameplayAmbientRef.current;
    if (!audio) return;
    // The city sits under the game by default; a protocol boss fight ducks it further — the
    // street recedes, the AR projection locks in, and the fight goes quiet and close.
    audio.volume = (activeBossProtocolId ? 0.12 : 0.3) * settings.sfxVolume;
    const shouldPlay = settings.soundEnabled && activeScreen === 'MATCH' && !showCardSelectModal;
    if (shouldPlay) {
      if (audio.paused) {
        audio.play().catch(() => {
          const retryOnGesture = () => {
            audio.play().catch(() => {});
          };
          window.addEventListener('pointerdown', retryOnGesture, { once: true });
        });
      }
    } else {
      audio.pause();
    }
  }, [activeScreen, showCardSelectModal, settings.soundEnabled, settings.sfxVolume, activeBossProtocolId]);

  // Start a new run
  const handleStartRun = () => {
    soundFx.playClick();
    const newRun = startNewRun(meta);
    setRun(newRun);

    // Save stats
    const updatedMeta: MetaData = {
      ...meta,
      totalGamesPlayed: meta.totalGamesPlayed + 1,
    };
    setMeta(updatedMeta);
    saveMetaData(updatedMeta);

    setActiveScreen('MAP');
  };

  // Start match against CPU opponent
  const handleStartMatch = () => {
    soundFx.playClick();

    if (run) {
      // CAMPAIGN RUN: the stage boss either plays a fixed card (card boss — beating them wins that
      // exact card) or brings no card at all and rewrites a rule instead (protocol boss — MIRROR CORE
      // is resolved once the player picks their own card, below).
      const stage = CAMPAIGN_STAGES[run.stage - 1];
      if (!stage) return;

      const opponent: OpponentCard = {
        id: `stage_${stage.stage}`,
        bossName: stage.bossName,
        bossTitle: stage.bossTitle,
        avatarSeed: stage.avatarSeed,
        accentColor: stage.accentColor,
        quote: stage.quote,
        difficulty: stage.stage,
        signatureCardId: stage.cardId || '',
      };
      setCurrentOpponent(opponent);
      setActiveBossProtocolId(stage.protocolId || null);

      const bossCard = stage.kind === 'card' ? PLAYER_CARDS.find((c) => c.id === stage.cardId) || null : null;
      setDraftCpuChoice(bossCard);
      setDraftPlayerChoices(run.deck);

      if (stage.kind === 'protocol') {
        setShowBossIntro(true); // speech-bubble intro first, then the equip screen
      } else {
        setShowCardSelectModal(true);
      }
      return;
    }

    // QUICK MATCH: always GLITCH-9, shared 3-card pool for both sides — unchanged from before.
    const opponent = getOpponentForStage(1);
    setCurrentOpponent(opponent);

    const shuffled = [...PLAYER_CARDS].filter((c) => !c.exclusiveToBoss).sort(() => Math.random() - 0.5);
    const pool = shuffled.slice(0, 3);
    const cChoice = pool[Math.floor(Math.random() * pool.length)];

    setDraftPlayerChoices(pool);
    setDraftCpuChoice(cChoice);
    setShowCardSelectModal(true);
  };

  // BossIntroOverlay's ENGAGE button — dismiss the speech-bubble intro and move to the equip screen.
  const handleEngageBoss = () => {
    soundFx.playClick();
    setShowBossIntro(false);
    setShowCardSelectModal(true);
  };

  // Confirm Card Selection & Start Match
  const handleConfirmCardSelection = (selectedPlayerCard: Card) => {
    soundFx.playClick();

    const stage = run ? CAMPAIGN_STAGES[run.stage - 1] : null;
    const protocol = stage?.protocolId ? BOSS_PROTOCOLS.find((p) => p.id === stage.protocolId) : undefined;
    // MIRROR CORE plays a live copy of whatever the player just equipped.
    const cpuCard = protocol?.id === 'mirror_core' ? selectedPlayerCard : draftCpuChoice || (run ? null : PLAYER_CARDS[1]);

    setActivePlayerCard(selectedPlayerCard);
    setActiveCpuCard(cpuCard);
    setShowCardSelectModal(false);

    setBoard(createInitialBoard());
    setTurn('player');
    setDice([]);
    setIsDoubles(false);
    setTurnHistory([]);

    // Reset card marked points
    setPlayerBlackIcePoint(null);
    setCpuBlackIcePoint(null);
    setPlayerDeadweightPoint(null);
    setCpuDeadweightPoint(null);
    setPlayerCourierPoint(null);
    setCpuCourierPoint(null);

    const matchNotes: string[] = protocol
      ? [`Stage ${stage!.stage}: ${stage!.bossName} — PROTOCOL ACTIVE: ${protocol.name} | Player Mutation: ${selectedPlayerCard.name}`]
      : [`Match Started! Player Mutation: ${selectedPlayerCard.name} | CPU Mutation: ${cpuCard ? cpuCard.name : 'None'}`];

    // Player Card Initialization
    if (selectedPlayerCard.id === 'card_black_ice') {
      setMarkedModalType('black_ice');
      setShowMarkedModal(true);
    } else if (selectedPlayerCard.id === 'card_deadweight') {
      setMarkedModalType('deadweight');
      setShowMarkedModal(true);
    } else if (selectedPlayerCard.id === 'card_courier') {
      setMarkedModalType('courier');
      setShowMarkedModal(true);
    }

    // CPU Card Initialization
    if (cpuCard?.id === 'card_black_ice') {
      const cpuPick = [5, 6, 7, 11, 12, 17, 18, 23][Math.floor(Math.random() * 8)];
      setCpuBlackIcePoint(cpuPick);
      matchNotes.push(`❄️ CPU covered Point #${cpuPick + 1} with Black Ice!`);
    } else if (cpuCard?.id === 'card_deadweight') {
      const cpuPick = 23; // CPU marks player's back checker at 24th point (index 23)
      setCpuDeadweightPoint(cpuPick);
      matchNotes.push(`⚓ CPU applied Deadweight to your checker at Point #${cpuPick + 1} (-1 move distance penalty)!`);
    } else if (cpuCard?.id === 'card_courier') {
      const cpuPick = 0; // CPU marks CPU's checker at 1st point (index 0)
      setCpuCourierPoint(cpuPick);
      matchNotes.push(`🚀 CPU applied Courier to their checker at Point #${cpuPick + 1} (+1 speed boost)!`);
    }

    setCardNotes(matchNotes);

    setIsMatchOver(false);
    setMatchWinner(null);

    setActiveScreen('MATCH');
  };

  // Handler for Player selecting a marked point/checker for Black Ice, Deadweight, or Courier
  const handleSelectMarkedPoint = (pointIndex: number) => {
    soundFx.playClick();
    setShowMarkedModal(false);

    if (markedModalType === 'black_ice') {
      setPlayerBlackIcePoint(pointIndex);
      setCardNotes((prev) => [
        ...prev,
        `❄️ BLACK ICE! Point #${pointIndex + 1} covered with icy trap. Any opponent landing here slips to the Bar!`,
      ]);
    } else if (markedModalType === 'deadweight') {
      setPlayerDeadweightPoint(pointIndex);
      setCardNotes((prev) => [
        ...prev,
        `⚓ DEADWEIGHT! Penalized opponent checker at Point #${pointIndex + 1} (-1 move distance penalty).`,
      ]);
    } else if (markedModalType === 'courier') {
      setPlayerCourierPoint(pointIndex);
      setCardNotes((prev) => [
        ...prev,
        `🚀 COURIER! Boosted your Courier checker at Point #${pointIndex + 1} (+1 speed boost).`,
      ]);
    }
  };

  // Roll Dice for Player Turn
  const handlePlayerRollDice = () => {
    if (!currentOpponent) return;

    const rollResult = rollDice('player', activePlayerCard || undefined, activeCpuCard || undefined, {
      barCount: board.bar.cpu,
      endedWithBlot: playerEndedWithBlot,
      wasHitLastTurn: playerWasHitLastTurn,
      failsafeTriggered: playerFailsafeTriggered,
      cowardsTaxTriggered: playerCowardsTaxTriggered,
      lostPacketTriggered: playerLostPacketTriggered,
      borneOffLastTurn: playerBorneOffLastTurn,
    });

    setDice(rollResult.dice);
    setIsDoubles(rollResult.isDoubles);
    setCanColdRebootReroll(!!rollResult.canColdRebootReroll);
    setTurnHistory([]); // Reset turn history on fresh roll
    setTurnHadBearOff(false);
    setTurnMoveCount(0);
    setLastMoveDest(undefined);
    setFirstHitInTurn(true);

    const hasBlotAtStart = board.points.some((pt) => pt.filter((c) => c.color === 'player').length === 1);
    setStartedWithBlots(hasBlotAtStart);

    if (rollResult.cardNotes.length > 0) {
      setCardNotes((prev) => [...prev, ...rollResult.cardNotes]);
    }
    triggerMutationFlash(rollResult.cardNotes);

    // BYPASS PROTOCOL doesn't push its own note (it just quietly unlocks moves) — detect it here.
    if (board.bar.player > 0 && activePlayerCard?.id === 'card_bypass_protocol') {
      const postRollMoves = getValidMoves(board, 'player', rollResult.dice, activePlayerCard ? [activePlayerCard] : [], activeCpuCard || undefined, rollResult.isDoubles, {});
      if (postRollMoves.some((m) => m.from !== 'bar')) {
        triggerMutationFlash(['⚙️ BYPASS PROTOCOL: Stuck on the Bar, but your on-board checkers can still move!']);
      }
    }
  };

  // Player Manual Cold Reboot Reroll Action
  const handlePlayerColdRebootReroll = () => {
    if (!currentOpponent || !canColdRebootReroll) return;
    soundFx.playDiceRoll();

    const oldSum = dice.reduce((a, b) => a + b, 0);
    const rerollResult = rollDice('player', activePlayerCard || undefined, activeCpuCard || undefined, {
      barCount: board.bar.cpu,
      endedWithBlot: playerEndedWithBlot,
      wasHitLastTurn: playerWasHitLastTurn,
      failsafeTriggered: playerFailsafeTriggered,
      cowardsTaxTriggered: playerCowardsTaxTriggered,
      lostPacketTriggered: playerLostPacketTriggered,
      borneOffLastTurn: playerBorneOffLastTurn,
      isColdRebootReroll: true,
    });

    setDice(rerollResult.dice);
    setIsDoubles(rerollResult.isDoubles);
    setCanColdRebootReroll(false);
    const coldRebootNote = `🔄 COLD REBOOT: Dice rerolled! (Old Sum: ${oldSum} -> New Dice: [${rerollResult.dice.join(', ')}])`;
    setCardNotes((prev) => [...prev, coldRebootNote]);
    triggerMutationFlash([coldRebootNote]);
  };

  // Get active valid moves for player
  // NULL SECTOR / OMEGA PROTOCOL disable the player's equipped card for the whole match — it still
  // shows in the UI (so the player can see what they brought), it just does nothing mechanically.
  const isCardNulledByProtocol = activeBossProtocolId === 'null_sector' || activeBossProtocolId === 'omega_protocol';
  const equippedCards = activePlayerCard && !isCardNulledByProtocol ? [activePlayerCard] : [];
  const validPlayerMoves = turn === 'player' && dice.length > 0
    ? getValidMoves(board, 'player', dice, equippedCards, activeCpuCard || undefined, isDoubles, {
        turnMoveCount,
        lastMoveDest,
        startedWithBlots,
        playerCourierPoint,
        cpuCourierPoint,
        playerDeadweightPoint,
        cpuDeadweightPoint,
        bossProtocolId: activeBossProtocolId || undefined,
      })
    : [];

  // Execute Player Move
  const handleSelectMove = (move: ValidMoveResult) => {
    if (turn !== 'player' || !currentOpponent) return;

    setCanColdRebootReroll(false);

    // FORCING sabotage cards (Compulsory Hit, Blood Magnet, Forced Commit) silently narrow which
    // moves are even offered — detect the narrowing by comparing against the unfiltered move set,
    // using the pre-move board/dice while they're still valid.
    if (activeCpuCard && FORCING_CARD_LABELS[activeCpuCard.id]) {
      const unfilteredMoves = getValidMoves(board, 'player', dice, equippedCards, undefined, isDoubles, {
        turnMoveCount,
        lastMoveDest,
        startedWithBlots,
        playerCourierPoint,
        cpuCourierPoint,
        playerDeadweightPoint,
        cpuDeadweightPoint,
        bossProtocolId: activeBossProtocolId || undefined,
      });
      if (unfilteredMoves.length > validPlayerMoves.length) {
        triggerMutationFlash([FORCING_CARD_LABELS[activeCpuCard.id]]);
      }
    }

    // FORTIFIED / FIREWALL silently narrow the player's own move options — same counterfactual
    // trick, toggling the protocol off instead of a card, flashed in the red PROTOCOL variant.
    if (activeBossProtocolId === 'fortified' || activeBossProtocolId === 'firewall') {
      const withoutProtocol = getValidMoves(board, 'player', dice, equippedCards, activeCpuCard || undefined, isDoubles, {
        turnMoveCount,
        lastMoveDest,
        startedWithBlots,
        playerCourierPoint,
        cpuCourierPoint,
        playerDeadweightPoint,
        cpuDeadweightPoint,
      });
      if (withoutProtocol.length > validPlayerMoves.length) {
        const protocol = BOSS_PROTOCOLS.find((p) => p.id === activeBossProtocolId);
        if (protocol) triggerMutationFlash([`🔒 ${protocol.name}: ${protocol.description}`], 'protocol');
      }
    }

    // REDUNDANCY: would otherwise have 0 moves this turn — reusing the one playable die twice unlocked this move.
    if (activePlayerCard?.id === 'card_redundancy') {
      const withoutRedundancy = getValidMoves(board, 'player', dice, [], activeCpuCard || undefined, isDoubles, {
        turnMoveCount,
        lastMoveDest,
        startedWithBlots,
        playerCourierPoint,
        cpuCourierPoint,
        playerDeadweightPoint,
        cpuDeadweightPoint,
        bossProtocolId: activeBossProtocolId || undefined,
      });
      if (withoutRedundancy.length === 0 && validPlayerMoves.length > 0) {
        triggerMutationFlash(['♻️ REDUNDANCY: Only one die was playable — reused it twice!']);
      }
    }

    // COWARD'S TAX bookkeeping: track whether a hit was on the table this decision and whether it was taken.
    const hitWasAvailableNow = validPlayerMoves.some(
      (m) => typeof m.to === 'number' && board.points[m.to].filter((c) => c.color === 'cpu').length === 1
    );
    const chosenIsHit = typeof move.to === 'number' && board.points[move.to].filter((c) => c.color === 'cpu').length === 1;
    const finalSkippedHitOpportunity = chosenIsHit ? false : (turnSkippedHitOpportunity || hitWasAvailableNow);
    setTurnSkippedHitOpportunity(finalSkippedHitOpportunity);

    // Save snapshot to history BEFORE executing move
    setTurnHistory((prev) => [...prev, { board, dice: [...dice] }]);

    const moveResult = executeMove(board, 'player', move, equippedCards, activeCpuCard || undefined, {
      isFirstHitInTurn: firstHitInTurn,
      isDoubles,
      playerBlackIcePoint,
      cpuBlackIcePoint,
      playerCourierPoint,
      cpuCourierPoint,
      playerDeadweightPoint,
      cpuDeadweightPoint,
      bossProtocolId: activeBossProtocolId || undefined,
    });

    setBoard(moveResult.newBoard);

    if (moveResult.updatedPlayerCourierPoint !== undefined) setPlayerCourierPoint(moveResult.updatedPlayerCourierPoint);
    if (moveResult.updatedCpuCourierPoint !== undefined) setCpuCourierPoint(moveResult.updatedCpuCourierPoint);
    if (moveResult.updatedPlayerDeadweightPoint !== undefined) setPlayerDeadweightPoint(moveResult.updatedPlayerDeadweightPoint);
    if (moveResult.updatedCpuDeadweightPoint !== undefined) setCpuDeadweightPoint(moveResult.updatedCpuDeadweightPoint);

    if (moveResult.wasHit) {
      soundFx.playHitBlot();
      setFirstHitInTurn(false);
      setShakeToken((t) => t + 1);
    } else if (move.to === 'off') {
      soundFx.playBearOff();
      fireBearOffConfetti();
      setTurnHadBearOff(true);
    }

    if (moveResult.notes.length > 0) {
      setCardNotes((prev) => [...prev, ...moveResult.notes]);
    }
    const playerMutationNotes = moveResult.notes.filter((n) => !isBaseGameNote(n));
    if (playerMutationNotes.length > 0) {
      triggerMutationFlash(playerMutationNotes);
    } else {
      const distanceNote = detectDistanceMutation(move, activePlayerCard || undefined, activeCpuCard || undefined);
      if (distanceNote) triggerMutationFlash([distanceNote]);
    }

    setTurnMoveCount((prev) => prev + 1);
    if (typeof move.to === 'number') {
      setLastMoveDest(move.to);
    }

    // Remove used die
    const dieIdx = dice.indexOf(move.dieUsed);
    let newDice = [...dice];
    if (dieIdx >= 0) newDice.splice(dieIdx, 1);

    // Apply CARD BOOST/TAX EFFECTS on remaining dice
    if (moveResult.boostRemainingDice && moveResult.boostRemainingDice > 0) {
      newDice = newDice.map((d) => Math.min(6, d + moveResult.boostRemainingDice!));
    }
    if (moveResult.taxRemainingDice && moveResult.taxRemainingDice > 0) {
      newDice = newDice.map((d) => Math.max(1, d - moveResult.taxRemainingDice!));
    }
    if (moveResult.removeOneDie && newDice.length > 0) {
      newDice.pop();
    }

    setDice(newDice);

    // Check Victory (Player borne off all 15 checkers)
    if (moveResult.newBoard.off.player >= 15) {
      soundFx.playVictory();
      fireVictoryConfetti();
      setIsMatchOver(true);
      setMatchWinner('player');
      handleMatchEnd('player', moveResult.newBoard.off.cpu === 0);
      return;
    }

    // If out of dice, switch to CPU turn
    if (newDice.length === 0) {
      const leftBlot = moveResult.newBoard.points.some((pt) => pt.filter((c) => c.color === 'player').length === 1);
      setPlayerEndedWithBlot(leftBlot);
      setPlayerBorneOffLastTurn(turnHadBearOff || move.to === 'off');
      // Player just hit CPU (if at all) -> it's the CPU's blot that was hit, so CPU's flag is the one that moves.
      setCpuWasHitLastTurn(moveResult.wasHit || !firstHitInTurn);
      setPlayerCowardsTaxTriggered(finalSkippedHitOpportunity);
      setPlayerFailsafeTriggered(false);
      setPlayerLostPacketTriggered(false);
      setTurn('cpu');
      setTurnHistory([]);
      setTurnMoveCount(0);
      setLastMoveDest(undefined);
    }
  };

  // Undo single move in current turn
  const handleUndoMove = () => {
    if (turnHistory.length === 0 || turn !== 'player') return;
    soundFx.playClick();

    const lastSnap = turnHistory[turnHistory.length - 1];
    setBoard(lastSnap.board);
    setDice(lastSnap.dice);
    setTurnHistory((prev) => prev.slice(0, -1));
    setCardNotes((prev) => [...prev, 'Undo: Returned checker to previous position']);
  };

  // Reset entire turn back to initial roll state
  const handleUndoTurn = () => {
    if (turnHistory.length === 0 || turn !== 'player') return;
    soundFx.playClick();

    const firstSnap = turnHistory[0];
    setBoard(firstSnap.board);
    setDice(firstSnap.dice);
    setTurnHistory([]);
    setCardNotes((prev) => [...prev, 'Reset Turn: Reverted all moves for this turn']);
  };

  // PACKET DROP active ability: after playing 1 die on a non-double roll, discard the rest
  const handleDiscardDie = () => {
    soundFx.playClick();
    const leftBlot = board.points.some((pt) => pt.filter((c) => c.color === 'player').length === 1);
    setPlayerEndedWithBlot(leftBlot);
    setCardNotes((prev) => [...prev, '🗑️ PACKET DROP: Remaining die discarded, turn ended early!']);
    triggerMutationFlash(['🗑️ PACKET DROP: Remaining die discarded, turn ended early!']);
    setPlayerFailsafeTriggered(false);
    setPlayerLostPacketTriggered(false);
    setPlayerCowardsTaxTriggered(turnSkippedHitOpportunity);
    setDice([]);
    setTurn('cpu');
    setTurnHistory([]);
    setTurnMoveCount(0);
    setLastMoveDest(undefined);
  };

  // Pass Turn if no valid moves exist
  const handlePassTurn = () => {
    soundFx.playClick();
    const stuckOnBar = (turn === 'player' ? board.bar.player : board.bar.cpu) > 0;
    if (turn === 'player') {
      setPlayerFailsafeTriggered(stuckOnBar);
      setPlayerLostPacketTriggered(!stuckOnBar);
    } else {
      setCpuFailsafeTriggered(stuckOnBar);
      setCpuLostPacketTriggered(!stuckOnBar);
    }
    // FAILSAFE only actually fires next roll if the stuck side holds that card;
    // LOST PACKET is a sabotage card, so it only fires if the *opponent* holds it.
    // A plain stuck-on-Bar / unplayable-die pass with neither card equipped is just
    // ordinary backgammon and shouldn't flash a card-mutation banner.
    const moverCard = turn === 'player' ? activePlayerCard : activeCpuCard;
    const opponentCard = turn === 'player' ? activeCpuCard : activePlayerCard;
    if (stuckOnBar && moverCard?.id === 'card_failsafe') {
      triggerMutationFlash(['🛡️ FAILSAFE: Could not enter from the Bar — next roll gets a boost!']);
    } else if (!stuckOnBar && opponentCard?.id === 'card_lost_packet') {
      triggerMutationFlash(['📦 LOST PACKET: A die could not be played — next roll gets a boost!']);
    }
    setDice([]);
    setTurn(turn === 'player' ? 'cpu' : 'player');
  };

  // CPU Automated Turn Loop
  useEffect(() => {
    if (activeScreen !== 'MATCH' || turn !== 'cpu' || isMatchOver || !currentOpponent) return;

    let timeoutId: NodeJS.Timeout;

    // 1. CPU Rolls Dice if no dice available
    if (dice.length === 0) {
      timeoutId = setTimeout(() => {
        let rollResult = rollDice('cpu', activePlayerCard || undefined, activeCpuCard || undefined, {
          barCount: board.bar.player,
          endedWithBlot: cpuEndedWithBlot,
          wasHitLastTurn: cpuWasHitLastTurn,
          failsafeTriggered: cpuFailsafeTriggered,
          cowardsTaxTriggered: cpuCowardsTaxTriggered,
          lostPacketTriggered: cpuLostPacketTriggered,
          borneOffLastTurn: cpuBorneOffLastTurn,
        });

        // Evaluate Cold Reboot reroll for CPU if eligible
        if (rollResult.canColdRebootReroll) {
          const shouldReroll = shouldCpuColdReboot(
            board,
            rollResult.dice,
            activeCpuCard ? [activeCpuCard] : [],
            activePlayerCard || undefined,
            rollResult.isDoubles,
            {
              playerCourierPoint,
              cpuCourierPoint,
              playerDeadweightPoint,
              cpuDeadweightPoint,
              bossProtocolId: activeBossProtocolId || undefined,
            }
          );

          if (shouldReroll) {
            const oldRoll = [...rollResult.dice];
            rollResult = rollDice('cpu', activePlayerCard || undefined, activeCpuCard || undefined, {
              barCount: board.bar.player,
              endedWithBlot: cpuEndedWithBlot,
              wasHitLastTurn: cpuWasHitLastTurn,
              failsafeTriggered: cpuFailsafeTriggered,
              cowardsTaxTriggered: cpuCowardsTaxTriggered,
              lostPacketTriggered: cpuLostPacketTriggered,
              borneOffLastTurn: cpuBorneOffLastTurn,
              isColdRebootReroll: true,
            });
            rollResult.cardNotes.push(
              `🔄 CPU COLD REBOOT: CPU rerolled dice! (Old: [${oldRoll.join(', ')}] -> New: [${rollResult.dice.join(', ')}])`
            );
          } else {
            rollResult.cardNotes.push(
              `❄️ CPU COLD REBOOT: CPU strategically chose to keep current low roll ([${rollResult.dice.join(', ')}]).`
            );
          }
        }

        soundFx.playDiceRoll();
        setDice(rollResult.dice);
        setIsDoubles(rollResult.isDoubles);
        setTurnHadBearOff(false);
        setTurnMoveCount(0);
        setLastMoveDest(undefined);
        setFirstHitInTurn(true);

        const hasBlotAtStart = board.points.some((pt) => pt.filter((c) => c.color === 'cpu').length === 1);
        setStartedWithBlots(hasBlotAtStart);

        if (rollResult.cardNotes.length > 0) {
          setCardNotes((prev) => [...prev, ...rollResult.cardNotes]);
        }
        triggerMutationFlash(rollResult.cardNotes);

        if (board.bar.cpu > 0 && activeCpuCard?.id === 'card_bypass_protocol') {
          const postRollMoves = getValidMoves(board, 'cpu', rollResult.dice, activePlayerCard ? [activePlayerCard] : [], activeCpuCard || undefined, rollResult.isDoubles, {});
          if (postRollMoves.some((m) => m.from !== 'bar')) {
            triggerMutationFlash(['⚙️ BYPASS PROTOCOL: CPU is stuck on the Bar, but its on-board checkers can still move!']);
          }
        }
      }, 700);
      return () => clearTimeout(timeoutId);
    }

    // 2. CPU Calculates and Executes Move
    const cpuMoves = getValidMoves(board, 'cpu', dice, equippedCards, activeCpuCard || undefined, isDoubles, {
      turnMoveCount,
      lastMoveDest,
      startedWithBlots,
      playerCourierPoint,
      cpuCourierPoint,
      playerDeadweightPoint,
      cpuDeadweightPoint,
      bossProtocolId: activeBossProtocolId || undefined,
    });
    if (cpuMoves.length === 0) {
      // No CPU moves possible -> pass turn back to player
      timeoutId = setTimeout(() => {
        const cpuStuckOnBar = board.bar.cpu > 0;
        setCpuFailsafeTriggered(cpuStuckOnBar);
        setCpuLostPacketTriggered(!cpuStuckOnBar);
        if (cpuStuckOnBar && activeCpuCard?.id === 'card_failsafe') {
          triggerMutationFlash(['🛡️ FAILSAFE: CPU could not enter from the Bar!']);
        } else if (!cpuStuckOnBar && activePlayerCard?.id === 'card_lost_packet') {
          triggerMutationFlash(['📦 LOST PACKET: CPU had a die that could not be played!']);
        }
        setDice([]);
        setTurn('player');
        setTurnMoveCount(0);
        setLastMoveDest(undefined);
      }, 800);
      return () => clearTimeout(timeoutId);
    }

    // AI selects best move
    timeoutId = setTimeout(() => {
      const bestMove = getBestCpuMove(board, dice, activeCpuCard || undefined, equippedCards, isDoubles, {
        playerBlackIcePoint,
        cpuBlackIcePoint,
        playerCourierPoint,
        cpuCourierPoint,
        playerDeadweightPoint,
        cpuDeadweightPoint,
        bossProtocolId: activeBossProtocolId || undefined,
      });
      if (bestMove) {
        // FORCING sabotage cards (player's, against the CPU) silently narrow which moves the CPU
        // was even offered — same counterfactual comparison as the player side.
        if (activePlayerCard && FORCING_CARD_LABELS[activePlayerCard.id]) {
          const unfilteredCpuMoves = getValidMoves(board, 'cpu', dice, [], activeCpuCard || undefined, isDoubles, {
            turnMoveCount,
            lastMoveDest,
            startedWithBlots,
            playerCourierPoint,
            cpuCourierPoint,
            playerDeadweightPoint,
            cpuDeadweightPoint,
            bossProtocolId: activeBossProtocolId || undefined,
          });
          if (unfilteredCpuMoves.length > cpuMoves.length) {
            triggerMutationFlash([FORCING_CARD_LABELS[activePlayerCard.id]]);
          }
        }

        // PHASE WALK / SIEGE grant the CPU moves it wouldn't otherwise have (ignoring blocks /
        // bar priority) — same idea in reverse: protocol OFF should shrink the move set.
        if (activeBossProtocolId === 'phase_walk' || activeBossProtocolId === 'siege') {
          const withoutProtocol = getValidMoves(board, 'cpu', dice, equippedCards, activeCpuCard || undefined, isDoubles, {
            turnMoveCount,
            lastMoveDest,
            startedWithBlots,
            playerCourierPoint,
            cpuCourierPoint,
            playerDeadweightPoint,
            cpuDeadweightPoint,
          });
          if (withoutProtocol.length < cpuMoves.length) {
            const protocol = BOSS_PROTOCOLS.find((p) => p.id === activeBossProtocolId);
            if (protocol) triggerMutationFlash([`🔒 ${protocol.name}: ${protocol.description}`], 'protocol');
          }
        }

        if (activeCpuCard?.id === 'card_redundancy') {
          const withoutRedundancy = getValidMoves(board, 'cpu', dice, equippedCards, undefined, isDoubles, {
            turnMoveCount,
            lastMoveDest,
            startedWithBlots,
            playerCourierPoint,
            cpuCourierPoint,
            playerDeadweightPoint,
            cpuDeadweightPoint,
            bossProtocolId: activeBossProtocolId || undefined,
          });
          if (withoutRedundancy.length === 0 && cpuMoves.length > 0) {
            triggerMutationFlash(['♻️ REDUNDANCY: CPU had only one playable die — reused it twice!']);
          }
        }

        // COWARD'S TAX bookkeeping for the CPU side, mirroring the player side.
        const cpuHitWasAvailableNow = cpuMoves.some(
          (m) => typeof m.to === 'number' && board.points[m.to].filter((c) => c.color === 'player').length === 1
        );
        const cpuChosenIsHit = typeof bestMove.to === 'number' && board.points[bestMove.to].filter((c) => c.color === 'player').length === 1;
        const cpuFinalSkippedHitOpportunity = cpuChosenIsHit ? false : (turnSkippedHitOpportunity || cpuHitWasAvailableNow);
        setTurnSkippedHitOpportunity(cpuFinalSkippedHitOpportunity);

        const moveResult = executeMove(board, 'cpu', bestMove, equippedCards, activeCpuCard || undefined, {
          isFirstHitInTurn: firstHitInTurn,
          isDoubles,
          playerBlackIcePoint,
          cpuBlackIcePoint,
          playerCourierPoint,
          cpuCourierPoint,
          playerDeadweightPoint,
          cpuDeadweightPoint,
          bossProtocolId: activeBossProtocolId || undefined,
        });
        setBoard(moveResult.newBoard);

        if (moveResult.updatedPlayerCourierPoint !== undefined) setPlayerCourierPoint(moveResult.updatedPlayerCourierPoint);
        if (moveResult.updatedCpuCourierPoint !== undefined) setCpuCourierPoint(moveResult.updatedCpuCourierPoint);
        if (moveResult.updatedPlayerDeadweightPoint !== undefined) setPlayerDeadweightPoint(moveResult.updatedPlayerDeadweightPoint);
        if (moveResult.updatedCpuDeadweightPoint !== undefined) setCpuDeadweightPoint(moveResult.updatedCpuDeadweightPoint);
        soundFx.playMoveChecker();

        if (moveResult.wasHit) {
          soundFx.playHitBlot();
          setFirstHitInTurn(false);
          setShakeToken((t) => t + 1);
        } else if (bestMove.to === 'off') {
          soundFx.playBearOff();
          setTurnHadBearOff(true);
        }

        if (moveResult.notes.length > 0) {
          setCardNotes((prev) => [...prev, ...moveResult.notes]);
        }
        const cpuMutationNotes = moveResult.notes.filter((n) => !isBaseGameNote(n));
        if (cpuMutationNotes.length > 0) {
          triggerMutationFlash(cpuMutationNotes);
        } else {
          const distanceNote = detectDistanceMutation(bestMove, activeCpuCard || undefined, activePlayerCard || undefined);
          if (distanceNote) triggerMutationFlash([distanceNote]);
        }

        setTurnMoveCount((prev) => prev + 1);
        if (typeof bestMove.to === 'number') {
          setLastMoveDest(bestMove.to);
        }

        // Remove used die
        const dieIdx = dice.indexOf(bestMove.dieUsed);
        let newDice = [...dice];
        if (dieIdx >= 0) newDice.splice(dieIdx, 1);

        // Apply CARD BOOST/TAX EFFECTS on remaining dice
        if (moveResult.boostRemainingDice && moveResult.boostRemainingDice > 0) {
          newDice = newDice.map((d) => Math.min(6, d + moveResult.boostRemainingDice!));
        }
        if (moveResult.taxRemainingDice && moveResult.taxRemainingDice > 0) {
          newDice = newDice.map((d) => Math.max(1, d - moveResult.taxRemainingDice!));
        }
        if (moveResult.removeOneDie && newDice.length > 0) {
          newDice.pop();
        }

        setDice(newDice);

        // Check CPU Victory (CPU borne off all 15 checkers)
        if (moveResult.newBoard.off.cpu >= 15) {
          soundFx.playDefeat();
          setIsMatchOver(true);
          setMatchWinner('cpu');
          handleMatchEnd('cpu', moveResult.newBoard.off.player === 0);
          return;
        }

        if (newDice.length === 0) {
          const leftBlot = moveResult.newBoard.points.some((pt) => pt.filter((c) => c.color === 'cpu').length === 1);
          setCpuEndedWithBlot(leftBlot);
          setCpuBorneOffLastTurn(turnHadBearOff || bestMove.to === 'off');
          // CPU just hit the player (if at all) -> it's the player's blot that was hit.
          setPlayerWasHitLastTurn(moveResult.wasHit || !firstHitInTurn);
          setCpuCowardsTaxTriggered(cpuFinalSkippedHitOpportunity);
          setCpuFailsafeTriggered(false);
          setCpuLostPacketTriggered(false);
          setTurn('player');
          setTurnMoveCount(0);
          setLastMoveDest(undefined);
        }
      } else {
        setDice([]);
        setTurn('player');
        setTurnMoveCount(0);
        setLastMoveDest(undefined);
      }
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [activeScreen, turn, dice, board, isMatchOver, currentOpponent]);

  // Handle Match End: campaign win/loss/card-capture bookkeeping. `wasMars` = the loser bore off
  // zero checkers (a gammon) — only a mars loss can cost the player their equipped card.
  const handleMatchEnd = (winnerId: PlayerId, wasMars: boolean) => {
    if (!run) return;
    const stage = CAMPAIGN_STAGES[run.stage - 1];
    if (!stage) return;

    if (winnerId === 'player') {
      // Clearing the stage returns every captured card (never removed from the deck, just held
      // hostage) and adds this stage's fixed reward.
      const rewardCard = PLAYER_CARDS.find((c) => c.id === stage.rewardCardId);
      const newDeck = rewardCard && !run.deck.some((c) => c.id === rewardCard.id) ? [...run.deck, rewardCard] : run.deck;

      const updatedRun: RunState = {
        ...run,
        stage: run.stage + 1,
        deck: newDeck,
        capturedCardIds: [],
        consecutiveLosses: 0,
        lastEquippedCardId: activePlayerCard?.id || null,
        wins: run.wins + 1,
        opponentsDefeated: [...run.opponentsDefeated, stage.bossName],
      };
      setRun(updatedRun);

      const updatedMeta: MetaData = {
        ...meta,
        cyberData: meta.cyberData + (25 + run.stage * 15),
        highestStage: Math.max(meta.highestStage, run.stage),
      };
      setMeta(updatedMeta);
      saveMetaData(updatedMeta);
    } else {
      // Losing lets you retry the same stage indefinitely — the run never resets. Only a mars
      // captures the equipped card, and only up to 2 in a row (no further loss on the 3rd+ defeat).
      const alreadyCaptured = activePlayerCard ? run.capturedCardIds.includes(activePlayerCard.id) : false;
      const shouldCapture = wasMars && !!activePlayerCard && run.capturedCardIds.length < 2 && !alreadyCaptured;
      const newCaptured = shouldCapture ? [...run.capturedCardIds, activePlayerCard!.id] : run.capturedCardIds;

      const updatedRun: RunState = {
        ...run,
        consecutiveLosses: run.consecutiveLosses + 1,
        capturedCardIds: newCaptured,
        losses: run.losses + 1,
      };
      setRun(updatedRun);

      const updatedMeta: MetaData = {
        ...meta,
        cyberData: meta.cyberData + (10 + run.stage * 10),
      };
      setMeta(updatedMeta);
      saveMetaData(updatedMeta);
    }
  };

  // Continue after match screen: the campaign has no post-match draft anymore (rewards are fixed
  // per stage) — win or lose, you land back on the map. Outside a run, quick-match "play again" is unchanged.
  const handleContinueAfterMatch = () => {
    if (run) {
      setActiveBossProtocolId(null);
      setActiveScreen('MAP');
      return;
    }
    handleStartMatch();
  };

  // Select card from Draft Modal
  const handleSelectDraftCard = (card: Card) => {
    if (!run) return;
    soundFx.playClick();

    const newDeck = [...run.deck, card];
    let newEquipped = [...run.equippedCardIds];
    if (newEquipped.length < run.maxEquipSlots) {
      newEquipped.push(card.id);
    }

    const updatedRun: RunState = {
      ...run,
      stage: run.stage + 1,
      deck: newDeck,
      equippedCardIds: newEquipped,
    };
    setRun(updatedRun);
    setActiveScreen('MAP');
  };

  // Reroll Draft Choices
  const handleRerollDraft = () => {
    if (!run || run.rerolls <= 0) return;
    soundFx.playClick();

    const updatedRun: RunState = { ...run, rerolls: run.rerolls - 1 };
    setRun(updatedRun);
    setDraftChoices(generateCardDraftChoices(updatedRun, 3));
  };

  // Skip Draft
  const handleSkipDraft = () => {
    if (!run) return;
    soundFx.playClick();

    const updatedRun: RunState = { ...run, stage: run.stage + 1 };
    setRun(updatedRun);
    setActiveScreen('MAP');
  };

  // Toggle card equip status in deck
  const handleToggleEquipCard = (cardId: string) => {
    if (!run) return;
    soundFx.playClick();

    let newEquipped = [...run.equippedCardIds];
    if (newEquipped.includes(cardId)) {
      newEquipped = newEquipped.filter((id) => id !== cardId);
    } else {
      if (newEquipped.length < run.maxEquipSlots) {
        newEquipped.push(cardId);
      }
    }

    setRun({ ...run, equippedCardIds: newEquipped });
  };

  const playerPipCount = calculatePipCount(board, 'player');
  const cpuPipCount = calculatePipCount(board, 'cpu');

  const canDiscardDie =
    turn === 'player' &&
    !isMatchOver &&
    !isDoubles &&
    dice.length === 1 &&
    turnMoveCount >= 1 &&
    activePlayerCard?.id === 'card_packet_drop';

  return (
    <>
      <audio ref={bgMusicRef} src={cyberpunkBeat} loop preload="auto" />
      <audio ref={gameplayAmbientRef} src={gameplayAmbient} loop preload="auto" />
      <PlatformFrame
      settings={settings}
      onUpdateSettings={(newSet) => setSettings((s) => ({ ...s, ...newSet }))}
      onOpenMetaLab={() => setActiveScreen('META_LAB')}
      onGoToMenu={() => setActiveScreen('MAIN_MENU')}
      cyberData={meta.cyberData}
      viewStage={viewStage}
      screen={activeScreen === 'MAIN_MENU' ? 'menu' : 'game'}
      offsetForBoard={activeScreen === 'MATCH'}
      bossProtocolActive={activeScreen === 'MATCH' && !!activeBossProtocolId}
    >
      {/* 1. MAIN MENU SCREEN */}
      {activeScreen === 'MAIN_MENU' && (
        <div className="flex flex-col items-center justify-center text-center p-6 my-auto">
          {/* Logo Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-player via-point-b to-opponent p-1 shadow-[0_0_50px_var(--player)]/80 mb-6 animate-pulse">
            <div className="w-full h-full bg-panel-2 rounded-[22px] flex items-center justify-center font-display font-black text-player text-3xl tracking-tighter">
              NX
            </div>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-widest text-text uppercase mb-2 drop-shadow-[0_0_25px_var(--player)]/60">
            NEXTGAMMON
          </h1>
          <p className="text-sm sm:text-base text-player font-bold uppercase tracking-wider mb-8">
            CYBER BACKGAMMON WITH MUTATION CARDS
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={run ? () => setActiveScreen('MAP') : handleStartRun}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-opponent via-point-b to-player text-ink font-black text-base uppercase tracking-wider shadow-[0_0_30px_var(--opponent)]/70 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              {run ? 'RESUME RUN' : 'START RUN'}
            </button>
            <button
              onClick={handleStartMatch}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-player via-success to-success text-ink font-black text-base uppercase tracking-wider shadow-[0_0_30px_var(--player)]/70 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              START 1v1 MATCH
            </button>
          </div>
        </div>
      )}

      {/* 1B. ROGUELIKE RUN MAP */}
      {activeScreen === 'MAP' && run && (
        <div className="w-full h-full my-auto overflow-y-auto">
          <RunMapModal run={run} onEnterMatch={handleStartMatch} />
        </div>
      )}

      {/* 2. LIVE MATCH SCREEN */}
      {activeScreen === 'MATCH' && currentOpponent && (
        <div className="flex flex-col gap-2 w-full h-full min-h-0">
          {viewStage === 'table' && (
            <OpponentHeader
              opponent={currentOpponent}
              cpuPipCount={cpuPipCount}
              playerPipCount={playerPipCount}
              stage={1}
              maxStages={1}
              cpuCard={activeCpuCard || undefined}
              protocol={BOSS_PROTOCOLS.find((p) => p.id === activeBossProtocolId) || null}
              onCardClick={(card) => setInspectedCard({ card, ownerLabel: 'CPU CARD' })}
            />
          )}

          <NeonBoard
            board={board}
            turn={turn}
            dice={dice}
            validMoves={validPlayerMoves}
            onSelectMove={handleSelectMove}
            onRollDice={handlePlayerRollDice}
            canRoll={dice.length === 0 && turn === 'player' && !isMatchOver}
            canUndo={turnHistory.length > 0 && turn === 'player' && !isMatchOver}
            onUndoMove={handleUndoMove}
            onUndoTurn={handleUndoTurn}
            diceSkin={settings.diceSkin}
            boardDirection={settings.boardDirection}
            onUpdateSettings={(newSet) => setSettings((s) => ({ ...s, ...newSet }))}
            cardNotes={cardNotes}
            shakeToken={shakeToken}
            mutationFlashToken={mutationFlashToken}
            mutationFlashText={mutationFlashText}
            mutationFlashVariant={mutationFlashVariant}
            viewStage={viewStage}
            onCycleViewStage={cycleViewStage}
            isMatchOver={isMatchOver}
            winner={matchWinner}
            onNextMatch={handleContinueAfterMatch}
            onPassTurn={handlePassTurn}
            canDiscardDie={canDiscardDie}
            onDiscardDie={handleDiscardDie}
            playerActiveCard={activePlayerCard || undefined}
            cpuActiveCard={activeCpuCard || undefined}
            bossProtocol={BOSS_PROTOCOLS.find((p) => p.id === activeBossProtocolId) || null}
            onCardClick={(card, label) => setInspectedCard({ card, ownerLabel: label })}
            playerBlackIcePoint={playerBlackIcePoint}
            cpuBlackIcePoint={cpuBlackIcePoint}
            playerDeadweightPoint={playerDeadweightPoint}
            cpuDeadweightPoint={cpuDeadweightPoint}
            playerCourierPoint={playerCourierPoint}
            cpuCourierPoint={cpuCourierPoint}
            pendingCardSelectionType={
              activePlayerCard?.id === 'card_black_ice' && playerBlackIcePoint === null
                ? 'black_ice'
                : activePlayerCard?.id === 'card_deadweight' && playerDeadweightPoint === null
                ? 'deadweight'
                : activePlayerCard?.id === 'card_courier' && playerCourierPoint === null
                ? 'courier'
                : null
            }
            onOpenMarkedModal={(type) => {
              setMarkedModalType(type);
              setShowMarkedModal(true);
            }}
            onSelectMarkedPointDirectly={handleSelectMarkedPoint}
            canColdRebootReroll={canColdRebootReroll}
            onColdRebootReroll={handlePlayerColdRebootReroll}
          />
        </div>
      )}

      {/* MARKED CHECKER SELECTION MODAL */}
      <MarkedCheckerModal
        isOpen={showMarkedModal}
        type={markedModalType}
        board={board}
        onSelectPoint={handleSelectMarkedPoint}
        currentSelectedPoint={
          markedModalType === 'black_ice'
            ? playerBlackIcePoint
            : markedModalType === 'deadweight'
            ? playerDeadweightPoint
            : playerCourierPoint
        }
      />

      {/* BOSS INTRO: protocol bosses declare their rule-break in a speech bubble before you equip */}
      {showBossIntro && currentOpponent && (
        <BossIntroOverlay
          opponent={currentOpponent}
          protocol={BOSS_PROTOCOLS.find((p) => p.id === activeBossProtocolId) || null}
          onEngage={handleEngageBoss}
        />
      )}

      {/* CARD SELECTION MODAL BEFORE MATCH — quick match keeps the old "draft 1 of 3" flow;
          a campaign run equips from your full collection instead. */}
      {showCardSelectModal && (run ? true : !!draftCpuChoice) && (
        <CardSelectModal
          mode={run ? 'equip' : 'draft'}
          draftPool={draftPlayerChoices}
          cpuChoice={draftCpuChoice}
          bossCard={draftCpuChoice}
          protocol={run ? BOSS_PROTOCOLS.find((p) => p.id === activeBossProtocolId) || null : null}
          lastEquippedCardId={run?.lastEquippedCardId || null}
          capturedCardIds={run?.capturedCardIds || []}
          bossName={currentOpponent?.bossName || 'CPU'}
          onConfirmSelection={handleConfirmCardSelection}
        />
      )}

      {/* CARD DETAIL / INSPECTION MODAL */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard.card}
          ownerLabel={inspectedCard.ownerLabel}
          onClose={() => setInspectedCard(null)}
        />
      )}

      {/* 4. DRAFT REWARD MODAL */}
      {activeScreen === 'DRAFT' && run && (
        <DraftModal
          choices={draftChoices}
          rerollsLeft={run.rerolls}
          onSelectCard={handleSelectDraftCard}
          onReroll={handleRerollDraft}
          onSkip={handleSkipDraft}
        />
      )}

      {/* 5. SHOP MODAL */}
      {activeScreen === 'SHOP' && run && (
        <ShopModal
          run={run}
          onBuyCard={(card) => {
            soundFx.playClick();
            const cost = card.cost || 50;
            if (run.chips >= cost) {
              setRun({
                ...run,
                chips: run.chips - cost,
                deck: [...run.deck, card],
              });
            }
          }}
          onBuySlot={() => {
            soundFx.playClick();
            if (run.chips >= 120 && run.maxEquipSlots < 3) {
              setRun({
                ...run,
                chips: run.chips - 120,
                maxEquipSlots: run.maxEquipSlots + 1,
              });
            }
          }}
          onBuyReroll={() => {
            soundFx.playClick();
            if (run.chips >= 40) {
              setRun({
                ...run,
                chips: run.chips - 40,
                rerolls: run.rerolls + 1,
              });
            }
          }}
          onClose={() => setActiveScreen('MAP')}
        />
      )}

      {/* 6. PERMANENT META LAB MODAL */}
      {activeScreen === 'META_LAB' && (
        <MetaLabModal
          meta={meta}
          onPurchase={(upgradeId) => {
            soundFx.playClick();
            const updated = purchaseMetaUpgrade(meta, upgradeId);
            setMeta(updated);
          }}
          onClose={() => setActiveScreen(run ? 'MAP' : 'MAIN_MENU')}
        />
      )}
      </PlatformFrame>
    </>
  );
}
