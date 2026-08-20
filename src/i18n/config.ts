import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCards from '../locales/en/cards.json';
import enAchievements from '../locales/en/achievements.json';
import enBosses from '../locales/en/bosses.json';
import enUi from '../locales/en/ui.json';

import trCards from '../locales/tr/cards.json';
import trAchievements from '../locales/tr/achievements.json';
import trBosses from '../locales/tr/bosses.json';
import trUi from '../locales/tr/ui.json';

import deCards from '../locales/de/cards.json';
import deAchievements from '../locales/de/achievements.json';
import deBosses from '../locales/de/bosses.json';
import deUi from '../locales/de/ui.json';

import arCards from '../locales/ar/cards.json';
import arAchievements from '../locales/ar/achievements.json';
import arBosses from '../locales/ar/bosses.json';
import arUi from '../locales/ar/ui.json';

import ruCards from '../locales/ru/cards.json';
import ruAchievements from '../locales/ru/achievements.json';
import ruBosses from '../locales/ru/bosses.json';
import ruUi from '../locales/ru/ui.json';

import esCards from '../locales/es/cards.json';
import esAchievements from '../locales/es/achievements.json';
import esBosses from '../locales/es/bosses.json';
import esUi from '../locales/es/ui.json';

// Every language NEXTGAMMON supports, in the order they appear in the settings switcher.
// A language listed here with no locale files yet just falls through to English via the
// `defaultValue` fallback baked into every useXText() hook — see src/hooks/useLocalizedText.ts.
export const SUPPORTED_LANGUAGES = ['en', 'tr', 'de', 'ar', 'ru', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Languages that read right-to-left — used to flip document direction on language change.
export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { cards: enCards, achievements: enAchievements, bosses: enBosses, ui: enUi },
      tr: { cards: trCards, achievements: trAchievements, bosses: trBosses, ui: trUi },
      de: { cards: deCards, achievements: deAchievements, bosses: deBosses, ui: deUi },
      ar: { cards: arCards, achievements: arAchievements, bosses: arBosses, ui: arUi },
      ru: { cards: ruCards, achievements: ruAchievements, bosses: ruBosses, ui: ruUi },
      es: { cards: esCards, achievements: esAchievements, bosses: esBosses, ui: esUi },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    ns: ['cards', 'achievements', 'bosses', 'ui'],
    defaultNS: 'ui',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

export default i18n;
