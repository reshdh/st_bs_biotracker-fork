// 代谢需求的单一归属：键清单、阶段性容量、档位换算、分档权重。
// state.js 与 tools.js 都从这里取。在别处硬编码 150 或复制键数组都会造成
// 「加载时按一套算、运行时按另一套算」的静默错档，历史上就是这么埋下的。

export const BASE_METABOLISM_CAP = 150;

// 入盆进度：descent 40（越过骨盆入口）记 0，descent 100（完全入盆、抵到盆底）记 1。
// 消费端（尿意三条线、便意阻力、体力消耗）都吃这个连续值，不再各自掷二值。
export function engagementProgressFromDescent(descent) {
  const d = Number(descent) || 0;
  return Math.max(0, Math.min(1, (d - 40) / 60));
}

// 排泄需求拆成 urine（尿意）与 stool（便意）：两者的孕期修正方向相反
// （尿意容量被压、产量上升；便意蠕动变慢、阻力上升），合成一个值时
// 「一次失败该让状态变好还是变坏」算不出来。
export const METABOLISM_KEYS = Object.freeze([
  'urine', 'stool', 'hunger', 'sleep', 'milk', 'libido',
]);

// 性欲住在 metabolism 里是为了用 addMetabolismValue 那套分档权重（「这一份算哪一侧」），
// 但它不是排泄需求：不参与妊娠阻塞／加速抽卡，也不能靠 bsExcreteMetabolism 排掉。
// 去不去由闸决定，不是「解放」出来的。
export const NON_EXCRETABLE_METABOLISM_KEYS = Object.freeze(['libido']);

// 补丁与序列化用的键集：额外含衍生种族的 flux。
export const METABOLISM_PATCH_KEYS = Object.freeze([...METABOLISM_KEYS, 'flux']);

// 旧档只有合并后的 excretion，拆回来只能近似：尿意占多数。
export const LEGACY_EXCRETION_SPLIT = Object.freeze({ urine: 0.6, stool: 0.4 });

export const METABOLISM_LABELS = Object.freeze({
  urine: '尿意',
  stool: '便意',
  hunger: '饿意',
  sleep: '困意',
  milk: '乳意',
  libido: '性欲',
});

// ── 乳腺出口四档（闸）────────────────────────────────────────────────
// 这道闸决定「这个人漏得多痛快」，只改四样：产量、单次挤出、自发溢出阈值、会不会喷。
// 它不改容量——容量跟腺体发育走，跟罩杯也无关：小的可以是松档，大的可以是紧档。
//
// openWeek：开奶周。到这一周之前发育＝0，整套不走，面板读 0。
// produce：足月每小时产出（面板单位）。leak：其中直接漏掉、不进存量的那一份。
//   净涨＝produce − leak，四档必然为正——漏掉的只能是产量的一部分。
//   所以四个档都会堵，全开涨得最快、最先堵；「一直在流」和「会堵」同时成立。
// expel：单次挤出上限（面板单位）。排乳时按存量函数取 min(expel, 存量×比例)，
//   不是固定 30 也不是固定 expel——刚排完只剩几滴时挤不出 expel 的量。
// seepThreshold：自发往外走的满度阈值。紧档给 1.02（够不到，只能在乳头口干掉，
//   那正好是「干在原地」和那块痂的来处）；松档 0.15（坐着不动就在往外走）。
// canSpray：松档以上才可能喷。
//
// ⚠️ 体质系数（多奶/普通/少奶）不改这里的基础值——它改的是发育模型的两个参数：
//   openWeek ±1（发育起点提前/推后）和 produce 满值 ×0.75/×1.0/×1.25（发育终点高低）。
//   见下方 MILK_CONSTITUTION 表和 getMilkGateAdjusted()。
//   容量和 expel 不进体质表：多奶是产得多不是容器大；
//   expel 看当前存量不是点数，体质系数乘它等于双算。
export const MILK_GATES = Object.freeze({
  紧: { openWeek: 22, produce: 3.4, leak: 0.0, expel: 4, seepThreshold: 1.02, canSpray: false },
  中: { openWeek: 16, produce: 20, leak: 4, expel: 16, seepThreshold: 0.55, canSpray: false },
  松: { openWeek: 13, produce: 67, leak: 34, expel: 42, seepThreshold: 0.15, canSpray: true },
  全开: { openWeek: 11, produce: 250, leak: 200, expel: 90, seepThreshold: 0.0, canSpray: true },
});

export const MILK_GATE_KEYS = Object.freeze(Object.keys(MILK_GATES));

export function getMilkGate(name) {
  return MILK_GATES[String(name || '').trim()] || MILK_GATES['中'];
}

// ── 体质系数表（多奶 / 普通 / 少奶）——TASK-06 2026-09-04 拍板 ──────────
// 统一发育模型：多奶体质 = 乳腺发育全程领先。产量高是发育领先的结果，不是独立加成。
// 体质只改两个参数：
//   openWeekShift：开奶周提前/推后——同一个日历时间，多奶多积累了一段发育
//   produceMult：发育到 100% 时产量天花板——多奶高四分之一、少奶低四分之一
//
// 发育度低时产量差距按比例也小（都接近 0），发育越推进 ×1.25 越显出来——
// 早期几乎无差、中期开始领先、足月差距最大。涨到满的时间也更早（发育度先到顶）。
// 附带效应：发育领先 + 产量满值高 → 净涨更快 → 多奶堵奶更早更频。
//
// ⚠️ 容量和 expel 不进体质表（用户明确拍板）：
//   - 多奶是产得多，不是容器大——容量跟腺体发育走，体质不改物理容积
//   - 挤出量看当前存量不是点数——体质再乘等于双算，还会造出「存量少也挤出多」
// 查表不掷骰，每胎一致。不认的值回落普通。
export const MILK_CONSTITUTION = Object.freeze({
  少奶: { openWeekShift: +1, produceMult: 0.75 },
  普通: { openWeekShift: 0, produceMult: 1.0 },
  多奶: { openWeekShift: -1, produceMult: 1.25 },
});

export const MILK_CONSTITUTION_KEYS = Object.freeze(Object.keys(MILK_CONSTITUTION));

export function getMilkConstitution(name) {
  return MILK_CONSTITUTION[String(name || '').trim()] || MILK_CONSTITUTION['普通'];
}

// 带体质修正的闸值。openWeek 和 produce 按体质系数调整，其余照抄基准。
// 全链路只此一处做体质修正——调用方拿到的是已修正后的值，不用各处再乘。
export function getMilkGateAdjusted(gateName, constitutionName) {
  const gate = getMilkGate(gateName);
  const con = getMilkConstitution(constitutionName);
  return Object.freeze({
    ...gate,
    openWeek: Math.max(1, gate.openWeek + con.openWeekShift),
    produce: gate.produce * con.produceMult,
    // leak 也按 produceMult 等比缩放——漏是产量的一部分，不能只缩产不缩漏
    leak: gate.leak * con.produceMult,
  });
}

// ── 喷乳概率表（TASK-06 2026-09-04 拍板）──────────────────────────────
// 形状照尿意应激漏表（URINE_STRESS_LEAK 模式）插值：触发时高、非触发时低。
// 「触发」= 大档高潮（催产素峰值）或乳头持续刺激或排乳动作；
// 「非触发事件」= 用力/咳嗽等应激——喷乳不是应激反射，概率极低。
// 只有 canSpray=true 的档（松/全开）才进这张表。
// 两行四档：松/全开各两列（触发/非触发），中间档（紧/中）canSpray=false 不喷。
export const MILK_SPRAY_CHANCE = Object.freeze({
  松:   { triggered: 0.25, untriggered: 0.05 },
  全开: { triggered: 0.45, untriggered: 0.15 },
});

