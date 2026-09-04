# TASK-10：删掉孕期三签（堵／快积／扩容）＋ 发情态

规模：大 ｜ 依赖：无 ｜ 状态：**done（2026-09-03）——落地早于本状态行，行内「等逐条点头」过期**
起于：2026-09-02 ｜ 完成核验：2026-09-03

done 核验记录（按 §六 验收清单逐条跑过）：
- 403/403 测试全绿，含负向测试「孕期三签与发情态已删除：不抽签、不留字段」（libido_engine.test.mjs:656）
- `blockage/acceleration/expansion/libidoEstrus/estrus` 在 scripts 全部 js、index.js、style.css 零命中
- `EXPANDED_METABOLISM_CAP/applyRetention/refreshPregnancySymptoms` 零命中
- 乳腺同名三样（advanceMilkBlockage/milk.duct/milk.blockHours）完好，未误删
- 提示词、面板、style.css 均无「阻塞／快积／扩容／发情」；settings.html:380「孕期可扩容衣物」是衣柜文案，§六注明不算
- `getStoolDifficulty` 仍在（tools.js:3057），孕晚期便秘由阶段项撑着——第 10 条判据成立
- §5.1 走的是选项一：老存档四字段留着、state.js 零引用、无人读，加载不受影响

⚠️ **这是删代码。** 照子宫壳那条规矩：每条都写清中文这东西干什么用，
等逐条点头，不许直接动手。

⚠️ 删完之后 01／02／05／06 都会变简单（它们各有一处依赖这套字段），
所以这一份**应该排在那四份前面**。

---

## 一、为什么删：九条

### 1.1 它一天掷三次骰子，就为了「今天堵一个、快积一个、扩容一个」

`refreshPregnancySymptoms`（`tools.js:2579`）拿**同一个 chance** 连掷三次独立的骰子，
串行排除：堵先挑键 → 快积从剩下的挑 → 扩容从再剩的挑。

「今天至少中一样」＝ 1−(1−p)³：

| 阶段 | 单签 chance | 至少中一样 |
|---|---|---|
| 孕中期 | 22% | 53% |
| 孕晚期 | 34% | 71% |
| 第二产程 | 65% | **96%** |

孕期天天有症状，那这个信息就不再是信息。而 chance 那个数原本是照
「有没有并发症」调的，不是照「三样各自的发生率」。

### 1.2 最该被堵住的那一项，抽中了什么也不发生

权重表 `PREGNANCY_BLOCKAGE_STAGE_WEIGHTS` 给 `stool` 的份额全程最高
（孕晚期起一直是 4），注释还专门写「便意拿主要份额：阻塞的语义是排不出去」。

但便意在 `bsExcreteMetabolism` 里走的是检定（`resolveStoolAttempt`，`tools.js:3101`），
不走 `applyRetention`；而 `getStoolDifficulty`（`tools.js:3073`）读的是
阶段／入盆／失败天数／压力／铁剂／脱水／姿势／纤维／水 ——
**一个字都没读 `blockage`。**

更糟的是 `tracker_prompt_context.js:168` 明写着「stool: 便秘」，
模型会照着演，演的是引擎里不存在的状态。

### 1.3 快积同一个 severity 收两次钱

乘在涨速上（`addMetabolismValue`，`tools.js:1985`）已经是它的全部语义了，
`applyAccelerationRebound`（`tools.js:2707`，由 3633 调用）又在排完之后
按 severity 补回 25%。

顶格 0.85 时：涨速 1.85 倍，**并且**每次排解立刻退回 21%。
没有任何一处说明这两件事是叠着来的。

### 1.4 扩容的 severity 是死值 1，却跟另两样共用一个 sanitizer

`refreshPregnancySymptoms:2603` 写 `{ key, severity: 1 }`，
而 `state.js:470`（`sanitizePregnancyBlockage`）把 severity clamp 到 [0, 0.90]
—— **存盘再读回来 1 就变成 0.90**。

行为上目前不影响（`applyExpansionScale` 不读 severity），
但三个语义完全不同的字段共用一张 sanitizer，这种静默改值下次一定咬人。

### 1.5 堵和快积共用一张 cap 表，但两处不是一个量纲

`PREGNANCY_BLOCKAGE_KEY_SEVERITY_CAP` 同时给
`getActiveBlockageRetention`（2628）和 `getActiveAccelerationMultiplier`（2642）做上限。

