# In-app purchases — setup status

The code is done, two products:
- **Run Mode** ($3, one-time unlock, non-consumable) — 1v1 Quick Match stays free forever.
- **100,000 Neon Chips** ($1, consumable, buyable repeatedly) — lives in the Cyber Lab screen.

## Status: fully configured on both App Store Connect and RevenueCat

### 1. App Store Connect — products ✅ done
Both products created under `com.burakakkaya.nextgammon`, each with pricing, all 6 localizations, and a Review Screenshot (iPad-resolution shots of the actual paywall/purchase UI):
- **Run Mode** — `com.burakakkaya.nextgammon.runmode`, Non-Consumable, $2.99 base tier, 175 countries/regions (auto-converted pricing).
- **100,000 Neon Chips** — `com.burakakkaya.nextgammon.chips100k`, Consumable, $0.99 base tier, 175 countries/regions.

Both are sitting in **"Prepare for Submission"** — not yet clicked "Add for Review". Apple requires the first non-consumable IAP (Run Mode) to be submitted together with an app version, so actually submitting these is part of the app-store-listing work (icon, screenshots, description) that's still pending separately.

### 2. RevenueCat account/project ✅ done
- Project **NEXTGAMMON** created (project ID `3be36c80`).
- iOS app added, bundle ID `com.burakakkaya.nextgammon`.
- **In-App Purchase key** (for pricing/transaction data) — generated in App Store Connect → Users and Access → Integrations → In-App Purchase, uploaded to RevenueCat. Shows "Valid credentials".
- **App Store Connect API key** (for product auto-import) — generated separately (a *different* key type than the one above — same-looking name, different Apple endpoint) in Users and Access → Integrations → App Store Connect API, uploaded to RevenueCat. Shows "Valid credentials".

### 3. Products, Entitlement, Offering ✅ done
- Both products imported into RevenueCat directly from App Store Connect (via the API key above).
- Entitlement **`run_mode`** created, attached **only** to the Run Mode product (matches `RUN_MODE_ENTITLEMENT_ID` in `src/iap/purchases.ts`).
- Offering **`default`** created and confirmed as the current/default offering, with two packages:
  - **`run_mode`** → Run Mode product (matches `RUN_MODE_PACKAGE_ID`).
  - **`chips_100k`** → 100,000 Neon Chips product (matches `CHIPS_100K_PACKAGE_ID`).

### 4. App's RevenueCat key ✅ done
`src/iap/purchases.ts` → `REVENUECAT_IOS_API_KEY` is set to the real public iOS key (`appl_...`) from RevenueCat → API keys → SDK API keys → NEXTGAMMON (App Store). Safe to commit — it's a public client key, not a secret.

## 5. Test before shipping — not yet done
- TestFlight builds automatically use Apple's **sandbox** purchase environment — no real charge happens, but the full purchase/restore flow runs for real.
- Use a **Sandbox Tester** account (App Store Connect → Users and Access → Sandbox Testers) signed into the test device, separate from your real Apple ID.
- Run Mode: tapping "Start Run" shows the paywall → "Unlock for $3" completes a sandbox purchase → Run Mode opens immediately → force-quit and reopen the app → Run Mode is still unlocked (entitlement persisted) → "Restore Purchase" also works on a fresh install signed into the same sandbox account.
- Chips: open the Cyber Lab → "Buy — $1" completes a sandbox purchase → Neon Chips balance jumps by 100,000 immediately → buy it again to confirm it's genuinely repeatable (no "already owned" error, since it's a consumable).

## What's already handled in code
- `src/iap/purchases.ts` — all RevenueCat calls, fails closed (locked) if anything's misconfigured.
- `src/components/PaywallModal.tsx` — the Run Mode unlock screen, localized in all 6 languages.
- The chip-purchase card inside `src/components/MetaLabModal.tsx` (the Cyber Lab), same localization coverage.
- 1v1 Quick Match has zero gating — untouched, free forever.
- In the browser dev preview (`npm run dev`), neither purchase talks to a real store — there's no StoreKit on web, so Run Mode stays open and buying chips grants them instantly, for local development/testing regardless of real purchase state.
