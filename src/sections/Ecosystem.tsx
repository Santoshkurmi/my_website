import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { ecosystem as eco, prefersReducedMotion } from '../config';
import type { SectionConfig, Satellite } from '../types';
import { SectionHead, Counter, TiltCard } from '../components/bits';
import { reveal, onVisible } from '../lib/reveal';
import { live } from '../lib/github';
import { Rich } from '../lib/text';
import { Icon } from '../lib/icons';

function Phone() {
  const [i, setI] = createSignal(0);
  let el!: HTMLDivElement;
  let paused = false;
  onMount(() => {
    if (prefersReducedMotion()) return;
    let visible = false;
    const off = onVisible(el, (v) => (visible = v));
    const id = setInterval(() => visible && !paused && setI((i() + 1) % eco.screens.length), 3200);
    onCleanup(() => {
      clearInterval(id);
      off();
    });
  });
  return (
    <div class="phone-stage" ref={el}>
      <For each={eco.agents}>
        {(a, k) => (
          <span class="phone-stage__agent mono" style={{ '--k': k() }}>
            {a}
          </span>
        )}
      </For>
      <div class="phone" onPointerEnter={() => (paused = true)} onPointerLeave={() => (paused = false)}>
        <div class="phone__island" />
        <div class="phone__screen">
          <For each={eco.screens}>
            {(s, k) => (
              <img
                src={s.src}
                alt={s.caption}
                loading={k() < 2 ? 'eager' : 'lazy'}
                decoding="async"
                classList={{ on: k() === i() }}
              />
            )}
          </For>
        </div>
      </div>
      <div class="phone-stage__caption">
        <span class="mono">{String(i() + 1).padStart(2, '0')} / {String(eco.screens.length).padStart(2, '0')}</span>
        <span>{eco.screens[i()].caption}</span>
      </div>
      <div class="phone-stage__dots">
        <For each={eco.screens}>
          {(_, k) => <button aria-label={`Screenshot ${k() + 1}`} classList={{ on: k() === i() }} onClick={() => setI(k())} />}
        </For>
      </div>
    </div>
  );
}

function Orbit() {
  const [sel, setSel] = createSignal<Satellite | null>(null);
  const info = () => sel() ?? { ...eco.orbit.center, glyph: '◆' };
  const radii = [34, 50]; // % of the orbit box (radius)
  return (
    <div class="orbit-wrap">
      <div class="orbit" ref={reveal}>
        <For each={eco.orbit.rings}>
          {(ring, ri) => (
            <div class={`orbit__ring orbit__ring--${ri()}`} style={{ '--r': `${radii[ri()] ?? 50}%`, '--dur': `${70 + ri() * 40}s` }}>
              <For each={ring}>
                {(s, k) => {
                  const angle = (360 / ring.length) * k() + ri() * 30;
                  return (
                    <div class="orbit__slot" style={{ '--a': `${angle}deg` }}>
                      <button
                        class="orbit__sat"
                        classList={{ on: sel()?.name === s.name }}
                        onClick={() => setSel(sel()?.name === s.name ? null : s)}
                        onPointerEnter={() => setSel(s)}
                        aria-label={s.name}
                      >
                        <span class="orbit__counter">
                          <span class="orbit__glyph">{s.glyph ?? '●'}</span>
                          <span class="orbit__name">{s.name}</span>
                        </span>
                      </button>
                    </div>
                  );
                }}
              </For>
            </div>
          )}
        </For>
        <button class="orbit__core" onClick={() => setSel(null)} aria-label={eco.orbit.center.name}>
          <img src={eco.icon} alt="" width="72" height="72" />
        </button>
      </div>
      <div class="orbit__info" ref={(el) => reveal(el, 120)}>
        <div class="orbit__info-glyph">{info().glyph}</div>
        <div class="mono orbit__info-lang">{info().lang}</div>
        <h4>{info().name}</h4>
        <p>{info().description}</p>
        <a class="link" href={info().href} target="_blank" rel="noopener">
          View on GitHub <Icon name="arrow" size={14} />
        </a>
      </div>
    </div>
  );
}