`stool: 0.90` 对堵读作「只排掉一成」，对快积读作「涨速 1.9 倍」——
**一个是比例，一个是倍率**，一张表按住两个不同的东西。

### 1.6 扩容对尿意的方向跟整套孕期设计反着走

尿意的孕期口径是**容量被压、产量上升**（`getUrineHardCap` 压到 70 一带）。
扩容抽中 urine 那天把 cap 和 urge 一起抬 1.333 倍，等于把压下去的线又拉回去还超过
—— 同一角色在两套相反口径之间按天跳。

`tracker_prompt_context.js:184`「水肿导致体液滞留，膀胱耐受被临时拉高」
是为这个行为**倒着编的解释**。真水肿不会让膀胱变大。

### 1.7 ×1.333 那个比早就没有实物对应了

`EXPANDED_METABOLISM_CAP / BASE_METABOLISM_CAP` ＝ 200/150 是「150 扩到 200」的意思。

但乳意的 cap 现在是 `getMilkCapacityFromDays`（18~150 随孕周长），
尿意是 `getUrineHardCap`（随阶段和入盆压缩）。
**这两项的真实上限早就不是 150**，扩容仍按那个名义比例乘 ——
那个 200 现在不代表任何一条实际的线。

### 1.8 互斥是靠抽签顺序实现的，于是三签的分布被悄悄拉歪

堵先抽、快积从剩下抽、扩容从再剩的抽。权重最高的 `stool`
**拿堵的概率最高、拿扩容的概率最低**。互斥规则本该只管「不重叠」，
实际上还改了每一签的键分布。

另外 `state.js:405-416` 在**加载时又去重一遍**，老存档撞键会静默丢掉一签。

### 1.9 `immune.metabolism` 挡不住抽签

`addMetabolismValue:1979` 和 `applyPassiveMetabolism:2662` 都因 immune 早退，
但 `refreshPregnancySymptoms` 照抽照挂。

代谢免疫的角色状态里会躺着一个 blockage：面板画角标（`index.js:2577`）、
提示词照发，引擎里零作用。

---

## 二、发情态为什么也删：它的三个效果全是三条线已经在做的事

`tools.js:1851` 那条注释写着它是什么：
> 发情态（libidoEstrus）＝ 涨得快一点 ＋ 退得慢很多 ＋ 去了之后掉不到底

逐条对：

| 效果 | 落地位置 | 谁已经在做这件事 |
|---|---|---|
| 去了掉不到底 | `dropLift`，2054-2055 | **`lines.floor`。** dropTo 是从 floor 算出来的（2046-2050），而 floor 随孕周从 18 抬到 42~50。非孕大档落 24.6，孕晚期同一公式落 45 上下 —— 「她去了却没落回原来那么低」已经由起点抬高实现了 |
| 涨得快 | `gainScale`，2123 | **`LIBIDO_PREGNANCY_CLASS_SCALE`。** 按孕期进度放大低档类别（想象 1.6、环境 2.2），就在 rawGain 那个乘法里，`estrusMul` 贴在它旁边 |
| 退得慢 | `decayDivisorBase`，2268 | 部分重复：消退退到 floor 就停，**floor 抬高等于把消退的行程截短了**。这个除数确实还多给一点，是三样里唯一有独立内容的 —— 但不值得为它留一整套抽签＋一个持久字段 |

### 而且这套设计自己承认失败过

`tools.js:1852`：
> 「更容易起来、起来了退不回去」是一件事，**拆成两个骰子没有意义**

它已经承认在性欲上堵和快积必须合并。合并完发现合并出来的东西也是重复的。
—— 既然在性欲上必须合并，其余七项凭什么是分开的两次抽。

---

## 三、删了之后靠什么顶：三类分开处理

用户口径：「我设计的那一套，某个值到一定的高度会诱发什么现状，其实已经够了」。

对。而且这一层的活 stage 那条路**已经在做了**：

### 3.1 已经有连续状态轴的四项 → 不抽，让阶段推轴

| 键 | 现成的按阶段修正 |
|---|---|
| 尿意 | `getUrineStageRateMultiplier` 产量随阶段涨、`getUrineHardCap` 容量随阶段压、`getUrineResidualRatio` 排不干净 |
| 便意 | `getStoolStageDifficulty(stage)` 阻力随阶段涨、`getStoolEngagedDifficulty` 入盆再加 |
| 乳意 | `getMilkCapacityFromDays` 容量随孕周长（18→150） |
| 性欲 | `getLibidoLines` 三条线随孕周走、`LIBIDO_PREGNANCY_CLASS_SCALE` 按进度放大低档 |