export function getMilkSprayChance(gateName, triggered) {
  const table = MILK_SPRAY_CHANCE[String(gateName || '').trim()];
  if (!table) return 0;
  return triggered ? table.triggered : table.untriggered;
}

// ── 排乳反射建立（TASK-06 2026-09-04 拍板）────────────────────────────
// 开奶周后 3 天内没有排乳反射——吸不出多少；3 天后建立，一次吸吮/哺乳当场提前。
// 反射建立后写入 milk.reflectReady=true，不再重置。
export const MILK_LETDOWN_ESTABLISH_HOURS = 72;  // 3 天

// ── 满档溢出承接（TASK-06 2026-09-04 拍板）────────────────────────────
// 满档时加不进的量不静默丢弃，而是触发溢出表现：
// 全开档 → 自发往外流（seepThreshold=0 本来就在走）；
// 松/中/紧档 → 触发喷乳检定（按喷概率表），检定失败则值钳在容量（不丢、不爆）。
// 这条在 tools.js 的 addMetabolismValue 之后由 resolveMilkOverflow 处理。
export const MILK_OVERFLOW_SPRAY_BONUS = 0.15;  // 溢出时喷概率额外加成

// 容量随发育长：开奶周那天最小，足月到满值。按天插值不挂阶段——挂阶段会出台阶。
// 下限不能给 0：getMetabolismLevel 里 Math.max(1, cap) 会把极小容量放大成
// 「存 1 点就爆档」。18 是 BASE 的 12%，对应早期顶满也就几十毫升那个量级。
export const MILK_CAPACITY_MIN = 18;
export const MILK_FULL_TERM_DAYS = 280;

// 发育进度与容量算在这里，是因为面板（index.js）和引擎（tools.js）必须读同一份：
// 面板那根条画的是「存量 ÷ 容量」，容量若在两边各算一次，早期的百分比会对不上。
// 按天插值不挂阶段——挂阶段会在阶段交界处出台阶。
// 体质修正（openWeek ±1）在此处生效：多奶提前一周开奶、少奶推后一周。
// 容量不乘体质系数——多奶是产得多不是容器大（见上方 MILK_CONSTITUTION 注释）。
export function getMilkDevelopmentFromDays(gateName, constitutionName, effectivePregnantDays, isPregnant) {
  if (!isPregnant) return 0;
  const gate = getMilkGateAdjusted(gateName, constitutionName);
  const days = Math.max(0, Number(effectivePregnantDays) || 0);
  if (days < gate.openWeek * 7) return 0;
  const span = Math.max(1, MILK_FULL_TERM_DAYS - gate.openWeek * 7);
  return Math.max(0, Math.min(1, (days - gate.openWeek * 7) / span));
}

// 非孕期返回 BASE：那时候里面一滴奶都没有，胀是黄体素造成的、走月经周期那条路，
// 顶多到低档（0.15×24×12≈43，占 150 的 29%）。返回 BASE 才能让那 43 读成低档。
export function getMilkCapacityFromDays(gateName, constitutionName, effectivePregnantDays, isPregnant) {
  const development = getMilkDevelopmentFromDays(gateName, constitutionName, effectivePregnantDays, isPregnant);
  if (development <= 0) return BASE_METABOLISM_CAP;
  return Math.round(MILK_CAPACITY_MIN + (BASE_METABOLISM_CAP - MILK_CAPACITY_MIN) * development);
}

// ── 尿意线值（TASK-02 档位重设计 2026-09-03 定稿，2026-09-04 落码）────
// 满档(urge) = 六档「满」的下界 = 她想去了；上限(hard) = 爆档顶。
// 地板(floor) = 胎头/子宫压着排不掉的部分，另见表；残值 = 排不干净的可清部分，绝对值。
// 排完落点 = 地板 + 残值（绝对值相加，验算全表见 trellis/TASK-02_档位重设计_讨论记录.md §五）。
// 「逾期」阶段按 prolonged 分流：自然逾期（默认）/ 延产（AI 声明：延产药、过期妊娠体质等）。
const URINE_LINES = Object.freeze({
  非孕: { urge: 100, hard: 150 },
  孕早期: { urge: 88, hard: 123 },
  孕中期: { urge: 80, hard: 102 },
  孕晚期: { urge: 60, hard: 72 },
  临产期: { urge: 56, hard: 64 },
  自然逾期: { urge: 52, hard: 57 },
  延产: { urge: 48, hard: 51 },
  产后恢复: { urge: 72, hard: 94 },
  // 产程段（总表未单列，按邻接逻辑推定；第二产程走锁定机制不走本表涨落）
  产兆前驱: { urge: 56, hard: 64 },   // = 临产期
  第一产程: { urge: 36, hard: 39 },   // = 临产·入盆满深
  第二产程: { urge: 36, hard: 39 },   // 值锁定 10，本表仅供边界读数
  第三产程: { urge: 48, hard: 56 },   // 胎盘娩出期压力骤减（推定）
});

// 非孕基线与「非孕」行同值，保留供旧调用点兜底。
const URINE_BASE_LINES = Object.freeze({ urge: 100, hard: BASE_METABOLISM_CAP });

// 入盆是整条曲线上唯一的断点：胎头压住膀胱底。
// 一个胎头压住就到顶，第二个挤不进同一个骨盆入口，压的还是同一个膀胱——
// 入盆满深的目标值不随胎数变（二值），多胎的差别走产量/地板/失败率（URINE_MULTIPLE）。
// 修正量随基础阶段递增：越拖到后面胎头越大，压得越狠。
// 满深时上限 = 满档 + 3（四行同构，插值时 hard 独立插向该目标）。
const URINE_ENGAGED_DELTA = Object.freeze({
  孕晚期: { floor: +9, urge: -8, residual: 0 },
  临产期: { floor: +4, urge: -20, residual: -2 },
  自然逾期: { floor: +6, urge: -12, residual: 0 },
  延产: { floor: +4, urge: -12, residual: -1 },
});
const URINE_ENGAGED_HARD_MARGIN = 3;

// ── 性欲的三条线 ─────────────────────────────────────────────────────
// 三个词必须分开，别混用：
//   起点（floor）＝ 什么都不做时她待在哪。停手之后往这儿落，不落回 0。
//   满线（urge） ＝ 她自己知道想要了，开始压着。**过线本身什么都不发生。**
//   天花板（hard）＝ 值的上限。
// 孕期改的是前两个，**不改闸的触发线**。
//
// 为什么是按天插值而不是挂阶段：挂阶段会在阶段交界处出台阶
//（旧的 getLibidoCap 用 Math.floor(days/28) 按月取整，就是这个毛病）。
//
// 早孕这一段不是单调的：先降到谷底，再回到孕前，然后才开始往上。
// 只压倍率不行——那样她还坐在一个不低的起点上（看着像想要），只是碰她没反应，
// 那是孕晚期那张脸，不是孕早期。所以起点要真的降下去。
//
// ⚠️ 早孕跟尿意反着走：尿意全程往下压（更容易想尿），
// 性欲早孕是**距离拉长**（98 比非孕的 82 还长），更不容易起念。
// 同源的只是「用两条线切桶深」这个做法，不是照抄尿意那张孕期表。
const LIBIDO_BASE_LINES = Object.freeze({ floor: 18, urge: 100, hard: BASE_METABOLISM_CAP });

