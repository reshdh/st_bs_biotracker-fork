// 性欲引擎的端到端回归：走 applyToolCall，验的是真实推进而不是配置表。
//
// 守的是四条硬规则：
//   1. 人还在碰她的时候 A 不许往下走（唯一例外：大档不应期那几分钟）
//   2. 停手之后 A 落回**起点**，不落回 0
//   3. 闸只在过了满线之后才爬；想象与环境永远爬不满
//   4. 隐藏量（闸／电荷／习惯化）不出现在发给模型的载荷里
import assert from 'node:assert/strict';
import test from 'node:test';

import * as state from '../scripts/state.js';
import { applyToolCall, getLibidoView } from '../scripts/tools.js';
import { getLibidoLines } from '../scripts/metabolism_config.js';
import { LIBIDO_GATE_FULL, applyLibidoAnalgesia } from '../scripts/libido_config.js';

function makeChatState(overrides = {}) {
  const chatState = state.createEmptyChatState();
  chatState.characters['艾拉'] = {
    name: '艾拉',
    initialized: true,
    runtime: {},
    profile: {
      base: {
        stage: '黄体期', days: 3, vitality: 100, psyStress: 100,
        uterinePressure: 0, age: 24, race: '人类', eggs: 0,
        ...(overrides.base || {}),
      },
      pregnant: {
        pregnantDays: 0, effectivePregnantDays: 0, fetusesCount: 0,
        fetuses: [], fetalEnergyDrain: 0, amnionDurability: 0,
        ...(overrides.pregnant || {}),
      },
      bio: { birthDifficulty: 1, breedTolerance: 1, orgasmOvulationAmount: 1, milkGate: '中' },
      immune: {},
      metabolism: { urine: 0, stool: 0, hunger: 0, sleep: 0, milk: 0, odor: 0, companionship: 0, libido: 0 },
      experience: {}, children: [], notify: {}, cooldown: {},
      ...(overrides.profile || {}),
    },
  };
  return chatState;
}

const profileOf = (chatState) => chatState.characters['艾拉'].profile;
const libidoOf = (chatState) => Number(profileOf(chatState).metabolism.libido) || 0;
const hiddenOf = (chatState) => profileOf(chatState).libido || {};

// 报一档刺激 + 分钟数。turnMinutes 是本轮实际推进的时长（用来掐刺激分钟）。
function stimulate(chatState, libidoClass, libidoMinutes, turnMinutes = libidoMinutes) {
  chatState.lastAdvanceMinutes = turnMinutes;
  return applyToolCall(chatState, {
    name: 'bsUpdateCharacterStatus',
    arguments: { female: '艾拉', options: { libidoClass, libidoMinutes } },
  });
}

function withRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

// ── 起点 ────────────────────────────────────────────────────────────

test('什么都不做时 A 落回起点，不落回 0', () => {
  const chatState = makeChatState();
  const lines = getLibidoLines('黄体期', 0, 0, false);
  profileOf(chatState).metabolism.libido = 90;

  // 推一整天，没有任何刺激
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  const after = libidoOf(chatState);
  assert.ok(after < 90, '停手之后该往下走');
  assert.ok(
    Math.abs(after - lines.floor) < 2,
    `该停在起点 ${lines.floor} 附近，实际 ${after}——落回 0 是旧行为`,
  );
});

test('低于起点会往起点回：起点是底噪，不是要努力维持的高度', () => {
  const chatState = makeChatState();
  profileOf(chatState).metabolism.libido = 0;
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { hour: 6 } });
  assert.ok(libidoOf(chatState) > 0, '从 0 该往起点爬回来');
});

// ── 接触进行中不许往下走 ────────────────────────────────────────────

test('人还在碰她的时候 A 不许往下走，哪怕从重档换成轻档', () => {
  const chatState = makeChatState();
  stimulate(chatState, 5, 10);
  const peak = libidoOf(chatState);
  assert.ok(peak > 0, '重档十分钟该把值推上去');

  // 换成轻档继续碰：涨得慢，但不能掉
  stimulate(chatState, 3, 10);
  assert.ok(
    libidoOf(chatState) >= peak,
    `换档只该涨得慢，不该掉（${peak} → ${libidoOf(chatState)}）——掉了会被读成她凉下来了`,
  );
});

test('停手才落：同样十分钟，报 0 档就往下走', () => {
  const chatState = makeChatState();
  stimulate(chatState, 5, 20);
  const peak = libidoOf(chatState);
  stimulate(chatState, 0, 0, 60);
  assert.ok(libidoOf(chatState) < peak, '停手一小时该往起点落');
});

// ── 闸 ──────────────────────────────────────────────────────────────

test('闸只在过了满线之后才爬', () => {
  const chatState = makeChatState();
  const lines = getLibidoLines('黄体期', 0, 0, false);
  // 先确认值还在满线以下时闸不动
  stimulate(chatState, 4, 5);
  assert.ok(libidoOf(chatState) < lines.urge, '五分钟中档还到不了满线');
  assert.equal(Number(hiddenOf(chatState).gate) || 0, 0, '满线以下闸不该动');
});

