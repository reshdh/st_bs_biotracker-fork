// 性欲的回归。这一套的地基是「会不会去和去了多大是两个判定」：
//   会不会去 → 看闸（只在过了满线之后才爬，爬多快看超出满线多少）
//   去了多大 → 看电荷（按「次」攒，不按分钟）
// 前几版把两者合成一个数，于是「一直死顶最重」和「快到了拿开再回来」分不开，
// 所以下面这几条断言是防回退的。
//
// 另外两条硬规则也在这里守着：
//   人还在碰她的时候 A 不许往下走（唯一例外是大档不应期）
//   停手之后 A 落回**起点**，不落回 0
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIBIDO_AFTERMATH,
  LIBIDO_CHARGE_BY_PEAK,
  LIBIDO_CHARGE_RETAIN,
  LIBIDO_CLASSES,
  LIBIDO_CRITICAL_GATE,
  LIBIDO_ORGASM_OVULATION_CHANCE,
  LIBIDO_SOFT_CLASSES,
  buildLibidoView,
  getChargeGainForPeak,
  getLibidoPhaseName,
  getOrgasmTier,
} from '../scripts/libido_config.js';
import { getLibidoLevel, getLibidoLines } from '../scripts/metabolism_config.js';

// ── 三条线 ──────────────────────────────────────────────────────────

test('三条线的次序永远是 起点 < 满线 < 天花板', () => {
  const cases = [
    ['非孕', '卵泡期', 0, 0, false],
    ['孕早·起', '孕早期', 30, 0, true],
    ['孕早·重', '孕早期', 65, 0, true],
    ['孕早·回', '孕中期', 91, 0, true],
    ['孕中', '孕中期', 189, 0, true],
    ['孕晚', '孕晚期', 252, 0, true],
    ['入盆', '孕晚期', 260, 1, true],
    ['产后', '产后恢复', 0, 0, false],
  ];
  for (const [label, stage, days, engaged, preg] of cases) {
    const L = getLibidoLines(stage, days, engaged, preg);
    assert.ok(L.floor < L.urge, `${label}：起点必须低于满线`);
    assert.ok(L.urge < L.hard, `${label}：满线必须低于天花板`);
  }
});

test('早孕不是一路往上，中间有一段下凹——起点真的降下去了', () => {
  const base = getLibidoLines('卵泡期', 0, 0, false);
  const trough = getLibidoLines('孕早期', 65, 0, true);
  const back = getLibidoLines('孕中期', 91, 0, true);
  // 只压倍率不行：那样她还坐在一个不低的起点上（看着像想要），只是碰她没反应，
  // 那是孕晚期那张脸，不是孕早期。所以这里守的是「起点低于孕前」。
  assert.ok(trough.floor < base.floor, '谷底的起点必须低于孕前');
  // 而且距离要拉长（更不容易起念），跟尿意全程往下压是反着走的
  assert.ok(trough.urge - trough.floor > base.urge - base.floor, '谷底的距离该比孕前更长');
  assert.ok(Math.abs(back.floor - base.floor) < 1, '约 13 周该回到孕前水平');
});

test('入盆是断点不是平滑过渡：起点抬上去，满线与天花板一起砸下来', () => {
  const before = getLibidoLines('孕晚期', 260, 0, true);
  const after = getLibidoLines('孕晚期', 260, 1, true);
  assert.ok(after.floor > before.floor, '入盆后起点更高（盆腔更充血）');
  assert.ok(after.urge < before.urge, '入盆后满线砸下来');
  assert.ok(after.hard < before.hard, '入盆后天花板砸下来');
  // 「想要更频、一点刺激就到满线，但满着也去不了」的全部来源就是这个余量
  assert.ok(after.hard - after.urge <= 16, '入盆后余量必须很薄，否则闸爬得动');
});