const LIBIDO_KEYFRAMES = Object.freeze([
  { day: 0, floor: 18, urge: 100, hard: 150 },   // 刚怀上没变化
  { day: 65, floor: 10, urge: 108, hard: 150 },  // 反应最重（约 9~10 周）降到底
  { day: 91, floor: 18, urge: 100, hard: 150 },  // 约 13 周回到孕前，之后转为上升
  { day: 189, floor: 32, urge: 88, hard: 128 },  // 孕中（满线从这里就开始降）
  { day: 252, floor: 42, urge: 72, hard: 104 },  // 孕晚·入盆前
  { day: 280, floor: 43, urge: 69, hard: 100 },  // 临产期末（2026-09-04 拍板：独立值，往更严重方向）
]);

// 逾期双分支（TASK-05 第二批拍板）：280 天起不再钉孕晚值。
// 自然逾期 = 默认（盆腔充血到顶但激素在退）；延产 = AI 声明 prolonged 后
// （延产药/过期妊娠体质等），激素还在高位顶着，四段里最窄。
const LIBIDO_OVERDUE_LINES = Object.freeze({
  自然逾期: { floor: 44, urge: 66, hard: 96 },
  延产: { floor: 46, urge: 62, hard: 92 },
});

// 入盆从二值覆盖改为「基础 + 修正量 × 深度」插值（跟尿意同构）：
// 起点都被胎头压到 50（骨盆容量物理上限），满线越往后砸越低——
// 延产+入盆余量只剩 4，真正「一点就到满」。修正量随基础阶段递增。
const LIBIDO_ENGAGED_DELTA = Object.freeze({
  孕晚期: { floor: +8, urge: -14, hard: -32 },
  临产期: { floor: +7, urge: -12, hard: -29 },
  自然逾期: { floor: +6, urge: -10, hard: -26 },
  延产: { floor: +4, urge: -8, hard: -24 },
});

const LIBIDO_POSTPARTUM_LINES = Object.freeze({ floor: 20, urge: 90, hard: 130 });

export function getLibidoLines(stage, effectivePregnantDays = 0, engagedCount = 0, isPregnant = false, prolonged = false, progress = null) {
  if (stage === '产后恢复') return LIBIDO_POSTPARTUM_LINES;
  if (!isPregnant) return LIBIDO_BASE_LINES;

  const days = Math.max(0, Number(effectivePregnantDays) || 0);
  const engagedCountNum = Number(engagedCount) || 0;
  // 逾期双分支：280 天起按声明分流（插值出口在此，帧表最后一天是临产末）。
  const base = days >= 280
    ? LIBIDO_OVERDUE_LINES[prolonged ? '延产' : '自然逾期']
    : (() => {
      const frames = LIBIDO_KEYFRAMES;
      if (days <= frames[0].day) return frames[0];
      const last = frames[frames.length - 1];
      if (days >= last.day) return last;
      for (let i = 1; i < frames.length; i += 1) {
        const b = frames[i];
        if (days > b.day) continue;
        const a = frames[i - 1];
        const span = b.day - a.day;
        const t = span <= 0 ? 0 : (days - a.day) / span;
        return {
          floor: a.floor + (b.floor - a.floor) * t,
          urge: a.urge + (b.urge - a.urge) * t,
          hard: a.hard + (b.hard - a.hard) * t,
        };
      }
      return last;
    })();

  // 入盆插值：实际线 = 基础线 + 修正量 × 入盆深度。未入盆或该阶段无修正 → 基础线。
  // 不传 progress 时保持旧行为（engaged>0 即满深），兼容旧调用点。
  const key = days >= 280 ? (prolonged ? '延产' : '自然逾期') : stage;
  const delta = LIBIDO_ENGAGED_DELTA[key];
  if (engagedCountNum <= 0 || !delta) return base;
  const t = progress === null
    ? 1
    : Math.max(0, Math.min(1, Number(progress)));
  return {
    floor: base.floor + delta.floor * t,
    urge: base.urge + delta.urge * t,
    hard: base.hard + delta.hard * t,
  };
}

// 入盆进度 progress ∈ [0,1]（= clamp((descent − 40) / 60)）：
//   0     = 未入盆，用阶段表原值
//   0→1   = 胎头从骨盆入口（−3 站）压到盆底（+3 站），两条线从阶段值
//           连续压向入盆线 52/62，中间不出台阶
//   不传   = 旧行为（engagedCount 二值切换），兼容旧调用点
export function getUrineLines(stage, engagedCount = 0, progress = null, prolonged = false) {
  // 「逾期」按声明分流：AI 报过延产（药/体质）走延产线，没报走自然逾期。
  const key = stage === '逾期' ? (prolonged ? '延产' : '自然逾期') : stage;
  const base = URINE_LINES[key] ?? URINE_BASE_LINES;
  const delta = URINE_ENGAGED_DELTA[key];
  const engaged = Number(engagedCount) > 0 && delta !== undefined;
  if (progress === null) {
    // 旧行为兼容口：入盆即满深值
    if (!engaged) return base;
    return {
      urge: base.urge + delta.urge,
      hard: base.urge + delta.urge + URINE_ENGAGED_HARD_MARGIN,
    };
  }
  if (!engaged || !(progress > 0)) {
    return base;
  }
  const t = Math.max(0, Math.min(1, Number(progress)));
  const urge = base.urge + delta.urge * t;
  // 上限独立插向「满深满档 + 3」：未入盆的余量在入盆过程中收窄到 3 点。
  const hard = base.hard + ((base.urge + delta.urge + URINE_ENGAGED_HARD_MARGIN) - base.hard) * t;
  return { urge, hard };
}

// 想去那条线：档位的「满」落在这里，也是排空落点的基准。
export function getUrineUrgeCap(stage, engagedCount = 0, progress = null, prolonged = false) {
  return getUrineLines(stage, engagedCount, progress, prolonged).urge;
}

// 收不住那条线：值的硬上限。
export function getUrineHardCap(stage, engagedCount = 0, progress = null, prolonged = false) {
  return getUrineLines(stage, engagedCount, progress, prolonged).hard;
}

// 尿意的档位按两条线切，前松后紧：
// 无/低铺在前段（间距宽，没感觉的区间长），中/高/满往后收窄（越急每一点增量都明显）。
// 憋耐余量（满到爆之间）在孕期急剧缩窄——非孕有50点余量能忍，
// 入盆后只有几步就从满到爆，「到顶了几乎立刻就崩」。
export function getUrineLevel(value, urgeCap, hardCap) {
  const next = Number(value) || 0;
  const urge = Math.max(1, Number(urgeCap) || 1);
  const hard = Math.max(urge + 1, Number(hardCap) || urge + 1);
  // 前松后紧：无30%、低25%、中20%、高15%、满10%（加起来=urge）
  if (next >= urge + ((hard - urge) * 0.5)) return '爆';
  if (next >= urge) return '满';
  if (next >= urge * 0.90) return '高';
  if (next >= urge * 0.75) return '中';
  if (next >= urge * 0.50) return '低';
  return '无';
}

