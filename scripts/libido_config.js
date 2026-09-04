// 性欲的两个判定与三个隐藏量。
//
// 这个文件的地基是一句话：**会不会去和去了多大，是两个判定，不是一个。**
//   会不会去 → 看闸（gate）。闸只在 A 过了满线之后才爬，爬多快看 A 超出满线多少。
//   去了多大 → 看电荷（charge）。**电荷按「次」攒，不按分钟。**
//
// 「按次攒」是整套里最要紧的一条，三条路是它自己落出来的，不用另写规则：
//   一直死顶最重 → 永远是小：一次都没断过，每次的电荷当场花掉，攒不起来
//   快到了拿开、再回来，四五次 → 大：从头到尾没去过，电荷只涨不卸
//   隔着衣服磨到底 → 看断过几次：一直没停是小，停过几次是中
//
// 明确不做（都是推过又否决的）：
//   不让「忍不忍」决定小中大；不让 A 顶到头等于高潮；
//   不让「在满线以上待了几分钟」等于高潮；不按分钟攒电荷；不掷骰。
//
// ⚠️ 按时长算的判据是「现实里那件事到底是不是时间造成的」。
// 堵奶是（存久了自然会出事），所以乳意那边按小时算是对的。
// 高潮不是（「绷久了」不会让它发生），所以这里一概不许按时长。
// 看到乳意那边按小时就来把这边统一掉，那就改错了。

// ── 五档刺激 ────────────────────────────────────────────────────────
// 不按器具分。手、口、道具、插入都在同一根梯子上，同一个东西用法不同落在不同档。
// 隔衣不单独立一类，它已经是 C3／C4 的分界线。
// 「躲不开」（被按住、绑着）也不单独给东西——它影响的是她能不能让刺激停，
// 自然体现在分钟数里。
//
// valuePerMin：这一档每分钟往 A 上加多少（再乘分档权重）。
// gatePerMin：闸的满速。真实速度还要乘「超出满线多少」，所以刚过线时几乎不动。
// side：这一份算「身体自己攒」还是「外部刺激」——决定走分档权重表的哪一列，
//   也决定要不要折两成给乳意。
export const LIBIDO_CLASSES = Object.freeze({
  0: { name: '无', valuePerMin: 0, gatePerMin: 0, side: 'base', contact: false },
  1: { name: '想象', valuePerMin: 0.6, gatePerMin: 0, side: 'base', contact: false },
  2: { name: '环境', valuePerMin: 0.10, gatePerMin: 0.15, side: 'base', contact: false },
  3: { name: '轻', valuePerMin: 1.8, gatePerMin: 2.5, side: 'stimulus', contact: true },
  4: { name: '中', valuePerMin: 3.5, gatePerMin: 5.0, side: 'stimulus', contact: true },
  5: { name: '重', valuePerMin: 6.0, gatePerMin: 8.0, side: 'stimulus', contact: true },
});

export function getLibidoClass(value) {
  const key = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return LIBIDO_CLASSES[key] || LIBIDO_CLASSES[0];
}

// C1（想象）的闸速恒为 0：只想，永远不会去。
// C2（环境）够不到：走路能把 A 送到满线略上一点，超出量极小，闸爬不动。
//   → 走一整天可以到满，不可能靠走路去。
// 这两档另有一条限制：推不进爆档，最高只能把 A 送到满线上头一点。
// 它们负责「悬在满」，不负责「顶满天花板」。
export const LIBIDO_SOFT_CLASSES = Object.freeze([1, 2]);
export const LIBIDO_SOFT_CEILING_OVER_URGE = 8;

export const LIBIDO_GATE_FULL = 100;

// 停手之后闸滑走的半衰期（分钟）。**按比例滑，不按固定速率。**
//
// 原来是每分钟固定 -3。那样停久一点就把闸清成 0，于是「做 5 分钟、停 15 分钟」
// 这种慢慢撩的打法一轮净负，永远走不到去——一个正常玩法被机制堵死了。
//
// 16 分钟是扫出来的：短停跟原来几乎一样（从 80 停 3 分钟，原来剩 71、现在剩 70），
// 但停 15 分钟仍留着六成而不是清零。物理上也更对——她被撩到快要了之后
// 不会线性地退回原点，而是一直吊着，再来一次上得更快。
export const LIBIDO_GATE_HALFLIFE_MIN = 16;

