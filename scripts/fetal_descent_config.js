// 胎头下降：一根连续轴，不是开关。
//
// 原先 engaged 是布尔值，于是「入盆」只有两种状态：入了、没入。那表达不了
// 下降本身是个过程——可以被顶回去一部分，也可以卡在半路来回拉锯。二值状态下
// 每次顶回去都是从零重来，加了这根轴才是真的「进两退一」。
//
// engaged 现在由 descent 派生，所以所有既有调用点（尿意的两条线、便意阻力、
// 宫压地板、分娩乘区）的语义不变，只是判据从「有没有那个标记」变成「够不够深」。

// 三条刻度：
//   浮动（0 - ENGAGED）      胎头还在上面，可自由浮回
//   已入盆（ENGAGED - FIXED）卡进骨盆入口但未固定，能被顶回去，越深越难
//   深固定（FIXED 以上）     不可逆。真前驱的判据就是这条线。
export const DESCENT_ENGAGED = 40;
export const DESCENT_FIXED = 85;

export function isDescentEngaged(descent) {
  return (Number(descent) || 0) >= DESCENT_ENGAGED;
}

export function isDescentFixed(descent) {
  return (Number(descent) || 0) >= DESCENT_FIXED;
}

// 越深越难往回推：胎头卡得越紧，顶回去越费劲，过了固定线就推不动了。
// 这条曲线是「艰难地推回一部分」的全部来源——引擎里没有任何规则提到
// 具体是谁在推、用什么姿势推，那些都是剧情层的事。
export function getDescentPushbackResistance(descent) {
  const value = Number(descent) || 0;
  if (value >= DESCENT_FIXED) return 1; // 推不动
  if (value < DESCENT_ENGAGED) return 0; // 还浮着，没什么可推的
  return (value - DESCENT_ENGAGED) / (DESCENT_FIXED - DESCENT_ENGAGED);
}

/**
 * 把一次「往回推」的意图折算成实际退了多少。
 *
 * amount 是剧情给的力度，返回实际减少的下降度。深度越大越推不动，
 * 到固定线就完全无效——所以拖延这件事有它的窗口，错过就错过了。
 */
export function resolveDescentPushback(descent, amount) {
  const resistance = getDescentPushbackResistance(descent);
  if (resistance >= 1) return 0;
  return Math.max(0, Number(amount) || 0) * (1 - resistance);
}

// 自然下降速度（每小时），按阶段。逾期压得更狠。
// 这个数字乘上胎位与体重的阻力，所以枕后位、巨大儿会明显更慢。
export const DESCENT_RATE_PER_HOUR = Object.freeze({
  临产期: 0.22,
  逾期: 0.40,
});

export function getDescentRatePerHour(stage) {
  return DESCENT_RATE_PER_HOUR[stage] || 0;
}

/**
 * 这一小时实际下降多少。
 *
 * 抽成纯函数是为了可测：拿全引擎去验「枕后位更慢」会被胎位的每日随机漂移
 * 污染——那个 25° 的胎儿可能自己转到接近正枕位，于是不再慢，测试随机地挂。
 *
 * weightShare 是多胎抢同一个骨盆入口的占比（单胎为 1）。
 * angle 是胎位角，偏离正下方越多越慢：枕后位要边降边试旋转。
 */
export function getDescentStep(stage, hours, weightShare, angle) {
  const rate = getDescentRatePerHour(stage);
  if (!(rate > 0)) return 0;
  const h = Math.max(0, Number(hours) || 0);
  const share = Math.max(0, Math.min(1, Number(weightShare) || 0));
  const raw = ((Number(angle) || 0) % 360 + 360) % 360;
  const offset = Math.min(raw, 360 - raw);
  const alignment = 1 - ((Math.min(offset, 30) / 30) * 0.5);
  return rate * h * share * alignment;
}
