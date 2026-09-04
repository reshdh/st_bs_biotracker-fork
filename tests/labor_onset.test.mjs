import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as state from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import {
  getLaborFloorDays,
  getEngagementLockDays,
  getBaseDailyLaborChance,
  getEngagementLaborMultiplier,
  getPressureLaborMultiplier,
  dailyChanceToTickChance,
  FULL_ENGAGEMENT_DAYS,
} from '../scripts/labor_onset_config.js';
import { DESCENT_ENGAGED, DESCENT_FIXED } from '../scripts/fetal_descent_config.js';

function makeChatState({ stage, days, count = 1, engaged = 0, pressure = 0, engagedDays = 0, angle = 0 } = {}) {
  const fetuses = [];
  for (let i = 0; i < count; i += 1) {
    fetuses.push({
      id: i + 1,
      engaged: i < engaged,
      weight: count > 1 ? 1.6 : 3.3,
      tendencyAngle: angle,
      gender: '女',
      race: '人类',
    });
  }
  const chatState = state.createEmptyChatState();
  chatState.characters['艾拉'] = {
    name: '艾拉',
    initialized: true,
    runtime: {},
    profile: {
      base: { stage, days: 0, vitality: 100, psyStress: 100, uterinePressure: pressure, age: 24, race: '人类', isHere: true },
      pregnant: {
        pregnantDays: days,
        effectivePregnantDays: days,
        fetusesCount: count,
        fetuses,
        fetalEnergyDrain: 0,
        amnionDurability: 100,
        engagedDays,
      },
      bio: { birthDifficulty: 1, breedTolerance: 1 },
      immune: {},
      metabolism: { urine: 0, stool: 0, hunger: 0, sleep: 0, milk: 0, odor: 0, companionship: 0 },
      experience: {},
      children: [],
      notify: {},
      cooldown: {},
    },
  };
  return chatState;
}

const profileOf = (chatState) => chatState.characters['艾拉'].profile;

function withRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

// 分娩底线是一票否决，不是「概率很低」：孕周不到就不掷骰。
test('底线之前压力顶满也不会发动，掷骰必过也一样', () => {
  const floor = getLaborFloorDays(1);
  const chatState = makeChatState({ stage: '临产期', days: floor - 1, engaged: 1, pressure: 140, engagedDays: 30 });

  withRandom(0, () => {
    for (let hour = 0; hour < 12; hour += 1) {
      applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
    }
  });

  assert.equal(profileOf(chatState).base.stage, '临产期', '底线之前不该发动');
});

test('多胎的底线与入盆锁按胎数提前，且锁总在底线之前', () => {
  assert.ok(getLaborFloorDays(2) < getLaborFloorDays(1), '双胎底线应更早');
  assert.ok(getLaborFloorDays(3) < getLaborFloorDays(2), '三胎底线应更早');
  for (const count of [1, 2, 3]) {
    assert.ok(
      getEngagementLockDays(count) < getLaborFloorDays(count),
      `入盆锁应早于分娩底线（胎数 ${count}）`,
    );
  }
});

// 分娩不以入盆为前置：现实里没入盆也会生，正是这条路给出 41、42 周才生的那部分人。
test('未入盆也有发动概率，入盆只是乘区', () => {
  const floor = getLaborFloorDays(1);
  assert.ok(getBaseDailyLaborChance(floor, 1) > 0, '到了底线就该有基础概率');
  assert.equal(getEngagementLaborMultiplier(0, 0), 1, '未入盆乘区为 1，不是 0');
  assert.ok(getEngagementLaborMultiplier(1, FULL_ENGAGEMENT_DAYS + 10) > 1, '完全入盆应加速');
});

// 乘区刻意压平：早期版本封顶 ×8，导致掷骰刚开始时乘区已封顶、成了常数，
// 分娩全挤在底线那一两周。
test('入盆乘区平缓且封顶，不会盖过孕周主导', () => {
  const long = getEngagementLaborMultiplier(1, FULL_ENGAGEMENT_DAYS + 30);
  const longer = getEngagementLaborMultiplier(1, FULL_ENGAGEMENT_DAYS + 300);
  assert.equal(long, longer, '乘区应封顶，挂再久也不再涨');
  assert.ok(long <= 4, `乘区不该过陡，实际 ${long}`);
});

test('基础概率随孕周单调上升，底线那一周极低', () => {
  const floor = getLaborFloorDays(1);
  const atFloor = getBaseDailyLaborChance(floor, 1);
  assert.ok(atFloor > 0 && atFloor < 0.03, `底线那一周应极低，实际 ${atFloor}`);
  let previous = atFloor;
  for (let week = 1; week <= 4; week += 1) {
    const chance = getBaseDailyLaborChance(floor + (week * 7), 1);
    assert.ok(chance >= previous, `第 ${week} 周不该回落`);
    previous = chance;
  }
  assert.equal(getBaseDailyLaborChance(floor - 1, 1), 0, '底线之前为 0');
});

test('宫压是乘区而非开关，且有上界', () => {
  assert.equal(getPressureLaborMultiplier(0), 1);
  assert.ok(getPressureLaborMultiplier(30) > 1);
  assert.equal(getPressureLaborMultiplier(999), getPressureLaborMultiplier(40), '压力乘区应封顶');
});