// 排空后的残值（绝对值）：孕早期起排不干净，产程后清零。
// 残值 = 没排干净的尿（能靠双次排尿清掉）。地板（胎头压着排不掉的）另算，见 getUrineFloor。
// 排完落点 = 地板 + 残值（绝对值相加）。
const URINE_RESIDUAL = Object.freeze({
  非孕: 0,
  孕早期: 3,
  孕中期: 8,
  孕晚期: 8,
  临产期: 8,
  自然逾期: 8,
  延产: 10,
  产后恢复: 8,
  产兆前驱: 8,
  第一产程: 6,
  第二产程: 0,   // 锁定机制：值恒 10，不走地板/残值
  第三产程: 0,
});

export function getUrineResidualValue(stage, engagedCount = 0, progress = null, prolonged = false) {
  const key = stage === '逾期' ? (prolonged ? '延产' : '自然逾期') : stage;
  const base = URINE_RESIDUAL[key];
  if (base === undefined) return 0;
  const delta = URINE_ENGAGED_DELTA[key];
  const engaged = Number(engagedCount) > 0 && delta !== undefined;
  if (!engaged) return base;
  if (progress === null) return base + delta.residual;   // 旧行为兼容：入盆即满深值
  if (!(progress > 0)) return base;
  const t = Math.max(0, Math.min(1, Number(progress)));
  return base + delta.residual * t;
}

// 地板：排不掉的压迫感——胎头/子宫压着膀胱底，不是尿，怎么排都减不掉。
// 跟残值（没排干净的尿）拆开：残值能靠双次排尿清掉，地板不能。
// 排完落点 = 地板 + 残值。入盆后地板更高（胎头直接压），按深度插值。
const URINE_FLOOR = Object.freeze({
  非孕: 0,
  孕早期: 0,
  孕中期: 10,
  孕晚期: 16,
  临产期: 22,
  自然逾期: 24,
  延产: 26,
  产后恢复: 5,
  产兆前驱: 22,
  第一产程: 26,
  第二产程: 0,   // 锁定机制：值恒 10
  第三产程: 10,
});

export function getUrineFloor(stage, engagedCount = 0, progress = null, prolonged = false) {
  const key = stage === '逾期' ? (prolonged ? '延产' : '自然逾期') : stage;
  const base = URINE_FLOOR[key];
  if (base === undefined) return 0;
  const delta = URINE_ENGAGED_DELTA[key];
  const engaged = Number(engagedCount) > 0 && delta !== undefined;
  if (!engaged) return base;
  if (progress === null) return base + delta.floor;   // 旧行为兼容：入盆即满深值
  if (!(progress > 0)) return base;
  const t = Math.max(0, Math.min(1, Number(progress)));
  return base + delta.floor * t;
}

// ── 自然产量（点/小时，TASK-02 §三定稿）────────────────────────────
// 弃用旧的 URINE_STAGE_RATE（1.5/2/3/4）倍率与 fetalEnergyDrain 产量链：
// 每阶段固定产量，孕早期 1.3× 已写进 15 点/小时，不再额外乘。
// 第二产程不走产量（值锁定 10，见 tools.js 的锁定逻辑）。
export const URINE_PRODUCTION = Object.freeze({
  非孕: 12,
  孕早期: 15,
  孕中期: 14,
  孕晚期: 15,
  临产期: 16,
  自然逾期: 16,
  延产: 16,
  产兆前驱: 16,
  第一产程: 16,
  第二产程: 0,
  第三产程: 10,   // 胎盘娩出期（推定）
  产后恢复: 13,
});

export function getUrineProduction(stage, prolonged = false) {
  const key = stage === '逾期' ? (prolonged ? '延产' : '自然逾期') : stage;
  return URINE_PRODUCTION[key] ?? 12;
}

// ── 多胎加成（TASK-02 §十二拍板：结构性差异，不是乘积）──────────────
// 产量：补 fetalEnergyDrain 弃用后的洞（两个胎儿代谢废料更多）。
// 地板：两个胎儿压同一个膀胱底，永远排不净的部分更厚。
// 满档：余量更薄（上限跟着满档收）。failRate：尿不尽检定加成。
// 入盆满深不随胎数变（一个胎头就压到顶）；入盆锁天数另见 labor_onset_config.js。
export const URINE_MULTIPLE_PREGNANCY = Object.freeze({
  1: { production: 0, floor: 0, urge: 0, failRate: 0 },
  2: { production: 2.5, floor: 5, urge: -5, failRate: 0.12 },
  3: { production: 4.5, floor: 9, urge: -9, failRate: 0.22 },
});

export function getUrineMultipleAdjust(fetusesCount = 1) {
  const count = Math.max(1, Math.min(3, Math.floor(Number(fetusesCount) || 1)));
  return URINE_MULTIPLE_PREGNANCY[count];
}

// ── 排尿触发线（「又想去」尺子，TASK-02 §四）────────────────────────
// 日常自动排不看满档：非孕/孕早期看中档下界（urge×0.75），其余看高档下界（urge×0.90）。
// 睡眠期间本应看满档（憋醒才去），但引擎没有睡眠状态可读——落码按日常线统一，
// 睡眠线留待有睡眠跟踪时接入。
export function getUrineVoidThreshold(stage, urgeCap, prolonged = false) {
  const key = stage === '逾期' ? (prolonged ? '延产' : '自然逾期') : stage;
  const relaxed = key === '非孕' || key === '孕早期';
  return urgeCap * (relaxed ? 0.75 : 0.90);
}

// ── 出汗对产量的折扣（TASK-02 §十）─────────────────────────────────
// 只减产量不降值；只在出汗那段时间生效。孕期额外打折叠乘，产后排液期持续折扣。
export const URINE_SWEAT_DISCOUNT = Object.freeze({ 轻: 0.85, 中: 0.6, 重: 0.3 });
export const URINE_SWEAT_PREGNANCY_EXTRA = Object.freeze({
  孕早期: 0.95,
  孕中期: 0.9,
  孕晚期: 0.85,
  临产期: 0.85,
  自然逾期: 0.85,
  延产: 0.85,
});
export const URINE_POSTPARTUM_DISCHARGE_DAYS = 5;   // 产后头几天（按 effectivePregnantDays）
export const URINE_POSTPARTUM_DISCHARGE_EXTRA = 0.7;

// 便意反过来吃降速：孕激素让肠蠕动变慢，信号攒得比常人更久。
// 「攒够了也排不出」由 stoolDifficulty 表达，不靠信号涨得慢来假装。
const STOOL_STAGE_RATE = Object.freeze({
  孕早期: 0.8,
  孕中期: 0.6,
  孕晚期: 0.5,
  临产期: 0.5,
  逾期: 0.5,
  产兆前驱: 0.5,
  第一产程: 0.5,
  第二产程: 0.5,
  第三产程: 0.6,
  产后恢复: 0.7,
});

export function getStoolStageRateMultiplier(stage) {
  return STOOL_STAGE_RATE[stage] ?? 1;
}

export function getMetabolismLevel(value, cap = BASE_METABOLISM_CAP) {
  const scale = Math.max(1, Number(cap) || BASE_METABOLISM_CAP) / BASE_METABOLISM_CAP;
  if (value >= 125 * scale) return '爆';
  if (value >= 100 * scale) return '满';
  if (value >= 75 * scale) return '高';
  if (value >= 50 * scale) return '中';
  if (value >= 25 * scale) return '低';
  return '无';
}

