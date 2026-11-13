import { createSignal } from 'solid-js';
import { site } from '../config';

interface RepoStat { stars: number; forks: number; fork: boolean }
interface GhData { user: Record<string, number> | null; repos: Record<string, RepoStat> }

export const [gh, setGh] = createSignal<GhData>({ user: null, repos: {} });

const KEY = `portfolio:gh:${site.github.username}`;

/** Fetch live GitHub numbers once per session (2 requests, well under the anonymous rate limit). */
export async function loadGitHub() {
  if (!site.github.live) return;
  try {
    const cached = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (cached && Date.now() - cached.at < site.github.cacheMinutes * 60_000) {
      setGh(cached.data);
      return;
    }
  } catch {}
  try {
    const u = site.github.username;
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${u}`),
      fetch(`https://api.github.com/users/${u}/repos?per_page=100`),
    ]);
    if (!userRes.ok || !reposRes.ok) return;
    const user = await userRes.json();
    const list = await reposRes.json();
    const repos: Record<string, RepoStat> = {};
    for (const r of list) repos[r.name.toLowerCase()] = { stars: r.stargazers_count, forks: r.forks_count, fork: r.fork };
    const data: GhData = {
      user: { public_repos: user.public_repos, followers: user.followers, following: user.following },
      repos,
    };
    setGh(data);
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data })); } catch {}
  } catch {
    /* offline or rate-limited: the JSON fallback values stay on screen */
  }
}

/** Resolve a live spec like "repo:antigem:stars" against fetched data, else the fallback. */
export function live(spec: string | undefined, fallback: number): number {
  if (!spec) return fallback;
  const d = gh();
  const [kind, a, b] = spec.split(':');
  if (kind === 'repo') {
    const r = d.repos[a?.toLowerCase()];
    if (!r) return fallback;
    return b === 'forks' ? r.forks : r.stars;
  }
  if (kind === 'user') return d.user?.[a] ?? fallback;
  if (kind === 'total') {
    const vals = Object.values(d.repos).filter((r) => !r.fork);
    if (!vals.length) return fallback;
    return vals.reduce((s, r) => s + (a === 'forks' ? r.forks : r.stars), 0);
  }
  return fallback;
}

export const repoStars = (repo?: string) => (repo ? gh().repos[repo.toLowerCase()]?.stars ?? 0 : 0);
