import { For, onCleanup, onMount } from 'solid-js';
import { profile, prefersReducedMotion } from '../config';
import type { SectionConfig } from '../types';
import { SectionHead } from '../components/bits';
import { reveal } from '../lib/reveal';
import { Icon } from '../lib/icons';
import { ghUrl } from '../config';

export default function About(props: { section: SectionConfig; index: number }) {
  let text!: HTMLParagraphElement;
  const words = profile.about.statement.split(/\s+/);

  // Words light up one by one as the paragraph scrolls through the viewport.
  onMount(() => {
    const spans = Array.from(text.querySelectorAll<HTMLElement>('span'));
    if (prefersReducedMotion()) {
      spans.forEach((s) => s.classList.add('lit'));
      return;
    }
    let raf = 0;
    let lastLit = -1;
    const update = () => {
      raf = 0;
      const r = text.getBoundingClientRect();
      const start = innerHeight * 0.85;
      const end = innerHeight * 0.35;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.6)));
      const lit = Math.round(p * spans.length);
      if (lit === lastLit) return;
      lastLit = lit;
      spans.forEach((s, i) => s.classList.toggle('lit', i < lit));
    };
    const onScroll = () => !raf && (raf = requestAnimationFrame(update));
    addEventListener('scroll', onScroll, { passive: true });
    update();
    onCleanup(() => removeEventListener('scroll', onScroll));
  });

  return (
    <section id={props.section.id} class="section about">
      <div class="wrap">
        <SectionHead index={props.index} eyebrow={profile.about.eyebrow} title={profile.about.title} />
        <div class="about__grid">
          <div class="about__card" ref={reveal}>
            <div class="about__avatar">
              <img src={profile.avatar} alt={profile.name} loading="lazy" width="320" height="320" />
              <span class="about__ring" />
            </div>
            <div class="about__id">
              <div class="about__name">{profile.name}</div>
              <a class="about__handle mono" href={ghUrl()} target="_blank" rel="noopener">
                <Icon name="github" size={14} /> @{profile.handle}
              </a>
            </div>
            <dl class="about__facts">
              <For each={profile.about.facts}>
                {(f) => (
                  <div>
                    <dt class="mono">{f.k}</dt>
                    <dd>{f.v}</dd>
                  </div>
                )}
              </For>
            </dl>
          </div>
          <p class="about__statement" ref={text}>
            <For each={words}>{(w) => <><span>{w}</span> </>}</For>
          </p>
        </div>
      </div>
    </section>
  );
}