// 分档重加权：越接近临界，来源权重整个换掉。
// 高档起基础侧归零——身体到那个程度已经不自己攒了，全靠外部推过线；
// 这一条顺便当刹车，被动积累到满档就停，不会顶着上限反复刷提示。
// decayPerHour 是高位渗漏：值自己往下掉一点，但压迫感留着，
// 这就是「尿完还滴几秒」和「失禁后没有排空后的轻松感」。
const METABOLISM_BAND_WEIGHTS = Object.freeze({
  无: { base: 1, stimulus: 0.5, decayPerHour: 0 },
  低: { base: 1, stimulus: 1, decayPerHour: 0 },
  中: { base: 1, stimulus: 1, decayPerHour: 3 },
  高: { base: 0.5, stimulus: 1.5, decayPerHour: 3 },
  满: { base: 0, stimulus: 2, decayPerHour: 5 },
  爆: { base: 0, stimulus: 2, decayPerHour: 0 },
});

// 尿意要自己一张表（TASK-02 §二）：肾不会因为膀胱满了就停止造尿，
// 尿也不会自己蒸发。于是 base 全程 1（一直在造）、decay 全程 0（不会自己少）。
// 「不会停在满」和「到满必有下文」是同一件事的两面：默认路径过 urge 就把值压回去了，
// 所以正常情况值根本不在满档待着；会待在满档的唯一原因是 urine.holding 为真，
// 而那时候它一定会继续爬到 hard 然后崩。
//
// stimulus 那一列不动——那张表本来就是为尿意调的（憋着时外部刺激更容易挤出来）。
const URINE_BAND_WEIGHTS = Object.freeze({
  无: { base: 1, stimulus: 0.5, decayPerHour: 0 },
  低: { base: 1, stimulus: 1, decayPerHour: 0 },
  中: { base: 1, stimulus: 1, decayPerHour: 0 },
  高: { base: 1, stimulus: 1.5, decayPerHour: 0 },
  满: { base: 1, stimulus: 2, decayPerHour: 0 },
  爆: { base: 1, stimulus: 2, decayPerHour: 0 },
});

// 性欲要自己一张表，不能跟上面那张共用——两者方向正好相反。
// 上面那张是为尿意调的：低档 stimulus 0.5，因为「憋着的时候外部刺激更容易挤出来」。
// 性欲要的是**低位想象有效、高位身体接触有效**，所以 stimulus 一路往上走。
//
// ⚠️ 千万不要图省事写成 key === 'urine' || key === 'libido' 共用一张表。
//
// base 在满／爆归零 ＝ 身体不再自己往上走，再涨只能来自外部。
// decayPerHour 是朝**起点**掉，不是朝 0 掉；而且接触进行中整列不走（硬规则）。
const LIBIDO_BAND_WEIGHTS = Object.freeze({
  无: { base: 0.8, stimulus: 1.15, decayPerHour: 0 },
  低: { base: 0.6, stimulus: 1.25, decayPerHour: 2 },
  中: { base: 0.5, stimulus: 1.20, decayPerHour: 4 },
  高: { base: 0.25, stimulus: 1.40, decayPerHour: 6 },
  满: { base: 0, stimulus: 1.60, decayPerHour: 8 },
  爆: { base: 0, stimulus: 1.80, decayPerHour: 3 },
});

// 性欲的档位跟尿意同一套切法：按**满线**切，不按天花板等比缩放。
// 差别只在入盆那一段暴露出来，但那一段正好是口径写明了数的地方：
//   入盆后 起点 50／满线 58／天花板 72。口径 §八 说「起点 50 落在高档」。
//   按天花板等比缩放的话，满档门槛 = 100×72/150 = 48，于是她**坐在起点什么都不做
//   就读成「满」**——而满档的分档权重里基础侧是 0、外部刺激 ×1.6，
//   等于把「悬在满、但去不了」错成「已经在临界」。
// 其余三段两种切法结果一致，是因为那三段的满线／天花板比例都在 2/3 附近，
// 恰好撞上 getMetabolismLevel 的 100/150。**这是巧合，不是对齐。**
export function getLibidoLevel(value, urgeCap, hardCap) {
  const v = Number(value) || 0;
  const urge = Math.max(1, Number(urgeCap) || 1);
  const hard = Math.max(urge + 1, Number(hardCap) || urge + 1);
  if (v >= urge + (hard - urge) * 0.5) return '爆';
  if (v >= urge) return '满';
  // 性欲六档是等分铺在 0→满线（TASK-05 §3.1：无<25%、低25-49%、中50-74%、高75-99%），
  // 不是尿意的前松后紧——口径 §八「入盆后起点 50 落在高档」只有等分才成立（50/58=86%）。
  const r = v / urge;
  if (r >= 0.75) return '高';
  if (r >= 0.5) return '中';
  if (r >= 0.25) return '低';
  return '无';
}

// 性欲要自己一张表，不能跟代谢那张共用——两者方向正好相反。
// 那张是为尿意调的：低档 stimulus 0.5，因为「憋着的时候外部刺激更容易挤出来」。
// 性欲要的是**低位想象有效、高位身体接触有效**，所以 stimulus 一路往上走。
//
// base 在满／爆归零 ＝ 身体不再自己往上走，再涨只能来自外部。
// decayPerHour 是朝**起点**掉，不是朝 0 掉；而且接触进行中整列不走（硬规则）。
export function getLibidoBandWeights(value, urgeCap, hardCap) {
  return LIBIDO_BAND_WEIGHTS[getLibidoLevel(value, urgeCap, hardCap)] || LIBIDO_BAND_WEIGHTS['无'];
}

export function getMetabolismBandWeights(value, cap = BASE_METABOLISM_CAP) {
  return METABOLISM_BAND_WEIGHTS[getMetabolismLevel(value, cap)] || METABOLISM_BAND_WEIGHTS['无'];
}

// 尿意的分档权重按两条线切。「满」是越过了想去那条线，基础侧就此归零——
// 身体不再自己往上攒，之后每一点都来自外部刺激或憋着不去。
export function getUrineBandWeights(value, urgeCap, hardCap) {
  return URINE_BAND_WEIGHTS[getUrineLevel(value, urgeCap, hardCap)] || URINE_BAND_WEIGHTS['无'];
}

// 憋耐余量的消耗比例：0 = 刚到「该去了」，1 = 抵到「收不住」。
// urge 之下一律为 0——那段是正常充盈，不是在硬撑。
export function getUrineReserveRatio(value, urgeCap, hardCap) {
  const next = Number(value) || 0;
  const urge = Math.max(1, Number(urgeCap) || 1);
  const hard = Math.max(urge + 1, Number(hardCap) || urge + 1);
  if (next <= urge) return 0;
  return Math.min(1, (next - urge) / (hard - urge));
}

// 漏尿分两种，成因完全不同，所以判据也不同：
//
// 一、应激性漏尿（stress）——「盆底关不紧」。在 urge 之下也会发生，因为问题不是
//    量太多而是闸门坏了：打喷嚏、咳嗽、笑、弯腰、上楼梯都能挤出来一点。
//    这一种要看盆底状态：健康的非孕角色不会因为膀胱半满就漏。
//
// 二、憋不住（urgency→hard）——「量真的到顶了」。这一种谁都会，跟阶段无关：
//    正常人憋到 hard 一样会尿出来，只不过她的 hard 是 150、余量厚得多。
//    这就是两条线必须分开的理由：urge 之上那段是「还能撑」，
//    抵到 hard 就是撑不住，任何人都一样。
// 越过 urge 之后应激性漏尿反而最容易发生——膀胱已经撑满，闸门本来就关不紧，
// 一个喷嚏就挤出来一截。这几档不能留空：留空会让「想去」之上只剩全失禁一种结果，
// 而那是最该出现「漏一点、还能撑住」的区间。

