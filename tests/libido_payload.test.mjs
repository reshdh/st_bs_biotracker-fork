// 发给模型的载荷里有什么、没有什么。
//
// 这一层单独测，是因为它的失效方式是**静默的**：漏删一个隐藏量不会报错，
// 只会让模型看到「还差多少」，然后开始写「再几下就……」。
// 口径 §十二 明令不给闸／电荷／习惯化／不应剩余。
import assert from 'node:assert/strict';
import test from 'node:test';

import { __buildTrackerStateViewForTest as buildTrackerStateView } from '../scripts/tracker.js';

function makeCharacter(overrides = {}) {
  return {
    name: '艾拉',
    initialized: true,
    profile: {
      base: {
        isHere: true, stage: '孕晚期', days: 3, age: 24, race: '人类',
        vitality: 100, psyStress: 30, uterinePressure: 20, eggs: 0,
        vitalityLevel: 4, psyStressLevel: 4,
        ...(overrides.base || {}),
      },
      pregnant: {
        pregnantDays: 250, effectivePregnantDays: 250,
        fetusesCount: 1, fetuses: [{ descent: 20, weight: 1.2, tendencyAngle: 0 }],
        amnionDurability: 50,
        ...(overrides.pregnant || {}),
      },
      metabolism: {
        urine: 20, stool: 10, hunger: 30, sleep: 15,
        milk: 40, odor: 5, companionship: 12, libido: 95,
        ...(overrides.metabolism || {}),
      },
      // 隐藏量：这一份绝不该出现在载荷里
      libido: {
        gate: 87, charge: 63, habit: 0.42,
        refractoryMin: 0, refractoryTier: null,
        instancePeak: 87, instanceOpen: true, activeClass: 5, suppress: true,
        afterglowMin: 9, afterglowPeak: 87, denial: 0.31,
      },
      milk: { duct: '通着', blockHours: 2 },
      bio: { milkGate: '中', orgasmOvulationAmount: 1, birthDifficulty: 1 },
      immune: {}, cooldown: { orgasmOvulationUsed: false },
      experience: {}, children: [], notify: {}, diary: [], skills: [], talents: [],
      ...(overrides.profile || {}),
    },
  };
}

const viewOf = (character) => buildTrackerStateView({ 艾拉: character })['艾拉'];

test('隐藏量整份不进载荷——profile.libido 必须被删掉', () => {
  const sent = viewOf(makeCharacter());
  assert.equal(sent.profile.libido, undefined, 'profile.libido 是隐藏量容器，一个字段都不该发');
  // 顺带确认整个载荷的 JSON 里搜不到那几个数
  const text = JSON.stringify(sent);
  for (const [label, needle] of [['闸', '87'], ['电荷', '63'], ['习惯化', '0.42']]) {
    assert.ok(!text.includes(`"gate":${needle}`), `${label}不该出现`);
  }
  assert.ok(!text.includes('"charge"'), '电荷这个键本身就不该出现');
  assert.ok(!text.includes('"habit"'), '习惯化这个键本身就不该出现');
  assert.ok(!text.includes('"instancePeak"'), '这一次爬到多高也是内部量');
  // 余韵还剩几分钟、被丢下攒了多少，都是内部量：报出去等于告诉模型「还差多少」。
  // 余韵**只以标签的形式**露出去（tag='余韵'），剩几分钟不给。
  assert.ok(!text.includes('"afterglowMin"'), '余韵还剩几分钟是内部量');
  assert.ok(!text.includes('"afterglowPeak"'), '停在多高是内部量');
  assert.ok(!text.includes('"denial"'), '攒了多少憋劲是内部量');
});

test('余韵只以标签露出去，剩几分钟不给', () => {
  const c = makeCharacter();
  c.profile.libido = { gate: 20, charge: 10, refractoryMin: 0, afterglowMin: 9, afterglowPeak: 50 };
  const libido = viewOf(c).profile.metabolism.libido;
  assert.equal(libido.tag, '余韵', '他停手了但她还在那股劲里——这一格必须让模型看见');
  assert.deepEqual(
    Object.keys(libido).sort(), ['level', 'percent', 'phase', 'tag'],
    '仍然只有这四个字段',
  );
});

test('三个标签的优先级：不应 > 临界 > 余韵', () => {
  const c = makeCharacter();
  // 临界与余韵同时成立（他停在很高的位置）→ 报临界，
  // 因为那一格是唯一允许模型写「快到了」的依据
  c.profile.libido = { gate: 88, charge: 40, refractoryMin: 0, afterglowMin: 12, afterglowPeak: 88 };
  assert.equal(viewOf(c).profile.metabolism.libido.tag, '临界');
  // 刚去过 → 不应压掉一切
  c.profile.libido = { gate: 0, charge: 5, refractoryMin: 4, refractoryTier: '中', afterglowMin: 5 };
  assert.equal(viewOf(c).profile.metabolism.libido.tag, '不应·软');
});

