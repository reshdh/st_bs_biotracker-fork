// 子宫压力拆成基线＋波动：事件加值会回落，所以攒不出后果。
import assert from 'node:assert/strict';
import test from 'node:test';

import * as state from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import {
  getUterinePressureBaseline,
  getUterinePressureBand,
  PRESSURE_DECAY_PER_HOUR,
} from '../scripts/uterine_pressure_config.js';

function pressureCapFor(days) {
  return Math.round(50 + ((150 - 50) * (Math.min(10, Math.floor(days / 28)) / 10)));
}

function makeChatState({ stage, days, pressure = 0, complication, engaged = 0 } = {}) {
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
        fetusesCount: 1,
        fetuses: [{ id: 1, engaged: engaged > 0, weight: 1.4, tendencyAngle: 0, gender: '女', race: '人类' }],
        fetalEnergyDrain: 0,
        amnionDurability: 100,
        engagedDays: 0,
        complication,
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
const overBaseline = (profile, days) => (
  profile.base.uterinePressure - getUterinePressureBaseline(days, pressureCapFor(days))
);

test('孕早中期基线为 0，孕晚期以后才随孕周爬', () => {
  assert.equal(getUterinePressureBaseline(56, pressureCapFor(56)), 0, '孕早期不该有基线');
  assert.equal(getUterinePressureBaseline(140, pressureCapFor(140)), 0, '孕中期不该有基线');
  const late = getUterinePressureBaseline(238, pressureCapFor(238));
  const term = getUterinePressureBaseline(273, pressureCapFor(273));
  const over = getUterinePressureBaseline(301, pressureCapFor(301));
  assert.ok(late > 0, '孕晚期该有基线');
  assert.ok(term > late, '临产期基线该更高');
  assert.ok(over > term, '逾期基线该继续爬');
});

// 基线本身不该把人推过危机线：过线要靠事件叠上来。
test('基线永远低于危机阈值', () => {
  for (const days of [200, 238, 273, 287, 301, 320]) {
    const cap = pressureCapFor(days);
    assert.ok(
      getUterinePressureBaseline(days, cap) < cap * 0.5,
      `基线不该自己越过危机线（${days} 天）`,
    );
  }
});

// 这是整个拆分的核心：没有回落，事件加值就是永久的。
test('一次事件的加值会在几小时内落回基线', () => {
  const days = 140;
  const chatState = makeChatState({ stage: '孕中期', days });
  applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { uterinePressure: 35 } } });
  assert.ok(profileOf(chatState).base.uterinePressure >= 35, '事件该把值推上去');

  for (let hour = 0; hour < 6; hour += 1) {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  }
  assert.equal(profileOf(chatState).base.uterinePressure, 0, '孕中期基线为 0，该落回 0');
});

test('回落速度与推进粒度一致', () => {
  const days = 140;
  const a = makeChatState({ stage: '孕中期', days, pressure: 40 });
  applyToolCall(a, { name: 'bsPassedTime', arguments: { hour: 2 } });
  const twoHours = profileOf(a).base.uterinePressure;

  const b = makeChatState({ stage: '孕中期', days, pressure: 40 });
  applyToolCall(b, { name: 'bsPassedTime', arguments: { hour: 1 } });
  applyToolCall(b, { name: 'bsPassedTime', arguments: { hour: 1 } });
  assert.equal(twoHours, profileOf(b).base.uterinePressure, '推一次两小时与推两次一小时该相同');
  assert.ok(twoHours <= 40 - (PRESSURE_DECAY_PER_HOUR * 2) + 0.001);
});

// 旧模型下这必然出事：加值累在同一个数上，攒够就流产。
test('孕中期反复剧烈事件二十次也不会出事', () => {
  const chatState = makeChatState({ stage: '孕中期', days: 140 });
  let maxOver = 0;
  for (let round = 0; round < 20; round += 1) {
    applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { uterinePressure: 25 } } });
    maxOver = Math.max(maxOver, overBaseline(profileOf(chatState), 140));
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  }
  const after = profileOf(chatState);
  assert.equal(after.base.stage, '孕中期', '不该翻阶段');
  assert.equal(after.experience?.miscarriageExperience || 0, 0, '不该记流产');
  assert.ok(maxOver < 40, `单次事件不该攒到先兆档，实际最高 ${maxOver.toFixed(1)}`);
});