test('想象推得动值但永远推不动闸——只想，永远不会去', () => {
  const chatState = makeChatState();
  profileOf(chatState).metabolism.libido = 140;   // 顶得很高
  for (let i = 0; i < 20; i += 1) stimulate(chatState, 1, 60);
  assert.equal(Number(hiddenOf(chatState).gate) || 0, 0, '想象的闸速恒为 0');
  assert.equal(profileOf(chatState).notify?.thirdly || '', '', '不该出现「去了一次」');
});

test('孕期走一整天可以到满，但走不到去', () => {
  // 「走一整天可以到满」讲的是孕期：孕期把 C2 放大到 2.2 倍，
  // 因为「原来不算刺激的东西变成了刺激」（坐着顶着、走路磨着、衣服箍着）。
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 0 }] },
  });
  const lines = getLibidoLines('孕晚期', 252, 0, true);
  profileOf(chatState).metabolism.libido = lines.floor;

  for (let i = 0; i < 16; i += 1) stimulate(chatState, 2, 60);   // 醒着的十六小时都在走
  const value = libidoOf(chatState);
  assert.ok(value >= lines.urge, `环境类该能把值送到满线（实际 ${value}，满线 ${lines.urge}）`);
  assert.ok(value <= lines.urge + 10, '但推不进爆档，只能悬在满线上头一点');
  assert.ok(Number(hiddenOf(chatState).gate) < LIBIDO_GATE_FULL, '闸绝不该爬满');
  assert.equal(String(profileOf(chatState).notify?.thirdly || ''), '', '走路不该走出一次高潮');
});

test('非孕期光走路到不了满——孕期那 2.2 倍才是「走到满」的来源', () => {
  const chatState = makeChatState();
  const lines = getLibidoLines('黄体期', 0, 0, false);
  profileOf(chatState).metabolism.libido = lines.floor;
  for (let i = 0; i < 16; i += 1) stimulate(chatState, 2, 60);
  assert.ok(libidoOf(chatState) < lines.urge, '没怀孕的时候走一天也到不了满线');
  assert.ok(libidoOf(chatState) > lines.floor, '但确实往上走了');
});

test('满线以下走路不攒电荷——闸一步没爬过的那一次算 0', () => {
  // 这是防回退：原来最低那一档门槛在 0，于是闸压根没动也算「刚起来就停了」，
  // 走一整天＝二十四次×4＝96 电荷，下一次真去直接读大档。
  // 而口径 §五 说大档要边缘四次（4×18＝72）——走路不该等于边缘四次。
  const chatState = makeChatState();
  const lines = getLibidoLines('黄体期', 0, 0, false);
  profileOf(chatState).metabolism.libido = lines.floor;
  for (let i = 0; i < 24; i += 1) stimulate(chatState, 2, 60);

  assert.ok(libidoOf(chatState) < lines.urge, '前置条件：非孕期走一天到不了满线');
  assert.equal(
    Number(hiddenOf(chatState).charge) || 0, 0,
    '一直在满线以下，闸一步都没爬过，不该攒下任何电荷',
  );
});

test('走一整天：能走到满线，但不攒电荷、不留余韵、一次都不去', () => {
  // 口径 §十三 那句「C2 放大的是感觉和电荷」写在按次攒电荷之前，
  // 跟标定自相矛盾：一小时攒 4，走一天 96，下一次真去直接读大档——
  // 而 §五 说大档要边缘四次。走路不该等于边缘四次。
  //
  // 现在的口径是：**环境类不算「一次」。** 「一次」的语义是有人在对她做一件事，
  // 有开头有结尾，停下来是个事件；坐着顶着、走路磨着是底噪，没有「他停手」那一下。
  //
  // 孕期放大的那一半仍然在，只是走的是另一条路：一天下来她坐在满线上，
  // 晚上那一次从高得多的地方起步，闸爬得更快、峰更高，于是每一次攒得更多。
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 0 }] },
  });
  const lines = getLibidoLines('孕晚期', 252, 0, true);
  profileOf(chatState).metabolism.libido = lines.floor;
  for (let i = 0; i < 24; i += 1) stimulate(chatState, 2, 60);

  assert.ok(libidoOf(chatState) >= lines.urge, '前置条件：孕期走一天能到满线');
  assert.equal(Number(hiddenOf(chatState).charge) || 0, 0, '没人碰她，不该攒下任何电荷');
  assert.equal(Number(hiddenOf(chatState).afterglowMin) || 0, 0, '没人停手，不该有余韵');
  assert.equal(Number(hiddenOf(chatState).denial) || 0, 0, '没被撩起来又丢下，不该攒憋劲');
  assert.ok(Number(hiddenOf(chatState).gate) < LIBIDO_GATE_FULL, '闸爬不满——走不到去');
  assert.equal(String(profileOf(chatState).notify?.thirdly || ''), '', '一整天下来一次都没去');
});

test('重档连着做会去，而且写进 notify', () => {
  const chatState = makeChatState();
  profileOf(chatState).metabolism.libido = 145;   // 已经顶得很高，超出满线很多
  let fired = '';
  for (let i = 0; i < 30 && !fired; i += 1) {
    stimulate(chatState, 5, 10);
    fired = String(profileOf(chatState).notify?.thirdly || '');
  }
  assert.match(fired, /去了一次/, '重档在高位连着做该去');
});

