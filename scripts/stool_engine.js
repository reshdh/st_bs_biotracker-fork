// 便意双轴引擎：信号（metabolism.stool，显示）＋ 阻力（stool.difficulty，隐藏）。
// 这一层只做纯函数与查表：给定输入算输出，不碰 profile、不碰 Math.random。
// 带状态的动作（吃饭、窜稀掷骰、回合序列）由 tools.js 里的 wrapper 调这些函数。
//
// 设计来源：trellis/TASK-01_便意重写.md。数值改动要回卡里改，别在这里悄悄动。

import { engagementProgressFromDescent } from './metabolism_config.js';

// ── 三条线表（§三）────────────────────────────────────────────────
// 四个锚点：floor（地板）/ urge（该去了）/ pain（开始疼）/ cap（顶）。
// 比例取 Carrington 2011 健康成人正常值 first sensation : desire : max tol ≈ 0.34 : 1 : 1.99，
// 所以 cap = pain + (pain − urge)。
//
// 孕期全程压低三条线——文献主流是孕酮让直肠感觉变钝（阈值往上），
// 机械压迫只在孕晚与入盆占上风。这里选的是「全程让机械那一侧主导」，
// 取表现不取机制。注释里写明，免得日后有人拿文献来改它。
//
// 入盆是唯一断点，也是唯一一处地板反着往上跳的：胎头顶着直肠前壁，
// 她时时刻刻都感觉得到，可量根本没到。floor/urge 从 0.44 跳到 0.85。
const STOOL_LINES_BY_STAGE = Object.freeze({
  非孕: { floor: 17, urge: 50, pain: 100, cap: 150 },
  孕早期: { floor: 16, urge: 46, pain: 88, cap: 130 },
  孕中期: { floor: 15, urge: 40, pain: 72, cap: 104 },
  孕晚期: { floor: 14, urge: 32, pain: 56, cap: 80 },
  临产期: { floor: 14, urge: 32, pain: 56, cap: 80 },
  逾期: { floor: 14, urge: 32, pain: 56, cap: 80 },
  产兆前驱: { floor: 14, urge: 32, pain: 56, cap: 80 },
  第一产程: { floor: 14, urge: 32, pain: 56, cap: 80 },
  第二产程: { floor: 14, urge: 32, pain: 56, cap: 80 },
  第三产程: { floor: 14, urge: 32, pain: 56, cap: 80 },
  产后恢复: { floor: 15, urge: 38, pain: 70, cap: 102 },
});

const STOOL_ENGAGED_LINES = Object.freeze({ floor: 22, urge: 26, pain: 41, cap: 56 });

const STOOL_NON_PREGNANT_STAGE = '';

// 非孕基线：用一张单独表，不跟孕期阶段表混。
const STOOL_BASE_LINES = Object.freeze({ floor: 17, urge: 50, pain: 100, cap: 150 });

// 取三条线。progress ∈ [0,1] 是入盆深度（= clamp((descent − 40) / 60)）。
//   不传 progress = 旧行为：入盆即满值（engagedCount > 0 就用入盆表）。
//   传了 = 线性插值，两端对齐阶段表与入盆表。
//
// ⚠️ 地板从深度 0.6 起才抬——尿意线从 0.3 就压，因为膀胱在前位置更高；
// 便意地板是胎头压直肠前壁，得胎头真的快到盆底才顶得到。
export function getStoolLines(stage, engagedCount = 0, progress = null) {
  const base = STOOL_LINES_BY_STAGE[stage] ?? STOOL_BASE_LINES;
  const engaged = Number(engagedCount) > 0 && STOOL_LINES_BY_STAGE[stage] !== undefined;
  if (progress === null) {
    return engaged ? STOOL_ENGAGED_LINES : base;
  }
  if (!engaged || !(progress > 0)) {
    return base;
  }
  const t = Math.max(0, Math.min(1, Number(progress)));
  const floorT = t <= 0.6 ? 0 : (t - 0.6) / 0.4;
  return {
    floor: base.floor + (STOOL_ENGAGED_LINES.floor - base.floor) * floorT,
    urge: base.urge + (STOOL_ENGAGED_LINES.urge - base.urge) * t,
    pain: base.pain + (STOOL_ENGAGED_LINES.pain - base.pain) * t,
    cap: base.cap + (STOOL_ENGAGED_LINES.cap - base.cap) * t,
  };
}

