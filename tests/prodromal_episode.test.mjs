// 前驱分两种：可逆发作（会散、能反复）与真前驱（单向倒计时）。
// 判据是胎头有没有深固定。
import assert from 'node:assert/strict';
import test from 'node:test';

import * as state from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import { DESCENT_ENGAGED, DESCENT_FIXED } from '../scripts/fetal_descent_config.js';
import {
  getEpisodeDailyChance,
  rollEpisodeHours,
  EPISODE_HOURS,
  EPISODE_COOLDOWN_HOURS,
  EPISODE_PAIN,
} from '../scripts/prodromal_config.js';

function makeChatState({ stage = '逾期', days = 290, descent = 60, episodeHours, engagedDays = 5 } = {}) {
  const chatState = state.createEmptyChatState();
  chatState.characters['艾拉'] = {
    name: '艾拉',
    initialized: true,
    runtime: {},
    profile: {
      base: { stage, days: 0, vitality: 100, psyStress: 100, uterinePressure: 0, age: 24, race: '人类', isHere: true, laborPain: 0 },
      pregnant: {
        pregnantDays: days,
        effectivePregnantDays: days,
        fetusesCount: 1,
        fetuses: [{ id: 1, weight: 3.3, tendencyAngle: 0, descent, gender: '女', race: '人类' }],
        fetalEnergyDrain: 0,
        amnionDurability: 100,
        engagedDays,
        prodromalEpisodeHours: episodeHours,
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
const pinDescent = (chatState, value) => {
  profileOf(chatState).pregnant.fetuses[0].descent = value;
};

test('发作时长落在配置区间内', () => {
  for (const roll of [0, 0.5, 0.999]) {
    const hours = rollEpisodeHours(() => roll);
    assert.ok(hours >= EPISODE_HOURS.min && hours <= EPISODE_HOURS.max, `实际 ${hours}`);
  }
});

// 挂在同一次掷骰上会让发作跟分娩一样罕见，而它们是两种量级的事。
test('发作有自己的频率，入盆后明显更高', () => {
  const unengaged = getEpisodeDailyChance(0);
  const engaged = getEpisodeDailyChance(1);
  assert.ok(engaged > unengaged * 3, `入盆后该显著更频繁：${engaged} vs ${unengaged}`);
});

test('一次发作会自己散掉，并留出间隔', () => {
  const chatState = makeChatState({ episodeHours: 3 });
  const lines = [];
  for (let hour = 0; hour < 4; hour += 1) {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
    pinDescent(chatState, 60);
    lines.push(String(profileOf(chatState).notify?.firstly || ''));
  }
  const after = profileOf(chatState);
  assert.equal(clampToZero(after.pregnant.prodromalEpisodeHours), 0, '该散掉了');
  assert.ok(
    after.pregnant.prodromalEpisodeCooldownHours > 0,
    '散掉之后该留间隔，否则「狼来了」会连成一片背景噪音',
  );
  assert.ok(lines.some((line) => /散了/.test(line)), `该出声说它散了，实际 ${JSON.stringify(lines)}`);
  assert.equal(after.base.stage, '逾期', '发作不该翻阶段');
});

function clampToZero(value) {
  return Math.max(0, Number(value) || 0);
}

test('发作期间有痛感，散掉后归零', () => {
  const chatState = makeChatState({ episodeHours: 3 });
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  pinDescent(chatState, 60);
  assert.equal(profileOf(chatState).base.laborPain, EPISODE_PAIN, '发作时该有痛感');

  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 4 } });
  assert.equal(profileOf(chatState).base.laborPain, 0, '散掉后该归零');
});

// 发作是事件，压力档是状态。压力档走 secondly 且在发作之后才写，
// 所以发作若也写 secondly 会被它整句盖掉。
test('发作的出声走 firstly，不被压力档盖掉', () => {
  const chatState = makeChatState({ episodeHours: 3 });
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  const notify = profileOf(chatState).notify || {};
  assert.match(String(notify.firstly || ''), /宫缩/, 'firstly 该留着发作那句');
});

test('发作期间宫压被抬起来，散掉后落回去', () => {
  const chatState = makeChatState({ episodeHours: 4 });
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  pinDescent(chatState, 60);
  const during = profileOf(chatState).base.uterinePressure;

  for (let hour = 0; hour < 10; hour += 1) {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
    pinDescent(chatState, 60);
  }
  assert.ok(
    profileOf(chatState).base.uterinePressure < during,
    `散掉之后该落回去：${profileOf(chatState).base.uterinePressure} vs ${during}`,
  );
});

// 这是「催产反复失败」的全部来源：不是运气不好，是路没修通。
test('胎头没深固定时永远进不了真前驱，无论掷骰怎么走', () => {
  const chatState = makeChatState({ descent: DESCENT_FIXED - 5 });
  const original = Math.random;
  Math.random = () => 0; // 掷骰必过
  try {
    for (let hour = 0; hour < 200; hour += 1) {
      applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
      pinDescent(chatState, DESCENT_FIXED - 5);
      assert.notEqual(profileOf(chatState).base.stage, '产兆前驱', `第 ${hour} 小时不该进真前驱`);
    }
  } finally {
    Math.random = original;
  }
});

test('胎头深固定之后才进得了真前驱，而且不回头', () => {
  const chatState = makeChatState({ descent: 95 });
  const original = Math.random;
  Math.random = () => 0;
  try {
    let entered = false;
    for (let hour = 0; hour < 200; hour += 1) {
      applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
      if (profileOf(chatState).base.stage === '产兆前驱') { entered = true; break; }
      if (!['临产期', '逾期'].includes(String(profileOf(chatState).base.stage || ''))) break;
    }
    assert.ok(entered, '深固定之后该进得了真前驱');
    assert.ok(
      profileOf(chatState).pregnant.prodromalRemainingHours > 0,
      '真前驱该是有倒计时的那一种',
    );
  } finally {
    Math.random = original;
  }
});

test('未入盆时发作频率极低，入盆后才成串', () => {
  assert.ok(getEpisodeDailyChance(0) < 0.15, '胎头还浮着时几乎不发作');
  assert.ok(getEpisodeDailyChance(1) > 0.2, '入盆后该常发作');
});

test('发作状态过得了 patch 白名单', () => {
  const patched = state.sanitizeProfilePatch({
    pregnant: {
      prodromalEpisodeHours: 3.5,
      prodromalEpisodeCooldownHours: EPISODE_COOLDOWN_HOURS,
      prodromalEpisodeCount: 2,
    },
  });
  assert.equal(patched.pregnant.prodromalEpisodeHours, 3.5, '正在进行的发作不该在重载后消失');
  assert.equal(patched.pregnant.prodromalEpisodeCooldownHours, EPISODE_COOLDOWN_HOURS);
  assert.equal(patched.pregnant.prodromalEpisodeCount, 2);
});

test('间隔期间不会立刻再发作', () => {
  const chatState = makeChatState({ episodeHours: 1 });
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 2 } });
  pinDescent(chatState, 60);
  const cooldown = profileOf(chatState).pregnant.prodromalEpisodeCooldownHours;
  assert.ok(cooldown > 0);

  const countBefore = profileOf(chatState).pregnant.prodromalEpisodeCount || 0;
  const original = Math.random;
  Math.random = () => 0; // 掷骰必过，但间隔该挡住
  try {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  } finally {
    Math.random = original;
  }
  assert.equal(
    profileOf(chatState).pregnant.prodromalEpisodeCount || 0,
    countBefore,
    '间隔没走完不该起新发作',
  );
});

