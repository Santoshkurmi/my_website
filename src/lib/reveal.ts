import { site, prefersReducedMotion } from '../config';

let io: IntersectionObserver | null = null;

function observer() {
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io!.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
  }
  return io;
}

/** Use as a ref: <div ref={reveal}> or ref={(el) => reveal(el, 120)} for a stagger delay. */
export function reveal(el: HTMLElement, delay = 0) {
  if (!site.effects.reveal || prefersReducedMotion()) return;
  el.classList.add('reveal');
  if (delay) el.style.setProperty('--d', `${delay}ms`);
  observer().observe(el);
}

/** Calls cb(true/false) as the element enters/leaves the viewport. Returns a disposer. */
export function onVisible(el: Element, cb: (v: boolean) => void, margin = '120px') {
  const o = new IntersectionObserver((es) => cb(es[0].isIntersecting), { rootMargin: margin });
  o.observe(el);
  return () => o.disconnect();
}