// ── 电荷：按次攒 ─────────────────────────────────────────────────────
// 一个动作从开始到停，算一次。他一直揉二十分钟没停＝一次；
// 揉五分钟停下又揉五分钟＝两次。
//
// 一次攒多少，看她这一次**爬到多高才断**（读闸的峰值，不是读时长）：
//
// ⚠️ 最低那一档是「刚起来就停了」——**起来过**才算。闸压根没动的那种不在表里，
// 攒 0。这一条不是修饰：环境类（走路、坐着顶着）的闸速不是 0，但值没过满线时
// 闸一步都不爬，于是「走一整天」会被记成二十四次「刚起来就停」＝ 96 电荷，
// 下一次真去直接读大档。而口径 §五 说大档要边缘四次（4×18=72）。
// 走路不该等于边缘四次，所以门槛必须在 0 以上。
export const LIBIDO_CHARGE_BY_PEAK = Object.freeze([
  { peak: 75, gain: 18, label: '快到了才停' },   // 攒得最多
  { peak: 33, gain: 10, label: '到高位才停' },
  { peak: 1, gain: 4, label: '刚起来就停了' },
]);

export function getChargeGainForPeak(peak) {
  const value = Math.max(0, Number(peak) || 0);
  for (const row of LIBIDO_CHARGE_BY_PEAK) {
    if (value >= row.peak) return row.gain;
  }
  return 0;   // 闸没动过：这一次什么都没发生，不攒
}

// ── 他停手之后的那几分钟 ─────────────────────────────────────────────
// 「他停手」不等于「什么都没发生」。
//
// 原来这里跟她躺着睡觉走同一条路：值往起点滑、闸对折。于是一个刚被撩到快要了
// 的人和一个睡着的人，在系统里的这十五分钟一模一样——那是把她当物件。
//
// 实际那几分钟：那股劲不会立刻散，她还在跳还在缩，脑子里还是刚才那一下。
// 而且**难熬本身是往上推的，不是往下拉的**——夹腿、扭、把脸埋进枕头、自己伸手。
// 被丢在那儿越久越想要，不是越不想要。
// 越是快到了才停，这一段越凶也越久；只碰一下就走开，几乎立刻就没事。
//
// 所以停手之后先走一段「余韵」：**刺激没停，只是换成了她自己。**
// 这一段那根条停在原地不掉、闸不滑而且贴边时还会往上爬。烧完了才开始真的消退。
//
// 「被丢在那儿越久越想要」拆成两半安置，都不放在那根条上：
//   往上爬的那半归闸（只有贴边才推得动，见下面那条曲线）
//   累积的那半归 denial（这一晚往后她起得更快、退得更慢）
//
// ⚠️ 这一段也是「他没收住」的唯一来源：**不另设临界点。**
// 女性没有男性那种硬的不可逆点，几乎到最后一刻都能被打断——这正是
// 「他一停她就散了」这么常见的原因。真正停不住是因为她已经高到自己身上的
// 反应就够了。于是门槛是算出来的：停在闸 ~85 以上，余韵自己能把她推过 100；
// 停在临界刚亮那一段（75~85），推不过去。写死一个数就又变成拿她当机器调参了。
// min＝这一段有多久；gatePerMin＝这一段闸的满速（真实速度还要乘「贴边多近」）。
// ⚠️ 这里**没有** valuePerMin：余韵对那根条的正确行为是「停在原地」，不是往上加。
// 原来有过一个，两种加法都试过、都荒唐（详见 tools.js 里余韵那一段的注释）。
export const LIBIDO_AFTERGLOW_BY_PEAK = Object.freeze([
  { peak: 75, min: 14, gatePerMin: 1.0, label: '快要了才停' },
  { peak: 33, min: 6, gatePerMin: 0.35, label: '到高位才停' },
  { peak: 1, min: 2, gatePerMin: 0.05, label: '刚起来就停' },
]);