// ── 一直死顶永远是小 ────────────────────────────────────────────────

test('一直死顶不断，去了永远是小档', () => {
  const chatState = makeChatState();
  profileOf(chatState).metabolism.libido = 145;
  let fired = '';
  for (let i = 0; i < 40 && !fired; i += 1) {
    stimulate(chatState, 5, 10);
    fired = String(profileOf(chatState).notify?.thirdly || '');
  }
  assert.match(fired, /（小）/, '一次都没断过，电荷攒不起来，只能是小档');
});

// ── 刺激分钟被本轮时长掐住 ──────────────────────────────────────────

test('刺激分钟报多了会被本轮实际时长掐掉', () => {
  const honest = makeChatState();
  stimulate(honest, 5, 10, 10);

  const liar = makeChatState();
  stimulate(liar, 5, 600, 10);    // 本轮只推 10 分钟，却报 600

  assert.equal(
    libidoOf(liar), libidoOf(honest),
    '虚报分钟不该把值刷上去——不掐的话模型能靠报大数把档位刷满',
  );
});

// ── 冻结 ────────────────────────────────────────────────────────────

// 这一条原来断言的是「代谢免疫时性欲不推进」，**那一版是错的**，写下来是因为
// 搬家之后性欲跟着那七项一起被开关掐住了，我照着当时的实现把它锁进了测试。
// 「代谢免疫」的意思是她不饿不困不想上厕所，不是她不会起来——原版性欲住在
// base.libido，这个开关压根碰不到它。详见 tools.js 里 advanceLibido 上面那一段。
test('代谢免疫不冻性欲：他做她照样起来', () => {
  const chatState = makeChatState();
  profileOf(chatState).immune.metabolism = true;
  profileOf(chatState).metabolism.libido = 60;
  stimulate(chatState, 5, 60);
  assert.ok(libidoOf(chatState) > 60, '那个开关管的是生理需求，不管她起不起来');
});

// ── 高潮诱发排卵 ────────────────────────────────────────────────────

test('小档高潮不排卵，哪怕骰子必中', () => {
  const chatState = makeChatState({ base: { stage: '黄体期', eggs: 0 } });
  profileOf(chatState).metabolism.libido = 145;
  withRandom(0, () => {
    let fired = '';
    for (let i = 0; i < 40 && !fired; i += 1) {
      stimulate(chatState, 5, 10);
      fired = String(profileOf(chatState).notify?.thirdly || '');
    }
    assert.match(fired, /（小）/);
  });
  assert.equal(Number(profileOf(chatState).base.eggs) || 0, 0, '小档概率是 0，骰子再准也不排');
});

test('骰子不中就不排卵，也不烧掉本周期的冷却', () => {
  const chatState = makeChatState();
  profileOf(chatState).metabolism.libido = 145;
  withRandom(0.99, () => {
    for (let i = 0; i < 20; i += 1) stimulate(chatState, 5, 10);
  });
  assert.equal(Number(profileOf(chatState).base.eggs) || 0, 0);
  assert.ok(!profileOf(chatState).cooldown?.orgasmOvulationUsed, '没中就不该占用冷却');
});

test('去了之后性欲不再归零——落回起点是新口径', () => {
  const chatState = makeChatState();
  const lines = getLibidoLines('黄体期', 0, 0, false);
  profileOf(chatState).metabolism.libido = 145;
  let fired = '';
  for (let i = 0; i < 40 && !fired; i += 1) {
    stimulate(chatState, 5, 10);
    fired = String(profileOf(chatState).notify?.thirdly || '');
  }
  assert.match(fired, /去了一次/);
  assert.ok(
    libidoOf(chatState) >= lines.floor,
    `去了之后不该低于起点（实际 ${libidoOf(chatState)}，起点 ${lines.floor}）——归零是旧行为`,
  );
});

// ── 压抑芯片已整个删掉，这一组是防止它被加回来 ──────────────────────
// 原来有个用户手动拨的 ON/OFF，开了之后闸速打二五折。删掉的理由两层：
//   一、它跟自己的说明书方向相反：闸被按住 → 峰值更低 → 断掉时攒得更少
//       → 去了还更小。想要的是「憋着憋着一放开特别凶」，做出来是纯惩罚。
//   二、更要紧的是它不该存在：小中大该由剧情里发生了什么决定，
//       不该由用户手上一个旋钮决定（§十三 否决过「忍了才能中大」）。

test('老存档里残留的 suppress 不会改变任何行为', () => {
  const plain = makeChatState();
  plain.characters['艾拉'].profile.metabolism.libido = 130;
  stimulate(plain, 5, 10);

  const stale = makeChatState();
  stale.characters['艾拉'].profile.metabolism.libido = 130;
  stale.characters['艾拉'].profile.libido = { suppress: true };   // 老存档的残渣
  stimulate(stale, 5, 10);

  assert.equal(
    Number(hiddenOf(stale).gate).toFixed(6), Number(hiddenOf(plain).gate).toFixed(6),
    '那个键已经没人读了——读了就说明机制被加回来了',
  );
});