export function getStoolFloor(stage, engagedCount = 0, progress = null) {
  return getStoolLines(stage, engagedCount, progress).floor;
}
export function getStoolUrge(stage, engagedCount = 0, progress = null) {
  return getStoolLines(stage, engagedCount, progress).urge;
}
export function getStoolPain(stage, engagedCount = 0, progress = null) {
  return getStoolLines(stage, engagedCount, progress).pain;
}
export function getStoolCap(stage, engagedCount = 0, progress = null) {
  return getStoolLines(stage, engagedCount, progress).cap;
}

// ── 六档（§二）────────────────────────────────────────────────────
// 0 ≤地板／1 地板→urge／2 urge→+⅓／3 →+⅔／4 →pain（discomfort）／5 pain→顶（pain）
// pain 是段4／段5 的界，不是段3 的界：段5 的判据是「疼」，
// 段4 必须落在痛觉阈之下（discomfort），段5 才有判据可用。
export function getStoolLevel(value, lines) {
  const v = Math.max(0, Number(value) || 0);
  const { floor, urge, pain, cap } = lines;
  if (v <= floor) return 0;
  if (v <= urge) return 1;
  // urge → pain 三等分，段2/3/4
  const span = pain - urge;
  if (v < urge + span / 3) return 2;
  if (v < urge + (span * 2) / 3) return 3;
  if (v < pain) return 4;
  if (v < cap) return 5;
  return 5;
}

// ── §8.5 检定公式（纯函数）─────────────────────────────────────────
// 信号和阻力尺度不同（入盆后信号超出量最多 15，阻力却 36 起步），
// 各先归一化再合成。
//
//   信号 < 地板              推力 = 0
//   地板 ≤ 信号 ≤ urge       推力 = 0.55 × (信号 − 地板) / (urge − 地板)
//   信号 > urge              推力 = 0.55 + 0.45 × min(1, (信号 − urge) / (pain − urge))
//
//   成功概率 = clamp(推力 − (阻力 − 姿势抵扣) / 100, 0, 1)
//
// urge 处推力 0.55 不是从 0 起爬：刚过「该去了」那条线不该只有一成把握。
// pain 处封顶 1.0：再疼也不更排得出（pain 与排出走两条通路）。
// 阻力 ≥ 55 时信号刚过 urge 必然失败——55 正落在高档（40–69）。
export function computeStoolPushPower(signal, lines) {
  const v = Math.max(0, Number(signal) || 0);
  const { floor, urge, pain } = lines;
  if (v <= floor) return 0;
  if (v <= urge) {
    const span = Math.max(1, urge - floor);
    return 0.55 * ((v - floor) / span);
  }
  const span = Math.max(1, pain - urge);
  return 0.55 + 0.45 * Math.min(1, (v - urge) / span);
}

export function computeStoolSuccessChance(signal, difficulty, lines, postureRelief = 0) {
  const push = computeStoolPushPower(signal, lines);
  const d = Math.max(0, Number(difficulty) || 0);
  const relief = Math.max(0, Number(postureRelief) || 0);
  const chance = push - Math.max(0, d - relief) / 100;
  return Math.max(0, Math.min(1, chance));
}

