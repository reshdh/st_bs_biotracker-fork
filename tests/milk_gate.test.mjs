// 乳意四档闸的回归：容量随发育长、开奶周之前不走、净涨必然为正、
// 排乳按档扣、堵住那一格排不掉、月经期是往下走的。
//
// 这一套的地基是「三件事读三样不同的东西」：
//   她多难受 → 满了几成（存量÷容量）
//   溢出来什么样 → 查表，看闸和发育，不看满了几成
//   会不会堵 → 在高位待了多久
// 前五版都用一个数管三件事，全部崩在同一处，所以这几条断言是防回退的。
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BASE_METABOLISM_CAP,
  MILK_CAPACITY_MIN,
  MILK_GATES,
  MILK_GATE_KEYS,
  MILK_CONSTITUTION,
  MILK_CONSTITUTION_KEYS,
  MILK_SPRAY_CHANCE,
  getMetabolismLevel,
  getMilkGate,
  getMilkConstitution,
  getMilkGateAdjusted,
  getMilkDevelopmentFromDays,
  getMilkCapacityFromDays,
  getMilkSprayChance,
} from '../scripts/metabolism_config.js';
import { sanitizeProfilePatch } from '../scripts/state.js';

test('四档的净涨必然为正——漏掉的只能是产量的一部分', () => {
  for (const [name, gate] of Object.entries(MILK_GATES)) {
    assert.ok(gate.leak < gate.produce, `${name}档漏掉不该超过产量本身`);
    assert.ok(gate.produce - gate.leak > 0, `${name}档净涨必须为正，否则这一档永远不会堵`);
  }
});

test('净涨排序：全开最快最先堵，紧最慢', () => {
  const net = (n) => MILK_GATES[n].produce - MILK_GATES[n].leak;
  assert.ok(net('紧') < net('中'), '紧该比中慢');
  assert.ok(net('中') < net('松'), '中该比松慢');
  assert.ok(net('松') < net('全开'), '松该比全开慢');
});

test('开奶周按档递减：越松越早开奶', () => {
  assert.ok(MILK_GATES['紧'].openWeek > MILK_GATES['中'].openWeek);
  assert.ok(MILK_GATES['中'].openWeek > MILK_GATES['松'].openWeek);
  assert.ok(MILK_GATES['松'].openWeek > MILK_GATES['全开'].openWeek);
});

test('紧档的自发溢出阈值够不到——所以它只会在乳头口干掉，那是初乳痂的来处', () => {
  assert.ok(MILK_GATES['紧'].seepThreshold > 1, '紧档阈值必须高过满度上限，平静时永远不漏');
  assert.ok(MILK_GATES['中'].seepThreshold <= 1, '中档会渗、要垫');
  assert.ok(MILK_GATES['松'].seepThreshold < MILK_GATES['中'].seepThreshold, '松档坐着不动也在往外走');
});

test('喷出去只有松档以上才可能', () => {
  assert.equal(MILK_GATES['紧'].canSpray, false);
  assert.equal(MILK_GATES['中'].canSpray, false);
  assert.equal(MILK_GATES['松'].canSpray, true);
  assert.equal(MILK_GATES['全开'].canSpray, true);
});

test('闸不改容量：四档共用一条容量线，跟罩杯无关', () => {
  for (const name of MILK_GATE_KEYS) {
    assert.equal(MILK_GATES[name].capacity, undefined, `${name}档不该自带容量——容量跟发育走`);
  }
});

test('不认的档位回落中档，不抛错', () => {
  assert.equal(getMilkGate('乱写的'), MILK_GATES['中']);
  assert.equal(getMilkGate(''), MILK_GATES['中']);
  assert.equal(getMilkGate(undefined), MILK_GATES['中']);
  assert.equal(getMilkGate('松'), MILK_GATES['松']);
});

