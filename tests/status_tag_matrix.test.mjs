import test from 'node:test';
import assert from 'node:assert/strict';
import { getCharacterStatusTags } from '../scripts/status_tag_matrix.js';

test('getCharacterStatusTags calculates base stage badges accurately', () => {
  const charEarly = { profile: { base: { stage: '孕早期' }, pregnant: { effectivePregnantDays: 28 } } };
  const tagsEarly = getCharacterStatusTags(charEarly);
  assert.equal(tagsEarly[0].label, '孕早期 (28天)');
  assert.equal(tagsEarly[0].className, 'bs-bt-tag--stage');

  const charMidSingle = { profile: { base: { stage: '孕中期' }, pregnant: { effectivePregnantDays: 110, fetusesCount: 1 } } };
  assert.equal(getCharacterStatusTags(charMidSingle)[0].label, '孕中期 (110天)');

  const charMidTwin = { profile: { base: { stage: '孕中期' }, pregnant: { effectivePregnantDays: 110, fetusesCount: 2, fetuses: [{}, {}] } } };
  assert.equal(getCharacterStatusTags(charMidTwin)[0].label, '孕中期 · 双胎 (110天)');

  const charLate = { profile: { base: { stage: '孕晚期' }, pregnant: { effectivePregnantDays: 152 } } };
  assert.equal(getCharacterStatusTags(charLate)[0].label, '孕晚期 (152天)');

  const charTerm = { profile: { base: { stage: '临产期' }, pregnant: { effectivePregnantDays: 270 } } };
  assert.equal(getCharacterStatusTags(charTerm)[0].label, '临产期 (270天)');

  const charOverdue = { profile: { base: { stage: '逾期' }, pregnant: { effectivePregnantDays: 285 } } };
  assert.equal(getCharacterStatusTags(charOverdue)[0].label, '逾期 (285天)');

  const charOvulation = { profile: { base: { stage: '排卵期' } } };
  assert.equal(getCharacterStatusTags(charOvulation)[0].label, '排卵期 · 易孕');

  const charMens = { profile: { base: { stage: '月经期', days: 1 } } };
  assert.equal(getCharacterStatusTags(charMens)[0].label, '月经期 (第2天)');

  const charPostpartum = { profile: { base: { stage: '产后恢复', days: 10 } } };
  assert.equal(getCharacterStatusTags(charPostpartum)[0].label, '产后恢复 (10天)');

  const charPseudo = { profile: { base: { stage: '假孕期' } } };
  assert.equal(getCharacterStatusTags(charPseudo)[0].label, '假孕状态');

  const charLabor1 = { profile: { base: { stage: '第一产程' }, pregnant: { laborPhase: '活跃期' } } };
  assert.equal(getCharacterStatusTags(charLabor1)[0].label, '第一产程·活跃期');
});

test('getCharacterStatusTags handles multi-fetus badge on late pregnancy', () => {
  const charLateTwin = { profile: { base: { stage: '孕晚期' }, pregnant: { effectivePregnantDays: 200, fetusesCount: 2, fetuses: [{}, {}] } } };
  const tags = getCharacterStatusTags(charLateTwin);
  assert.equal(tags[0].label, '孕晚期 (200天)');
  const fetusTag = tags.find(t => t.key === 'fetuses_multi');
  assert.ok(fetusTag);
  assert.equal(fetusTag.label, '双胎');
});

test('getCharacterStatusTags calculates fetal descent chain correctly', () => {
  const charInitial = { profile: { base: { stage: '孕晚期' }, pregnant: { effectivePregnantDays: 240, fetuses: [{ descent: 45 }] } } };
  assert.ok(getCharacterStatusTags(charInitial).some(t => t.label === '入盆初期'));

  const charDeep = { profile: { base: { stage: '临产期' }, pregnant: { effectivePregnantDays: 270, fetuses: [{ descent: 70 }] } } };
  assert.ok(getCharacterStatusTags(charDeep).some(t => t.label === '深入盆'));

  const charFixed = { profile: { base: { stage: '临产期' }, pregnant: { effectivePregnantDays: 275, fetuses: [{ descent: 90 }] } } };
  assert.ok(getCharacterStatusTags(charFixed).some(t => t.label === '胎头固定'));
});

test('getCharacterStatusTags calculates contractions based on pressure wave above baseline', () => {
  const charMild = { profile: { base: { stage: '孕中期', uterinePressure: 15 }, pregnant: { effectivePregnantDays: 140 } } };
  assert.ok(getCharacterStatusTags(charMild).some(t => t.label === '宫缩·发紧'));

  const charSeries = { profile: { base: { stage: '孕中期', uterinePressure: 30 }, pregnant: { effectivePregnantDays: 140 } } };
  assert.ok(getCharacterStatusTags(charSeries).some(t => t.label === '宫缩·成串'));

  const charThreatened = { profile: { base: { stage: '孕中期', uterinePressure: 45 }, pregnant: { effectivePregnantDays: 140 } } };
  assert.ok(getCharacterStatusTags(charThreatened).some(t => t.label === '强宫缩'));
});

