// 尿意与便意拆分：容量压缩、速率乘区、分档重加权、漏出三档、便意抽卡。
import assert from 'node:assert/strict';
import test from 'node:test';

import * as state from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import { getUterinePressureBaseline } from '../scripts/uterine_pressure_config.js';
import {
  BASE_METABOLISM_CAP,
  getStoolEngagedDifficulty,
  getUrineBandWeights,
  getUrineHardCap,
  getUrineFloor,
  getUrineLevel,
  getUrineMultipleAdjust,
  getUrineOrgasmDropRange,
  getUrineOrgasmIncontinenceChance,
  getUrineProduction,
  getUrineResidualValue,
  getUrineStressLeakChance,
  getUrineUrgeCap,
  getUrineUrgencyBreakChance,
  getUrineVoidDifficulty,
  URINE_INTERMITTENT_DROP_RATIO,
  URINE_INTERMITTENT_RESIDUAL_MULT,
} from '../scripts/metabolism_config.js';

function makeChatState(overrides = {}) {
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
        psyStress: 100,
        uterinePressure: 0,
        age: 24,
        race: '人类',
        ...(overrides.base || {}),
      },
      pregnant: {
        pregnantDays: 0,
        effectivePregnantDays: 0,
        fetusesCount: 0,
        fetuses: [],
        fetalEnergyDrain: 0,
        amnionDurability: 0,
        ...(overrides.pregnant || {}),
      },
      bio: { birthDifficulty: 1, breedTolerance: 1 },
      immune: {},
      metabolism: { urine: 0, stool: 0, hunger: 0, sleep: 0, milk: 0 },
      experience: {},
      children: [],
      notify: {},
      cooldown: {},
    },
  };
  return chatState;
}

const profileOf = (chatState) => chatState.characters['艾拉'].profile;

// 漏尿与便意都是掷骰机制，混进别的断言里就是一张彩票。
// 要验概率本身时直接调概率函数；要验别的东西时用这个把骰子钉死。
function withRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

test('excretion 旧档按 6:4 拆回尿意与便意，两项之和守恒', () => {
  const characterState = {
    profile: {
      base: { stage: '黄体期' },
      metabolism: { excretion: 100, hunger: 20 },
      pregnant: { fetuses: [] },
    },
  };
  state.normalizeCharacterPsychologyState(characterState);
  const metabolism = characterState.profile.metabolism;
  assert.equal(metabolism.excretion, undefined);
  assert.equal(metabolism.urine, 60);
  assert.equal(metabolism.stool, 40);
});

test('加载时的 clamp 用阶段性上限，不再硬写 150', () => {
  const characterState = {
    profile: {
      base: { stage: '逾期' },
      // 自然逾期入盆满深硬线是 43：若这里仍按 150 放行，运行时会突然掉档。
      metabolism: { urine: 140, stool: 40 },
      pregnant: { fetuses: [{ engaged: true, descent: 100, tendencyAngle: 0 }] },
    },
  };
  state.normalizeCharacterPsychologyState(characterState);
  assert.equal(characterState.profile.metabolism.urine, getUrineHardCap('逾期', 1));
  assert.equal(characterState.profile.metabolism.stool, 40);
});

test('fetus.engaged 不会被重建式白名单丢掉', () => {
  const patch = state.sanitizeProfilePatch({
    pregnant: { fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 5 }] },
  });
  assert.equal(patch.pregnant.fetuses[0].engaged, true);
  assert.equal(patch.pregnant.fetuses[0].weight, 1.6);
});

test('尿意是两条线：想去与收不住，孕期一起下压但余量收缩得更快', () => {
  // 非孕基线保持引擎原值，拆分不改变未怀孕角色的行为。
  assert.equal(getUrineUrgeCap('黄体期', 0), 100);
  assert.equal(getUrineHardCap('黄体期', 0), BASE_METABOLISM_CAP);

  // 两条线都往下压。
  assert.ok(getUrineUrgeCap('孕晚期', 0) < getUrineUrgeCap('孕中期', 0));
  assert.ok(getUrineHardCap('孕晚期', 0) < getUrineHardCap('孕中期', 0));

  // 关键：中间那段「还能憋」的厚度收缩得比想去那条线更快。
  const reserveOf = (stage, engaged) => getUrineHardCap(stage, engaged) - getUrineUrgeCap(stage, engaged);
  assert.ok(reserveOf('黄体期', 0) > reserveOf('孕中期', 0));
  assert.ok(reserveOf('孕中期', 0) > reserveOf('孕晚期', 0));
  assert.ok(reserveOf('孕晚期', 0) > reserveOf('逾期', 1));

  // 入盆是断点；一胎与两胎压的是同一个膀胱，所以两条线相同。
  assert.equal(getUrineUrgeCap('逾期', 1), getUrineUrgeCap('逾期', 2));
  assert.equal(getUrineHardCap('逾期', 1), getUrineHardCap('逾期', 2));
});

test('自然产量承担趟数，与容量压缩是两件事（弃速率倍率体系）', () => {
  // 每阶段固定产量：非孕 12 / 孕晚 15 / 临产·逾期 16 / 延产 16 / 产后 13
  assert.equal(getUrineProduction('黄体期'), 12);
  assert.equal(getUrineProduction('孕晚期'), 15);
  assert.equal(getUrineProduction('逾期'), 16);      // 默认自然逾期
  assert.equal(getUrineProduction('逾期', true), 16); // 延产同为 16（差异在容量/地板）
  assert.equal(getUrineProduction('产后恢复'), 13);
  // 多胎加产量：双胎 +2.5、三胎 +4.5
  assert.equal(getUrineMultipleAdjust(2).production, 2.5);
  assert.equal(getUrineMultipleAdjust(3).production, 4.5);
  // 多胎收满档/抬地板（结构性差异）
  assert.equal(getUrineMultipleAdjust(2).urge, -5);
  assert.equal(getUrineMultipleAdjust(2).floor, 5);
  assert.equal(getUrineMultipleAdjust(3).urge, -9);
  assert.equal(getUrineMultipleAdjust(3).floor, 9);
});

