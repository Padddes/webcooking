import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { escapeHtml, html, inline, raw } from '../build/lib/html.ts';
import { arr, ContentError, href, obj, oneOf, optional, slug, str } from '../build/lib/schema.ts';

describe('html templating', () => {
  test('escapes interpolated text', () => {
    assert.equal(html`<p>${'<script>alert("x")</script>'}</p>`.value, '<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>');
  });

  test('does not double-escape nested templates or raw markup', () => {
    assert.equal(html`<div>${html`<b>${'a&b'}</b>`}${raw('<i>ok</i>')}</div>`.value, '<div><b>a&amp;b</b><i>ok</i></div>');
  });

  test('skips null, undefined and booleans; joins arrays', () => {
    assert.equal(html`${null}${undefined}${false}${['a', 'b']}`.value, 'ab');
  });

  test('escapeHtml handles quotes', () => {
    assert.equal(escapeHtml(`"'`), '&quot;&#39;');
  });
});

describe('inline formatting', () => {
  test('renders bold, italic, code and links', () => {
    assert.equal(
      inline('**b** *i* `c` [x](/poe/)').value,
      '<strong>b</strong> <em>i</em> <code>c</code> <a href="/poe/">x</a>',
    );
  });

  test('external links open safely in a new tab', () => {
    assert.match(inline('[w](https://example.com)').value, /rel="noopener" target="_blank"/);
  });

  test('neutralises javascript: links and raw HTML', () => {
    assert.equal(inline('[x](javascript:alert(1))').value.includes('javascript:'), false);
    assert.equal(inline('<img src=x onerror=alert(1)>').value.includes('<img'), false);
  });
});

describe('content schema', () => {
  const page = obj({ id: slug, title: str({ min: 1 }), link: optional(href), kind: oneOf('a', 'b'), tags: arr(str()) });

  test('accepts valid data and trims text', () => {
    const out = page({ id: 'map-regex', title: '  Hi ', kind: 'a', tags: [] }, 'x');
    assert.equal(out.title, 'Hi');
  });

  test('reports the exact path of a problem', () => {
    assert.throws(() => page({ id: 'ok', title: 'T', kind: 'a', tags: [1] }, 'file.json'), {
      name: 'Error',
      message: /file\.json\.tags\[0\]: expected text/,
    });
  });

  test('rejects unknown fields, bad slugs, bad links and bad enum values', () => {
    assert.throws(() => page({ id: 'ok', title: 'T', kind: 'a', tags: [], extra: 1 }, 'f'), ContentError);
    assert.throws(() => page({ id: 'Not A Slug', title: 'T', kind: 'a', tags: [] }, 'f'), ContentError);
    assert.throws(() => page({ id: 'ok', title: 'T', kind: 'a', tags: [], link: 'http://x' }, 'f'), ContentError);
    assert.throws(() => page({ id: 'ok', title: 'T', kind: 'c', tags: [] }, 'f'), ContentError);
  });
});
