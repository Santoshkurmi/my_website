import { For, onMount, type Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { sections, site } from './config';
import type { SectionConfig } from './types';
import Atmosphere from './components/Atmosphere';
import Nav from './components/Nav';
import Terminal from './components/Terminal';
import ProjectModal from './components/ProjectModal';
import Hero from './sections/Hero';
import About from './sections/About';
import Ecosystem from './sections/Ecosystem';
import Projects from './sections/Projects';
import Archive from './sections/Archive';
import Languages from './sections/Languages';
import Timeline from './sections/Timeline';
import Contact, { Marquee, Footer } from './sections/Contact';
import { loadGitHub } from './lib/github';

/** section "type" in site.json → component. Add your own sections here. */
const registry: Record<string, Component<{ section: SectionConfig; index: number }>> = {
  hero: Hero,
  about: About,
  ecosystem: Ecosystem,
  projects: Projects,
  archive: Archive,
  languages: Languages,
  timeline: Timeline,
  marquee: Marquee,
  contact: Contact,
};

// Numbered sections (01, 02, …) follow their order in site.json; hero & marquees are not numbered.
const unnumbered = new Set(['hero', 'marquee']);
let n = 0;
const numbered = sections.map((s) => ({ s, index: unnumbered.has(s.type) ? 0 : ++n }));

export default function App() {
  onMount(() => {
    loadGitHub();
    // Honour a #hash on first load once the layout exists.
    if (location.hash.length > 1) {
      requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    }
  });

  return (
    <>
      <Atmosphere />
      {site.nav.show && <Nav />}
      <main style={{ '--maxw': `${site.layout.maxWidth}px` }}>
        <For each={numbered}>
          {({ s, index }) =>
            registry[s.type] ? (
              <Dynamic component={registry[s.type]} section={s} index={index} />
            ) : (
              (console.warn(`[portfolio] unknown section type "${s.type}" in site.json`), null)
            )
          }
        </For>
      </main>
      <Footer />
      <Terminal />
      <ProjectModal />
    </>
  );
}
