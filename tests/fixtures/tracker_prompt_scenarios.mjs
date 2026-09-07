import { createDefaultFemaleState, getChatState, getSettings } from '../../scripts/state.js';
import { buildTrackerPayload } from '../../scripts/tracker.js';
import { buildTrackerSystemPrompt } from '../../scripts/tracker_prompt_context.js';
import { getUrineHardCap, getUrineUrgeCap } from '../../scripts/metabolism_config.js';

export const PROMPT_SCENARIOS = [
  { id: 'empty', empty: true },
  { id: 'default' },
  { id: 'diary', diary: true },
  { id: 'wardrobe', wardrobe: true },
  { id: 'psychology', psychology: true },
  { id: 'combined', diary: true, wardrobe: true, psychology: true, stage: '第一产程' },
  { id: 'early', stage: '孕早期' },
  { id: 'late', stage: '孕晚期' },
  { id: 'prodromal', stage: '产兆前驱' },
  { id: 'second_stage', stage: '第二产程' },
  { id: 'postpartum', stage: '产后恢复' },
  { id: 'offscreen', stage: '孕晚期', offscreen: true, wardrobe: true },
  { id: 'immune', immune: true },
  { id: 'priority', priority: true, fullDescriptions: true, raceCatalog: false },
  { id: 'flux', derivedType: '不死-僵尸' },
  { id: 'egg', stage: '孕晚期', embryoType: '卵生' },
  ...['无', '低', '中', '高', '满', '爆'].map((band, index) => ({ id: 'urine_' + index, band, bandIndex: index })),
];

export function buildPromptScenario(scenario) {
  const ctx = { chatId: 'fixture-' + scenario.id, chat: [{ name: 'User', is_user: true, mes: '继续观察。' }],
    name1: 'User', name2: 'Alice', characters: [], extensionSettings: {}, saveSettingsDebounced() {} };
  const settings = getSettings(ctx);
  settings.diaryRecentLimit = scenario.diary ? 3 : 0;
  settings.raceCatalogInPrompt = scenario.raceCatalog !== false;
  settings.requireFullDescriptionUpdates = Boolean(scenario.fullDescriptions);
  const chat = getChatState(ctx, settings);
  if (!scenario.empty) {
    const character = createDefaultFemaleState('Alice'); character.initialized = true;
    const p = character.profile;
    Object.assign(p.base, { stage: scenario.stage || '卵泡期', age: 24, isHere: !scenario.offscreen, derivedType: scenario.derivedType || null });
    p.immune.metabolism = Boolean(scenario.immune);
    if (scenario.stage && scenario.stage !== '产后恢复') {
      p.pregnant.fetuses = [{ fathers: 'Father', race: '人类', weight: 1, embryoType: scenario.embryoType || '胎生', engaged: true, descent: 60 }];
      p.pregnant.fetusesCount = 1;
      p.pregnant.pregnantDays = 240; p.pregnant.effectivePregnantDays = 240;
    }
    if (scenario.wardrobe) p.wardrobe = { enabled: true, items: [{ id: 1, name: 'Dress', slot: 'main', note: '蓝色' }] };
    if (scenario.psychology) p.psychology.stageProfiles = { mens: { mastery: { '0': '测试解释' } } };
    if (scenario.derivedType) p.metabolism.flux = 30;
    const urge = getUrineUrgeCap(p.base.stage, 0);
    const hard = getUrineHardCap(p.base.stage, 0);
    p.metabolism.urine = [0, urge * 0.6, urge * 0.8, urge * 0.95, urge + (hard - urge) * 0.2, hard][scenario.bandIndex ?? 0];
    chat.characters.Alice = character;
  }
  const payload = buildTrackerPayload(ctx, settings);
  if (scenario.priority) payload.priority_character_names = ['Alice'];
  const prompt = buildTrackerSystemPrompt(settings.systemPrompt, settings.registryDescriptionGuides, payload);
  return { ctx, settings, payload, prompt };
}
