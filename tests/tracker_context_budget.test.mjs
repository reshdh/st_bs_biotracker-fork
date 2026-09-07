import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { callOpenAICompatible } from '../scripts/api.js';
import { buildTrackerPayload, runTracker } from '../scripts/tracker.js';
import { DEFAULT_SYSTEM_PROMPT, createDefaultFemaleState, getChatState, getSettings } from '../scripts/state.js';

const original = { fetch: globalThis.fetch, SillyTavern: globalThis.SillyTavern };
afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
  delete globalThis.__bs_biotracker_mainflow_context_snapshot__;
});
const settings = { apiUrl: 'https://context.invalid/v1', model: 'test', useStPresetForAsync: false, contextSize: 12 };
const user = text => ({ role: 'user', name: 'User', text });
const assistant = text => ({ role: 'assistant', name: 'Alice', text });
const LIMIT = 65536; // Serialized message arrays, measured in UTF-16 code units.
async function sentPayload(payload, overrides = {}) {
  let sent;
  globalThis.fetch = async (_url, init) => {
    sent = JSON.parse(JSON.parse(init.body).messages.find(m => m.role === 'user').content);
    return { ok: true, status: 200, text: async () => '{"choices":[{"message":{"content":"{\\"tool_calls\\":[]}"}}]}' };
  };
  await callOpenAICompatible({ ...settings, ...overrides }, payload, 'Return JSON.');
  return sent;
}
function messageChars(payload) {
  return JSON.stringify(Object.fromEntries(['recent_messages', 'mainflow_resolved_messages', 'mainflow_resolved_system_messages']
    .filter(key => Array.isArray(payload[key])).map(key => [key, payload[key]]))).length;
}

for (const messages of [[], [{ role: 'system', content: 'World background' }], [{ role: 'user', content: '<world_info>Scene</world_info>' }]]) {
  test('mainflow preserves the latest short assistant event with ' + messages.length + ' captured messages', async () => {
    const recent = [user('继续观察。'), assistant('一小时过去了。')];
    const sent = await sentPayload({ recent_messages: recent, mainflow_context_snapshot: { messages } });
    assert.deepEqual(sent.recent_messages, recent);
    if (messages[0]?.role === 'user') assert.equal(sent.mainflow_resolved_messages[0].content, messages[0].content);
  });
}

test('identical text on different floors or with unknown cross-source identity stays separate', async () => {
  const text = '<world_info>相同的话也可能是另一次事件。</world_info>';
  const recent = [user(text), assistant('一小时过去了。'), user(text), assistant('一小时过去了。')];
  const sent = await sentPayload({ recent_messages: recent, mainflow_context_snapshot: { messages: [{ role: 'user', content: text }] } });
  assert.deepEqual(sent.recent_messages, recent);
  assert.equal(sent.mainflow_resolved_messages[0].content, text);
});

test('recent history is bounded without shortening the latest user and assistant messages', async () => {
  const recent = Array.from({ length: 12 }, (_, i) => (i % 2 ? assistant : user)(i + ': ' + '旧'.repeat(10000)));
  recent[10] = user('当前决定：保留。'); recent[11] = assistant('当前事件：一小时。');
  const sent = await sentPayload({ recent_messages: recent });
  assert.ok(messageChars(sent) <= LIMIT);
  assert.ok(sent.recent_messages.length < recent.length);
  assert.deepEqual(sent.recent_messages.slice(-2), recent.slice(-2));
  assert.ok(sent.recent_messages.every(m => recent.some(source => source.text === m.text)));
});

test('mainflow and recent arrays share one budget and retain system/world-info context', async () => {
  const recent = Array.from({ length: 12 }, (_, i) => assistant(i + ': ' + '旧'.repeat(8000)));
  const system = { role: 'system', content: '背景'.repeat(5000) };
  const world = { role: 'user', content: '<world_info>' + '设定'.repeat(3000) + '</world_info>' };
  const sent = await sentPayload({ recent_messages: recent, mainflow_context_snapshot: { messages: [system, world] } });
  assert.ok(messageChars(sent) <= LIMIT);
  assert.deepEqual(sent.mainflow_resolved_system_messages, [system]);
  assert.deepEqual(sent.mainflow_resolved_messages, [world]);
  assert.deepEqual(sent.recent_messages.at(-1), recent.at(-1));
});

for (const text of ['中'.repeat(LIMIT), '🙂'.repeat(LIMIT / 2), '<xml>' + '\\"'.repeat(LIMIT / 2) + '</xml>']) {
  test('oversized protected content fails before transport, including JSON escaping', async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new Error('must not send'); };
    await assert.rejects(callOpenAICompatible(settings, { recent_messages: [assistant(text)] }, 'Return JSON.'), error => error.code === 'BS_CONTEXT_TOO_LARGE');
    assert.equal(calls, 0);
  });
}

test('empty messages do not consume the count allowance and Unicode/XML are not split', async () => {
  const recent = [user('older'), assistant('🙂e\u0301<xml>完整</xml>'), user('   '), assistant('最后一条')];
  const sent = await sentPayload({ recent_messages: recent }, { contextSize: 2 });
  assert.deepEqual(sent.recent_messages, [recent[1], recent[3]]);
});