test('曲线按天连续，阶段交界处不出台阶', () => {
  // 旧的 getLibidoCap 用 Math.floor(days/28) 按月取整，交界处会跳一截。
  let prev = getLibidoLines('孕早期', 0, 0, true);
  for (let day = 1; day <= 279; day += 1) {
    const stage = day <= 84 ? '孕早期' : day <= 189 ? '孕中期' : '孕晚期';
    const now = getLibidoLines(stage, day, 0, true);
    for (const key of ['floor', 'urge', 'hard']) {
      assert.ok(Math.abs(now[key] - prev[key]) < 1.5, `第 ${day} 天 ${key} 跳了一截：按天插值不该出台阶`);
    }
    prev = now;
  }
  // 280 天起是逾期双分支（按 prolonged 声明分流），是显式阶段切换不是插值：
  // 临产末 43/69/100 → 自然逾期 44/66/96、延产 46/62/92。
  const natural = getLibidoLines('逾期', 287, 0, true);
  assert.deepEqual([natural.floor, natural.urge, natural.hard], [44, 66, 96]);
  const prolonged = getLibidoLines('逾期', 287, 0, true, true);
  assert.deepEqual([prolonged.floor, prolonged.urge, prolonged.hard], [46, 62, 92]);
});

// ── 分档按满线切，不按天花板等比缩放 ────────────────────────────────

test('入盆后坐在起点读「高」而不是「满」', () => {
  // 这是按满线切与按天花板等比缩放唯一分岔的地方，也正是口径写明了数的地方：
  // 入盆后 起点 50／满线 58／天花板 72。按天花板缩放的话满档门槛 = 100×72/150 = 48，
  // 于是她什么都不做就读成「满」——而满档的基础侧权重是 0、外部刺激 ×1.6。
  const L = getLibidoLines('孕晚期', 260, 1, true);
  assert.equal(getLibidoLevel(L.floor, L.urge, L.hard), '高', '坐在起点不该读成满');
  assert.equal(getLibidoLevel(L.urge, L.urge, L.hard), '满', '刚过满线才是满');
});

test('满档的门槛就是满线本身，各段都一样', () => {
  for (const [stage, days, engaged, preg] of [
    ['卵泡期', 0, 0, false], ['孕中期', 189, 0, true],
    ['孕晚期', 252, 0, true], ['孕晚期', 260, 1, true],
  ]) {
    const L = getLibidoLines(stage, days, engaged, preg);
    assert.equal(getLibidoLevel(L.urge, L.urge, L.hard), '满');
    assert.notEqual(getLibidoLevel(L.urge - 1, L.urge, L.hard), '满', '差一点就不该是满');
  }
});

// ── 电荷按「次」攒，不按分钟 ────────────────────────────────────────

test('电荷按这一次爬到多高给，不看做了多久', () => {
  assert.equal(getChargeGainForPeak(80), 18, '快到了才停攒得最多');
  assert.equal(getChargeGainForPeak(75), 18, '门槛上就算');
  assert.equal(getChargeGainForPeak(50), 10, '到高位才停');
  assert.equal(getChargeGainForPeak(10), 4, '刚起来就停');
});

test('闸压根没动的那一次攒 0——「刚起来就停」得先起来过', () => {
  // 环境类（走路、坐着顶着）闸速不是 0，但值没过满线时闸一步都不爬。
  // 门槛留在 0 的话，走一整天会被记成二十四次「刚起来就停」＝ 96 电荷，
  // 下一次真去直接读大档，而口径说大档要边缘四次（4×18=72）。
  assert.equal(getChargeGainForPeak(0), 0, '闸没动过就不该攒');
  assert.ok(getChargeGainForPeak(1) > 0, '真起来过一点就该攒');
  // 反过来确认门槛没高到把「刚起来就停」整档吃掉
  assert.equal(getChargeGainForPeak(30), 4);
});

test('三条路的档位：边缘四次是大，到高位四次是中，刚起来八次仍是小', () => {
  // 「快到了就停」厉害不是因为它耗时间，是因为把一次攒到顶却不花掉。
  assert.equal(getOrgasmTier(getChargeGainForPeak(80) * 4), '大');
  assert.equal(getOrgasmTier(getChargeGainForPeak(50) * 4), '中');
  assert.equal(getOrgasmTier(getChargeGainForPeak(10) * 8), '小');
  // 一直死顶没断过 → 电荷从 0 开始 → 永远读小档。这一条不用另写规则，
  // 是「没停、直接去了的那一次不攒」自己落出来的。
  assert.equal(getOrgasmTier(0), '小');
});

test('电荷表按峰值降序排，否则 getChargeGainForPeak 的短路会取错档', () => {
  for (let i = 1; i < LIBIDO_CHARGE_BY_PEAK.length; i += 1) {
    assert.ok(
      LIBIDO_CHARGE_BY_PEAK[i - 1].peak > LIBIDO_CHARGE_BY_PEAK[i].peak,
      '这张表是从上往下找第一个满足的，必须降序',
    );
    assert.ok(LIBIDO_CHARGE_BY_PEAK[i - 1].gain > LIBIDO_CHARGE_BY_PEAK[i].gain, '爬得越高攒得越多');
  }
});

