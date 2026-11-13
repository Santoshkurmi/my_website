import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { sections, site, themes } from '../config';
import { activeSection, setActiveSection, setTerminalOpen, scrollToId } from '../lib/store';
import { switchTheme, themeName, themeNames } from '../lib/theme';
import { Icon } from '../lib/icons';

export default function Nav() {
  const links = sections.filter((s) => s.nav);
  const [scrolled, setScrolled] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [menu, setMenu] = createSignal(false);
  const [palette, setPalette] = createSignal(false);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  onMount(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        setScrolled(scrollY > 40);
        setProgress(max > 0 ? scrollY / max : 0);
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Highlight the section whose top half is on screen.
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setActiveSection(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    const closeAll = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.nav')) {
        setMenu(false);
        setPalette(false);
      }
    };
    addEventListener('click', closeAll);
    onCleanup(() => {
      removeEventListener('scroll', onScroll);
      removeEventListener('click', closeAll);
      io.disconnect();
    });
  });

  const go = (e: MouseEvent, id: string) => {
    e.preventDefault();
    setMenu(false);
    scrollToId(id);
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <header class="nav" classList={{ 'nav--scrolled': scrolled(), 'nav--open': menu() }}>
      <div class="nav__progress" style={{ transform: `scaleX(${progress()})` }} />
      <nav class="nav__pill" aria-label="Main">
        <a class="nav__logo" href="#" onClick={(e) => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span class="nav__logo-gem" aria-hidden="true" />
          <span>{site.nav.logo}</span>
        </a>
        <ul class="nav__links">
          <For each={links}>
            {(s) => (
              <li>
                <a href={`#${s.id}`} classList={{ active: activeSection() === s.id }} onClick={(e) => go(e, s.id)}>
                  {s.nav}
                </a>
              </li>
            )}
          </For>
        </ul>
        <div class="nav__actions">
          <Show when={site.theme.allowSwitch}>
            <div class="nav__theme">
              <button
                class="icon-btn"
                aria-label="Change theme"
                title="Change theme"
                onClick={() => setPalette(!palette())}
              >
                <span class="swatch" />
              </button>
              <Show when={palette()}>
                <div class="nav__palette" role="menu">
                  <For each={themeNames()}>
                    {(n) => (
                      <button
                        role="menuitemradio"
                        aria-checked={themeName() === n}
                        classList={{ on: themeName() === n }}
                        onClick={(e) => {
                          setPalette(false);
                          switchTheme(n, e.clientX, e.clientY);
                        }}
                      >
                        <span class="dots">
                          <i style={{ background: themes[n].accent }} />
                          <i style={{ background: themes[n].accent2 }} />
                          <i style={{ background: themes[n].accent3 }} />
                        </span>
                        {themes[n].label}
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>
          <Show when={site.nav.terminalButton}>
            <button class="nav__kbd" onClick={() => setTerminalOpen(true)} aria-label="Open terminal">
              <Icon name="terminal" size={15} />
              <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
            </button>
          </Show>
          <button class="icon-btn nav__burger" aria-label="Menu" aria-expanded={menu()} onClick={() => setMenu(!menu())}>
            <Icon name={menu() ? 'close' : 'menu'} />
          </button>
        </div>
      </nav>
      <Show when={menu()}>
        <div class="nav__sheet">
          <For each={links}>
            {(s, i) => (
              <a href={`#${s.id}`} style={{ '--i': i() }} onClick={(e) => go(e, s.id)}>
                <span class="mono">0{i() + 1}</span>
                {s.nav}
              </a>
            )}
          </For>
        </div>
      </Show>
    </header>
  );
}
