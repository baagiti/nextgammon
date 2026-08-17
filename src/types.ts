export type PlayerId = 'player' | 'cpu';

export interface Checker {
  id: string;
  color: PlayerId; // 'player' = white/cyan, 'cpu' = black/magenta
}

export type PointState = Checker[];

export interface BoardState {
  points: PointState[]; // 0 to 23 (24 points total)
  bar: {
    player: number; // count of player checkers on bar
    cpu: number;    // count of cpu checkers on bar
  };
  off: {
    player: number; // count of player checkers borne off
    cpu: number;    // count of cpu checkers borne off
  };
}

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CardType = 'dice' | 'movement' | 'hit' | 'bar' | 'economy' | 'active';
export type CardCategory = 'self' | 'sabotage';

export type CardTrigger =
  | 'ON_DICE_ROLL'
  | 'ON_HIT_OPPONENT'
  | 'ON_BEAR_OFF'
  | 'ON_RE_ENTER_BAR'
  | 'PASSIVE'
  | 'ACTIVE_ABILITY';

export interface Card {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category?: CardCategory;
  rarity: CardRarity;
  type: CardType;
  cost?: number; // shop price
  trigger: CardTrigger;
  iconName: string;
  usesRemaining?: number; // for active or limited cards
  maxUses?: number;
  effectKey: string;
  effectValue?: number;
  unlockedByDefault?: boolean;
  exclusiveToBoss?: string; // boss id — never appears in player drafts or shared match pools
}

export interface OpponentBoss {
  id: string;
  bossName: string;
  bossTitle: string;
  avatarSeed: string;
  accentColor: string;
  quote: string;
  difficulty: number;
  signatureCardId: string; // fixed CPU card this boss always brings into a run fight
}

export type OpponentCard = OpponentBoss;

export interface BossProtocol {
  id: string;
  name: string;
  description: string; // plain mechanical rule, shown in the intro overlay and status badge
  taunt: string; // in-character line where the boss names its own protocol
  iconName: string;
}

export interface CampaignStage {
  stage: number; // 1-44
  act: number; // 1-7
  kind: 'card' | 'protocol';
  bossName: string;
  bossTitle: string;
  quote: string;
  accentColor: string;
  avatarSeed: string;
  rewardCardId: string; // the card won by clearing this stage
  cardId?: string; // card bosses only — the CPU's equipped card during the fight (always === rewardCardId)
  protocolId?: string; // protocol bosses only — references BossProtocol.id
}

export interface Move {
  from: number | 'bar';
  to: number | 'off';
  dieUsed: number;
  isHit?: boolean;
}

export interface MovePath {
  moves: Move[];
  remainingDice: number[];
  finalBoard: BoardState;
}

export interface GameSettings {
  soundEnabled: boolean;
  sfxVolume: number;
  crtEffect: boolean;
  viewMode: 'desktop' | 'ios' | 'fullscreen';
  diceSkin: 'neon_cyan' | 'vapor_pink' | 'matrix_green' | 'gold_cyber';
  boardDirection: 'counter_clockwise' | 'clockwise';
  boardTheme: 'neon' | 'kiraathane';
}

export interface MetaUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  icon: string;
  category: 'starter' | 'perks' | 'rule_hacks' | 'cosmetics';
}

export interface RunState {
  stage: number;
  maxStages: number;
  chips: number;
  rerolls: number;
  deck: Card[];
  equippedCardIds: string[];
  maxEquipSlots: number;
  unlockedCardIds: string[];
  wins: number;
  losses: number;
  opponentsDefeated: string[];
  runActive: boolean;
  lastEquippedCardId: string | null; // can't equip the same card two stages in a row
  capturedCardIds: string[]; // cards the current boss has captured on mars losses (max 2), returned on stage clear
  consecutiveLosses: number; // resets on any win; drives the capture cap
}

export interface MetaData {
  neonChips: number; // Permanent currency shared between 1v1 and run mode — earned by hitting checkers and winning matches
  unlockedUpgrades: Record<string, number>; // upgradeId -> level
  totalGamesPlayed: number; // runs started (legacy name — kept for the existing Cyber Lab footer stat)
  totalWins: number; // run-mode stage wins
  highestStage: number;
  unlockedCards: string[];
  selectedDiceSkin: string;

  // Lifetime stats — feed the achievement system in game/achievements.ts. Never decrease, even
  // when the thing they're derived from (e.g. neonChips) can be spent down.
  totalMatchesPlayed: number;
  totalMatchesWon: number;
  totalHits: number;
  totalGammonWins: number;
  totalQuickMatchWins: number;
  totalRunsCompleted: number;
  totalProtocolsCleared: number;
  totalLifetimeChips: number;
  maxConsecutiveLossesEver: number;
  totalComebackWins: number; // won a run-mode match despite already having a captured card
  totalFlawlessRunCompletions: number; // completed all 44 stages of a run with zero losses along the way
  cardsPlayedQuickMatch: string[]; // distinct card ids equipped in 1v1 quick matches
  unlockedAchievements: string[];
}
