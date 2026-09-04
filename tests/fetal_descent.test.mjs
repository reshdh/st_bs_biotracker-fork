// 胎头下降是一根连续轴，不是开关：所以「艰难地推回一部分」表达得出来。
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

import * as state from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import {
  isDescentEngaged,
  isDescentFixed,
  getDescentPushbackResistance,
  resolveDescentPushback,
  getDescentStep,
  DESCENT_ENGAGED,
  DESCENT_FIXED,
} from '../scripts/fetal_descent_config.js';

function makeChatState({ stage, days, count = 1, angle = 0, descent } = {}) {
  const fetuses = [];
  for (let i = 0; i < count; i += 1) {
    const fetus = {
      id: i + 1,
      weight: count > 1 ? 1.6 : 3.3,
      tendencyAngle: angle,
      gender: '女',
      race: '人类',
    };
    if (descent !== undefined) fetus.descent = descent;
    fetuses.push(fetus);
  }
  const chatState = state.createEmptyChatState();
  chatState.characters['艾拉'] = {
    name: '艾拉',
    initialized: true,
    runtime: {},
    profile: {
      base: { stage, days: 0, vitality: 100, psyStress: 100, uterinePressure: 0, age: 24, race: '人类', isHere: true },
      pregnant: {
        pregnantDays: days,
        effectivePregnantDays: days,
        fetusesCount: count,
        fetuses,
        fetalEnergyDrain: 0,
        amnionDurability: 100,
        engagedDays: 0,
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
const firstFetus = (chatState) => profileOf(chatState).pregnant.fetuses[0];

test('刻度顺序：入盆线在深固定线之前', () => {
  assert.ok(DESCENT_ENGAGED < DESCENT_FIXED);
  assert.equal(isDescentEngaged(DESCENT_ENGAGED - 1), false);
  assert.equal(isDescentEngaged(DESCENT_ENGAGED), true);
  assert.equal(isDescentFixed(DESCENT_FIXED - 1), false);
  assert.equal(isDescentFixed(DESCENT_FIXED), true);
});

// 二值状态下每次顶回去都是从零重来，这条轴才让「退一」成立。
test('越深越推不动，深固定之后完全无效', () => {
  assert.equal(getDescentPushbackResistance(0), 0);
  assert.equal(getDescentPushbackResistance(DESCENT_ENGAGED - 1), 0, '还浮着时没有阻力');
  assert.ok(getDescentPushbackResistance(60) > 0);
  assert.ok(getDescentPushbackResistance(80) > getDescentPushbackResistance(60), '越深阻力越大');
  assert.equal(getDescentPushbackResistance(DESCENT_FIXED), 1, '固定线上推不动');
  assert.equal(resolveDescentPushback(DESCENT_FIXED, 30), 0);
  assert.equal(resolveDescentPushback(DESCENT_FIXED + 10, 30), 0);
});

test('推回力度按阻力折算，不是全额生效', () => {
  const shallow = resolveDescentPushback(DESCENT_ENGAGED, 10);
  const deep = resolveDescentPushback(80, 10);
  assert.equal(shallow, 10, '刚到入盆线时推得动全额');
  assert.ok(deep > 0 && deep < shallow, `深处只退一部分，实际 ${deep}`);
});

test('fetalPushback 真的把下降度往回拨', () => {
  const chatState = makeChatState({ stage: '逾期', days: 290, descent: 60 });
  applyToolCall(chatState, {
    name: 'bsUpdateCharacterStatus',
    arguments: { female: '艾拉', options: { fetalPushback: 10 } },
  });
  const after = firstFetus(chatState);
  assert.ok(after.descent < 60, `该退回去一些，实际 ${after.descent}`);
  assert.ok(after.descent > 40, `不该一次退到底，实际 ${after.descent}`);
  assert.match(String(profileOf(chatState).notify?.secondly || ''), /往回顶/);
});

test('深固定之后再怎么推都不动，而且会出声说明', () => {
  const chatState = makeChatState({ stage: '逾期', days: 290, descent: DESCENT_FIXED + 5 });
  const before = firstFetus(chatState).descent;
  applyToolCall(chatState, {
    name: 'bsUpdateCharacterStatus',
    arguments: { female: '艾拉', options: { fetalPushback: 30 } },
  });
  assert.equal(firstFetus(chatState).descent, before, '固定之后不该退');
  assert.match(String(profileOf(chatState).notify?.secondly || ''), /顶不回去|卡在骨盆/);
});

// 顶回去把 engaged 也一起拨回来：两个读数不该自相矛盾。
test('推回到入盆线以下时 engaged 随之变假', () => {
  const chatState = makeChatState({ stage: '逾期', days: 290, descent: DESCENT_ENGAGED + 2 });
  applyToolCall(chatState, {
    name: 'bsUpdateCharacterStatus',
    arguments: { female: '艾拉', options: { fetalPushback: 20 } },
  });
  const after = firstFetus(chatState);
  assert.ok(after.descent < DESCENT_ENGAGED);
  assert.equal(after.engaged, false, 'engaged 该跟着下降度走');
});

test('下降度随时间推进，深固定之前必先经过入盆', () => {
  const chatState = makeChatState({ stage: '逾期', days: 287 });
  let sawEngaged = false;
  let previous = 0;
  for (let day = 0; day < 30; day += 1) {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
    const fetus = firstFetus(chatState);
    if (!fetus) break;
    const descent = Number(fetus.descent) || 0;
    // 胎位可能漂到臀位而归零，那是另一条规则；只在往前走时检查顺序。
    if (descent >= previous) {
      if (isDescentFixed(descent)) {
        assert.ok(sawEngaged, '深固定之前必须先经过入盆');
        return;
      }
      if (isDescentEngaged(descent)) sawEngaged = true;
    }
    previous = descent;
    const stage = String(profileOf(chatState).base.stage || '');
    if (stage !== '临产期' && stage !== '逾期') break;
  }
  assert.ok(sawEngaged, '至少该走到入盆');
});

// 这两条测纯函数而不是驱动引擎：胎位每天会随机漂移，
// 拿全引擎验「枕后位更慢」会被那个漂移污染，测试随机地挂。
test('偏离正枕位越多下降越慢', () => {
  const straight = getDescentStep('逾期', 24, 1, 0);
  const slight = getDescentStep('逾期', 24, 1, 15);
  const posterior = getDescentStep('逾期', 24, 1, 30);
  assert.ok(slight < straight, `偏 15° 该慢于正枕位：${slight} vs ${straight}`);
  assert.ok(posterior < slight, `偏 30° 该更慢：${posterior} vs ${slight}`);
  // 对称：偏 30° 与偏 330° 是同一件事
  assert.equal(getDescentStep('逾期', 24, 1, 330), posterior);
});

test('多胎抢同一个入口，占比越小下得越慢', () => {
  const single = getDescentStep('逾期', 24, 1, 0);
  const half = getDescentStep('逾期', 24, 0.5, 0);
  const third = getDescentStep('逾期', 24, 0.33, 0);
  assert.ok(half < single, `占一半该慢于单胎：${half} vs ${single}`);
  assert.ok(third < half, `占三分之一该更慢：${third} vs ${half}`);
});

test('逾期下降快于临产期，其余阶段不下降', () => {
  assert.ok(getDescentStep('逾期', 24, 1, 0) > getDescentStep('临产期', 24, 1, 0));
  assert.equal(getDescentStep('孕晚期', 24, 1, 0), 0);
  assert.equal(getDescentStep('孕中期', 24, 1, 0), 0);
});

test('下降步长与时间成正比', () => {
  const oneHour = getDescentStep('逾期', 1, 1, 0);
  assert.ok(Math.abs(getDescentStep('逾期', 24, 1, 0) - (oneHour * 24)) < 1e-9);
});

// 胎位转开就没有可下降的东西了——但已经卡进骨盆的拔不出来。
test('转成臀位会归零，但深固定的不会被拔出来', () => {
  const shallow = makeChatState({ stage: '逾期', days: 290, descent: 50 });
  firstFetus(shallow).tendencyAngle = 180;
  applyToolCall(shallow, { name: 'bsPassedTime', arguments: { hour: 2 } });
  assert.equal(firstFetus(shallow).descent, 0, '未固定的该归零');

  const fixed = makeChatState({ stage: '逾期', days: 290, descent: DESCENT_FIXED + 5 });
  firstFetus(fixed).tendencyAngle = 180;
  applyToolCall(fixed, { name: 'bsPassedTime', arguments: { hour: 2 } });
  assert.ok(isDescentFixed(firstFetus(fixed).descent), '深固定的不该被拔出来');
});

// 追踪模型下 patch 走的是重建式白名单：不列出的字段静默丢掉。
// descent 一旦漏掉，尿意容量会在某次追踪后无声弹回未入盆的档。
test('下降度过得了追踪模型的 patch 白名单', () => {
  const patched = state.sanitizeProfilePatch({
    pregnant: {
      fetuses: [{ weight: 3.3, tendencyAngle: 0, descent: 63, engaged: true }],
    },
  });
  assert.equal(patched.pregnant.fetuses[0].descent, 63, 'descent 不该被白名单丢掉');
});

// 这张白名单要跟 tools.js 写进 cooldown 的键一致：不在名单上的会被静默丢掉，
// 于是「已经出声过」在存读档之后失忆，同一次失禁重载后再响一遍。
// 用源码抽键名而不是手工维护一张表——以后加新键漏掉会直接报错。
test('cooldown 白名单覆盖 tools.js 写进去的每一个键', () => {
  const toolsSource = readFileSync(new URL('../scripts/tools.js', import.meta.url), 'utf8');
  const stateSource = readFileSync(new URL('../scripts/state.js', import.meta.url), 'utf8');

  const written = new Set();
  for (const match of toolsSource.matchAll(/cooldown(?:Key)?\s*[=.]\s*['"]?(\w*Warned|\w*Used|\w*Active)['"]?/g)) {
    if (match[1]) written.add(match[1]);
  }
  for (const match of toolsSource.matchAll(/cooldown\.(\w+)\s*=/g)) {
    written.add(match[1]);
  }
  for (const match of toolsSource.matchAll(/(\w+Warned|\w+Used|\w+Active):\s*(?:true|false|Boolean|should)/g)) {
    written.add(match[1]);
  }

  assert.ok(written.size >= 5, `该抽到若干 cooldown 键，实际 ${written.size}`);
  const missing = [...written].filter((key) => !stateSource.includes(`'${key}'`));
  assert.deepEqual(missing, [], `这些 cooldown 键不在 state.js 白名单上，存读档会丢：${missing.join(', ')}`);
});

test('漏尿与失禁的出声冷却过得了 patch 白名单', () => {
  const patched = state.sanitizeProfilePatch({
    cooldown: {
      urineLeakWarned: true,
      urineIncontinenceWarned: true,
      pregnancySymptomActive: true,
    },
  });
  assert.equal(patched.cooldown.urineLeakWarned, true, '丢了它，重载后同一次漏尿会再响');
  assert.equal(patched.cooldown.urineIncontinenceWarned, true, '丢了它，重载后同一次失禁会再响');
  assert.equal(patched.cooldown.pregnancySymptomActive, true);
});