// 余韵爬闸要乘这个指数（读的是**闸自己的高度**，不是值超出满线多少）。
//
// ⚠️ 这一条是量出来的，不是设计出来的。原来乘的是「值超出满线多少」，
// 但她的值一路顶在天花板上，那个系数恒等于 1——于是闸 40 的时候她自己的反应
// 也在全速爬闸，「他停手」在任何高度都同样致命。停在 97 和停在 40 一样。
//
// 实际是：她自己那点缩、那点抖，只有已经贴着边的时候才够把她推过去，
// 中段几乎不算什么。
//
// ⚠️ 指数从 3 提到 6，是量出来之后改的。三次方时闸 79 就够把她推过 100，
// 而临界标签 75 就亮——等于「拿开」这个动作本身几乎必然让她去掉，
// 拿开多少次定档电荷都是 18（第一次拿开就结束了）。
// 那是把例外做成了常态：**被撩到边上又被丢下，通常的结果是散掉，不是自己过去**
//（「他一停我就没了」才是常见的那个）。自己过去得真的贴到最后一点。
//
// 六次方的形状：闸 60 → 5%   75 → 18%   85 → 38%   90 → 53%   95 → 74%
// 配 1.0/分 × 14 分：停在 91 上下才推得过去。
// 于是临界那一段（75~85）拿开仍然安全，而他真的弄过了头才会收不住。
export const LIBIDO_AFTERGLOW_GATE_CURVE = 6;

// 他停手之后习惯化也在退。
//
// ⚠️ 原来只有换档和去了之后才掉，于是「做五分钟停半小时」这种打法里她越做越钝，
// 一路钝到闸再也爬不上去——那个「攒到极限却永远过不去」的死局有一半是这里来的。
// 实际是：停下来那段时间敏感度在恢复，这也是「反复被丢下」的另一面。
export const LIBIDO_HABIT_IDLE_DROP_PER_MIN = 0.006;

export function getAfterglowForPeak(peak) {
  const value = Math.max(0, Number(peak) || 0);
  for (const row of LIBIDO_AFTERGLOW_BY_PEAK) {
    if (value >= row.peak) return row;
  }
  return null;   // 闸没动过：没有余韵，她本来就没起来
}

// ── 被撩起来又丢下，会累积 ───────────────────────────────────────────
// 同一晚被拿开三次的人，和第一次被碰的人，不该是同一个身体。反复被丢下之后
// 她整体更容易起来——正文里那一层是话说不完整、一碰就抖、自己往上凑。
//
// ⚠️ **只加在值上，绝不加在闸上。** 加在闸上就成了「忍得越久越容易去」，
// 那是口径 §十三 明令否决的闭环（会不会去只许看值超出满线多少）。
// 它的作用是让她更快回到高位，不是让她更容易过线。
//
// 顺带管消退速度：没去成的消退比去成了慢得多（盆腔充血不会因为他停手就退）。
// 同一个计数器管两头，不另立常数——被丢得越多，起得越快、下去得越慢。
export const LIBIDO_DENIAL = Object.freeze({
  perClose: 0.10,      // 每次被撩到高位又断掉：敏感度 +10%
  minPeak: 33,         // 只碰一下就走不算，她得真起来过
  max: 0.60,           // 最多 +60%
  // 一直没人碰她就慢慢散，睡一觉清光（8 小时 × 0.15 > 上限 0.6）。
  // ⚠️ 原来给的 0.5 太快：停半小时就散掉 0.25，比攒的 0.10 还多，于是
  // 「做五分钟走开半小时」这种节奏里它永远是 0——而那正是最该攒的节奏。
  // 一晚上被撩起来又丢下攒的憋劲是按小时算的，不是半小时就没了。
  decayPerHour: 0.15,
  orgasmRetain: 0.20,  // 去了一次就基本清掉
  decayRelief: 0.60,   // 满值时消退速度打到四成
});

// 「快到了就停」厉害，不是因为它耗时间，是因为它把一次攒到顶却不花掉。
// 验算：边缘四次 × 18 = 72 → 大（口径 §五 说四五次是大）；
//       到高位停四次 × 10 = 40 → 中；刚起来就停哪怕八次 × 4 = 32 → 仍是小。
//
// **没停、直接去了的那一次不攒**：这一次的电荷花在这次高潮上。
// 所以死顶从 0 开始永远读小档——这就是「永远是小」的全部来源，不用另写。