test('档位按两条线切：满 = 越过想去，爆 = 吃掉一半憋耐余量', () => {
  const urge = 52;
  const hard = 62;
  assert.equal(getUrineLevel(urge - 1, urge, hard), '高');
  assert.equal(getUrineLevel(urge, urge, hard), '满');
  assert.equal(getUrineLevel(urge + ((hard - urge) * 0.5), urge, hard), '爆');
  // 满不再意味着快漏了，它只意味着该去；正常人这一档还很稳。
  assert.equal(getUrineLevel(100, 100, BASE_METABOLISM_CAP), '满');
});

test('尿意分档权重：base 全程 1（肾一直在造），decay 全程 0（尿不会自己少）', () => {
  const urge = 52;
  const hard = 62;
  const low = getUrineBandWeights(5, urge, hard);
  const mid = getUrineBandWeights(urge * 0.6, urge, hard);
  const high = getUrineBandWeights(urge * 0.8, urge, hard);
  const full = getUrineBandWeights(urge, urge, hard);
  const burst = getUrineBandWeights(hard, urge, hard);
  // base 全程 1——满/爆不再归零，肾不会因为膀胱满了就停止造尿
  assert.equal(low.base, 1);
  assert.equal(mid.base, 1);
  assert.equal(high.base, 1);
  assert.equal(full.base, 1);
  assert.equal(burst.base, 1);
  // decay 全程 0——尿不会自己蒸发
  assert.equal(low.decayPerHour, 0);
  assert.equal(full.decayPerHour, 0);
  assert.equal(burst.decayPerHour, 0);
  // stimulus 仍然往上走：憋着的时候外部刺激更有效
  assert.ok(full.stimulus > high.stimulus);
  assert.ok(full.stimulus > low.stimulus);
});

test('憋不住是硬机制：余量吃光必然失禁，跟怀不怀孕无关', () => {
  // 非孕角色也一样，只是她的余量厚得多。
  const urge = 100;
  const hard = BASE_METABOLISM_CAP;
  assert.equal(getUrineUrgencyBreakChance(urge - 10, urge, hard), 0, '想去之下不算硬撑');
  assert.equal(getUrineUrgencyBreakChance(urge, urge, hard), 0, '刚到想去时还是稳的');
  assert.equal(getUrineUrgencyBreakChance(hard, urge, hard), 1, '抵到收不住就是收不住');
  // 曲线取平方：前半段撑得住，末尾陡然崩掉。
  const half = getUrineUrgencyBreakChance(urge + ((hard - urge) * 0.5), urge, hard);
  const late = getUrineUrgencyBreakChance(urge + ((hard - urge) * 0.9), urge, hard);
  assert.ok(half < 0.3, `中途应该还撑得住，实际 ${half}`);
  assert.ok(late > half * 2, `末尾应该陡然崩掉，实际 ${late} vs ${half}`);

  // 孕期余量薄，同样的绝对增量更容易把她推过去。
  const pregUrge = getUrineUrgeCap('逾期', 1);
  const pregHard = getUrineHardCap('逾期', 1);
  assert.ok(
    getUrineUrgencyBreakChance(pregUrge + 5, pregUrge, pregHard)
      > getUrineUrgencyBreakChance(urge + 5, urge, hard),
    '同样多憋 5 点，入盆后崩的概率应该更高',
  );
});

test('应激性漏尿看盆底而非量：未入盆时同档概率明显更低', () => {
  const urge = 52;
  const hard = 62;
  const value = urge * 0.8;
  const engaged = getUrineStressLeakChance(value, urge, hard, 1);
  const unengaged = getUrineStressLeakChance(value, urge, hard, 0);
  assert.ok(engaged > unengaged, `入盆后应更容易漏，实际 ${engaged} vs ${unengaged}`);
  // 低档不漏。
  assert.equal(getUrineStressLeakChance(5, urge, hard, 1), 0);
  // 越过想去之后仍然有部分漏，不是只剩全失禁一种结果。
  assert.ok(getUrineStressLeakChance(urge, urge, hard, 1) > 0);
});

test('入盆后排空留更多：地板 + 残值绝对值，刚上完厕所就已经在低档', () => {
  assert.equal(getUrineResidualValue('黄体期', 0), 0);
  assert.equal(getUrineFloor('黄体期', 0), 0);
  // 残值改绝对值：自然逾期入盆满深 8、孕晚未入盆 8
  assert.equal(getUrineResidualValue('逾期', 1), 8);
  assert.equal(getUrineResidualValue('孕晚期', 0), 8);
  // 地板才是入盆 vs 未入盆的大头：孕晚 16 → 满深 25
  assert.ok(getUrineFloor('逾期', 1) > getUrineFloor('孕晚期', 0),
    `入盆地板应更高：${getUrineFloor('逾期', 1)} vs ${getUrineFloor('孕晚期', 0)}`);
  // 排空后合计 = 地板 + 残值：孕晚未入盆 24、自然逾期满深 38
  const afterLate = getUrineFloor('孕晚期', 0) + getUrineResidualValue('孕晚期', 0);
  const afterEng = getUrineFloor('逾期', 1) + getUrineResidualValue('逾期', 1);
  assert.equal(afterLate, 24);
  assert.equal(afterEng, 38);
  assert.ok(afterEng > afterLate, `入盆排空后合计应更高：${afterEng.toFixed(1)} vs ${afterLate.toFixed(1)}`);
});

