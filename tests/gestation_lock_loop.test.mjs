// 剧情强制令：使用者授权闸门、妊娠阶段强写，以及分娩循环回退。
import assert from 'node:assert/strict';
import test from 'node:test';

import * as state from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';

// 使用者原话，逐字照抄进 userDirective 才算过闸。
const DIRECTIVE = '妊娠诅咒：强制固定为双胎临产期阶段（41周），一个胎儿已经入盆，另一个还在上面，两个都是巨大儿';

function makeChatState() {
  const chatState = state.createEmptyChatState();
  chatState.characters['艾拉'] = {
    name: '艾拉',
    initialized: true,
    runtime: {},
    profile: {
      base: {
        stage: '黄体期',
        days: 3,
        vitality: 100,
        uterinePressure: 0,
        age: 24,
        race: '人类',
      },
      pregnant: {
        pregnantDays: 0,
        effectivePregnantDays: 0,
        fetusesCount: 0,
        fetuses: [],
        fetalEnergyDrain: 0,
        amnionDurability: 0,
      },
      bio: { birthDifficulty: 1, breedTolerance: 1 },
      immune: {},
      metabolism: {},
      experience: {},
      children: [],
      notify: {},
    },
  };
  return chatState;
}

const userMessages = [{ role: 'user', text: `（${DIRECTIVE}），此阶段将会一直持续。` }];

const profileOf = (chatState) => chatState.characters['艾拉'].profile;

function forceGestation(chatState, overrides = {}) {
  return applyToolCall(chatState, {
    name: 'bsForceGestation',
    arguments: {
      female: '艾拉',
      userDirective: DIRECTIVE,
      equivalentDays: 287,
      fetusCount: 2,
      fetusWeight: 1.6,
      father: '莱昂',
      ...overrides,
    },
  }, { recentMessages: userMessages });
}

function setLock(chatState, overrides = {}) {
  return applyToolCall(chatState, {
    name: 'bsSetGestationLock',
    arguments: {
      female: '艾拉',
      userDirective: DIRECTIVE,
      name: '妊娠诅咒',
      freeze: true,
      loopBackDays: 287,
      fetusWeight: 1.6,
      ...overrides,
    },
  }, { recentMessages: userMessages });
}

test('bsForceGestation 把黄体期直接改写成逾期双胎巨大儿', () => {
  const chatState = makeChatState();
  const result = forceGestation(chatState);
  assert.equal(result.applied, true);

  const profile = profileOf(chatState);
  assert.equal(profile.base.stage, '逾期');
  assert.equal(profile.pregnant.effectivePregnantDays, 287);
  assert.equal(profile.pregnant.fetuses.length, 2);
  for (const fetus of profile.pregnant.fetuses) {
    assert.equal(fetus.weight, 1.6);
    assert.equal(fetus.fathers, '莱昂');
  }
  // 原本没怀着，才记一次妊娠经历。
  assert.equal(profile.experience.pregnantExperience, 1);
});

test('userDirective 对不上使用者原话时整条强制令作废', () => {
  const chatState = makeChatState();
  const result = applyToolCall(chatState, {
    name: 'bsForceGestation',
    arguments: { female: '艾拉', userDirective: '剧情需要她现在就临产', equivalentDays: 287, fetusCount: 2 },
  }, { recentMessages: userMessages });

  assert.equal(result.applied, false);
  assert.match(result.message, /未能在使用者发言中找到/);
  assert.equal(profileOf(chatState).base.stage, '黄体期');
});

test('同一条强制令只认第一次，不随上下文窗口反复重置孕期', () => {
  const chatState = makeChatState();
  assert.equal(forceGestation(chatState).applied, true);

  const again = forceGestation(chatState);
  assert.equal(again.applied, false);
  assert.match(again.message, /已经生效过/);
});

test('过短的 userDirective 无法核对，直接拒绝', () => {
  const chatState = makeChatState();
  const result = applyToolCall(chatState, {
    name: 'bsSetGestationLock',
    arguments: { female: '艾拉', userDirective: '锁住', freeze: true, loopBackDays: 287 },
  }, { recentMessages: userMessages });

  assert.equal(result.applied, false);
  assert.match(result.message, /过短/);
});

