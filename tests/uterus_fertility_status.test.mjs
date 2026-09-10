// 回归测试：子宫状态与受孕几率的一句话描述（getUterusStatusText / getFertilityChanceText）。
// 移植自孕百科 v10 的「子宫状态」与「受精機率」栏——只读派生字段，面板与主流注入共用；
// 百分数是给叙事看的档位口径，真正的受精判定由引擎逐颗卵掷骰（见 multi_egg_fertilization.test.mjs）。
import assert from 'node:assert/strict';
import test from 'node:test';
import { getOvaryStatusText, getUterusStatusText, getFertilityChanceText } from '../scripts/state.js';

function profileOf(stage, extraBase = {}, pregnant = {}) {
  return { base: { stage, ...extraBase }, pregnant };
}

test('子宫状态：月经周期各阶段的固定措辞', () => {
  assert.equal(getUterusStatusText(profileOf('月经期')), '子宫内膜周期性脱落，宫体轻微痉挛');
  assert.equal(getUterusStatusText(profileOf('卵泡期')), '子宫内膜修复增厚，宫体柔软平静');
  assert.equal(getUterusStatusText(profileOf('排卵期')), '宫颈黏液稀薄，子宫处于易孕状态');
  assert.equal(getUterusStatusText(profileOf('黄体期')), '子宫内膜增厚松软，静候着床结果');
});

test('子宫状态：妊娠与产程各阶段的固定措辞', () => {
  assert.equal(getUterusStatusText(profileOf('孕早期')), '子宫温和增大尚不明显，胚胎着床发育中');
  assert.equal(getUterusStatusText(profileOf('孕晚期')), '子宫充分扩张占据腹腔，偶有假性宫缩');
  assert.equal(getUterusStatusText(profileOf('产兆前驱')), '不规则宫缩渐频，分娩前兆显现');
  assert.equal(getUterusStatusText(profileOf('第一产程')), '规律宫缩进行中，宫颈口持续扩张');
  assert.equal(getUterusStatusText(profileOf('第二产程')), '宫缩全力推送，胎体正通过产道');
});

test('受孕几率：已受精显示来源，父方去重', () => {
  const profile = profileOf('排卵期', { eggs: 0, fertilizationDays: 2 },
    { fetuses: [{ fathers: 'Father' }, { fathers: 'Father' }] });
  assert.equal(getFertilityChanceText(profile), '已受精，精子来自Father');
});

test('受孕几率：精液×卵子×阶段的档位组合', () => {
  assert.equal(
    getFertilityChanceText(profileOf('排卵期', { eggs: 2, sperms: [{ male: 'F', value: 20 }] })),
    '约 85%，易孕峰值',
  );
  assert.equal(
    getFertilityChanceText(profileOf('黄体期', { eggs: 1, sperms: [{ male: 'F', value: 5 }] })),
    '约 40%，窗口正在关闭',
  );
  assert.equal(
    getFertilityChanceText(profileOf('排卵期', { eggs: 0, sperms: [{ male: 'F', value: 20 }] })),
    '约 15%，等待排卵',
  );
  assert.equal(
    getFertilityChanceText(profileOf('卵泡期', { eggs: 0, sperms: [{ male: 'F', value: 20 }] })),
    '约 5%，非易孕阶段',
  );
  assert.equal(getFertilityChanceText(profileOf('卵泡期', { eggs: 0 })), '0%，体内无精液残留');
});

test('受孕几率：假孕与妊娠的终结态', () => {
  assert.equal(getFertilityChanceText(profileOf('假孕期')), '假孕状态，无法受孕');
  assert.equal(getFertilityChanceText(profileOf('孕中期')), '已怀孕');
  assert.equal(getFertilityChanceText(profileOf('产兆前驱')), '已怀孕');
});

test('卵巢描述：产兆前驱也按妊娠处理（补漏）', () => {
  assert.equal(getOvaryStatusText(profileOf('产兆前驱')), '妊娠中，卵巢暂停排卵');
});