test('getCharacterStatusTags calculates milk fullness and blockage', () => {
  const charMilkBlocked = { profile: { base: { stage: '产后恢复' }, bio: { milkGate: '中', milkConstitution: '普通' }, metabolism: { milk: 120 }, milk: { blockHours: 30 } } };
  const tagsBlocked = getCharacterStatusTags(charMilkBlocked);
  assert.ok(tagsBlocked.some(t => t.label === '堵奶'));
});

test('getCharacterStatusTags calculates urine urge and leaks', () => {
  // 漏尿判据：cooldown.urineLeakWarned（引擎 emitUrineLeakNotify 写入）
  const charLeak = { profile: { base: { stage: '孕晚期' }, cooldown: { urineLeakWarned: true } } };
  assert.ok(getCharacterStatusTags(charLeak).some(t => t.label === '漏尿'));

  // 失禁判据：cooldown.urineIncontinenceWarned（引擎 emitUrineLeakNotify 写入）
  const charIncontinence = { profile: { base: { stage: '孕晚期' }, cooldown: { urineIncontinenceWarned: true } } };
  assert.ok(getCharacterStatusTags(charIncontinence).some(t => t.label === '失禁'));

  // 没有 cooldown flag 时，不点亮漏尿/失禁
  const charNone = { profile: { base: { stage: '孕晚期' }, metabolism: { urine: 50 } } };
  assert.ok(!getCharacterStatusTags(charNone).some(t => t.key === 'urine_leak'));
  assert.ok(!getCharacterStatusTags(charNone).some(t => t.key === 'urine_incontinence'));

  // 旧的 notify 字段名（notify.incontinence / notify.urineLeak）引擎不会产生，
  // 确认不依赖它们
  const charOldNotify = { profile: { base: { stage: '孕晚期' }, notify: { secondly: '漏了一点尿' } } };
  assert.ok(!getCharacterStatusTags(charOldNotify).some(t => t.key === 'urine_leak'));
});

test('getCharacterStatusTags uses engagement-adjusted urine caps', () => {
  // Bug 2 回归：getUrineHardCap/UrgeCap 签名是 (stage, engagedCount, progress, prolonged)，
  // 之前传 profile 对象导致 Number(profile)=NaN→0，永远走未入盆基准。
  // 入盆后 urgeCap 从 60 降到 ~54.7，urine=55 在入盆后越过 urgeCap 亮「尿急」，
  // 未入盆时不够 60 不亮。
  const before = { profile: { base: { stage: '孕晚期' }, pregnant: { effectivePregnantDays: 200, fetuses: [{ descent: 0 }] }, metabolism: { urine: 55 } } };
  const after = { profile: { base: { stage: '孕晚期' }, pregnant: { effectivePregnantDays: 200, fetuses: [{ descent: 80 }] }, metabolism: { urine: 55 } } };

  const tagsBefore = getCharacterStatusTags(before);
  const tagsAfter = getCharacterStatusTags(after);

  // 未入盆：55 < 60 → 不亮「尿急」
  assert.ok(!tagsBefore.some(t => t.label === '尿急'), '55 should not trigger 尿急 before engagement');
  // 入盆后：55 >= 54.66 → 亮「尿急」
  assert.ok(tagsAfter.some(t => t.label === '尿急'), '55 should trigger 尿急 after engagement');
});

test('getCharacterStatusTags calculates vitality and fatigue', () => {
  const charEnergetic = { profile: { base: { vitality: 110, vitalityLevel: 4 }, metabolism: { hunger: 20, sleep: 20 } } };
  assert.ok(getCharacterStatusTags(charEnergetic).some(t => t.label === '精力充沛'));

  const charWeak = { profile: { base: { vitality: 25, vitalityLevel: 4 } } };
  assert.ok(getCharacterStatusTags(charWeak).some(t => t.label === '脱力'));

  const charExhausted = { profile: { base: { vitality: 5, vitalityLevel: 4 } } };
  assert.ok(getCharacterStatusTags(charExhausted).some(t => t.label === '虚脱'));
});

test('getCharacterStatusTags calculates wardrobe states', () => {
  const charMessy = { profile: { base: { stage: '卵泡期' }, outfit: { wearState: '半褪' } } };
  assert.ok(getCharacterStatusTags(charMessy).some(t => t.label === '衣衫半褪'));

  const charOpen = { profile: { base: { stage: '卵泡期' }, outfit: { wearState: '敞开' } } };
  assert.ok(getCharacterStatusTags(charOpen).some(t => t.label === '衣襟敞开'));

  const charSoaked = { profile: { base: { stage: '卵泡期' }, outfit: { wearState: '湿透' } } };
  assert.ok(getCharacterStatusTags(charSoaked).some(t => t.label === '衣衫湿透'));
});

test('getCharacterStatusTags is purely computed with zero side-effects on character data', () => {
  const orig = { profile: { base: { stage: '孕晚期', vitality: 20, uterinePressure: 35 }, pregnant: { effectivePregnantDays: 200, fetuses: [{ descent: 70 }] } } };
  const clone = JSON.parse(JSON.stringify(orig));
  const tags = getCharacterStatusTags(orig);
  assert.ok(tags.length >= 3);
  assert.deepEqual(orig, clone, 'Original character state must remain completely untouched');
});