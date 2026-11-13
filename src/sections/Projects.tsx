import { createMemo, createSignal, For, Show } from 'solid-js';
import { projects, colorFor, ghUrl } from '../config';
import type { SectionConfig } from '../types';
import { SectionHead, TiltCard } from '../components/bits';
import GenCover from '../components/GenCover';
import { setOpenProject } from '../lib/store';
import { repoStars } from '../lib/github';
import { reveal } from '../lib/reveal';
import { Icon } from '../lib/icons';

export default function Projects(props: { section: SectionConfig; index: number }) {
  const [cat, setCat] = createSignal('all');
  const used = new Set(projects.items.map((p) => p.category));
  const cats = projects.categories.filter((c) => c.id === 'all' || used.has(c.id));
  const list = createMemo(() => projects.items.filter((p) => cat() === 'all' || p.category === cat()));
  const variant = props.section.variant ?? 'bento';
  const catLabel = (id: string) => projects.categories.find((c) => c.id === id)?.label ?? id;

  return (
    <section id={props.section.id} class="section work">
      <div class="wrap">
        <SectionHead index={props.index} eyebrow={projects.eyebrow} title={projects.title} subtitle={projects.subtitle} />

        <div class="filters" role="tablist" ref={reveal}>
          <For each={cats}>
            {(c) => (
              <button role="tab" aria-selected={cat() === c.id} classList={{ on: cat() === c.id }} onClick={() => setCat(c.id)}>
                {c.label}
                <span class="filters__n">
                  {c.id === 'all' ? projects.items.length : projects.items.filter((p) => p.category === c.id).length}
                </span>
              </button>
            )}
          </For>
        </div>

        <div class={`bento bento--${variant}`}>
          <For each={list()}>
            {(p, i) => (
              <TiltCard
                class={`pcard pcard--${variant === 'bento' ? p.size ?? 'sm' : 'sm'}`}
                onClick={() => setOpenProject(p.id)}
                label={`${p.name}: ${p.tagline}`}
                ref={(el) => reveal(el, (i() % 4) * 60)}
              >
                <GenCover seed={p.id} pattern={p.cover?.pattern} glyph={p.cover?.glyph} image={p.cover?.image} />
                <div class="pcard__shade" />
                <div class="pcard__top mono">
                  <span>{catLabel(p.category)}</span>
                  <span>{p.year}</span>
                </div>
                <div class="pcard__body">
                  <h3 class="pcard__name">{p.name}</h3>
                  <p class="pcard__tag">{p.tagline}</p>
                  <div class="pcard__foot">
                    <span class="pcard__lang mono">
                      <span class="dot" style={{ background: colorFor(p.language) }} />
                      {p.language}
                    </span>
                    <Show when={repoStars(p.repo) > 0}>
                      <span class="pcard__stars mono">
                        <Icon name="star" size={12} /> {repoStars(p.repo)}
                      </span>
                    </Show>
                    <span class="pcard__chips">
                      <For each={p.tech.slice(0, 3)}>{(t) => <span class="chip chip--sm">{t}</span>}</For>
                    </span>
                  </div>
                </div>
                <span class="pcard__open" aria-hidden="true">
                  <Icon name="arrow" size={18} />
                </span>
              </TiltCard>
            )}
          </For>
        </div>
        <p class="work__more mono" ref={reveal}>
          Want the unfiltered list? <a class="link" href={`${ghUrl()}?tab=repositories`} target="_blank" rel="noopener">All repositories on GitHub <Icon name="arrow" size={13} /></a>
        </p>
      </div>
    </section>
  );
}
