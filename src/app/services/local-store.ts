import { signal } from "@angular/core";
import { Preferences } from "@capacitor/preferences";

export const storageError = signal("");

const PREFIX = "lockin.";
const SAVE_ERROR =
  "Storage is unavailable or full. Your latest changes may not be saved.";

// In-memory copy of everything saved on the device. Reads come from here
// (synchronous); writes update it and are then saved to the phone.
const cache = new Map<string, string>();

/**
 * Loads everything saved on the device into memory.
 * Must finish before the app starts (see APP_INITIALIZER in main.ts).
 */
export async function initStore(): Promise<void> {
  try {
    const { keys } = await Preferences.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(PREFIX))
        .map(async (key) => {
          const { value } = await Preferences.get({ key });
          if (value !== null) cache.set(key, value);
        }),
    );
  } catch {
    storageError.set("Could not load your saved data from this device.");
  }
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = cache.get(key);
    return raw !== undefined ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown): void {
  try {
    const raw = JSON.stringify(value);
    cache.set(key, raw);
    Preferences.set({ key, value: raw })
      .then(() => storageError.set(""))
      .catch(() => storageError.set(SAVE_ERROR));
  } catch {
    storageError.set(SAVE_ERROR);
  }
}

export function localDate(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
export function timeMinutes(value: string): number {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;
  let hour = Number(match[1]);
  if (match[3]) hour = (hour % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return hour * 60 + Number(match[2]);
}

export const validEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
