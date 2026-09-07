import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { createDefaultFemaleState, getChatState, getSettings } from '../scripts/state.js';
import { runTracker, isFailedAutoRetryBlocked } from '../scripts/tracker.js';

const original = { fetch: globalThis.fetch, SillyTavern: globalThis.SillyTavern };
afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
});
for (const raw of [{}, { tool_calls: 'wrong shape' }, { scene_summary: 'must not replace the scene' }]) {
  test('missing or malformed tool array cannot mark a tracker run successful: ' + JSON.stringify(raw), async () => {
    const ctx = { chatId: 'invalid-tracker', chat: [{ is_user: false, name: 'Alice', mes: '一小时过去了。' }],
      extensionSettings: {}, saveSettingsDebounced() {} };
    globalThis.SillyTavern = { getContext: () => ctx };
    const settings = getSettings(ctx);
    Object.assign(settings, { apiUrl: 'https://validation.invalid/v1', model: 'test', useStPresetForAsync: false });
    const chat = getChatState(ctx, settings);
    chat.characters.Alice = createDefaultFemaleState('Alice'); chat.characters.Alice.initialized = true;
    chat.sceneSummary = 'Original';
    let count = 0;
    globalThis.fetch = async () => { count++; return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: JSON.stringify(raw) } }] }) }; };
    await assert.rejects(runTracker(ctx, { renderStatusPanel() {}, updateMainFlowPrompt() {} }, 'manual'), /tool_calls/);
    assert.equal(count, 1);
    assert.equal(chat.lastProcessedSignature, '');
    assert.equal(chat.sceneSummary, 'Original');
    assert.equal(isFailedAutoRetryBlocked(ctx, chat), true);
  });
}