test('引擎不再往状态里写 suppress', () => {
  const chatState = makeChatState();
  profileOf(chatState).metabolism.libido = 130;
  stimulate(chatState, 5, 10);
  assert.ok(
    !Object.prototype.hasOwnProperty.call(hiddenOf(chatState), 'suppress'),
    '写回状态时不该再带这个键',
  );
});

test('「她忍着」不需要机制：同一段剧情，档位只由做了什么决定', () => {
  // 这一条是把设计意图钉住：旁边有人所以她不敢出声，是正文写的事；
  // 系统只管她身上到哪一步了。所以没有任何输入能在剧情之外改档位。
  const play = (chatState) => {
    let fired = '';
    for (let i = 0; i < 60 && !fired; i += 1) {
      stimulate(chatState, 5, 4);
      fired = String(profileOf(chatState).notify?.thirdly || '');
      if (fired.includes('去了一次')) break;
      stimulate(chatState, 0, 0, 6);
      fired = String(profileOf(chatState).notify?.thirdly || '');
    }
    return (fired.match(/去了一次（(.)）/) || [])[1] || '';
  };
  const a = makeChatState();
  a.characters['艾拉'].profile.metabolism.libido = 130;
  const b = makeChatState();
  b.characters['艾拉'].profile.metabolism.libido = 130;
  b.characters['艾拉'].profile.libido = { suppress: true };
  assert.equal(play(a), play(b), '同样的做法必须得到同样的档位');
});

// ── 隐藏量不外泄 ────────────────────────────────────────────────────

test('对外视图跟面板、提示词读的是同一份，且不含隐藏量', () => {
  const chatState = makeChatState();
  profileOf(chatState).metabolism.libido = 130;
  stimulate(chatState, 5, 10);

  const view = getLibidoView(profileOf(chatState));
  assert.ok(Number(hiddenOf(chatState).gate) > 0, '前置条件：闸已经在爬了');
  for (const leaked of ['gate', 'charge', 'habit', 'instancePeak', 'refractoryMin', 'suppress']) {
    assert.equal(view[leaked], undefined, `${leaked} 不该出现在对外视图里`);
  }
  assert.equal(typeof view.level, 'string');
  assert.equal(typeof view.percent, 'number');
});

// ── 性欲不是排泄需求 ────────────────────────────────────────────────

test('性欲排不掉：bsExcreteMetabolism 不认它', () => {
  const chatState = makeChatState();
  profileOf(chatState).metabolism.libido = 120;
  applyToolCall(chatState, {
    name: 'bsExcreteMetabolism',
    arguments: { female: '艾拉', options: { libido: 100 } },
  });
  assert.equal(libidoOf(chatState), 120, '去不去由闸决定，不是「解放」出来的');
});

// ── 孕期 ────────────────────────────────────────────────────────────

test('孕早期最重那一段起点更低、距离更长——她起念更难', () => {
  const early = makeChatState({
    base: { stage: '孕早期' },
    pregnant: { effectivePregnantDays: 65, fetusesCount: 1, fetuses: [{ descent: 0 }] },
  });
  const plain = makeChatState();
  // 都从各自的起点出发，跟实际游戏一致
  early.characters['艾拉'].profile.metabolism.libido = getLibidoLines('孕早期', 65, 0, true).floor;
  plain.characters['艾拉'].profile.metabolism.libido = getLibidoLines('黄体期', 0, 0, false).floor;

  // 短刺激：分档权重在接近满线时会压缩增量，推太久两边都会挤在满线附近
  stimulate(early, 4, 5);
  stimulate(plain, 4, 5);
  const earlyView = getLibidoView(profileOf(early));
  const plainView = getLibidoView(profileOf(plain));
  assert.equal(earlyView.phase, '早孕·重');
  assert.ok(
    earlyView.percent < plainView.percent,
    `孕早期最重时同样刺激该离满线更远（${earlyView.percent}% vs ${plainView.percent}%）`,
  );
});

test('入盆后一点刺激就到满线，但闸爬不动', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 260, fetusesCount: 1, fetuses: [{ descent: 60 }] },
  });
  // 从起点出发。新建的 chatState 里值是 0，而实际游戏里她坐在起点上
  //（入盆后起点是 50，本身已经在高档——「满着但去不了」就是从这儿来的）
  profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 260, 1, true).floor;
  assert.equal(getLibidoView(profileOf(chatState)).phase, '入盆');

  stimulate(chatState, 3, 20);   // 只是轻档
  const view = getLibidoView(profileOf(chatState));
  assert.ok(['满', '爆'].includes(view.level), `轻档二十分钟就该到满线（实际 ${view.level}）`);
  assert.ok(Number(hiddenOf(chatState).gate) < LIBIDO_GATE_FULL, '余量太薄，闸爬不满');
});