// 应激漏尿用两张表插值：概率 = lerp(健康表[档], 最差表[档], 盆底系数)。
// 右边那一列就是入盆满深度 / 产后初期的最差状态。爆档谁都漏（膀胱到顶，
// 括约肌余量有限），中档只有盆底受损的人才漏——所以低档不缩放、高档往 0.50 去。
const URINE_STRESS_LEAK_HEALTHY = Object.freeze({
  无: 0,
  低: 0,
  中: 0.02,
  高: 0.10,
  满: 0.25,
  爆: 0.50,
});
const URINE_STRESS_LEAK_WORST = Object.freeze({
  无: 0,
  低: 0.05,
  中: 0.18,
  高: 0.50,
  满: 0.75,
  爆: 0.90,
});

// 孕周盆底基础曲线：按 effectivePregnantDays 做关键帧插值（照 LIBIDO_KEYFRAMES 的做法，
// 理由同：挂阶段会在交界处出台阶）。
// 非孕 = 0；刚怀上松弛素在动（0.06）；孕中期开始有（0.14）；孕晚期明显上去（0.38）；
// 临产期继续涨（0.62）；足月 0.72；逾期继续涨到 0.82 封顶；产后 0.90 起回落到 0.45。
const URINE_FLOOR_KEYFRAMES = Object.freeze([
  { day: 0, coef: 0.06 },
  { day: 91, coef: 0.14 },    // 孕中期开始
  { day: 189, coef: 0.38 },   // 孕晚期开始
  { day: 252, coef: 0.62 },   // 临产期开始
  { day: 280, coef: 0.72 },   // 足月
  { day: 287, coef: 0.78 },   // 逾期第一周
  { day: 294, coef: 0.82 },   // 逾期第二周，之后封顶
]);

// 产后回落曲线：产后初期最差（0.90），约 180 天回落到 0.45，不回孕前。
const URINE_POSTPARTUM_KEYFRAMES = Object.freeze([
  { day: 0, coef: 0.90 },
  { day: 90, coef: 0.68 },
  { day: 180, coef: 0.45 },
]);

// 产程段盆底系数：产兆前驱比逾期再高一点；第二产程最狠（胎头在产道里撑着）。
const URINE_LABOR_FLOOR_COEF = Object.freeze({
  产兆前驱: 0.85,
  第一产程: null,   // 走深度 1.0 的满值
  第二产程: null,   // 所有档 ×1.5 钳 0.95，单独处理
  第三产程: null,   // 走深度 1.0 的满值
});

// 入盆加成上限：深度 1.0 时叠在孕周基数上额外加多少。
// 入盆 1.0 对应的最差表中档 0.18，孕周 280 天基数 0.72 时插值已经 0.17——
// 但入盆后基数可能不到 0.72（38 周入盆时基数 0.62），所以加成要补这个差。
const URINE_ENGAGEMENT_BONUS_MAX = 0.28;

// 孕周盆底基础系数：只在真孕期／产程／产后有意义，非孕返回 0。
export function getUrineFloorCoefficient(stage, effectivePregnantDays = 0) {
  if (stage === '产后恢复') {
    const days = Math.max(0, Number(effectivePregnantDays) || 0);
    const frames = URINE_POSTPARTUM_KEYFRAMES;
    if (days <= frames[0].day) return frames[0].coef;
    const last = frames[frames.length - 1];
    if (days >= last.day) return last.coef;
    for (let i = 1; i < frames.length; i += 1) {
      const b = frames[i];
      if (days > b.day) continue;
      const a = frames[i - 1];
      const span = b.day - a.day;
      const t = span <= 0 ? 0 : (days - a.day) / span;
      return a.coef + (b.coef - a.coef) * t;
    }
    return last.coef;
  }
  // 产程段
  if (stage === '产兆前驱') return URINE_LABOR_FLOOR_COEF['产兆前驱'];
  if (stage === '第一产程' || stage === '第三产程') return 1.0; // 等价深度满值
  if (stage === '第二产程') return 1.0;
  // 真孕期（孕早／孕中／孕晚／临产／逾期）按天插值
  const trueStages = ['孕早期', '孕中期', '孕晚期', '临产期', '逾期'];
  if (!trueStages.includes(stage)) return 0;
  const days = Math.max(0, Number(effectivePregnantDays) || 0);
  const frames = URINE_FLOOR_KEYFRAMES;
  if (days <= frames[0].day) return frames[0].coef;
  const last = frames[frames.length - 1];
  if (days >= last.day) return last.coef;
  for (let i = 1; i < frames.length; i += 1) {
    const b = frames[i];
    if (days > b.day) continue;
    const a = frames[i - 1];
    const span = b.day - a.day;
    const t = span <= 0 ? 0 : (days - a.day) / span;
    return a.coef + (b.coef - a.coef) * t;
  }
  return last.coef;
}

// 入盆加成：跟孕周完全独立。深度 0 = 没入盆 = 0 加成；
// 深度 1.0 = 满加成（0.28）。中间线性，叠在孕周基数上面。
export function getUrineEngagementBonus(engagedCount = 0, progress = null) {
  if (Number(engagedCount) <= 0) return 0;
  if (progress === null) return URINE_ENGAGEMENT_BONUS_MAX; // 旧行为：入盆即满值
  const t = Math.max(0, Math.min(1, Number(progress)));
  return URINE_ENGAGEMENT_BONUS_MAX * t;
}

// 最终盆底系数 = 孕周基础 + 入盆加成，钳 [0, 1]。
// 第二产程另算：直接返回 1.0（所有档 ×1.5 的效果在调用处处理）。
export function getUrineFloorFactor(stage, effectivePregnantDays = 0, engagedCount = 0, progress = null) {
  const base = getUrineFloorCoefficient(stage, effectivePregnantDays);
  const bonus = getUrineEngagementBonus(engagedCount, progress);
  return Math.max(0, Math.min(1, base + bonus));
}

// 是否在应激漏尿的适用阶段——非孕完全 0（健康盆底不漏）。
// 产后也算（盆底没恢复）。
export function canUrineStressLeak(stage) {
  const s = String(stage || '');
  return s !== '' && s !== '假孕期' && !['卵泡期', '排卵期', '黄体期', '月经期', '无经期', '未激活'].includes(s);
}

// 憋耐余量吃掉多少就有多大概率崩：刚过 urge 时几乎还是稳的，
// 抵到 hard 必然失禁。曲线取平方，让前半段撑得住、末尾陡然崩掉——
// 「等厕所那五分钟还行，再撑两分钟就不行了」。
export function getUrineUrgencyBreakChance(value, urgeCap, hardCap) {
  const ratio = getUrineReserveRatio(value, urgeCap, hardCap);
  if (ratio <= 0) return 0;
  if (ratio >= 1) return 1;
  return ratio * ratio;
}

