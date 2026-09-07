import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyChatState, createDefaultFemaleState } from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';

function fixture(stage, phase, count = 1) {
  const chat = createEmptyChatState();
  const female = createDefaultFemaleState('Alice');
  female.initialized = true;
  const p = female.profile;
  Object.assign(p.base, { stage, age: 24, days: 0, isHere: false, vitality: 125, psyStress: 0, uterinePressure: 100 });
  Object.assign(p.pregnant, {
    pregnantDays: 270, effectivePregnantDays: 270,
    laborPhase: phase, laborHours: 0, effectiveLaborHours: 0, laborFetusIndex: 1,
    prodromalRemainingHours: 0.75, amnionDurability: 0,
    fetuses: Array.from({ length: count }, (_, i) => ({ fathers: 'Father-' + i, gender: '女', race: '人类', embryoType: '胎生', weight: 1, tendencyAngle: 0 })),
    fetusesCount: count,
  });
  Object.assign(p.immune, { realisticLabor: true, metabolism: true });
  chat.characters.Alice = female;
  return chat;
}
function advance(chat, hours) {
  // Hold the inputs to the labor rate constant. Other engines have their own
  // time integration tests; they must not change the rates under comparison.
  const p = chat.characters.Alice.profile;
  Object.assign(p.base, { vitality: 125, psyStress: 0, uterinePressure: 100 });
  p.metabolism.libido = 0;
  const random = Math.random;
  Math.random = () => 0.99;
  try { return applyToolCall(chat, { name: 'bsPassedTime', arguments: { hour: hours } }); }
  finally { Math.random = random; }
}
function assertSameProgress(batch, split) {
  const a = batch.characters.Alice.profile;
  const b = split.characters.Alice.profile;
  assert.equal(a.base.stage, b.base.stage);
  assert.equal(a.pregnant.laborPhase, b.pregnant.laborPhase);
  for (const field of ['laborHours', 'effectiveLaborHours', 'prodromalRemainingHours', 'pregnantDays', 'effectivePregnantDays']) {
    assert.ok(Math.abs((a.pregnant[field] || 0) - (b.pregnant[field] || 0)) < 1e-8, field + ': ' + a.pregnant[field] + ' vs ' + b.pregnant[field]);
  }
  assert.ok(Math.abs(a.base.days - b.base.days) < 1e-8, 'remaining stage days: ' + a.base.days + ' vs ' + b.base.days);
  assert.equal(a.pregnant.fetuses.length, b.pregnant.fetuses.length);
  assert.equal(a.children.length, b.children.length);
  assert.deepEqual(a.children.map(child => child.fathers), b.children.map(child => child.fathers));
  for (let i = 0; i < a.children.length; i++) assert.ok(Math.abs(a.children[i].age - b.children[i].age) < 1e-8, 'age from actual birth time');
  assert.ok(Math.abs(batch.minutesPassed - split.minutesPassed) < 1e-8);
}

for (const [stage, phase, count] of [
  ['产兆前驱', null, 1], ['第一产程', '潜伏期', 1],
  ['第二产程', '胎体下降', 2], ['第三产程', '供养器官娩出', 0],
]) {
  for (const hours of [1, 8, 24]) {
    test(stage + ': ' + hours + ' hours consume the same phase time as quarter-hour steps', () => {
      const batch = fixture(stage, phase, count);
      const split = fixture(stage, phase, count);
      advance(batch, hours);
      for (let i = 0; i < hours * 4; i++) advance(split, 0.25);
      assertSameProgress(batch, split);
    });
  }
}

test('reaching the third-stage boundary transitions exactly once, including postpartum remainder', () => {
  const chat = fixture('第三产程', '供养器官娩出', 0);
  advance(chat, 0.5);
  assert.equal(chat.characters.Alice.profile.pregnant.laborPhase, '产后观察');
  advance(chat, 2.5);
  assert.equal(chat.characters.Alice.profile.base.stage, '产后恢复');
  assert.ok(Math.abs(chat.characters.Alice.profile.base.days - 0.5 / 24) < 1e-10);
  assert.equal(chat.characters.Alice.profile.experience.naturalBirthExperience, 1);
});

test('a blocked second stage consumes real time without bypassing the obstruction', () => {
  const chat = fixture('第二产程', '胎体娩出', 1);
  chat.characters.Alice.profile.pregnant.fetuses[0].tendencyAngle = 90;
  advance(chat, 72);
  const p = chat.characters.Alice.profile;
  assert.equal(p.base.stage, '第二产程');
  assert.equal(p.pregnant.fetuses.length, 1);
  assert.equal(p.children.length, 0);
  assert.equal(p.pregnant.laborHours, 72);
  assert.match(p.notify.firstly + p.notify.secondly, /难产|无法自然/);
});