export const LIBIDO_CHARGE_MAX = 100;

// 去了多大：去的那一瞬间读一次电荷，只读一次。
export function getOrgasmTier(charge) {
  const value = Math.max(0, Number(charge) || 0);
  if (value >= 70) return '大';
  if (value >= 35) return '中';
  return '小';
}

// 去了要卸。小档只卸三成，正好接上素材那一条：
// 小高潮排不掉深层的充血、反而加重它，所以越到越胀、越到越空
// ——不是心理上不满足，是物理上净增加。这一条不用另写机制。
export const LIBIDO_CHARGE_RETAIN = Object.freeze({ 小: 0.70, 中: 0.40, 大: 0.15 });

// 去了之后 A 掉到哪、碰她没反应那一段有多久、挂什么标签。
// dropTo 是「掉到哪」的语义标记，由 tools 侧换算成具体值：
//   小 = 仍明显高于起点，中 = 刚过满线附近，大 = 起点略上。
//
// stimScale = 不应期那几分钟里刺激还剩的效率（2026-09-03 拍板，TASK-05 #3）：
// 时长和系数是同一个惩罚摊在钟表时间上，不是双重计费——
// 三档「门内总容量」（时长 × 重档满速 × 系数）约 10~17 点闸，量级一致。
// 大档 0.2：去完下一轮 20 分钟重档闸爬 ~81 不过线，连去得隔轮——「缓不过来」成立。
// 它替代旧的「大档接触一刀切归零」（dodging）：归零是死零，系数是「几乎推不动但不是零」。
// ⚠️ 不和孕期时长缩短叠加维度：时长缩短（FLOOR=0.6）管「这扇门开多久」，
// stimScale 管「门开着的时候刺激剩几成」——排卵期两维都不动，防「涨得快恢复也快」的永动机。
export const LIBIDO_AFTERMATH = Object.freeze({
  小: { dropTo: 'high', refractoryMin: 2, stimScale: 0.6, label: '不应·轻' },
  中: { dropTo: 'urge', refractoryMin: 6, stimScale: 0.45, label: '不应·软' },
  大: { dropTo: 'floor', refractoryMin: 12, stimScale: 0.2, label: '不应·躲' },
});

// ── 大档高潮的镇痛窗口（TASK-05 拍板 #7）─────────────────────────────
// 门控理论：快感与痛觉在脊髓抢同一条上传通路，高潮那一刻内啡肽泼出来，
// 痛觉被压住。所以大档（只有大档）去完之后的这一小段时间里，阵痛按这个折扣读。
// 挂在 laborPain 的**读侧**而不是写侧：产程推进每轮都会 updateLaborPain 重写痛值，
// 写侧打折会被下一次推进直接冲掉；读侧打折在窗口内每次读都成立。
// 窗口是一次性的：只在大档结算那一刻开出，不连唤起档常态联动——
// 平时的性唤起不给镇痛，那是「去完了」才有的待遇。
export const LIBIDO_ANALGESIA_MIN = 20;   // 大档高潮后多少分钟内有效
export const LIBIDO_ANALGESIA_SCALE = 0.7; // 窗口内 laborPain 按几折读

// ── 高潮诱发排卵 ────────────────────────────────────────────────────
// 因果确实是反的（现实里是排卵期性欲高，不是高潮把卵挤出来），
// 但**按档保留一部分**：中档极小概率、大档较大概率、小档一律不给。
//
// 原来那条判据（值顶到天花板就排卵、然后性欲归零）已经废掉：
//   「值顶到头等于高潮」是明确否决的，归零也跟「落回起点不落回 0」对台。
// 现在挂在真高潮上，所以走的是闸，不是那根条的高度。
//
// ⚠️ 排多少颗仍由种族的 bio.orgasmOvulationAmount 决定，这里只管「排不排」。
// 那个值为 0 的种族（精灵）连骰都不掷——它的语义就是「几乎不具备额外排卵能力」。
export const LIBIDO_ORGASM_OVULATION_CHANCE = Object.freeze({
  小: 0,
  中: 0.08,
  大: 0.35,
});