// 应激漏尿概率：两张表按盆底系数插值，第二产程 ×1.5 钳 0.95。
// 新签名：getUrineStressLeakChance(value, urgeCap, hardCap, factor, null, stage, days)
//   factor 是已算好的盆底系数（0-1），由调用方先调 getUrineFloorFactor 算好。
// 旧签名兼容：getUrineStressLeakChance(value, urgeCap, hardCap, engagedCount, progress)
//   不传 stage 时走旧逻辑（engagedCount + progress 算 factor），但旧逻辑已被
//   新的插值表取代——只用于还没改的调用点，行为不完全等价旧版。
export function getUrineStressLeakChance(value, urgeCap, hardCap, factorOrEngagedCount = 0, progress = null, stage = '', effectivePregnantDays = 0) {
  const level = getUrineLevel(value, urgeCap, hardCap);
  let factor;
  if (stage) {
    // 新签名：调用方传了 stage，用 factorOrEngagedCount 当 factor
    factor = Math.max(0, Math.min(1, Number(factorOrEngagedCount) || 0));
  } else {
    // 旧签名兼容：没传 stage，用 engagedCount + progress 算 factor
    factor = getUrineFloorFactor('', 0, Number(factorOrEngagedCount) || 0, progress);
  }
  const healthy = URINE_STRESS_LEAK_HEALTHY[level] ?? 0;
  const worst = URINE_STRESS_LEAK_WORST[level] ?? 0;
  let chance = healthy + (worst - healthy) * factor;
  // 第二产程 ×1.5 钳 0.95
  if (stage === '第二产程') chance = Math.min(0.95, chance * 1.5);
  return Math.max(0, Math.min(0.95, chance));
}

// 漏出量按档递增。kind 决定出声通道：渗漏不出声，漏尿走 secondly。
// 这张表只管「漏了一点、还能撑住」——彻底失禁归 getUrineUrgencyBreakChance，
// 两条路不重叠，否则同一次判定会既算漏又算失禁。
// 落值是绝对量，跟压完的两条线同尺。
// extent 只描述量与范围，不写载体：角色可能穿着内裤、护垫、和服，也可能什么都没穿，
// 引擎不该替她安排。落到什么上面由叙事按当前衣着自己判断。
export const URINE_LEAK_TIERS = Object.freeze({
  中: { kind: 'seep', drop: [3, 6], extent: '仅几滴，只够洇开指甲盖大小一块' },
  高: { kind: 'leak', drop: [5, 8], extent: '一小股，洇开直径三五公分' },
  满: { kind: 'leak', drop: [8, 12], extent: '一股，洇开直径五到八公分' },
  爆: { kind: 'leak', drop: [12, 18], extent: '大量涌出，顺着腿往下流' },
});

export function getUrineLeakTier(value, urgeCap, hardCap) {
  return URINE_LEAK_TIERS[getUrineLevel(value, urgeCap, hardCap)] || null;
}

// 抵到 hard 那一刻是彻底失禁，不掷骰：量到顶了就是到顶了。
// 排空到什么程度看情境：能躺下能进厕所才排得干净，站在原地失禁则残留得多。
// 判据换成「有没有真的去处理」——所以失禁只落到残值线，不当成一次排空。
// 所以这里只落到残值线，剩下的压迫感留着，下一次很快又满。
//
// 基数必须是 urge 而不是 hard：入盆后两条线只差 10 点，拿 hard 算残值会得出
// 「失禁后剩得比主动上厕所还多」，下一小时必然又抵到 hard，一夜漏十几次。
// 以 urge 为基数则失禁后一定低于主动排空的结果，只是仍高于正常残值。
export const URINE_INCONTINENCE_RESIDUAL_RATIO = 0.45;

// §八 高潮失禁：逼尿肌收缩，不是潮吹。潮吹不从膀胱走、不减值，两者独立掷。
// 跟应激漏尿不共用插值，因为逼尿肌收缩跟盆底强不强没关系——非孕也会发生。
// 孕期改的是整体高度，不是曲线形状，所以这里是乘法：
//   概率 = 档位表[档] × (1 + 0.5 × 盆底系数)
// 无档 = 0 有意：空膀胱没东西可排，先去一趟就能避开。
const URINE_ORGASM_INCONTINENCE_BASE = Object.freeze({
  无: 0,
  低: 0.10,
  中: 0.22,
  高: 0.40,
  满: 0.58,
  爆: 0.70,
});

// 高潮失禁落量表：中低档就有整股（收缩，不是渗出）。
// 跟应激漏尿 URINE_LEAK_TIERS 落值不同——应激漏尿中档只有几滴。
export const URINE_ORGASM_DROP = Object.freeze({
  低: [6, 10],
  中: [10, 16],
  高: [14, 22],
  满: [18, 28],
  爆: [22, 35],
});

// 概率 = 档位表[档] × (1 + 0.5 × 盆底系数)，钳 0.95。
// factor 是已算好的盆底系数（0-1），跟应激漏尿共用 getUrineFloorFactor 的结果。
export function getUrineOrgasmIncontinenceChance(value, urgeCap, hardCap, factor = 0) {
  const level = getUrineLevel(value, urgeCap, hardCap);
  const base = URINE_ORGASM_INCONTINENCE_BASE[level] ?? 0;
  if (base <= 0) return 0;
  const f = Math.max(0, Math.min(1, Number(factor) || 0));
  const chance = base * (1 + 0.5 * f);
  return Math.max(0, Math.min(0.95, chance));
}

// 落值区间，调用方 randomInt。
export function getUrineOrgasmDropRange(level) {
  return URINE_ORGASM_DROP[level] || [0, 0];
}

// §九 排不出来：不是只有入盆才有——整个孕期子宫的重量都压着膀胱底和尿道，
// 越往后压迫越重，入盆是额外加成叠上去。跟应激漏尿那条盆底系数同思路：
// 孕周基础曲线 + 入盆加成。
//   起不了流 = 排尿失败，值不减，20分钟冷却
//   断断续续 = 排出量打七折，残值 ×1.3
// 姿势抵扣：站姿/后仰减概率，有人托肚子减更多。抵扣是临时减概率，不进值。
// stage 走产程段（第一/第二/第三产程、产兆前驱、产后恢复），真孕期按 effectivePregnantDays 插值。
// 产后48h 内单独一行：stage='产后恢复' 且 effectivePregnantDays ≤ 2（48小时）。

// 孕周排不出来基础曲线：非孕 = 0；孕中期开始有（子宫够大开始压）；
// 孕晚期明显上去；临产/逾期继续涨。按 effectivePregnantDays keyframe 插值。
const URINE_VOID_DIFFICULTY_KEYFRAMES = Object.freeze([
  { day: 0, noFlow: 0, intermittent: 0 },
  { day: 84, noFlow: 0.02, intermittent: 0.05 },    // 孕中期开始
  { day: 189, noFlow: 0.05, intermittent: 0.12 },  // 孕晚期开始
  { day: 252, noFlow: 0.08, intermittent: 0.18 },  // 临产期
  { day: 280, noFlow: 0.10, intermittent: 0.22 },  // 足月
  { day: 294, noFlow: 0.12, intermittent: 0.25 },  // 逾期封顶
]);

// 入盆加成：深度 0.6 起叠在孕周基数上面。0.6 对应入盆过半——胎头开始直接压尿道。
// 满深度(1.0)时加成最大，跟之前设计文档的值对齐：noFlow 0.18、intermittent 0.40。
// 所以加成上限 = 满深度值 − 足月基数（0.10 / 0.22），深度 0.6 时加一半。
const URINE_VOID_ENGAGEMENT_NOFLOW_MAX = 0.08;       // 0.18 - 0.10
const URINE_VOID_ENGAGEMENT_INTERMITTENT_MAX = 0.18;  // 0.40 - 0.22

