import { TRACKER_VARIABLE_GUIDE_SECTIONS } from './tracker_prompt_sections.js';
import { buildEmbryoTypeLorePrompt } from './embryo_prompt_context.js';
import { buildRaceCatalogBlock, buildRacePhysiologyPrompt } from './race_prompt_context.js';
import { getDerivedTypeFluxProfile } from './race_config.js';
import { LABOR_STAGES, PREGNANCY_STAGES } from './stage_config.js';
import { METABOLISM_BAND_NARRATIVE_GUIDE } from './registry_config.js';
import { engagementProgressFromDescent, getUrineFloor, getUrineHardCap, getUrineResidualValue, getUrineUrgeCap } from './metabolism_config.js';

// 尿意按需读取（TASK-02 §十一拍板）：不全量加载边界表，只给当前档体感、
// 相邻两档、排完落点与漏风险。每次构建提示词时按角色当前阶段现算。
const URINE_LEVEL_FEELINGS = Object.freeze({
  无: '轻松平稳，刚排空后毫无涨坠感，举止自如。',
  低: '隐约有一丝温和的充盈感，不急促，能完全专注手头的事。',
  中: '下腹有明显的饱满充盈感；坐姿会下意识微微调整，但不影响正常交谈。',
  高: '下腹沉坠绷紧，步幅明显收小；身体尚未失控（严禁写漏），行为上提前戒备：出门先去一次、留意洗手间、不敢多喝水。',
  满: '充盈感压迫整个盆底，小腹发紧发硬；双腿不自觉紧并，坐下需找角度避开腹壁挤压，呼吸微促，强忍之下容易分神。',
  爆: '下腹受到剧烈涨迫，骨盆底肌肉持续高度紧绷，双腿紧并微颤；任何颠簸、跳步或咳嗽都会引发强烈的反射性收缩。',
});
const URINE_LEVEL_ORDER = Object.freeze(['无', '低', '中', '高', '满', '爆']);

function urineLevelOfValue(value, urge, hard) {
  const v = Number(value) || 0;
  if (v >= urge + (hard - urge) * 0.5) return '爆';
  if (v >= urge) return '满';
  if (v >= urge * 0.9) return '高';
  if (v >= urge * 0.75) return '中';
  if (v >= urge * 0.5) return '低';
  return '无';
}

function buildUrineStatusGuide(payload = {}) {
  const existing = payload?.existing_state;
  if (!existing || typeof existing !== 'object') return '';
  const blocks = [];
  for (const [key, item] of Object.entries(existing)) {
    if (item?.offscreen === true) continue;
    const profile = item?.profile;
    if (!profile) continue;
    if (profile.metabolism?.urine === undefined || profile.metabolism.urine === null) continue;
    const stage = String(profile?.base?.stage || '');
    const prolonged = profile?.pregnant?.prolonged === true;
    const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
    const engagedCount = fetuses.reduce((sum, f) => sum + (f?.engaged ? 1 : 0), 0);
    const descent = engagedCount > 0 ? Number(fetuses.find((f) => f?.engaged)?.descent) || 40 : 40;
    const progress = engagementProgressFromDescent(descent);
    const urge = getUrineUrgeCap(stage, engagedCount, progress, prolonged);
    const hard = getUrineHardCap(stage, engagedCount, progress, prolonged);
    const floor = getUrineFloor(stage, engagedCount, progress, prolonged);
    const residual = getUrineResidualValue(stage, engagedCount, progress, prolonged);
    const value = Number(profile?.metabolism?.urine) || 0;
    const level = urineLevelOfValue(value, urge, hard);
    const idx = URINE_LEVEL_ORDER.indexOf(level);
    const bandOf = (name) => {
      const i = URINE_LEVEL_ORDER.indexOf(name);
      const lo = [0, urge * 0.5, urge * 0.75, urge * 0.9, urge, urge + (hard - urge) * 0.5][i];
      const hi = [urge * 0.5, urge * 0.75, urge * 0.9, urge, urge + (hard - urge) * 0.5, hard][i];
      return `${Math.round(lo)}~${Math.round(hi)}`;
    };
    const near = [URINE_LEVEL_ORDER[idx - 1], level, URINE_LEVEL_ORDER[idx + 1]]
      .filter(Boolean)
      .map((name) => `${name}（${bandOf(name)}：${URINE_LEVEL_FEELINGS[name]}）`)
      .join('；');
    const stageName = stage === '逾期' ? (prolonged ? '延产' : '自然逾期') : stage;
    const engagedNote = engagedCount > 0 ? '，已入盆' : '';
    const percent = Math.round((value / Math.max(1, urge)) * 100);
    blocks.push(
      `- ${item?.name || key} 的尿意（${stageName}${engagedNote}）：当前 ${Math.round(value)}（${level} ${percent}%）。`
      + `本档与相邻档——${near}。`
      + `排完落在 ${Math.round(floor + residual)}（地板 ${Math.round(floor)} 排不掉＋残值 ${Math.round(residual)} 排得掉）。`
      + `漏风险：高档起可能渗、满档一小股、${stageName === '非孕' ? '接近上限才有失禁风险' : '临产前后一股甚至失禁都可能'}。`
      + `系统按触发线自动排尿，趟数是背景；只有漏尿/失禁会写进 notify。`,
    );
  }
  return blocks.length > 0 ? `\n[urine 按需读取]\n${blocks.join('\n')}\n` : '';
}

