export const MOD_KEYS = new Set(["meta", "control", "alt", "shift"]);

export function formatShortcut(combo: string): string {
  const isMac =
    typeof navigator !== "undefined" &&
    /mac|iphone|ipad/i.test(navigator.platform ?? "");
  const hasMod = combo.startsWith("mod+");
  const key = combo.replace(/^mod\+/, "").replace(/^./, (c) => c.toUpperCase());
  if (!hasMod) return key;
  return `${isMac ? "⌘" : "Ctrl+"}${key}`;
}

export function matchesShortcut(
  e: KeyboardEvent | React.KeyboardEvent,
  combo: string
): boolean {
  const hasMod = combo.startsWith("mod+");
  const key = combo.replace(/^mod\+/, "").toLowerCase();
  if (e.key.toLowerCase() !== key) return false;
  const mod = e.metaKey || e.ctrlKey;
  if (hasMod) return mod;
  return !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
}