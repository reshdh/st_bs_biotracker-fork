import { LABOR_STAGES, PREGNANCY_STAGES, MENSTRUAL_STAGES } from './stage_config.js';
import { getUrineHardCap, getUrineUrgeCap, engagementProgressFromDescent } from './metabolism_config.js';
import { getUterinePressureBaseline } from './uterine_pressure_config.js';
import { getLibidoView, getMilkCapacity, isMilkBlocked } from './tools.js';
import { isDescentEngaged } from './fetal_descent_config.js';

const VITALITY_CAPS = Object.freeze({ 1: 50, 2: 75, 3: 100, 4: 125, 5: 150, 6: 175, 7: 200 });

function isTruePregnancyStage(stage) {
  return PREGNANCY_STAGES.includes(stage) || stage === '产兆前驱' || LABOR_STAGES.includes(stage);
}

function getUterinePressureCap(profile) {
  const stage = profile?.base?.stage;
  if (!isTruePregnancyStage(stage)) return 50;
  const effectivePregnantDays = Math.max(0, Number(profile?.pregnant?.effectivePregnantDays) || 0);
  const months = Math.floor(effectivePregnantDays / 28);
  const progress = Math.max(0, Math.min(10, months)) / 10;
  return Math.round(50 + (150 - 50) * progress);
}

// 尿意两条线（urge/hard）跟入盆深度有关：胎头越深入盆，膀胱容量越被压窄。
// getUrineHardCap/UrgeCap 签名是 (stage, engagedCount, progress, prolonged)，
// 之前直接传 profile 对象当 engagedCount 会导致 Number(profile)=NaN→0，
// 永远走未入盆基准值。这里从 profile 正确提取三个参数。
function getUrineLinesForProfile(profile) {
  const stage = String(profile?.base?.stage || '');
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  let deepest = 0;
  let engagedCount = 0;
  for (const fetus of fetuses) {
    const d = Number(fetus?.descent) || 0;
    if (d > deepest) deepest = d;
    if (isDescentEngaged(d)) engagedCount++;
  }
  const progress = engagementProgressFromDescent(deepest);
  const prolonged = profile?.pregnant?.prolonged === true;
  return {
    urgeCap: getUrineUrgeCap(stage, engagedCount, progress, prolonged),
    hardCap: getUrineHardCap(stage, engagedCount, progress, prolonged),
  };
}

/**
 * 纯状态机计算函数：按角色当前 profile 字段动态计算状态标签
 * 不写入存档，0ms 自动消退与点亮
 * 
 * @param {Object} character 角色对象或 profile 对象
 * @returns {Array} 状态标签列表，首项为身位基底徽章，后续按优先级排序
 */