// ── 他停手之后的那几分钟 ──────────────────────────────────────────────
// 这一组守的是一条判据：**「他停手」不等于「什么都没发生」。**
// 原来这一段跟她躺着睡觉走同一条路（值往起点滑、闸对折），于是一个刚被撩到
// 快要了的人和一个睡着的人在系统里的十五分钟一模一样——那是把她当物件。

test('他停手之后她还在那股劲里：值不掉，反而继续往上', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 252, 0, true).floor;
  // C5 八分钟：闸爬到 50 上下（还没到 100，所以她还没去）。
  // ⚠️ 别写十五分钟——那个长度她直接就去了，然后就没有什么可回味的了。
  stimulate(chatState, 5, 8);
  assert.ok(Number(hiddenOf(chatState).gate) > 33, '前置条件：闸得真爬起来过');
  const before = libidoOf(chatState);

  stimulate(chatState, 0, 0, 4);   // 他停手四分钟
  assert.ok(
    libidoOf(chatState) >= before,
    `停手之后不该往下掉（${before.toFixed(1)} → ${libidoOf(chatState).toFixed(1)}）`,
  );
  assert.ok(Number(hiddenOf(chatState).afterglowMin) > 0, '余韵该还剩着');
  assert.equal(getLibidoView(profileOf(chatState)).tag, '余韵', '这一格该让模型看见');
});

test('余韵烧完了才开始真的平下来', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  const lines = getLibidoLines('孕晚期', 252, 0, true);
  profileOf(chatState).metabolism.libido = lines.floor;
  stimulate(chatState, 4, 8);
  // 停手夜推 90 段×5 分钟＝7.5 小时。两件事决定了必须拆段＋拉长：
  // 1. 消退的档位看「进入这一轮时的高度」——整段四小时会全程按停手那一刻的
  //    满档速率算（8/小时×4＝32，84→52 落不下去）。拆段等价于真实对局节奏，
  //    值边掉边换档。
  // 2. 现行分档表低位慢（60 以下 4/小时）：42 点的差值真要烧七个小时
  //    ——「起来过一次，一整个白天才平回去」就是这套数值的本意。
  for (let i = 0; i < 90; i += 1) stimulate(chatState, 0, 0, 5);
  assert.equal(Number(hiddenOf(chatState).afterglowMin) || 0, 0, '七小时之后余韵早烧完了');
  // TASK-05 静息位（第二批拍板）：孕晚期 resting = (42+72)/2 = 57——
  // 「凉得慢、凉不到底」：消退到静息位就停，不再掉回起点。
  const resting = (lines.floor + lines.urge) / 2;
  assert.ok(
    Math.abs(libidoOf(chatState) - resting) < 3,
    `最后应停在静息位（${libidoOf(chatState).toFixed(1)} vs 静息位 ${resting.toFixed(0)}）`,
  );
});

test('他又开始了 → 余韵作废，不叠加', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 252, 0, true).floor;
  stimulate(chatState, 5, 8);
  stimulate(chatState, 0, 0, 2);
  assert.ok(Number(hiddenOf(chatState).afterglowMin) > 0, '前置条件：停手之后有余韵');
  stimulate(chatState, 4, 3);
  assert.equal(
    Number(hiddenOf(chatState).afterglowMin) || 0, 0,
    '他又开始了，她身上那股劲有外面的来源了，不用自己撑着',
  );
});

test('只碰了一下就走开，几乎没有余韵', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 252, 0, true).floor;
  stimulate(chatState, 3, 1);      // 轻档一分钟：闸压根没动
  stimulate(chatState, 0, 0, 5);
  assert.equal(
    Number(hiddenOf(chatState).afterglowMin) || 0, 0,
    '她本来就没起来，没有什么可回味的',
  );
});

test('余韵期间那根条停在原地，不掉也不涨', () => {
  // 两种加法都试过、都荒唐（base 在满／爆乘成 0，stimulus 在爆档 ×1.8 导致
  // 停手一小时后比停手那一刻还高）。正确行为是停在原地。
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 252, 0, true).floor;
  stimulate(chatState, 5, 8);
  const at = libidoOf(chatState);
  stimulate(chatState, 0, 0, 3);
  assert.equal(libidoOf(chatState).toFixed(4), at.toFixed(4), '余韵里那根条一动不动');
});

test('停手一小时之后一定比停手那一刻低——不许倒着涨', () => {
  const chatState = makeChatState();
  stimulate(chatState, 5, 20);
  const at = libidoOf(chatState);
  stimulate(chatState, 0, 0, 60);
  assert.ok(
    libidoOf(chatState) < at,
    `一小时之后该比峰值低（${at.toFixed(1)} → ${libidoOf(chatState).toFixed(1)}）`,
  );
});

