// 回归测试：注册的情境初值覆盖到卵子数。
// 实测情境：角色设定明确写「排卵期第二天，今日已排出两颗成熟卵子」，注册后
// 妊娠页仍显示「尚未排出卵子」——注册表里没有 base.eggs 字段，模型想按剧情
// 记录也没有落点，卵子只能等引擎自己排。
import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyChatState } from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import { applyRegistryResult, buildRegistrySystemPrompt } from '../scripts/registry.js';

function register(chat, name, profile) {
  return applyRegistryResult(chat, { name, profile });
}

test('排卵期开局带已排出卵子：eggs 落库并标记本周期自然排卵已消耗', () => {
  const chat = createEmptyChatState();
  const character = register(chat, '露娜', {
    base: { race: '人类', stage: '排卵期', vitalityLevel: 4, psyStressLevel: 4, eggs: 2 },
    metabolism: { hunger: 30 },
  });
  assert.equal(character.profile.base.eggs, 2, '剧情写明的卵子数应写入档案');
  assert.equal(character.profile.cooldown?.naturalOvulationUsed, true, '本周期自然排卵份额应标记为已消耗');
});

test('注册带卵后推进整天：引擎不再叠加自然排卵', () => {
  const chat = createEmptyChatState();
  const character = register(chat, '露娜', {
    base: { race: '人类', stage: '排卵期', vitalityLevel: 4, psyStressLevel: 4, eggs: 2 },
    metabolism: { hunger: 30 },
  });
  assert.equal(character.profile.base.eggs, 2);
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 1 } });
  const base = chat.characters.露娜.profile.base;
  assert.equal(base.eggs, 2, '排卵期内推进一天：不应再排一批，也不衰减');
});

test('排卵期开局未填卵子：不写 eggs、不设冷却，引擎照常自动排卵', () => {
  const chat = createEmptyChatState();
  const character = register(chat, '艾拉', {
    base: { race: '人类', stage: '排卵期', vitalityLevel: 4, psyStressLevel: 4 },
    metabolism: { hunger: 30 },
  });
  assert.equal(character.profile.base.eggs ?? 0, 0, '未填卵子应保持零');
  assert.ok(!character.profile.cooldown?.naturalOvulationUsed, '未填卵子不应消耗自然排卵份额');
  // 钉死额外排卵量，自然排卵 = 1 + 1 = 2，断言才稳定
  chat.characters.艾拉.profile.bio.orgasmOvulationAmount = 1;
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 1 } });
  assert.equal(chat.characters.艾拉.profile.base.eggs, 2, '冷却未设时引擎自动排出 2 颗');
});

test('非排卵期带卵：只记数不设冷却（卵子按引擎规则在排卵期外逐日衰减）', () => {
  const chat = createEmptyChatState();
  const character = register(chat, '米娅', {
    base: { race: '人类', stage: '黄体期', vitalityLevel: 4, psyStressLevel: 4, eggs: 2 },
    metabolism: { hunger: 30 },
  });
  assert.equal(character.profile.base.eggs, 2);
  assert.ok(!character.profile.cooldown?.naturalOvulationUsed, '非排卵期与自然排卵份额无关');
});

test('eggs 越界裁剪到 99', () => {
  const chat = createEmptyChatState();
  const character = register(chat, '琪琪', {
    base: { race: '人类', stage: '排卵期', eggs: 150 },
  });
  assert.equal(character.profile.base.eggs, 99);
});

test('注册提示词声明 base.eggs 的情境规则与模板字段', () => {
  const prompt = buildRegistrySystemPrompt({ payload: { target_character: '露娜' } });
  assert.ok(prompt.includes('base.eggs: 当前存活、可受精的卵子数'), '缺少 base.eggs 参数说明');
  assert.ok(prompt.includes('已排出 N 颗卵子'), '缺少按剧情填写的规则');
  assert.ok(prompt.includes('"eggs": 0,'), 'JSON 结构模板缺少 eggs 字段');
  assert.ok(prompt.includes('"eggs":2'), '示例缺少 eggs 字段');
});