**「孕晚期便秘」根本不需要抽** —— `getStoolDifficulty` 里孕晚期本来就比孕中期难。
抽签那一层是同一件事的第二份、粗糙份实现，而且两份不通气。

口径：**症状是长出来的，不是抽出来的。** 她孕晚期便秘，因为 difficulty 到了那个数，
不是因为今天中签。提示词里也就不用再说「今天挂了便秘」，
模型看 difficulty 那一格自己会写。

四项都有阈值现象（漏尿／失禁、溢出／喷、闸和落点、检定失败天数），
**删干净没有缺口。**

### 3.2 hunger 和 sleep → ✅ 已定案（2026-09-02）

这两个是**唯一两个既没有阶段曲线、也没有阈值现象**的键：
`applyHourlyPregnancyMetabolism`（3149-3152）里尿意便意各乘一个阶段系数，
`hunger` 和 `sleep` 是光秃秃的 `delta`。

**抽签那层一直在替这两个键顶班。** 删了之后孕吐和嗜睡在引擎里彻底不存在。

~~三个选项（未定，等拍板）~~ → **已拍板**：

- **hunger → A（交给模型自行判断）**——跟产后那条同一个口径（TASK-06 §四）。
  引擎不管孕吐，正文写就行；TASK-11 给了它一个「呕吐一次 −1 体力」的演出工具，数值刻意轻。
  曾考虑过「饥饿/食欲双轴」（照便意那条路的形状），讨论后作废。
- **sleep → 保留、格位指向 [TASK-11](TASK-11_体力系统.md)**——困意与体力（vitality 正名后）
  不合并，分界是恢复方式：只有睡能清困意，体力另有软顶结构。嗜睡的表达由
  体力系统的「体力低 → 困意涨」联动承担（挂水平不挂变化量）。

原有的两条禁令继续有效：

⚠️ **不要做成「每个症状各有一个按阶段的概率、每天各掷一次」**
—— 7 个症状各 25% → 至少中一个 87%，期望 1.75 个，比现在的 71% 更密。
换了皮的同一个问题。

⚠️ **也不要每天重掷** —— 症状会闪。便秘不是「35% 的日子里有」，
是一旦开始就赖着。TASK-01 里的 `failDays` 已经在做这个连续性，
再叠一个日抽标记，两套机制抢同一件事。

⚠️ **不要做成「每个症状各有一个按阶段的概率、每天各掷一次」**
—— 7 个症状各 25% → 至少中一个 87%，期望 1.75 个，比现在的 71% 更密。
换了皮的同一个问题。

⚠️ **也不要每天重掷** —— 症状会闪。便秘不是「35% 的日子里有」，
是一旦开始就赖着。TASK-01 里的 `failDays` 已经在做这个连续性，
再叠一个日抽标记，两套机制抢同一件事。

### 3.3 扩容 → 直接删，不找替代

方向从来就不成立（§1.6）。真水肿不会让膀胱变大。

---

## 四、删除清单

### ⚠️ 同名陷阱：三样带 blockage 的东西不能删

| 名字 | 是什么 | 处置 |
|---|---|---|
| `advanceMilkBlockage` / `relieveMilkBlockage` | **乳腺堵住**：结痂、局部硬块、越挤越出不来 | **保留。** 这是乳意四档设计的一部分 |
| `milk.duct` / `milk.blockHours` | 同上的两个持久字段 | **保留** |
| `getPregnancyBlockageSeverity` | 孕期三签的 severity 计算 | 删 |

**搜 `blockage` 一律删会把乳腺那套带走。**

### ✅ 已查清（2026-09-02）：`symptomReliefPending` 与三签无关

`tools.js:3164-3185`：那个 +1 在一个由 `symptomChance = (200 − vitality) × 0.5`
驱动、`rounds = min(2000, ceil(fetalEnergyDrain) × days)` 定轮数的循环里——
触发因子是**活力和供养赤字**，跟 `refreshPregnancySymptoms` 及三次抽签完全独立。
删三签这个计数器照常工作，无坑。

### 4.1 `scripts/metabolism_config.js`

