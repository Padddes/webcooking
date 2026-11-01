// Minimal, safe HTML templating.
// Every interpolated value is escaped unless it is already SafeHtml
// (produced by `html` or `raw`). Arrays are flattened and joined.

export class SafeHtml {
  readonly value: string;
  constructor(value: string) {
    this.value = value;
  }
  toString(): string {
    return this.value;
  }
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

type Interpolation = SafeHtml | string | number | boolean | null | undefined | Interpolation[];

function render(value: Interpolation): string {
  if (value === null || value === undefined || value === false || value === true) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHtml(String(value));
}

export function html(strings: TemplateStringsArray, ...values: Interpolation[]): SafeHtml {
  let out = strings[0] ?? '';
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + (strings[i + 1] ?? '');
  }
  return new SafeHtml(out);
}

/** Mark trusted markup (e.g. inline SVG icons from this repository) as safe. */
export function raw(markup: string): SafeHtml {
  return new SafeHtml(markup);
}

/** Render a small inline-text subset: **bold**, *italic*, `code` and [label](url). */
export function inline(text: string): SafeHtml {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const safeHref = /^(https?:\/\/|\/|#|mailto:)/.test(href) ? href : '#';
    const external = /^https?:\/\//.test(safeHref);
    return `<a href="${safeHref}"${external ? ' rel="noopener" target="_blank"' : ''}>${label}</a>`;
  });
  return new SafeHtml(out);
}
