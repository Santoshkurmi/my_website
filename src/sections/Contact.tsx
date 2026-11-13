import { For } from 'solid-js';
import { profile, site } from '../config';
import type { SectionConfig } from '../types';
import { Magnetic } from '../components/bits';
import { reveal } from '../lib/reveal';
import { Rich } from '../lib/text';
import { Icon } from '../lib/icons';
import { setTerminalOpen } from '../lib/store';

export function Marquee(props: { section: SectionConfig }) {
  const items = (props.section.props?.items as string[] | undefined) ?? [];
  const speed = (props.section.props?.speed as number | undefined) ?? 40;
  const reverse = !!props.section.props?.reverse;
  const row = () => (
    <div class="marquee__row" aria-hidden="true">
      <For each={items}>
        {(t, i) => (
          <>
            <span class="marquee__item" classList={{ 'marquee__item--outline': i() % 2 === 1 }}>
              {t}
            </span>
            <span class="marquee__star">✦</span>
          </>
        )}
      </For>
    </div>
  );
  return (
    <section id={props.section.id} class="marquee" aria-label={items.join(', ')}>
      <div class="marquee__track" classList={{ 'marquee__track--rev': reverse }} style={{ '--dur': `${speed}s` }}>
        {row()}
        {row()}
      </div>
    </section>
  );
}

export default function Contact(props: { section: SectionConfig; index: number }) {
  const c = profile.contact;
  const socials = profile.socials.filter((s) => s.enabled !== false);
  return (
    <section id={props.section.id} class="section contact">
      <div class="wrap">
        <div class="contact__eyebrow mono" ref={reveal}>
          <span class="shead__num">{String(props.index).padStart(2, '0')}</span>
          <span class="shead__line" /> {c.eyebrow}
        </div>
        <h2 class="contact__title" ref={(el) => reveal(el, 60)}>
          <Rich text={c.title} />
        </h2>
        <p class="contact__text" ref={(el) => reveal(el, 120)}>
          {c.text}
        </p>
        <div class="contact__cta" ref={(el) => reveal(el, 180)}>
          <Magnetic strength={0.35}>
            <a class="btn btn--primary btn--xl" href={c.primary.href} target="_blank" rel="noopener">
              <Icon name="github" size={20} /> {c.primary.label} <Icon name="arrow" size={18} />
            </a>
          </Magnetic>
        </div>
        <div class="socials">
          <For each={socials}>
            {(s, i) => (
              <a class="social" href={s.href} target="_blank" rel="noopener" ref={(el) => reveal(el, i() * 70)}>
                <span class="social__icon">
                  <Icon name={s.icon} size={22} />
                </span>
                <span class="social__text">
                  <span class="social__label">{s.label}</span>
                  <span class="social__handle mono">{s.handle}</span>
                </span>
                <Icon name="arrow" size={16} class="social__arrow" />
              </a>
            )}
          </For>
        </div>
      </div>

    </section>
  );
}

/** Always rendered, even if the contact section is disabled. */
export function Footer() {
  return (
    <footer class="footer">
      <div class="wrap footer__inner">
        <div class="footer__big" aria-hidden="true">
          {profile.firstName.toLowerCase()}
          <span class="em">.</span>
        </div>
        <div class="footer__row mono">
          <span>
            © {new Date().getFullYear()} {profile.name} · {profile.location} 🇳🇵
          </span>
          <span>{site.footer.builtWith}</span>
        </div>
        <div class="footer__row mono footer__muted">
          <span>{site.footer.note}</span>
          <button class="link" onClick={() => setTerminalOpen(true)}>
            {site.footer.hint}
          </button>
        </div>
      </div>
    </footer>
  );
}
