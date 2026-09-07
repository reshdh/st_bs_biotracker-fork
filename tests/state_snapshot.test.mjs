import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import * as state from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import { isFailedAutoRetryBlocked, runTracker } from '../scripts/tracker.js';

const nativeClone = globalThis.structuredClone;
const nativeFetch = globalThis.fetch;
afterEach(() => {
  globalThis.structuredClone = nativeClone;
  globalThis.fetch = nativeFetch;
  delete globalThis.SillyTavern;
});

const names = ['__proto__', 'constructor', 'prototype', 'toString', '艾拉🌸'];
function context() {
  const ctx = { chatId: 'snapshot-audit', chat: [], extensionSettings: {}, saveSettingsDebounced() {} };
  globalThis.SillyTavern = { getContext: () => ctx };
  return ctx;
}
function character(name) {
  return Object.assign(state.createDefaultFemaleState(name), { initialized: true });
}
function fresh(selected = names) {
  const chat = state.createEmptyChatState();
  for (const name of selected) chat.characters[name] = character(name);
  return chat;
}

for (const useNativeClone of [true, false]) {
  test('snapshot roundtrip preserves special names with ' + (useNativeClone ? 'structuredClone' : 'JSON clone'), () => {
    if (!useNativeClone) globalThis.structuredClone = undefined;
    const ctx = context();
    const chat = fresh();
    chat.characters.__proto__.profile.descriptions = JSON.parse('{"__proto__":"custom description","normal":"kept"}');
    const snapshot = state.recordChatStateSnapshot(ctx, chat);
    for (const name of names) assert.equal(Object.hasOwn(snapshot.stateSnapshot.characters, name), true, name);
    const stored = JSON.stringify(snapshot);
    state.restoreChatStateFromSnapshot(chat, JSON.parse(stored));
    assert.equal(Object.getPrototypeOf(chat.characters), null);
    assert.deepEqual(Object.keys(chat.characters), names);
    for (const name of names) assert.equal(chat.characters[name].name, name);
    assert.equal(Object.hasOwn(chat.characters.__proto__.profile.descriptions, '__proto__'), true);
    assert.equal(chat.characters.__proto__.profile.descriptions.__proto__, 'custom description');
    chat.characters.__proto__.profile.base.vitality = 17;
    assert.equal(JSON.stringify(snapshot), stored, 'restored mutations must not change a snapshot');
  });
}

test('full/patch chains retain special-key additions, updates, deletion and arrays after trimming and repacking', () => {
  const ctx = context();
  const settings = state.getSettings(ctx);
  const chat = state.getChatState(ctx, settings);
  chat.characters.Alice = character('Alice');
  chat.sceneSummary = 'stable context '.repeat(500);
  const expected = new Map();
  for (let index = 0; index < 32; index++) {
    ctx.chat.push({ name: 'Alice', is_user: false, mes: 'message ' + index });
    if (index % 5 === 0) chat.characters.__proto__ = character('__proto__');
    if (index % 5 === 3) delete chat.characters.__proto__;
    if (Object.hasOwn(chat.characters, '__proto__')) chat.characters.__proto__.profile.base.vitality = index;
    chat.characters.Alice.profile.children.push({ id: 'child-' + index, name: 'child ' + index });
    const snapshot = state.recordChatStateSnapshot(ctx, chat);
    expected.set(snapshot.messageCount, {
      names: Object.keys(chat.characters),
      vitality: chat.characters.__proto__?.profile.base.vitality,
      children: chat.characters.Alice.profile.children.length,
      boundary: snapshot.boundarySignature,
    });
  }
  assert.equal(chat.snapshots.length, 24);
  assert.equal(chat.snapshots[0].snapshotMode, 'full');
  assert.ok(chat.snapshots.some(snapshot => snapshot.snapshotMode === 'patch'));
  // Loading the serialized history exercises the normal compaction/repack entry.
  settings.chatStates[ctx.chatId] = JSON.parse(JSON.stringify(chat));
  const reloaded = state.getChatState(ctx, settings);
  for (const snapshot of reloaded.snapshots) {
    state.restoreChatStateFromSnapshot(reloaded, snapshot);
    const wanted = expected.get(snapshot.messageCount);
    assert.equal(Object.getPrototypeOf(reloaded.characters), null);
    assert.deepEqual(Object.keys(reloaded.characters), wanted.names);
    assert.equal(reloaded.characters.__proto__?.profile.base.vitality, wanted.vitality);
    assert.equal(reloaded.characters.Alice.profile.children.length, wanted.children);
    assert.equal(new Set(reloaded.characters.Alice.profile.children.map(child => child.id)).size, wanted.children);
    assert.equal(snapshot.boundarySignature, wanted.boundary);
  }
});

