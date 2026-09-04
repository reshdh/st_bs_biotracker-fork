// 子宫压力：当下被折腾到什么程度，不是累积伤害。
//
// 旧模型只涨不落，于是剧烈运动、勒腹、一次激烈性交的加值会累在同一个数上——
// 跳绳那一次的 +20，两个月后还在那儿等着跟别的加值相加，攒够就出事。
// 而生理事实是每一条的结尾都相同：停下来就缓解。
//
// 所以拆成两层：
//   基线 = 真的离生有多近。孕早中期恒为 0；孕晚期以后随孕周爬，逾期继续爬。
//   波动 = 事件加的那一笔，会往基线回落。
// 值永远落回基线而不是落回 0，这样「接近临产」这件事不会被回落抹掉，
// 而单次事件也攒不出必然——只有持续不断地加（加得比落得快）才推得上去。

// 基线：孕晚期起才有。逾期继续爬，代表真的在接近临产。
// 刻意压在危机阈值（上限的一半）之下——基线本身不该把人推过线，
// 过线要靠事件叠上来。
const BASELINE_START_DAYS = 189; // 孕晚期起点（27 周）
const BASELINE_PER_DAY = 0.30;
const BASELINE_OVERDUE_PER_DAY = 0.55; // 逾期（280 天后）爬得更快
const BASELINE_CAP_RATIO = 0.42; // 不超过上限的 42%，危机阈值是 50%

export function getUterinePressureBaseline(effectivePregnantDays, pressureCap) {
  const days = Number(effectivePregnantDays) || 0;
  const cap = Math.max(1, Number(pressureCap) || 1);
  if (days <= BASELINE_START_DAYS) return 0;
  const normalDays = Math.min(days, 280) - BASELINE_START_DAYS;
  const overdueDays = Math.max(0, days - 280);
  const raw = (normalDays * BASELINE_PER_DAY) + (overdueDays * BASELINE_OVERDUE_PER_DAY);
  return Math.min(raw, cap * BASELINE_CAP_RATIO);
}

// 回落速度。按「几十秒到几分钟就缓解」折到小时粒度：
// 一次事件的加值一两小时内散干净，所以攒不起来；
// 但每小时都在加的持续行为（勒腹、久站、憋着）会稳定停在高位。
export const PRESSURE_DECAY_PER_HOUR = 8;

// 持续性刺激不是「每小时加一笔」，而是「把地板抬起来」。
//
// 每小时加一笔的写法会跟回落打架：加 3 落 8 等于没加，加 10 落 8 又会无限累积。
// 抬地板则干净——勒着、憋着的时候值稳定停在某一档，松开就自己落下去。
export const PRESSURE_STANDING_FLOOR = Object.freeze({
  // 憋尿到爆档且胎头已入盆：膀胱隔着压在宫颈上。
  urineHoldEngaged: 18,
});

// 分档读的是「高出基线多少」，不是绝对值。
// 于是同一次事件在孕中期和逾期给出同样的体感强度，
// 而「离临产多近」由基线单独承载，两件事不再互相冒充。
export const PRESSURE_BANDS = Object.freeze([
  { over: 40, key: 'threatened', label: '先兆' },
  { over: 25, key: 'series', label: '成串发作' },
  { over: 10, key: 'tightening', label: '发紧' },
]);

export function getUterinePressureBand(pressureOverBaseline) {
  const over = Math.max(0, Number(pressureOverBaseline) || 0);
  for (const band of PRESSURE_BANDS) {
    if (over >= band.over) return band;
  }
  return null;
}
