import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, InterstitialAdPluginEvents } from '@capacitor-community/admob';

// Test mode swaps in Google's official test ad unit IDs, so no real impression is ever served
// from a development build (AdMob policy — real ads during testing risk an invalid-traffic flag
// on the account).
//
// Now FALSE because this build is the App Store submission: a released app running in test mode
// would show every real player a "Test Ad" placeholder and earn nothing. App Review generating a
// handful of genuine impressions while testing is normal and expected for any ad-supported app.
//
// Set this back to true for local/TestFlight experimentation on ad placement.
const ADS_TESTING_MODE = false;

// Google's official, permanent test ad unit IDs (iOS) — always return test creatives.
const TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/2934735716';
const TEST_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3940256099942544/4411468910';

// Real ad unit IDs — NEXTGAMMON (iOS) app in AdMob, App ID ca-app-pub-7842996095218621~9356547586
// (that App ID itself lives in ios/App/App/Info.plist as GADApplicationIdentifier, not here).
const REAL_BANNER_AD_UNIT_ID = 'ca-app-pub-7842996095218621/2248318955';
const REAL_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-7842996095218621/5995992276';

const BANNER_AD_UNIT_ID = ADS_TESTING_MODE ? TEST_BANNER_AD_UNIT_ID : REAL_BANNER_AD_UNIT_ID;
const INTERSTITIAL_AD_UNIT_ID = ADS_TESTING_MODE ? TEST_INTERSTITIAL_AD_UNIT_ID : REAL_INTERSTITIAL_AD_UNIT_ID;

function isNativeIOS(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

// Ads are non-critical — unlike the IAP paywall, nothing here should ever block gameplay
// navigation. Every exported function swallows its own errors instead of throwing.

let configured = false;
export async function initAds(): Promise<void> {
  if (!isNativeIOS() || configured) return;
  configured = true;
  try {
    // Apple requires ATT authorization before an ad SDK may use IDFA.
    await AdMob.requestTrackingAuthorization();
    await AdMob.initialize({ initializeForTesting: ADS_TESTING_MODE });
    // Keep an interstitial ready in the background for whenever the next match ends.
    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      preloadInterstitial();
    });
    await preloadInterstitial();
  } catch {
    // Non-critical — the rest of the app must not be affected by an ad-init failure.
  }
}

export async function preloadInterstitial(): Promise<void> {
  if (!isNativeIOS()) return;
  try {
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_UNIT_ID, isTesting: ADS_TESTING_MODE });
  } catch {
    // No fill / network error — showInterstitial() below just no-ops next time it's called.
  }
}

export async function showInterstitial(): Promise<void> {
  if (!isNativeIOS()) return;
  try {
    await AdMob.showInterstitial();
  } catch {
    // Not loaded yet, no fill, or a native error — never block gameplay navigation on an ad.
  }
}

export async function showBanner(): Promise<void> {
  if (!isNativeIOS()) return;
  try {
    await AdMob.showBanner({
      adId: BANNER_AD_UNIT_ID,
      isTesting: ADS_TESTING_MODE,
      position: BannerAdPosition.BOTTOM_CENTER,
    });
  } catch {
    // Non-critical.
  }
}

export async function hideBanner(): Promise<void> {
  if (!isNativeIOS()) return;
  try {
    await AdMob.removeBanner();
  } catch {
    // Non-critical.
  }
}
