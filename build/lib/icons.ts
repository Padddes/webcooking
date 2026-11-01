import { raw, type SafeHtml } from './html.ts';

// Simple original line icons (24×24, stroke = currentColor). Decorative only:
// every use sits next to a visible or screen-reader label.
const paths: Record<string, string> = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  poe: '<path d="M12 3 5 9l7 12 7-12z"/><path d="M5 9h14M12 3v18M8.5 9 12 21l3.5-12"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
  tool: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  glossary: '<path d="M4 4h10l6 6v10H4z"/><path d="M14 4v6h6M8 13h8M8 17h5"/>',
  about: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  collapse: '<path d="M15 6l-6 6 6 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

export function icon(name: string, className = 'icon'): SafeHtml {
  const body = paths[name];
  if (!body) throw new Error(`Unknown icon "${name}"`);
  return raw(
    `<svg class="${className}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`,
  );
}
