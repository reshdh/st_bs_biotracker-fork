// 回归测试：卵巢/排卵状态的一句话描述（getOvaryStatusText）。
// 它是面板「受孕窗口」与主流注入共用的只读派生字段——卵数嵌在句子里，
// 不给裸数字；措辞覆盖月经周期各阶段、着床前胚胎与妊娠。
import assert from 'node:assert/strict';
import test from 'node:test';
import { getOvaryStatusText } from '../scripts/state.js';

function profileOf(stage, extraBase = {}, fetuses = null) {
  return {
    base: { stage, ...extraBase },
    pregnant: fetuses === null ? {} : { fetuses },
  };
}

test('卵泡期：卵泡发育中，尚未排卵', () => {
  assert.equal(getOvaryStatusText(profileOf('卵泡期')), '卵泡发育中，本周期尚未排卵');
});

test('排卵期且卵子存活：卵数嵌句，不给裸数字', () => {
  assert.equal(getOvaryStatusText(profileOf('排卵期', { eggs: 2 })), '已排出 2 颗成熟卵子，尚可受精');
  assert.equal(getOvaryStatusText(profileOf('黄体期', { eggs: 1 })), '已排出 1 颗成熟卵子，尚可受精');
});

test('排卵期但尚未排卵：窗口临近', () => {
  assert.equal(getOvaryStatusText(profileOf('排卵期')), '排卵窗口临近，尚未排出卵子');
});

test('着床前胚胎存在：排卵已完成', () => {
  const profile = profileOf('排卵期', { eggs: 0 }, [{ fathers: 'Father' }]);
  assert.equal(getOvaryStatusText(profile), '本周期排卵已完成');
});

test('妊娠与产程：卵巢暂停排卵', () => {
  for (const stage of ['孕早期', '孕中期', '孕晚期', '临产期', '第一产程']) {
    assert.equal(getOvaryStatusText(profileOf(stage)), '妊娠中，卵巢暂停排卵');
  }
});

test('月经/假孕/产后：各阶段的固定措辞', () => {
  assert.equal(getOvaryStatusText(profileOf('月经期')), '月经来潮，卵泡将随新周期重新发育');
  assert.equal(getOvaryStatusText(profileOf('黄体期')), '本周期排卵窗口已关闭');
  assert.equal(getOvaryStatusText(profileOf('假孕期')), '假孕状态，暂停排卵');
  assert.equal(getOvaryStatusText(profileOf('产后恢复')), '产后恢复中，排卵尚未重启');
});