test('bsSetGestationLock 冻结孕期并把当前胎儿存成循环模板', () => {
  const chatState = makeChatState();
  forceGestation(chatState);
  const result = setLock(chatState);
  assert.equal(result.applied, true);

  const profile = profileOf(chatState);
  assert.equal(profile.bio.gestationModifierMultiplier, 0);
  assert.equal(profile.bio.gestationEffectiveSpeed, 0);
  assert.equal(profile.gestationLock.name, '妊娠诅咒');
  assert.equal(profile.gestationLock.loopBackDays, 287);
  assert.equal(profile.gestationLock.loopFetusCount, 2);
  assert.equal(profile.gestationLock.loopFetusTemplates.length, 2);
  for (const template of profile.gestationLock.loopFetusTemplates) {
    assert.equal(template.weight, 1.6);
    assert.equal(template.fathers, '莱昂');
  }
});

test('分娩结束后退回锁定孕期并重新怀上同样的胎儿', () => {
  const chatState = makeChatState();
  forceGestation(chatState);
  setLock(chatState);

  const before = profileOf(chatState);
  const tendencies = before.pregnant.fetuses.map((fetus) => fetus.tendencyAngle);

  const result = applyToolCall(chatState, { name: 'bsChildbirth', arguments: { female: '艾拉' } });
  assert.equal(result.applied, true);

  const profile = profileOf(chatState);
  // 孩子留下来了，循环只重置子宫。
  assert.equal(profile.children.length, 2);
  assert.equal(profile.experience.surgicalBirthExperience, 1);
  // 阶段被推回去，而不是停在产后恢复。
  assert.equal(profile.base.stage, '逾期');
  assert.equal(profile.pregnant.effectivePregnantDays, 287);
  assert.equal(profile.pregnant.fetuses.length, 2);
  assert.equal(profile.pregnant.amnionDurability, 100);
  // 巨大儿、父方、胎位都照模板复刻。
  for (const fetus of profile.pregnant.fetuses) {
    assert.equal(fetus.weight, 1.6);
    assert.equal(fetus.fathers, '莱昂');
    assert.ok(Number.isInteger(fetus.embryoId));
  }
  assert.deepEqual(profile.pregnant.fetuses.map((fetus) => fetus.tendencyAngle), tendencies);
  assert.match(profile.notify.secondly, /妊娠诅咒再次生效/);
});

test('循环回退把子宫压力种在阈值以下，留出几天才发动下一次产兆', () => {
  const chatState = makeChatState();
  forceGestation(chatState);
  setLock(chatState);
  applyToolCall(chatState, { name: 'bsChildbirth', arguments: { female: '艾拉' } });

  const profile = profileOf(chatState);
  const pressure = Number(profile.base.uterinePressure);
  assert.ok(pressure > 0, `压力应被种下，实际 ${pressure}`);
  // 阈值是压力上限的一半；种在阈值以下，两次分娩才不会挤进同一天。
  assert.ok(pressure < 150 * 0.5, `压力应低于危机阈值，实际 ${pressure}`);
  assert.equal(profile.cooldown.pregnancyPressureWarning, false);
});

test('反复分娩持续累加孩子与分娩经历，锁不会自行解除', () => {
  const chatState = makeChatState();
  forceGestation(chatState);
  setLock(chatState);

  for (let round = 0; round < 3; round += 1) {
    const result = applyToolCall(chatState, { name: 'bsChildbirth', arguments: { female: '艾拉' } });
    assert.equal(result.applied, true, `第 ${round + 1} 轮分娩应成功`);
  }

  const profile = profileOf(chatState);
  assert.equal(profile.children.length, 6);
  assert.equal(profile.experience.surgicalBirthExperience, 3);
  assert.equal(profile.gestationLock.loopBackDays, 287);
  assert.equal(profile.base.stage, '逾期');
  assert.equal(profile.pregnant.fetuses.length, 2);
});

test('clear=true 解除锁定后分娩不再回退', () => {
  const chatState = makeChatState();
  forceGestation(chatState);
  setLock(chatState);

  const cleared = applyToolCall(chatState, {
    name: 'bsSetGestationLock',
    arguments: { female: '艾拉', userDirective: DIRECTIVE, clear: true },
  }, { recentMessages: userMessages });
  assert.equal(cleared.applied, true);
  assert.equal(profileOf(chatState).gestationLock, undefined);

  applyToolCall(chatState, { name: 'bsChildbirth', arguments: { female: '艾拉' } });
  const profile = profileOf(chatState);
  assert.equal(profile.base.stage, '产后恢复');
  assert.equal(profile.pregnant.fetuses.length, 0);
});
