import { For, Match, Show, Switch } from 'solid-js';
import { rng } from '../lib/rand';

/**
 * Deterministic generative cover art for a project, drawn as SVG.
 * Colours come from the theme's CSS variables, so covers re-tint with the theme.
 */
const W = 400;
const H = 300;
const ACC = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)'];

function contour(seed: string) {
  const r = rng(seed);
  const cx = W * (0.3 + r() * 0.4), cy = H * (0.3 + r() * 0.4);
  const ph = Array.from({ length: 4 }, () => r() * Math.PI * 2);
  return Array.from({ length: 14 }, (_, k) => {
    const base = 18 + k * 17;
    let d = '';
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const n = Math.sin(a * 3 + ph[0] + k * 0.15) * 0.12 + Math.sin(a * 5 + ph[1]) * 0.06 + Math.sin(a * 2 + ph[2] - k * 0.1) * 0.1;
      const rr = base * (1 + n);
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr * 1.25).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
    }
    return { d: d + 'Z', o: 0.9 - k * 0.055, c: ACC[k % 3 === 0 ? 0 : k % 3 === 1 ? 1 : 2] };
  });
}

function grid(seed: string) {
  const r = rng(seed);
  const cells: { x: number; y: number; c: string; o: number; s: number }[] = [];
  const cols = 20, rows = 15, sz = W / cols;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const v = r();
      const wave = Math.sin(x * 0.45 + y * 0.3) * 0.5 + 0.5;
      if (v < 0.1 + wave * 0.25) cells.push({ x: x * sz, y: y * (H / rows), c: ACC[v < 0.05 ? 2 : v < 0.18 ? 1 : 0], o: 0.25 + r() * 0.75, s: sz * (0.35 + r() * 0.45) });
    }
  return cells;
}

function tree(seed: string) {
  const r = rng(seed);
  const nodes: { x: number; y: number; d: number }[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const grow = (x: number, y: number, depth: number, spread: number) => {
    nodes.push({ x, y, d: depth });
    if (depth >= 4) return;
    const kids = depth === 0 ? 3 : 1 + Math.floor(r() * 3);
    for (let i = 0; i < kids; i++) {
      const nx = x + (kids === 1 ? 0 : ((i / (kids - 1)) - 0.5) * spread) + (r() - 0.5) * 10;
      const ny = y + 52 + r() * 10;
      edges.push({ x1: x, y1: y, x2: nx, y2: ny });
      grow(nx, ny, depth + 1, spread / (kids > 1 ? kids * 0.8 : 1));
    }
  };
  grow(W / 2, 40, 0, 300);
  return { nodes, edges };
}

function nodes(seed: string) {
  const r = rng(seed);
  const pts = Array.from({ length: 22 }, () => ({ x: 20 + r() * (W - 40), y: 20 + r() * (H - 40), s: 2 + r() * 5 }));
  const links: { a: number; b: number }[] = [];
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const n of near) if (n.j > i) links.push({ a: i, b: n.j });
  });
  return { pts, links };
}

function waves(seed: string) {
  const r = rng(seed);
  const ph = r() * 10, fr = 0.012 + r() * 0.01;
  return Array.from({ length: 11 }, (_, k) => {
    let d = '';
    for (let x = 0; x <= W; x += 8) {
      const y = 40 + k * 22 + Math.sin(x * fr + ph + k * 0.5) * (14 + k * 1.5) + Math.sin(x * fr * 2.3 + k) * 5;
      d += `${x ? 'L' : 'M'}${x},${y.toFixed(1)}`;
    }
    return { d, c: ACC[k % 3], o: 0.25 + (k / 11) * 0.7 };
  });
}

function rings(seed: string) {
  const r = rng(seed);
  const cx = W * (0.55 + r() * 0.2), cy = H * 0.5;
  return Array.from({ length: 7 }, (_, k) => ({
    cx, cy, r: 26 + k * 26, dash: `${2 + r() * 30} ${4 + r() * 14}`, c: ACC[k % 3], o: 0.85 - k * 0.09,
    dot: r() * Math.PI * 2,
  }));
}