| 位置 | 东西 | 干什么用 |
|---|---|---|
| 6 | `EXPANDED_METABOLISM_CAP = 200` | 扩容后的名义上限。200/150 那个比的来源，现在不对应任何实际线（§1.7） |

### 4.2 `scripts/libido_config.js`

| 位置 | 东西 | 干什么用 |
|---|---|---|
| 355-370 | 「堵挂在性欲上」那整段注释 | 解释堵为什么挂在高潮那一步上 |
| 371-379 | `LIBIDO_BLOCKAGE` | 三个字段：`dropLift` 0.35 落点往满线抬、`refractoryScale` 0.55 不应期打折、`decayDivisorBase` 1 闲着退得慢 |
| 384 | `LIBIDO_BLOCKAGE_SEVERITY` | `{min: 0.30, cap: 0.75}`，性欲这一项 severity 的上下界 |
| 386-392 | `getLibidoBlockageSeverityFrom(progress, vitality)` | 按孕周和活力算 severity。活力<80 加 0.08 |

⚠️ `LIBIDO_PREGNANCY_CLASS_SCALE`（402-410）＋ `getPregnancyClassScale`
**保留** —— 那是「孕期变敏感」的正主（§二），不属于三签。

### 4.3 `scripts/tools.js` —— import

| 位置 | 东西 |
|---|---|
| 27 | `LIBIDO_ESTRUS`（**这行就是插件加载不起来的原因**：导入的名字 config 里没有） |
| 43 | `getLibidoEstrusSeverityFrom` |
| 105 | `EXPANDED_METABOLISM_CAP` |

### 4.4 `scripts/tools.js` —— 扩容

| 位置 | 东西 | 干什么用 |
|---|---|---|
| 1854-1856 | 注释里扩容那两行 | 「三条线等比拉伸」的定义句 |
| 1862-1870 | `getActiveExpansion` | 今天扩容抽中的是不是这个键（含 flux 正负极的特判） |
| 1897-1901 | `applyExpansionScale` | 命中就 ×1.333 并取整 |
| 1906 | `getUrineUrgeThreshold` 里那层包裹 | 尿意满线过一遍扩容 |
| 1945 | `getMetabolismCap` 里那层包裹 | 所有键的 cap 过一遍扩容 |
| 2743-2750 | `getLibidoLinesOf` 里的扩容分支 | 性欲三条线一起 ×1.333 |

改法：1906 直接 `return base`，1945 直接 `return baseCap`，2743-2750 只留 `return lines`。

### 4.5 `scripts/tools.js` —— 发情态

| 位置 | 东西 | 干什么用 |
|---|---|---|
| 1845-1860 | 「孕期每天抽一次签」那整段注释 ＋ `LIBIDO_OWN_SYMPTOM_KEYS` | 说明性欲为什么走自己的一签；那个常量是「这些键不参加堵/快积的抽签与读取」 |
| 2051-2056 | `estrus` / `lifted` 两个局部 | 高潮落点往满线抬一截 |
| 2120-2124 | `estrusMul` | 涨速乘一点（`rawGain` 那个乘法里） |
| 2266-2269 | `estrusDrag` | 闲置消退的除数，退得慢 |
| 2605-2610 | 第四签 | `estrusChance = chance × chanceScale`，抽中写 `pregnant.libidoEstrus` |
| 2753-2767 | `getLibidoEstrusSeverity` ＋ `getLibidoEstrusRollSeverity` | 读今天有没有发情态／抽签当时算强度 |
| 2586 | `pregnant.libidoEstrus = null` | 不能怀孕时清空 |
| 5465 | `libidoEstrus: profile.pregnant?.libidoEstrus ?? null` | 从抽签后的 profile 回捞字段（漏了等于那一签白抽） |

改法：2054-2057 只留 `metabolism.libido = clampNumber(dropTo, ...)`；
2124 去掉 `estrusMul`；2269 去掉 `/ estrusDrag`。

### 4.6 `scripts/tools.js` —— 堵／快积／抽签

