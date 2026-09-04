import { PSY_MENS_FIELDS, PSY_PREG_FIELDS } from './registry_psy_config.js';
import { buildEmbryoTypeLorePrompt } from './embryo_prompt_context.js';
import { buildRaceCatalogBlock, buildRacePhysiologyPrompt } from './race_prompt_context.js';
import { getDerivedTypeFluxProfile } from './race_config.js';
import { LABOR_STAGES, PREGNANCY_STAGES } from './stage_config.js';
import { METABOLISM_BAND_NARRATIVE_GUIDE } from './registry_config.js';
import { engagementProgressFromDescent, getUrineFloor, getUrineHardCap, getUrineResidualValue, getUrineUrgeCap } from './metabolism_config.js';

// 尿意按需读取（TASK-02 §十一拍板）：不全量加载边界表，只给当前档体感、
// 相邻两档、排完落点与漏风险。每次构建提示词时按角色当前阶段现算。
const URINE_LEVEL_FEELINGS = Object.freeze({
  无: '空的，刚去过，不胀不坠',
  低: '知道有一点，不急，能忘掉',
  中: '明显想去，还能忍，注意力开始被扯',
  高: '真的急，做事会顿，并腿、小腹紧',
  满: '该去了，再不去要出事',
  爆: '收不住，还没崩，但随时会崩',
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

export const TRACKER_VARIABLE_GUIDE_PROMPT = [
  '以下是角色状态变量的语义说明，供你理解 existing_state 中的字段，不是要求你原样输出这些字段。',
  '',
  '[总结构]',
  '- skill_catalog 是当前聊天的全局技能图鉴；每项包含稳定 id、技能名 name 与唯一描述 description。角色、胎儿、孩子只用 skillId 引用它。',
  '- 每个角色结构为 name / initialized / profile。',
  '- profile 主要包含 base、pregnant、experience、psychology、skills、talents、children、metabolism、descriptions、diary、notify，必要时也会附带部分 bio 字段。',
  '- bio 与 immune 大多属于内部运行参数，tracker 默认不会完整发给你；但与剧情表达直接相关的少数 bio 字段可以发送。',
  '- 若角色具有 immune.metabolism=true，则 metabolism 只保留 libido 一项，其余需求不会发给你，因为该角色不受代谢累积影响；但她照样会起来，性欲仍需照常表达。',
  '- 若角色带有 offscreen=true，表示该角色当前不在场，existing_state 只提供精简状态，不代表角色不存在。',
  '',
  '[base]',
  '- isHere: 是否在场。false 时角色仍会随时间推进，但幕外角色只发送少量状态给你。',
  '- stage: 当前阶段。可能是月经阶段、妊娠阶段、假孕期、产兆前驱、第一/第二/第三产程、产后恢复、无经期、未激活。',
  '- days: 当前阶段已经过了多少天，使用 0 起算的 elapsed/progress 语义；进入新阶段时为 0，超过该阶段上限后才切换下一阶段。',
  '- fertilizationDays: 受精后、着床前已经过的天数；着床等待期以 6 天为基础，并随角色实际月经周期长度等比缩放。',
  '- latestSexDays: 距最近一次性行为经过的天数；超过一个周期后通常会失效。',
  '- age: 角色年龄，单位为年。',
  '- race: 当前保存的种族字符串，可能带子类或混血，不再带 [derived] 前缀。',
  '- derivedType: 衍生类型字符串，如 不死-僵尸；没有则为 null。',
  '- sperms: 体内残留精液来源列表。',
  '- sperms[*].male: 精液来源对象名称。',
  '- sperms[*].race: 该来源的父方种族字符串，已去除 [derived] 前缀，用于受精与混血计算。',
  '- sperms[*].derivedType: 该来源的父方衍生类型；没有则为 null。',
  '- sperms[*].value: 当前残留量，用于多父竞争与受精判定。',
  '- eggs: 当前可受精卵子数。',
  '- uterinePressure: 宫压，越高越接近妊娠风险或分娩。',
  '- vitality: 体力。存量资源条：读数是余量，不是此刻状态——同一个 40%，躺着没事、爬楼就现形。只在睡觉与进食时回复，做事只扣不加。',
  '- 体力五档（按当前值占体质上限的百分比）：充沛（≥80%）身体没有存在感，连续折腾一下午顶多热和兴奋不是累，余量厚接得住熬夜爬山；倦意（50~79%）累是事后才到的，做事时不觉得停下来才涌上来，会自己找地方坐靠着缓；吃力（25~49%）动作开始变形上楼扶栏杆蹲下起来要撑膝盖说话句子变短哈欠变多眼皮沉，她知道撑不太住了但压得住问就是没事；脱力（<25%）身体不听使唤手抖腿软说话断句蹲下去起不来猛起身眼前发黑做任何动作之前要先下一个决心汗是冷的，能躺着绝不坐着；耗竭（≤8%）意识比身体先散间歇里说不出整句叫她要叫两声眼睛对不上焦半昏沉里只剩身体本能还在动没有自主行为只剩本能反应。',
  '- 体力档位是油量不是此刻状态：同一个 40%，躺着看电视没事，爬三层楼就现形。读数是余量，她做多大动作撑不撑得住由你按动作跟余量对照着演。',
  '- psyStress: 情压/精神压力。',
  '- vitalityLevel / psyStressLevel: 个体等级，决定对应数值上限与体质倾向。',
  '- vitalityLevelText / psyStressLevelText: 系统额外附带的等级文字说明，方便直接理解体质与精神倾向。',
  '',
  '[pregnant]',
  '- pregnant 只会在已有 fetuses、妊娠阶段、产兆前驱/产程、产后恢复或假孕期发送；幕外角色发送时只保留少量 pregnant 摘要，并用 fetusesCount 表示胎儿数量。',
  '- pregnantDays: 这次妊娠的孕龄天数，等同产科从末次月经/本族等价周期起点计算的孕周天数。',
  '- effectivePregnantDays: 真正计入胎儿发育与阶段推进的有效孕龄天数；当妊娠被冻结时，它可以停在原地而 pregnantDays 继续增加。',
  '- laborHours / effectiveLaborHours / laborPhase / laborFetusIndex / laborPain 仅在产兆前驱或正式产程期间发送；产后恢复不再表示分娩疼痛。',
  '- laborHours: 当前产程内部阶段已消耗的实际时长。',
  '- effectiveLaborHours: 真正推动当前产程内部阶段前进的有效时长。',
  '- laborPhase: 当前产程内部阶段。第一产程为潜伏期/活跃期/过渡期；第二产程为胎体下降/胎体娩出/间歇期；第三产程为供养器官娩出/产后观察。',
  '- laborFetusIndex: 第二产程当前处理的胎次，从 1 起算；其他阶段通常为 0。',
  '- laborPain: 当前分娩疼痛程度，范围 0-10。描写疼痛反应不得明显超过此等级；刚进入第一产程时不应写成已达到极限痛苦。',
  '- amnionDurability: 母体层的膜耐性；过低代表接近或已经破水。',
  '- nutrition: 妊娠供养力盈余/赤字。正值代表供养充足，负值代表供养亏空；每周会参与胎儿体重结算。',
  '- symptomReliefPending: 尚待透过母体安抚胎儿处理的妊娠不适次数；direction=maternal 的普通母胎互动成功时可消耗一次，其随机 affinity 结果为轻微变化时补回 1 点供养力，显著变化时补回 2 点供养力。',
  '- bsMaternalFetalInteraction 的 direction=fetal 表示胎儿对母体的亲近或排斥，须传 change 来改变 affinity，且不会补充供养力；direction=maternal 表示母体安抚胎儿，不传 change，系统会随机决定 affinity 变化，成功时也可依变化强度回补待安抚供养力，产兆前驱时用于分娩抵抗。每名角色每个新小时仅能成功生效一次。',
  '- fetuses: 胎儿列表。',
  '- fetuses[*].fathers: 父方对象名称。',
  '- fetuses[*].provider: 胚胎真正的归属方（代孕委托者、虫母等），自然受孕为 null。单一 provider 的孩子分娩后自动转交；多母源嵌合体以 × 显示并留在孕母名下。要建立外源受精卵请用 bsImplantEmbryo，不要自行编造。',
  '- fetuses[*].providerSources: 可接收孩子的母源名单。多于一位时孩子默认登记在孕母名下，之后可手动转移给其中一位。',
  '- fetuses[*].chimera: 受精卵早期融合的嵌合资料，包含来源数量、父源、母源与融合前性别。没有融合时不出现。',
  '- fetuses[*].fatherRace: 父方种族字符串，已去除 [derived] 前缀，用于理解父源与 fatherDerivedType。',
  '- fetuses[*].fatherDerivedType: 父方衍生类型；若没有则为 null。',
  '- fetuses[*].gender: 胎儿性别。',
  '- fetuses[*].embryoType: 胚胎型态，如 胎生、卵生、卵胎生、胎转卵生、不定型。',
  '- fetuses[*].weight: 胎重系数，標準1.0，范围0.33~3.0。影响妊娠负担、分娩难度与恢复期。',
  '- fetuses[*].tendencyAngle: 胎位倾向角度，影响孕期/产兆前驱中的调位，以及第二产程胎体下降/娩出的难度；角度映射固定为 0/360=正常头位/正位，180=完全臀位/倒位，90或270=横位，禁止反写；不会阻止第一产程进入第二产程。若 notify 发出难产警示，应优先考虑 bsChildbirth 手术产。',
  '- fetuses[*].tendencyAngleText: 系统额外附带的胎位文字说明，如 正位(头位)/倒位(臀位)/横位/斜位。',
  '- fetuses[*].engaged: 该胎是否已入盆（胎头下降压住膀胱与直肠）。由系统在临产期/逾期按胎位与体重占比自行判定，臀位与横位不会入盆；这是只读参考，不要在 profile 补丁里改写。多胎可能只有一胎入盆，另一胎仍在上面。入盆会压缩膀胱容量并加重便意阻力。',
  '- fetuses[*].affinity: 母胎之間的親密度，也会参与 derivedType 进展。',
  '- fetuses[*].maternalDerivedTypeProgress: 与母体(正)/父源(負)衍生同化的进度，范围 -100 到 100。',
  '- fetuses[*].talents: 胎儿承接的天赋，只含 skillId、带正负号的 level 与 exp；只能由孕体角色的 bsTrainSkill 在允许阶段自动改变。',
  '',
  '[bio]',
  '- bio 只会发送少量允许暴露给 LLM 的字段，不代表完整内部参数表。',
  '- gestationModifierMultiplier: 妊娠速度倍率。1 为正常，大于 1 为加速，小于 1 为减速；若为 0，则代表胎儿发育冻结。',
  '- gestationModifierName: 当前妊娠速度修正效果的名称，例如祝福、诅咒、体质、术式。',
  '- gestationModifierDescription: 对该妊娠速度修正来源与表现的简短说明。',
  '- 若 gestationModifierName 是使用者下达的妊娠锁定或分娩循环效果，其回退由系统在分娩时自动完成：',
  '  不要因为「她刚生完却又怀着」而调用 bsForceGestation 或 bsSetGestationLock 去修正状态，也不要以为状态出错。',
  '  这类强制令工具只在使用者本人当轮发言里明确下达时才可调用。',
  '',
  '[experience]',
  '- 记录第一次对象、最近对象、情感/婚姻对象，以及怀孕、分娩、流产等经历次数。',
  '- 这类字段偏长期记录，通常只在剧情明确成立时才需要更新。',
  '',
  '[psychology]',
  '- psychology 分为 mens (常规/生理) 与 preg (妊娠相关) 两大组心理指数。',
  ...Object.entries(PSY_MENS_FIELDS).map(([k, v]) => `- [mens] ${k} (0-100+): ${v.definition}`),
  ...Object.entries(PSY_PREG_FIELDS).map(([k, v]) => `- [preg] ${k} (0-100+): ${v.definition}`),
  '- 非怀孕时主要看 psychology.mens；怀孕、假孕、产兆前驱、产程时主要看 psychology.preg。',
  '- 心理阶段从 0 到 100+。若要调用 bsUpdatePsychology，数值参数表示变化量(delta)而不是目标值；例如当前 78 传 2 会变成 80，不是设为 2。建议尽量做小幅变化；单次以 ±1 到 ±3 为宜，±5 已属于大改。每名角色在每个新小时内仅允许一次成功心理变化，下一小时前不要重复调用。',
  '- 每个心理项由 *_value 和 *_interpret 组成。*_value 是 0-100 数值本体，*_interpret 是系统对应生成的心理解释。',
  '- psychology.mens 另外包含 isChaste (是否当前保持贞洁)、hasContraception (是否有避孕措施) 两个事件旗标。',
  '- psychology.preg 另外包含 knowsFatherSource (是否知晓父源)、hasProfessionalPrenatalCare (是否接受专业产检) 两个事件旗标。',
  '',
  '[skills / talents]',
  '- skills 是角色后天技能列表；每项为 {skillId, level, exp}。技能从 Lv1 觉醒，最高 Lv10，只进不退。',
  '- skillHistory 是系统自动保存的最近技能觉醒／升等事件，只供参考，不得由工具修改。一次跨多级只会有一条 fromLevel→toLevel 记录。',
  '- talents 是角色先天天赋列表；每项为 {skillId, level, exp}。level 正数表示擅长、负数表示苦手、0 表示尚未形成；exp 同样带方向，反向经验会逐级削弱并能跨过 0 逆转，最高 ±Lv5。角色 talents 对所有 LLM 工具都是只读资料，只能由用户通过外部注册／技能／变量界面调整。',
  '- 技能与天赋共用经验曲线 requiredExp(level)=100*level*level；技能 Lv1→2 要 100、Lv2→3 要 400。天赋 Lv0→±Lv1 固定要 100，之后按当前绝对等级使用同一曲线。',
  '- 只有 recent_messages 明确出现相关事件、练习、实战运用、教学或领悟时，才调用 bsTrainSkill；不得仅凭“角色可能擅长”增加。',
  '- skillExp 由你直接给非负整数，并综合事件成果、当前技能等级、本级需求及同名天赋判断。正天赋通常让同等事件更容易获得较多技能经验，负天赋通常较少；系统不会再次套倍率。',
  '- 严禁尝试传入 talentExp 或用任何工具修改角色自己的 talents。只有系统在允许孕期阶段执行技能锻炼时，才能依亲和度自动改变 fetuses[*].talents。',
  '- 新技能必须先调用 bsRegisterSkillDefinition，以 name+description 登记到 skill_catalog；先检查既有定义，禁止制造同义重复。随后才能用精确名称调用 bsTrainSkill，并在剧情确实触发觉醒时传 awaken=true。',
  '- 孕中期、孕晚期、临产期、逾期、产兆前驱、第一产程调用 bsTrainSkill 时，系统每次只随机选择一胎，将本次 skillExp 依该胎 affinity 自动传为天赋经验：skillExp*abs(affinity)/50，正亲和为擅长、负亲和为苦手、0 不传。第二与第三产程禁止传递。',
  '- 胎儿与孩子只有 talents，没有 skills。分娩时 talents 原样进入 children；日后注册孩子角色时，由用户在注册第五子页参考并载入，不会只凭同名自动继承。',
  '',
  '[children]',
  '- 已出生孩子列表。代孕／寄生所生的孩子会转交给 provider 指向的角色；该角色尚未注册时，孩子留在承载者名下并保留 children[*].provider 标记。',
  '- children[*].name: 孩子姓名。',
  '- children[*].fathers: 父方对象名称。',
  '- children[*].gender: 孩子性别。',
  '- children[*].race: 孩子种族。',
  '- children[*].derivedType: 孩子继承到的衍生类型；没有则为 null。',
  '- children[*].age: 孩子年龄，单位为年，会随时间推进。',
  '- children[*].talents: 从胎儿阶段保留下来的天赋；注册该孩子时供用户在注册技能页参考载入。',
  '',
  '[diary]',
  '- diary 是角色主观日记，保存为数组；existing_state 中只会发送最近几笔，前端完整变量仍会保留全量。',
  '- diary[*].time: 角色日记中的日期标题，不是具体钟点；应填写故事内日期、年月日、某日/第几天等日期性标题。不要填 HH:mm、午後 这类时刻；若只有时刻信息，请结合上下文写成“今日”“雨夜当日”“第 X 日”等日期标题。',
  '- diary[*].content: 角色事后写下的主观日记，可包含心境、记忆、误解、愿望、秘密或身体感受；它不是即时心声/旁白，也不是客观状态，不能覆盖数值事实。',
  '- diary 有 24 小时冷却；同一角色在同一个故事日内最多只能写一篇。若当天已经写过，必须跳过 bsWriteDiary。',
  '- 通常只有 bsPassedTime 跨日后才调用 bsWriteDiary，并优先写“昨日/前一日/上一天”的回顾。若剧情发生重大事件或 notify 提醒，也应写成事后补记的语气，不要像当下即时独白。',
  '- 角色不在场也可以写日记；可根据角色性格、处境与已知生活状态补足合理的日常幕外感受，但不要把未经剧情支持的重大事件写成既成事实，也不要用日记改写客观状态。',
  '',
  '[metabolism]',
  '- 普通种族使用 urine / stool / hunger / sleep / milk / libido，分别对应尿意、便意、饿意、困意、乳意、性欲。前五项是数字，libido 是一个只读视图对象。',
  '- urine 与 stool 是两条独立的需求，孕期修正方向相反：尿意的产量随孕周上升，同时膀胱容量被子宫压缩（入盆后压到最紧），所以趟数极多、憋耐极短；便意则因肠蠕动变慢而攒得更久，且「信号来了不等于排得出」。',
  '- 若角色具有 derivedType，则 metabolism 一定包含 flux，并只保留该衍生类型未抵免的普通需求。flux 通常是 -150 到 150 的单一极性需求值；正值持续走向更正，负值持续走向更负，绝对值越高代表越需要使用 bsExcreteMetabolism 进行一次“解放”。解放会按释放量抵消当前需求，只有在抵消过头时才会跨过 0 翻转极性。',
  '- urine 与 stool 都会在活力增加时累积；以 bsExcreteMetabolism 处理 hunger（进食）会同时增加尿意与便意（胃结肠反射对便意尤其明显）与少量困意，处理 sleep（睡眠）会增加少量饿意。milk 代表乳意：普通周期中为乳房胀敏或周期不适，黄体期随时间累积到经前最胀、月经一来就缓解，排卵期是整个周期的谷底（推动乳房胀的黄体素只在排卵之后才升）；妊娠、假孕或产后恢复时则也涵盖乳胀与泌乳需求。',
  '- 排解尿意在孕晚期与入盆后无法排空，系统会自动留下残值，不必也不应把 urine 强行归零；这是「膀胱被压着排不干净」，不是工具失效。',
  '- 乳意读的是「满了几成」（存量÷当前容量），不是毫升数：容量随孕周从开奶周起往上长，所以早期顶满与足月顶满都会走到最难受那一档——胀、硬、发烫、跟着心跳跳着疼在任何阶段都可能走完。溢出来什么样则是另一回事，由系统按档位与发育判定（干在原地／渗一点点／往外走／喷出去），早期物理上出不来多少，不要因为她很胀就写成喷出去。',
  '- 乳意有三样只读状态，都由系统推进，不要自行宣布：milk.duct 是乳头口通着还是结痂（结痂时自发溢出为 0，但里面照涨、照胀，抠掉或冲开才恢复通着）；milk.blockHours 是在高位待了多久；到最后一格就是堵住——局部硬块、碰不得、越挤越出不来，这一格 bsExcreteMetabolism 排不掉。',
  '- 乳意的档位（闸）在建卡时定，记在 bio.milkGate（紧／中／松／全开），之后不随行为改变，也跟罩杯无关。它只改产量、单次挤出、自发溢出阈值、会不会喷，不改容量。体质档记在 bio.milkConstitution（多奶／普通／少奶）：多奶=乳腺发育全程领先（开奶早一周、足月产量高四分之一），少奶反过来；容量和挤出不改——多奶是产得多不是容器大。排乳时不传 options.milk 就按存量函数扣（min(档位挤出上限, 存量×七成)），不必自己算数。',
  '- 排解便意不是减法而是一次检定：只要传了 options.stool 就视为一次尝试，成功则清空信号，失败则信号退回、连续失败天数累加、下一次更难。是否成功由系统掷定，不要在叙事里预设结果。',
  '- 尿意与便意的日常趟数不会写进 notify：那是背景而不是事件。真正会出声的是漏尿、失禁，以及连续数日排不出来。',
  '- 系统默认「她能去就去了」：时间推进时会按常规趟数自行把尿意压回残值，趟数记在 urine.voidsToday，不需要逐趟调用 bsExcreteMetabolism。',
  '- 胎头下降是一根连续轴（fetus.descent，0-100），不是开关：下降到一定深度算入盆，更深才算深固定。descent 与 engaged 都是只读的，由系统按阶段、胎位、胎数推进。',
  '- 剧情里她刻意延后分娩（躺下抬胯、用手往上推、避免走动）时，用 bsUpdateCharacterStatus 的 options.fetalPushback 给一个力度（轻 5／中 10／强 20）。胎头越深越推不动，深固定之后完全无效；实际退了多少由系统算出并写进 notify，不要自行预设成功与否。',
  '- 前驱宫缩有两种，都由系统判定，不要自行宣布她要生了：一是可逆发作（成串宫缩、会痛、夜间尤甚，但仍不规律，换姿势或休息就散），散掉后她仍在原阶段，可以反复无限次；二是真前驱（阶段变为「产兆前驱」），只有胎头深固定之后才可能进入，进入后不可逆。',
  '- 所以「以为要生了又落空」是默认会反复发生的事。看到发作的 notify 时写她的惊慌与判断失误，但不要写成分娩已经开始；只有阶段真的变成「产兆前驱」才是要生了。',
  '- 只有当剧情让她去不了厕所时，才用 bsUpdateCharacterStatus 的 options.urineHolding = true——被场合、他人、束缚或手头脱不开的事困住，附近没有可用的地方，或她自己不肯去。置真之后尿意才会持续往上爬，也才可能漏尿或失禁；剧情放她去了就置回 false。忘了置真，则再长的憋尿情节在系统看来都等于她中途去过。',
  '- 时间累积满一周时会进行日常生活结算：普通周期进入新一轮卵泡期时，周期型乳意会清零。妊娠、假孕或产后恢复的泌乳型乳意不会因跨周自动清除。',
  '- fluxPositive / fluxNegative 的需求按该衍生种族的正负极解释；解放 flux 时传 options.flux。',
  '- 对 derivedType 角色来说，被衍生代谢抵免的需求不会出现在 metabolism 中；未出现的需求不要主动提醒或要求处理。',
  '',
  '[metabolism.libido 性欲]',
  '- libido 是一个只读视图，不是数字：{ level 档名, percent 占「她自己知道想要了」那条线的几成, tag 附加标签或 null, phase 身体状态 }。它不能用 bsExcreteMetabolism 排掉——去不去由系统判定，不是「解放」出来的。',
  '- level 是六档之一（无／低／中／高／满／爆），读法跟尿意同一套：满 = 她自己知道自己想要了、开始压着；爆 = 已经吃掉一半余量。percent 会超过 100，那表示她在满线之上。',
  '- **level 六档各自长什么样，按她身体到了哪来写，不按她决定了什么来写：**',
  '- 无（<25%）＝没有。干干净净的，不胀、不湿、不痒，那里跟胳膊肘一样，碰到了就是碰到了。刚去过之后、或者根本没被撩起来的日子，大半时间都在这一档。不用演、不用提——她就是个没在想那件事的人，做什么都不带这一层。',
  '- 低（25~49%）＝还有点余温。有过一点动静，还没散干净：早上醒来的那阵、白天看到什么之后残留的一点。不胀，只是还知道那里存在——碰一下，湿一点点，很快干回去。该干什么干什么，一下午都想不起来一次。',
  '- 中（50~74%）＝有点想。说不上来是什么时候开始的。先发现的是湿：坐着坐着，自己就潮了，内裤上一点点痕迹——然后才想起来，刚才脑子里闪过那些画面。微微地胀，并拢腿，换个坐姿把那个位置压住；去趟厕所、走两步，就散了。',
  '- 高（75~99%）＝压着。压不住了，还在压。那里一直在提醒她：胀、湿、敏感——内裤的摩擦都成了刺激，怎么坐都在蹭到。他碰她一下，她整个人僵半拍；腿并得死紧——不是拒绝，是怕松开。脑子里的画面掐不掉了，一走神就是。她清楚自己现在是什么状态，所以在装：话变少、答得慢，怕一开口声音就不对。',
  '- 满（100~124%）＝到顶了。不用谁碰，自己就已经涨满了：充血、发烫、空得发慌，身体在往里吸。湿已经透了，腿缝里一收一缩地跳。她嘴上还可以说不要——身体上任何地方都是要的：腰是软的，碰一下就往那边倒。声音开始管不住，一声闷哼漏出来，她自己都吓一跳。',
  '- 爆（≥125%）＝装不了了。到极限了：充血发胀到发疼，一下一下地跳，腰直不起来，站着都要扶东西。他随便一个动作、一句话，她呼吸就乱一拍，声音全从鼻子里漏出来。她知道自己浑身都是破绽——收不回来，也不想收了。这跟勾引没有关系：她连「装」这个动作都做不动了。',
  '- tag 跟 level 并存而不是替换。临界 = 快到了、还没到，这一下停手她会格外难受。余韵 = 他刚停手，但她还在那股劲里，没有平静下来。不应·轻 = 刚去过一次小的，还能接着做。不应·软 = 中的，想歇一会儿。不应·躲 = 大的，碰不得，一碰就躲开。',
  '- **看到「余韵」就不要把她写成没事人。** 他停手了不等于她那边什么都没发生：还在跳、还在缩、腿还软、脑子里还是刚才那一下。这几分钟她说话会短、会走神、会自己夹着腿或者伸手，会催他、或者反过来赌气不催。他去接电话、去洗澡、去关灯的那一段，她不是在旁边安静地等着。',
  '- 停手之后她会不会自己去掉，看他停在哪一步：半途撒手她就散了（这是常见的那个），贴到最后一下才撒手她可能自己就过去了。这一条同样不用你判断，系统算完写进 notify。',
  '- 中途停手要**单独报一次**，不要把一整场合成一次报完。「他做了二十分钟」和「做五分钟、停一会、又做五分钟」在系统里是两件不同的事，合并报会把她这一晚的经历抹平。',
  '- **伴随信号按档起，不占某一档的段落：**湿从「中」起（自己就潮了→透了）；乳头挺从「中」起（碰到就硬挺，不碰也顶着料子——⚠️ 挺是性，胀是奶，胀归乳意别混）；潮红从「高」起（胸口、脖子根、耳朵一片一片地热上来，是皮肤在发烧，不是情绪的脸红）；汗从「满」起（满档鬓角，爆档贴着背）。',
  '- **唤起是整体上移，不是均匀放大。**每个部位有自己的基线，随 level 上移：耳后／脖颈／乳头——平时有感觉，中档一碰就有反应，高档不碰也在提醒，满／爆一碰就麻；腰／大腿内侧／下腹——平时碰得到，中档被碰的那块留下感觉不走，高档没被碰的地方也有感觉、被碰会顿，满／爆不碰也有知觉；脚／背／手——高档碰到才有感觉（上移一档），满／爆平时不算数的触碰现在都有分量。「环境刺激＝非性器位的日常触碰」正是靠这个起作用：中敏感部位上移，走路的摩擦、衣服箍着才都在喂她。满／爆档脚、背都有感觉了＝身体全线失守。',
  '- phase 是身体状态的定性说法：月经阶段名／早孕·起／早孕·重／早孕·回／孕中／孕晚／入盆／产后。**每段的写法：**经期底噪最低、身体忙别的，碰了也是没反应（不是不肯，是没在），高频词是「算了」；卵泡期慢慢回魂、同样的碰法一天比一天有反应（渐进写，不要一天之内跳档）；排卵期身体在催、同样刺激涨得比平时快（量级放大写，倍率系统算，不归你）；黄体期回落、沉，想要的时候「胀」多于「痒」，更容易烦躁而不是主动。',
  '- phase 孕期四段：早孕·起——激素开始爬，下面偶尔突然潮一下、一阵没头没尾的感觉，她自己吓一跳（「这个时候怎么会想这个」），偶发、没规律、刚知道怀孕的话带一点羞耻；早孕·重——**全程最低的一段，不是没感觉，是胃先说话**：恶心、胀、累，身体的带宽全被孕吐占走，起念很难、碰也不太起来，偶尔有一点马上被一阵反胃盖过去。⚠️ 不要写成「孕期所以更敏感」——这一段恰恰是反的。**正文明写了她孕吐开始好转／消退，就用 bsUpdateCharacterStatus 报一次 options.morningSicknessResolved = true**，之后这一段按「早孕·回」的恢复节奏走；有些孕妇没有孕吐，没写不报；早孕·回——身体一件一件把功能捡回来，她先发现的是「最近好像又行了」：先是湿回来了，碰上去有感觉了，有点意外、有点不好意思，试探性地在重新熟悉这具身体；孕中——敏感度放大段，下面总是潮的、内裤没干过，并腿都有感觉，走路的摩擦、衣服箍着都在喂，「没人碰她」不等于「没有事发生」；孕晚（未入盆）——她什么都不做也已经在高档坐着，内裤常年是湿的、那里的知觉一直在，涨得快、落不回原来的低，**写被动多于主动：她还没怎么着就已经在那儿了**；入盆——一点刺激就到满线，但满着也去不了：整个盆腔充血、沉，胎头顶着，坐一下蹲一下就直接顶到那上头，**「一点就着」和「着了也没用」同时成立，落差最大的一段，她自己都不知道该拿这身体怎么办**；产后——身体没回到孕前，哺乳、恶露、疲惫不在这条线上，按正文走，读数只做参考。',
  '- phase 只回答「这具身体现在什么状态」，不回答「她为什么」——「今天是排卵期所以他想……」不写。',
  '- **你每回合只报两样：这一回合是哪一档刺激（bsUpdateCharacterStatus 的 options.libidoClass，0-5）、持续了几分钟（options.libidoMinutes）。** 0 无／1 想象／2 环境（走路、坐着顶着、衣服箍着，没人动手）／3 轻（隔着衣服，或不是核心部位，或直接碰但很轻很慢）／4 中（隔一层薄的碰核心，或直接碰、中等力度）／5 重（直接碰核心而且用力或者快）。不按器具分：手、口、道具、插入都在同一根梯子上，同一个东西用法不同落在不同档。她自己用玩具也算这一侧。',
  '- **刺激分钟不等于本轮分钟。** 一轮可能覆盖半小时，但只有五分钟在动手，那就报 5。报多了系统会拿本轮实际推进的时长截掉。',
  '- **去没去、是小是中是大、还差多少，一概不要你判断，也不会告诉你。** 系统算出来之后写进 notify（「去了一次（大）」）。看到才写，没看到就是没去——哪怕她已经在爆档待了很久。她可以整晚悬在满上一次都不去，那是对的。',
  '- 所以不要写「她快到了」「再几下就……」这种预告，除非 tag 是临界。也不要因为 percent 高就自行安排一次高潮。',
  '- 她被按住、绑着、躲不开，不单独报什么——那影响的是她能不能让刺激停，已经体现在分钟数里了。',
  '- 性欲涨会顺带让乳意涨（刺激把奶往前推，她觉得更胀），这一层由系统折算，不要自己再给 options.milk 加一笔。',
  '- **两种液体的事件层口径：**潮吹不进六档，它是「去了那次」的伴随表现，**只挂大档**（notify 写「去了一次（大）」时才可能有）：一股或几股、不是渗、能弄湿身下垫的东西；中小档液体上限就是渗，**不许写喷**。潮吹不是尿、不从膀胱走、不减尿意值；高潮失禁是尿——减值、出声、算漏尿事件；两者可同场、互不代替。溢乳同为事件层（催产素反射）：要孕 20 周以上或产后（泌乳在线）＋大档高潮或乳头被持续刺激（触发）＋乳意胀满或憋着（有货）三层缺一不发生；量级孕期＝渗／流，产后＝喷。三种液体（潮吹／失禁尿／乳）互不代替，可同场，各自独立。乳头被刺激照常走 libidoClass／libidoMinutes 报，乳意由系统折算，不新开口。',
  '',
  '[wardrobe / outfit]',
  '- wardrobe 是角色衣柜，包含 items；outfit 是当前穿着。主流敘事通常只需要关注在场角色的 outfit。',
  '- 衣物 item 字段：id/name/note/slot/masking/support/capacity/convenience。id 使用整数；默认主件 id=0 表示全裸，不要加入 wardrobe.items。note 只写衣物稳定外观与来源：颜色、材质、版型、长短、固定开口、图案、制服/病服/借装来源等；皮肤暴露、开衩、透肤、深领等稳定外观写在 note。禁止写当前穿着反应、角色感受、近期身体变化、怀孕/胀痛/压胸/勒红/变紧/显怀等动态状态；这些由四维、pregFit 与当轮叙事推导。slot=main 为一次只能穿一件的完整基础套装：一般将上衣与下着合并为同一 main（连身裙、连体衣除外），不得拆成彼此互斥的 main，也不得把下着放入 accessory；四维按整套评分。main 可附 parts 数组列出组成部件名（如 ["白衬衫","牛仔裤"]）。slot=accessory 为可叠加的外套、鞋履、帽子、饰品、贴身内衣或功能配件补正；配件可附 layer（inner=贴身内衣等穿在主件之下，outer=外搭，默认 outer）。配件单项只能 -3 到 3，通常只影响 1-2 个最相关维度，其他维度填 0。',
  '- 剧情中重新搭配上下装（如白衬衫改配短裙）时，不要修改原主件，应用 bsAddWardrobeItem 铸造新的组合主件（parts 列出部件）再用 bsChangeOutfit 换上；组合只需在实际穿过时创建。',
  '- outfit.wearState 为当前穿着状态短标签（12 字内），默认 整齐。建议词表：整齐/凌乱/敞开/半褪/撩起/上衣已褪/下装已褪/湿透，也可按情境自造同粒度短标签；主件有 parts 时优先引用部件名消歧，如「毛衣已脱」「裙摆撩起」。剧情中穿着完整度或整洁度变化时，用 bsChangeOutfit 只传 wearState 即可更新；换主件时未显式传入会自动重置为整齐。仅着内衣可表达为 mainItemId: 0 加 inner 配件。',
  '- 可独立穿脱的外层（毛衣、开衫、外套等）应是 layer=outer 的配件而不是 main 的一部分；若发现某主件把外层并入了 parts，可用 bsAddWardrobeItem 把外层拆成新配件并更新该主件。',
  '- 四维含义：masking=掩盖身体曲线、孕肚、胸腹变化的程度，不等于皮肤裸露程度，露肤、开衩、透肤等稳定外观由 note 描述；support=对胸、腹、腰、重心的承托程度；capacity=容许体型变化的程度；convenience=行动、穿脱、如厕、哺乳或排解需求的方便程度。',
  '- 可用 bsAddWardrobeItem 添加/更新长期衣柜衣物，bsRemoveWardrobeItem 删除长期衣柜衣物，bsChangeOutfit 更换当前主件和配件。穿上或脱下个别配件（穿鞋、戴外套、脱袜等）优先用增量参数：addAccessoryItemIds 穿上、removeAccessoryItemIds 脱下，在当前配件基础上生效，不需要重述其他配件。accessoryItemIds 是覆盖式完整列表，用于整套重设：脱掉所有配件传 accessoryItemIds: []；全裸传 mainItemId: 0 且 accessoryItemIds: []。wearState 只是状态标签，不会改变穿了哪些衣物。',
  '- 临时衣物（如病服、借来的外套、旅馆睡衣）不要加入 wardrobe；在 bsChangeOutfit 传 temporaryItems，并让 mainItemId/accessoryItemIds 指向其中 id。换回衣柜服装时传 temporaryItems: [] 清除临时衣物。',
  '- 衣物引用规则：调用衣柜工具时优先传整数 id；若不确定 id，可传准确的衣物名称字符串，系统会按名称解析。bsAddWardrobeItem 新增衣物可省略 id，系统会自动分配下一个整数 id，不要自造大数字 id。',
  '- 换装触发规则：只要 recent_messages 中出现穿上、脱下、更衣、借穿、被脱除、淋湿、衣衫不整、洗浴后重新着装等衣着或穿着状态变化，就必须调用 bsChangeOutfit，使 outfit 与当前叙事一致：换主件传 mainItemId；穿脱个别配件传 addAccessoryItemIds/removeAccessoryItemIds；仅状态变化传 wearState。不要用 wearState 或描述文字代替配件穿脱。',
  '- outfit.currentWearText 是系统解析出的当前穿着摘要（主件 + 穿着状态 + 配件与贴身衣物），仅供比对阅读，不要写回。每轮应将它与最近叙事对照：不符时必须同轮调用 bsChangeOutfit 修正。衣着的当前状态由 outfit 机械字段唯一承担，不要在 descriptions 中维护衣着子字段。',
  '- 幕外(offscreen)角色也会附带精简 wardrobe.items（仅 id/name/slot/layer）与当前 outfit 摘要。角色重新登场时，若衣着应有变化（如换了日常服、外出服），应在调用 bsSetCharacterPresence 的同一轮用 bsChangeOutfit 完成回场换装。',
  '- 四维数值只在孕期窗口（真实妊娠/产兆前驱/产程/产后恢复）发送并参与 pregFit 计算；窗口外 payload 中的衣物只有 id/name/slot/note/parts/layer，非孕期敘事请依 note 的稳定外观描述。四维仍保存在系统中，bsAddWardrobeItem 新增或更新衣物时仍必须给出完整四维。',
  '- outfit.pregFit 只在真实妊娠、产兆前驱、产程或产后恢复中存在；其余阶段为 null。pregFit.pregWearPressure 为孕期衣着压力，产后恢复期间会随恢复进度从产后初期水平递减到 0；gap 为四维余裕：masking/support/capacity/convenience。gap 低于 0 表示该维度已被孕期变化压过。',
  '- gap 表示衣物该维度扣除孕期压力后的余裕。一般 gap 约 3 以上表示仍有余裕；0 到 2 表示开始吃紧；-1 到 -3 表示明显冲突；-4 以下表示该维度严重失效。按具体维度叙述：masking 失效是轮廓、孕肚或胸腹变化难藏；support 失效是承托不足、下坠、晃动或重心负担外溢；capacity 失效是版型固定、尺寸死、腰腹胸臀被迫撑紧或扣合困难；convenience 失效是行动、穿脱、如厕或排解需求明显受阻。不要把 gap 数值直接写进叙事，除非是调试说明。',
  '',
  '[descriptions]',
  '- normalDescription / pregnantDescription 为文字描述栏位。',
  '- 两者格式固定为：字段名|描述内容;;字段名|描述内容;;...字段名|描述内容;;',
  '- 使用 bsSetDescription 前，必须逐一检查该描述栏位全部既有子字段；未传入的子字段会保留旧值，且仅代表它已检查并确认完全不变。不得为了简短而省略受本轮剧情、姿势、衣着、表情、身体状态或环境影响的字段。',
  '- 不要新增角色原本没有的描述子字段；只能更新 existing_state 中该角色该 descriptions 已存在的字段名。唯一例外：当本提示词包含 [pregnantDescription 初始化] 段时，可为其中点名角色的空 pregnantDescription 建立规范内的首批子字段。',
  '- 不要改写成自然段，不要省略字段名，不要把 ;; 或 | 换成别的分隔方式。',
  '',
  '[notify]',
  '- firstly: 主要阶段变化或必须优先处理的警示，例如真实产程中的难产手术产建议；也可能用于提醒角色获得或失去妊娠变速效果。',
  '- secondly: 次级事件提示，如风险、破水、分娩推进、母胎互动或胎儿自主活动；其中的母胎互动与胎动事件可自然融入当前叙事。',
  '- thirdly: 辅助建议提示，提醒是否该缓解生理需求、关注膜耐性、抵抗分娩等。',
  '',
].join('\n');

const TRACKER_DIARY_SECTION = [
  '[diary]',
  '- diary 是角色主观日记，保存为数组；existing_state 中只会发送最近几笔，前端完整变量仍会保留全量。',
  '- diary[*].time: 角色日记中的日期标题，不是具体钟点；应填写故事内日期、年月日、某日/第几天等日期性标题。不要填 HH:mm、午後 这类时刻；若只有时刻信息，请结合上下文写成“今日”“雨夜当日”“第 X 日”等日期标题。',
  '- diary[*].content: 角色事后写下的主观日记，可包含心境、记忆、误解、愿望、秘密或身体感受；它不是即时心声/旁白，也不是客观状态，不能覆盖数值事实。',
  '- diary 有 24 小时冷却；同一角色在同一个故事日内最多只能写一篇。若当天已经写过，必须跳过 bsWriteDiary。',
  '- 通常只有 bsPassedTime 跨日后才调用 bsWriteDiary，并优先写“昨日/前一日/上一天”的回顾。若剧情发生重大事件或 notify 提醒，也应写成事后补记的语气，不要像当下即时独白。',
  '- 角色不在场也可以写日记；可根据角色性格、处境与已知生活状态补足合理的日常幕外感受，但不要把未经剧情支持的重大事件写成既成事实，也不要用日记改写客观状态。',
  '',
].join('\n');

function buildTrackerMetabolismGuide(payload = null) {
  const fluxNames = collectRelevantFluxNames(payload || {});
  const diaryEnabled = payload?.diary_enabled !== false;
  const wardrobeEnabled = payload?.wardrobe_enabled === true;
  const breedingPsychologyEnabled = payload?.breeding_psychology_enabled === true;
  let baseGuide = diaryEnabled
    ? TRACKER_VARIABLE_GUIDE_PROMPT
    : TRACKER_VARIABLE_GUIDE_PROMPT.replace(`${TRACKER_DIARY_SECTION}\n`, '');
  if (!wardrobeEnabled) {
    baseGuide = baseGuide.replace(/\n?\[wardrobe \/ outfit\][\s\S]*?\n\[descriptions\]/, '\n[descriptions]');
  }
  if (!breedingPsychologyEnabled) {
    baseGuide = baseGuide
      .replace('、psychology', '')
      .replace(/\n?\[psychology\][\s\S]*?\n\[skills \/ talents\]/, '\n[skills / talents]');
  }
  // 尿意按需读取段：当前档+相邻档+排完落点+漏风险，替换全量边界表。
  const urineGuide = buildUrineStatusGuide(payload);
  if (urineGuide) {
    baseGuide = baseGuide.replace('\n[metabolism.libido 性欲]', `${urineGuide}[metabolism.libido 性欲]`);
  }
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
      '- payload.mainflow_context_snapshot 是 ST 主流上一轮生成 request 中已经发送或准备发送给模型的上下文快照。',
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
