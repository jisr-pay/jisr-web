import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strings } from './i18n.ts';

test('Arabic dictionary defines every English key — no silently untranslated UI', () => {
  const en = Object.keys(strings.en).sort();
  const ar = Object.keys(strings.ar).sort();
  assert.deepEqual(ar, en);
});

test('no translation is empty or whitespace-only', () => {
  for (const lang of ['en', 'ar'] as const) {
    for (const [key, value] of Object.entries(strings[lang])) {
      assert.ok(
        typeof value === 'string' && value.trim().length > 0,
        `strings.${lang}.${key} must be a non-empty string`,
      );
    }
  }
});

test('Arabic copy is actually translated, not copied English', () => {
  const arabic = /[\u0600-\u06FF]/;
  let translated = 0;
  for (const [key, value] of Object.entries(strings.ar)) {
    // Brand names and technical identifiers legitimately stay Latin-script.
    if (/^(appName|send|save|xlm|usd|aed|kes|ngn|beatFeeFlat|of)$/.test(key)) continue;
    if (arabic.test(value)) translated += 1;
    else assert.fail(`strings.ar.${key} contains no Arabic script: "${value}"`);
  }
  assert.ok(translated > 100, `expected the bulk of the dictionary in Arabic, got ${translated}`);
});
