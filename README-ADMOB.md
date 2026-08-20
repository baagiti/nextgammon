# AdMob — setup status

Two ad placements, both iOS-only (matches the rest of this project — no `android/` platform exists):
- **Banner** — bottom of the Main Menu screen only, for players who haven't bought Run Mode.
- **Interstitial** — after every **1v1 Quick Match** ends, same audience. Run/campaign matches never
  show an ad, because reaching one at all already required buying Run Mode (see `handleRunModeEntry`
  in `src/App.tsx`) — there's no unpaid player to show an ad to there.

Buying Run Mode removes both immediately (same `runModeUnlocked` state the paywall already tracks —
no separate "remove ads" purchase). The paywall copy (`paywall.description` in all 6 locales) was
updated to say so.

## Status: fully configured, test mode

### AdMob console ✅ done
- App created: **NEXTGAMMON** (iOS), App ID `ca-app-pub-7842996095218621~9356547586`.
- **Banner** ad unit: `ca-app-pub-7842996095218621/2248318955`.
- **Interstitial** ad unit: `ca-app-pub-7842996095218621/5995992276`.

### Code ✅ done
- `src/ads/admob.ts` — all AdMob calls, mirrors the structure of `src/iap/purchases.ts` but **fails
  open**: an ad load/show failure is swallowed, never blocks navigation.
- `ios/App/App/Info.plist` — `GADApplicationIdentifier` (the App ID above, required unconditionally)
  and `NSUserTrackingUsageDescription` (the ATT permission prompt text).
- `src/App.tsx` — `initAds()` on mount, banner shown/hidden on entering/leaving the Main Menu,
  interstitial preloaded when a match ends and shown (1v1 only) when the player taps Continue.

## `ADS_TESTING_MODE` — the go-live switch

`src/ads/admob.ts` has one constant at the top: `const ADS_TESTING_MODE = true;`

While `true`, every ad request uses Google's official test ad unit IDs instead of the real ones
above — so right now, **nothing serves real ads or generates real impressions**, even though the
real app/ad units already exist in the console. This is required by AdMob policy (real ad unit IDs
must never be exercised during development/testing, or the account risks an invalid-traffic flag).

**Flip it to `false` only once the app is actually live on the App Store.** Nothing else needs to
change — the real IDs are already wired in, just currently unused.

## What's NOT done yet

- **`SKAdNetworkItems`** — Apple's ad-network attribution allow-list, a large boilerplate list Google
  publishes. Not required for ads to show or to pass App Review; only matters for ad-network
  attribution/mediation at real scale. Add later if/when that's needed:
  https://developers.google.com/admob/ios/ios14#update_your_infoplist
- **App Tracking Transparency testing** — the ATT prompt (`NSUserTrackingUsageDescription`) only
  needs to be verified once on a real device: first native launch should show the system permission
  dialog with the text above. If a player denies it, ads should still show (just non-personalized) —
  `AdMob.initialize()` handles this automatically, no extra code needed.
- **Real-device / TestFlight verification** — hasn't been tested on an actual build yet. Check:
  - Main Menu shows a bottom banner (a Google test creative, since `ADS_TESTING_MODE` is `true`) for
    a non-Run-Mode account.
  - Playing a 1v1 Quick Match and tapping Continue shows a test interstitial before the next match
    starts.
  - Purchasing Run Mode (sandbox) makes both disappear immediately, no app restart needed.
  - A run/campaign match never shows either.
