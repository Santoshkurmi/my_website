import { For, onCleanup, onMount, Show } from 'solid-js';
import { timeline } from '../config';
import type { SectionConfig } from '../types';
import { SectionHead } from '../components/bits';
import { reveal } from '../lib/reveal';
import { scrollToId } from '../lib/store';
import { Icon } from '../lib/icons';

export default function Timeline(props: { section: SectionConfig; index: number }) {
  let track!: HTMLDivElement;
  const variant = props.section.variant ?? 'alternate';

  // The rail fills, and nodes ignite, as you scroll down: a launch trajectory.
  onMount(() => {
    const nodes = Array.from(track.querySelectorAll<HTMLElement>('.tl__item'));
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = track.getBoundingClientRect();
      const mark = innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
      track.style.setProperty('--p', p.toFixed(4));
      for (const n of nodes) n.classList.toggle('lit', n.getBoundingClientRect().top + 30 < mark);
    };
    const onScroll = () => !raf && (raf = requestAnimationFrame(update));
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
    onCleanup(() => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    });
  });

  return (
    <section id={props.section.id} class={`section tl tl--${variant}`}>
      <div class="wrap">
        <SectionHead index={props.index} eyebrow={timeline.eyebrow} title={timeline.title} subtitle={timeline.subtitle} />
        <div class="tl__track" ref={track}>
          <div class="tl__rail">
            <div class="tl__fill" />
            <div class="tl__comet" />
          </div>
          <For each={timeline.items}>
            {(it, i) => (
              <div class="tl__item" classList={{ 'tl__item--hi': !!it.highlight, 'tl__item--r': i() % 2 === 1 }}>
                <div class="tl__node" />
                <div class="tl__card" ref={reveal}>
                  <div class="tl__date mono">{it.date}</div>
                  <h3 class="tl__title">{it.title}</h3>
                  <p class="tl__text">{it.text}</p>
                  <div class="tl__foot">
                    <Show when={it.tags?.length}>
                      <div class="chips">
                        <For each={it.tags}>{(t) => <span class="chip chip--sm">{t}</span>}</For>
                      </div>
                    </Show>
                    <Show when={it.href}>
                      <a
                        class="link"
                        href={it.href}
                        onClick={(e) => {
                          if (it.href!.startsWith('#')) {
                            e.preventDefault();
                            scrollToId(it.href!);
                          }
                        }}
                      >
                        Read more <Icon name="arrow" size={13} />
                      </a>
                    </Show>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