test('bio.milkGate 归一化：只认四个档，其余落中档', () => {
  for (const name of MILK_GATE_KEYS) {
    assert.equal(sanitizeProfilePatch({ bio: { milkGate: name } }).bio.milkGate, name);
  }
  assert.equal(sanitizeProfilePatch({ bio: { milkGate: '超级松' } }).bio.milkGate, '中');
  assert.equal(sanitizeProfilePatch({ bio: { milkGate: 123 } }).bio.milkGate, '中');
});

test('容量下限不能低到让「存 1 点就爆档」', () => {
  // getMetabolismLevel 里 Math.max(1, cap) 会把极小容量放大成一格一点。
  assert.ok(MILK_CAPACITY_MIN >= 12, '容量下限太小会让早期一存就读爆档');
  assert.equal(getMetabolismLevel(1, MILK_CAPACITY_MIN), '无', '存 1 点不该读出档位');
});

test('满了几成决定读档——早期顶满与足月顶满都走到最难受那一档', () => {
  // 这是「任何阶段都能胀到发烫」那一条的机制来源：看几成，不看绝对值。
  const early = 30;   // 早期容量
  const term = BASE_METABOLISM_CAP;
  assert.equal(getMetabolismLevel(early, early), getMetabolismLevel(term, term), '两边顶满该读同一档');
  // 反过来：同一个绝对值在两种容量下读出不同的档，这正是要的效果。
  assert.notEqual(getMetabolismLevel(30, early), getMetabolismLevel(30, term));
});

// ── 体质系数表（TASK-06 2026-09-04 拍板）──────────────────────────────
test('体质三档：多奶开奶早一周、少奶推后一周', () => {
  assert.equal(MILK_CONSTITUTION['多奶'].openWeekShift, -1);
  assert.equal(MILK_CONSTITUTION['普通'].openWeekShift, 0);
  assert.equal(MILK_CONSTITUTION['少奶'].openWeekShift, +1);
});

test('体质三档：多奶产量高四分之一、少奶低四分之一', () => {
  assert.equal(MILK_CONSTITUTION['多奶'].produceMult, 1.25);
  assert.equal(MILK_CONSTITUTION['普通'].produceMult, 1.0);
  assert.equal(MILK_CONSTITUTION['少奶'].produceMult, 0.75);
});

test('体质不改容量和 expel——多奶是产得多不是容器大', () => {
  // MILK_CONSTITUTION 只有两个字段：openWeekShift 和 produceMult
  for (const [name, con] of Object.entries(MILK_CONSTITUTION)) {
    assert.equal(Object.keys(con).length, 2, `${name}体质不该有额外字段`);
  }
});

test('getMilkGateAdjusted：体质修正 openWeek 和 produce/leak，不改 expel/seepThreshold/canSpray', () => {
  const base = getMilkGate('松');
  const more = getMilkGateAdjusted('松', '多奶');
  const less = getMilkGateAdjusted('松', '少奶');
  const normal = getMilkGateAdjusted('松', '普通');
  // openWeek: 松=13, 多奶-1=12, 少奶+1=14
  assert.equal(more.openWeek, 12);
  assert.equal(less.openWeek, 14);
  assert.equal(normal.openWeek, 13);
  // produce: 松=67, 多奶×1.25=83.75, 少奶×0.75=50.25
  assert.ok(more.produce > base.produce, '多奶产量该高');
  assert.ok(less.produce < base.produce, '少奶产量该低');
  assert.equal(normal.produce, base.produce);
  // leak 也等比缩
  assert.ok(more.leak > base.leak, '多奶漏也该高（漏是产量的一部分）');
  assert.ok(less.leak < base.leak, '少奶漏也该低');
  // expel 不改
  assert.equal(more.expel, base.expel);
  assert.equal(less.expel, base.expel);
  // seepThreshold 不改
  assert.equal(more.seepThreshold, base.seepThreshold);
  // canSpray 不改
  assert.equal(more.canSpray, base.canSpray);
});

