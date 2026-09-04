import assert from 'node:assert/strict';
import test from 'node:test';

import {
  engagementProgressFromDescent,
  getUrineFloorFactor,
  getUrineFloor,
  getUrineHardCap,
  getUrineLines,
  getUrineResidualValue,
  getUrineStressLeakChance,
  getUrineUrgeCap,
  getStoolEngagedDifficulty,
} from '../scripts/metabolism_config.js';

const STEP = 0.05;

function scanContinuity(fn, label, maxStep) {
  let prev = fn(0);
  for (let d = STEP; d <= 1 + 1e-9; d += STEP) {
    const next = fn(Math.min(d, 1));
    const delta = Math.abs(next - prev);
    assert.ok(delta <= maxStep, `${label} @progress ${d.toFixed(2)} 台阶过大：|Δ| = ${delta.toFixed(3)}`);
    prev = next;
  }
}

test('入盆进度映射：descent 40 → 0，descent 100 → 1，未入盆 → 0', () => {
  assert.equal(engagementProgressFromDescent(0), 0);
  assert.equal(engagementProgressFromDescent(39), 0);
  assert.equal(engagementProgressFromDescent(40), 0);
  assert.equal(engagementProgressFromDescent(100), 1);
  assert.equal(engagementProgressFromDescent(70), 0.5);
});

// TASK-02 档位重设计总表（讨论记录 §五）：孕晚未入盆 60/72、入盆满深 52/55。
test('尿意两条线：深度 0 对齐总表、深度 1 对齐入盆满深', () => {
  const lines = getUrineLines('孕晚期', 1, 0);
  assert.equal(lines.urge, 60);
  assert.equal(lines.hard, 72);
  const full = getUrineLines('孕晚期', 1, 1);
  assert.equal(full.urge, 52);   // 60 − 8（修正量）
  assert.equal(full.hard, 55);   // 满深上限 = 满档 + 3
  // 旧行为兼容：不传 progress 时入盆即满值
  assert.equal(getUrineHardCap('孕晚期', 1), 55);
  assert.equal(getUrineUrgeCap('孕晚期', 1), 52);
});

test('尿意两条线：深度扫描中间不出台阶', () => {
  scanContinuity((d) => getUrineUrgeCap('孕晚期', 1, d), 'urge', 1.2);
  scanContinuity((d) => getUrineHardCap('孕晚期', 1, d), 'hard', 1.6);
});

test('残值改绝对值：孕晚 8、入盆 8；地板孕晚 16、入盆 25（+9 修正）', () => {
  assert.equal(getUrineResidualValue('孕晚期', 1, 0), 8);
  assert.equal(getUrineResidualValue('孕晚期', 1, 1), 8);
  assert.equal(getUrineResidualValue('孕中期', 1, 0), 8);
  assert.equal(getUrineFloor('孕晚期', 1, 0), 16);
  assert.equal(getUrineFloor('孕晚期', 1, 1), 25);
  // 排完落点 = 地板 + 残值：孕晚未入盆 24、满深 33（总表验算行）
  assert.equal(getUrineFloor('孕晚期', 1, 0) + getUrineResidualValue('孕晚期', 1, 0), 24);
  assert.equal(getUrineFloor('孕晚期', 1, 1) + getUrineResidualValue('孕晚期', 1, 1), 33);
  // 非孕地板 = 0、残值 = 0
  assert.equal(getUrineFloor('黄体期', 0, 0), 0);
  assert.equal(getUrineResidualValue('黄体期', 0, 0), 0);
});

test('逾期双分支：默认自然逾期，prolonged 声明后走延产线', () => {
  assert.equal(getUrineLines('逾期', 0, 0).urge, 52);          // 自然逾期
  assert.equal(getUrineLines('逾期', 0, 0, false).urge, 52);
  assert.equal(getUrineLines('逾期', 0, 0, true).urge, 48);    // 延产
  assert.equal(getUrineLines('逾期', 0, 0, true).hard, 51);
  // 地板/残值跟着分流：自然逾期 24+8=32、延产 26+10=36
  assert.equal(getUrineFloor('逾期', 0, 0) + getUrineResidualValue('逾期', 0, 0), 32);
  assert.equal(getUrineFloor('逾期', 0, 0, true) + getUrineResidualValue('逾期', 0, 0, true), 36);
});

test('入盆修正随基础阶段递增：延产满深余量 3、排完=上限', () => {
  // 延产 48/51 → 满深 36/39，地板 30、残值 9 → 排完 39 = 上限（总表行）
  const full = getUrineLines('延产', 1, 1);
  assert.equal(full.urge, 36);
  assert.equal(full.hard, 39);
  assert.equal(getUrineFloor('延产', 1, 1, true), 30);
  assert.equal(getUrineFloor('延产', 1, 1, true) + getUrineResidualValue('延产', 1, 1, true), 39);
  // 临产满深：56/64 → 36/39，地板 26、残值 6 → 排完 32
  const labor = getUrineLines('临产期', 1, 1);
  assert.equal(labor.urge, 36);
  assert.equal(getUrineFloor('临产期', 1, 1) + getUrineResidualValue('临产期', 1, 1), 32);
});

test('便意阻力：胎数维度保留 × 深度，两端对齐', () => {
  // 未入盆：无加成
  assert.equal(getStoolEngagedDifficulty(0, 0.5), 0);
  // 完全入盆（progress 1）= 旧全值：单胎 10、双胎 15
  assert.equal(getStoolEngagedDifficulty(1, 1), 10);
  assert.equal(getStoolEngagedDifficulty(2, 1), 15);
  // 半程：单胎一半
  assert.equal(getStoolEngagedDifficulty(1, 0.5), 5);
  scanContinuity((d) => getStoolEngagedDifficulty(1, d), 'stool', 0.6);
});

test('应激漏尿的盆底系数：入盆是额外加成，叠在孕周基础上', () => {
  // 值取 53：入盆线 52/55 下读「满」档（52 ≤ 53 < 52+1.5）。
  const noEng = getUrineStressLeakChance(53, 52, 55, 0.78, null, '逾期', 287);
  const fullEng = getUrineStressLeakChance(53, 52, 55, 1.0, null, '逾期', 287);
  assert.ok(fullEng > noEng, `入盆后应激漏尿应更高：满深 ${fullEng} vs 未入盆 ${noEng}`);
  assert.ok(Math.abs(fullEng - 0.75) < 0.01, `入盆满深度+逾期 满档应≈0.75，实际 ${fullEng}`);
  // 非孕 factor=0，满档 = 健康表 = 0.25
  const np = getUrineStressLeakChance(120, 100, 150, 0, null, '黄体期', 0);
  assert.ok(Math.abs(np - 0.25) < 0.01, `非孕满档应激漏尿应=健康表 0.25，实际 ${np}`);
});

test('应激漏尿的盆底系数吃深度：中间连续', () => {
  const stage = '逾期';
  const days = 287;
  const base = getUrineFloorFactor(stage, days, 1, 0); // 0.78
  const full = getUrineFloorFactor(stage, days, 1, 1); // 1.0
  scanContinuity((d) => {
    const f = getUrineFloorFactor(stage, days, 1, d);
    return getUrineStressLeakChance(48, 52, 55, f, null, stage, days);
  }, 'stress-leak', 0.02);
  assert.ok(Math.abs(base - 0.78) < 0.01);
  assert.ok(Math.abs(full - 1.0) < 0.01);
});