test('便意的胎头压迫按入盆胎数递增，与膀胱的二值判法不同', () => {
  assert.equal(getStoolEngagedDifficulty(0), 0);
  const one = getStoolEngagedDifficulty(1);
  const two = getStoolEngagedDifficulty(2);
  assert.ok(one > 0);
  assert.ok(two > one, `两胎压得更重，实际 ${two} vs ${one}`);
});

test('bsUpdateCharacterStatus 的 urine 走刺激侧，越接近临界推得越多', () => {
  // 骰子钉在 0.99：这里验的是刺激侧倍率，不能让顺带触发的失禁把增量变成负数。
  withRandom(0.99, () => {
    const lowState = makeChatState();
    const highState = makeChatState();
    profileOf(highState).metabolism.urine = BASE_METABOLISM_CAP * 0.72;

    applyToolCall(lowState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { urine: 10 } } });
    const lowGain = profileOf(lowState).metabolism.urine;

    const before = profileOf(highState).metabolism.urine;
    applyToolCall(highState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { urine: 10 } } });
    const highGain = profileOf(highState).metabolism.urine - before;

    assert.ok(highGain > lowGain, `满档应放大刺激，实际 ${highGain} vs ${lowGain}`);
  });
});

test('bsUpdateCharacterStatus 的 stool 会更新阻力，且阻力随孕期上升', () => {
  const normal = makeChatState();
  applyToolCall(normal, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { stool: 10 } } });
  const normalDifficulty = profileOf(normal).stool.difficulty;

  const pregnant = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 2, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }, { engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }] },
  });
  applyToolCall(pregnant, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { stool: 10 } } });
  const pregnantDifficulty = profileOf(pregnant).stool.difficulty;

  assert.ok(pregnantDifficulty > normalDifficulty, `孕期阻力应更高，实际 ${pregnantDifficulty} vs ${normalDifficulty}`);
});

test('阻力极高时便意排不出，失败天数累加、阻力涨', () => {
  const chatState = makeChatState();
  const profile = profileOf(chatState);
  profile.metabolism.stool = 100;
  // 阻力 95（嵌塞前兆档）：信号 100 的推力 1.0 减 0.95 = 0.05 概率。
  // 钉 Math.random = 0.99 让所有检定失败——验证失败之后的递进。
  profile.stool = { failDays: 5, difficulty: 95 };
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { stool: 40 } } });
  });
  const after = profileOf(chatState);
  assert.equal(after.stool.failDays, 6);
  // 阻力涨了（每失败一回合 +2）
  assert.ok(after.stool.difficulty > 95, `阻力应涨，实际 ${after.stool.difficulty}`);
  // 失败信号不动（不缩水），仍在高档
  assert.ok(after.metabolism.stool > 0);
});

test('低阻力高信号时必定排出，信号降低、天数归零', () => {
  const chatState = makeChatState();
  const profile = profileOf(chatState);
  profile.metabolism.stool = 100;
  // 阻力 0：信号 100 到 pain，推力 1.0，概率 1.0——必成功。
  profile.stool = { failDays: 3, difficulty: 0 };
  withRandom(0, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { stool: 40 } } });
  });
  const after = profileOf(chatState);
  // 成功按绝对量扣（低阻力档 [22,32]），不是清零
  assert.ok(after.metabolism.stool < 100, `信号应降低，实际 ${after.metabolism.stool}`);
  assert.ok(after.metabolism.stool >= 0);
  assert.equal(after.stool.failDays, 0);
});

test('孕晚期排空尿意留残值，不会归零', () => {
  const chatState = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 1, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }] },
  });
  const profile = profileOf(chatState);
  profile.metabolism.urine = getUrineUrgeCap('逾期', 1);

  // 钉 0.99 避开排不出来/断断续续检定，验的是落点不是概率。
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });
  const after = profileOf(chatState).metabolism.urine;
  assert.ok(after > 0, `入盆后排不干净，实际 ${after}`);
  // 新总表：自然逾期满深排完落点 = 地板30 + 残值8 = 38，就在满线 40 附近——「去完就想」。
  assert.equal(after, getUrineFloor('逾期', 1) + getUrineResidualValue('逾期', 1));
});

test('非孕角色排空尿意可以归零', () => {
  const chatState = makeChatState();
  profileOf(chatState).metabolism.urine = 120;
  applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  assert.equal(profileOf(chatState).metabolism.urine, 0);
});

test('日常趟数不进 notify，连续排不出才出声', () => {
  const quiet = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 1, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }] },
  });
  profileOf(quiet).metabolism.urine = getUrineUrgeCap('逾期', 1);
  applyToolCall(quiet, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { milk: 1 } } });
  assert.doesNotMatch(String(profileOf(quiet).notify?.thirdly || ''), /尿意/);

  const loud = makeChatState();
  profileOf(loud).stool = { failDays: 4 };
  applyToolCall(loud, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { milk: 1 } } });
  assert.match(String(profileOf(loud).notify?.thirdly || ''), /没能顺利排便/);
});

