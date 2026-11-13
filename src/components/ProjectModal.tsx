import { createEffect, For, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { projects, ghUrl, colorFor } from '../config';
import { openProject, setOpenProject } from '../lib/store';
import { gh } from '../lib/github';
import { Icon } from '../lib/icons';
import GenCover from './GenCover';

export default function ProjectModal() {
  const project = () => projects.items.find((p) => p.id === openProject());
  const close = () => setOpenProject(null);

  createEffect(() => {
    if (!project()) return;
    document.documentElement.classList.add('locked');
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    addEventListener('keydown', key);
    onCleanup(() => {
      removeEventListener('keydown', key);
      document.documentElement.classList.remove('locked');
    });
  });

  return (
    <Show when={project()}>
      {(p) => {
        const stat = () => (p().repo ? gh().repos[p().repo!.toLowerCase()] : undefined);
        return (
          <Portal>
            <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
              <article class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <button class="icon-btn modal__close" onClick={close} aria-label="Close" autofocus>
                  <Icon name="close" />
                </button>
                <GenCover class="modal__cover" seed={p().id} pattern={p().cover?.pattern} glyph={p().cover?.glyph} image={p().cover?.image} />
                <div class="modal__body">
                  <div class="modal__meta mono">
                    <span class="dot" style={{ background: colorFor(p().language) }} />
                    {p().language} · {p().year}
                    <Show when={stat()?.stars}>
                      <span class="modal__stars">
                        <Icon name="star" size={13} /> {stat()!.stars}
                      </span>
                    </Show>
                  </div>
                  <h3 id="modal-title" class="modal__title">{p().name}</h3>
                  <p class="modal__tagline">{p().tagline}</p>
                  <p class="modal__desc">{p().description}</p>
                  <Show when={p().highlights?.length}>
                    <ul class="modal__list">
                      <For each={p().highlights}>{(h) => <li>{h}</li>}</For>
                    </ul>
                  </Show>
                  <div class="chips">
                    <For each={p().tech}>{(t) => <span class="chip">{t}</span>}</For>
                  </div>
                  <div class="modal__links">
                    <Show when={p().repo}>
                      <a class="btn btn--primary" href={ghUrl(p().repo)} target="_blank" rel="noopener">
                        <Icon name="github" /> View source
                      </a>
                    </Show>
                    <For each={p().links}>
                      {(l) => (
                        <a class="btn" href={l.href} target="_blank" rel="noopener">
                          {l.label} <Icon name="arrow" size={15} />
                        </a>
                      )}
                    </For>
                  </div>
                </div>
              </article>
            </div>
          </Portal>
        );
      }}
    </Show>
  );
}
