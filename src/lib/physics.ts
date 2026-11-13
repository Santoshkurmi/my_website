/**
 * "Gravity mode": every element marked [data-phys] inside a container becomes a
 * rigid body. matter-js is only downloaded the first time someone flips the switch.
 */
import type MatterNS from 'matter-js';

type Tracked = { el: HTMLElement; body: MatterNS.Body; x0: number; y0: number };

export interface GravityWorld {
  stop(): void;
}

export async function startGravity(container: HTMLElement): Promise<GravityWorld> {
  const Matter = (await import('matter-js')).default as typeof MatterNS;
  const { Engine, Bodies, Body, Composite, Constraint, Sleeping } = Matter;

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1;
  engine.gravity.scale = 0.0016;

  const c = container.getBoundingClientRect();
  const W = c.width;
  const H = c.height;
  const T = 200; // wall thickness

  const walls = [
    Bodies.rectangle(W / 2, H + T / 2 - 4, W * 3, T, { isStatic: true, friction: 0.9 }),
    Bodies.rectangle(-T / 2, H / 2, T, H * 4, { isStatic: true }),
    Bodies.rectangle(W + T / 2, H / 2, T, H * 4, { isStatic: true }),
    Bodies.rectangle(W / 2, -H * 1.5, W * 3, T, { isStatic: true }),
  ];
  Composite.add(engine.world, walls);

  const tracked: Tracked[] = [];
  const els = Array.from(container.querySelectorAll<HTMLElement>('[data-phys]'));
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const x = r.left - c.left + r.width / 2;
    const y = r.top - c.top + r.height / 2;
    const opts: MatterNS.IChamferableBodyDefinition = {
      restitution: 0.32,
      friction: 0.35,
      frictionAir: 0.012,
      density: 0.0012,
    };
    const body =
      el.dataset.phys === 'circle'
        ? Bodies.circle(x, y, (Math.min(r.width, r.height) / 2) * 0.62, { ...opts, density: 0.004 })
        : Bodies.rectangle(x, y, Math.max(2, r.width - 2), Math.max(2, r.height - 2), {
            ...opts,
            chamfer: { radius: Math.min(10, r.height / 4) },
          });
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: -Math.random() * 4 });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);
    tracked.push({ el, body, x0: x, y0: y });
    el.style.transition = 'none';
    el.style.willChange = 'transform';
  }
  Composite.add(engine.world, tracked.map((t) => t.body));

  /* ── dragging & flinging ── */
  // Pointer capture starts only after a real drag, so a plain tap on a button/link still clicks it.
  let drag: { c: MatterNS.Constraint; id: number; sx: number; sy: number; captured: boolean } | null = null;
  const local = (e: PointerEvent) => {
    const b = container.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };
  const onDown = (e: PointerEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-phys]');
    const t = target && tracked.find((t) => t.el === target);
    if (!t) return;
    const p = local(e);
    Sleeping.set(t.body, false);
    const con = Constraint.create({
      pointA: p,
      bodyB: t.body,
      pointB: { x: p.x - t.body.position.x, y: p.y - t.body.position.y },
      stiffness: 0.18,
      damping: 0.08,
      length: 0,
    });
    Composite.add(engine.world, con);
    drag = { c: con, id: e.pointerId, sx: e.clientX, sy: e.clientY, captured: false };
  };
  const onMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.captured && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) {
      drag.captured = true;
      container.setPointerCapture(e.pointerId);
    }
    drag.c.pointA = local(e);
  };
  const onUp = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    Composite.remove(engine.world, drag.c);
    if (drag.captured) {
      try { container.releasePointerCapture(e.pointerId); } catch {}
      // swallow the click that follows a drag
      const stop = (ev: Event) => { ev.preventDefault(); ev.stopPropagation(); };
      container.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => container.removeEventListener('click', stop, { capture: true }), 50);
    }
    drag = null;
  };
  container.addEventListener('pointerdown', onDown);
  container.addEventListener('pointermove', onMove);
  container.addEventListener('pointerup', onUp);
  container.addEventListener('pointercancel', onUp);

  /* ── tilt your phone to steer gravity (Android & desktop; iOS needs a permission prompt, skipped) ── */
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    engine.gravity.x = Math.max(-1, Math.min(1, e.gamma / 45));
    engine.gravity.y = Math.max(-0.4, Math.min(1, e.beta / 45));
  };
  if (matchMedia('(pointer: coarse)').matches) addEventListener('deviceorientation', onTilt);

  /* ── loop ── */
  let raf = 0;
  let last = performance.now();
  let visible = true;
  const io = new IntersectionObserver((es) => (visible = es[0].isIntersecting));
  io.observe(container);

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.max(1, Math.min(32, now - last));
    last = now;
    if (!visible) return;
    Engine.update(engine, Math.min(dt, 1000 / 60));
    for (const t of tracked) {
      const { x, y } = t.body.position;
      t.el.style.transform = `translate3d(${(x - t.x0).toFixed(2)}px, ${(y - t.y0).toFixed(2)}px, 0) rotate(${t.body.angle.toFixed(4)}rad)`;
    }
  };
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener('deviceorientation', onTilt);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointercancel', onUp);
      // Float everything back home, staggered, with a little overshoot.
      tracked.forEach((t, i) => {
        t.el.style.transition = `transform 1100ms cubic-bezier(.2,1.25,.3,1) ${i * 22}ms`;
        t.el.style.transform = '';
      });
      setTimeout(() => {
        for (const t of tracked) {
          t.el.style.transition = '';
          t.el.style.willChange = '';
        }
      }, 1100 + tracked.length * 22 + 50);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    },
  };
}