test('小档只卸三成——所以越到越胀、越到越空是物理净增加，不是心理', () => {
  assert.ok(LIBIDO_CHARGE_RETAIN['小'] > LIBIDO_CHARGE_RETAIN['中']);
  assert.ok(LIBIDO_CHARGE_RETAIN['中'] > LIBIDO_CHARGE_RETAIN['大']);
  assert.ok(LIBIDO_CHARGE_RETAIN['小'] >= 0.6, '小档必须留下大部分，这一条是素材里那个现象的来源');
  assert.ok(LIBIDO_CHARGE_RETAIN['大'] <= 0.2, '大档该卸得差不多干净');
});

// ── 闸 ──────────────────────────────────────────────────────────────

test('想象的闸速恒为 0：只想，永远不会去', () => {
  assert.equal(LIBIDO_CLASSES[1].gatePerMin, 0);
  assert.ok(LIBIDO_CLASSES[1].valuePerMin > 0, '但它照样能把值推上去');
});

test('环境类推得动值、推不动闸——走一整天可以到满，不可能靠走路去', () => {
  assert.ok(LIBIDO_CLASSES[2].valuePerMin > 0);
  assert.ok(LIBIDO_CLASSES[2].gatePerMin > 0, '闸速本身不是 0');
  // 但它被软天花板挡在满线上头一点，超出量极小、闸爬不动
  assert.ok(LIBIDO_SOFT_CLASSES.includes(2), '环境类必须在软天花板名单里');
  assert.ok(LIBIDO_SOFT_CLASSES.includes(1), '想象类也在');
  assert.ok(!LIBIDO_SOFT_CLASSES.includes(5), '重档不该被挡');
});

test('五档刺激的值与闸都随档位递增，身体接触三档才算 stimulus 侧', () => {
  for (let i = 3; i <= 5; i += 1) {
    assert.equal(LIBIDO_CLASSES[i].side, 'stimulus', `C${i} 该算外部刺激`);
    assert.equal(LIBIDO_CLASSES[i].contact, true, `C${i} 该算接触`);
    assert.ok(LIBIDO_CLASSES[i].valuePerMin > LIBIDO_CLASSES[i - 1].valuePerMin);
    assert.ok(LIBIDO_CLASSES[i].gatePerMin > LIBIDO_CLASSES[i - 1].gatePerMin);
  }
  // 环境与想象算「身体自己攒」——所以走路不会让她漏奶
  assert.equal(LIBIDO_CLASSES[1].side, 'base');
  assert.equal(LIBIDO_CLASSES[2].side, 'base');
  assert.equal(LIBIDO_CLASSES[2].contact, false, '没人动手就不算接触');
});

// ── 不应期与高潮排卵 ────────────────────────────────────────────────

test('去得越大，落得越低、躲得越久', () => {
  assert.ok(LIBIDO_AFTERMATH['小'].refractoryMin < LIBIDO_AFTERMATH['中'].refractoryMin);
  assert.ok(LIBIDO_AFTERMATH['中'].refractoryMin < LIBIDO_AFTERMATH['大'].refractoryMin);
  assert.equal(LIBIDO_AFTERMATH['小'].dropTo, 'high', '小档仍明显高于起点');
  assert.equal(LIBIDO_AFTERMATH['中'].dropTo, 'urge', '中档回到满线附近');
  assert.equal(LIBIDO_AFTERMATH['大'].dropTo, 'floor', '大档落到起点略上');
});

test('高潮诱发排卵按档给概率，小档一律不给', () => {
  assert.equal(LIBIDO_ORGASM_OVULATION_CHANCE['小'], 0, '小档不该排卵');
  assert.ok(LIBIDO_ORGASM_OVULATION_CHANCE['中'] > 0, '中档极小概率');
  assert.ok(
    LIBIDO_ORGASM_OVULATION_CHANCE['大'] > LIBIDO_ORGASM_OVULATION_CHANCE['中'],
    '大档概率必须明显高于中档',
  );
  assert.ok(LIBIDO_ORGASM_OVULATION_CHANCE['中'] < 0.2, '中档是「极小」，别调成常态');
});

// ── 对外视图 ────────────────────────────────────────────────────────