export function getCharacterStatusTags(character) {
  const profile = character?.profile || character || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const metabolism = profile.metabolism || {};
  const outfit = profile.outfit || {};
  const bio = profile.bio || {};
  const stage = String(base.stage || '未设定');
  const isPreg = isTruePregnancyStage(stage);
  const isLabor = LABOR_STAGES.includes(stage);

  // 1. 【排头常驻】身位与孕况基底徽章 (Base Stage Badge)
  let baseBadge = null;
  const effectivePregnantDays = Math.round(Number(pregnant.effectivePregnantDays ?? pregnant.pregnantDays ?? base.days ?? 0));
  const fetusesCount = Array.isArray(pregnant.fetuses) ? pregnant.fetuses.length : (Number(pregnant.fetusesCount) || 0);

  if (isLabor) {
    const phase = pregnant.laborPhase || '';
    if (stage === '第一产程') {
      baseBadge = {
        key: 'stage_labor1',
        label: '第一产程' + (phase ? '·' + phase : ''),
        tooltip: '宫口逐渐开全，规律宫缩持续推进中。',
        className: 'bs-bt-tag--stage',
        priority: 100,
        isBase: true,
      };
    } else if (stage === '第二产程') {
      const fetusIdx = Number(pregnant.laborFetusIndex) || 1;
      baseBadge = {
        key: 'stage_labor2',
        label: '第二产程' + (fetusesCount > 1 ? '·第' + fetusIdx + '胎' : '') + (phase ? '·' + phase : ''),
        tooltip: '胎体下降与娩出阶段，进入全力推进。',
        className: 'bs-bt-tag--stage',
        priority: 100,
        isBase: true,
      };
    } else if (stage === '第三产程') {
      baseBadge = {
        key: 'stage_labor3',
        label: '第三产程',
        tooltip: '胎儿娩出完毕，胎盘与供养组织排出中。',
        className: 'bs-bt-tag--stage',
        priority: 100,
        isBase: true,
      };
    } else {
      baseBadge = {
        key: 'stage_labor',
        label: stage,
        tooltip: '当前产程阶段：' + stage,
        className: 'bs-bt-tag--stage',
        priority: 100,
        isBase: true,
      };
    }
  } else if (stage === '产兆前驱') {
    baseBadge = {
      key: 'stage_prodromal',
      label: '产兆前驱',
      tooltip: '胎头深固定，真性分娩前兆已启动。',
      className: 'bs-bt-tag--stage',
      priority: 95,
      isBase: true,
    };
  } else if (stage === '孕早期') {
    baseBadge = {
      key: 'stage_early',
      label: '孕早期 (' + effectivePregnantDays + '天)',
      tooltip: '妊娠初期，胚胎正在着床发育。',
      className: 'bs-bt-tag--stage',
      priority: 90,
      isBase: true,
    };
  } else if (stage === '孕中期') {
    baseBadge = {
      key: 'stage_mid',
      label: '孕中期' + (fetusesCount > 1 ? ' · 双胎' : '') + ' (' + effectivePregnantDays + '天)',
      tooltip: '进入平稳期，' + (fetusesCount > 1 ? '多胎' : '') + '胎动日益活跃。',
      className: 'bs-bt-tag--stage',
      priority: 90,
      isBase: true,
    };
  } else if (stage === '孕晚期') {
    baseBadge = {
      key: 'stage_late',
      label: '孕晚期 (' + effectivePregnantDays + '天)',
      tooltip: '腹部高耸沉重，进入备产阶段。',
      className: 'bs-bt-tag--stage',
      priority: 90,
      isBase: true,
    };
  } else if (stage === '临产期') {
    baseBadge = {
      key: 'stage_term',
      label: '临产期 (' + effectivePregnantDays + '天)',
      tooltip: '接近足月，产兆即将启动。',
      className: 'bs-bt-tag--stage',
      priority: 92,
      isBase: true,
    };
  } else if (stage === '逾期') {
    baseBadge = {
      key: 'stage_overdue',
      label: '逾期 (' + effectivePregnantDays + '天)',
      tooltip: '超过预产期，需密切观察产兆与胎况。',
      className: 'bs-bt-tag--stage',
      priority: 92,
      isBase: true,
    };
  } else if (stage === '产后恢复') {
    const postDays = Math.round(Number(base.days || 0));
    baseBadge = {
      key: 'stage_postpartum',
      label: '产后恢复 (' + postDays + '天)',
      tooltip: '新生命已降生，身体处于产后恢复期。',
      className: 'bs-bt-tag--stage',
      priority: 88,
      isBase: true,
    };
  } else if (stage === '假孕期') {
    baseBadge = {
      key: 'stage_pseudopreg',
      label: '假孕状态',
      tooltip: '因心理与激素错位产生的假性妊娠反应。',
      className: 'bs-bt-tag--stage',
      priority: 85,
      isBase: true,
    };
  } else if (stage === '排卵期') {
    baseBadge = {
      key: 'stage_ovulation',
      label: '排卵期 · 易孕',
      tooltip: '处于易孕窗口期，卵子已成熟排出。',
      className: 'bs-bt-tag--stage',
      priority: 80,
      isBase: true,
    };
  } else if (stage === '月经期') {
    const mensDay = Math.max(1, Math.round(Number(base.days || 0)) + 1);
    baseBadge = {
      key: 'stage_mens',
      label: '月经期 (第' + mensDay + '天)',
      tooltip: '处于生理期，体质虚软易疲惫。',
      className: 'bs-bt-tag--stage',
      priority: 80,
      isBase: true,
    };
  } else if (stage === '卵泡期') {
    baseBadge = {
      key: 'stage_follicular',
      label: '卵泡期',
      tooltip: '常态生理周期，身心相对平稳。',
      className: 'bs-bt-tag--stage',
      priority: 70,
      isBase: true,
    };
  } else if (stage === '黄体期') {
    baseBadge = {
      key: 'stage_luteal',
      label: '黄体期',
      tooltip: '常态生理周期，身心相对平稳。',
      className: 'bs-bt-tag--stage',
      priority: 70,
      isBase: true,
    };
  } else {
    baseBadge = {
      key: 'stage_other',
      label: stage,
      tooltip: '当前生理阶段：' + stage,
      className: 'bs-bt-tag--stage',
      priority: 60,
      isBase: true,
    };
  }

  // 2. 动态体感与物理残留标签 (Dynamic Sensation Matrix)
  const dynamicTags = [];

  // ① 多胎徽章 (非孕中期阶段如果多胎则单独展示)
  if (isPreg && fetusesCount > 1 && stage !== '孕中期') {
    dynamicTags.push({
      key: 'fetuses_multi',
      label: fetusesCount === 2 ? '双胎' : '多胎 (' + fetusesCount + '胎)',
      tooltip: '多胎怀妊，母体代谢与腹壁负担成倍增加。',
      className: 'bs-bt-tag--fetus',
      priority: 45,
    });
  }

  // ② 胎头下降链 (Fetal Descent Chain)
  if (isPreg || isLabor) {
    const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
    const maxDescent = fetuses.reduce((max, f) => Math.max(max, Number(f?.descent) || 0), 0);
    if (maxDescent >= 85) {
      dynamicTags.push({
        key: 'descent_fixed',
        label: '胎头固定',
        tooltip: '胎头已进入骨盆深部并紧密固定，压迫骨盆底。',
        className: 'bs-bt-tag--labor',
        priority: 70,
      });
    } else if (maxDescent >= 65) {
      dynamicTags.push({
        key: 'descent_deep',
        label: '深入盆',
        tooltip: '胎头显著下降深入骨盆，膀胱受压加剧。',
        className: 'bs-bt-tag--labor',
        priority: 58,
      });
    } else if (maxDescent >= 40) {
      dynamicTags.push({
        key: 'descent_initial',
        label: '入盆初期',
        tooltip: '胎头开始衔接入盆，下腹部出现轻微沉坠感。',
        className: 'bs-bt-tag--labor',
        priority: 32,
      });
    }
  }

  // ③ 宫缩与宫压波幅 (Contractions)
  if (isPreg && !isLabor) {
    const pressureCap = getUterinePressureCap(profile);
    const baseline = getUterinePressureBaseline(effectivePregnantDays, pressureCap);
    const uterinePressure = Number(base.uterinePressure) || 0;
    const over = Math.max(0, uterinePressure - baseline);
    if (over >= 40) {
      dynamicTags.push({
        key: 'contraction_threatened',
        label: '强宫缩',
        tooltip: '强烈规律宫缩，腹壁剧烈发硬发紧。',
        className: 'bs-bt-tag--labor',
        priority: 88,
      });
    } else if (over >= 25) {
      dynamicTags.push({
        key: 'contraction_series',
        label: '宫缩·成串',
        tooltip: '阵发性宫缩连贯出现，小腹紧绷明显。',
        className: 'bs-bt-tag--labor',
        priority: 66,
      });
    } else if (over >= 10) {
      dynamicTags.push({
        key: 'contraction_mild',
        label: '宫缩·发紧',
        tooltip: '偶发性腹壁发紧，稍作休息可缓解。',
        className: 'bs-bt-tag--labor',
        priority: 34,
      });
    }
  }

  // ④ 胸乳与母乳系 (Milk)
  const milkBlocked = isMilkBlocked(profile);
  const milkCap = getMilkCapacity(profile);
  const milkValue = Number(metabolism.milk) || 0;
  const milkFullness = milkCap > 0 ? milkValue / milkCap : 0;
  if (milkBlocked) {
    dynamicTags.push({
      key: 'milk_blocked',
      label: '堵奶',
      tooltip: '乳腺局部淤积发硬，触碰压痛，需温柔热敷疏通。',
      className: 'bs-bt-tag--urgent',
      priority: 85,
    });
  } else if (milkFullness >= 0.75) {
    dynamicTags.push({
      key: 'milk_extreme',
      label: '极度涨乳',
      tooltip: '乳房充盈发胀，发烫并伴有隐约跳痛。',
      className: 'bs-bt-tag--milk',
      priority: 65,
    });
  } else if (milkFullness >= 0.55) {
    dynamicTags.push({
      key: 'milk_swollen',
      label: '涨乳',
      tooltip: '乳腺充盈充血，明显胀满。',
      className: 'bs-bt-tag--milk',
      priority: 40,
    });
  }

  // ⑤ 性欲、动情与高潮系 (Libido)
  const libidoView = getLibidoView(profile);
  if (libidoView.tag === '临界') {
    dynamicTags.push({
      key: 'libido_edge',
      label: '绝顶前夕',
      tooltip: '快感蓄积逼近临界高潮点。',
      className: 'bs-bt-tag--libido',
      priority: 75,
    });
  } else if (libidoView.tag === '余韵') {
    dynamicTags.push({
      key: 'libido_afterglow',
      label: '高潮余韵',
      tooltip: '高潮平复中，神经与躯体仍沉浸在剧烈余震。',
      className: 'bs-bt-tag--libido',
      priority: 72,
    });
  } else if (libidoView.tag && String(libidoView.tag).startsWith('不应')) {
    dynamicTags.push({
      key: 'libido_refractory',
      label: '不应期',
      tooltip: '高潮后的生理敏感疲劳期，需稍作喘息。',
      className: 'bs-bt-tag--libido',
      priority: 50,
    });
  } else if (libidoView.level === '爆') {
    dynamicTags.push({
      key: 'libido_overload',
      label: '发情',
      tooltip: '情欲过载，身心完全被生理唤起占据。',
      className: 'bs-bt-tag--libido',
      priority: 68,
    });
  } else if (libidoView.level === '满') {
    dynamicTags.push({
      key: 'libido_aroused',
      label: '动情',
      tooltip: '情欲充盈，开始难以自抑。',
      className: 'bs-bt-tag--libido',
      priority: 55,
    });
  } else if (libidoView.level === '高' || libidoView.level === '中') {
    dynamicTags.push({
      key: 'libido_warm',
      label: '微热',
      tooltip: '局部温热潮润，微有动情。',
      className: 'bs-bt-tag--libido',
      priority: 30,
    });
  }

  // ⑥ 尿意与憋耐系 (Urine)
  const urineValue = Number(metabolism.urine) || 0;
  const { urgeCap, hardCap } = getUrineLinesForProfile(profile);
  const cooldown = profile.cooldown || {};
  // 漏尿/失禁判据：引擎在 emitUrineLeakNotify 里写 cooldown.urineLeakWarned
  // / cooldown.urineIncontinenceWarned，尿液回落到低档时清除。
  // notify.firstly（失禁）/notify.secondly（漏尿）不可靠——secondly 被受精、
  // 入盆、晕厥等事件复用，不是尿意专属。
  const isUrineIncontinence = Boolean(cooldown.urineIncontinenceWarned);
  const isUrineLeak = Boolean(cooldown.urineLeakWarned);

  if (isUrineIncontinence) {
    dynamicTags.push({
      key: 'urine_incontinence',
      label: '失禁',
      tooltip: '排泄防线彻底崩溃，衣物与身下浸湿。',
      className: 'bs-bt-tag--urgent',
      priority: 95,
    });
  } else if (isUrineLeak) {
    dynamicTags.push({
      key: 'urine_leak',
      label: '漏尿',
      tooltip: '腹压过大引发轻微渗漏，需更换内衣。',
      className: 'bs-bt-tag--trace',
      priority: 78,
    });
  }

  if (!isUrineIncontinence) {
    if (urineValue >= urgeCap + (hardCap - urgeCap) * 0.5) {
      dynamicTags.push({
        key: 'urine_burst',
        label: '极度憋尿',
        tooltip: '膀胱胀满压迫，需极力收紧防守。',
        className: 'bs-bt-tag--urgent',
        priority: 80,
      });
    } else if (urineValue >= urgeCap) {
      dynamicTags.push({
        key: 'urine_urgent',
        label: '尿急',
        tooltip: '尿意急迫，需尽快寻找洗手间。',
        className: 'bs-bt-tag--urgent',
        priority: 60,
      });
    } else if (urineValue >= urgeCap * 0.75) {
      dynamicTags.push({
        key: 'urine_notable',
        label: '有尿意',
        tooltip: '下腹有充盈饱满感。',
        className: 'bs-bt-tag--urgent',
        priority: 25,
      });
    }
  }

  // ⑦ 便意与肠道系 (Stool)
  const stoolFailDays = Number(profile.stool?.failDays ?? metabolism.stool?.failDays ?? 0);
  const stoolDiff = Number(profile.stool?.difficulty ?? 0);
  if (stoolDiff >= 70 || stoolFailDays >= 5) {
    dynamicTags.push({
      key: 'stool_impaction',
      label: '重度嵌塞',
      tooltip: '肠道阻力极大，排解困难。',
      className: 'bs-bt-tag--urgent',
      priority: 76,
    });
  } else if (stoolFailDays >= 3 || stoolDiff >= 40) {
    dynamicTags.push({
      key: 'stool_blocked',
      label: '便阻',
      tooltip: '肠道蠕动缓慢，有明显积压感。',
      className: 'bs-bt-tag--urgent',
      priority: 35,
    });
  }

  // ⑧ 体力与精力系 (Vitality)
  const vitality = Number(base.vitality) || 0;
  const vitalityLevel = Math.max(1, Math.min(7, Math.round(Number(base.vitalityLevel) || 4)));
  const vitalityCap = VITALITY_CAPS[vitalityLevel] || 125;
  const vitalityRatio = vitality / vitalityCap;
  const hunger = Number(metabolism.hunger) || 0;
  const sleep = Number(metabolism.sleep) || 0;

  if (vitalityRatio <= 0.08 || (vitalityRatio < 0.2 && hunger >= 100)) {
    dynamicTags.push({
      key: 'vitality_exhausted',
      label: '虚脱',
      tooltip: '体力濒临耗竭，四肢脱力，意识昏沉。',
      className: 'bs-bt-tag--vitality',
      priority: 82,
    });
  } else if (vitalityRatio < 0.25) {
    dynamicTags.push({
      key: 'vitality_weak',
      label: '脱力',
      tooltip: '体力严重透支，手抖腿软，动作迟滞。',
      className: 'bs-bt-tag--vitality',
      priority: 62,
    });
  } else if (vitalityRatio >= 0.8 && hunger < 50 && sleep < 50) {
    dynamicTags.push({
      key: 'vitality_energetic',
      label: '精力充沛',
      tooltip: '精力饱满充沛，身体轻盈无负担。',
      className: 'bs-bt-tag--vitality',
      priority: 15,
    });
  }

  if (hunger >= 100) {
    dynamicTags.push({
      key: 'hunger_starving',
      label: '饥饿',
      tooltip: '腹中空空，急需进食补充能量。',
      className: 'bs-bt-tag--vitality',
      priority: 38,
    });
  }
  if (sleep >= 100) {
    dynamicTags.push({
      key: 'sleep_drowsy',
      label: '嗜睡',
      tooltip: '睡意沉重，眼皮沉重难以强撑。',
      className: 'bs-bt-tag--vitality',
      priority: 36,
    });
  }

  // ⑨ 心理与情压系 (PsyStress)
  const psyStress = Number(base.psyStress) || 0;
  if (psyStress >= 140) {
    dynamicTags.push({
      key: 'stress_panic',
      label: '惊慌失控',
      tooltip: '精神压力极高，情绪濒临崩溃失控。',
      className: 'bs-bt-tag--urgent',
      priority: 84,
    });
  } else if (psyStress >= 110) {
    dynamicTags.push({
      key: 'stress_anxious',
      label: '焦虑紧绷',
      tooltip: '内心焦躁不安，神经持续高度紧绷。',
      className: 'bs-bt-tag--urgent',
      priority: 48,
    });
  }

  // ⑩ 衣着与仪态残留系 (Wardrobe)
  const wearState = String(outfit.wearState || '').trim();
  if (wearState === '湿透') {
    dynamicTags.push({
      key: 'wardrobe_soaked',
      label: '衣衫湿透',
      tooltip: '衣物浸透水痕或体液，紧贴肌肤。',
      className: 'bs-bt-tag--trace',
      priority: 74,
    });
  } else if (wearState === '敞开') {
    dynamicTags.push({
      key: 'wardrobe_open',
      label: '衣襟敞开',
      tooltip: '衣襟大开，腹部或胸部袒露。',
      className: 'bs-bt-tag--trace',
      priority: 52,
    });
  } else if (wearState === '半褪' || wearState === '凌乱') {
    dynamicTags.push({
      key: 'wardrobe_messy',
      label: '衣衫半褪',
      tooltip: '衣衫微敞散乱，露出贴身内衣与曲线。',
      className: 'bs-bt-tag--trace',
      priority: 46,
    });
  }

  const pregFitPressure = Number(outfit.pregFitPressure ?? bio.pregWearPressure ?? 0);
  if (pregFitPressure > 2.5) {
    dynamicTags.push({
      key: 'wardrobe_tight',
      label: '衣物紧绷',
      tooltip: '原有衣物已被逐渐隆起的身形绷紧。',
      className: 'bs-bt-tag--trace',
      priority: 28,
    });
  }

  // 3. 排序与组合 (Sorting & Assembly)
  dynamicTags.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const result = baseBadge ? [baseBadge, ...dynamicTags] : dynamicTags;
  result.baseBadge = baseBadge;
  result.dynamicTags = dynamicTags;
  return result;
}