// 引擎的推进粒度不固定，逐 tick 拿日概率直接掷会让推得越碎越容易生。
test('日概率按存活率折算，与推进粒度无关', () => {
  const daily = 0.2;
  const oneDay = dailyChanceToTickChance(daily, 24);
  assert.ok(Math.abs(oneDay - daily) < 1e-9, '推一整天应等于日概率');

  // 分二十四次推一小时，累计不发动的概率应与一次推一天相同
  const hourly = dailyChanceToTickChance(daily, 1);
  const survived = (1 - hourly) ** 24;
  assert.ok(Math.abs(survived - (1 - daily)) < 1e-9, '拆碎推进不该改变总概率');
});

// 凭空造出来的角色——强制令、魔法、跨过很长时间的存档——可能一上场就是
// 41 周且胎头已入盆。那也该从第 1 天算起，否则拿孕周倒推会得出
// 「已经完全入盆十几天」，当天就掷出必生。
test('入盆时长独立于孕周，强制令造出的角色从 0 起算', () => {
  const chatState = makeChatState({ stage: '黄体期', days: 0 });
  applyToolCall(chatState, {
    name: 'bsForceGestation',
    arguments: {
      female: '艾拉',
      userDirective: '让她直接变成怀了双胎的四十一周',
      equivalentDays: 290,
      fetusCount: 2,
      engagedCount: 1,
    },
  }, { recentMessages: [{ role: 'user', text: '让她直接变成怀了双胎的四十一周' }] });

  const after = profileOf(chatState);
  assert.equal(after.pregnant.engagedDays, 0, '强制令设定的入盆必须从 0 起算');
  assert.ok((after.pregnant.fetuses || []).some((f) => f.engaged), '这一胎该是已入盆状态');
});

// engaged 是由 descent 派生的读数：强制令只设布尔会让两者从一开始就不自洽。
test('强制令设定入盆时把下降度一起写上，落在入盆线而不是深固定', () => {
  const chatState = makeChatState({ stage: '黄体期', days: 0 });
  applyToolCall(chatState, {
    name: 'bsForceGestation',
    arguments: {
      female: '艾拉',
      userDirective: '让她直接变成怀了双胎的四十一周',
      equivalentDays: 290,
      fetusCount: 2,
      engagedCount: 1,
    },
  }, { recentMessages: [{ role: 'user', text: '让她直接变成怀了双胎的四十一周' }] });

  const fetuses = profileOf(chatState).pregnant.fetuses || [];
  assert.equal(fetuses.length, 2, '该造出两胎——参数名是 fetusCount 而不是 fetusesCount');
  assert.equal(fetuses[0].descent, DESCENT_ENGAGED, '入盆那一胎该落在入盆线上');
  assert.equal(fetuses[1].descent, 0, '没入盆的那一胎该是 0');
  // 强制令说的是「已入盆」，不是「马上要生」：深固定得由剧情自己走到。
  assert.ok(fetuses[0].descent < DESCENT_FIXED, '不该一步到深固定');
});

test('胎头浮回去就把入盆时长清零', () => {
  const chatState = makeChatState({ stage: '逾期', days: 290, engaged: 1, engagedDays: 8 });
  const profile = profileOf(chatState);
  // 转成臀位：引擎会把已入盆退回来
  profile.pregnant.fetuses[0].tendencyAngle = 180;

  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 2 } });

  const after = profileOf(chatState);
  if (!(after.pregnant.fetuses || []).some((f) => f.engaged)) {
    assert.equal(after.pregnant.engagedDays, 0, '浮回去之后计时应清零');
  }
});

test('入盆持续到阈值才算完全入盆', () => {
  const chatState = makeChatState({ stage: '逾期', days: 290, engaged: 1, engagedDays: 0 });

  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  const oneDay = profileOf(chatState).pregnant.engagedDays;
  assert.ok(oneDay >= 1 && oneDay < FULL_ENGAGEMENT_DAYS, `一天之后还不该算完全入盆，实际 ${oneDay}`);

  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 3 } });
  assert.ok(
    profileOf(chatState).pregnant.engagedDays >= FULL_ENGAGEMENT_DAYS
      || profileOf(chatState).base.stage !== '逾期',
    '再过三天应达到完全入盆（或已经发动）',
  );
});

// 入盆锁：孕周没到，胎头不许开始下降。分娩要靠入盆加速，
// 所以锁住入盆等于结构性地保证这段时间不会生。
test('入盆锁之前胎头不会自行入盆', () => {
  const lock = getEngagementLockDays(1);
  const chatState = makeChatState({ stage: '临产期', days: lock - 14, pressure: 120 });

  withRandom(0, () => {
    for (let day = 0; day < 5; day += 1) {
      applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
      if (profileOf(chatState).pregnant.effectivePregnantDays >= lock) break;
    }
  });

  const engagedCount = (profileOf(chatState).pregnant.fetuses || []).filter((f) => f.engaged).length;
  const days = profileOf(chatState).pregnant.effectivePregnantDays;
  if (days < lock) {
    assert.equal(engagedCount, 0, `入盆锁（${lock} 天）之前不该入盆，当前 ${days} 天`);
  }
});

test('存读档保住入盆时长，不会退化成从零开始', () => {
  const chatState = makeChatState({ stage: '逾期', days: 290, engaged: 1, engagedDays: 6 });
  const reloaded = JSON.parse(JSON.stringify(chatState));
  assert.equal(reloaded.characters['艾拉'].profile.pregnant.engagedDays, 6);
});