// ── 对外视图：附加标签与阶段说法 ────────────────────────────────────
// 「临界」＝ 闸快满了、还没去。**这是个纯标签，不参与任何计算。**
// 门槛跟电荷表最上面那行对齐（peak 75 ＝「快到了才停」），
// 于是标签亮着的时候正好就是「这一次断掉能攒最多电荷」那个区间。
export const LIBIDO_CRITICAL_GATE = 75;

// 阶段说法。**按天切，不挂 stage**——早孕那条下凹曲线的回位点（约 91 天）
// 落在孕中期里，挂 stage 会在第 85 天出一个台阶，而曲线本身是连续的。
// 这七个说法就是口径 §十二 列的那一组。
export const LIBIDO_PHASE_FRAMES = Object.freeze([
  { day: 50, name: '早孕·起' },   // 起点还在往下走
  { day: 80, name: '早孕·重' },   // 谷底那一段（约 9~10 周）
  { day: 95, name: '早孕·回' },   // 往孕前水平爬回，约 13 周回到位
  { day: 189, name: '孕中' },     // 满线从这里开始降
  { day: Infinity, name: '孕晚' },
]);

export function getLibidoPhaseName(effectivePregnantDays) {
  const days = Math.max(0, Number(effectivePregnantDays) || 0);
  for (const frame of LIBIDO_PHASE_FRAMES) {
    if (days < frame.day) return frame.name;
  }
  return '孕晚';
}

// 对外视图：**模型和面板都只看这一份。**
// 闸、电荷、习惯化、不应剩余一概不出去——那四样是内部量，报出去等于把
// 「还差多少」告诉模型，而口径 §十二 明令不给（知道还差多少，模型就会开始规划
// 「再几分钟就到」，那是叙述者的条理冒充身体）。
//
// 参数全是原始值不是 profile，为的是三处调用点（引擎、面板、tracker 载荷）
// 读同一份实现：容量／档名这类东西在两处各算一遍就会对不上，这个坑刚在乳意上踩过。
export function buildLibidoView({
  value = 0, urge = 100, hard = 150, level = '无',
  gate = 0, refractoryMin = 0, refractoryTier = null, afterglowMin = 0,
  stage = '', effectivePregnantDays = 0, engagedCount = 0, isPregnant = false,
} = {}) {
  // 标签跟六个档**并存**，不是替换（口径 §二）。三个标签的优先级：
  //   不应 > 临界 > 余韵
  // 不应优先于临界：刚去过的时候闸已归零，两者实际不会同时成立。
  // 临界优先于余韵：他停手在很高的位置时两者都成立，而「快要了」比
  // 「他刚停手」更要紧——那一格正是唯一允许模型写「快到了」的依据。
  //
  // 「余韵」是给模型的：他停手了，但她还在刚才那股劲里，没有平静下来。
  // 不给这个标签，模型会在他停手的下一段把她写成没事人——那正是把她当物件。
  const tag = Number(refractoryMin) > 0 && LIBIDO_AFTERMATH[refractoryTier]
    ? LIBIDO_AFTERMATH[refractoryTier].label
    : Number(gate) >= LIBIDO_CRITICAL_GATE ? '临界'
      : Number(afterglowMin) > 0 ? '余韵' : null;

  const phase = stage === '产后恢复'
    ? '产后'
    : !isPregnant
      ? String(stage || '')
      : Number(engagedCount) > 0
        ? '入盆'
        : getLibidoPhaseName(effectivePregnantDays);

  return {
    level,
    // 百分比读的是「占满线的几成」，跟尿意同一套：满线是 100%，之上还能往 150% 走。
    // 不读「占天花板的几成」——那个分母一直在动（入盆后只剩 72），同一个身体状态
    // 会因为孕周变化而跳数。
    percent: Math.round((Number(value) || 0) / Math.max(1, Number(urge) || 1) * 100),
    tag,
    phase,
    // 给正文用的一句话。面板和 tracker 都直接贴这个，省得两处各拼一遍。
    text: `${level} ${Math.round((Number(value) || 0) / Math.max(1, Number(urge) || 1) * 100)}%${tag ? ` ${tag}` : ''}`,
    // hard 只是留给调试面板，不进 tracker 载荷。
    hard: Number(hard) || 150,
  };
}