test('失禁走 firstly，漏尿走 secondly；回落跨档后才重新获得出声资格', () => {
  const chatState = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 1, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }] },
  });
  const urge = getUrineUrgeCap('逾期', 1);
  const hard = getUrineHardCap('逾期', 1);

  // 抵到 hard 必然失禁，不掷骰。
  profileOf(chatState).metabolism.urine = hard;
  applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { urine: 1 } } });
  assert.match(String(profileOf(chatState).notify?.firstly || ''), /不受控/);

  // 失禁把值打到低档，但冷却不能就此解除：入盆后积累远大于余量，
  // 解除了就是下一小时再响一次同一句，四小时四句。
  const after = profileOf(chatState);
  assert.ok(after.metabolism.urine < hard);
  assert.notEqual(getUrineLevel(after.metabolism.urine, urge, hard), '爆');
  assert.equal(after.cooldown.urineIncontinenceWarned, true, '失禁后不该立刻恢复出声资格');

  // 真的去处理过——值落到主动排空那条线以下——才重新有资格出声。
  // 钉高随机数：避开入盆满深度的排不出来检定（noFlow 0.18），验的是冷却逻辑。
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });
  assert.equal(profileOf(chatState).cooldown.urineIncontinenceWarned, false, '排空后应恢复出声资格');
});

// 非孕角色越过「想去」那条线只是在憋着，不会漏——她的盆底是好的。
test('非孕角色越过想去那条线仍然只是憋着，不会漏', () => {
  const chatState = makeChatState();
  const urge = getUrineUrgeCap('黄体期', 0);
  profileOf(chatState).metabolism.urine = urge + 2;
  // 骰子钉在最高：这里要验的是「越过 urge 本身不构成漏」，
  // 而不是余量刚被吃掉 3 点时那 0.36% 的憋不住——不钉住它，这条测试约 278 次抖一次。
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { urine: 1 } } });
  });
  const after = profileOf(chatState);
  assert.equal(after.notify.firstly, undefined);
  assert.equal(after.notify.secondly, undefined);
});

// 但憋到「收不住」那条线，谁都一样会尿出来——这一条跟怀不怀孕无关。
// 正常人只是余量厚得多（100→150 之间还有五十点可以撐）。
test('正常人憋到硬线一样会失禁，只是余量厚得多', () => {
  const urge = getUrineUrgeCap('黄体期', 0);
  const hard = getUrineHardCap('黄体期', 0);
  assert.equal(urge, 100);
  assert.equal(hard, BASE_METABOLISM_CAP);
  // 憋耐余量真实存在：刚过想去那条线时几乎还是稳的。
  assert.ok(getUrineUrgencyBreakChance(urge + 1, urge, hard) < 0.05);
  // 抵到硬线必然崩。
  assert.equal(getUrineUrgencyBreakChance(hard, urge, hard), 1);

  const chatState = makeChatState();
  profileOf(chatState).metabolism.urine = hard;
  applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { urine: 1 } } });
  const after = profileOf(chatState);
  assert.match(String(after.notify?.firstly || ''), /不受控/);
  assert.ok(after.metabolism.urine < hard, '失禁之后值必须掉下来');
});

// 孕期把两条线一起往下压，但中间那段「还能撑」收缩得更快。
test('孕期两条线一起下压，憋耐余量收缩得比想去那条线更快', () => {
  const normal = getUrineHardCap('黄体期', 0) - getUrineUrgeCap('黄体期', 0);
  const late = getUrineHardCap('孕晚期', 0) - getUrineUrgeCap('孕晚期', 0);
  const engaged = getUrineHardCap('逾期', 1) - getUrineUrgeCap('逾期', 1);
  assert.ok(late < normal, `孕晚期余量应更薄，实际 ${late} vs ${normal}`);
  assert.ok(engaged < late, `入盆后余量应最薄，实际 ${engaged} vs ${late}`);
  // 想去那条线降幅小于余量降幅：这就是「憋耐上限只剩十几分钟」的来源。
  const urgeDrop = 1 - (getUrineUrgeCap('逾期', 1) / getUrineUrgeCap('黄体期', 0));
  const reserveDrop = 1 - (engaged / normal);
  assert.ok(reserveDrop > urgeDrop, `余量应压得比容量更狠，实际 ${reserveDrop} vs ${urgeDrop}`);
});

test('派生种族的排泄豁免同时盖住尿意与便意', () => {
  const chatState = makeChatState({ base: { derivedType: '血族' } });
  const profile = profileOf(chatState);
  profile.metabolism.urine = 40;
  profile.metabolism.stool = 40;
  applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: '艾拉', options: { urine: 20, stool: 20 } } });
  const after = profileOf(chatState).metabolism;
  assert.equal(after.urine, 0);
  assert.equal(after.stool, 0);
});

// 憋不住是量的函数，量是时间的函数——所以推时间就该能尿出来。
// 之前漏尿只挂在 bsUpdateCharacterStatus 的 urine 分支上，
// 模型不递刺激就永远不漏：推一整夜也是干的。
test('推时间到硬线一样会失禁，不需要模型递刺激', () => {
  const chatState = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 2, fetalEnergyDrain: 2, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }, { engaged: false, weight: 1.6, tendencyAngle: 0 }] },
  });
  const hard = getUrineHardCap('逾期', 1);
  profileOf(chatState).metabolism.urine = hard;
  // 憋着才轮得到失禁：不置这一位，推时间等于「她去过了」。
  profileOf(chatState).urine = { holding: true };

  // 抵到硬线概率为 1，掷骰给多少都必然触发。
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  });

  const after = profileOf(chatState);
  assert.match(String(after.notify?.firstly || ''), /不受控/);
  assert.ok(after.metabolism.urine < hard, `失禁后值必须掉下来，实际 ${after.metabolism.urine}`);
});

