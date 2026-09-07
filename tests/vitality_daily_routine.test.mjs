// 回归测试：跨天推进的体力日结算。
// 实测情境：UI 时间流逝推 3 天，体力被底噪 1.2/小时 × 72 小时纯扣 86 点直接穿底
// ——等于「离场=连续硬撑三天不睡不吃」，与代谢那边「离场日子默认她去过厕所/
// 睡了觉/吃了饭」的日结算哲学打架。
//
// 修复口径：非产程的整天部分由日结算定格为「充分作息」终态——体力落软顶
// （软顶永不砸当前值），余数小时照常扣底噪；产程段保持全程产程速率消耗。
import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyChatState, createDefaultFemaleState } from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import { VITALITY_IDLE_DRAIN_PER_HOUR, LABOR_VITALITY_PER_HOUR } from '../scripts/vitality_config.js';

function setup(stage, vitality, extra = {}) {
  const chat = createEmptyChatState();
  const female = createDefaultFemaleState('Alice');
  female.initialized = true;
  Object.assign(female.profile.base, { stage, days: 0, age: 24, isHere: true, vitality, ...extra });
  chat.characters.Alice = female;
  return chat;
}

const vitality = (chat) => chat.characters.Alice.profile.base.vitality;
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} ≈ ${expected}`);

test('非孕体力 20 推 3 天：日结算落软顶，不再被底噪扣穿', () => {
  const chat = setup('卵泡期', 20);
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 3 } });
  // 等级 4 上限 125，非孕无压制软顶 = 125
  near(vitality(chat), 125, 0.01, '3 天充分作息应回到软顶');
});

test('满体力推 3 天不被砸（软顶永不砸当前值）', () => {
  const chat = setup('卵泡期', 125);
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 3 } });
  near(vitality(chat), 125, 0.01, '当前值高于软顶时保持');
});

test('3 天 + 5 小时：软顶减余数小时底噪', () => {
  const chat = setup('卵泡期', 20);
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 3, hour: 5 } });
  near(vitality(chat), 125 - VITALITY_IDLE_DRAIN_PER_HOUR * 5, 0.01, '余数 5h 底噪 6 点');
});

test('恰好 24 小时：整天结算，无余数底噪', () => {
  const chat = setup('卵泡期', 20);
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { hour: 24 } });
  near(vitality(chat), 125, 0.01, '一天 = 充分作息终态');
});

test('产程段推 1 天：不落软顶，按产程速率全额消耗', () => {
  const chat = setup('第一产程', 125);
  chat.characters.Alice.profile.pregnant.laborPhase = '潜伏期';
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 1 } });
  const rate = VITALITY_IDLE_DRAIN_PER_HOUR + LABOR_VITALITY_PER_HOUR['第一产程'];
  near(vitality(chat), Math.max(0, 125 - rate * 24), 0.01, '产程 24h 全额扣');
});

test('产后恢复推 1 天：体力落恢复期软顶（从低位按 recoveryDays 爬回）', () => {
  const chat = setup('产后恢复', 20, { days: 0 });
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { day: 1 } });
  // 产后软顶从 0.35 起按 recoveryDays 线性爬回；推 1 天后应显著高于 20 但远低于 125
  const value = vitality(chat);
  assert.ok(value > 20 && value < 125, `产后 1 天体力应在恢复区间: ${value}`);
});

test('小时级推进（不足一天）不走日结算：底噪照常全额扣', () => {
  const chat = setup('卵泡期', 100);
  applyToolCall(chat, { name: 'bsPassedTime', arguments: { hour: 10 } });
  near(vitality(chat), 100 - VITALITY_IDLE_DRAIN_PER_HOUR * 10, 0.01, '场景内时间不落软顶');
});