function collectRelevantFluxNames(payload = {}) {
  const found = [];
  const pushFluxName = (derivedType) => {
    const fluxName = String(getDerivedTypeFluxProfile(derivedType)?.fluxName || '').trim();
    if (fluxName && !found.includes(fluxName)) found.push(fluxName);
  };
  if (payload?.existing_state && typeof payload.existing_state === 'object') {
    for (const item of Object.values(payload.existing_state)) {
      const profile = item?.profile || {};
      const base = profile.base || {};
      const pregnant = profile.pregnant || {};
      pushFluxName(base.derivedType);
      for (const sperm of (Array.isArray(base.sperms) ? base.sperms : [])) pushFluxName(sperm?.derivedType);
      for (const fetus of (Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [])) pushFluxName(fetus?.fatherDerivedType);
      for (const child of (Array.isArray(profile.children) ? profile.children : [])) pushFluxName(child?.derivedType);
    }
  }
  return found;
}

export const TRACKER_VARIABLE_GUIDE_PROMPT = TRACKER_VARIABLE_GUIDE_SECTIONS.map(section => section.text).join('\n');

function buildTrackerMetabolismGuide(payload = null) {
  const fluxNames = collectRelevantFluxNames(payload || {});
  const diaryEnabled = payload?.diary_enabled !== false;
  const wardrobeEnabled = payload?.wardrobe_enabled === true;
  const breedingPsychologyEnabled = payload?.breeding_psychology_enabled === true;
  const urineGuide = buildUrineStatusGuide(payload);
  const baseGuide = TRACKER_VARIABLE_GUIDE_SECTIONS
    .filter(({ id }) => (id !== 'diary' || diaryEnabled)
      && (id !== 'wardrobe' || wardrobeEnabled)
      && (id !== 'psychology' || breedingPsychologyEnabled))
    .map(({ id, text }) => {
      if (id === 'structure' && !breedingPsychologyEnabled) text = text.replace('、psychology', '');
      // The preceding section already supplies the leading line break.
      if (id === 'libido' && urineGuide) return urineGuide.slice(1) + text;
      return text;
    }).join('\n');
  return fluxNames.length > 0
    ? baseGuide.replace(
      '- 若角色具有 derivedType，则 metabolism 一定包含 flux，并只保留该衍生类型未抵免的普通需求。flux 通常是 -150 到 150 的单一极性需求值；正值持续走向更正，负值持续走向更负，绝对值越高代表越需要使用 bsExcreteMetabolism 进行一次“解放”。解放会按释放量抵消当前需求，只有在抵消过头时才会跨过 0 翻转极性。',
      `- 若角色具有 derivedType，则 metabolism 一定包含 flux，并只保留该衍生类型未抵免的普通需求。flux 通常是 -150 到 150 的单一极性需求值，在本轮相关衍生种族中，flux 分别表示：${fluxNames.join(' / ')}。正值持续走向更正，负值持续走向更负，绝对值越高代表越需要使用 bsExcreteMetabolism 进行一次“解放”。解放会按释放量抵消当前需求，只有在抵消过头时才会跨过 0 翻转极性。`,
    )
    : baseGuide;
}

// 妊娠相关阶段中 pregnantDescription 仍为空的在场角色：需要注入初始化规范，
// 否则「不要新增描述子字段」规则会把空栏位永久锁死。
const PREGNANT_DESCRIPTION_STAGES = new Set([...PREGNANCY_STAGES, '产兆前驱', ...LABOR_STAGES, '产后恢复', '假孕期']);