// 推时间的默认假设是「她自己去了」：入盆后一小时积累约 56、余量只有 10，
// 若把没写到厕所的时间都当成硬憋，光推时间就能让她每小时失禁一次。
test('没在憋的时候推时间不会失禁，只是趟数记在账上', () => {
  const chatState = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 2, fetalEnergyDrain: 2, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }, { engaged: false, weight: 1.6, tendencyAngle: 0 }] },
  });
  const urge = getUrineUrgeCap('逾期', 1);
  const hard = getUrineHardCap('逾期', 1);
  profileOf(chatState).metabolism.urine = hard;

  // 骰子钉在必过：真要判失禁，这一档一定会响。
  withRandom(0, () => {
    for (let hour = 0; hour < 6; hour += 1) {
      applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
    }
  });

  const after = profileOf(chatState);
  assert.doesNotMatch(String(after.notify?.firstly || ''), /不受控/, '能去厕所就不该失禁');
  assert.ok(after.metabolism.urine < urge, `值应停在想去那条线以下，实际 ${after.metabolism.urine}`);
  // 趟数不进正文，但要有处可查——孕晚期一天十几二十趟是背景。
  // 不断言具体趟数：它随积累速率浮动，钉死了就是把速率表抄进测试。
  assert.ok(after.urine.voidsToday > 0, `六小时应记下趟数，实际 ${after.urine.voidsToday}`);
});

test('憋着这件事跨不过一整天，隔天自动放掉并清趟数', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 230, fetusesCount: 1, fetuses: [{ engaged: false, weight: 1.4, tendencyAngle: 0 }] },
  });
  profileOf(chatState).urine = { holding: true, voidsToday: 14 };

  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });

  const after = profileOf(chatState);
  assert.equal(after.urine.holding, false);
  assert.equal(after.urine.voidsToday, 0);
});

// bsPassedTime 收尾时曾用函数开头抓的 cooldown 快照覆盖 profile.cooldown，
// 把本轮代谢结算写下的出声冷却整批盖回去：于是入盆后憋着会每小时重复同一句失禁。
test('推时间的收尾不覆盖本轮写下的出声冷却，失禁不会每小时重复', () => {
  // 用孕晚期而不是逾期：入盆后的两条线一样（52/62），但自然发动只在临产期／逾期
  // 掷骰。withRandom(0) 会让每一次掷骰都必过，若停在逾期，她第一小时就进产兆前驱，
  // 尿意这条根本跑不到——那考的就不是本条要考的东西了。
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 238, fetusesCount: 2, fetalEnergyDrain: 2, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }, { engaged: false, weight: 1.6, tendencyAngle: 0 }] },
  });
  profileOf(chatState).metabolism.urine = getUrineHardCap('孕晚期', 1);
  profileOf(chatState).urine = { holding: true };

  let lines = 0;
  withRandom(0, () => {
    for (let hour = 0; hour < 8; hour += 1) {
      applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
      if (/不受控/.test(String(profileOf(chatState).notify?.firstly || ''))) lines += 1;
      profileOf(chatState).notify = {};
    }
  });

  // 她这八小时确实一直在漏，但出声有最短静默期（失禁后 90 分钟不重复同一句）——
  // 新数值下积累快、余量薄，八小时会漏几次，但绝不是每小时都喊一遍。
  assert.ok(lines >= 1, '八小时至少出声一次');
  assert.ok(lines <= 4, `静默期应压住重复出声，实际 ${lines} 次`);
  assert.equal(profileOf(chatState).cooldown.urineIncontinenceWarned, true);
});

// 爆档的 decayPerHour 是 0，宫压那几分曾经挂在渗漏函数里、guard 之下，
// 于是永远加不上去：憋着撑住已经贴在宫颈上的胎头，本该是有意义的。
test('入盆后憋在爆档会推高宫压，渗漏为零也照样累计', () => {
  const chatState = makeChatState({
    base: { stage: '逾期', uterinePressure: 0 },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 1, fetalEnergyDrain: 1, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }] },
  });
  const urge = getUrineUrgeCap('逾期', 1);
  const hard = getUrineHardCap('逾期', 1);
  // 停在爆档但够不到硬线，避免撞上失禁把值拉走。
  profileOf(chatState).metabolism.urine = urge + ((hard - urge) * 0.6);
  profileOf(chatState).urine = { holding: true };
  assert.equal(getUrineLevel(profileOf(chatState).metabolism.urine, urge, hard), '爆');

  // 骰子钉在 0：这一档若掷骰必过，能顺带证明宫压不是靠运气加上的。
  withRandom(0, () => {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  });

  assert.ok(profileOf(chatState).base.uterinePressure > 0, '爆档憋着应推高宫压');
});

// 未入盆时膀胱上面没有顶着胎头，憋着也不该有诱发宫缩的意义。
test('未入盆时憋在爆档不会推高宫压', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期', uterinePressure: 0 },
    pregnant: { effectivePregnantDays: 230, fetusesCount: 1, fetalEnergyDrain: 1, fetuses: [{ engaged: false, weight: 1.4, tendencyAngle: 0 }] },
  });
  const urge = getUrineUrgeCap('孕晚期', 0);
  const hard = getUrineHardCap('孕晚期', 0);
  profileOf(chatState).metabolism.urine = urge + ((hard - urge) * 0.6);
  profileOf(chatState).urine = { holding: true };

  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 1 } });
  });

  // 跟基线比而不是跟 0 比：孕晚期的基线本来就大于 0（代表真的在接近临产），
  // 压力会往基线补。这里要验的是「未入盆憋着不额外抬地板」。
  const after = profileOf(chatState);
  // 上限：50 + (150-50) × min(10, floor(天数/28))/10
  const cap = Math.round(50 + ((150 - 50) * (Math.min(10, Math.floor(230 / 28)) / 10)));
  const baseline = getUterinePressureBaseline(230, cap);
  assert.ok(
    after.base.uterinePressure <= baseline + 0.001,
    `未入盆憋着不该高出基线，基线 ${baseline.toFixed(1)}，实际 ${after.base.uterinePressure}`,
  );
});

