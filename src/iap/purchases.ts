import { Capacitor } from '@capacitor/core';
import { Purchases, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';

// RevenueCat public SDK key (safe to embed client-side — this is NOT a secret key).
// Get this from the RevenueCat dashboard: Project Settings -> API Keys -> Apple App Store.
// See README-IAP.md at the project root for the full one-time setup checklist.
const REVENUECAT_IOS_API_KEY = 'appl_pyRmFpNMkzWBggEBVSXUKvlIGhD';

// The RevenueCat Entitlement identifier that gates Run Mode. Must match the entitlement
// identifier created in the RevenueCat dashboard and attached to the $3 non-consumable product.
export const RUN_MODE_ENTITLEMENT_ID = 'run_mode';

// Package identifiers as configured on the "default" Offering in the RevenueCat dashboard — two
// packages live side by side there, one per product. These are RevenueCat *package* identifiers
// (set when you create the package in the dashboard), not App Store product IDs.
const RUN_MODE_PACKAGE_ID = 'run_mode';
const CHIPS_100K_PACKAGE_ID = 'chips_100k';

// How many Neon Chips the $1 consumable grants. Purely a client-side reward amount — RevenueCat/
// StoreKit only know about the $1 transaction, granting the chips is this app's job, done after
// a successful purchase (see purchaseChips100k below).
export const CHIPS_100K_AMOUNT = 100000;

let configured = false;

// RevenueCat/StoreKit only exists on a real native iOS build. In the Vite dev server / browser
// preview there's no StoreKit to talk to, so every function below short-circuits to "unlocked"
// on web rather than failing — Run Mode content stays fully testable without a device.
function isNativeIOS(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export async function initPurchases(): Promise<void> {
  if (!isNativeIOS() || configured) return;
  await Purchases.configure({ apiKey: REVENUECAT_IOS_API_KEY });
  configured = true;
}

export async function hasRunModeEntitlement(): Promise<boolean> {
  if (!isNativeIOS()) return true; // unlocked in browser/dev preview
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[RUN_MODE_ENTITLEMENT_ID] !== 'undefined';
  } catch {
    // If RevenueCat isn't configured yet (e.g. key still a placeholder) or the check fails,
    // fail CLOSED (locked) on a real device — never silently give away the paid feature.
    return false;
  }
}

export interface PurchaseOutcome {
  success: boolean;
  cancelled?: boolean;
  error?: string;
}

async function findPackage(packageId: string) {
  const { current } = await Purchases.getOfferings();
  return current?.availablePackages.find((p) => p.identifier === packageId);
}

export async function purchaseRunMode(): Promise<PurchaseOutcome> {
  if (!isNativeIOS()) return { success: true }; // no store on web — treat as unlocked for dev
  try {
    const runModePackage = await findPackage(RUN_MODE_PACKAGE_ID);
    if (!runModePackage) {
      return { success: false, error: 'no_offering_configured' };
    }
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: runModePackage });
    return { success: typeof customerInfo.entitlements.active[RUN_MODE_ENTITLEMENT_ID] !== 'undefined' };
  } catch (err: any) {
    if (err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, cancelled: true };
    }
    return { success: false, error: err?.message || 'purchase_failed' };
  }
}

export async function restoreRunModePurchase(): Promise<PurchaseOutcome> {
  if (!isNativeIOS()) return { success: true };
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const unlocked = typeof customerInfo.entitlements.active[RUN_MODE_ENTITLEMENT_ID] !== 'undefined';
    return { success: unlocked, error: unlocked ? undefined : 'nothing_to_restore' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'restore_failed' };
  }
}

// Consumable — no entitlement, no restore (Apple guidelines: consumables aren't restorable,
// they're re-purchasable). A successful purchasePackage() resolution here means StoreKit already
// completed and finished the transaction (RevenueCat's default `purchasesAreCompletedBy` mode) —
// the caller grants CHIPS_100K_AMOUNT to meta.neonChips immediately on success, once, right here.
export async function purchaseChips100k(): Promise<PurchaseOutcome> {
  if (!isNativeIOS()) return { success: true }; // no store on web — grant instantly for dev testing
  try {
    const chipsPackage = await findPackage(CHIPS_100K_PACKAGE_ID);
    if (!chipsPackage) {
      return { success: false, error: 'no_offering_configured' };
    }
    await Purchases.purchasePackage({ aPackage: chipsPackage });
    return { success: true };
  } catch (err: any) {
    if (err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, cancelled: true };
    }
    return { success: false, error: err?.message || 'purchase_failed' };
  }
}