// 两种状态不能并存：不清掉发作，它会继续抬着压力地板，
// 真前驱自己的压力曲线就被顶住不动，破水那条门槛永远够不着。
test('进真前驱时把可逆发作清掉', () => {
  const chatState = makeChatState({ descent: 95, episodeHours: 4 });
  const original = Math.random;
  Math.random = () => 0;
  try {
    for (let hour = 0; hour < 200; hour += 1) {
      applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
      if (profileOf(chatState).base.stage === '产兆前驱') break;
    }
  } finally {
    Math.random = original;
  }
  const after = profileOf(chatState);
  assert.equal(after.base.stage, '产兆前驱');
  assert.equal(clampToZero(after.pregnant.prodromalEpisodeHours), 0, '真前驱里不该还挂着发作');
  assert.equal(clampToZero(after.pregnant.prodromalEpisodeCooldownHours), 0);
});

// 真前驱期间压力该越来越高，破水才有「越接近越可能」的窗口。
test('真前驱的宫压随倒计时爬升，破水在后半段才可能', () => {
  const chatState = makeChatState({ descent: 95 });
  const original = Math.random;
  Math.random = () => 0;
  try {
    for (let hour = 0; hour < 200; hour += 1) {
      applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
      if (profileOf(chatState).base.stage === '产兆前驱') break;
    }
  } finally {
    Math.random = original;
  }
  assert.equal(profileOf(chatState).base.stage, '产兆前驱');

  const early = applyToolCall(chatState, { name: 'bsRuptureMembranes', arguments: { female: '艾拉' } });
  assert.equal(early.applied, false, '刚进前驱时压力还不够，不该破得了');
  const startPressure = profileOf(chatState).base.uterinePressure;

  let ruptured = false;
  for (let hour = 0; hour < 48; hour += 1) {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
    if (profileOf(chatState).base.stage !== '产兆前驱') break;
    const attempt = applyToolCall(chatState, { name: 'bsRuptureMembranes', arguments: { female: '艾拉' } });
    if (attempt.applied) { ruptured = true; break; }
  }
  assert.ok(ruptured, '倒计时走到后半段该破得了——门槛读绝对值时这里永远失败');
  assert.ok(
    profileOf(chatState).base.uterinePressure > startPressure - 1,
    '压力该是爬上去的，不是恒定',
  );
  assert.equal(profileOf(chatState).base.stage, '第一产程', '破水该直接推进第一产程');
});

test('入盆线与深固定线之间是发作的地盘', () => {
  assert.ok(DESCENT_ENGAGED < DESCENT_FIXED);
  // 入盆了但没固定：会发作、不会真发动
  const engagedNotFixed = (DESCENT_ENGAGED + DESCENT_FIXED) / 2;
  assert.ok(engagedNotFixed >= DESCENT_ENGAGED && engagedNotFixed < DESCENT_FIXED);
});
