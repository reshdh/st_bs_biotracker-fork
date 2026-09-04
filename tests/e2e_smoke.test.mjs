// 端到端冒烟测试：模拟「用户注册一个 19 岁的排卵期角色 → 正文修正阶段 →
// 推进到分娩」的完整链路，验证注册落库、阶段同步、状态标签、阶段切换、
// 分娩孩子 ID 与血缘图各环节的衔接。对应本轮改动的高风险交汇点。
import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRegistrySystemPrompt, applyRegistryResult } from '../scripts/registry.js';
import { createEmptyChatState, syncCharacterStageFromProfile } from '../scripts/state.js';
import { applyToolCall } from '../scripts/tools.js';
import { getCharacterStatusTags } from '../scripts/status_tag_matrix.js';
import { buildLineageGraph } from '../scripts/lineage.js';

function makeModelResult() {
  return {
    name: '雪乃',
    profile: {
      base: {
        stage: '排卵期',
        age: 19,
        race: '人类',
        vitalityLevel: 4,
        psyStressLevel: 4,
        uterinePressure: 0,
        latestSexDays: null,
        sperms: [],
      },
      pregnant: { pregnantDays: 0, fetusesCount: 0, fetuses: [] },
      experience: {
        virginity: null,
        latestSexPartner: null,
        emotionalMate: null,
        marriageMate: null,
        pregnantExperience: 0,
        naturalBirthExperience: 0,
        surgicalBirthExperience: 0,
        miscarriageExperience: 0,
      },
      psychology: {
        mens: { mastery_value: 62, desire_value: 38, autonomy_value: 71, isChaste: true, hasContraception: false },
      },
      metabolism: { urine: 20, stool: 15, hunger: 40, sleep: 30, milk: 10, libido: 18 },
      children: [],
      descriptions: {
        normalDescription: '状态|排卵期，身体处于易孕窗口;;表情|平静;;行动|正常上课;;',
        pregnantDescription: '',
      },
    },
  };
}

test('注册链路：提示词声明 base.stage，模型返回完整落库后无一丢失', () => {
  const prompt = buildRegistrySystemPrompt({}, { payload: {}, includeBreedingPsychology: true });
  // 参数说明必须教模型填 stage，JSON 模板与示例必须出现该字段
  assert.ok(prompt.includes('base.stage: 当前周期阶段'), '提示词缺少 base.stage 参数说明');
  assert.ok(prompt.includes('"stage": "排卵期"'), 'JSON 结构模板缺少 stage 字段');
  assert.ok(prompt.includes('"stage":"排卵期"'), '示例缺少 stage 字段');
  assert.ok(prompt.includes('月经期、卵泡期、排卵期、黄体期'), '缺少非怀孕阶段枚举');
});

test('注册链路：19 岁排卵期角色完整落库，年龄/阶段/代谢/描述全保留', () => {
  const chatState = createEmptyChatState();
  const character = applyRegistryResult(chatState, makeModelResult(), { allowBreedingPsychology: true });

  assert.equal(character.name, '雪乃');
  assert.equal(character.initialized, true);
  // 用户报的 bug：19 岁被写成 18 —— 年龄必须原样保留，不做取整/夹逼
  assert.equal(character.profile.base.age, 19);
  // 用户报的 bug：对话指定排卵期但 stage 被随机覆盖 —— 模型填的合法阶段必须原样保留
  assert.equal(character.profile.base.stage, '排卵期');
  // 用户报的 bug：metabolism 全部归零 —— 模型填的非零值必须保留
  assert.equal(character.profile.metabolism.urine, 20);
  assert.equal(character.profile.metabolism.stool, 15);
  assert.equal(character.profile.metabolism.hunger, 40);
  assert.equal(character.profile.metabolism.sleep, 30);
  assert.equal(character.profile.metabolism.milk, 10);
  assert.equal(character.profile.metabolism.libido, 18);
  assert.equal(character.profile.descriptions.normalDescription.includes('易孕窗口'), true);
  assert.equal(character.profile.psychology.mens.mastery_value, 62);
  // 阶段二次同步不得改动合法阶段
  const resynced = syncCharacterStageFromProfile(character);
  assert.equal(resynced.profile.base.stage, '排卵期');
});

test('注册链路：落库后状态标签以「排卵期 · 易孕」为基底徽章', () => {
  const chatState = createEmptyChatState();
  const character = applyRegistryResult(chatState, makeModelResult(), { allowBreedingPsychology: true });
  const tags = getCharacterStatusTags(character);
  assert.ok(tags.length > 0, '应至少产出基底徽章');
  assert.equal(tags[0].label, '排卵期 · 易孕');
  assert.equal(tags[0].className, 'bs-bt-tag--stage');
});

test('注册链路：模型漏填 metabolism 时回退默认值且不抛错', () => {
  const chatState = createEmptyChatState();
  const result = makeModelResult();
  delete result.profile.metabolism;
  const character = applyRegistryResult(chatState, result, { allowBreedingPsychology: true });
  assert.equal(character.profile.base.age, 19);
  assert.equal(character.profile.base.stage, '排卵期');
  assert.equal(Number(character.profile.metabolism.libido) || 0, 0);
});

