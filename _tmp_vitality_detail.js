// 体力系统：基于剧本的详细建模（算上她做的所有事）

import { VITALITY_IDLE_DRAIN_PER_HOUR, LABOR_VITALITY_PER_HOUR, VITALITY_ACTIVITY_PER_MIN, SOFT_CAP_STAGE_RATIO } from './scripts/vitality_config.js';

// 困难产程详细时间线（来自 分娩产程.md）
// 原则：产程速率已含基础姿势调整，只算「超出产程基础」的活动
const TIMELINE = [
  // Day1 10:00-12:00 起床、出门办事 | 潜伏期起始
  { phase: '潜伏期', hours: 2, extraActivity: [{ class: 2, minutes: 90 }], recovery: 0 }, // 出门买菜

  // Day1 12:00-13:00 回家做午饭、吃饭
  { phase: '潜伏期', hours: 1, extraActivity: [{ class: 2, minutes: 30 }], recovery: 2 }, // 做饭30分 + 吃饭小回2点

  // Day1 13:00-17:00 午休、坐立不安（产程内姿势调整，不额外算）
  { phase: '潜伏期', hours: 4, extraActivity: [], recovery: 0 },

  // Day1 17:00-18:00 做晚饭、吃饭
  { phase: '潜伏期', hours: 1, extraActivity: [{ class: 2, minutes: 30 }], recovery: 2 }, // 做饭 + 吃饭小回

  // Day1 18:00-22:00 饭后休息、碎睡（4小时碎睡，打折回复）
  { phase: '活跃期', hours: 4, extraActivity: [], recovery: 8 }, // 碎睡回复约8点（很低效）

  // Day1 22:00-23:00 冷汗惊醒、第一次自检（产程内活动，不额外算）
  { phase: '活跃期', hours: 1, extraActivity: [], recovery: 0 },

  // Day1 23:00-24:00 家务、洗澡洗头、备皮
  { phase: '活跃期', hours: 1, extraActivity: [{ class: 2, minutes: 75 }], recovery: 0 }, // 家务30+洗澡45

  // Day2 00:00-02:00 出门采购
  { phase: '活跃期', hours: 2, extraActivity: [{ class: 2, minutes: 100 }], recovery: 0 }, // 往返2小时

  // Day2 02:00-06:00 平台期① 扛痛、间歇吃东西（产程内活动 + 小额补给）
  { phase: '第一产程', hours: 4, extraActivity: [], recovery: 3 }, // 间歇吃几口，小回3点

  // Day2 06:00-07:00 出去吃早餐、破水
  { phase: '第一产程', hours: 1, extraActivity: [{ class: 2, minutes: 30 }], recovery: 3 }, // 走动 + 热早餐回3

  // Day2 07:00-08:00 回家、确认破水（产程内）
  { phase: '第一产程', hours: 1, extraActivity: [], recovery: 0 },

  // Day2 08:00-11:00 平台期② 上网、点外卖（取餐算轻档10分钟）
  { phase: '第一产程', hours: 3, extraActivity: [{ class: 1, minutes: 10 }], recovery: 2 }, // 外卖小回

  // Day2 11:00-13:00 扛痛、勉强进食
  { phase: '第一产程', hours: 2, extraActivity: [], recovery: 1 }, // 勉强吃一点

  // Day2 13:00-16:00 过渡期硬扛（产程内）
  { phase: '第一产程', hours: 3, extraActivity: [], recovery: 0 },

  // Day2 16:00-Day3 03:00 第二产程（11小时，产程内活动 + 间歇抿水吃巧克力）
  { phase: '第二产程', hours: 11, extraActivity: [], recovery: 3 }, // 间歇补给小回3点

  // Day3 03:00+ 第三产程
  { phase: '第三产程', hours: 1, extraActivity: [], recovery: 0 },
];

const CONFIG = {
  vitalityCap: 125,
  stage: '逾期',
  softCapRatio: SOFT_CAP_STAGE_RATIO['逾期'],
};