// 不应期在孕期缩短，理由是盆腔充血不消退——所以那几分钟不是常数。
// 足月最多缩到六折。（缩多少口径 §十四 未拍板，这里给的是可调的标定值。）
export const LIBIDO_REFRACTORY_PREGNANCY_FLOOR = 0.6;

// （原 LIBIDO_DODGE_TIER 已删，2026-09-03，TASK-05 拍板 #3：
//   「大档接触一刀切算没碰上」被 stimScale 系数替代。「一碰就躲」的演出
//   走 notify 提示，不再改接触有效性。硬规则不变：接触进行中 A 不下落。）

// ── 习惯化 ──────────────────────────────────────────────────────────
// 同一档一直做，闸爬得越来越钝。换档能把它抖掉一部分。
//
// 已知一个洞：换档 4 分钟就能从满值掉回 0（0.12 × 4 = 0.48）。
// 但它只影响闸爬多快（多久去），不影响档位（档位归电荷管），所以不致命。
export const LIBIDO_HABIT = Object.freeze({
  perMin: 0.022,        // 同一档每分钟累积
  max: 0.50,            // 最多把闸速打对折
  switchDropPerMin: 0.12, // 换了档之后每分钟消退
  orgasmRetain: 0.35,   // 去了一次之后留三成半
});

// ── 压抑芯片：已整个删掉，别再加回来 ────────────────────────────────
// 原来这里有个 LIBIDO_SUPPRESSION_GATE_SCALE = 0.25，配一个面板上的 ON/OFF 按钮。
//
// 删掉的理由有两层。
//
// **一、它跟自己的说明书对不上。** 说明书写的是「闸被按住不让爬，电荷照攒，
// 攒得越久越厚，关掉那一下出来特别大」。但电荷攒多少读的是「这一次闸爬到多高
// 才断」——闸被按住 → 峰值更低 → 断掉时攒得**更少**。实测拿同一段剧本跑两遍，
// 开了压抑的那一遍电荷反而低。所以它实际是「更难去，而且去了还更小」，纯惩罚，
// 跟想要的效果方向正好相反。
//
// **二、更要紧的是它根本不该存在。** 小中大该由剧情里发生了什么决定，
// 不该由用户手上一个旋钮决定。而且 §十三 明令否决过「不忍只能小，忍了才能中大」
// ——一个按钮控制档位就是那条禁令的另一种写法。
//
// 「她忍着」这件事**不需要机制**：旁边有人所以她不敢出声，那是正文写的事；
// 她受不了但场合不对，那也是正文写的事。系统只管她身上到哪一步了。
// 真要让「憋着憋着一放开特别凶」成立,走的是 §五点五 那条路（反复被撩起来又丢下
// 会累积），那条路是剧情自然落出来的,不用谁去拨开关。

// ── 月经周期 ────────────────────────────────────────────────────────
// **只动倍率，不动起点、不动满线。** 激素改的是敏感度，不是身体结构。
// 倍率乘在 A 和电荷上，**闸不乘满**——否则排卵那几天会变成
// 「同样做几分钟就更容易去」。
export const LIBIDO_CYCLE_MULTIPLIER = Object.freeze({
  卵泡期: 1.0,
  排卵期: 1.25,   // 同一下触碰感觉更强。起点没变，所以不会「什么都不做也一直悬着」
  黄体期: 0.9,
  月经期: 0.75,   // 默认。个别角色要经期更敏感，只改那个角色
});

export function getLibidoCycleMultiplier(stage) {
  return LIBIDO_CYCLE_MULTIPLIER[stage] ?? 1.0;
}


// ── 孕期的类别放大 ──────────────────────────────────────────────────
// 孕期变敏感不是全身变敏感，是**原来不算刺激的东西变成了刺激**
//（坐着顶着、走路磨着、衣服箍着）。所以只放大低档，不放大 C5：
// C5 本来就管用，再放大会一碰就过。
//
// ⚠️ C2 放大的是**感觉和电荷，不放大 C2 的闸速**。走路可以走到满，走不到去。
// 而且晚孕的环境类虽然按「外部刺激」那一列加权，**标记仍然算「身体自己攒」**
// ——所以走路不会让她漏奶。「权重走哪一列」和「算哪一侧」是两件事。
export const LIBIDO_PREGNANCY_CLASS_SCALE = Object.freeze({
  1: 1.6,   // 想象
  2: 2.2,   // 环境
  3: 1.2,   // 轻，最多给一点
  4: 1.0,
  5: 1.0,   // 重，不放大
});

