// 回归测试：多颗卵子在同一受精窗口内各自独立受精。
// 实测情境：正文明确写出排出两颗卵子，一次时间推进后仍显示单胎——
// 旧实现在受精循环末尾无条件 break，每次 bsPassedTime 只结算一颗卵，
// 第二颗卵在同一轮推进里连被掷的机会都没有，必然单胎。
import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyChatState, createDefaultFemaleState } from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';

// 排卵期 + 额外排卵倾向 1 → 自然排卵一次排 2 颗；受精难度压到 0.1，
// 同种族单来源精液的单颗成功率封顶 0.8，随机值 0 必中、≥0.9 必不中。
function setup() {
  const chat = createEmptyChatState();
  const female = createDefaultFemaleState('Alice');
  female.initialized = true;
  Object.assign(female.profile.base, { stage: '排卵期', days: 0, age: 24, isHere: true });
  Object.assign(female.profile.bio, { orgasmOvulationAmount: 1, impregnationDifficulty: 0.1 });
  chat.characters.Alice = female;
  applyToolCall(chat, { name: 'bsAddSperm', arguments: { female: 'Alice', male: 'Father', race: '人类', amount: 100 } });
  return chat;
}

// 受精路径上胎儿生成（性别/胎位角/体重）也吃随机，按序消费、取尽后回落末值。
function withRandom(values, fn) {
  const original = Math.random;
  let index = 0;
  Math.random = () => (index < values.length ? values[index++] : values[values.length - 1]);
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

test('两颗卵一次推进可全部受精：不再只结算一颗', () => {
  const chat = setup();
  withRandom([0], () => {
    applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 1 } });
  });
  const profile = chat.characters.Alice.profile;
  assert.equal(profile.pregnant.fetuses.length, 2, '两颗卵都应得到受精判定');
  assert.equal(profile.base.eggs, 0, '都受精后卵子清零');
  assert.equal(profile.notify.secondly, 'Alice有 2 颗卵子受精成功');
});

test('全部没掷中：卵子不消耗，下次推进还有机会', () => {
  const chat = setup();
  withRandom([1], () => {
    applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 1 } });
  });
  const profile = chat.characters.Alice.profile;
  assert.equal(profile.pregnant.fetuses?.length ?? 0, 0, '0.9+ 的随机值不该命中');
  assert.equal(profile.base.eggs, 2, '没中的卵保留');
});

test('一颗中一颗不中：各自独立，互不排队', () => {
  const chat = setup();
  // 第一颗卵的掷骰拿到 0（必中），之后所有随机回落 0.9（第二颗必不中）
  withRandom([0, 0.9], () => {
    applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 1 } });
  });
  const profile = chat.characters.Alice.profile;
  assert.equal(profile.pregnant.fetuses.length, 1, '第一颗受精后第二颗仍要掷自己的骰');
  assert.equal(profile.base.eggs, 1, '没中的那颗保留');
  assert.equal(profile.notify.secondly, 'Alice受精成功');
});
