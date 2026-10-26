import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const pub = new URL('../', import.meta.url);

test('every local asset referenced by index.html exists', async () => {
  const html = await readFile(new URL('index.html', pub), 'utf8');
  const refs = [...html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)].map(m => m[1]).filter(r => !/^https?:/.test(r));
  assert.ok(refs.length > 0);
  for (const ref of refs) await access(new URL(ref, pub));
});

test('page does not claim a launch date or collect signups', async () => {
  const html = await readFile(new URL('index.html', pub), 'utf8');
  assert.match(html, /Coming soon/i);
  assert.doesNotMatch(html, /<form/i);
});
