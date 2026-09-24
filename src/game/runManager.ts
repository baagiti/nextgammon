import { RunState, MetaData, Card, OpponentCard } from '../types';
import { PLAYER_CARDS, OPPONENT_BOSSES } from './cardsData';
import { STARTER_CARD_ID, CAMPAIGN_STAGES } from './campaignData';

const META_STORAGE_KEY = 'NEXTGAMMON_META_PROGRESSION_V1';
const RUN_STORAGE_KEY = 'NEXTGAMMON_RUN_V1';

function defaultMetaData(): MetaData {
  return {
    neonChips: 150, // Starting bonus Neon Chips so user can inspect meta lab immediately!
    unlockedUpgrades: {},
    totalGamesPlayed: 0,
    totalWins: 0,
    highestStage: 1,
    unlockedCards: PLAYER_CARDS.filter((c) => c.unlockedByDefault).map((c) => c.id),
    selectedDiceSkin: 'neon_cyan',
    totalMatchesPlayed: 0,
    totalMatchesWon: 0,
    totalHits: 0,
    totalGammonWins: 0,
    totalQuickMatchWins: 0,
    totalRunsCompleted: 0,
    totalProtocolsCleared: 0,
    totalLifetimeChips: 0,
    maxConsecutiveLossesEver: 0,
    totalComebackWins: 0,
    totalFlawlessRunCompletions: 0,
    cardsPlayedQuickMatch: [],
    unlockedAchievements: [],
  };
}

// Adds card ids to the player's lifetime collection (`unlockedCards`), without duplicates. The
// COLLECTOR / FULL DECK achievements count this list.
export function withUnlockedCards(unlocked: string[], ids: string[]): string[] {
  const set = new Set(unlocked);
  ids.forEach((id) => set.add(id));
  return [...set];
}

// Saves written before the collection was tracked have an empty `unlockedCards` even for players
// deep into the campaign. Rebuild what they must have earned: the starter card once any run was
// started, and the fixed reward of every stage up to the highest one cleared (stages are cleared
// strictly in order, so highestStage N means stages 1..N are all cleared).
function backfillUnlockedCards(meta: MetaData): MetaData {
  const earned: string[] = [];
  if (meta.totalGamesPlayed > 0) earned.push(STARTER_CARD_ID);
  const clearedAny = meta.totalWins > 0 || meta.highestStage > 1;
  if (clearedAny) {
    CAMPAIGN_STAGES.filter((s) => s.stage <= meta.highestStage).forEach((s) => earned.push(s.rewardCardId));
  }
  return { ...meta, unlockedCards: withUnlockedCards(meta.unlockedCards, earned) };
}

export function loadMetaData(): MetaData {
  try {
    const dataStr = localStorage.getItem(META_STORAGE_KEY);
    if (dataStr) {
      const parsed = JSON.parse(dataStr);
      // Migrate pre-rename saves: the currency field was called `cyberData` before it became
      // Neon Chips. Without this, existing players' balance reads as undefined -> NaN forever.
      if (parsed.neonChips === undefined && typeof parsed.cyberData === 'number') {
        parsed.neonChips = parsed.cyberData;
        delete parsed.cyberData;
      }
      // Merge onto the defaults so any field added after a player's save was written (e.g. the
      // whole achievements/lifetime-stats block) comes back as a safe zero/empty value instead
      // of undefined -> NaN or a missing array crashing achievement checks.
      return backfillUnlockedCards({ ...defaultMetaData(), ...parsed });
    }
  } catch (e) {
    console.error('Failed to load meta data', e);
  }

  return defaultMetaData();
}

export function saveMetaData(meta: MetaData): void {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('Failed to save meta data', e);
  }
}

// --- Campaign run persistence ---------------------------------------------------------------
// The run (stage, won cards, captured cards, counters) is saved on every change so closing the app
// — or the OS killing it in the background — doesn't throw away a 44-stage campaign. Only the run
// is saved, not a match in progress: reopening puts the player back on the map at the same stage,
// and the interrupted match is simply played again (it isn't counted as a loss).
//
// Cards are stored by id and rebuilt from PLAYER_CARDS on load, so a later update that changes a
// card's text or numbers applies to saved runs too, and an id that no longer exists is dropped.
interface SavedRun extends Omit<RunState, 'deck'> {
  version: 1;
  deck: string[];
  coldStorageActive: boolean; // paid-for protection for the current stage, charged before the match
}