// ─── §八 高潮失禁 ───────────────────────────────────────────────

// 无档 = 0：空膀胱没东西可排，先去一趟就能避开。这是可测的设计意图。
test('高潮失禁无档概率 = 0：膀胱空时掷 1000 次一次都不出', () => {
  // 非孕线 urge=100、hard=150，无档 < 25
  const urge = 100, hard = 150;
  let hit = 0;
  for (let i = 0; i < 1000; i++) {
    if (getUrineOrgasmIncontinenceChance(10, urge, hard, 0) > 0) hit++;
  }
  assert.equal(hit, 0, '无档概率应为 0');
});

test('高潮失禁概率表：档位主因、盆底系数乘法不改变形状', () => {
  const urge = 52, hard = 62; // 入盆线
  // 满档
  const np = getUrineOrgasmIncontinenceChance(52, urge, hard, 0);     // 非孕 factor=0
  const late = getUrineOrgasmIncontinenceChance(52, urge, hard, 0.38); // 孕晚期
  const full = getUrineOrgasmIncontinenceChance(52, urge, hard, 1.0);  // 满深
  // 基础 0.58，乘法 1+0.5×factor
  assert.ok(Math.abs(np - 0.58) < 0.01, `非孕满档应≈0.58，实际 ${np}`);
  assert.ok(Math.abs(late - (0.58 * 1.19)) < 0.01, `孕晚期满档应≈${(0.58*1.19).toFixed(2)}，实际 ${late}`);
  assert.ok(Math.abs(full - (0.58 * 1.5)) < 0.01, `满深满档应≈${(0.58*1.5).toFixed(2)}，实际 ${full}`);
  // 爆档钳 0.95
  const boom = getUrineOrgasmIncontinenceChance(58, urge, hard, 1.0);
  assert.ok(boom <= 0.95, `爆档钳 0.95，实际 ${boom}`);
});

test('高潮失禁落量表：中低档就有整股', () => {
  assert.deepEqual(getUrineOrgasmDropRange('低'), [6, 10]);
  assert.deepEqual(getUrineOrgasmDropRange('中'), [10, 16]);
  assert.deepEqual(getUrineOrgasmDropRange('爆'), [22, 35]);
  // 无档没有落值
  assert.deepEqual(getUrineOrgasmDropRange('无'), [0, 0]);
});

test('高潮失禁不走 urineLeakWarned 冷却：每次都该出声', () => {
  // 入盆满深逾期：urge=52, hard=62, 满档值=52, factor=1.0
  // 高潮失禁是事件触发的——不在 applyUrineLeak 里，不会走 emitUrineLeakNotify 的冷却。
  // 所以这里只验概率函数：满了就有概率，空了就 0。减值和出声在调用方。
  const urge = 52, hard = 62;
  const full = getUrineOrgasmIncontinenceChance(urge, urge, hard, 1.0);
  const empty = getUrineOrgasmIncontinenceChance(10, urge, hard, 1.0);
  assert.ok(full > 0.8, `满档概率应 > 0.8，实际 ${full}`);
  assert.equal(empty, 0, '无档概率应 = 0');
  // 常数验证：URINE_INTERMITTENT_DROP_RATIO = 0.7, RESIDUAL_MULT = 1.3
  assert.equal(URINE_INTERMITTENT_DROP_RATIO, 0.7);
  assert.equal(URINE_INTERMITTENT_RESIDUAL_MULT, 1.3);
});

// ─── §九 排不出来检定 ─────────────────────────────────────────────

test('排不出来：整个孕期都有，越往后越重，入盆是额外加成', () => {
  // 非孕 = 0
  const np = getUrineVoidDifficulty('黄体期', 0, 0, 0);
  assert.equal(np.noFlow, 0);
  assert.equal(np.intermittent, 0);
  // 孕中期(91天)：keyframe 0→84，91在84和189之间
  // t=(91-84)/(189-84)=7/105≈0.0667, noFlow=0.02, intermittent≈0.0547
  const mid = getUrineVoidDifficulty('孕中期', 0, 0, 91);
  assert.ok(mid.noFlow > 0, '孕中期未入盆也应有概率');
  assert.ok(mid.intermittent > 0);
  assert.ok(mid.noFlow < 0.05, '孕中期概率应该低');
  // 孕晚期未入盆(230天)：基数 0.05→0.08 之间插值
  const late = getUrineVoidDifficulty('孕晚期', 0, 0, 230);
  assert.ok(late.noFlow > 0.05, `孕晚期未入盆 noFlow 应 > 0.05，实际 ${late.noFlow}`);
  assert.ok(late.intermittent > 0.1, `孕晚期未入盆 intermittent 应 > 0.1，实际 ${late.intermittent}`);
  // 入盆满深度叠加后更高
  const lateEng = getUrineVoidDifficulty('孕晚期', 1, 1.0, 230);
  assert.ok(lateEng.noFlow > late.noFlow, `入盆后应更高：${lateEng.noFlow} vs ${late.noFlow}`);
  assert.ok(lateEng.intermittent > late.intermittent, `入盆后应更高：${lateEng.intermittent} vs ${late.intermittent}`);
  // 足月(280天)入盆满深度 = 设计文档原值 0.18 / 0.40
  const term = getUrineVoidDifficulty('逾期', 1, 1.0, 280);
  assert.ok(Math.abs(term.noFlow - 0.18) < 0.01, `足月满深 noFlow 应≈0.18，实际 ${term.noFlow}`);
  assert.ok(Math.abs(term.intermittent - 0.40) < 0.01, `足月满深 intermittent 应≈0.40，实际 ${term.intermittent}`);
});