test('视图不含闸、电荷、习惯化——那三样报出去等于告诉模型还差多少', () => {
  const view = buildLibidoView({
    value: 90, urge: 100, hard: 150, level: '高',
    gate: 88, refractoryMin: 0, stage: '卵泡期',
  });
  for (const leaked of ['gate', 'charge', 'habit', 'instancePeak', 'refractoryMin']) {
    assert.equal(view[leaked], undefined, `${leaked} 不该出现在对外视图里`);
  }
  assert.deepEqual(Object.keys(view).sort(), ['hard', 'level', 'percent', 'phase', 'tag', 'text']);
});

test('临界只在闸快满时亮，而且门槛跟电荷表最上面那行对齐', () => {
  const at = (gate) => buildLibidoView({ value: 110, urge: 100, gate, stage: '卵泡期' }).tag;
  assert.equal(at(LIBIDO_CRITICAL_GATE), '临界');
  assert.equal(at(LIBIDO_CRITICAL_GATE - 1), null, '差一点就不该亮');
  assert.equal(at(0), null);
  // 门槛跟「快到了才停」那一行对齐：标签亮着的时候正好是断掉能攒最多电荷的区间
  assert.equal(LIBIDO_CRITICAL_GATE, LIBIDO_CHARGE_BY_PEAK[0].peak);
});

test('不应期标签盖过临界——刚去过的时候闸已经归零', () => {
  const view = buildLibidoView({
    value: 60, urge: 100, gate: 99, refractoryMin: 5, refractoryTier: '大', stage: '卵泡期',
  });
  assert.equal(view.tag, '不应·躲');
  // 不应剩余归零之后标签就撤掉
  assert.equal(
    buildLibidoView({ value: 60, urge: 100, gate: 0, refractoryMin: 0, refractoryTier: '大', stage: '卵泡期' }).tag,
    null,
  );
});

test('百分比读的是占满线几成，不是占天花板——分母不能随孕周跳', () => {
  // 同一个身体状态（刚过满线）在各段都该读 100%，哪怕天花板从 150 掉到 72
  for (const [stage, days, engaged, preg] of [
    ['卵泡期', 0, 0, false], ['孕中期', 189, 0, true], ['孕晚期', 260, 1, true],
  ]) {
    const L = getLibidoLines(stage, days, engaged, preg);
    const view = buildLibidoView({ value: L.urge, urge: L.urge, hard: L.hard, level: '满', stage });
    assert.equal(view.percent, 100, `${stage} 刚过满线该读 100%`);
  }
  // 满线之上还能往 150% 走
  assert.equal(buildLibidoView({ value: 150, urge: 100 }).percent, 150);
});

test('阶段说法按天切，不挂 stage——回位点落在孕中期里', () => {
  assert.equal(getLibidoPhaseName(30), '早孕·起');
  assert.equal(getLibidoPhaseName(65), '早孕·重');
  assert.equal(getLibidoPhaseName(91), '早孕·回', '约 13 周仍在爬回来，但 stage 已经是孕中期');
  assert.equal(getLibidoPhaseName(150), '孕中');
  assert.equal(getLibidoPhaseName(252), '孕晚');
  // 不挂 stage 的理由：挂了会在孕早期最后一天（84）出台阶，而曲线是连续的
  assert.equal(getLibidoPhaseName(84), getLibidoPhaseName(85));
});

test('入盆盖过孕周说法，产后与非孕各走自己那条', () => {
  const of = (opts) => buildLibidoView({ value: 10, urge: 100, ...opts }).phase;
  assert.equal(of({ stage: '孕晚期', effectivePregnantDays: 260, engagedCount: 1, isPregnant: true }), '入盆');
  assert.equal(of({ stage: '孕晚期', effectivePregnantDays: 260, engagedCount: 0, isPregnant: true }), '孕晚');
  assert.equal(of({ stage: '产后恢复' }), '产后');
  assert.equal(of({ stage: '黄体期' }), '黄体期', '非孕直接用月经阶段名');
});

test('text 就是面板与提示词共用的那一句，档名在前标签在后', () => {
  assert.equal(
    buildLibidoView({ value: 110, urge: 100, level: '满', gate: 80, stage: '卵泡期' }).text,
    '满 110% 临界',
  );
  assert.equal(
    buildLibidoView({ value: 50, urge: 100, level: '中', gate: 0, stage: '卵泡期' }).text,
    '中 50%',
    '没有标签就不该留下多余空格',
  );
});
