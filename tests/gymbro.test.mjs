import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
test('Gymbro entry and fonts resolve under /gymbro/', () => {
  const html = readFileSync(new URL('gymbro/index.html', root), 'utf8');
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  assert.ok(urls.length >= 3);
  for (const url of urls) {
    assert.ok(url.startsWith('/gymbro/') || url.startsWith('./'), url);
    assert.ok(existsSync(new URL(url.startsWith('/') ? url.slice(1) : 'gymbro/' + url, root)), url);
  }
  assert.ok(!html.includes('/src/'));
  const css = readFileSync(new URL(urls.find(u => u.endsWith('.css')).slice(1), root), 'utf8');
  for (const [, url] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (url.startsWith('data:')) continue;
    assert.ok(url.startsWith('/gymbro/') || url.startsWith('./'), url);
    assert.ok(existsSync(new URL(url.startsWith('/') ? url.slice(1) : 'gymbro/' + url, root)), url);
  }
});