// 只有加得比落得快才推得上去——那正是「持续不断的高强度」。
test('持续施压才爬得到高档，松手就落回来', () => {
  const chatState = makeChatState({ stage: '孕中期', days: 140 });
  for (let hour = 0; hour < 8; hour += 1) {
    applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { uterinePressure: 12 } } });
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  }
  const peak = overBaseline(profileOf(chatState), 140);
  assert.ok(peak >= 25, `持续施压该爬到成串档以上，实际 ${peak.toFixed(1)}`);

  for (let hour = 0; hour < 8; hour += 1) {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  }
  assert.equal(profileOf(chatState).base.uterinePressure, 0, '松手之后该落回基线');
});

test('分档读高出基线多少，不读绝对值', () => {
  assert.equal(getUterinePressureBand(0), null);
  assert.equal(getUterinePressureBand(9), null);
  assert.equal(getUterinePressureBand(10)?.key, 'tightening');
  assert.equal(getUterinePressureBand(25)?.key, 'series');
  assert.equal(getUterinePressureBand(40)?.key, 'threatened');
  assert.equal(getUterinePressureBand(999)?.key, 'threatened', '先兆是最高档');
});

// 逾期基线很高，若按绝对值判档，她会在什么都没发生时一直挂着警告。
test('逾期光靠基线不出声', () => {
  const days = 301;
  const cap = pressureCapFor(days);
  const baseline = getUterinePressureBaseline(days, cap);
  const chatState = makeChatState({ stage: '逾期', days, pressure: baseline });

  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  const said = String(profileOf(chatState).notify?.secondly || '');
  assert.doesNotMatch(said, /发紧|宫缩成串|出血/, `基线本身不该出声，实际「${said}」`);
});

// 出声按档而不按「第几次」：只分首次与后续会让发紧档也说出「可能出血」。
test('每一档说自己的话，发紧档不提出血', () => {
  const chatState = makeChatState({ stage: '孕中期', days: 140 });
  const lines = [];
  for (let hour = 0; hour < 5; hour += 1) {
    applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { uterinePressure: 12 } } });
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
    const over = overBaseline(profileOf(chatState), 140);
    const band = getUterinePressureBand(over);
    const said = String(profileOf(chatState).notify?.secondly || '');
    if (band?.key === 'tightening' && said) lines.push(said);
  }
  assert.ok(lines.length > 0, '该有发紧档的出声');
  for (const line of lines) {
    assert.doesNotMatch(line, /出血/, `发紧档不该提出血：「${line}」`);
  }
});

// 健康角色的这条路到先兆为止。
test('健康角色压力顶满连推十轮也不流产不发动', () => {
  const days = 140;
  const chatState = makeChatState({ stage: '孕中期', days, pressure: pressureCapFor(days) });
  for (let round = 0; round < 10; round += 1) {
    applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { uterinePressure: 30 } } });
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  }
  const after = profileOf(chatState);
  assert.equal(after.base.stage, '孕中期');
  assert.equal(after.experience?.miscarriageExperience || 0, 0);
});

test('带病理标记的角色到先兆档才会真的出事', () => {
  const days = 140;
  const chatState = makeChatState({ stage: '孕中期', days, pressure: pressureCapFor(days), complication: '胎盘前置' });
  for (let round = 0; round < 6; round += 1) {
    applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { uterinePressure: 30 } } });
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
    if (profileOf(chatState).base.stage !== '孕中期') break;
  }
  assert.equal(profileOf(chatState).base.stage, '产后恢复', '带标记该走得通原来那条路');
  assert.equal(profileOf(chatState).experience?.miscarriageExperience, 1);
});
