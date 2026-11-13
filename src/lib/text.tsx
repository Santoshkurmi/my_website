import { For, type JSX } from 'solid-js';

/** Renders "Hello *world*" with the *emphasised* parts in the serif-gradient style. */
export function Rich(props: { text: string }): JSX.Element {
  const parts = () => props.text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <For each={parts()}>
      {(p) => (p.startsWith('*') && p.endsWith('*') ? <em class="em">{p.slice(1, -1)}</em> : <>{p}</>)}
    </For>
  );
}

export const plain = (text: string) => text.replace(/\*/g, '');