test('他弄过了头才停手，她会自己过去；停在临界那一段拿开仍然有效', () => {
  // 女性没有男性那种硬的不可逆点，所以这个门槛不是写死的常数，
  // 是余韵爬闸那条曲线算出来的：贴边才推得动。
  const run = (targetGate) => {
    const chatState = makeChatState({
      base: { stage: '孕晚期' },
      pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 10 }] },
    });
    profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 252, 0, true).floor;
    for (let i = 0; i < 200; i += 1) {
      stimulate(chatState, 5, 1);
      if (String(profileOf(chatState).notify?.thirdly || '').includes('去了一次')) return 'fired-during';
      if (Number(hiddenOf(chatState).gate) >= targetGate) break;
    }
    stimulate(chatState, 0, 0, 20);   // 他撒手，二十分钟没人碰她
    return String(profileOf(chatState).notify?.thirdly || '').includes('去了一次') ? '自己去了' : '散了';
  };
  assert.equal(run(60), '散了', '中段拿开她就散了——这才是常见的那个');
  assert.equal(run(80), '散了', '临界刚亮那一段拿开仍然来得及，边缘玩法才成立');
  assert.equal(run(95), '自己去了', '贴到最后才撒手，他没收住');
});

test('反复被撩起来又丢下会攒憋劲，去了一次基本清掉', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 252, 0, true).floor;
  for (let i = 0; i < 3; i += 1) {
    stimulate(chatState, 5, 6);      // 撩到高位
    stimulate(chatState, 0, 0, 20);  // 丢下
  }
  const denial = Number(hiddenOf(chatState).denial) || 0;
  assert.ok(denial > 0, `被丢下三次该攒起来（实际 ${denial}）`);

  let fired = '';
  for (let i = 0; i < 40 && !fired; i += 1) {
    stimulate(chatState, 5, 5);
    fired = String(profileOf(chatState).notify?.thirdly || '');
  }
  assert.ok(fired.includes('去了一次'), '前置条件：最后得真去一次');
  assert.ok(
    (Number(hiddenOf(chatState).denial) || 0) < denial,
    '她要的东西拿到了，不再是「被丢下」的状态',
  );
});

test('憋劲只加在那根条上，绝不加在闸上', () => {
  // 加在闸上就成了「忍得越久越容易去」，那是口径 §十三 明令否决的闭环。
  const measure = (denial) => {
    const chatState = makeChatState({
      base: { stage: '孕晚期' },
      pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 10 }] },
    });
    // 值顶在天花板上：这样闸速只由「超出满线多少」决定，且已经饱和，
    // 于是这一测量里那根条的差异被排除掉，剩下的只有闸自己
    profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 252, 0, true).hard;
    profileOf(chatState).libido = { denial };
    stimulate(chatState, 5, 5);
    return Number(hiddenOf(chatState).gate) || 0;
  };
  assert.equal(measure(0.6).toFixed(4), measure(0).toFixed(4), '憋劲不许碰闸速');
});

test('习惯化在停手期间会退——不然长间隔的节奏会越做越钝直到永远去不了', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 252, 0, true).hard;
  stimulate(chatState, 5, 6);
  const habit = Number(hiddenOf(chatState).habit) || 0;
  assert.ok(habit > 0, '前置条件：做了一会该攒起习惯化');
  stimulate(chatState, 0, 0, 120);
  assert.ok(
    (Number(hiddenOf(chatState).habit) || 0) < habit,
    '停手两小时该退掉一部分',
  );
});

// ── 代谢免疫不管性欲 ────────────────────────────────────────────────
// 那个开关的意思是「她不饿不困不想上厕所」，不是「她不会起来」。
// 原版性欲住在 base.libido，这个开关碰不到它；搬进 metabolism 之后被顺手关掉了。
// 下面三条锁住修回来的行为。

test('代谢免疫开着，他做她照样起来——那个开关不管这件事', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 250, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  profileOf(chatState).immune = { metabolism: true };
  const lines = getLibidoLines('孕晚期', 250, 0, true);
  profileOf(chatState).metabolism.libido = lines.floor;
  stimulate(chatState, 5, 20);
  assert.ok(
    libidoOf(chatState) > lines.floor + 10,
    `免疫开着也该涨（实测修好前是 ${lines.floor.toFixed(1)} 一步不动）`,
  );
  assert.ok(Number(hiddenOf(chatState).gate) >= 0, '隐藏量照样在算');
});

test('代谢免疫开着仍然能去——闸没有被那个开关掐住', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 250, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  profileOf(chatState).immune = { metabolism: true };
  profileOf(chatState).metabolism.libido = getLibidoLines('孕晚期', 250, 0, true).hard;
  let fired = false;
  for (let i = 0; i < 12 && !fired; i += 1) {
    stimulate(chatState, 5, 10);
    if (/去了一次/.test(String(profileOf(chatState).notify?.thirdly || ''))) fired = true;
  }
  assert.ok(fired, '顶着天花板用重档做两小时，免疫开着也该去');
});

test('代谢免疫仍然挡住其余七项——只放性欲这一项', () => {
  const chatState = makeChatState();
  profileOf(chatState).immune = { metabolism: true };
  profileOf(chatState).metabolism.urine = 0;
  applyToolCall(chatState, {
    name: 'bsUpdateCharacterStatus',
    arguments: { female: '艾拉', options: { urine: 20 } },
  });
  assert.equal(profileOf(chatState).metabolism.urine, 0, '尿意仍然不该累积');
});

