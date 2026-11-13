import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import { profile, prefersReducedMotion } from '../config';
import type { SectionConfig } from '../types';
import { gravity, setGravity, setTerminalOpen, scrollToId } from '../lib/store';
import { live } from '../lib/github';
import { startGravity, type GravityWorld } from '../lib/physics';
import { Counter } from '../components/bits';
import { Icon } from '../lib/icons';
import { rng } from '../lib/rand';
import Gem from '../components/Gem';

function Rotator(props: { words: string[] }) {
  const [i, setI] = createSignal(0);
  onMount(() => {
    if (prefersReducedMotion() || props.words.length < 2) return;
    const id = setInterval(() => setI((i() + 1) % props.words.length), 2600);
    onCleanup(() => clearInterval(id));
  });
  return (
    <span class="rotator" aria-live="polite">
      <For each={props.words}>
        {(w, k) => (
          <span class="rotator__word" classList={{ on: k() === i(), past: k() === (i() - 1 + props.words.length) % props.words.length }}>
            {w}
          </span>
        )}
      </For>
    </span>
  );
}

/** Procedural Himalayan ridge: three layers of midpoint-displaced peaks. */
function Mountains(props: { label?: string }) {
  const W = 1440;
  const layer = (seed: string, base: number, rough: number, peak: number) => {
    const r = rng(seed);
    let pts: number[] = [base, base];
    let n = 2;
    let amp = rough;
    for (let it = 0; it < 7; it++) {
      const next: number[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        next.push(pts[i], (pts[i] + pts[i + 1]) / 2 + (r() - 0.5) * amp);
      }
      next.push(pts[pts.length - 1]);
      pts = next;
      n = pts.length;
      amp *= 0.55;
    }
    // a dominant peak
    const pk = Math.floor(n * peak);
    pts = pts.map((y, i) => y - Math.max(0, 1 - Math.abs(i - pk) / (n * 0.18)) * rough * 0.9);
    let minI = 0;
    pts.forEach((y, i) => (y < pts[minI] ? (minI = i) : 0));
    const d = pts.map((y, i) => `${i ? 'L' : 'M'}${((i / (n - 1)) * W).toFixed(1)},${y.toFixed(1)}`).join('') + `L${W},320L0,320Z`;
    return { d, top: { x: (minI / (n - 1)) * W, y: pts[minI] } };
  };
  const back = layer('everest', 170, 190, 0.62);
  const mid = layer('annapurna', 215, 130, 0.28);
  const front = layer('kathmandu', 268, 70, 0.8);
  return (
    <div class="mountains" aria-hidden="true">
      <svg viewBox={`0 0 ${W} 320`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="mtn-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--muted)" stop-opacity="0.32" />
            <stop offset="0.5" stop-color="var(--accent)" stop-opacity="0.08" />
            <stop offset="1" stop-color="var(--bg)" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="mtn-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--accent)" stop-opacity="0.2" />
            <stop offset="1" stop-color="var(--bg)" stop-opacity="0.6" />
          </linearGradient>
          <linearGradient id="mtn-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--bg-2)" />
            <stop offset="1" stop-color="var(--bg)" />
          </linearGradient>
        </defs>
        <path d={back.d} fill="url(#mtn-back)" />
        <path d={mid.d} fill="url(#mtn-mid)" />
        <path d={front.d} fill="url(#mtn-front)" />
      </svg>
      <Show when={props.label}>
        <span class="mountains__label mono" style={{ left: `${(back.top.x / W) * 100}%`, top: `${(back.top.y / 320) * 100}%` }}>
          {props.label}
        </span>
      </Show>
    </div>
  );
}

export default function Hero(props: { section: SectionConfig }) {
  const opt = (k: string, d = true) => (props.section.props?.[k] as boolean | undefined) ?? d;
  const variant = props.section.variant ?? 'gravity';
  let root!: HTMLElement;
  let world: GravityWorld | null = null;
  const [loading, setLoading] = createSignal(false);
  const [hint, setHint] = createSignal(false);

  const lines = [profile.firstName, profile.lastName];
  let idx = 0;

  // Letters gently shy away from the cursor (when gravity is off).
  onMount(() => {
    if (prefersReducedMotion()) return;
    const letters = Array.from(root.querySelectorAll<HTMLElement>('.hero__rp'));
    let raf = 0;
    let mx = -1e4, my = -1e4;
    const apply = () => {
      raf = 0;
      if (gravity()) return;
      for (const el of letters) {
        const r = el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - mx;
        const dy = r.top + r.height / 2 - my;
        const d = Math.hypot(dx, dy);
        const R = 170;
        if (d < R) {
          const f = Math.pow(1 - d / R, 2) * 26;
          el.style.transform = `translate(${(dx / d) * f}px, ${(dy / d) * f}px) rotate(${(dx / d) * f * 0.4}deg)`;
        } else if (el.style.transform) el.style.transform = '';
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => {
      mx = my = -1e4;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    onCleanup(() => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
    });
  });

  createEffect(
    on(gravity, async (on) => {
      if (on && !world) {
        root.querySelectorAll<HTMLElement>('.hero__rp').forEach((el) => (el.style.transform = ''));
        setLoading(true);
        try {
          world = await startGravity(root);
          if (!gravity()) {
            world.stop();
            world = null;
          } else {
            setHint(true);
            setTimeout(() => setHint(false), 4000);
          }
        } finally {
          setLoading(false);
        }
      } else if (!on && world) {
        world.stop();
        world = null;
        setHint(false);
      }
    }),
  );

  onMount(() => {
    // A resized viewport invalidates the physics walls: float everything home.
    const r = () => gravity() && setGravity(false);
    addEventListener('resize', r);
    onCleanup(() => {
      removeEventListener('resize', r);
      world?.stop();
      world = null;
    });
  });

  return (
    <section
      id={props.section.id}
      ref={root}
      class={`hero hero--${variant}`}
      classList={{ 'is-gravity': gravity() }}
    >
      <Show when={opt('hud')}>
        <div class="hero__hud mono">
          <span class="hero__chip" data-phys>
            <i class="pulse" /> {profile.status}
          </span>
          <span class="hero__chip" data-phys>
            {profile.location} · {profile.coords}
          </span>
        </div>
      </Show>

      <Show when={opt('gem') && variant !== 'minimal'}>
        <div class="hero__gem" data-phys="circle">
          <Gem />
        </div>
      </Show>

      <div class="hero__content">
        <h1 class="hero__name" aria-label={profile.name}>
          <For each={lines}>
            {(line) => (
              <span class="hero__line" aria-hidden="true">
                <For each={[...line]}>
                  {(ch) => {
                    const i = idx++;
                    return (
                      <span class="hero__ph" data-phys style={{ '--i': i }}>
                        <span class="hero__rp">
                          <span class="hero__ch">
                            {ch}
                          </span>
                        </span>
                      </span>
                    );
                  }}
                </For>
              </span>
            )}
          </For>
        </h1>

        <p class="hero__headline" data-phys>
          <span class="hero__prefix">{profile.headline.prefix}</span> <Rotator words={profile.headline.rotating} />
        </p>

        <p class="hero__intro" data-phys>
          {profile.intro}
        </p>

        <div class="hero__ctas">
          <a
            class="btn btn--primary"
            data-phys
            href={profile.cta.primary.href}
            onClick={(e) => {
              if (profile.cta.primary.href.startsWith('#')) {
                e.preventDefault();
                scrollToId(profile.cta.primary.href);
              }
            }}
          >
            {profile.cta.primary.label} <Icon name="arrow" size={16} />
          </a>
          <Show
            when={profile.cta.secondary.action === 'terminal'}
            fallback={
              <a class="btn" data-phys href={profile.cta.secondary.href} target="_blank" rel="noopener">
                {profile.cta.secondary.label}
              </a>
            }
          >
            <button class="btn" data-phys onClick={() => setTerminalOpen(true)}>
              <Icon name="terminal" size={16} /> {profile.cta.secondary.label}
            </button>
          </Show>
        </div>
      </div>

      <div class="hero__bottom">
        <div class="hero__stats">
          <For each={profile.stats}>
            {(s) => (
              <div class="stat" data-phys>
                <div class="stat__value">
                  <Counter value={live(s.live, s.value)} plain={s.plain} />
                  <Show when={s.suffix}>
                    <span class="stat__suffix">{s.suffix}</span>
                  </Show>
                </div>
                <div class="stat__label mono">{s.label}</div>
              </div>
            )}
          </For>
        </div>

        <Show when={opt('gravitySwitch') && variant !== 'minimal'}>
          <div class="gswitch">
            <button
              class="gswitch__btn"
              role="switch"
              aria-checked={gravity()}
              onClick={() => setGravity(!gravity())}
              aria-label="Toggle gravity"
            >
              <span class="gswitch__track">
                <span class="gswitch__knob" />
              </span>
              <span class="gswitch__text mono">
                <b>Gravity</b> {loading() ? 'loading…' : gravity() ? 'on' : 'off'}
              </span>
            </button>
            <span class="gswitch__hint mono">
              {gravity() ? (hint() ? 'drag & throw things ↑' : 'flip it back ↑') : 'go on, flip it'}
            </span>
          </div>
        </Show>
      </div>

      <Show when={opt('mountains')}>
        <Mountains label={props.section.props?.mountainLabel as string | undefined} />
      </Show>
    </section>
  );
}