// ── §8.3 排出量与阻力档（纯函数）───────────────────────────────────
// 减掉的量就是排出的量，同一个数，绝对值。
//   0–19  低  [22, 32]
//   20–39 中  [12, 20]
//   40–69 高  [3, 10]
//   70–100 嵌塞前兆 [1, 4]（80 起漏稀开门，见 §9.2）
//   窜稀      [25, 40]，无视上面几档
// 钳：排出量 ≤ 信号 − 地板。入盆后那 22 点地板永远排不掉。
export function getStoolExcretionRange(difficulty) {
  const d = Math.max(0, Math.min(100, Number(difficulty) || 0));
  if (d < 20) return { tier: 'low', amount: [22, 32] };
  if (d < 40) return { tier: 'mid', amount: [12, 20] };
  if (d < 70) return { tier: 'high', amount: [3, 10] };
  return { tier: 'impaction', amount: [1, 4] };
}

// 钳：排出量不能超过信号到地板的距离。入盆后信号 30 时最多排 8。
export function clampExcretionAmount(raw, signal, lines) {
  const v = Math.max(0, Number(signal) || 0);
  const ceiling = Math.max(0, v - lines.floor);
  return Math.min(raw, ceiling);
}

// ── 阻力档位词（给模型看的档位词，不是数值）─────────────────────────
const STOOL_DIFFICULTY_TIERS = Object.freeze({
  low: '通',
  mid: '阻',
  high: '涩',
  impaction: '嵌',
});

export function getStoolDifficultyTier(difficulty) {
  return STOOL_DIFFICULTY_TIERS[getStoolExcretionRange(difficulty).tier] || '通';
}

// ── §六·6.2 吃饭四档（默认区间，钳 [2, 24]）────────────────────────
const STOOL_MEAL_TIERS = Object.freeze({
  snack: { amount: [2, 5], label: '垫一口' },
  small: { amount: [5, 9], label: '小份' },
  normal: { amount: [9, 15], label: '一顿正常饭' },
  heavy: { amount: [15, 24], label: '吃撑了' },
});

export function getStoolMealTier(portion) {
  return STOOL_MEAL_TIERS[portion] || null;
}

export function clampMealGain(raw) {
  return Math.max(2, Math.min(24, Math.round(Number(raw) || 0)));
}

// ── §六·6.3 八个食物标签（速率/阻力/排气乘数/稀加量）──────────────
// 排气那一列是概率乘数，稀那一列是往隐藏稀值上加的量——两列单位不同。
export const STOOL_FOOD_TAGS = Object.freeze({
  laxative: { rateMult: 1.3, difficultyAdd: -8, gasMult: 1.3, wateryAdd: 0.05, label: '利便' },
  gassy: { rateMult: 1.1, difficultyAdd: 0, gasMult: 3, wateryAdd: 0, label: '产气' },
  greasy: { rateMult: 1.4, difficultyAdd: 0, gasMult: 1.5, wateryAdd: 0.15, label: '油腻' },
  cold: { rateMult: 1.2, difficultyAdd: -4, gasMult: 1.4, wateryAdd: 0.25, label: '生冷' },
  dry: { rateMult: 0.9, difficultyAdd: 6, gasMult: 1, wateryAdd: 0, label: '干硬' },
  fiber: { rateMult: 1.2, difficultyAdd: -10, gasMult: 2, wateryAdd: 0, label: '高纤' },
  iron: { rateMult: 0.9, difficultyAdd: 12, gasMult: 1, wateryAdd: -0.10, label: '铁剂' },
  hydrate: { rateMult: 1, difficultyAdd: -8, gasMult: 1, wateryAdd: 0, label: '灌水' },
});

export function getStoolFoodTag(tag) {
  return STOOL_FOOD_TAGS[tag] || null;
}

// 合成一组食物标签的总效果。
export function composeStoolFoodTags(tags = []) {
  let rateMult = 1;
  let difficultyAdd = 0;
  let gasMult = 1;
  let wateryAdd = 0;
  for (const tag of tags) {
    const t = STOOL_FOOD_TAGS[tag];
    if (!t) continue;
    rateMult *= t.rateMult;
    difficultyAdd += t.difficultyAdd;
    gasMult *= t.gasMult;
    wateryAdd += t.wateryAdd;
  }
  return { rateMult, difficultyAdd, gasMult, wateryAdd: Math.max(0, wateryAdd) };
}

