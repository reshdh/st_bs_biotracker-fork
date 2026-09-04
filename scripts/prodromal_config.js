// 前驱宫缩有两种，判据是胎头有没有深固定。
//
// 一、可逆发作（本文件）——成串宫缩、会痛、夜间尤甚，但仍不规律、仍会缓解：
//    换姿势、走动、休息就散。散掉之后她回到原来的等待状态，可以反复无限次。
//    物理上这是子宫在尝试把胎头压进骨盆；胎头还没固定，那股力就白费了。
//
// 二、真前驱（引擎原有的单向倒计时）——胎头已经深固定，子宫那件事做完了。
//    这时候才是真的要生，才不能回头。
//
// 原先引擎只有第二种，于是任何一次压力到位都会把人推进不可逆的倒计时。
// 少了第一种，「以为要生了、结果又落空」这件事在数值层根本不存在。

// 一次发作持续多久（小时）。成串发作是几个小时的事，不是几分钟。
export const EPISODE_HOURS = Object.freeze({ min: 2, max: 6 });

// 真前驱期间压力地板随进度爬升。
//
// 真前驱是不可逆的倒计时，压力该越来越高——这样破水才有一个「越接近越可能」
// 的窗口，而不是恒定不变、要么一直能破要么一直不能。
// 从发作那一档起步，到倒计时末尾接近临产的量级。
export const TRUE_PRODROMAL_PRESSURE_FLOOR = Object.freeze({ start: 26, end: 58 });

export function getTrueProdromalPressureFloor(progress) {
  const t = Math.max(0, Math.min(1, Number(progress) || 0));
  const { start, end } = TRUE_PRODROMAL_PRESSURE_FLOOR;
  return start + ((end - start) * t);
}

// 发作有自己的频率，不跟分娩共用掷骰。
//
// 这一点是分开的关键：把两者挂在同一次掷骰上会让发作变得跟分娩一样罕见，
// 而它们本来是两种量级的事——「狼来了」要反复好几次，分娩只有一次。
// 入盆越深、子宫越使劲，发作越频繁；胎头还浮着的时候几乎不发作。
export const EPISODE_DAILY_CHANCE = Object.freeze({
  unengaged: 0.05,
  engaged: 0.45,
  // 夜间尤甚：这个乘数留给引擎按时辰用，没有时辰概念时不生效。
  nightMultiplier: 1.5,
});

export function getEpisodeDailyChance(engagedCount) {
  return Number(engagedCount) > 0
    ? EPISODE_DAILY_CHANCE.engaged
    : EPISODE_DAILY_CHANCE.unengaged;
}

// 发作期间宫缩带来的额外子宫压力：抬地板，跟憋尿那一层同一个形状。
// 所以发作本身会把分娩概率乘区推上去——她确实更接近了一点，只是不必然。
export const EPISODE_PRESSURE_FLOOR = 26;

// 散掉之后多久才可能再来一次（小时）。
// 有这个间隔，「狼来了」才是一次次分明的事件，而不是连成一片的背景噪音。
export const EPISODE_COOLDOWN_HOURS = 8;

// 发作时的疼痛程度（0-10 标尺上的一段）。真前驱会更高，这里刻意留出余地：
// 她分不清「这次是不是真的」，靠的就是两者在体感上足够接近。
export const EPISODE_PAIN = 3.5;

export function rollEpisodeHours(random = Math.random) {
  const { min, max } = EPISODE_HOURS;
  return min + (random() * (max - min));
}