export function getPregnancyClassScale(classIndex, progress) {
  const full = LIBIDO_PREGNANCY_CLASS_SCALE[classIndex] ?? 1;
  const t = Math.max(0, Math.min(1, Number(progress) || 0));
  return 1 + (full - 1) * t;
}

// ── 孕期动态全局倍率（2026-09-03 拍板，TASK-05 #4）─────────────────────
// 分档放大管「哪类刺激变了性质」，这张表管「整体涨速的天数曲线」——两层独立。
// 形状按用户口径：早孕反应压下去（0.8），反应消退时回到 1.0，之后一路爬，
// 孕晚最高 1.25（比提过的恒 1.2 略猛）。
//
// 验算过的安全边界：最凶点孕晚想象档 1.54 × 1.25 = 1.93x < 2；
// 接触档（分档表不放大）只吃 1.25；**闸速不乘这张表**（闸走自己的
// 「超出满线量 × 习惯化」），所以倍率只让值涨得快，不会造成连环高潮。
//
// 入盆不叠加：入盆那天三线跳压缩线（50/58/72，余量 8），
// 涨得快也涨不了几步——「一点就着、着了也没用」本来就是入盆段的脸。
// 多胎不参与：分档放大读孕周不读胎数，这张表同口径。
export const LIBIDO_GLOBAL_SCALE_FRAMES = Object.freeze([
  { day: 0, scale: 1.0 },     // 刚怀上没变化
  { day: 65, scale: 0.8 },    // 孕吐谷底（约 9~10 周）
  { day: 91, scale: 1.0 },    // 反应消退，回到基线
  { day: 189, scale: 1.15 },  // 孕中后段开始爬
  { day: 252, scale: 1.25 },  // 孕晚峰值
  { day: Infinity, scale: 1.25 },
]);

// 正文中文明写「孕吐好转」时，模型报一次 morningSicknessResolved——
// 从那天起倍率直接拉回 1.0，不再等帧表自己爬回来（谷底后的自然回程也一起跳过）。
// 没报就照帧表兜底：曲线是生理默认，正文进展有工具口可覆盖。
export const LIBIDO_GLOBAL_SCALE_RESOLVED = 1.0;

export function getPregnancyGlobalScale(effectivePregnantDays, morningSicknessResolved = false) {
  if (morningSicknessResolved) return LIBIDO_GLOBAL_SCALE_RESOLVED;
  const days = Math.max(0, Number(effectivePregnantDays) || 0);
  const frames = LIBIDO_GLOBAL_SCALE_FRAMES;
  if (days <= frames[0].day) return frames[0].scale;
  for (let i = 1; i < frames.length; i += 1) {
    const b = frames[i];
    if (days > b.day) continue;
    const a = frames[i - 1];
    const span = b.day - a.day;
    const t = span <= 0 || span === Infinity ? 0 : (days - a.day) / span;
    return a.scale + (b.scale - a.scale) * Math.min(1, Math.max(0, t));
  }
  return frames[frames.length - 1].scale;
}

// 大档高潮后那阵子阵痛按几折读。窗口开着（pregnant.libidoAnalgesia 还剩着）
// 就打折，关了就原样。读侧的用法见 tracker.js 的 getPromptFacingLaborState：
// 传进来的 analgesiaMinutes 是 pregnant.libidoAnalgesia 那个剩余分钟数。
export function applyLibidoAnalgesia(analgesiaMinutes, rawPain) {
  const remaining = Math.max(0, Number(analgesiaMinutes) || 0);
  if (remaining <= 0) return rawPain;
  const scaled = Math.max(0, Number(rawPain) || 0) * LIBIDO_ANALGESIA_SCALE;
  return Math.round(Math.min(10, scaled) * 10) / 10;
}
