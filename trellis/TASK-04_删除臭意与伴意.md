# TASK-04：删掉臭意（odor）与伴意（companionship）

规模：小 ｜ 依赖：无 ｜ 状态：清单已列全，等逐条点头

⚠️ **这是删代码，动手前要用户逐条点头。** 下面每一条都写了那东西现在干什么用。

---

## 决定

这两个代谢键**整个删掉** —— 不是改、不是关掉、不是留字段不显示。

八个代谢键减到六个：`urine` / `stool` / `hunger` / `sleep` / `milk` / `libido`。

---

## odor（臭意）要删的位置

| 位置 | 现在是什么 |
|---|---|
| `metabolism_config.js:11-13` | `METABOLISM_KEYS` 里的 `'odor'` |
| `metabolism_config.js:31` | `METABOLISM_LABELS.odor = '臭意'` |
| `tools.js:2674` | 每小时自涨 `0.04 * hours` |
| `tools.js:2696` | `applyOdorGain()` 整个函数 |
| `tools.js:3623` | 排泄 ×0.12 ＋ 泌乳 ×0.05 加臭意那一行 |
| `tools.js:2699-270x` | `getOdorCompanionshipReliefMultiplier()` 整个函数 —— 身上臭的时候陪伴需求打折 |
| `tools.js:3292` | 豁免时归零 |
| `tools.js:3357` | 跨周清零（「基本清洁」） |
| `tools.js:3417` | `odorLevel` 计算 |
| `tools.js:3429` | `maybePushNeed('odor', '臭意', odorLevel)` —— 往提示词里推「她身上有味道」 |
| `tools.js:3446` | 伴意提醒里按臭意换句子的分支 |
| `tools.js:3559` | `currentOdor` |
| `tools.js:3571` | `optionReduction('odor')` —— 洗澡减臭意 |
| `tools.js:3578` | `relievedOdor` |
| `tools.js:3600` | `metabolism.odor = ...` |
| `tools.js:3630` | 结算列表里 `['odor', relievedOdor]` |
| `tools.js:497` | 工具 schema 的 `odor` 字段 —— 模型能递的参数 |
| `index.js` / `registry.js` | 面板那一行 ＋ SVG 图标 |

---

## companionship（伴意）要删的位置

| 位置 | 现在是什么 |
|---|---|
| `metabolism_config.js:11-13` | `METABOLISM_KEYS` 里的 `'companionship'` |
| `metabolism_config.js:33` | `METABOLISM_LABELS.companionship = '伴意'` |
| `tools.js:2675` | 每小时自涨 `0.05 * hours` |
| `tools.js:3293` | 豁免时归零 |
| `tools.js:3358-3360` | 跨周 `- (35 * settledWeeks)` —— 安顿下来之后孤独感自然减 |
| `tools.js:3418` | `companionshipLevel` 计算 |
| `tools.js:3430` | `maybePushNeed('companionship', '伴意', companionshipLevel)` |
| `tools.js:3445-3446` | 高档孤独提醒（整段）—— 往提示词里推「她想要人陪」 |
| `tools.js:3560` | `currentCompanionship` |
| `tools.js:3572` | `optionReduction('companionship')` —— 有人陪减伴意 |
| `tools.js:3580-3582` | `companionshipRelief` ＋ 吃臭意乘数那一步 |
| `tools.js:3604` | `metabolism.companionship = ...` |
| `tools.js:3631` | 结算列表里 `['companionship', relievedCompanionship]` |
| `tools.js:498` | 工具 schema 的 `companionship` 字段 |
| `index.js` / `registry.js` | 面板那一行 ＋ 对话泡泡图标 |

---

## 两个键共同牵着的结构

| 位置 | 要做什么 |
|---|---|
| `tools.js:2457-2467` | `METABOLISM_STAGE_PRIORITY` 十行里每行的 `odor` / `companionship` 都清掉 —— 那是「哪个需求先喊」的排序表 |
| `tools.js:2476-2477` | `odor: 0.85` / `companionship: 1.0` 删 |
| `tools.js:2488-2489` | `odor: 0.65` / `companionship: 0.75` 删 |
| `metabolism_config.js:21` | `METABOLISM_PATCH_KEYS` 跟着 `METABOLISM_KEYS` 缩到六键 ＋ flux |
| `tracker_prompt_context.js` | **描述这两项的句子一起删** —— 只删函数不删说明，模型会自己编读数（乳意那次踩过） |
| 旧存档 | 残留的 `odor` / `companionship` 读档时**静默丢弃，不报错** |
| `tests/*` | 断言这两键的测试删掉；**补一条「引擎不再写这两个键」**防它被加回来 |

---

## 验证

1. 六键存档跑一整天，`profile.metabolism` 里不出现 `odor` / `companionship`
2. 八键旧存档读进来不报错，两个残留键被丢掉
3. `tracker_prompt_context` 输出里搜不到「臭意」「伴意」
4. 面板不再显示这两行，图标资源也清掉
5. 补的那条防回归测试要能红：手动往 metabolism 塞 `odor` 应当被断言抓住
