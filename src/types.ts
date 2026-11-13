/**
 * Shapes of the JSON files in /config. `npm run check` type-checks your JSON
 * against these, so a typo in a config file fails loudly instead of silently.
 *
 * Text fields that are titles support *emphasis*: words wrapped in asterisks
 * are rendered in the italic serif + gradient accent style.
 */

export interface Link {
  label: string;
  href: string;
  primary?: boolean;
}

/* ───────────────────────── site.json ───────────────────────── */

export interface SectionConfig {
  /** Anchor id, used for #links and the terminal `goto` command. */
  id: string;
  /** hero | about | ecosystem | marquee | projects | archive | languages | timeline | contact */
  type: string;
  /** Set to false to hide the section without deleting it. */
  enabled?: boolean;
  /** Label in the navigation bar. Omit to keep the section out of the nav. */
  nav?: string;
  /**
   * Visual variant:
   *  hero: "gravity" | "minimal"
   *  projects: "bento" | "grid"
   *  languages: "periodic" | "compact"
   *  timeline: "alternate" | "left"
   */
  variant?: string;
  /** Section specific options (see README). */
  props?: Record<string, unknown>;
}

export interface SiteConfig {
  meta: { title: string; description: string; url: string; themeColor: string; lang: string; favicon: string };
  github: { username: string; live: boolean; cacheMinutes: number };
  theme: { default: string; allowSwitch: boolean; remember: boolean };
  effects: {
    particles: boolean;
    particleDensity: number;
    cursorGlow: boolean;
    grain: boolean;
    tilt: boolean;
    reveal: boolean;
    viewTransitions: boolean;
  };
  nav: { show: boolean; logo: string; terminalButton: boolean };
  layout: { maxWidth: number; sections: SectionConfig[] };
  footer: { note: string; builtWith: string; hint: string };
}

/* ───────────────────────── themes.json ───────────────────────── */

export interface Theme {
  label: string;
  /** "dark" | "light" */
  scheme: string;
  bg: string;
  bg2: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accent2: string;
  accent3: string;
  /** "r,g,b" used by the floating particles */
  particle: string;
}

/* ───────────────────────── profile.json ───────────────────────── */

export interface Stat {
  label: string;
  value: number;
  /** Live GitHub value: "repo:<name>:stars" | "repo:<name>:forks" | "user:public_repos" | "user:followers" | "total:stars" */
  live?: string;
  suffix?: string;
  /** Show the number without thousands separators (e.g. a year). */
  plain?: boolean;
}

export interface Social {
  label: string;
  handle: string;
  href: string;
  /** github | whatsapp | vscode | mail | linkedin | x | link */
  icon: string;
  enabled?: boolean;
}

export interface Profile {
  name: string;
  firstName: string;
  lastName: string;
  handle: string;
  avatar: string;
  location: string;
  coords: string;
  status: string;
  headline: { prefix: string; rotating: string[] };
  intro: string;
  cta: {
    primary: { label: string; href: string };
    secondary: { label: string; action?: string; href?: string };
  };
  stats: Stat[];
  about: { eyebrow: string; title: string; statement: string; facts: { k: string; v: string }[] };
  contact: { eyebrow: string; title: string; text: string; primary: { label: string; href: string } };
  socials: Social[];
}

/* ───────────────────────── ecosystem.json ───────────────────────── */

export interface Satellite {
  name: string;
  glyph?: string;
  lang: string;
  description: string;
  href: string;
}

export interface ArchNode {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 1, 2 or 3: which theme accent colours the node */
  accent: number;
}

export interface Ecosystem {
  eyebrow: string;
  title: string;
  tagline: string;
  description: string;
  repo: string;
  icon: string;
  links: Link[];
  metrics: { value: string; label: string; live?: string; suffix?: string }[];
  agents: string[];
  features: { icon: string; title: string; text: string }[];
  screens: { src: string; caption: string }[];
  orbit: {
    title: string;
    text: string;
    center: { name: string; lang: string; description: string; href: string };
    rings: Satellite[][];
  };
  architecture: {
    title: string;
    text: string;
    nodes: ArchNode[];
    edges: { from: string; to: string; label: string }[];
  };
}

/* ───────────────────────── projects.json ───────────────────────── */

export interface Project {
  id: string;
  name: string;
  /** Repository name on GitHub (under github.username), used for links and live stars. */
  repo?: string;
  tagline: string;
  description: string;
  highlights?: string[];
  tech: string[];
  language: string;
  category: string;
  year: number;
  /** Bento tile size: "sm" | "wide" | "tall" | "lg" */
  size?: string;
  /** Generated cover art. pattern: contour | grid | tree | nodes | waves | rings | bars */
  cover?: { pattern?: string; glyph?: string; image?: string };
  links?: Link[];
}

export interface ArchiveItem {
  name: string;
  repo?: string;
  href?: string;
  description: string;
  language: string;
  year: number;
}

export interface Projects {
  eyebrow: string;
  title: string;
  subtitle: string;
  categories: { id: string; label: string }[];
  items: Project[];
  archive: { eyebrow: string; title: string; subtitle: string; initial: number; items: ArchiveItem[] };
}

/* ───────────────────────── skills.json ───────────────────────── */

export interface Element {
  symbol: string;
  name: string;
  group: string;
  mass: number;
  since: number;
  color: string;
  usedIn: string[];
  note: string;
}

export interface Skills {
  eyebrow: string;
  title: string;
  subtitle: string;
  groups: { id: string; label: string }[];
  elements: Element[];
  series: { label: string; items: string[] }[];
}

/* ───────────────────────── timeline.json ───────────────────────── */

export interface TimelineItem {
  date: string;
  title: string;
  text: string;
  tags?: string[];
  highlight?: boolean;
  href?: string;
}

export interface Timeline {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: TimelineItem[];
}

/* ───────────────────────── terminal.json ───────────────────────── */

export interface TerminalConfig {
  user: string;
  host: string;
  welcome: string[];
  commands: { name: string; description: string; output: string[]; href?: string; hidden?: boolean }[];
}