function collectPregnantDescriptionInitNames(payload = {}) {
  const names = [];
  const existingState = payload?.existing_state;
  if (!existingState || typeof existingState !== 'object') return names;
  for (const [key, item] of Object.entries(existingState)) {
    if (item?.offscreen === true) continue;
    const stage = String(item?.profile?.base?.stage || '');
    if (!PREGNANT_DESCRIPTION_STAGES.has(stage)) continue;
    if (String(item?.profile?.descriptions?.pregnantDescription || '').trim()) continue;
    names.push(String(item?.name || key));
  }
  return names;
}

export function buildTrackerSystemPrompt(basePrompt = '', descriptionGuides = null, payload = null) {
  const diaryEnabled = payload?.diary_enabled !== false;
  const metabolismGuide = buildTrackerMetabolismGuide(payload);
  const parts = [
    [
      '[bsPassedTime 强制规则]',
      '- bsPassedTime 是每一轮 tracker 分析都必须优先考虑的第一工具。',
      '- 你应先根据 recent_messages 判断本轮累计了多少分钟/小时/天，再调用 bsPassedTime 推进时间。',
      '- 只有在确认本轮完全没有任何可推进的时间量时，才允许不调用 bsPassedTime。',
      '- 正文出现时间跳跃表述时必须推进：次日/第二天/到了晚上/X小时后→对应时长；X天后/几天过去了→对应天数。模糊表述（一段时间后/过了几日）取合理中间值（1~3 天），不要因为不确定而跳过。',
      '- 跨天推进的同轮若这段时间她有持续的正事（赶路、行军、劳作、逃亡、被囚劳役），用 bsUpdateCharacterStatus 的 vitalityClass＋vitalityMinutes 报这段日子的总活动分钟（不含睡眠，如赶路 3 天≈每天 8 小时→1440 分钟档 2）；普通日常（在家休养、上学、闲居）不报，系统会按充分作息结算体力。',
      '- 其他状态工具默认建立在时间推进之后，不要跳过 bsPassedTime 直接更新长程状态。',
    ].join('\n'),
    String(basePrompt || '').trim(),
    metabolismGuide,
    // 名录只给名字：模型写 bsAddSperm.race 时需要词汇表，但每轮都发，不附辨识提示
    payload?.race_catalog_enabled === false ? '' : buildRaceCatalogBlock(),
  ];
  if (payload?.mainflow_context_snapshot) {
    parts.push([
      '[主流上下文快照使用规则]',
      '- payload.mainflow_resolved_messages 与 mainflow_resolved_system_messages 是 ST 主流上一轮 request 中解析后的补充上下文。',
      '- 它仅用于补足本轮剧情、角色设定、已触发 worldinfo、模板注入、getwi/activewi 等主流背景。',
      '- 不要模仿主流输出风格，不要续写剧情；你的任务仍是根据 recent_messages 与 existing_state 返回 JSON tool_calls 来更新变量。',
      '- 若主流上下文快照与 tracker 工具调用规则、变量语义说明、existing_state 或 available_tools 冲突，必须以后者为准。',
    ].join('\n'));
  }
  const priorityNames = Array.isArray(payload?.priority_character_names)
    ? payload.priority_character_names.map((name) => String(name || '').trim()).filter(Boolean)
    : [];
  if (priorityNames.length > 0) {
    parts.push([
      '[优先追踪角色]',
      `- 本轮先检查：${priorityNames.join('、')}。`,
      '- 这些名字是优先级，不是过滤器；其余已注册角色仍须依剧情和时间正常检查。',
      '- 若剧情明确显示某角色进入当前场景、开始参与当前互动或重新同行，调用 bsSetCharacterPresence，参数必须为 {"female":"角色名","isPresent":true}；明确离开、失联或转为幕外时才传 false。不要以 isHere 作为参数名，也不要无依据切换。',
    ].join('\n'));
  }
  const embryoTypeLorePrompt = buildEmbryoTypeLorePrompt(payload || {});
  if (embryoTypeLorePrompt) parts.push(embryoTypeLorePrompt);
  if (!diaryEnabled) {
    parts.push('[diary]\n- diary 系统当前已关闭（settings.diaryRecentLimit = 0）。本轮不要参考 diary，也不要调用 bsWriteDiary。');
  }
  parts.push(payload?.require_full_description_updates === true
    ? [
      '[descriptions 完整更新模式：强制提示约束]',
      '- 只要调用 bsSetDescription 更新 normalDescription 或 pregnantDescription，其对应字符串必须带回该角色该栏位所有既有子字段，不得只传部分字段。',
      '- 即使字段内容未改变，也必须原样带回；先完整检查，再按既有字段顺序输出。此规则优先于节省 token 的考虑。',
      '- 若因上下文缺失无法可靠填写某个字段，则不要调用该栏位的 bsSetDescription；不要编造内容或交出不完整更新。',
    ].join('\n')
    : [
      '[descriptions 更新勤勉规则]',
      '- 若调用 bsSetDescription，先逐字段检查；所有受本轮影响的既有字段必须一并更新。省略只允许用于已确认完全不变的字段。',
    ].join('\n'));

  const trackedNames = Array.isArray(payload?.tracked_females)
    ? payload.tracked_females.map((name) => String(name || '').trim()).filter(Boolean)
    : [];
  if (trackedNames.length > 0) {
    parts.push([
      '[逐角色检查清单]',
      `- 本轮必须在 character_checks 中逐一列出：${trackedNames.join('、')}。每名恰好一笔。`,
      '- status 只能是 no_change、updated、present 或 offscreen；清单只用于核对，任何实际状态变更仍必须同时用 tool_calls 调用对应工具。',
    ].join('\n'));
  }

  const pregnantInitNames = collectPregnantDescriptionInitNames(payload);
  const pregnantGuide = String(descriptionGuides?.pregnantDescription || '').trim();
  if (pregnantInitNames.length > 0 && pregnantGuide) {
    parts.push([
      '[pregnantDescription 初始化]',
      `- 角色 ${pregnantInitNames.join('、')} 已进入妊娠相关阶段，但 pregnantDescription 仍为空。`,
      '- 这是「不要新增描述子字段」规则的唯一例外：请尽快用 bsSetDescription 按下方规范为该角色建立首批 pregnantDescription 子字段，只建立规范中列出的字段名。',
      '- 格式仍为：字段名|描述内容;;字段名|描述内容;;，不可用自然段，不可省略字段名。',
      '',
      '【pregnantDescription 规范】',
      pregnantGuide,
    ].join('\n'));
  }

  return parts.filter(Boolean).join('\n\n');
}