test('性欲发的是视图：只有档名、百分比、标签、阶段说法', () => {
  const sent = viewOf(makeCharacter());
  const libido = sent.profile.metabolism.libido;
  assert.equal(typeof libido, 'object', '发的是视图对象不是数字');
  assert.deepEqual(
    Object.keys(libido).sort(),
    ['level', 'percent', 'phase', 'tag'],
    '多一个字段都要问清楚是不是内部量',
  );
  // 天花板不发：它随孕周一直在动，发出去只会被拿去推算余量
  assert.equal(libido.hard, undefined, '天花板是给调试面板的，不发给模型');
  assert.equal(libido.text, undefined, 'text 是面板拼好的那句，模型自己读三个字段就行');
});

test('绝对值不发——入盆后同一个数字的含义完全不同', () => {
  const sent = viewOf(makeCharacter());
  assert.notEqual(
    sent.profile.metabolism.libido, 95,
    '发数字会让模型拿 95 去跟 150 比，而孕晚期天花板是 104、入盆后是 72',
  );
});

test('其余七项代谢仍然是数字，没被顺手改坏', () => {
  const m = viewOf(makeCharacter()).profile.metabolism;
  for (const key of ['urine', 'stool', 'hunger', 'sleep', 'milk']) {
    assert.equal(typeof m[key], 'number', `${key} 该保持数字`);
  }
});

test('乳意那两样只读状态照发——它们是有意给模型的', () => {
  const sent = viewOf(makeCharacter());
  assert.equal(sent.profile.milk?.duct, '通着');
  assert.equal(sent.profile.milk?.blockHours, 2);
});

test('老存档里残留的 suppress 也不会漏进载荷', () => {
  // 压抑芯片这个机制已整个删掉（理由见 libido_config.js）。
  // 但老存档里那个键可能还躺着，而整份 profile.libido 是被删掉的，所以照样不外泄。
  const held = viewOf(makeCharacter());
  assert.ok(!JSON.stringify(held).includes('suppress'), '整份隐藏量容器都不发，残渣也带不出去');
});

test('不应期那几档的标签会发出去', () => {
  for (const [tier, label] of [['小', '不应·轻'], ['中', '不应·软'], ['大', '不应·躲']]) {
    const c = makeCharacter();
    c.profile.libido = { gate: 0, charge: 5, refractoryMin: 5, refractoryTier: tier };
    assert.equal(viewOf(c).profile.metabolism.libido.tag, label, `${tier}档该发 ${label}`);
  }
});

test('临界会发出去——这是唯一允许模型写「快到了」的依据', () => {
  const c = makeCharacter();
  c.profile.libido = { gate: 80, charge: 20, refractoryMin: 0 };
  assert.equal(viewOf(c).profile.metabolism.libido.tag, '临界');

  c.profile.libido = { gate: 20, charge: 20, refractoryMin: 0 };
  assert.equal(viewOf(c).profile.metabolism.libido.tag, null, '闸还低的时候不该给任何暗示');
});

test('幕外角色连性欲视图都不发', () => {
  const c = makeCharacter({ base: { isHere: false } });
  const sent = viewOf(c);
  assert.equal(sent.offscreen, true);
  assert.equal(sent.profile.metabolism, undefined, '幕外只发精简状态');
  assert.equal(sent.profile.libido, undefined);
});

// 这一条原来断言的是「代谢免疫时整块不发，性欲视图跟着消失」，**那一版是错的**。
// 模型看不见她到哪一步了，于是他做了半天她在正文里毫无反应，而引擎那边一直在涨。
// 「代谢免疫」管的是她不饿不困不想上厕所，不管她起不起来。
test('代谢免疫时只发性欲那一格，其余七项不发', () => {
  const c = makeCharacter();
  c.profile.immune = { metabolism: true };
  const sent = viewOf(c);
  const m = sent.profile.metabolism;
  assert.ok(m && typeof m === 'object', '性欲那一格必须还在——不然她在正文里成了没反应的人');
  assert.deepEqual(Object.keys(m), ['libido'], '只留性欲，其余七项一个都不发');
  assert.deepEqual(
    Object.keys(m.libido).sort(), ['level', 'percent', 'phase', 'tag'],
    '仍然只有这四个字段',
  );
  assert.equal(sent.profile.libido, undefined, '隐藏量容器照样整份删掉');
  assert.ok(!JSON.stringify(sent).includes('"gate"'), '闸仍然不外泄');
});

test('bio 与 immune 仍然不进载荷（回归：性欲视图不该把它们带出来）', () => {
  const sent = viewOf(makeCharacter());
  assert.equal(sent.profile.bio, undefined);
  assert.equal(sent.profile.immune, undefined);
  assert.equal(sent.profile.cooldown, undefined);
});
