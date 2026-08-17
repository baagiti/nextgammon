import { RunState, MetaData, Card, OpponentCard, MetaUpgrade } from '../types';
import { PLAYER_CARDS, OPPONENT_BOSSES, INITIAL_META_UPGRADES } from './cardsData';
import { STARTER_CARD_ID } from './campaignData';

const META_STORAGE_KEY = 'NEXTGAMMON_META_PROGRESSION_V1';

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
      return { ...defaultMetaData(), ...parsed };
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

export function purchaseMetaUpgrade(meta: MetaData, upgradeId: string): MetaData {
  const upgrade = INITIAL_META_UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return meta;

  const currentLevel = meta.unlockedUpgrades[upgradeId] || 0;
  if (currentLevel >= upgrade.maxLevel) return meta;

  const cost = upgrade.cost * (currentLevel + 1);
  if (meta.neonChips < cost) return meta;

  const newMeta: MetaData = {
    ...meta,
    neonChips: meta.neonChips - cost,
    unlockedUpgrades: {
      ...meta.unlockedUpgrades,
      [upgradeId]: currentLevel + 1,
    },
  };

  // If unlocking cards or skin upgrades:
  if (upgradeId === 'meta_dice_vapor' && !newMeta.selectedDiceSkin) {
    newMeta.selectedDiceSkin = 'vapor_pink';
  } else if (upgradeId === 'meta_dice_matrix') {
    newMeta.selectedDiceSkin = 'matrix_green';
  }

  saveMetaData(newMeta);
  return newMeta;
}
