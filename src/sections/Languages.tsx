import { createSignal, For, Show } from 'solid-js';
import { skills } from '../config';
import type { SectionConfig, Element } from '../types';
import { SectionHead } from '../components/bits';
import { reveal } from '../lib/reveal';

export default function Languages(props: { section: SectionConfig; index: number }) {
  const [sel, setSel] = createSignal<Element>(skills.elements[0]);
  const [group, setGroup] = createSignal<string | null>(null);
  const variant = props.section.variant ?? 'periodic';
  const groupLabel = (id: string) => skills.groups.find((g) => g.id === id)?.label ?? id;

  return (
    <section id={props.section.id} class={`section langs langs--${variant}`}>
      <div class="wrap">
        <SectionHead index={props.index} eyebrow={skills.eyebrow} title={skills.title} subtitle={skills.subtitle} />

        <div class="langs__legend mono" ref={reveal}>
          <For each={skills.groups}>
            {(g) => (
              <button
                class={`legend legend--${g.id}`}
                classList={{ on: group() === g.id }}
                onPointerEnter={() => setGroup(g.id)}
                onPointerLeave={() => setGroup(null)}
                onClick={() => setGroup(group() === g.id ? null : g.id)}
              >
                <i /> {g.label}
              </button>
            )}
          </For>
        </div>

        <div class="langs__layout">
          <div class="ptable" classList={{ 'ptable--filter': !!group() }}>
            <For each={skills.elements}>
              {(e, i) => (
                <button
                  class={`el el--${e.group}`}
                  classList={{ on: sel().symbol === e.symbol, dim: !!group() && group() !== e.group }}
                  style={{ '--c': e.color }}
                  onPointerEnter={() => setSel(e)}
                  onFocus={() => setSel(e)}
                  onClick={() => setSel(e)}
                  ref={(el) => reveal(el, i() * 30)}
                  aria-label={`${e.name}, ${e.mass} repositories`}
                >
                  <span class="el__n mono">{i() + 1}</span>
                  <span class="el__m mono">{e.mass}</span>
                  <span class="el__sym">{e.symbol}</span>
                  <span class="el__name">{e.name}</span>
                </button>
              )}
            </For>
          </div>

          <Show when={variant !== 'compact'}>
            <aside class="elcard" style={{ '--c': sel().color }} ref={(el) => reveal(el, 100)}>
              <div class="elcard__tile">
                <span class="mono elcard__n">{skills.elements.indexOf(sel()) + 1}</span>
                <span class="elcard__sym">{sel().symbol}</span>
                <span class="mono elcard__m">{sel().mass}</span>
              </div>
              <div class="elcard__name">{sel().name}</div>
              <div class="elcard__meta mono">
                <span>{groupLabel(sel().group)}</span>
                <span>since {sel().since}</span>
                <span>{sel().mass} repo{sel().mass === 1 ? '' : 's'}</span>
              </div>
              <p class="elcard__note">{sel().note}</p>
              <div class="elcard__used mono">Found in</div>
              <ul>
                <For each={sel().usedIn}>{(u) => <li>{u}</li>}</For>
              </ul>
            </aside>
          </Show>
        </div>

        <div class="series">
          <For each={skills.series}>
            {(s, si) => (
              <div class="series__row" ref={(el) => reveal(el, si() * 80)}>
                <span class="series__label mono">
                  {'*'.repeat(si() + 1)} {s.label}
                </span>
                <div class="series__items">
                  <For each={s.items}>{(it) => <span class="series__item">{it}</span>}</For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