// ── §六·6.4 排气乘法链（纯函数，钳顶 0.95 在最后一步）──────────────
// 排气概率/小时 = 阶段基数 × 胎数 × 类型标签 × 档位系数，钳顶 0.95。
// 必须全乘，不能混加法——上一版写成加法，非孕吃番薯跟孕晚期差不多，阶段表白做了。
// 阶段基数（未入盆）。入盆后走 STOOL_GAS_ENGAGED_BASE，不分阶段——
// 胎头一顶上去，产气量就跳到那一档，跟具体第几周没关系。
const STOOL_GAS_BASE = Object.freeze({
  非孕: 0.04,
  孕早期: 0.05,
  孕中期: 0.09,
  孕晚期: 0.13,
  临产期: 0.13,
  逾期: 0.13,
  产兆前驱: 0.13,
  第一产程: 0.13,
  第二产程: 0.13,
  第三产程: 0.10,
  产后恢复: 0.10,
});
const STOOL_GAS_ENGAGED_BASE = 0.18;

const STOOL_GAS_FETUS_MULT = Object.freeze([1, 1, 1.3, 1.5]); // 单/双/三胎

// §十 排气档位系数。段2 = 1.0 基准，因为阶段基数本来就按「正常有便意」校。
const STOOL_GAS_LEVEL_MULT = Object.freeze([0.5, 0.8, 1.0, 1.3, 1.6, 1.8]);

// engaged 为真时基数用入盆后值 0.18。
export function computeStoolGasChance(stage, fetusCount, level, gasMult = 1, engaged = false) {
  const base = engaged
    ? STOOL_GAS_ENGAGED_BASE
    : (STOOL_GAS_BASE[stage] ?? STOOL_GAS_BASE['非孕']);
  const fc = Math.max(0, Math.min(3, Math.floor(Number(fetusCount) || 0)));
  const fetusFactor = STOOL_GAS_FETUS_MULT[fc] || 1;
  const lv = Math.max(0, Math.min(5, Math.floor(Number(level) || 0)));
  const levelFactor = STOOL_GAS_LEVEL_MULT[lv] || 1;
  const chance = base * fetusFactor * levelFactor * Math.max(0, Number(gasMult) || 0);
  return Math.min(0.95, Math.max(0, chance));
}

// 用力时 ×3（§8.2），只在当回合内。
export function computeStoolGasChanceStraining(stage, fetusCount, level, gasMult = 1, engaged = false) {
  return Math.min(0.95, computeStoolGasChance(stage, fetusCount, level, gasMult, engaged) * 3);
}

// ── §十 绞痛概率/小时（纯函数）──────────────────────────────────────
const STOOL_CRAMP_LEVEL_RATE = Object.freeze([0, 0.02, 0.06, 0.12, 0.20, 0.30]);

export function computeStoolCrampChance(level) {
  const lv = Math.max(0, Math.min(5, Math.floor(Number(level) || 0)));
  return STOOL_CRAMP_LEVEL_RATE[lv] || 0;
}

// ── §十 稀发作概率/小时 = 稀值 × 系数 × 0.3（纯函数）────────────────
const STOOL_WATERY_LEVEL_MULT = Object.freeze([0.2, 0.5, 1.0, 1.5, 2.0, 2.5]);

export function computeStoolWateryChance(wateryValue, level) {
  const v = Math.max(0, Number(wateryValue) || 0);
  const lv = Math.max(0, Math.min(5, Math.floor(Number(level) || 0)));
  return Math.min(0.95, v * (STOOL_WATERY_LEVEL_MULT[lv] || 1) * 0.3);
}

