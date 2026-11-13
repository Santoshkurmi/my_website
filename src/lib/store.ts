import { createSignal } from 'solid-js';

/** Global UI state shared between sections, nav and terminal. */
export const [gravity, setGravity] = createSignal(false);
export const [terminalOpen, setTerminalOpen] = createSignal(false);
export const [openProject, setOpenProject] = createSignal<string | null>(null);
export const [activeSection, setActiveSection] = createSignal('');

export function scrollToId(id: string) {
  const el = document.getElementById(id.replace(/^#/, ''));
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