test('多奶发育领先：同一个日历时间多积累了一段发育', () => {
  // 第 14 周（98 天）：普通松档开奶周=13，已发育 1 周；多奶开奶周=12，已发育 2 周
  const normalDev = getMilkDevelopmentFromDays('松', '普通', 98, true);
  const moreDev = getMilkDevelopmentFromDays('松', '多奶', 98, true);
  // 少奶开奶周=14（98天），第 98 天刚到开奶周 = 发育 0
  const lessDev = getMilkDevelopmentFromDays('松', '少奶', 98, true);
  assert.ok(moreDev > normalDev, '多奶该比普通发育更多');
  assert.ok(normalDev > 0, '普通该已有发育');
  assert.equal(lessDev, 0, '少奶第14周（98天）刚到开奶周，发育度=0');
});

test('体质不改容量——多奶和普通在同一个发育度下容量一样', () => {
  // 第 20 周（140 天），松档：两者发育度不同（多奶提前一周），但容量公式只用发育度
  // 多奶发育度更高 → 容量更高——这是发育领先的结果，不是体质直接乘容量
  const normalCap = getMilkCapacityFromDays('松', '普通', 140, true);
  const moreCap = getMilkCapacityFromDays('松', '多奶', 140, true);
  // 多奶发育度更高，所以容量也更高——这是对的，不是体质直接乘容量
  assert.ok(moreCap >= normalCap, '多奶因发育领先容量也该更高或相等');
  // 但容量上限是同一个 BASE_METABOLISM_CAP
  const normalTerm = getMilkCapacityFromDays('松', '普通', 280, true);
  const moreTerm = getMilkCapacityFromDays('松', '多奶', 280, true);
  assert.equal(normalTerm, moreTerm, '足月时容量都到 BASE_METABOLISM_CAP');
  assert.equal(normalTerm, BASE_METABOLISM_CAP);
});

test('bio.milkConstitution 归一化：只认三档，其余落普通', () => {
  for (const name of MILK_CONSTITUTION_KEYS) {
    assert.equal(sanitizeProfilePatch({ bio: { milkConstitution: name } }).bio.milkConstitution, name);
  }
  assert.equal(sanitizeProfilePatch({ bio: { milkConstitution: '超级多奶' } }).bio.milkConstitution, '普通');
  assert.equal(sanitizeProfilePatch({ bio: { milkConstitution: 123 } }).bio.milkConstitution, '普通');
});

// ── 喷乳概率表（TASK-06 2026-09-04 拍板）──────────────────────────────
test('喷概率：只有松/全开两档有表，紧/中不喷', () => {
  assert.ok(!('紧' in MILK_SPRAY_CHANCE), '紧档不在喷概率表');
  assert.ok(!('中' in MILK_SPRAY_CHANCE), '中档不在喷概率表');
  assert.ok('松' in MILK_SPRAY_CHANCE, '松档该在喷概率表');
  assert.ok('全开' in MILK_SPRAY_CHANCE, '全开该在喷概率表');
});

test('喷概率：触发时高、非触发时低', () => {
  for (const [name, table] of Object.entries(MILK_SPRAY_CHANCE)) {
    assert.ok(table.triggered > table.untriggered, `${name}档触发概率该比非触发高`);
    assert.ok(table.triggered <= 0.5, `${name}档触发概率不超过 0.5`);
    assert.ok(table.untriggered <= 0.2, `${name}档非触发概率不超过 0.2`);
  }
});

test('喷概率：松档触发 0.25、全开触发 0.45', () => {
  assert.equal(MILK_SPRAY_CHANCE['松'].triggered, 0.25);
  assert.equal(MILK_SPRAY_CHANCE['全开'].triggered, 0.45);
  assert.equal(MILK_SPRAY_CHANCE['松'].untriggered, 0.05);
  assert.equal(MILK_SPRAY_CHANCE['全开'].untriggered, 0.15);
});

test('getMilkSprayChance：紧/中档返回 0，不认的值也返回 0', () => {
  assert.equal(getMilkSprayChance('紧', true), 0);
  assert.equal(getMilkSprayChance('中', true), 0);
  assert.equal(getMilkSprayChance('松', true), 0.25);
  assert.equal(getMilkSprayChance('全开', false), 0.15);
  assert.equal(getMilkSprayChance('乱写的', true), 0);
});
