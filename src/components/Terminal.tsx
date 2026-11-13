import { createEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import { Portal } from 'solid-js/web';
import { terminal, profile, projects, sections, ecosystem, themes, ghUrl } from '../config';
import { terminalOpen, setTerminalOpen, setGravity, gravity, setOpenProject, scrollToId } from '../lib/store';
import { switchTheme, themeName, themeNames } from '../lib/theme';
import { live } from '../lib/github';

type Part = { t: string; c?: string; href?: string };
type Line = { kind: 'text'; parts: Part[] } | { kind: 'cmd'; text: string } | { kind: 'neofetch' };

const txt = (t: string, c?: string): Line => ({ kind: 'text', parts: [{ t, c }] });

const GEM_ART = String.raw`
      ___________
     /\    |    /\
    /  \   |   /  \
   /____\__|__/____\
   \     \   /     /
    \     \ /     /
     \     V     /
      \    |    /
       \   |   /
        \  |  /
         \ | /
          \|/`.slice(1);

export default function Terminal() {
  const [lines, setLines] = createSignal<Line[]>([]);
  const [input, setInput] = createSignal('');
  const history: string[] = [];
  let hIndex = -1;
  let inputEl!: HTMLInputElement;
  let body!: HTMLDivElement;
  const prompt = `${terminal.user}@${terminal.host}`;

  const builtins: Record<string, { d: string; run: (args: string[]) => Line[] | void }> = {
    help: {
      d: 'list commands',
      run: () => {
        const all = [
          ...Object.entries(builtins).map(([k, v]) => [k, v.d]),
          ...terminal.commands.filter((c) => !c.hidden).map((c) => [c.name, c.description]),
        ];
        return [
          txt('Available commands:', 'accent'),
          ...all.map(([k, d]) => ({ kind: 'text', parts: [{ t: k.padEnd(14), c: 'cyan' }, { t: d, c: 'muted' }] }) as Line),
        ];
      },
    },
    whoami: { d: 'who is this guy', run: () => [txt(profile.name, 'accent'), txt(profile.intro), txt(`📍 ${profile.location}`, 'muted')] },
    about: { d: 'the longer version', run: () => [txt(profile.about.statement)] },
    neofetch: { d: 'system info, but it is me', run: () => [{ kind: 'neofetch' }] },
    ls: {
      d: 'ls [projects|sections]',
      run: (a) =>
        a[0] === 'sections'
          ? sections.map((s) => txt(`  ${s.id.padEnd(16)} ${s.type}`, 'cyan'))
          : [
              txt('projects/', 'accent'),
              ...projects.items.map((p) => ({ kind: 'text', parts: [{ t: `  ${p.id.padEnd(20)}`, c: 'cyan' }, { t: p.tagline, c: 'muted' }] }) as Line),
              txt("Try: open <name>", 'muted'),
            ],
    },
    open: {
      d: 'open <project>',
      run: (a) => {
        const q = a.join(' ').toLowerCase();
        if (!q) return [txt('usage: open <project>   (see ls)', 'muted')];
        if (q === 'antigem') {
          close();
          setTimeout(() => scrollToId('antigem'), 50);
          return;
        }
        const p = projects.items.find((p) => p.id === q || p.name.toLowerCase() === q || p.id.startsWith(q));
        if (!p) return [txt(`open: ${q}: no such project`, 'red')];
        close();
        setTimeout(() => setOpenProject(p.id), 120);
      },
    },
    goto: {
      d: 'goto <section>',
      run: (a) => {
        const s = sections.find((s) => s.id === a[0] || s.type === a[0] || s.nav?.toLowerCase() === a[0]?.toLowerCase());
        if (!s) return [txt(`goto: sections: ${sections.map((s) => s.id).join(', ')}`, 'muted')];
        close();
        setTimeout(() => scrollToId(s.id), 50);
      },
    },
    antigem: {
      d: 'the flagship',
      run: () => [
        txt(`◆ AntiGem: ${ecosystem.tagline}`, 'accent'),
        txt(ecosystem.description),
        txt(`★ ${live('repo:antigem:stars', 123)} stars · ⑂ ${live('repo:antigem:forks', 67)} forks`, 'cyan'),
        { kind: 'text', parts: [{ t: '→ ', c: 'muted' }, { t: ghUrl('antigem'), href: ghUrl('antigem') }] },
      ],
    },
    gravity: {
      d: 'gravity [on|off]',
      run: (a) => {
        const on = a[0] ? a[0] === 'on' : !gravity();
        close();
        scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setGravity(on), 500);
      },
    },
    theme: {
      d: 'theme [name]',
      run: (a) => {
        if (!a[0]) return [txt(`themes: ${themeNames().map((n) => (n === themeName() ? `[${n}]` : n)).join('  ')}`)];
        if (!themes[a[0]]) return [txt(`theme: unknown theme '${a[0]}'`, 'red')];
        switchTheme(a[0]);
        return [txt(`Switched to ${themes[a[0]].label}.`, 'accent')];
      },
    },
    socials: {
      d: 'where to find me',
      run: () =>
        profile.socials
          .filter((s) => s.enabled !== false)
          .map((s) => ({ kind: 'text', parts: [{ t: s.label.padEnd(22), c: 'cyan' }, { t: s.href, href: s.href }] }) as Line),
    },
    contact: { d: 'say hi', run: () => { close(); setTimeout(() => scrollToId('contact'), 50); } },
    sudo: {
      d: 'sudo hire santosh',
      run: (a) => {
        if (!a.join(' ').includes('hire')) return [txt(`${terminal.user} is not in the sudoers file. This incident will be reported. 👀`, 'red')];
        setTimeout(() => {
          close();
          scrollToId('contact');
        }, 1600);
        return [txt('[sudo] password for recruiter: ********', 'muted'), txt('✔ Permission granted. Excellent decision.', 'accent'), txt('Opening contact...', 'muted')];
      },
    },
    echo: { d: 'echo text', run: (a) => [txt(a.join(' '))] },
    date: { d: 'local time', run: () => [txt(new Date().toString())] },
    clear: { d: 'clear the screen', run: () => { setLines([]); } },
    exit: { d: 'close the terminal', run: () => { close(); } },
  };

  const close = () => setTerminalOpen(false);

  const run = (raw: string) => {
    const cmd = raw.trim();
    setLines((l) => [...l, { kind: 'cmd', text: cmd }]);
    if (!cmd) return;
    history.unshift(cmd);
    hIndex = -1;
    const [name, ...args] = cmd.split(/\s+/);
    const key = name.toLowerCase();
    const custom = terminal.commands.find((c) => c.name === key);
    let out: Line[] | void;
    if (builtins[key]) out = builtins[key].run(args);
    else if (custom) {
      out = custom.output.map((o) => txt(o));
      if (custom.href) setTimeout(() => open(custom.href, '_blank', 'noopener'), 500);
    } else out = [txt(`${key}: command not found. Type 'help'.`, 'red')];
    if (out && out.length) setLines((l) => [...l, ...out]);
  };

  const complete = () => {
    const v = input();
    const names = [...Object.keys(builtins), ...terminal.commands.map((c) => c.name)];
    const parts = v.split(' ');
    if (parts.length === 1) {
      const m = names.filter((n) => n.startsWith(v));
      if (m.length === 1) setInput(m[0] + ' ');
      else if (m.length > 1) setLines((l) => [...l, txt(m.join('  '), 'muted')]);
    } else if (parts[0] === 'open' || parts[0] === 'goto' || parts[0] === 'theme') {
      const pool = parts[0] === 'open' ? ['antigem', ...projects.items.map((p) => p.id)] : parts[0] === 'goto' ? sections.map((s) => s.id) : themeNames();
      const m = pool.filter((n) => n.startsWith(parts[1]));
      if (m.length === 1) setInput(`${parts[0]} ${m[0]}`);
      else if (m.length > 1) setLines((l) => [...l, txt(m.join('  '), 'muted')]);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      run(input());
      setInput('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIndex < history.length - 1) setInput(history[++hIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      hIndex = Math.max(-1, hIndex - 1);
      setInput(hIndex < 0 ? '' : history[hIndex]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  onMount(() => {
    setLines(terminal.welcome.map((w) => txt(w, 'muted')));
    const global = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA/.test((e.target as HTMLElement)?.tagName) && e.target !== inputEl;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '`' && !typing)) {
        e.preventDefault();
        setTerminalOpen(!terminalOpen());
      } else if (e.key === 'Escape' && terminalOpen()) setTerminalOpen(false);
    };
    addEventListener('keydown', global);
    onCleanup(() => removeEventListener('keydown', global));
  });

  createEffect(() => {
    if (terminalOpen()) {
      document.documentElement.classList.add('locked');
      queueMicrotask(() => inputEl?.focus());
    } else document.documentElement.classList.remove('locked');
  });

  createEffect(() => {
    lines();
    queueMicrotask(() => body && (body.scrollTop = body.scrollHeight));
  });

  const facts = () => [
    ['Name', profile.name],
    ['Location', profile.location],
    ['OS', 'Android + Arch (Hyprland)'],
    ['Shell', 'zsh, inside Termux'],
    ['Editor', 'Neovim / AntiGem'],
    ['Flagship', `AntiGem ★${live('repo:antigem:stars', 123)}`],
    ['Repos', String(live('user:public_repos', 71))],
    ['Theme', themes[themeName()].label],
    ['Uptime', `${new Date().getFullYear() - 2019} years on GitHub`],
  ];

  return (
    <Show when={terminalOpen()}>
      <Portal>
        <div class="term-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
          <div class="term" role="dialog" aria-modal="true" aria-label="Terminal">
            <div class="term__bar">
              <span class="term__dots">
                <i onClick={close} title="close" />
                <i />
                <i />
              </span>
              <span class="term__title">{prompt}: ~</span>
              <span class="term__hint">esc to close</span>
            </div>
            <div class="term__body" ref={body} onClick={() => inputEl.focus()}>
              <For each={lines()}>
                {(l) => (
                  <Switch>
                    <Match when={l.kind === 'cmd' && l}>
                      {(c) => (
                        <div class="term__line">
                          <span class="term__prompt">{prompt}</span>
                          <span class="muted">:~$ </span>
                          {c().text}
                        </div>
                      )}
                    </Match>
                    <Match when={l.kind === 'neofetch'}>
                      <div class="term__neofetch">
                        <pre class="term__art">{GEM_ART}</pre>
                        <div>
                          <div class="accent">
                            {terminal.user}@{terminal.host}
                          </div>
                          <div class="muted">{'─'.repeat(22)}</div>
                          <For each={facts()}>
                            {([k, v]) => (
                              <div>
                                <span class="cyan">{k}</span>: {v}
                              </div>
                            )}
                          </For>
                          <div class="term__swatches">
                            <i style={{ background: 'var(--accent)' }} />
                            <i style={{ background: 'var(--accent-2)' }} />
                            <i style={{ background: 'var(--accent-3)' }} />
                            <i style={{ background: 'var(--text)' }} />
                            <i style={{ background: 'var(--muted)' }} />
                          </div>
                        </div>
                      </div>
                    </Match>
                    <Match when={l.kind === 'text' && l}>
                      {(t) => (
                        <div class="term__line">
                          <For each={t().parts}>
                            {(p) =>
                              p.href ? (
                                <a class={p.c} href={p.href} target="_blank" rel="noopener">
                                  {p.t}
                                </a>
                              ) : (
                                <span class={p.c}>{p.t}</span>
                              )
                            }
                          </For>
                        </div>
                      )}
                    </Match>
                  </Switch>
                )}
              </For>
              <div class="term__line term__input">
                <span class="term__prompt">{prompt}</span>
                <span class="muted">:~$&nbsp;</span>
                <input
                  ref={inputEl}
                  value={input()}
                  onInput={(e) => setInput(e.currentTarget.value)}
                  onKeyDown={onKey}
                  spellcheck={false}
                  autocomplete="off"
                  autocapitalize="off"
                  aria-label="Terminal input"
                />
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}

