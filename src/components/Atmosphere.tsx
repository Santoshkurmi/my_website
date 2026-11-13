import { onCleanup, onMount, Show } from 'solid-js';
import { site, prefersReducedMotion } from '../config';
import { palette } from '../lib/theme';
import { gravity } from '../lib/store';

/**
 * Fixed background layers: aurora blobs, anti-gravity dust (particles drift UP),
 * a cursor glow and film grain. All optional via site.json → effects.
 */
export default function Atmosphere() {
  let canvas!: HTMLCanvasElement;
  let glow!: HTMLDivElement;

  onMount(() => {
    const reduced = prefersReducedMotion();
    const cleanups: (() => void)[] = [];

    if (site.effects.cursorGlow && matchMedia('(pointer: fine)').matches && glow) {
      let x = innerWidth / 2, y = innerHeight / 3, gx = x, gy = y, raf = 0;
      const move = (e: PointerEvent) => {
        x = e.clientX;
        y = e.clientY;
        if (!raf) raf = requestAnimationFrame(tick);
      };
      const tick = () => {
        gx += (x - gx) * 0.12;
        gy += (y - gy) * 0.12;
        glow.style.transform = `translate3d(${gx - 300}px, ${gy - 300}px, 0)`;
        raf = Math.abs(x - gx) + Math.abs(y - gy) > 0.5 ? requestAnimationFrame(tick) : 0;
      };
      addEventListener('pointermove', move, { passive: true });
      cleanups.push(() => removeEventListener('pointermove', move));
    }

    if (site.effects.particles && canvas) {
      const ctx = canvas.getContext('2d')!;
      let w = 0, h = 0, dpr = 1, raf = 0;
      let mx = 0, my = 0, sx = 0, sy = 0;
      type P = { x: number; y: number; z: number; r: number; v: number; ph: number };
      let ps: P[] = [];
      const seed = () => {
        const count = Math.round(Math.min(160, (w * h) / 11000) * site.effects.particleDensity);
        ps = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          z: 0.2 + Math.random() * 0.8,
          r: 0.4 + Math.random() * 1.4,
          v: 6 + Math.random() * 18,
          ph: Math.random() * Math.PI * 2,
        }));
      };
      const resize = () => {
        dpr = Math.min(2, devicePixelRatio || 1);
        w = innerWidth;
        h = innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        seed();
      };
      resize();
      addEventListener('resize', resize);
      const move = (e: PointerEvent) => {
        mx = e.clientX / w - 0.5;
        my = e.clientY / h - 0.5;
      };
      addEventListener('pointermove', move, { passive: true });

      let last = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        sx += (mx - sx) * 0.04;
        sy += (my - sy) * 0.04;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const c = palette.particle;
        // gravity on → dust falls; off → it rises (anti-gravity)
        const dir = gravity() ? 1.6 : -1;
        const t = now / 1000;
        for (const p of ps) {
          p.y += dir * p.v * p.z * dt;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
          const px = p.x - sx * 40 * p.z;
          const py = p.y - sy * 30 * p.z;
          const a = (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 1.3 + p.ph))) * p.z * (palette.light ? 0.5 : 0.75);
          ctx.fillStyle = `rgba(${c},${a.toFixed(3)})`;
          const r = p.r * p.z;
          if (r < 0.9) ctx.fillRect(px, py, r * 2, r * 2);
          else {
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      };
      if (!reduced) raf = requestAnimationFrame(frame);
      else frame(performance.now());
      const vis = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden && !reduced) raf = requestAnimationFrame(frame);
      };
      document.addEventListener('visibilitychange', vis);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        removeEventListener('resize', resize);
        removeEventListener('pointermove', move);
        document.removeEventListener('visibilitychange', vis);
      });
    }

    onCleanup(() => cleanups.forEach((f) => f()));
  });

  return (
    <div class="atmo" aria-hidden="true">
      <div class="atmo__aurora atmo__aurora--1" />
      <div class="atmo__aurora atmo__aurora--2" />
      <div class="atmo__aurora atmo__aurora--3" />
      <Show when={site.effects.particles}>
        <canvas ref={canvas} class="atmo__dust" />
      </Show>
      <Show when={site.effects.cursorGlow}>
        <div ref={glow} class="atmo__glow" />
      </Show>
      <Show when={site.effects.grain}>
        <div class="atmo__grain" />
      </Show>
    </div>
  );
}