| 位置 | 东西 | 干什么用 |
|---|---|---|
| 2419-2423 | `applyRetention(reduction, retentionRate)` | 排解量 ×(1−severity)。**只被堵用**，删堵就没人调了 |
| 2425-2437 | `PREGNANCY_BLOCKAGE_STAGE_CHANCE` | 各阶段抽中率 10~65 |
| 2439-2451 | `PREGNANCY_BLOCKAGE_STAGE_SEVERITY` | 各阶段 severity 基数 0.12~0.45 |
| 2456-2468 | `PREGNANCY_BLOCKAGE_STAGE_WEIGHTS` | 各阶段哪个键更容易被挑中（stool 份额最高那张） |
| 2470-2480 | `PREGNANCY_BLOCKAGE_KEY_SEVERITY_MULTIPLIER` | 按键放大 severity（stool 1.35 最高） |
| 2482-2492 | `PREGNANCY_BLOCKAGE_KEY_SEVERITY_CAP` | 按键的 severity 上限，**堵和快积共用**（§1.5） |
| 2494-2503 | `canHavePregnancyBlockage` | 这个阶段能不能挂症状 |
| 2508-2517 | `getAvailablePregnancySymptomKeys` | 今天可挂症状的键池（`allowLibido` 决定性欲在不在里面） |
| 2519-2529 | `getPregnancyBlockageChance` | chance 的公式（阶段基数＋供养赤字＋活力＋压力） |
| 2531-2540 | `getPregnancyBlockageSeverity` | severity 的公式 |
| 2542-2554 | `pickWeightedKey` | 按权重抽一个键 |
| 2557-2577 | `pickPregnancySymptomKey` | 从池子里排除已抽中的，按阶段权重抽 |
| 2579-2612 | `refreshPregnancySymptoms` | **本体**：一天掷四次骰子 |
| 2614-2629 | `getActiveBlockageRetention` | 今天堵的是不是这个键、severity 多少 |
| 2631-2644 | `getActiveAccelerationMultiplier` | 今天快积的是不是这个键 → 返回 1+severity |
| 2707-2712 | `applyAccelerationRebound` | 排完之后按 severity 回补 25%（§1.3 那笔重复账） |
| 1985 | `adjustedDelta *= getActiveAccelerationMultiplier(...)` | 涨速乘快积 |
| 3141 / 3381 | flux 的 `acceleration` 两处 | 衍生种族 flux 累积乘快积 |
| 3540-3541 | flux 解放的 `blockageRetention` | flux 解放量打折 |
| 3574-3581 | 六项排解各一处 `applyRetention(..., getActiveBlockageRetention(...))` | urine/hunger/sleep/milk/odor/companionship 的排解打折 |
| 3624-3634 | 那个 for 循环 | 七项排完各调一次 `applyAccelerationRebound` |
| 5455 | `refreshPregnancySymptoms(profile, tick)` | 唯一调用点 |
| 5460-5462 | 三个字段回捞 | 同 5465 |
| 3665-3667 / 6523-6525 | 两处 `pregnant.blockage/acceleration/expansion = null` | 清孕期状态时归零（分娩后、强制设定时） |
| 484 | `bsExcreteMetabolism` 的 description 末句 | **给模型看的工具说明**：「pregnant.blockage 会降低排解效果，acceleration 会加快累积……」 |

⚠️ 3574-3581 删的是**外层包裹**，不是那六个 `relievedXxx` 变量本身。
删完形如 `const relievedUrine = Math.min(currentUrine, urineReduction)`。

### 4.7 `scripts/state.js`

| 位置 | 东西 | 干什么用 |
|---|---|---|
| 4 | `EXPANDED_METABOLISM_CAP` import | —— |
| 368 / 382 | 老 `excretion` 键迁移时用 200 做上限 | **要改不要删**：改成 `BASE_METABOLISM_CAP`，否则老存档迁移会放行越界值 |
| 390-395 | `acceleration` / `expansion` 补 null | 老存档没这两个字段时初始化 |
| 402-404 | `excretion` → `stool`／`urine` 的键改写 | 更早一次拆分留下的迁移 |
| 405-416 | 加载时的撞键去重 | 堵与快积撞键就丢快积、扩容撞前两个就丢扩容（§1.8 那个静默丢签） |
| 418 / 427 / 432 | `expansionKey` ＋ `expanded ? cap×1.333 : cap` | 加载时按扩容放宽 clamp |
| 437-441 | flux 的 `expandedFlux` | 同上，flux 版 |
| 463-472 | `sanitizePregnancyBlockage` | 三个字段共用的 sanitizer，severity clamp 到 0.90（§1.4 那个静默改值） |
| 844 | patch 白名单里的 `'blockage', 'acceleration', 'expansion'` | 允许模型 patch 这三个字段 |
| 870-872 | 三行 sanitizer 挂载 | —— |
| 1064-1066 / 1883-1885 | 两处初始状态 `blockage/acceleration/expansion: null` | 建卡时的空值 |