// ── 孕期三签与发情态已整个删除 ──────────────────────────────────────
//
// 「症状是长出来的，不是抽出来的」：孕晚期便秘由 getStoolDifficulty 的阶段项
// 撑着，孕晚期起得快由 lines.floor 撑着——都轮不到抽签。抽签那层删掉之后，
// pregnant 上不许再出现那四个字段。

test('孕期三签与发情态已删除：不抽签、不留字段', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 250, fetusesCount: 1, fetuses: [{ descent: 10 }] },
  });
  // Math.random 钉在 0：就算抽签还活着也会全部命中
  withRandom(0, () => applyToolCall(chatState, {
    name: 'bsPassedTime', arguments: { day: 1 },
  }));
  const pregnant = profileOf(chatState).pregnant;
  assert.equal(pregnant.blockage ?? null, null, 'blockage 不应再存在');
  assert.equal(pregnant.acceleration ?? null, null, 'acceleration 不应再存在');
  assert.equal(pregnant.expansion ?? null, null, 'expansion 不应再存在');
  assert.equal(pregnant.libidoEstrus ?? null, null, 'libidoEstrus 不应再存在');
});
// ── 孕期动态全局倍率（TASK-05 拍板 #4）─────────────────────────────────
//
// 全孕期一条曲线叠在类别放大外头：早孕吐劲压到 0.8、孕吐平了回 1.0、
// 孕晚抬到 1.25。它只乘值增益（多想要），不乘闸速（多快去）——
// 所以验法用同线内对照：同孕周、同档位，只有 resolved 与否差一个倍率。

test('孕期全局倍率：同孕周同档，1.25x 与 1.0x 的净增益恰好差 25%', () => {
  // 低值区单分钟对照（不跨档，分档权重表不掺和），比值才干净。
  const run = (extraPregnant) => {
    const chatState = makeChatState({
      base: { stage: '孕晚期' },
      pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 0 }], ...extraPregnant },
    });
    profileOf(chatState).metabolism.libido = 0;
    stimulate(chatState, 5, 1);
    return libidoOf(chatState);
  };
  const withScale = run({});
  const resolved = run({ morningSicknessResolved: true });
  assert.ok(
    Math.abs(withScale / resolved - 1.25) < 1e-9,
    `252 天默认 1.25x：${withScale.toFixed(3)} vs 1.0x ${resolved.toFixed(3)}，比值 ${(withScale / resolved).toFixed(4)}`,
  );
});

test('morningSicknessResolved 报一次就落进 pregnant，之后曲线不再走谷底', () => {
  const chatState = makeChatState({
    base: { stage: '孕中期' },
    pregnant: { effectivePregnantDays: 65, fetusesCount: 1, fetuses: [{ descent: 0 }] },
  });
  applyToolCall(chatState, {
    name: 'bsUpdateCharacterStatus',
    arguments: { female: '艾拉', options: { morningSicknessResolved: true } },
  });
  assert.equal(profileOf(chatState).pregnant.morningSicknessResolved, true, '覆写口要写进 pregnant');
  // 覆写之后 day 65 的增益 = resolved 常数 1.0，不再是 0.8 谷底。
  const resolved = chatState;
  profileOf(resolved).metabolism.libido = 0;
  stimulate(resolved, 5, 1);
  const plain = makeChatState({
    base: { stage: '孕中期' },
    pregnant: { effectivePregnantDays: 65, fetusesCount: 1, fetuses: [{ descent: 0 }] },
  });
  profileOf(plain).metabolism.libido = 0;
  stimulate(plain, 5, 1);
  const ratio = libidoOf(resolved) / libidoOf(plain);
  assert.ok(
    Math.abs(ratio - 1 / 0.8) < 1e-9,
    `谷底 0.8 vs 覆写 1.0 的比值该是 1.25（${ratio.toFixed(4)}）`,
  );
});

test('倍率只乘值增益不乘闸：同样推到过线，闸的爬升不受孕周倍率影响', () => {
  // 接线点在 rawGain 那一行；闸速乘区（getLibidoGateSpeed）没有 globalScale。
  // 验法：两组同操作推闸，252 天与覆写组闸相等。
  const gateAfter = (extraPregnant) => {
    const chatState = makeChatState({
      base: { stage: '孕晚期' },
      pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 0 }], ...extraPregnant },
    });
    const lines = getLibidoLines('孕晚期', 252, 0, true);
    profileOf(chatState).metabolism.libido = lines.urge + 20;   // 过线，闸在爬
    stimulate(chatState, 5, 3);
    return Number(hiddenOf(chatState).gate);
  };
  assert.equal(gateAfter({}), gateAfter({ morningSicknessResolved: true }), '闸速不吃全局倍率');
});

// ── 大档高潮后的镇痛窗口（TASK-05 拍板 #5）─────────────────────────
// 大档去了之后的 20 分钟里产程阵痛按七折读——「高潮是天然镇痛」那一层。
// 窗口开在写侧（结算那一刻），打折挂在读侧（tracker 的 getPromptFacingLaborState）：
// 产程每轮 updateLaborPain 会重写痛值，写侧打折会被立刻冲掉，读侧才稳。
// 计时器挂在 pregnant.libidoAnalgesia（剩余分钟），随 bsPassedTime 一起倒数；
// 只有大档开，中／小不开，一次性、不连常态。