function calculateDetailedVitality() {
  let vitality = CONFIG.vitalityCap;
  const softCap = CONFIG.vitalityCap * CONFIG.softCapRatio;
  const log = [];

  let totalHours = 0;

  for (const segment of TIMELINE) {
    const hours = segment.hours;
    totalHours += hours;

    // 产程基础消耗
    let laborDrain = 0;
    if (segment.phase === '潜伏期' || segment.phase.includes('活跃期') || segment.phase === '第一产程') {
      laborDrain = LABOR_VITALITY_PER_HOUR['第一产程'] * hours;
    } else if (segment.phase === '第二产程') {
      laborDrain = LABOR_VITALITY_PER_HOUR['第二产程'] * hours;
    } else if (segment.phase === '第三产程') {
      laborDrain = LABOR_VITALITY_PER_HOUR['第三产程'] * hours;
    }

    // 额外活动消耗（超出产程基础的）
    let activityDrain = 0;
    for (const act of segment.extraActivity) {
      const rate = VITALITY_ACTIVITY_PER_MIN[act.class] || 0;
      activityDrain += rate * act.minutes;
    }

    // 回复
    const recovery = segment.recovery || 0;

    const totalDrain = laborDrain + activityDrain - recovery;
    vitality -= totalDrain;

    const actDesc = segment.extraActivity.length > 0
      ? segment.extraActivity.map(a => `档${a.class}×${a.minutes}分`).join('+')
      : '无';

    log.push({
      phase: segment.phase,
      hours,
      laborDrain: laborDrain.toFixed(1),
      activityDrain: activityDrain.toFixed(1),
      recovery: recovery.toFixed(1),
      totalDrain: totalDrain.toFixed(1),
      remaining: vitality.toFixed(1),
      activities: actDesc,
    });
  }

  const exhaustedThreshold = CONFIG.vitalityCap * 0.08;

  return {
    softCap,
    finalVitality: vitality,
    finalRatio: vitality / CONFIG.vitalityCap,
    exhaustedThreshold,
    isExhausted: vitality <= exhaustedThreshold && vitality > 0,
    canComplete: vitality > 0,
    totalHours,
    log,
  };
}

const result = calculateDetailedVitality();

console.log('=== 基于剧本的详细体力建模 ===\n');
console.log(`配置：上限 ${CONFIG.vitalityCap}，软顶 ${result.softCap.toFixed(1)} (${(CONFIG.softCapRatio * 100).toFixed(0)}%)`);
console.log(`总时长：${result.totalHours}h\n`);

console.log('--- 逐段消耗明细 ---');
console.log('时段\t\t\t时长\t产程\t活动\t回复\t净耗\t剩余\t额外活动');
for (const entry of result.log) {
  const phase = entry.phase.padEnd(16);
  console.log(`${phase}\t${entry.hours}h\t${entry.laborDrain}\t${entry.activityDrain}\t${entry.recovery}\t${entry.totalDrain}\t${entry.remaining}\t${entry.activities}`);
}

console.log('\n--- 结论 ---');
console.log(`最终体力：${result.finalVitality.toFixed(1)} / ${CONFIG.vitalityCap} (${(result.finalRatio * 100).toFixed(1)}%)`);
console.log(`耗竭阈值：${result.exhaustedThreshold.toFixed(1)} (8%)`);
console.log(`是否耗竭：${result.isExhausted ? '✅ 是' : '❌ 否'}`);
console.log(`能否完成：${result.canComplete ? '✅ 能' : '❌ 不能'}`);

if (result.canComplete && result.isExhausted) {
  console.log('\n✅ 兜底验证通过：困难产程能在耗竭状态下完成');
} else if (!result.canComplete) {
  console.log('\n❌ 兜底验证失败：体力耗尽');
} else {
  console.log('\n⚠️ 警告：未进入耗竭档');
}