test('one labor call samples stalling at most once and never skips time by retrying a stalled phase', () => {
  const chat = fixture('第一产程', '潜伏期');
  chat.characters.Alice.profile.base.uterinePressure = 0;
  let calls = 0;
  const random = Math.random;
  Math.random = () => { calls++; return 0; };
  try { applyToolCall(chat, { name: 'bsPassedTime', arguments: { hour: 24 } }); }
  finally { Math.random = random; }
  assert.equal(calls, 1);
  assert.equal(chat.characters.Alice.profile.pregnant.laborHours, 24);
  assert.equal(chat.characters.Alice.profile.pregnant.effectiveLaborHours, 0);
});

test('fractional minutes are accumulated consistently instead of rounding each tool call away', () => {
  const chat = createEmptyChatState();
  for (let i = 0; i < 10; i++) applyToolCall(chat, { name: 'bsPassedTime', arguments: { minute: 0.4 } });
  assert.ok(Math.abs(chat.minutesPassed - 4) < 1e-12);
  assert.equal(chat.lastAdvanceMinutes, 0.4);
});

test('large third-stage advances continue through postpartum recovery without duplicate births', () => {
  const batch = fixture('第三产程', '供养器官娩出', 0);
  const split = fixture('第三产程', '供养器官娩出', 0);
  advance(batch, 1500);
  for (let i = 0; i < 1500; i++) advance(split, 1);
  assertSameProgress(batch, split);
  assert.equal(batch.characters.Alice.profile.experience.naturalBirthExperience, 1);
});

test('non-positive and non-finite durations leave time and labor unchanged', () => {
  const chat = fixture('第二产程', '胎体娩出');
  const before = JSON.stringify(chat);
  for (const hour of [0, -1, NaN, Infinity, undefined]) {
    assert.equal(applyToolCall(chat, { name: 'bsPassedTime', arguments: { hour } }).applied, false);
  }
  assert.equal(JSON.stringify(chat), before);
  assert.equal(Object.getPrototypeOf(chat.characters), null);
});

test('pressure acceleration preserves all remaining time and the birth notification', () => {
  const chat = fixture('第二产程', '胎体娩出');
  const p = chat.characters.Alice.profile;
  p.immune.realisticLabor = false;
  p.base.uterinePressure = 99999;
  const random = Math.random;
  Math.random = () => 0.99;
  try { applyToolCall(chat, { name: 'bsPassedTime', arguments: { hour: 4 } }); }
  finally { Math.random = random; }
  const result = chat.characters.Alice.profile;
  assert.equal(result.base.stage, '产后恢复');
  assert.equal(result.children.length, 1);
  assert.ok(result.base.days > 0);
  assert.ok(Math.abs(result.children[0].age - 4 / 24 / 365) < 1e-10);
  assert.match(Object.values(result.notify).join(' '), /本轮生下了1个孩子/);
});

for (const providerFirst of [true, false]) {
  test('provider transfer keeps birth age regardless of character order: ' + providerFirst, () => {
    const chat = fixture('第二产程', '胎体娩出');
    const provider = createDefaultFemaleState('Provider');
    provider.initialized = true;
    provider.profile.children = [{ id: 'existing', age: 4, fathers: 'Earlier' }];
    chat.characters.Alice.profile.pregnant.fetuses[0].provider = 'Provider';
    if (providerFirst) chat.characters = Object.assign(Object.create(null), { Provider: provider }, chat.characters);
    else chat.characters.Provider = provider;
    advance(chat, 8);
    assert.equal(chat.characters.Alice.profile.children.length, 0);
    const children = chat.characters.Provider.profile.children;
    assert.equal(children.length, 2);
    assert.equal(children[0].id, 'existing');
    assert.ok(Math.abs(children[0].age - (4 + 8 / 24 / 365)) < 1e-10);
    assert.ok(children[1].id);
    assert.ok(children[1].age > 0 && children[1].age < 8 / 24 / 365);
    assert.equal(children[1].fathers, 'Father-0');
  });
}

test('labor completion enters the locked pregnancy once and consumes its remainder', () => {
  const chat = fixture('第二产程', '胎体娩出');
  const p = chat.characters.Alice.profile;
  p.bio.gestationModifierMultiplier = 0;
  p.gestationLock = {
    name: 'Test lock', loopBackDays: 287, loopFetusCount: 1,
    loopFetusTemplates: structuredClone(p.pregnant.fetuses),
  };
  advance(chat, 72);
  const result = chat.characters.Alice.profile;
  assert.equal(result.children.length, 1);
  assert.equal(result.experience.naturalBirthExperience, 1);
  assert.equal(result.pregnant.fetuses.length, 1);
  assert.equal(result.pregnant.effectivePregnantDays, 287);
  assert.ok(result.pregnant.pregnantDays > 287 && result.pregnant.pregnantDays < 290);
  assert.match(Object.values(result.notify).join(' '), /再次生效/);
});
