/**
 * Single entry point for all JSON configuration in /config.
 * The explicit type annotations make `npm run check` validate every file.
 */
import siteJson from '../config/site.json';
import themesJson from '../config/themes.json';
import profileJson from '../config/profile.json';
import ecosystemJson from '../config/ecosystem.json';
import projectsJson from '../config/projects.json';
import skillsJson from '../config/skills.json';
import timelineJson from '../config/timeline.json';
import terminalJson from '../config/terminal.json';
import type {
  SiteConfig,
  Theme,
  Profile,
  Ecosystem,
  Projects,
  Skills,
  Timeline,
  TerminalConfig,
  SectionConfig,
} from './types';

export const site: SiteConfig = siteJson;
export const themes: Record<string, Theme> = themesJson;
export const profile: Profile = profileJson;
export const ecosystem: Ecosystem = ecosystemJson;
export const projects: Projects = projectsJson;
export const skills: Skills = skillsJson;
export const timeline: Timeline = timelineJson;
export const terminal: TerminalConfig = terminalJson;

/** Sections that are switched on, in the order they appear in site.json. */
export const sections: SectionConfig[] = site.layout.sections.filter((s) => s.enabled !== false);

export const ghUrl = (repo?: string) =>
  repo ? `https://github.com/${site.github.username}/${repo}` : `https://github.com/${site.github.username}`;

/** Language → colour, taken from skills.json so there is one source of truth. */
const langColor: Record<string, string> = {};
for (const e of skills.elements) {
  for (const n of e.name.split('/')) langColor[n.trim().toLowerCase()] = e.color;
}
const fallbackColors: Record<string, string> = { css: '#663399', 'c#': '#178600', swift: '#F05138' };
export const colorFor = (lang: string) =>
  langColor[lang.toLowerCase()] ?? fallbackColors[lang.toLowerCase()] ?? 'var(--muted)';

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
