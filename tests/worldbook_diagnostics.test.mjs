import assert from 'node:assert/strict';
import test, { beforeEach, afterEach } from 'node:test';
import { getActiveGlobalWorldBookNames, getCharacterAdditionalWorldBookNames, loadGlobalWorldBook } from '../scripts/state.js';

const keys = ['__bsBtWorldInfoModuleOverride__', 'selected_world_info', 'world_info', 'world_info_settings', 'power_user',
  'parent', 'document', 'getLorebookSettings', 'getCharLorebooks', 'TavernHelper', 'SillyTavern', 'ST_API', '__bs_biotracker_worldbook_discovery__'];
const original = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
beforeEach(() => {
  for (const key of keys) delete globalThis[key];
  globalThis.__bsBtWorldInfoModuleOverride__ = null;
});
afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
});
const trace = kind => globalThis.__bs_biotracker_worldbook_discovery__?.[kind];

test('unavailable module can resolve global books and diagnostics contain no book text or names', async () => {
  globalThis.world_info = { globalSelect: ['PRIVATE_BOOK_NAME'] };
  assert.deepEqual(await getActiveGlobalWorldBookNames(), ['PRIVATE_BOOK_NAME']);
  assert.equal(trace('global').status, 'resolved');
  assert.equal(trace('global').nameCount, 1);
  assert.ok(trace('global').checks.some(check => check.source === 'global' && check.nameCount === 1));
  assert.doesNotMatch(JSON.stringify(trace('global')), /PRIVATE_BOOK_NAME/);
});

test('an explicitly empty source differs from a missing source', async () => {
  assert.deepEqual(await getActiveGlobalWorldBookNames(), []);
  assert.equal(trace('global').status, 'unavailable');
  globalThis.__bsBtWorldInfoModuleOverride__ = { selected_world_info: [] };
  assert.deepEqual(await getActiveGlobalWorldBookNames(), []);
  assert.equal(trace('global').status, 'empty');
});

test('failed helper reads remain distinguishable from an empty selection', async () => {
  globalThis.getLorebookSettings = async () => { throw new Error('private detail'); };
  assert.deepEqual(await getActiveGlobalWorldBookNames(), []);
  assert.equal(trace('global').status, 'failed');
  assert.ok(trace('global').checks.some(check => check.source === 'api' && check.status === 'failed'));
  assert.doesNotMatch(JSON.stringify(trace('global')), /private detail/);
});

test('parent charLore and bound helper methods preserve their source and main-book exclusion', async () => {
  const ctx = { characterId: 0, characters: [{ name: 'Alice', avatar: 'Alice.png', data: { extensions: { world: 'Primary' } } }] };
  globalThis.parent = { world_info: { charLore: [{ name: 'Alice', extraBooks: ['Extra', 'Primary'] }] } };
  globalThis.TavernHelper = {
    marker: 'bound',
    getCharLorebooks() { assert.equal(this.marker, 'bound'); return { additional: ['Helper'] }; },
  };
  assert.deepEqual(await getCharacterAdditionalWorldBookNames(ctx), ['Helper', 'Extra']);
  assert.equal(trace('character').status, 'resolved');
  assert.ok(trace('character').checks.some(check => check.source === 'parent'));
});

test('a null host load still tries supported worldbook API fallbacks', async () => {
  const book = { entries: [{ content: 'PRIVATE_CONTENT' }] };
  const scopes = [];
  const ctx = { loadWorldInfo: async () => null };
  globalThis.ST_API = { worldBook: { get: async ({ scope }) => { scopes.push(scope); return scope === 'character' ? { worldBook: book } : null; } } };
  assert.deepEqual(await loadGlobalWorldBook(ctx, 'Extra'), book);
  assert.deepEqual(scopes, ['global', 'character']);
  assert.equal(trace('load').status, 'resolved');
  assert.doesNotMatch(JSON.stringify(trace('load')), /PRIVATE_CONTENT/);
});