export function getUrineVoidDifficulty(stage = '', engagedCount = 0, progress = 0, effectivePregnantDays = 0, postureDiscount = 0) {
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  const discount = Math.max(0, Number(postureDiscount) || 0);

  let noFlow = 0;
  let intermittent = 0;

  // 产程段走固定值
  if (stage === '第一产程') {
    noFlow = 0.35; intermittent = 0.50;
  } else if (stage === '第二产程') {
    noFlow = 0.55; intermittent = 0.65;
  } else if (stage === '第三产程') {
    noFlow = 0; intermittent = 0;
  } else if (stage === '产兆前驱') {
    noFlow = 0; intermittent = 0;
  } else if (stage === '产后恢复') {
    const days = Math.max(0, Number(effectivePregnantDays) || 0);
    if (days <= 2) {
      noFlow = 0.25; intermittent = 0.35;
    }
  } else {
    // 真孕期：孕周基础曲线 + 入盆加成
    const trueStages = ['孕早期', '孕中期', '孕晚期', '临产期', '逾期'];
    if (trueStages.includes(stage)) {
      const days = Math.max(0, Number(effectivePregnantDays) || 0);
      // 孕周基数 keyframe 插值
      const frames = URINE_VOID_DIFFICULTY_KEYFRAMES;
      if (days <= frames[0].day) {
        noFlow = frames[0].noFlow;
        intermittent = frames[0].intermittent;
      } else {
        const last = frames[frames.length - 1];
        if (days >= last.day) {
          noFlow = last.noFlow;
          intermittent = last.intermittent;
        } else {
          for (let i = 1; i < frames.length; i += 1) {
            const b = frames[i];
            if (days > b.day) continue;
            const a = frames[i - 1];
            const span = b.day - a.day;
            const t = span <= 0 ? 0 : (days - a.day) / span;
            noFlow = a.noFlow + (b.noFlow - a.noFlow) * t;
            intermittent = a.intermittent + (b.intermittent - a.intermittent) * t;
            break;
          }
        }
      }
      // 入盆加成：深度 0.6 起线性
      if (Number(engagedCount) > 0 && p >= 0.6) {
        const t = (p - 0.6) / 0.4;
        noFlow += URINE_VOID_ENGAGEMENT_NOFLOW_MAX * t;
        intermittent += URINE_VOID_ENGAGEMENT_INTERMITTENT_MAX * t;
      }
    }
    // 非孕 / 月经期等 = 0
  }

  return {
    noFlow: Math.max(0, noFlow - discount),
    intermittent: Math.max(0, intermittent - discount),
  };
}

// 姿势抵扣表：站姿/后仰减概率，有人托肚子减更多。
// 值是减概率的绝对量，不是系数。
export const URINE_VOID_POSTURE_DISCOUNT = Object.freeze({
  stand_lean_back: 0.08,     // 站姿/后仰（入盆深度 0.6-0.99 的基础抵扣）
  stand_lean_back_full: 0.15, // 站姿/后仰（入盆深度 1.0 的满抵扣）
  support_belly: 0.20,        // 有人托肚子（产程基础抵扣）
  support_belly_full: 0.30,   // 有人托肚子（第二产程满抵扣）
  // 组合：站姿 + 托肚子 = 两个抵扣取较大值（不叠加，因为一个站一个托是替代关系）
});

// 断断续续排出折扣
export const URINE_INTERMITTENT_DROP_RATIO = 0.7;   // 排出量打七折
export const URINE_INTERMITTENT_RESIDUAL_MULT = 1.3; // 残值 ×1.3

// 推时间的默认假设是「她自己去了」。
//
// 这条必须有，否则引擎把每一段没写到厕所的时间都当成她在硬憋：入盆后一小时积累约
// 56 点、余量只有 10，光推时间就能让她每小时失禁一次。孕晚期一天十几二十趟本来就是
// 背景，正文不会逐趟写，模型也不会逐趟递 bsExcreteMetabolism——那么「没递」应当读作
// 「不值得写」，而不是「她没去」。
//
// 于是憋不憋成了一个显式状态：urine.holding 为真才算她去不了（被场合、他人、束缚
// 或手头的事困住），这时候值才会往硬线爬，失禁才有资格发生。默认为假 = 该去就去了。
// 趟数不进正文，但记在 voidsToday 里，状态栏想显示频率时有处可取。
export const URINE_ROUTINE_VOID = Object.freeze({
  // 一小时的积累可能够她跑两三趟，按越过 urge 的份数折算，不是每小时封顶一趟。
  countTripsByOverflow: true,
  maxTripsPerTick: 30,
});

// 便意是两条轴：信号（stool，显示）与阻力（stoolDifficulty，不显示）。
// 信号过阈值时拿阻力做一次检定，失败则信号退回、天数 +1、阻力再涨一格；
// 于是「1-2 天 → 3 天 → 4-5 天 → 5-7 天」那种越拖越难的递进不用写死，自己长出来。
export const STOOL_CHECK = Object.freeze({
  signalThresholdRatio: 0.5,
  failSignalRetainRatio: 0.6,
  failDayStep: 12,
  failDayCap: 60,
  successDifficultyRelief: 20,
  // 用力时怕把孩子弄出来——不敢用力本身就是阻力。
  stressThreshold: 120,
  stressBonus: 10,
  ironBonus: 12,
  dehydrationBonus: 10,
  // 坐姿 90° 对蹲姿 130-140°：肛直角打开才排得出。
  squatRelief: 18,
  fiberRelief: 10,
  hydrationRelief: 8,
  // 出声阈值：连着几天排不出来才值得写，单次「想去」不出声。
  notifyFailDays: 3,
});

// 孕激素底噪按孕周走。
const STOOL_STAGE_DIFFICULTY = Object.freeze({
  孕早期: 5,
  孕中期: 12,
  孕晚期: 20,
  临产期: 24,
  逾期: 26,
  产兆前驱: 26,
  第一产程: 26,
  第二产程: 20,
  第三产程: 12,
  产后恢复: 18,
});

// 直肠在后方，被压的是整个子宫下段的重量：两胎都下来时确实比一胎重，
// 所以这一项按入盆胎数递增——跟膀胱那边的二值判法不同。
const STOOL_ENGAGED_MULTIPLIER = Object.freeze([0, 1, 1.5, 1.8]);
const STOOL_ENGAGED_BASE = 10;

// 直肠被整个子宫下段的重量压：胎数维度保留（第二个胎头叠加重量的语义），
// 深度再乘一份——progress = clamp((descent − 40) / 60)，刚越过入口几乎没有，
// 完全入盆（progress 1）等于旧的全值，两端对齐、中间连续。
export function getStoolEngagedDifficulty(engagedCount = 0, progress = null) {
  const count = Math.max(0, Math.floor(Number(engagedCount) || 0));
  const multiplier = STOOL_ENGAGED_MULTIPLIER[Math.min(count, STOOL_ENGAGED_MULTIPLIER.length - 1)];
  if (count <= 0) return 0;
  if (progress === null) return STOOL_ENGAGED_BASE * multiplier;
  const t = Math.max(0, Math.min(1, Number(progress)));
  return STOOL_ENGAGED_BASE * multiplier * t;
}

export function getStoolStageDifficulty(stage) {
  return STOOL_STAGE_DIFFICULTY[stage] ?? 0;
}