export function saveRun(run: RunState | null, coldStorageActive: boolean): void {
  try {
    if (!run) {
      localStorage.removeItem(RUN_STORAGE_KEY);
      return;
    }
    const saved: SavedRun = { ...run, version: 1, deck: run.deck.map((c) => c.id), coldStorageActive };
    localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(saved));
  } catch (e) {
    console.error('Failed to save run', e);
  }
}

export function loadRun(): { run: RunState | null; coldStorageActive: boolean } {
  const none = { run: null, coldStorageActive: false };
  try {
    const dataStr = localStorage.getItem(RUN_STORAGE_KEY);
    if (!dataStr) return none;
    const saved = JSON.parse(dataStr) as Partial<SavedRun>;
    if (saved.version !== 1 || typeof saved.stage !== 'number' || !Array.isArray(saved.deck)) return none;

    const deck = saved.deck
      .map((id) => PLAYER_CARDS.find((c) => c.id === id))
      .filter((c): c is Card => !!c);
    const starter = PLAYER_CARDS.find((c) => c.id === STARTER_CARD_ID);
    if (deck.length === 0 && starter) deck.push(starter);
    const known = (ids: unknown) => (Array.isArray(ids) ? ids.filter((id) => deck.some((c) => c.id === id)) : []);

    const { version: _v, coldStorageActive, deck: _d, ...rest } = saved;
    const run: RunState = {
      // Defaults for any field added to RunState after this save was written.
      ...startNewRun(defaultMetaData()),
      ...rest,
      stage: Math.min(Math.max(1, Math.floor(saved.stage)), CAMPAIGN_STAGES.length + 1),
      deck,
      capturedCardIds: known(saved.capturedCardIds),
      equippedCardIds: known(saved.equippedCardIds),
      lastEquippedCardId: saved.lastEquippedCardId && deck.some((c) => c.id === saved.lastEquippedCardId) ? saved.lastEquippedCardId : null,
    };
    return { run, coldStorageActive: !!coldStorageActive };
  } catch (e) {
    console.error('Failed to load run', e);
    return none;
  }
}

export function startNewRun(meta: MetaData): RunState {
  // Campaign runs start with exactly the starter card — every other card is won from a boss.
  const starterCard = PLAYER_CARDS.find((c) => c.id === STARTER_CARD_ID);
  const initialDeck = starterCard ? [starterCard] : [];

  return {
    stage: 1,
    maxStages: 44,
    chips: 0,
    rerolls: 0,
    deck: initialDeck,
    equippedCardIds: [STARTER_CARD_ID],
    maxEquipSlots: 1,
    unlockedCardIds: meta.unlockedCards,
    wins: 0,
    losses: 0,
    opponentsDefeated: [],
    runActive: true,
    lastEquippedCardId: null,
    capturedCardIds: [],
    consecutiveLosses: 0,
  };
}

export function getOpponentForStage(stage: number): OpponentCard {
  const index = Math.min(stage - 1, OPPONENT_BOSSES.length - 1);
  return OPPONENT_BOSSES[index];
}

// Cards flagged `exclusiveToBoss` are a fixed boss's signature move — never drafted or shopped by the player.
const DRAFTABLE_CARDS = PLAYER_CARDS.filter((c) => !c.exclusiveToBoss);

export function generateCardDraftChoices(run: RunState, count: number = 3): Card[] {
  const availablePool = DRAFTABLE_CARDS.filter((c) => run.unlockedCardIds.includes(c.id));

  // Shuffle available pool
  const shuffled = [...availablePool].sort(() => Math.random() - 0.5);

  // Ensure we get unique cards if available
  const choices: Card[] = [];
  for (const card of shuffled) {
    if (!choices.some((c) => c.id === card.id) && choices.length < count) {
      choices.push(card);
    }
  }

  // Fallback if pool is small
  while (choices.length < count && DRAFTABLE_CARDS.length > 0) {
    const randomCard = DRAFTABLE_CARDS[Math.floor(Math.random() * DRAFTABLE_CARDS.length)];
    if (!choices.some((c) => c.id === randomCard.id)) {
      choices.push(randomCard);
    } else if (choices.length >= DRAFTABLE_CARDS.length) {
      break;
    }
  }

  return choices;
}

