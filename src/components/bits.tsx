import { createEffect, createSignal, on, onCleanup, onMount, Show, type JSX } from 'solid-js';
import { Rich } from '../lib/text';
import { reveal } from '../lib/reveal';
import { prefersReducedMotion, site } from '../config';

/** Section heading: "01 — Eyebrow", big title with *emphasis*, optional subtitle. */
export function SectionHead(props: { index?: number; eyebrow: string; title: string; subtitle?: string; align?: 'left' | 'center' }) {
  return (
    <header class="shead" classList={{ 'shead--center': props.align === 'center' }}>
      <div class="shead__eyebrow" ref={reveal}>
        <Show when={props.index}>
          <span class="shead__num">{String(props.index).padStart(2, '0')}</span>
          <span class="shead__line" />
        </Show>
        <span>{props.eyebrow}</span>
      </div>
      <h2 class="shead__title" ref={(el) => reveal(el, 80)}>
        <Rich text={props.title} />
      </h2>
      <Show when={props.subtitle}>
        <p class="shead__sub" ref={(el) => reveal(el, 160)}>
          {props.subtitle}
        </p>
      </Show>
    </header>
  );
}

/** Number that counts up when it scrolls into view, and re-animates when the value changes (live data). */
export function Counter(props: { value: number; plain?: boolean; duration?: number }) {
  let el!: HTMLSpanElement;
  const [shown, setShown] = createSignal(0);
  let seen = false;
  let raf = 0;
  const fmt = (n: number) => (props.plain ? String(n) : n.toLocaleString('en-US'));
  const animate = (from: number, to: number) => {
    cancelAnimationFrame(raf);
    if (prefersReducedMotion()) return setShown(to);
    const d = props.duration ?? 1400;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / d);
      const e = 1 - Math.pow(1 - p, 4);
      setShown(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  onMount(() => {
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting && !seen) {
        seen = true;
        animate(props.plain ? Math.max(0, props.value - 30) : 0, props.value);
        io.disconnect();
      }
    });
    io.observe(el);
    onCleanup(() => {
      io.disconnect();
      cancelAnimationFrame(raf);
    });
  });
  createEffect(on(() => props.value, (v, prev) => seen && prev !== undefined && animate(shown(), v), { defer: true }));
  return <span ref={el}>{fmt(shown())}</span>;
}

/** Card with 3D tilt + a spotlight that follows the pointer. */
export function TiltCard(props: { class?: string; children: JSX.Element; onClick?: () => void; style?: JSX.CSSProperties; max?: number; ref?: (el: HTMLElement) => void; label?: string }) {
  let el!: HTMLDivElement;
  const tilt = site.effects.tilt && !prefersReducedMotion();
  const max = props.max ?? 7;
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    if (tilt && e.pointerType === 'mouse') el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(0)`;
  };
  const leave = () => {
    el.style.transform = '';
  };
  return (
    <div
      ref={(e) => {
        el = e;
        props.ref?.(e);
      }}
      class={`tilt ${props.class ?? ''}`}
      style={props.style}
      onPointerMove={move}
      onPointerLeave={leave}
      onClick={props.onClick}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      aria-label={props.label}
      onKeyDown={(e) => props.onClick && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), props.onClick())}
    >
      {props.children}
    </div>
  );
}

/** Button that leans toward the cursor. */
export function Magnetic(props: { children: JSX.Element; strength?: number }) {
  let el!: HTMLSpanElement;
  const s = props.strength ?? 0.3;
  return (
    <span
      ref={el}
      class="magnetic"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * s}px, ${(e.clientY - r.top - r.height / 2) * s}px)`;
      }}
      onPointerLeave={() => (el.style.transform = '')}
    >
      {props.children}
    </span>
  );
}
