import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PROMPT_SCENARIOS, buildPromptScenario } from './fixtures/tracker_prompt_scenarios.mjs';
import { TRACKER_VARIABLE_GUIDE_SECTIONS } from '../scripts/tracker_prompt_sections.js';
import { applyToolCallsResult } from '../scripts/tools.js';

const baseline = JSON.parse(readFileSync(new URL('./fixtures/tracker_prompt_baseline.json', import.meta.url), 'utf8'));
const fields = ['vitalityClass', 'vitalityMinutes', 'urineSense', 'urineSenseStrength', 'urineStressEvent',
  'stoolMeal', 'stoolTags', 'vitalitySugar', 'sweating', 'prolongedPregnancy', 'libidoClass', 'libidoMinutes',
  'fetalPushback', 'morningSicknessResolved', 'urineHolding'];
for (const scenario of PROMPT_SCENARIOS) {
  test('prompt contract: ' + scenario.id, () => {
    const { prompt, payload } = buildPromptScenario(scenario);
    const tools = payload.available_tools.map(tool => tool.name);
    const joint = prompt + '\n' + JSON.stringify(payload.available_tools);
    for (const field of fields) assert.ok(joint.includes(field), scenario.id + ': missing ' + field);
    assert.match(prompt, /\[bsPassedTime 强制规则\]/);
    assert.match(prompt, /"tool_calls"/);
    if (!scenario.empty) assert.match(prompt, /\[逐角色检查清单\]/);
    assert.equal(tools.includes('bsWriteDiary'), payload.diary_enabled);
    assert.equal(prompt.includes('- diary 是角色主观日记'), payload.diary_enabled);
    assert.equal(tools.includes('bsChangeOutfit'), payload.wardrobe_enabled);
    assert.equal(prompt.includes('[wardrobe / outfit]'), payload.wardrobe_enabled);
    assert.equal(tools.includes('bsUpdatePsychology'), payload.breeding_psychology_enabled === true);
    assert.equal(prompt.includes('[psychology]'), payload.breeding_psychology_enabled === true);
    assert.equal(tools.includes('bsRuptureMembranes'), ['产兆前驱', '第一产程', '第二产程'].includes(scenario.stage));
    // An earlier tool in the same response can change pregnancy/child state.
    for (const name of ['bsForceGestation', 'bsPassedTime', 'bsChildbirth', 'bsNameChild', 'bsImplantEmbryo']) assert.ok(tools.includes(name), name);
    const actual = {
      sections: [...prompt.matchAll(/^\[([^\n]+)\]$/gm)].map(match => match[1]),
      tools, systemChars: prompt.length, toolsChars: JSON.stringify(payload.available_tools).length,
      sha256: createHash('sha256').update(joint).digest('hex'),
    };
    assert.deepEqual(actual, baseline[scenario.id]);
  });
}

test('urine guide only shows the current and adjacent bands, including both end bands', () => {
  const bands = ['无', '低', '中', '高', '满', '爆'];
  for (const scenario of PROMPT_SCENARIOS.filter(item => item.band)) {
    const { prompt } = buildPromptScenario(scenario);
    const guide = prompt.split('[urine 按需读取]')[1]?.split('[metabolism.libido')[0] || '';
    const near = guide.split('本档与相邻档——')[1]?.split('。排完')[0] || '';
    for (let index = 0; index < bands.length; index++) assert.equal(near.includes(bands[index] + '（'), Math.abs(index - scenario.bandIndex) <= 1);
  }
});

test('offscreen characters have no urine guide and relevant derived types resolve the flux name', () => {
  assert.doesNotMatch(buildPromptScenario(PROMPT_SCENARIOS.find(s => s.id === 'offscreen')).prompt, /\[urine 按需读取\]/);
  assert.match(buildPromptScenario(PROMPT_SCENARIOS.find(s => s.id === 'flux')).prompt, /flux 分别表示：死气/);
});

test('section IDs are known and unique so a renamed gate cannot silently include a section', () => {
  assert.deepEqual(TRACKER_VARIABLE_GUIDE_SECTIONS.map(section => section.id), [
    'intro', 'structure', 'base', 'pregnant', 'bio', 'experience', 'psychology', 'skills',
    'children', 'diary', 'metabolism', 'libido', 'wardrobe', 'descriptions', 'notify',
  ]);
});

test('metabolism immunity cannot invent a hidden urine reading', () => {
  const { prompt, payload } = buildPromptScenario(PROMPT_SCENARIOS.find(s => s.id === 'immune'));
  assert.equal(payload.existing_state.Alice.profile.metabolism.urine, undefined);
  assert.doesNotMatch(prompt, /\[urine 按需读取\]/);
});

test('one response can force gestation, advance time, deliver and name the newborn', () => {
  const { ctx, payload } = buildPromptScenario(PROMPT_SCENARIOS.find(s => s.id === 'default'));
  const directive = '强制让 Alice 怀上一胎并立刻完成分娩';
  ctx.chat[0].mes = directive;
  const calls = [
    { name: 'bsForceGestation', arguments: { female: 'Alice', userDirective: directive, equivalentDays: 270, fetusCount: 1, father: 'Father' } },
    { name: 'bsPassedTime', arguments: { minute: 1 } },
    { name: 'bsChildbirth', arguments: { female: 'Alice' } },
    { name: 'bsNameChild', arguments: { female: 'Alice', childIndex: 0, name: 'Child' } },
  ];
  assert.ok(calls.every(call => payload.available_tools.some(tool => tool.name === call.name)));
  const { chatState, logs } = applyToolCallsResult(ctx, { tool_calls: calls });
  assert.ok(logs.every(log => log.applied), JSON.stringify(logs));
  assert.equal(chatState.characters.Alice.profile.children[0].name, 'Child');
});
