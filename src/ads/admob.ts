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

// Real ad unit IDs, one pair per platform — AdMob issues separate IDs per platform even under
// the same publisher (ca-app-pub-7842996095218621). App IDs themselves live in the native
// projects, not here: ios/App/App/Info.plist (GADApplicationIdentifier) and
// android/app/src/main/AndroidManifest.xml (com.google.android.gms.ads.APPLICATION_ID).
const REAL_BANNER_AD_UNIT_ID_IOS = 'ca-app-pub-7842996095218621/2248318955';
const REAL_INTERSTITIAL_AD_UNIT_ID_IOS = 'ca-app-pub-7842996095218621/5995992276';
const REAL_BANNER_AD_UNIT_ID_ANDROID = 'ca-app-pub-7842996095218621/1923477759';
const REAL_INTERSTITIAL_AD_UNIT_ID_ANDROID = 'ca-app-pub-7842996095218621/1400733577';

function isNativeIOS(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function isNativeMobile(): boolean {
  return isNativeIOS() || isNativeAndroid();
}

function bannerAdUnitId(): string {
  if (ADS_TESTING_MODE) return TEST_BANNER_AD_UNIT_ID;
  return isNativeAndroid() ? REAL_BANNER_AD_UNIT_ID_ANDROID : REAL_BANNER_AD_UNIT_ID_IOS;
}

function interstitialAdUnitId(): string {
  if (ADS_TESTING_MODE) return TEST_INTERSTITIAL_AD_UNIT_ID;
  return isNativeAndroid() ? REAL_INTERSTITIAL_AD_UNIT_ID_ANDROID : REAL_INTERSTITIAL_AD_UNIT_ID_IOS;
}

// Ads are non-critical — unlike the IAP paywall, nothing here should ever block gameplay
// navigation. Every exported function swallows its own errors instead of throwing.

let configured = false;
export async function initAds(): Promise<void> {
  if (!isNativeMobile() || configured) return;
  configured = true;
  try {
    // Apple requires ATT authorization before an ad SDK may use IDFA — Android has no equivalent.
    if (isNativeIOS()) {
      await AdMob.requestTrackingAuthorization();
    }
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
  if (!isNativeMobile()) return;
  try {
    await AdMob.prepareInterstitial({ adId: interstitialAdUnitId(), isTesting: ADS_TESTING_MODE });
  } catch {
    // No fill / network error — showInterstitial() below just no-ops next time it's called.
  }
}

export async function showInterstitial(): Promise<void> {
  if (!isNativeMobile()) return;
  try {
    await AdMob.showInterstitial();
  } catch {
    // Not loaded yet, no fill, or a native error — never block gameplay navigation on an ad.
  }
}

export async function showBanner(): Promise<void> {
  if (!isNativeMobile()) return;
  try {
    await AdMob.showBanner({
      adId: bannerAdUnitId(),
      isTesting: ADS_TESTING_MODE,
      position: BannerAdPosition.BOTTOM_CENTER,
    });
  } catch {
    // Non-critical.
  }
}

export async function hideBanner(): Promise<void> {
  if (!isNativeMobile()) return;
  try {
    await AdMob.removeBanner();
  } catch {
    // Non-critical.
  }
}