function bars(seed: string) {
  const r = rng(seed);
  return Array.from({ length: 34 }, (_, i) => {
    const h = 20 + Math.abs(Math.sin(i * 0.4 + r() * 2)) * 150 + r() * 40;
    return { x: 10 + i * 11.4, h, c: ACC[i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0], o: 0.3 + r() * 0.6 };
  });
}

export default function GenCover(props: { seed: string; pattern?: string; glyph?: string; image?: string; class?: string }) {
  const pattern = () => props.pattern ?? 'contour';
  return (
    <div class={`cover ${props.class ?? ''}`}>
      <Show
        when={!props.image}
        fallback={<img src={props.image} alt="" loading="lazy" />}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <Switch>
            <Match when={pattern() === 'contour'}>
              <g class="cover__anim" fill="none" stroke-width="1.1">
                <For each={contour(props.seed)}>{(p) => <path d={p.d} style={{ stroke: p.c, opacity: p.o }} />}</For>
              </g>
            </Match>
            <Match when={pattern() === 'grid'}>
              <g class="cover__anim">
                <For each={grid(props.seed)}>
                  {(c) => <rect x={c.x} y={c.y} width={c.s} height={c.s} rx="2" style={{ fill: c.c, opacity: c.o }} />}
                </For>
              </g>
            </Match>
            <Match when={pattern() === 'tree'}>
              {(() => {
                const t = tree(props.seed);
                return (
                  <g class="cover__anim">
                    <For each={t.edges}>
                      {(e) => <path d={`M${e.x1},${e.y1} C${e.x1},${(e.y1 + e.y2) / 2} ${e.x2},${(e.y1 + e.y2) / 2} ${e.x2},${e.y2}`} fill="none" style={{ stroke: 'var(--accent)', opacity: 0.55 }} stroke-width="1.2" />}
                    </For>
                    <For each={t.nodes}>
                      {(n) => <circle cx={n.x} cy={n.y} r={7 - n.d} style={{ fill: ACC[n.d % 3] }} />}
                    </For>
                  </g>
                );
              })()}
            </Match>
            <Match when={pattern() === 'nodes'}>
              {(() => {
                const g = nodes(props.seed);
                return (
                  <g class="cover__anim">
                    <For each={g.links}>
                      {(l) => <line x1={g.pts[l.a].x} y1={g.pts[l.a].y} x2={g.pts[l.b].x} y2={g.pts[l.b].y} style={{ stroke: 'var(--accent-2)', opacity: 0.45 }} />}
                    </For>
                    <For each={g.pts}>{(p, i) => <circle cx={p.x} cy={p.y} r={p.s} style={{ fill: ACC[i() % 3] }} />}</For>
                  </g>
                );
              })()}
            </Match>
            <Match when={pattern() === 'waves'}>
              <g class="cover__anim" fill="none" stroke-width="1.4">
                <For each={waves(props.seed)}>{(p) => <path d={p.d} style={{ stroke: p.c, opacity: p.o }} />}</For>
              </g>
            </Match>
            <Match when={pattern() === 'rings'}>
              <g class="cover__anim cover__spin" fill="none" stroke-width="1.5">
                <For each={rings(props.seed)}>
                  {(c) => (
                    <>
                      <circle cx={c.cx} cy={c.cy} r={c.r} stroke-dasharray={c.dash} style={{ stroke: c.c, opacity: c.o }} />
                      <circle cx={c.cx + Math.cos(c.dot) * c.r} cy={c.cy + Math.sin(c.dot) * c.r} r="4" style={{ fill: c.c }} />
                    </>
                  )}
                </For>
              </g>
            </Match>
            <Match when={pattern() === 'bars'}>
              <g class="cover__anim">
                <For each={bars(props.seed)}>
                  {(b) => <rect x={b.x} y={H - b.h} width="7" height={b.h} rx="3" style={{ fill: b.c, opacity: b.o }} />}
                </For>
              </g>
            </Match>
          </Switch>
        </svg>
      </Show>
      <Show when={props.glyph}>
        <span class="cover__glyph" aria-hidden="true">
          {props.glyph}
        </span>
      </Show>
    </div>
  );
}