test('阶段切换链路：正文修正月经期→排卵期生效，反向再切回也可', () => {
  const chatState = createEmptyChatState();
  const character = applyRegistryResult(chatState, makeModelResult(), { allowBreedingPsychology: true });
  assert.equal(character.profile.base.stage, '排卵期');

  const toMens = applyToolCall(chatState, { name: 'bsSetMenstrualPhases', arguments: { female: '雪乃', stage: '月经期' } });
  assert.equal(toMens.applied, true, toMens.message);
  assert.equal(chatState.characters['雪乃'].profile.base.stage, '月经期');

  const backToOvulation = applyToolCall(chatState, { name: 'bsSetMenstrualPhases', arguments: { female: '雪乃', stage: '排卵期' } });
  assert.equal(backToOvulation.applied, true, backToOvulation.message);
  assert.equal(chatState.characters['雪乃'].profile.base.stage, '排卵期');
  assert.equal(chatState.characters['雪乃'].profile.cooldown.orgasmOvulationUsed, false);
  assert.ok(String(chatState.characters['雪乃'].profile.notify.firstly).includes('排卵期'));
});

test('阶段切换链路：妊娠状态拒绝被月经阶段覆盖', () => {
  const chatState = createEmptyChatState();
  chatState.characters['雪乃'] = {
    name: '雪乃',
    initialized: true,
    profile: {
      base: { stage: '孕中期', days: 110, race: '人类', vitality: 100, vitalityLevel: 4, psyStressLevel: 4 },
      pregnant: { pregnantDays: 110, effectivePregnantDays: 110, fetusesCount: 1, fetuses: [{ fathers: '凯', race: '人类', embryoType: '胎生', weight: 1, talents: [] }] },
      metabolism: { urine: 10, stool: 10, hunger: 10, sleep: 10, milk: 0, libido: 10 },
      cooldown: {},
    },
  };
  const result = applyToolCall(chatState, { name: 'bsSetMenstrualPhases', arguments: { female: '雪乃', stage: '排卵期' } });
  assert.equal(result.applied, false);
  assert.equal(chatState.characters['雪乃'].profile.base.stage, '孕中期');
});

test('尿液链路：漏尿冷却标志点亮「漏尿」标签，入盆压低尿急线', () => {
  // 漏尿判据走 cooldown.urineLeakWarned（本轮修复的字段名）
  const leakChar = { profile: { base: { stage: '卵泡期' }, metabolism: { urine: 30 }, cooldown: { urineLeakWarned: true } } };
  const leakTags = getCharacterStatusTags(leakChar);
  assert.ok(leakTags.some((tag) => tag.key === 'urine_leak'), '漏尿标签应点亮');
  assert.equal(leakTags.some((tag) => tag.key === 'urine_urgent'), false, '漏尿档不应同时亮尿急');

  // 未入盆（descent < 40）：55 < urgeCap(60) 不亮尿急；入盆（descent >= 40）后 urgeCap 压到 ~54.7 → 55 亮尿急
  const beforeEngage = { profile: { base: { stage: '孕晚期' }, pregnant: { fetuses: [{ descent: 0 }] }, metabolism: { urine: 55 }, cooldown: {} } };
  assert.equal(getCharacterStatusTags(beforeEngage).some((tag) => tag.key === 'urine_urgent'), false);
  const afterEngage = { profile: { base: { stage: '孕晚期' }, pregnant: { fetuses: [{ descent: 80 }] }, metabolism: { urine: 55 }, cooldown: {} } };
  assert.equal(getCharacterStatusTags(afterEngage).some((tag) => tag.key === 'urine_urgent'), true);
});

test('分娩链路：临产分娩产出带稳定 ID 的孩子并进入血缘图', () => {
  const chatState = createEmptyChatState();
  chatState.characters['雪乃'] = {
    name: '雪乃',
    initialized: true,
    profile: {
      base: { stage: '临产期', days: 3, race: '人类', vitality: 100, vitalityLevel: 4, psyStressLevel: 4 },
      pregnant: {
        pregnantDays: 280,
        effectivePregnantDays: 280,
        fetusesCount: 1,
        fetuses: [{ fathers: '凯', race: '龙族x人类', fatherRace: '龙族', gender: '女', embryoType: '胎生', weight: 1, talents: [] }],
      },
      metabolism: { urine: 10, stool: 10, hunger: 10, sleep: 10, milk: 0, libido: 10 },
      cooldown: {},
    },
  };
  const result = applyToolCall(chatState, { name: 'bsChildbirth', arguments: { female: '雪乃' } });
  assert.equal(result.applied, true, result.message);

  const mother = chatState.characters['雪乃'];
  const children = mother.profile.children || [];
  assert.equal(children.length, 1, '分娩应产出孩子记录');
  assert.ok(children[0].id, '孩子必须带稳定 ID（本轮修复）');
  assert.equal(children[0].fatherRace, '龙族');

  const graph = buildLineageGraph(chatState);
  const childNode = graph.nodes.find((node) => node.kind === 'child' && node.name === children[0].name);
  assert.ok(childNode, '血缘图应有孩子节点');
  const edgeTypes = graph.edges.filter((edge) => edge.to === childNode.id).map((edge) => edge.type).sort();
  assert.deepEqual(edgeTypes, ['father', 'mother']);
});
