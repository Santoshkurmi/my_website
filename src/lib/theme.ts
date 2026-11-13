import { createSignal } from 'solid-js';
import { site, themes, prefersReducedMotion } from '../config';
import type { Theme } from '../types';

const KEY = 'portfolio:theme';
const names = Object.keys(themes);

function initialTheme(): string {
  if (site.theme.allowSwitch && site.theme.remember) {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && themes[saved]) return saved;
    } catch {}
  }
  return themes[site.theme.default] ? site.theme.default : names[0];
}

export const [themeName, setThemeName] = createSignal(initialTheme());
export const themeNames = () => names;
export const currentTheme = (): Theme => themes[themeName()];

/** Parsed rgb triplets of the current accents, read by the canvas renderers every frame. */
export const palette = { a1: [167, 139, 250], a2: [34, 211, 238], a3: [244, 114, 182], text: [238, 235, 255], particle: '210,200,255', light: false };

export function hexToRgb(hex: string): number[] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [200, 200, 200];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function applyTheme(name: string) {
  const t = themes[name] ?? themes[names[0]];
  const root = document.documentElement;
  const vars: Record<string, string> = {
    '--bg': t.bg,
    '--bg-2': t.bg2,
    '--surface': t.surface,
    '--surface-2': t.surface2,
    '--border': t.border,
    '--text': t.text,
    '--muted': t.muted,
    '--faint': t.faint,
    '--accent': t.accent,
    '--accent-2': t.accent2,
    '--accent-3': t.accent3,
    '--particle': t.particle,
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.style.colorScheme = t.scheme;
  root.dataset.scheme = t.scheme;
  palette.a1 = hexToRgb(t.accent);
  palette.a2 = hexToRgb(t.accent2);
  palette.a3 = hexToRgb(t.accent3);
  palette.text = hexToRgb(t.text);
  palette.particle = t.particle;
  palette.light = t.scheme === 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
  setThemeName(name);
  if (site.theme.remember) {
    try { localStorage.setItem(KEY, name); } catch {}
  }
}

/** Switch theme with a circular reveal that grows from the click point (View Transitions API). */
export function switchTheme(name: string, x = innerWidth / 2, y = 0) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!site.effects.viewTransitions || !doc.startViewTransition || prefersReducedMotion()) {
    applyTheme(name);
    return;
  }
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = doc.startViewTransition(() => applyTheme(name));
  t.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 750, easing: 'cubic-bezier(.65,0,.25,1)', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {});
}

export function nextTheme() {
  const i = names.indexOf(themeName());
  return names[(i + 1) % names.length];
}
