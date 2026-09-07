// 回归测试：手动时间流逝（executeTimeLapse 路径）推进后，
// tracker 跑一轮（哪怕模型返回空 tool_calls）不得把状态覆盖回推进前的旧值。
// 实测情境：排卵期 0/2 用 UI 推了 2-3 天，面板、阶段、精液残留全部纹丝不动。
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import * as state from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import { runTracker } from '../scripts/tracker.js';

const ORIGINAL_FETCH = globalThis.fetch;

afterEach(() => {
  if (ORIGINAL_FETCH === undefined) delete globalThis.fetch;
  else globalThis.fetch = ORIGINAL_FETCH;
  delete globalThis.SillyTavern;
  delete globalThis.toastr;
});

function makeCtx(messages) {
  return {
    chatId: 'time-advance-chat',
    chat: messages,
    extensionSettings: {},
    saveSettingsDebounced() {},
  };
}

function makeDeps() {
  return { renderStatusPanel() {}, updateMainFlowPrompt() {} };
}

function jsonResponse(data) {
  return { ok: true, status: 200, async text() { return JSON.stringify(data); } };
}

function registerAlice(chatState) {
  const female = state.createDefaultFemaleState('Alice');
  female.initialized = true;
  Object.assign(female.profile.base, { stage: '排卵期', days: 0, age: 24, isHere: true });
  female.profile.base.sperms = [{ male: 'Bob', race: '人类', derivedType: null, value: 30 }];
  chatState.characters.Alice = female;
}

test('UI 推进 3 天后，tracker 空结果跑一轮不回滚状态', async () => {
  const ctx = makeCtx([
    { is_user: true, name: 'User', mes: '三天过去了。' },
    { is_user: false, name: 'Alice', mes: '……' },
  ]);
  globalThis.SillyTavern = { getContext: () => ctx };
  const settings = state.getSettings(ctx);
  settings.apiUrl = 'https://example.test/v1';
  settings.model = 'test-model';
  const chatState = state.getChatState(ctx, settings);
  registerAlice(chatState);

  // 模拟 executeTimeLapse：直接调同一个 applyToolCall 入口
  const lapse = applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 3 } });
  assert.equal(lapse.applied, true);
  const advanced = chatState.characters.Alice.profile.base;
  assert.equal(advanced.stage, '黄体期', '推进 3 天应跨过排卵期（2 天）进入黄体期');
  assert.equal(advanced.days, 1);
  assert.equal(advanced.sperms.length, 0, '残留 30 按每天 -10 衰减 3 天应清空');

  // tracker 跑一轮，模型什么工具都没调（最坏情况）
  globalThis.fetch = async () => jsonResponse({
    choices: [{ message: { content: JSON.stringify({ tool_calls: [] }) } }],
  });
  const result = await runTracker(ctx, makeDeps(), 'manual');
  assert.equal(result.skipped, false);

  const after = chatState.characters.Alice.profile.base;
  assert.equal(after.stage, '黄体期', '空结果不得回滚到排卵期');
  assert.equal(after.days, 1, '空结果不得回滚天数');
  assert.equal(after.sperms.length, 0, '空结果不得恢复已衰减的精液残留');
});

test('tracker 正常跑 bsPassedTime 时推进同样生效（对照组）', async () => {
  const ctx = makeCtx([
    { is_user: true, name: 'User', mes: '又过了两天。' },
    { is_user: false, name: 'Alice', mes: '……' },
  ]);
  globalThis.SillyTavern = { getContext: () => ctx };
  const settings = state.getSettings(ctx);
  settings.apiUrl = 'https://example.test/v1';
  settings.model = 'test-model';
  const chatState = state.getChatState(ctx, settings);
  registerAlice(chatState);

  globalThis.fetch = async () => jsonResponse({
    choices: [{ message: { content: JSON.stringify({ tool_calls: [
      { name: 'bsPassedTime', arguments: { day: 3 } },
    ] }) } }],
  });
  const result = await runTracker(ctx, makeDeps(), 'manual');
  assert.equal(result.skipped, false);

  const after = chatState.characters.Alice.profile.base;
  assert.equal(after.stage, '黄体期', '模型报 bsPassedTime day:3 应跨入黄体期');
  assert.equal(after.days, 1);
});
