// 体力（vitality）的数值真源。state.js 与 tools.js 都从这里取。
// 设计总纲见 trellis/TASK-11：三层结构（体质上限／软顶／当前值）、
// 消耗只读行为、软顶只管回复上限、急性状态管分钟级演出。
// 所有数都是初值——裁判是端到端产程校准，偏了调这里，不改结构。

// ── 底噪 ────────────────────────────────────────────────────────────
// 「活着就在烧」。睡中也扣（引擎不判断睡没睡，净回复由回复侧拉平）。
export const VITALITY_IDLE_DRAIN_PER_HOUR = 1.2;

// ── 活动档位（模型报「档 + 分钟」，分钟超过本轮时长会被掐）──────────
// 1 轻＝能边做边聊天；2 中＝会喘说不了长句；3 重＝一分钟就喘。
// 静（0）＝0 速率，底噪另算。
export const VITALITY_ACTIVITY_PER_MIN = { 1: 0.05, 2: 0.1, 3: 0.25 };
export const VITALITY_ACTIVITY_MAX_CLASS = 3;

// ── 乘数（叠乘，钳上限）─────────────────────────────────────────────
export const VITALITY_MULT_CAP = 1.6;
export const VITALITY_MENSTRUAL_MULT = 1.15;      // 经期：出血＋激素低潮
export const VITALITY_TIRED_MULT = 1.15;          // 吃力期以下（<50%）：动作变形借不上力
export const VITALITY_ENGAGED_MIN_MULT = 1.05;    // 入盆深度 0（未入盆）→ 1.05
export const VITALITY_ENGAGED_MAX_MULT = 1.3;     // 入盆深度 1（抵到盆底）

// ── 产程（替代活动档位，模型不用报）─────────────────────────────────
// 第二产程 2.2 是间歇做功的有效值：宫缩 2~4 分一次、做 60~90 秒，不是连续顶格。
// 校准目标：困难产程（42h）后剩 5~15 点（耗竭档），顺利产程（30h）剩 30~40 点（脱力档）。
export const LABOR_VITALITY_PER_HOUR = Object.freeze({
  产兆前驱: 2.0,
  第一产程: 2.8,
  第二产程: 2.2,
  第三产程: 1.5,
  产后观察: 0.8,
});

// ── 软顶（占体质上限的比例；派生量，永不存盘）───────────────────────
// 孕周是主力；胎数系数叠加；情压/困意/饿意/营养再压；产后从低位按 recoveryDays 爬回。
export const SOFT_CAP_STAGE_RATIO = Object.freeze({
  孕早期: 0.90,
  孕中期: 0.95,   // 黄金期回升
  孕晚期: 0.80,
  临产期: 0.70,
  逾期: 0.65,
  产兆前驱: 0.70,
});
export const SOFT_CAP_TWIN_PENALTY = Object.freeze({ 2: 0.08, 3: 0.15 });
export const POSTPARTUM_SOFT_CAP_START = 0.35;    // 产后起步（占上限）
export const SOFT_CAP_NUTRITION_LOW = 0.90;       // nutrition < 0：供养亏空
export const SOFT_CAP_NUTRITION_CRITICAL = 0.80;  // nutrition < -25：明显营养不良

// 情压（psyStress 0~200）压软顶：超出 120 的部分线性压，顶格压掉 12%。
export const SOFT_CAP_PSY_PRESSURE_START = 120;
export const SOFT_CAP_PSY_PRESSURE_MAX = 0.12;
// 困意（占困意 cap 的比例）压软顶：>60% 起，顶格压掉 10%。
export const SOFT_CAP_SLEEPINESS_START = 0.60;
export const SOFT_CAP_SLEEPINESS_MAX = 0.10;
// 饿意同款：>60% 起，顶格压掉 8%。
export const SOFT_CAP_HUNGER_START = 0.60;
export const SOFT_CAP_HUNGER_MAX = 0.08;

// ⚠️ 软顶只管回复上限，永不砸当前值——它表达「回不到满」，不表达「继续掉」。

// ── 回复 ────────────────────────────────────────────────────────────
// 睡觉：唯一大额通道。排解困意的每一点回 1.5 点体力（待校），受困意打折。
export const SLEEP_RECOVERY_PER_SLEEPINESS = 1.5;
export const SLEEPINESS_RECOVERY_HALF = 0.60;     // 困意 >60%：回复 ×0.5
export const SLEEP_RECOVERY_MULT_HALF = 0.5;
export const SLEEPINESS_RECOVERY_QUARTER = 0.90;  // 困意 >90%：×0.25
export const SLEEP_RECOVERY_MULT_QUARTER = 0.25;
// 正餐：排解饿意顺带小回（每点饿意 0.25 体力）。
// 端到端校准（2026-09-04）：0.3 让顺利产程偏高 3 点，降到 0.25 落在目标区间上沿。
export const MEAL_RECOVERY_PER_HUNGER = 0.25;
// 快糖：即时小额，日递减。第 n 次回 max(2, 12 − 4×(n−1))，单日上限 3 次。
export const SUGAR_DOSE = [12, 8, 4];
// 入盆深度 ≥0.85：睡不解乏（翻身疼＋坠胀），睡觉回复打折。
export const ENGAGED_SLEEP_RECOVERY_MULT = 0.8;
export const ENGAGED_SLEEP_PROGRESS_THRESHOLD = 0.85;