⚠️ **368/382 那两处是「改」不是「删」。** 直接删掉会让老存档的 excretion 值
按 undefined 走，是数据损坏。

### 4.8 `scripts/tracker_prompt_context.js` —— ⚠️ 必须连带删

**只删函数不删说明句，模型会自己编读数 —— 乳意那次踩过这个坑。**

| 位置 | 说明句 |
|---|---|
| 74 | `- blockage: 当日妊娠阻塞状态，格式为 {key, severity}…` |
| 75 | `- acceleration: 当日妊娠快积状态，格式同 blockage…` |
| 76 | `- expansion: 当日妊娠扩容状态…将对应普通需求上限从 150 扩为 200…` |
| 77 | `- 这三种症状都不会落在 libido 上…若在旧存档里看到 {key:"libido"}，按无效处理` |
| 151 | flux 那句里「被 pregnant.expansion 命中的方向可扩至 ±200」 |
| 167-175 | `pregnant.blockage 表示阻塞症状` ＋ 七个键各一行（stool 便秘／urine 尿流不畅／hunger 孕吐恶心／milk 乳房胀痛…） |
| 176-182 | `acceleration` ＋ 七个键各一行（milk 乳意快升溢乳／sleep 晕眩嗜睡／odor 体温升高…） |
| 183-190 | `expansion` ＋ 七个键各一行（urine 水肿／stool 肠道慢蠕动／odor 孕妇香气…） |
| 192-194 | 发情态那三行：「性欲不走 blockage / acceleration 这两签，它有自己的一签：发情态（引擎内部量，不会出现在状态里）」 |
| 195 | `fluxPositive / fluxNegative 的阻塞、快积与扩容需按…` |

⚠️ 167-190 那三块里写的「便秘／孕吐／水肿」是模型演症状的**唯一依据**。
删掉之后如果 §3.2 选了 A（交给模型），要在这里补一句
「孕期不适由你按孕周自行判断」，否则模型会不知道还能不能写孕吐。

### 4.9 `scripts/tracker.js`

| 位置 | 东西 | 干什么用 |
|---|---|---|
| 470-483 | `getPromptFacingMetabolismSymptoms` | 把三个字段整理成给提示词看的对象 |
| 调用点 | 上面那个函数的调用处 | 一起删 |

### 4.10 `index.js` —— 面板

| 位置 | 东西 | 干什么用 |
|---|---|---|
| 2431 | `DEBUG_BLOCKAGE_LABELS` | 调试下拉框的键名中文标签 |
| 2466-2510 | `normalizeMetabolismNeed` 的 `blockage/acceleration/expansion` 三个形参 ＋ `expanded`/`blocked`/`accelerated`/`scale` 那几段 | 面板每格算「有没有被挂症状」，`scale = expanded ? 200/150 : 1` |
| 2513-2516 | `getMetabolismSummary` 的三个形参 | 传递 |
| 2571 | tooltip 里「；阻塞 X%／；快积 X%／；扩容至 200」 | 悬浮提示文字 |
| 2576-2579 | 三个 CSS 类 ＋ 三个角标 span | 格子上的小标记 |
| 3069-3071 | 三个字段传进 `getMetabolismSummary` | —— |
| 3173-3183 | debug 视图里三个字段的整理 | 调试面板读数 |
| 3634-3655 | `currentBlockageKey` 等三个 ＋ 三组 `<option>` 生成 | 调试下拉框 |
| 3726-3749 | 三块调试 UI（标签＋select＋按钮） | 「应用阻塞／应用快积／应用扩容」 |
| 4061-4073 | `clampSelectedTrackExpansionCapacity` | 手动改扩容后把值夹回新 cap |
| 4075-4117 | `setSelectedTrackBlockage` | 调试用：手动设堵，并把撞键的另两样清掉 |
| 4119-4159 | `setSelectedTrackAcceleration` | 同上 |
| 4161-4197 | `setSelectedTrackExpansion` | 同上 |
| 4260-4276 / 4567-4583 | 六处按钮事件绑定（两个渲染位置各三个） | —— |

### 4.11 `style.css`

