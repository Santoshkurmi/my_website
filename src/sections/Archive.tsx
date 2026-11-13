import { createSignal, For, Show } from 'solid-js';
import { projects, colorFor, ghUrl } from '../config';
import type { SectionConfig } from '../types';
import { SectionHead } from '../components/bits';
import { reveal } from '../lib/reveal';
import { Icon } from '../lib/icons';

export default function Archive(props: { section: SectionConfig; index: number }) {
  const a = projects.archive;
  const items = [...a.items].sort((x, y) => y.year - x.year);
  const [all, setAll] = createSignal(false);
  const shown = () => (all() ? items : items.slice(0, a.initial));

  return (
    <section id={props.section.id} class="section archive">
      <div class="wrap">
        <SectionHead index={props.index} eyebrow={a.eyebrow} title={a.title} subtitle={a.subtitle} />
        <div class="archive__table" role="list">
          <For each={shown()}>
            {(it, i) => (
              <a
                class="archive__row"
                role="listitem"
                href={it.href ?? ghUrl(it.repo ?? it.name)}
                target="_blank"
                rel="noopener"
                ref={(el) => reveal(el, Math.min(i(), 8) * 40)}
              >
                <span class="archive__year mono">{it.year}</span>
                <span class="archive__name">{it.name}</span>
                <span class="archive__desc">{it.description}</span>
                <span class="archive__lang mono">
                  <span class="dot" style={{ background: colorFor(it.language) }} />
                  {it.language}
                </span>
                <Icon name="arrow" size={16} class="archive__arrow" />
              </a>
            )}
          </For>
        </div>
        <Show when={items.length > a.initial}>
          <button class="btn archive__toggle" onClick={() => setAll(!all())}>
            {all() ? 'Show less' : `Show all ${items.length}`}
          </button>
        </Show>
      </div>
    </section>
  );
}