function Architecture() {
  const nodes = Object.fromEntries(eco.architecture.nodes.map((n) => [n.id, n]));
  const paths = eco.architecture.edges.map((e) => {
    const a = nodes[e.from], b = nodes[e.to];
    if (!a || !b) return null;
    let d: string, lx: number, ly: number;
    if (Math.abs(a.y - b.y) < 40) {
      const x1 = a.x + (b.x > a.x ? a.w / 2 : -a.w / 2), x2 = b.x + (b.x > a.x ? -b.w / 2 : b.w / 2);
      d = `M${x1},${a.y} L${x2},${b.y}`;
      lx = (x1 + x2) / 2;
      ly = a.y - 14;
    } else {
      const y1 = a.y + a.h / 2, y2 = b.y - b.h / 2;
      const x1 = a.x + Math.max(-a.w / 2 + 30, Math.min(a.w / 2 - 30, (b.x - a.x) * 0.5));
      const my = (y1 + y2) / 2;
      d = `M${x1},${y1} C${x1},${my} ${b.x},${my} ${b.x},${y2}`;
      lx = (x1 + b.x) / 2;
      ly = my;
    }
    return { ...e, d, lx, ly };
  }).filter(Boolean) as { from: string; to: string; label: string; d: string; lx: number; ly: number }[];
  const maxX = Math.max(...eco.architecture.nodes.map((n) => n.x + n.w / 2)) + 20;
  const maxY = Math.max(...eco.architecture.nodes.map((n) => n.y + n.h / 2)) + 20;
  const minX = Math.min(0, ...eco.architecture.nodes.map((n) => n.x - n.w / 2)) - 20;
  const acc = (n: number) => (n === 2 ? 'var(--accent-2)' : n === 3 ? 'var(--accent-3)' : 'var(--accent)');

  return (
    <div class="arch" ref={reveal}>
      <div class="arch__scroll">
        <svg viewBox={`${minX} 0 ${maxX - minX} ${maxY}`} class="arch__svg" role="img" aria-label="AntiGem architecture diagram">
          <For each={paths}>
            {(p, i) => (
              <g>
                <path id={`arch-p-${i()}`} d={p.d} class="arch__edge" />
                <path d={p.d} class="arch__flow" style={{ 'animation-delay': `${i() * -0.4}s` }} />
                <circle r="4" class="arch__packet">
                  <animateMotion dur={`${2.4 + (i() % 3) * 0.5}s`} repeatCount="indefinite" begin={`${i() * 0.3}s`}>
                    <mpath {...({ href: `#arch-p-${i()}` } as object)} />
                  </animateMotion>
                </circle>
                <g transform={`translate(${p.lx},${p.ly})`}>
                  <rect x={-(p.label.length * 4.1 + 12)} y="-12" width={p.label.length * 8.2 + 24} height="24" rx="12" class="arch__tag" />
                  <text class="arch__tag-text" text-anchor="middle" dy="4">
                    {p.label}
                  </text>
                </g>
              </g>
            )}
          </For>
          <For each={eco.architecture.nodes}>
            {(n) => (
              <g transform={`translate(${n.x - n.w / 2},${n.y - n.h / 2})`} class="arch__node">
                <rect width={n.w} height={n.h} rx="16" class="arch__box" style={{ stroke: acc(n.accent) }} />
                <rect width="4" height={n.h - 32} x="0" y="16" rx="2" style={{ fill: acc(n.accent) }} />
                <text x={n.w / 2} y={n.h / 2 - 4} text-anchor="middle" class="arch__label">
                  {n.label}
                </text>
                <text x={n.w / 2} y={n.h / 2 + 18} text-anchor="middle" class="arch__sub">
                  {n.sub}
                </text>
              </g>
            )}
          </For>
        </svg>
      </div>
    </div>
  );
}

export default function Ecosystem(props: { section: SectionConfig; index: number }) {
  const opt = (k: string) => (props.section.props?.[k] as boolean | undefined) ?? true;
  return (
    <section id={props.section.id} class="section eco">
      <div class="wrap">
        <SectionHead index={props.index} eyebrow={eco.eyebrow} title={eco.title} />

        <div class="eco__hero">
          <div class="eco__copy">
            <div class="eco__brand" ref={reveal}>
              <img src={eco.icon} alt="" width="56" height="56" />
              <p class="eco__tagline">{eco.tagline}</p>
            </div>
            <p class="eco__desc" ref={(el) => reveal(el, 80)}>
              {eco.description}
            </p>
            <div class="eco__metrics" ref={(el) => reveal(el, 140)}>
              <For each={eco.metrics}>
                {(m) => {
                  const num = parseInt(m.value, 10);
                  const tail = m.value.replace(/^\d+/, '');
                  return (
                    <div class="metric">
                      <div class="metric__value">
                        <Show when={!Number.isNaN(num)} fallback={m.value}>
                          <Counter value={live(m.live, num)} />
                          {tail}
                        </Show>
                        <Show when={m.suffix}>
                          <span class="metric__suffix">{m.suffix}</span>
                        </Show>
                      </div>
                      <div class="metric__label">{m.label}</div>
                    </div>
                  );
                }}
              </For>
            </div>
            <div class="eco__links" ref={(el) => reveal(el, 200)}>
              <For each={eco.links}>
                {(l) => (
                  <a class={`btn ${l.primary ? 'btn--primary' : ''}`} href={l.href} target="_blank" rel="noopener">
                    <Show when={l.primary} fallback={<Icon name="arrow" size={15} />}>
                      <Icon name="download" size={16} />
                    </Show>
                    {l.label}
                  </a>
                )}
              </For>
            </div>
          </div>
          <Show when={opt('phone')}>
            <Phone />
          </Show>
        </div>

        <div class="eco__features">
          <For each={eco.features}>
            {(f, i) => (
              <TiltCard class="feature" max={5} ref={(el) => reveal(el, (i() % 4) * 70)}>
                <div class="feature__icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </TiltCard>
            )}
          </For>
        </div>

        <Show when={opt('orbit')}>
          <div class="eco__sub">
            <h3 class="eco__subtitle" ref={reveal}>
              <Rich text={eco.orbit.title} />
            </h3>
            <p class="eco__subtext" ref={reveal}>
              {eco.orbit.text}
            </p>
            <Orbit />
          </div>
        </Show>

        <Show when={opt('architecture')}>
          <div class="eco__sub">
            <h3 class="eco__subtitle" ref={reveal}>
              <Rich text={eco.architecture.title} />
            </h3>
            <p class="eco__subtext" ref={reveal}>
              {eco.architecture.text}
            </p>
            <Architecture />
          </div>
        </Show>
      </div>
    </section>
  );
}