test('排不出来：孕周连续，不出台阶', () => {
  // 从 84 天走到 294 天，相邻步长概率差有界
  const step = 7;
  let prevNf = 0, prevInt = 0;
  for (let d = 0; d <= 294; d += step) {
    const r = getUrineVoidDifficulty('孕晚期', 0, 0, d);
    if (d > 0) {
      const dnf = Math.abs(r.noFlow - prevNf);
      const dint = Math.abs(r.intermittent - prevInt);
      assert.ok(dnf <= 0.02, `noFlow @${d}天台阶过大：${dnf}`);
      assert.ok(dint <= 0.02, `intermittent @${d}天台阶过大：${dint}`);
    }
    prevNf = r.noFlow;
    prevInt = r.intermittent;
  }
});

test('排不出来：产程段固定值', () => {
  const s1 = getUrineVoidDifficulty('第一产程', 1, 1.0, 260);
  assert.ok(Math.abs(s1.noFlow - 0.35) < 0.01 && Math.abs(s1.intermittent - 0.50) < 0.01);
  const s2 = getUrineVoidDifficulty('第二产程', 1, 1.0, 265);
  assert.ok(Math.abs(s2.noFlow - 0.55) < 0.01 && Math.abs(s2.intermittent - 0.65) < 0.01);
  // 第三产程不卡
  const s3 = getUrineVoidDifficulty('第三产程', 1, 1.0, 270);
  assert.equal(s3.noFlow, 0);
  assert.equal(s3.intermittent, 0);
});

test('排不出来：产后48h内有效', () => {
  const pp = getUrineVoidDifficulty('产后恢复', 0, 0, 1); // 1天
  assert.ok(Math.abs(pp.noFlow - 0.25) < 0.01 && Math.abs(pp.intermittent - 0.35) < 0.01);
  const pp3 = getUrineVoidDifficulty('产后恢复', 0, 0, 3); // 3天，超过48h
  assert.equal(pp3.noFlow, 0);
  assert.equal(pp3.intermittent, 0);
});

test('排不出来：姿势抵扣减概率', () => {
  // 足月(280天)入盆满深度 + 站姿抵扣 0.15
  const stand = getUrineVoidDifficulty('逾期', 1, 1.0, 280, 0.15);
  assert.ok(Math.abs(stand.noFlow - (0.18 - 0.15)) < 0.01, `站姿抵扣后 noFlow 应≈0.03，实际 ${stand.noFlow}`);
  assert.ok(stand.intermittent >= 0, '概率不能为负');
  // 第二产程 + 托肚子抵扣 0.30
  const support = getUrineVoidDifficulty('第二产程', 1, 1.0, 265, 0.30);
  assert.ok(Math.abs(support.noFlow - (0.55 - 0.30)) < 0.01, `托肚子后 noFlow 应≈0.25，实际 ${support.noFlow}`);
});

test('排不出来：起不了流 → 值不减 + 20分钟冷却', () => {
  // 入盆满深度逾期，noFlow=0.18。钉 0 < 0.18 → 触发起不了流
  const chatState = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 1, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }] },
  });
  const hard = getUrineHardCap('逾期', 1);
  profileOf(chatState).metabolism.urine = hard; // 满档偏上（加载时 clamp 到 hard）
  const before = profileOf(chatState).metabolism.urine;

  withRandom(0, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });

  const after = profileOf(chatState);
  // 值没减（起不了流）
  assert.equal(after.metabolism.urine, before, '起不了流时值不应减少');
  // 冷却写入了
  const cd = Number(after.urine?.voidCooldownUntil) || 0;
  assert.ok(cd > 0, `voidCooldownUntil 应被设置，实际 ${cd}`);
});

test('排不出来：冷却期内再排被挡回', () => {
  const chatState = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 1, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }] },
  });
  const urge = getUrineUrgeCap('逾期', 1);
  profileOf(chatState).metabolism.urine = urge + 10;
  // 先触发一次起不了流
  withRandom(0, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });
  const after1 = profileOf(chatState).metabolism.urine;
  // 冷却内再试——钉 0.99 让检定通过也不该减值
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });
  const after2 = profileOf(chatState).metabolism.urine;
  assert.equal(after2, after1, '冷却期内值不应变');
});