test('legacy full snapshots restore own special keys without changing the global prototype', () => {
  const chat = fresh();
  const snapshot = { stateSnapshot: { characters: JSON.parse(JSON.stringify(chat.characters)) } };
  state.restoreChatStateFromSnapshot(chat, snapshot);
  assert.equal(Object.getPrototypeOf(chat.characters), null);
  assert.deepEqual(Object.keys(chat.characters), names);
  assert.equal(Object.prototype.profile, undefined);
});

test('malformed character tables and entries never become registered characters', () => {
  for (const characters of [undefined, null, [], [character('bad')], 'bad', 42, { invalid: null, scalar: 'bad', array: [] }]) {
    const chat = fresh();
    state.restoreChatStateFromSnapshot(chat, { stateSnapshot: { characters } });
    assert.equal(Object.getPrototypeOf(chat.characters), null);
    assert.deepEqual(Object.keys(chat.characters), []);
  }
});

test('restored state skips unregistered built-in names instead of trying to clone functions', () => {
  const ctx = context();
  const chat = fresh(['Alice']);
  state.restoreChatStateFromSnapshot(chat, state.recordChatStateSnapshot(ctx, chat));
  for (const female of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    const result = applyToolCall(chat, { name: 'bsUpdateCharacterStatus', arguments: { female, options: {} } });
    assert.equal(result.applied, false);
    assert.match(result.message, /unknown character/);
  }
  assert.deepEqual(Object.keys(chat.characters), ['Alice']);
});

test('a detached patch is rejected without replacing live state, while a missing snapshot is a no-op', () => {
  const chat = fresh(['Alice']);
  const before = JSON.stringify(chat);
  state.restoreChatStateFromSnapshot(chat, null);
  assert.equal(JSON.stringify(chat), before);
  assert.throws(() => state.restoreChatStateFromSnapshot(chat, { snapshotMode: 'patch', stateDelta: {} }), /snapshot|快照/i);
  assert.equal(JSON.stringify(chat), before);
});

test('automatic snapshot restores preserve failure gating, and manual replay can succeed and clear it', async () => {
  const ctx = context();
  ctx.chat.push({ name: 'Alice', is_user: false, mes: 'before' });
  const settings = state.getSettings(ctx);
  settings.apiUrl = 'https://snapshot.invalid/v1';
  settings.model = 'test-model';
  const chat = state.getChatState(ctx, settings);
  chat.characters.Alice = character('Alice');
  const snapshot = state.recordChatStateSnapshot(ctx, chat);
  ctx.chat.push({ name: 'Alice', is_user: false, mes: 'after' });
  chat.lastFailedSignature = state.buildSignature(ctx, 1);
  chat.lastFailedChatSignature = state.buildSignature(ctx, ctx.chat.length);
  state.restoreChatStateFromSnapshot(chat, snapshot);
  state.getChatState(ctx, settings);
  assert.equal(isFailedAutoRetryBlocked(ctx, chat), true);
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: '{"tool_calls":[]}' } }] }) };
  };
  const result = await runTracker(ctx, { renderStatusPanel() {}, updateMainFlowPrompt() {} }, 'manual');
  assert.equal(result.skipped, false);
  assert.equal(requests, 1);
  assert.equal(chat.lastFailedSignature, '');
  assert.equal(chat.lastFailedChatSignature, '');
});