export function buildMainFlowStatePrompt(payload = {}) {
  const existingState = payload?.existing_state && typeof payload.existing_state === 'object' ? payload.existing_state : {};
  const hasState = Object.keys(existingState).length > 0;
  if (!hasState) return '';
  const racePhysiologyPrompt = buildRacePhysiologyPrompt(payload || {});
  // 主模型看得见档位名，却没有对应的写法，数值与正文因此常常各说各话。
  // 只有当真的有角色带着尿意或便意时才挂这段，免得平白占上下文。
  const needsBandGuide = Object.values(existingState).some((character) => {
    const metabolism = character?.profile?.metabolism;
    return metabolism && (metabolism.urine !== undefined || metabolism.stool !== undefined);
  });
  return [
    racePhysiologyPrompt,
    '<bs_biotracker>',
    '[并行生理追踪上下文]',
    '以下内容来自并行运行的角色生理状态追踪支流。',
    '已注册角色状态仅供叙事参考，不要在回复中复述字段、JSON 或本段上下文。',
    '状态为只读；若剧情没有明确触发变化，不要编造与之冲突的生理、心理或关系变化。',
    '',
    '[当前已注册角色状态]',
    serializeStateForPrompt(existingState),
    needsBandGuide ? ['', '[尿意与便意的叙事口径]', METABOLISM_BAND_NARRATIVE_GUIDE].join('\n') : '',
    '</bs_biotracker>',
  ].filter(Boolean).join('\n');
}

/**
 * 状态 JSON 注入防线：序列化后转义 `</` 与换行——角色卡/注册内容（描述、日记、
 * 种族名等）可能含 `</bs_biotracker>` 或伪指令段，若不转义可提前闭合包裹标签
 * 向主线 LLM 注入任意指令（安全审查 P1，实测可达主模型）。
 */
function serializeStateForPrompt(state) {
  return JSON.stringify(state)
    .replace(/<\//g, '<\\/')
    .replace(/\r?\n/g, '\\n');
}