// ── 联动 ────────────────────────────────────────────────────────────
// 体力低于软顶 30%：困意按小时爬（挂水平不挂变化量——长期虚弱才可见）。
export const LOW_VITALITY_SLEEPINESS_PER_HOUR = 4;
// 睡回体力顺带推尿意（晨起那一次）：压到回复量的两成。
export const SLEEP_TO_URINE_RATIO = 0.2;

// ── 耗竭与晕倒 ──────────────────────────────────────────────────────
export const VITALITY_EXHAUSTED_RATIO = 0.08;     // ≤8%：耗竭档，晕倒窗口开
export const VITALITY_FAINT_HUNGER_RATIO = 0.15;  // 饿意顶满时窗口放宽到 15%
export const VITALITY_BLACKOUT_RATIO = 0.03;      // <3%：直接断电
export const FAINT_MIN_MINUTES = 3;
export const FAINT_MAX_MINUTES = 10;
// 宫压增速打折：体力耗竭（耗竭档）与情压过阈两路，叠乘不归零。
export const PRESSURE_MULT_EXHAUSTED = 0.7;
export const PRESSURE_MULT_PSY = 0.7;
export const PRESSURE_PSY_THRESHOLD = 140;

// ── 派生函数（纯函数；软顶只有一个入口，面板与引擎共用）─────────────
// VITALITY_CAPS 留在 state.js（registry 的天赋语义在那边），这里只吃数值。

/** 体力档（占体质上限的百分比）：充沛/倦意/吃力/脱力/耗竭。 */
export function getVitalityBand(value, cap) {
  const capN = Math.max(1, Number(cap) || 1);
  const ratio = (Number(value) || 0) / capN;
  if (ratio <= 0.08) return '耗竭';
  if (ratio < 0.25) return '脱力';
  if (ratio < 0.5) return '吃力';
  if (ratio < 0.8) return '倦意';
  return '充沛';
}

/**
 * 软顶：这副身体现在能恢复到哪儿（绝对值）。
 * profile 需要：base.stage、base.days（产后天数）、base.psyStress、pregnant.nutrition、
 * pregnant.fetuses（胎数）、metabolism.sleep、metabolism.hunger。
 * vitCap：体质上限（调用方从 state.js 的 getVitalityInitByLevel 拿）。
 */
export function getVitalitySoftCap(profile, vitCap) {
  const cap = Math.max(1, Number(vitCap) || 1);
  const base = profile?.base || {};
  const stage = String(base.stage || '');
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  const count = fetuses.length;

  let ratio = 1;
  if (stage === '产后恢复') {
    // 坐月子：从 35% 按 recoveryDays 线性爬回 100%。
    const start = POSTPARTUM_SOFT_CAP_START;
    const days = Math.max(0, Number(base.days) || 0);
    const recoveryDays = Math.max(1, Number(profile?.bio?.recoveryDays) || 56);
    ratio = start + (1 - start) * Math.min(1, days / recoveryDays);
  } else if (count > 0 || SOFT_CAP_STAGE_RATIO[stage] !== undefined) {
    ratio = SOFT_CAP_STAGE_RATIO[stage] ?? 1;
    if (stage === '逾期') ratio = 0.65;   // 逾期更深一档（43+ 周还在涨的按 0.70）
  }
  // 胎数系数
  if (SOFT_CAP_TWIN_PENALTY[count]) ratio -= SOFT_CAP_TWIN_PENALTY[count];

  const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
  // 情压
  const psy = clamp01((Number(base.psyStress) || 0) - SOFT_CAP_PSY_PRESSURE_START) / (200 - SOFT_CAP_PSY_PRESSURE_START);
  ratio -= psy * SOFT_CAP_PSY_PRESSURE_MAX;
  // 困意（睡眠债）
  const sleepiness = clamp01((Number(profile?.metabolism?.sleep) || 0) / 150);
  if (sleepiness > SOFT_CAP_SLEEPINESS_START) {
    ratio -= ((sleepiness - SOFT_CAP_SLEEPINESS_START) / (1 - SOFT_CAP_SLEEPINESS_START)) * SOFT_CAP_SLEEPINESS_MAX;
  }
  // 饿意
  const hunger = clamp01((Number(profile?.metabolism?.hunger) || 0) / 150);
  if (hunger > SOFT_CAP_HUNGER_START) {
    ratio -= ((hunger - SOFT_CAP_HUNGER_START) / (1 - SOFT_CAP_HUNGER_START)) * SOFT_CAP_HUNGER_MAX;
  }
  // 营养
  const nutrition = Number(profile?.pregnant?.nutrition) || 0;
  if (nutrition < -25) ratio -= 1 - SOFT_CAP_NUTRITION_CRITICAL;
  else if (nutrition < 0) ratio -= 1 - SOFT_CAP_NUTRITION_LOW;

  ratio = Math.max(0.2, Math.min(1, ratio));
  return Math.round(cap * ratio * 10) / 10;
}

/** 体力结算的活动速率（每分钟），含产程替换逻辑。stage 为产程阶段时模型不用报档。 */
export function getLaborVitalityPerHour(stage) {
  return LABOR_VITALITY_PER_HOUR[stage] ?? null;
}
