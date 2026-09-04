// 自然发动：分娩是概率事件，不是阈值事件。
//
// 旧模型把子宫压力当成发令枪——压力攒到上限的 66% 就进产兆前驱。那有两个毛病：
// 一是压力只涨不落，日常事件（剧烈运动、勒腹、激烈性交）的加值会累在同一个数上，
// 攒够就发动；二是它让「没入盆也能生」变得不可能，而现实里正是这条路给出了
// 41 周、42 周才生的那部分人。
//
// 改成每天掷骰：基础概率看孕周，入盆状态与当前子宫压力只是乘区。
// 于是压力终于有了正当作用——它不发动分娩，它提高今天发动的概率。
// 因为压力会回落，一次事件只在那几小时内有效，攒不出必然。

// 分娩底线：这个孕周之前一票否决，不掷骰。
// 不是「概率极低」而是「这条路没修通」——压力多高、入盆多久、宫缩多密都不算。
// 多胎本来就生得更早，这是普遍生理，所以按胎数往前挪。
export const LABOR_FLOOR_DAYS = Object.freeze({
  1: 280, // 单胎 40 周
  2: 273, // 双胎 39 周
  3: 266, // 三胎及以上 38 周
});

// 入盆锁：胎头什么时候可以开始往下走。比分娩底线早两周，
// 为的是给「下降—浮回—再下降」的拉锯留出空间：胎头可以反复折腾，
// 但无论怎么折腾都跨不过上面那条底线。
export const ENGAGEMENT_LOCK_DAYS = Object.freeze({
  1: 266, // 单胎 38 周
  2: 259, // 双胎 37 周
  3: 252, // 三胎及以上 36 周
});

export function getLaborFloorDays(fetusesCount = 1) {
  const count = Math.max(1, Math.min(3, Math.floor(Number(fetusesCount) || 1)));
  return LABOR_FLOOR_DAYS[count];
}

export function getEngagementLockDays(fetusesCount = 1) {
  const count = Math.max(1, Math.min(3, Math.floor(Number(fetusesCount) || 1)));
  return ENGAGEMENT_LOCK_DAYS[count];
}

// 每日基础概率，按「超过分娩底线多少周」查。
// 逐周往上爬，所以保底不靠封顶而靠孕周本身：熬得越久越必然。
const BASE_DAILY_CHANCE_BY_WEEK_OVER_FLOOR = Object.freeze([
  0.012, // 底线那一周：极低，所以她大概率活着走过底线那一周
  0.03,
  0.06,
  0.10,
  0.15, // 底线 +4 周及以后
]);

export function getBaseDailyLaborChance(effectivePregnantDays, fetusesCount = 1) {
  const floor = getLaborFloorDays(fetusesCount);
  const days = Number(effectivePregnantDays) || 0;
  if (days < floor) return 0;
  const weeksOver = Math.floor((days - floor) / 7);
  const table = BASE_DAILY_CHANCE_BY_WEEK_OVER_FLOOR;
  return table[Math.min(weeksOver, table.length - 1)];
}

// 完全入盆的判据是「这个状态持续了多久」，不是孕周。
// 这一点必须分清：凭空造出来的角色（强制令、魔法、跨过很长时间的存档）
// 可能一上场就是 41 周且胎头已入盆——那也该从第 1 天算起，
// 而不是拿孕周倒推出「她已经完全入盆十几天了，今天必生」。
export const FULL_ENGAGEMENT_DAYS = 3;

// 入盆乘区。
//
// 刻意压得平缓：入盆锁比分娩底线早两周，所以掷骰刚开始时她往往已经入盆十几天，
// 乘区若陡（早期版本封顶 ×8）就变成常数而不是变量——分娩全挤在底线那一两周，
// 「未入盆 / 已入盆 / 完全入盆」三种情形量出来一模一样，乘区等于没有意义。
// 压平之后基础概率才看得见，孕周才是主导，入盆只是往前推一点。
//
// 封顶也是有意的：让它停止增长，这样「必然会生」只能来自基础概率随孕周爬升，
// 而不是某个状态挂久了就锁死。
export function getEngagementLaborMultiplier(engagedCount, engagedDays) {
  if (!(Number(engagedCount) > 0)) return 1;
  const days = Math.max(0, Number(engagedDays) || 0);
  if (days < FULL_ENGAGEMENT_DAYS) return 1.5;
  const sinceFull = days - FULL_ENGAGEMENT_DAYS;
  if (sinceFull < 2) return 2;
  if (sinceFull < 5) return 2.5;
  if (sinceFull < 9) return 3;
  return 3.5;
}

// 子宫压力乘区：读的是「高出基线多少」，不是绝对值。
// 憋尿、性交、剧烈运动、勒腹全都真的有用，但因为压力会回落，
// 一次事件只在那几小时内有效。
export function getPressureLaborMultiplier(pressureOverBaseline) {
  const over = Math.max(0, Number(pressureOverBaseline) || 0);
  if (over < 10) return 1;
  if (over < 25) return 1.2;
  if (over < 40) return 1.5;
  return 2;
}

// 上限压在 85%：永远不存在「今天必生」。
// 完全入盆十天＋压力顶满的角色三天内几乎肯定会生，但从来不是被逼着生。
export const MAX_DAILY_LABOR_CHANCE = 0.85;

/**
 * 把「每天多少概率」换算成「这一段时间多少概率」。
 *
 * 引擎的推进粒度不固定（一小时、八小时、一整天都可能），
 * 逐 tick 拿日概率直接掷会让推得越碎越容易生。按存活率折算才与粒度无关。
 */
export function dailyChanceToTickChance(dailyChance, hours) {
  const p = Math.max(0, Math.min(1, Number(dailyChance) || 0));
  const h = Math.max(0, Number(hours) || 0);
  if (p <= 0 || h <= 0) return 0;
  if (p >= 1) return 1;
  return 1 - ((1 - p) ** (h / 24));
}
