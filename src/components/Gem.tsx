import { onCleanup, onMount } from 'solid-js';
import { palette } from '../lib/theme';
import { onVisible } from '../lib/reveal';
import { prefersReducedMotion } from '../config';

type V3 = [number, number, number];

/** A brilliant-cut gem: table, crown, girdle, pavilion, culet. Faces are oriented outward. */
function buildGem() {
  const v: V3[] = [];
  const N = 8;
  const ring = (n: number, r: number, y: number, off: number) => {
    const start = v.length;
    for (let i = 0; i < n; i++) {
      const a = ((i + off) / n) * Math.PI * 2;
      v.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    return start;
  };
  const T = ring(N, 0.56, 0.44, 0.5); // table
  const G = ring(N * 2, 1, 0.06, 0); // girdle
  const P = ring(N, 0.48, -0.56, 0.5); // pavilion mains
  const C = v.length;
  v.push([0, -1.2, 0]); // culet

  const t = (i: number) => T + ((i + N) % N);
  const g = (i: number) => G + ((i + 2 * N) % (2 * N));
  const p = (i: number) => P + ((i + N) % N);

  const faces: number[][] = [];
  faces.push(Array.from({ length: N }, (_, i) => t(i)));
  for (let i = 0; i < N; i++) {
    faces.push([t(i), g(2 * i), g(2 * i + 1)]);
    faces.push([t(i), g(2 * i + 1), g(2 * i + 2)]);
    faces.push([t(i), g(2 * i + 2), t(i + 1)]);
    faces.push([g(2 * i), g(2 * i + 1), p(i)]);
    faces.push([g(2 * i + 1), g(2 * i + 2), p(i)]);
    faces.push([p(i), g(2 * i + 2), p(i + 1)]);
    faces.push([p(i), p(i + 1), C]);
  }

  // Orient every face outward from the gem's centre and precompute normals.
  const centre: V3 = [0, -0.2, 0];
  const normals: V3[] = faces.map((f) => {
    const a = v[f[0]], b = v[f[1]], c = v[f[2]];
    const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const w: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n: V3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const len = Math.hypot(...n) || 1;
    n = [n[0] / len, n[1] / len, n[2] / len];
    const fc = f.reduce<V3>((s, i) => [s[0] + v[i][0] / f.length, s[1] + v[i][1] / f.length, s[2] + v[i][2] / f.length], [0, 0, 0]);
    const out = (fc[0] - centre[0]) * n[0] + (fc[1] - centre[1]) * n[1] + (fc[2] - centre[2]) * n[2];
    if (out < 0) {
      f.reverse();
      n = [-n[0], -n[1], -n[2]];
    }
    return n;
  });
  return { v, faces, normals };
}

const GEM = buildGem();
const L = (() => {
  const l: V3 = [-0.45, 0.75, 0.6];
  const n = Math.hypot(...l);
  return l.map((x) => x / n) as V3;
})();
const H = (() => {
  const h: V3 = [L[0], L[1], L[2] + 1];
  const n = Math.hypot(...h);
  return h.map((x) => x / n) as V3;
})();

const mix = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export default function Gem(props: { class?: string; interactive?: boolean }) {
  let canvas!: HTMLCanvasElement;
  let wrap!: HTMLDivElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    const reduced = prefersReducedMotion();
    let w = 0, h = 0, dpr = 1;
    let raf = 0;
    let running = false;
    let mx = 0, my = 0; // pointer, -1..1
    let tx = 0, ty = 0; // smoothed
    let spin = 0; // extra angular velocity from clicks
    let yaw = 0;
    let t0 = performance.now();
    const proj: number[][] = GEM.v.map(() => [0, 0, 0]);
    const rn: V3[] = GEM.normals.map(() => [0, 0, 0]);
    // glints on table, girdle and pavilion vertices (indices must stay < GEM.v.length)
    const glints = [1, 5, 10, 17, 26, 30].filter((i) => i < GEM.v.length).map((i, k) => ({ i, ph: k * 1.3 }));

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / innerWidth) * 2 - 1;
      my = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener('pointermove', onMove, { passive: true });
    const onClick = () => (spin += 0.22);
    if (props.interactive !== false) canvas.addEventListener('click', onClick);

    const draw = (now: number) => {
      const time = (now - t0) / 1000;
      tx += (mx - tx) * 0.05;
      ty += (my - ty) * 0.05;
      spin *= 0.965;
      yaw += (reduced ? 0.0015 : 0.006) + spin;
      const pitch = -0.42 + ty * 0.25 + Math.sin(time * 0.6) * 0.04;
      const ry = yaw + tx * 0.5;
      const rz = Math.sin(time * 0.4) * 0.06;
      const bob = reduced ? 0 : Math.sin(time * 1.1) * 0.035;

      const cy = Math.cos(ry), sy = Math.sin(ry);
      const cx = Math.cos(pitch), sx = Math.sin(pitch);
      const cz = Math.cos(rz), sz = Math.sin(rz);
      const rot = (p: V3, out: number[]) => {
        // yaw (Y), then pitch (X), then roll (Z)
        let x = p[0] * cy + p[2] * sy;
        let z = -p[0] * sy + p[2] * cy;
        let y = p[1];
        const y2 = y * cx - z * sx;
        const z2 = y * sx + z * cx;
        y = y2; z = z2;
        const x3 = x * cz - y * sz;
        const y3 = x * sz + y * cz;
        out[0] = x3; out[1] = y3; out[2] = z;
      };

      const S = Math.min(w, h) * 0.34;
      const ox = w / 2;
      const oy = h / 2 - bob * S;
      const f = 4.2;
      for (let i = 0; i < GEM.v.length; i++) {
        const o = proj[i];
        rot(GEM.v[i], o);
        const k = f / (f - o[2]);
        o[0] = ox + o[0] * S * k;
        o[1] = oy - o[1] * S * k;
      }
      for (let i = 0; i < GEM.normals.length; i++) rot(GEM.normals[i], rn[i]);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const { a1, a2, a3, light } = palette;
      // aura
      const aura = ctx.createRadialGradient(ox, oy, S * 0.1, ox, oy, S * 1.9);
      aura.addColorStop(0, `rgba(${a1[0]},${a1[1]},${a1[2]},${light ? 0.22 : 0.32})`);
      aura.addColorStop(0.45, `rgba(${a2[0]},${a2[1]},${a2[2]},0.08)`);
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, w, h);

      // floating shadow: shrinks as the gem rises
      const sh = 1 - bob * 4;
      const shadow = ctx.createRadialGradient(ox, h / 2 + S * 1.55, 0, ox, h / 2 + S * 1.55, S * 0.9 * sh);
      shadow.addColorStop(0, `rgba(${a1[0]},${a1[1]},${a1[2]},${light ? 0.25 : 0.35})`);
      shadow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(ox, h / 2 + S * 1.55);
      ctx.scale(1, 0.18);
      ctx.translate(-ox, -(h / 2 + S * 1.55));
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.arc(ox, h / 2 + S * 1.55, S * 0.9 * sh, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // depth-sort faces
      const order = GEM.faces
        .map((fc, i) => ({ i, z: fc.reduce((s, vi) => s + proj[vi][2], 0) / fc.length }))
        .sort((a, b) => a.z - b.z);

      const shade = (i: number, alpha: number, back: boolean) => {
        const n = rn[i];
        const ang = Math.atan2(n[0], n[1]) / Math.PI; // -1..1
        const t1 = (Math.sin(ang * Math.PI * 2 + time * 0.8) + 1) / 2;
        const t2 = (n[2] + 1) / 2;
        let col = mix(mix(a1, a2, t1), a3, (1 - t2) * 0.7);
        const diff = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
        const spec = Math.pow(Math.max(0, n[0] * H[0] + n[1] * H[1] + n[2] * H[2]), 28);
        const lum = back ? 0.6 : 0.5 + diff * 0.95;
        col = col.map((c) => Math.min(255, c * lum + 255 * spec * 1.1));
        return `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${alpha})`;
      };

      const path = (fc: number[]) => {
        ctx.beginPath();
        ctx.moveTo(proj[fc[0]][0], proj[fc[0]][1]);
        for (let k = 1; k < fc.length; k++) ctx.lineTo(proj[fc[k]][0], proj[fc[k]][1]);
        ctx.closePath();
      };

      // back faces first: the "inside" of the stone
      for (const { i } of order) {
        if (rn[i][2] > 0) continue;
        path(GEM.faces[i]);
        ctx.fillStyle = shade(i, 0.32, true);
        ctx.fill();
      }
      ctx.lineJoin = 'round';
      for (const { i } of order) {
        if (rn[i][2] <= 0) continue;
        path(GEM.faces[i]);
        ctx.fillStyle = shade(i, 0.86, false);
        ctx.fill();
        ctx.strokeStyle = light ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // twinkling glints on front vertices
      for (const gl of glints) {
        const p = proj[gl.i];
        if (p[2] < 0.1) continue;
        const a = Math.pow(Math.max(0, Math.sin(time * 1.6 + gl.ph)), 10);
        if (a < 0.02) continue;
        const r = S * 0.22 * a;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p[0] - r, p[1]); ctx.lineTo(p[0] + r, p[1]);
        ctx.moveTo(p[0], p[1] - r); ctx.lineTo(p[0], p[1] + r);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p[0], p[1], 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const loop = (now: number) => {
      draw(now);
      if (running) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    let inView = false;
    const offVis = onVisible(wrap, (v) => {
      inView = v;
      v && !document.hidden ? start() : stop();
    });
    const onHidden = () => (document.hidden || !inView ? stop() : start());
    document.addEventListener('visibilitychange', onHidden);

    onCleanup(() => {
      stop();
      offVis();
      ro.disconnect();
      removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onHidden);
      canvas.removeEventListener('click', onClick);
    });
  });

  return (
    <div ref={wrap} class={`gem ${props.class ?? ''}`}>
      <canvas ref={canvas} aria-label="A slowly rotating, gravity-defying gem. Click it." role="img" />
    </div>
  );
}