// ── §七 姿势抵扣（检定时临时抵扣，不进值）─────────────────────────
//   坐 0／坐+垫凳 −10（全程）／蹲 −18（孕晚打折−10、入盆后−4）
export function getStoolPostureRelief(posture, stage, engagedCount = 0, progress = null) {
  const p = String(posture || '').trim();
  if (p === 'squatted') {
    const isEngaged = Number(engagedCount) > 0;
    if (isEngaged && progress !== null && Number(progress) > 0) return 4;
    const s = String(stage || '');
    if (['孕晚期', '临产期', '逾期', '产兆前驱', '第一产程', '第二产程', '第三产程'].includes(s)) return 10;
    return 18;
  }
  if (p === 'stool_elevated') return 10;
  return 0;
}

// ── §九·9.2 嵌塞门槛与漏稀开门（纯函数）────────────────────────────
export const STOOL_IMPACTION_THRESHOLD = 100;
export const STOOL_WATERY_LEAK_DOOR = 80;

export function isStoolImpacted(difficulty) {
  return (Number(difficulty) || 0) >= STOOL_IMPACTION_THRESHOLD;
}
export function canStoolWateryLeak(difficulty) {
  return (Number(difficulty) || 0) >= STOOL_WATERY_LEAK_DOOR;
}

// ── §九·9.1 衰减落底（落到阶段底噪就停，不落 0）────────────────────
// 衰减 −0.5/小时，落到 STOOL_STAGE_DIFFICULTY 底噪就停。
// 食物和姿势可以把它压到底噪之下，时间不行。
export const STOOL_DIFFICULTY_DECAY_PER_HOUR = 0.5;

// §9.4 N = 2（每失败一回合阻力 +2，当场生效）。
export const STOOL_FAIL_ROUND_STEP = 2;

// §8.1 冷却 20–40 分钟。冷却窗口内直接被挡回，不给掷骰。
export const STOOL_COOLDOWN_MINUTES = Object.freeze({ min: 20, max: 40 });

// §9.1 成功一次 −20（就是旧 STOOL_CHECK.successDifficultyRelief）。
export const STOOL_SUCCESS_RELIEF = 20;

// ── §六·6.5 起效时间（纯查表，带过期清扫的列表型状态在 tools.js 持有）──
export const STOOL_EFFECT_TIMING = Object.freeze({
  meal: { onsetMinutes: 0, durationMinutes: 0, kind: 'instant' },
  watery: { onsetMinutes: 45, durationMinutes: 210, kind: 'watery' },  // 生冷/油腻 0.5–1h 起、3–4h
  gas: { onsetMinutes: 240, durationMinutes: 480, kind: 'gas' },      // 产气 4h/8h
  laxative: { onsetMinutes: 360, durationMinutes: 720, kind: 'laxative' }, // 利便 6h/12h
});

// ── §六·6.6 放屁减量（纯查表）──────────────────────────────────────
export const STOOL_GAS_RELIEF = Object.freeze({
  silent: { amount: [1, 3], label: '无声漏出' },
  short: { amount: [3, 6], label: '短促一下' },
  series: { amount: [6, 11], label: '一连串' },
  long: { amount: [8, 14], label: '又长又响' },
});

// 憋屁三种结果：渗气减、憋回涨+加成、夹不住响。
export const STOOL_GAS_HOLD = Object.freeze({
  seep: { signalDelta: [-3, -1], gasMultTemp: 1, label: '慢慢放（渗气）' },
  hold: { signalDelta: [1, 3], gasMultTemp: 2.5, gasMultHours: 2, label: '憋回去了' },
  fail: { signalDelta: [-6, -3], gasMultTemp: 1, label: '夹不住还是响了' },
});

// ── §六·6.7 窜稀参数（纯查表）──────────────────────────────────────
export const STOOL_WATERY = Object.freeze({
  preludeMinutes: { min: 10, max: 40 },   // 前摇 10–40 分钟
  waveSignal: [6, 12],                    // 每波便意 +
  discharge: [25, 40],                    // 赶到厕所排
});
