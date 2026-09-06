/**
 * Dealopoly Haptics Wrapper
 *
 * Thin wrapper around the `web-haptics` library that:
 *  - Maps our existing haptic types to the library's richer presets
 *  - Handles the iOS 18+ Taptic Engine detection gap (library's `isSupported`
 *    only checks `navigator.vibrate`, which iOS Safari does not expose)
 *  - Respects the user's `hapticFeedback` setting
 *  - Exposes `triggerHaptic()`, `cancelHaptic()`, and `isHapticsSupported()`
 */

import { WebHaptics, type HapticInput } from "web-haptics";
import { getStoredSettings } from "./settings";

// ── Singleton instance ────────────────────────────────────────────────────────

let _haptics: WebHaptics | null = null;

function getHaptics(): WebHaptics | null {
  if (typeof window === "undefined") return null;
  if (!_haptics) {
    _haptics = new WebHaptics();
  }
  return _haptics;
}

// ── iOS 18+ Taptic Engine detection ───────────────────────────────────────────
// The `web-haptics` library's `static isSupported` only checks for
// `navigator.vibrate`. iOS Safari does not expose that API, but iOS 18+
// supports the hidden `<input type="checkbox" switch>` Taptic Engine trick.
// We detect support by attempting to create the switch element.

let _iosSwitchSupported: boolean | null = null;

function detectIOSSwitchSupport(): boolean {
  if (typeof document === "undefined") return false;
  if (_iosSwitchSupported !== null) return _iosSwitchSupported;

  try {
    const el = document.createElement("input");
    el.setAttribute("type", "checkbox");
    el.setAttribute("switch", "");
    // If the attribute survives assignment, the browser supports it
    _iosSwitchSupported = el.getAttribute("switch") !== null;
  } catch {
    _iosSwitchSupported = false;
  }
  return _iosSwitchSupported;
}

// ── Public API ────────────────────────────────────────────────────────────────

export type HapticType = "light" | "medium" | "heavy" | "success" | "warning";

/**
 * Map our existing haptic types to the library's built-in presets.
 */
const TYPE_TO_PRESET: Record<HapticType, HapticInput> = {
  light: "light",
  medium: "medium",
  heavy: "heavy",
  success: "success",
  warning: "warning",
};

/**
 * Whether haptic feedback is available on this device/browser.
 * Checks both the library's `navigator.vibrate` support and the iOS switch trick.
 */
export function isHapticsSupported(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return WebHaptics.isSupported || detectIOSSwitchSupport();
}

/**
 * Trigger haptic feedback.
 *
 * @param type - One of our existing haptic types (light/medium/heavy/success/warning)
 * @param intensity - Optional intensity override (0–1, default 0.5)
 */
export function triggerHaptic(
  type: HapticType = "light",
  intensity?: number
): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;

  const settings = getStoredSettings();
  if (settings.hapticFeedback === false) return;

  const haptics = getHaptics();
  if (!haptics) return;

  try {
    const preset = TYPE_TO_PRESET[type] ?? "light";
    void haptics.trigger(preset, intensity !== undefined ? { intensity } : undefined);
  } catch {
    // Ignore unsupported environments
  }
}

/**
 * Cancel any ongoing haptic pattern.
 */
export function cancelHaptic(): void {
  if (typeof window === "undefined") return;
  try {
    getHaptics()?.cancel();
  } catch {
    // Ignore unsupported environments
  }
}