| 位置 | 东西 |
|---|---|
| 2157-2169 | `.is-blocked` / `.is-accelerated` / `.is-expanded` 三条 |
| 2176-2205 | `.bs-bt-need-blockage` / `-acceleration` / `-expansion` 角标样式 |
| 2245 | `.bs-bt-need-blockage` 补充规则 |

### 4.12 `tests/libido_engine.test.mjs`

| 位置 | 东西 |
|---|---|
| 656 | `blockage: { key: 'libido', severity: 0.75 }` |
| 679-684 | `build(estrus)` ＋ `libidoEstrus: { severity: 0.75 }` |
| 719 | `assert.notEqual(pregnant.blockage?.key, 'libido', '堵不许押性欲')` |

删这三处，**补一条反向断言**：`refreshPregnancySymptoms` 不存在，
或 `profile.pregnant` 上不出现这四个字段。

---

## 五、两个必须处理的坑

### 5.1 老存档里躺着这四个字段

`profile.pregnant` 上会有 `blockage` / `acceleration` / `expansion` / `libidoEstrus`。
删掉读的那一头之后它们变成**死数据**：不报错，但会一直存在存档里。

两个选项（**未定**）：留着不管（无害，占几个字节），
或在 `state.js` 的迁移段加一次 `delete`。

⚠️ 如果选 delete，那段迁移代码本身要留够久 —— 至少不能跟 §4.7 那些行同一批删掉。

### 5.2 `passedDays <= 0` 那个守卫会跟着走，但要记住它曾经是个 bug

`refreshPregnancySymptoms` 第一行是 `if (tick.passedDays <= 0) return;`
—— **一次推三天只跑一次**，等于一天的症状顶三天用。

现在删了就不存在了。但**如果 §3.2 选了 C（发作型）**，
这个坑会原样长回来：持续 N 天的东西必须按 `passedDays` 逐天推进，不能只跑一次。

---

## 六、验收标准

1. `node --test "tests/*.test.js"` 全过（**这一步顺带把 import 修好** ——
   不是修，是连要修的东西一起没了）
2. 全库 grep `blockage` **只剩乳腺那三样**（`advanceMilkBlockage` /
   `relieveMilkBlockage` / `milk.duct` / `milk.blockHours`）
3. 全库 grep `expansion` / `acceleration` / `estrus` / `Estrus` **零命中**
   （`settings.html:380` 那句「孕期可扩容衣物」是衣柜文案，不算）
4. 全库 grep `EXPANDED_METABOLISM_CAP` 零命中
5. `applyRetention` 零命中
6. 老存档（带这四个字段的）能正常加载，读数不变
7. 面板上不再出现三种角标，tooltip 里没有「阻塞／快积／扩容」字样
8. 调试面板里三块 UI 消失，其余调试项照常工作
9. 提示词上下文里搜不到「阻塞／快积／扩容／发情」
10. 孕晚期便秘仍然发生 —— 由 `getStoolDifficulty` 的阶段项撑着，
    不是由抽签（**这条是整个任务成立的判据**：删了之后症状还在，
    说明抽签那层真的是多余的）

---

## 七、开工顺序

1. ~~§3.2 那三个选项先拍板（hunger/sleep 怎么办）~~ → **已定案**（§3.2）：hunger 走 A、
   sleep 指向 [TASK-11](TASK-11_体力系统.md)，删的时候不用再做选择
2. §4.1–4.12 逐条点头
3. 一次性改通，先删引擎（4.1–4.9），再删 UI（4.10–4.11），最后测试（4.12）
4. `node --test "tests/*.test.js"`
5. 回头清文档：`_性欲值PRD.md` 与 `_性欲值_现行口径.md` 里堵/扩容/发情态那些块，
   `Changelog.md` 三处

⚠️ **这一份做完再做 01/02/05/06。** 那四份各有一处依赖这套字段：

| 任务 | 依赖点 |
|---|---|
| TASK-01 便意 | `getStoolDifficulty` 不读 blockage —— 删完这个矛盾自动消失 |
| TASK-02 尿意 | 扩容抬 cap 跟压容量对着干 —— 删完只剩一套口径 |
| TASK-05 性欲 | §三最后一条「孕早期下凹横轴要不要读 `blockage.hunger`」—— 删完这个选项不存在了 |
| TASK-06 乳意 | §三.1「乳意被阻塞」跟「憋」是不是同一件事、§三.2 `acceleration.milk` 跟档位打架 —— 删完两条都自动消失 |

