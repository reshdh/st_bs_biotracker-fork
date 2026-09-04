// 体力系统兜底验证：困难产程（39-41h）能否完成

import { VITALITY_IDLE_DRAIN_PER_HOUR, LABOR_VITALITY_PER_HOUR, SOFT_CAP_STAGE_RATIO } from './scripts/vitality_config.js';

// 困难产程配置（对应 分娩产程.md 剧本）
const DIFFICULT_LABOR = {
  stage: '逾期',
  vitalityLevel: 4,      // 均衡体质，上限 125
  vitalityCap: 125,
  initialVitality: 125,  // 满血进产程（实际她带亏空，这里算最优）

  // 产程时长（小时）
  phase1_latent: 8,      // 潜伏期 0-5cm
  phase1_active: 16,     // 活跃期 5-8cm（含两个平台期）
  phase1_transition: 6,  // 过渡期 8-10cm
  phase2: 10,            // 第二产程（下降+娩出）
  phase3: 1,             // 第三产程

  // 软顶（逾期）
  softCapRatio: SOFT_CAP_STAGE_RATIO['逾期'], // 0.65
};

function calculateLaborVitality(config) {
  const softCap = config.vitalityCap * config.softCapRatio;
  let vitality = config.initialVitality;
  let log = [];

  // 第一产程：潜伏期
  const phase1LatentDrain = LABOR_VITALITY_PER_HOUR['第一产程'] * config.phase1_latent;
  vitality -= phase1LatentDrain;
  log.push(`潜伏期 (${config.phase1_latent}h): -${phase1LatentDrain.toFixed(1)} → ${vitality.toFixed(1)}`);

  // 第一产程：活跃期
  const phase1ActiveDrain = LABOR_VITALITY_PER_HOUR['第一产程'] * config.phase1_active;
  vitality -= phase1ActiveDrain;
  log.push(`活跃期 (${config.phase1_active}h): -${phase1ActiveDrain.toFixed(1)} → ${vitality.toFixed(1)}`);

  // 第一产程：过渡期
  const phase1TransitionDrain = LABOR_VITALITY_PER_HOUR['第一产程'] * config.phase1_transition;
  vitality -= phase1TransitionDrain;
  log.push(`过渡期 (${config.phase1_transition}h): -${phase1TransitionDrain.toFixed(1)} → ${vitality.toFixed(1)}`);

  // 第二产程
  const phase2Drain = LABOR_VITALITY_PER_HOUR['第二产程'] * config.phase2;
  vitality -= phase2Drain;
  log.push(`第二产程 (${config.phase2}h): -${phase2Drain.toFixed(1)} → ${vitality.toFixed(1)}`);

  // 第三产程
  const phase3Drain = LABOR_VITALITY_PER_HOUR['第三产程'] * config.phase3;
  vitality -= phase3Drain;
  log.push(`第三产程 (${config.phase3}h): -${phase3Drain.toFixed(1)} → ${vitality.toFixed(1)}`);

  const finalRatio = vitality / config.vitalityCap;
  const exhaustedThreshold = config.vitalityCap * 0.08;

  return {
    softCap,
    finalVitality: vitality,
    finalRatio,
    exhaustedThreshold,
    isExhausted: vitality <= exhaustedThreshold,
    canComplete: vitality > 0,
    log,
  };
}

const result = calculateLaborVitality(DIFFICULT_LABOR);

console.log('=== 困难产程体力兜底验证 ===\n');
console.log(`配置：${DIFFICULT_LABOR.vitalityLevel} 级体质（上限 ${DIFFICULT_LABOR.vitalityCap}）`);
console.log(`软顶：${result.softCap.toFixed(1)} (${(DIFFICULT_LABOR.softCapRatio * 100).toFixed(0)}%)`);
console.log(`总时长：${DIFFICULT_LABOR.phase1_latent + DIFFICULT_LABOR.phase1_active + DIFFICULT_LABOR.phase1_transition + DIFFICULT_LABOR.phase2 + DIFFICULT_LABOR.phase3}h\n`);

console.log('--- 消耗明细 ---');
result.log.forEach(line => console.log(line));

console.log('\n--- 结论 ---');
console.log(`最终体力：${result.finalVitality.toFixed(1)} / ${DIFFICULT_LABOR.vitalityCap} (${(result.finalRatio * 100).toFixed(1)}%)`);
console.log(`耗竭阈值：${result.exhaustedThreshold.toFixed(1)} (8%)`);
console.log(`是否耗竭：${result.isExhausted ? '✅ 是（预期）' : '❌ 否'}`);
console.log(`能否完成：${result.canComplete ? '✅ 能' : '❌ 不能（体力耗尽）'}`);

if (result.canComplete && result.isExhausted) {
  console.log('\n✅ 兜底验证通过：困难产程能在耗竭状态下完成');
} else if (!result.canComplete) {
  console.log('\n❌ 兜底验证失败：困难产程会导致体力耗尽');
} else {
  console.log('\n⚠️ 警告：困难产程未进入耗竭档（可能配置过于宽松）');
}
