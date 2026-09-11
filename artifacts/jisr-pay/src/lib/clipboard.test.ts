import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyText } from './clipboard.ts';

test('modern clipboard receives the exact hash', async () => {
  let copied = '';
  assert.equal(await copyText('abc123', { writeText: async text => { copied = text; } }), true);
  assert.equal(copied, 'abc123');
});

test('missing browser APIs report failure without throwing', async () => {
  assert.equal(await copyText('abc123', {}), false);
  assert.equal(await copyText('abc123', { writeText: async () => { throw new Error('Permission denied'); } }), false);
});

test('legacy failures remove temporary content and restore keyboard focus', async () => {
  let removed = false;
  let focused = false;
  const field = { value: '', readOnly: false, style: {}, select() {}, remove() { removed = true; } };
  const document = {
    activeElement: { focus() { focused = true; } },
    createElement: () => field,
    body: { appendChild() {} },
    execCommand() { throw new Error('Copy blocked'); },
  } as unknown as Document;
  assert.equal(await copyText('abc123', { document }), false);
  assert.equal(field.value, 'abc123');
  assert.equal(removed, true);
  assert.equal(focused, true);
});
