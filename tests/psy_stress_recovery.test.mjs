import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyChatState,
  createDefaultFemaleState,
  getPsyStressBaseline,
  PSY_STRESS_RECOVERY_PER_HOUR,
} from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';

// 情压回落（applyPsyStressRecovery）的行为合同：
//   基线 = getPsyStressBaseline(level)（等级初始值，本性水平）
//   高于基线往下落、低于基线往回补，速率 PSY_STRESS_RECOVERY_PER_HOUR/小时
//   整小时粒度（passedHours），分钟级不动
//   immune.metabolism 不挡——那道门管的是排泄需求七项，情压是心理量
//
// fixture 用 immune.metabolism 把代谢与体力引擎清零，只留情压这一个变量。

function fixture({ level = 4, psyStress = null, immune = true } = {}) {
  const chat = createEmptyChatState();
  const female = createDefaultFemaleState('Alice');
  female.initialized = true;
  const p = female.profile;
  const baseline = getPsyStressBaseline(level);
  Object.assign(p.base, {
    stage: '卵泡期', age: 24, days: 0, isHere: false,
    psyStressLevel: level,
    psyStress: psyStress === null ? baseline : psyStress,
  });
  if (immune) Object.assign(p.immune, { metabolism: true });
  chat.characters.Alice = female;
  return chat;
}

function advance(chat, hours) {
  return applyToolCall(chat, { name: 'bsPassedTime', arguments: { hour: hours } });
}

function stress(chat) {
  return chat.characters.Alice.profile.base.psyStress;
}

test('常量与基线口径：默认档（level 4）基线 55，回落速率 2/小时', () => {
  assert.equal(getPsyStressBaseline(4), 55);
  assert.equal(PSY_STRESS_RECOVERY_PER_HOUR, 2);
});

test('高于基线的事件压力随小时回落，不穿过基线', () => {
  const chat = fixture({ psyStress: 95 });   // 基线 55，高出 40
  advance(chat, 10);                          // 落 20 → 75
  assert.equal(stress(chat), 75);
  advance(chat, 30);                          // 再落 60 → 钳在基线
  assert.equal(stress(chat), 55);
});

test('低于基线的深度平静回归基线，不穿过', () => {
  const chat = fixture({ psyStress: 15 });   // 基线 55
  advance(chat, 10);                          // 补 20 → 35
  assert.equal(stress(chat), 35);
  advance(chat, 30);
  assert.equal(stress(chat), 55);
});

test('等于基线时不动', () => {
  const chat = fixture({ psyStress: 55 });
  advance(chat, 5);
  assert.equal(stress(chat), 55);
});

test('分钟级推进（不足整小时）不动', () => {
  const chat = fixture({ psyStress: 95 });
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { minute: 30 } });
  assert.equal(stress(chat), 95);
});

test('不同等级回落到不同基线', () => {
  const high = fixture({ level: 7, psyStress: 160 });  // 基线 100
  advance(high, 100);
  assert.equal(stress(high), 100);

  const low = fixture({ level: 2, psyStress: 60 });    // 基线 25
  advance(low, 100);
  assert.equal(stress(low), 25);
});

test('bsUpdateCharacterStatus 加压后，时间推进把事件压力散掉', () => {
  const chat = fixture({});                  // 基线 55
  applyToolCall(chat, { name: 'bsUpdateCharacterStatus', arguments: { female: 'Alice', options: { psyStress: 30 } } });
  assert.equal(stress(chat), 85);
  advance(chat, 8);                           // 散 16 → 69
  assert.equal(stress(chat), 69);
});

test('单次增量硬钳 ±30：模型报再多也只算一次事件', () => {
  const up = fixture({ psyStress: 55 });
  applyToolCall(up, { name: 'bsUpdateCharacterStatus', arguments: { female: 'Alice', options: { psyStress: 500 } } });
  assert.equal(stress(up), 85);               // 只 +30，不是 +55 钳 cap

  const down = fixture({ psyStress: 55 });
  applyToolCall(down, { name: 'bsUpdateCharacterStatus', arguments: { female: 'Alice', options: { psyStress: -500 } } });
  assert.equal(stress(down), 25);             // 只 -30
});

test('immune.metabolism 不挡情压回落', () => {
  const immuneChat = fixture({ psyStress: 95, immune: true });
  advance(immuneChat, 10);
  const plainChat = fixture({ psyStress: 95, immune: false });
  advance(plainChat, 10);
  assert.equal(stress(immuneChat), stress(plainChat));
});

test('等级改变后基线跟着走', () => {
  const chat = fixture({ level: 4, psyStress: 55 });
  chat.characters.Alice.profile.base.psyStressLevel = 6;   // 基线变 85
  advance(chat, 50);                                        // 补 100 → 钳在新基线
  assert.equal(stress(chat), 85);
});

test('时间粒度不变性：一次推 N 小时 ≡ N 次推 1 小时', () => {
  const batch = fixture({ psyStress: 95 });
  advance(batch, 12);
  const split = fixture({ psyStress: 95 });
  for (let i = 0; i < 12; i += 1) advance(split, 1);
  assert.equal(stress(batch), stress(split));
});