test('大档去了开 20 分钟镇痛窗，中／小档不开', () => {
  const fire = (charge, gate) => {
    const chatState = makeChatState({
      base: { stage: '孕晚期' },
      pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 0 }], laborPain: 6 },
    });
    profileOf(chatState).metabolism.libido = 145;   // 顶到天花板，闸速饱和
    profileOf(chatState).libido = { gate, charge, habit: 0, instanceOpen: false };
    stimulate(chatState, 5, 30);
    return profileOf(chatState).pregnant;
  };
  assert.equal(Number(fire(90, 99.5).libidoAnalgesia) || 0, 20, '大档该开出 20 分钟窗口');
  assert.equal(
    Number(fire(50, 99.5).libidoAnalgesia) || 0, 0,
    '中档（电荷 50）不开窗——镇痛是大档的待遇',
  );
  assert.equal(
    Number(fire(10, 99.5).libidoAnalgesia) || 0, 0,
    '小档（电荷 10）不开窗',
  );
});

test('窗口开着时阵痛按七折读，烧完了读原值', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 0 }], laborPain: 6 },
  });
  profileOf(chatState).metabolism.libido = 145;
  profileOf(chatState).libido = { gate: 99.5, charge: 90, habit: 0, instanceOpen: false };
  stimulate(chatState, 5, 30);
  const pregnant = profileOf(chatState).pregnant;

  // 窗口内：6 → 4.2（0.7 倍，一位小数）
  assert.equal(applyLibidoAnalgesia(pregnant.libidoAnalgesia, 6), 4.2, '窗内 6 按七折读 4.2');
  // 窗外：原值
  assert.equal(applyLibidoAnalgesia(0, 6), 6, '没窗就原样读');

  // 烧完窗口：bsPassedTime 推 21 分钟（20 窗 + 1），归 0 恢复原痛
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { minute: 21 } });
  assert.equal(
    Number(profileOf(chatState).pregnant.libidoAnalgesia) || 0, 0,
    '烧过 20 分钟窗口该归零',
  );
  assert.equal(
    applyLibidoAnalgesia(profileOf(chatState).pregnant.libidoAnalgesia, 6), 6,
    '窗口烧完后阵痛按原值读',
  );
});

test('产程清空时镇痛窗一起清，不跟着下一孕凭空打折', () => {
  const chatState = makeChatState({
    base: { stage: '孕晚期' },
    pregnant: { effectivePregnantDays: 252, fetusesCount: 1, fetuses: [{ descent: 0 }], laborPain: 6 },
  });
  profileOf(chatState).metabolism.libido = 145;
  profileOf(chatState).libido = { gate: 99.5, charge: 90, habit: 0, instanceOpen: false };
  stimulate(chatState, 5, 30);
  assert.equal(Number(profileOf(chatState).pregnant.libidoAnalgesia) || 0, 20, '前置条件：窗口开着');

  // 走真实的流产口清产程（内部即 clearPregnancyState）：
  // 窗必须跟着 laborPain 一起归零，否则下次怀孕的孕晚读侧
  // 会拿着这 20 分钟给不存在的产程打折。
  const directive = '我在剧情里明确决定让这一胎流产，请执行。';
  applyToolCall(
    chatState,
    { name: 'bsAbortion', arguments: { female: '艾拉', userDirective: directive } },
    { recentMessages: [{ role: 'user', text: directive }] },
  );
  assert.equal(
    Number(profileOf(chatState).pregnant.libidoAnalgesia) || 0, 0,
    '产程清空时镇痛窗也该清',
  );
  assert.equal(
    applyLibidoAnalgesia(profileOf(chatState).pregnant.libidoAnalgesia, 6), 6,
    '清完之后读侧不再打折',
  );
});

// ── 假孕门槛读「高出基线」（TASK-05 顺手项）────────────────────────
// 原判据 libido >= 50 是绝对值：性欲的起点本身是浮动的底噪（基线），
// 拿绝对数当地板，起点被压低的周期里这道门等于永远开着。
// 改读「高出基线多少」，同宫压。非孕基线 18，50 − 18 = 32，
// 所以有效门槛换算后不变——这条测试同时锁边界。

test('假孕门槛按「高出基线」判：50 触发、49 不触发，与非孕基线 18 对齐', () => {
  const mk = (libido) => {
    const chatState = makeChatState();
    profileOf(chatState).base.stage = '黄体期';
    profileOf(chatState).base.days = 13;       // 超过黄体期 12 天上限，推 1 天即切月经期
    profileOf(chatState).base.psyStress = 100;
    profileOf(chatState).metabolism.libido = libido;
    profileOf(chatState).experience = { latestSexPartner: '某人' };
    return chatState;
  };
  const fired = (libido) => {
    const chatState = mk(libido);
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
    return profileOf(chatState).base.stage;
  };
  assert.equal(fired(50), '假孕期', '高出基线 32（=50−18）该进假孕');
  assert.equal(fired(49), '月经期', '差一点就不进——门没有永远开着');
  assert.equal(fired(60), '假孕期', '远超线照常触发');
});