test('排不出来：断断续续 → 排出量打七折、残值×1.3', () => {
  const chatState = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 1, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }] },
  });
  const urge = getUrineUrgeCap('逾期', 1);
  const hard = getUrineHardCap('逾期', 1);
  // 设值在 hard 之上——但 getMetabolismCap 会钳到 hard，所以 currentUrine = hard
  profileOf(chatState).metabolism.urine = hard + 10;
  const currentUrine = hard; // 钳后

  // 逾期入盆满深度：noFlow≈0.19, intermittent≈0.415
  // roll=0.30 落在 [0.19, 0.605) → 断断续续
  withRandom(0.30, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });

  const after = profileOf(chatState);
  // 排出量打七折：relievedUrine = floor(currentUrine × 0.7)
  const expectedRelieved = Math.floor(currentUrine * URINE_INTERMITTENT_DROP_RATIO);
  const expectedNext = currentUrine - expectedRelieved;
  // 新总表：地板(30) + 残值(8) × 1.3 = 40.4（断断续续残值放大，地板不动）
  const floor = getUrineFloor('逾期', 1);
  const expectedResidual = floor + getUrineResidualValue('逾期', 1) * URINE_INTERMITTENT_RESIDUAL_MULT;
  // 最终值 = max(nextUrine, min(currentUrine, expectedResidual))
  const expectedFinal = Math.max(expectedNext, Math.min(currentUrine, expectedResidual));
  assert.ok(
    Math.abs(after.metabolism.urine - expectedFinal) < 1,
    `断断续续排完应≈${expectedFinal}（排出${expectedRelieved}，剩${expectedNext}，残值线${expectedResidual.toFixed(1)}），实际 ${after.metabolism.urine}`,
  );
  // 排完也进冷却
  assert.ok(after.urine?.voidCooldownUntil > 0, '排完应设冷却');
});

test('排不出来：正常排尿（未入盆）不受影响', () => {
  const chatState = makeChatState({
    base: { stage: '黄体期' },
  });
  const urge = getUrineUrgeCap('黄体期', 0);
  profileOf(chatState).metabolism.urine = urge + 20;
  const before = profileOf(chatState).metabolism.urine;

  withRandom(0.5, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });

  const after = profileOf(chatState);
  assert.ok(after.metabolism.urine < before, '非孕正常排尿应减值');
  // 排成功也进冷却（膀胱刚收缩完，要恢复才能再排）——非孕也一样
  assert.ok(after.urine?.voidCooldownUntil > 0, '排完应设冷却');
  // 但非孕排不出来概率 = 0，不会被挡回
  assert.ok(after.metabolism.urine < before, '非孕排尿值应减少');
});

// ─── §三 地板拆分 ─────────────────────────────────────────────

test('地板不可减：入盆满深度排空后值 ≥ 地板', () => {
  const chatState = makeChatState({
    base: { stage: '逾期' },
    pregnant: { effectivePregnantDays: 287, fetusesCount: 1, fetuses: [{ engaged: true, descent: 100, weight: 1.6, tendencyAngle: 0 }] },
  });
  const hard = getUrineHardCap('逾期', 1);
  profileOf(chatState).metabolism.urine = hard; // 满档偏上

  // 钉 0.99 避开排不出来检定
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });
  const after = profileOf(chatState);
  // 地板 = 10，排空后值 ≥ 10
  assert.ok(after.metabolism.urine >= 10, `排空后值应 ≥ 地板 10，实际 ${after.metabolism.urine}`);
});

test('双次排尿：第二次清残值、清不掉地板', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 230, fetusesCount: 1, fetuses: [{ engaged: true, descent: 100, weight: 1.4, tendencyAngle: 0 }] },
  });
  const hard = getUrineHardCap('孕晚期', 1);
  profileOf(chatState).metabolism.urine = hard;

  // 第一次排：钉 0.99 避开排不出来
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });
  const after1 = profileOf(chatState).metabolism.urine;
  // 新总表：孕晚入盆满深排完落点 = 地板 25 + 残值 8 = 33
  const expectedAfter1 = getUrineFloor('孕晚期', 1) + getUrineResidualValue('孕晚期', 1);
  assert.equal(expectedAfter1, 33);
  assert.ok(Math.abs(after1 - expectedAfter1) < 1, `第一次排后应≈${expectedAfter1.toFixed(1)}，实际 ${after1}`);

  // 第二次排（等冷却过、钉 0.99）：清掉残值那一份，清不掉地板
  profileOf(chatState).urine.voidCooldownUntil = 0;
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsExcreteMetabolism', arguments: { female: '艾拉', options: { urine: 200 } } });
  });
  const after3 = profileOf(chatState).metabolism.urine;
  assert.equal(after3, getUrineFloor('孕晚期', 1), `双次排后应落在地板 ${getUrineFloor('孕晚期', 1)}，实际 ${after3}`);
});

// ─── TASK-04 防回归：臭意（odor）与伴意（companionship）已整个删掉 ───
test('引擎不再写 odor / companionship：推一天后 metabolism 里不出现这两个键', () => {
  const chatState = makeChatState({ base: { stage: '孕中期' }, pregnant: { effectivePregnantDays: 140, fetusesCount: 1, fetuses: [] } });
  withRandom(0.99, () => {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  });
  const metabolism = profileOf(chatState).metabolism;
  assert.equal(metabolism.odor, undefined, 'odor 已删，不应再出现');
  assert.equal(metabolism.companionship, undefined, 'companionship 已删，不应再出现');
});

test('八键旧存档读入时静默丢弃 odor / companionship，不报错', () => {
  const characterState = {
    profile: {
      base: { stage: '黄体期' },
      metabolism: { urine: 60, stool: 40, hunger: 20, sleep: 10, milk: 5, odor: 77, companionship: 88 },
      pregnant: { fetuses: [] },
    },
  };
  state.normalizeCharacterPsychologyState(characterState);
  const metabolism = characterState.profile.metabolism;
  assert.equal(metabolism.urine, 60);
  assert.equal(metabolism.odor, undefined, '残留 odor 应被丢掉');
  assert.equal(metabolism.companionship, undefined, '残留 companionship 应被丢掉');
});