function context() {
  const ctx = { chatId: 'context-card', characterId: 0, name1: 'User', name2: 'Alice',
    chat: [{ is_user: true, mes: '开始' }, { is_user: false, mes: '一小时过去了。' }],
    characters: [{ name: 'Alice', description: 'UNIQUE_DESCRIPTION', personality: '谨慎', scenario: '观察',
      first_mes: 'OLD_OPENING', mes_example: 'EXAMPLE_ONLY', worldBook: { name: 'Book', entries: [{ comment: 'Active', content: 'UNIQUE_WORLDBOOK', constant: true }] } }],
    extensionSettings: {}, saveSettingsDebounced() {} };
  globalThis.SillyTavern = { getContext: () => ctx };
  return ctx;
}
test('the default tracker sends one canonical description and worldbook', () => {
  const ctx = context();
  const payload = buildTrackerPayload(ctx, getSettings(ctx));
  const text = JSON.stringify(payload);
  assert.equal(text.split('UNIQUE_DESCRIPTION').length - 1, 1);
  assert.equal(text.split('UNIQUE_WORLDBOOK').length - 1, 1);
  assert.equal(payload.current_character.description, undefined);
  assert.equal(payload.current_character.first_mes, undefined);
  assert.equal(payload.current_character.personality, '谨慎');
});
test('custom tracker prompts keep complete legacy character-card fields', () => {
  const ctx = context();
  const configured = getSettings(ctx);
  configured.systemPrompt = DEFAULT_SYSTEM_PROMPT + '\nRead current_character.description and worldBook.';
  const payload = buildTrackerPayload(ctx, configured);
  assert.equal(payload.current_character.description, 'UNIQUE_DESCRIPTION');
  assert.equal(payload.current_character.first_mes, 'OLD_OPENING');
  assert.ok(payload.current_character.worldBook.entries.length > 0);
});
test('historical replay cannot receive a newer mainflow snapshot', () => {
  const ctx = context();
  const configured = getSettings(ctx);
  configured.trackerWorldbookMode = 'mainflow';
  globalThis.__bs_biotracker_mainflow_context_snapshot__ = { chatKey: 'context-card', capturedAt: Date.now(), messages: [{ role: 'system', content: 'Future context' }] };
  assert.equal(buildTrackerPayload(ctx, configured, 'replay', 1).mainflow_context_snapshot, null);
});

test('replay keeps floor-filtered worldbooks and avoids live-chat macros until the current floor', async () => {
  const ctx = context();
  ctx.chat.push({ is_user: true, mes: '继续。' }, { is_user: false, mes: 'FUTURE_CONTEXT' });
  const originalChat = structuredClone(ctx.chat);
  ctx.characters[0].description += ' {{lastMessage}}';
  ctx.substituteParamsExtended = text => text.replaceAll('{{lastMessage}}', ctx.chat.at(-1).mes);
  let worldInfoCalls = 0;
  ctx.getWorldInfoPrompt = chat => {
    worldInfoCalls++;
    return { worldInfoBefore: 'Resolved worldbook: ' + chat.at(-1).mes };
  };
  ctx.getPresetManager = () => ({ getCompletionPresetByName: () => ({
    settings: { max_completion_tokens: 2048 },
    prompts: [{ identifier: 'test', content: 'Preset {{lastMessage}}', role: 'system' }],
  }) });
  const configured = getSettings(ctx);
  Object.assign(configured, settings, { trackerWorldbookMode: 'mainflow', trackerPresetName: 'Replay preset',
    systemPrompt: DEFAULT_SYSTEM_PROMPT + '\n{{lastMessage}}' });
  const chatState = getChatState(ctx, configured);
  chatState.characters.Alice = createDefaultFemaleState('Alice');
  chatState.characters.Alice.initialized = true;
  const bodies = [];
  globalThis.fetch = async (_url, init) => {
    bodies.push(JSON.parse(init.body));
    return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: '{"tool_calls":[]}' } }] }) };
  };
  const result = await runTracker(ctx, { renderStatusPanel() {} }, 'replay');
  assert.equal(result.triggeredCount, 2);
  assert.equal(bodies.length, 2);
  assert.equal(JSON.stringify(bodies[0]).includes('FUTURE_CONTEXT'), false, 'historical input must not contain future context');
  assert.ok(bodies[0].messages.some(message => message.content === 'Preset {{lastMessage}}'));
  assert.ok(bodies[1].messages.some(message => message.content === 'Preset FUTURE_CONTEXT'));
  const first = JSON.parse(bodies[0].messages.at(-1).content);
  const last = JSON.parse(bodies[1].messages.at(-1).content);
  assert.equal(first.character_worldbook.entries[0].content, 'UNIQUE_WORLDBOOK');
  assert.equal(first.resolved_worldbook_prompt, undefined);
  assert.equal(last.resolved_worldbook_prompt, 'Resolved worldbook: FUTURE_CONTEXT');
  assert.equal(worldInfoCalls, 1);
  assert.deepEqual(bodies.map(body => body.max_tokens), [2048, 2048]);
  assert.deepEqual(ctx.chat, originalChat);
});
