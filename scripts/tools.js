import {
  rollEpisodeHours,
  getEpisodeDailyChance,
  getTrueProdromalPressureFloor,
  EPISODE_PRESSURE_FLOOR,
  EPISODE_COOLDOWN_HOURS,
  EPISODE_PAIN,
} from './prodromal_config.js';
import {
  isDescentEngaged,
  isDescentFixed,
  resolveDescentPushback,
  getDescentStep,
  DESCENT_ENGAGED,
} from './fetal_descent_config.js';
import {
  getUterinePressureBaseline,
  getUterinePressureBand,
  PRESSURE_DECAY_PER_HOUR,
  PRESSURE_STANDING_FLOOR,
} from './uterine_pressure_config.js';
import {
  LIBIDO_AFTERGLOW_GATE_CURVE,
  LIBIDO_AFTERMATH,
  LIBIDO_CHARGE_MAX,
  LIBIDO_DENIAL,
  LIBIDO_HABIT_IDLE_DROP_PER_MIN,
  LIBIDO_GATE_FULL,
  LIBIDO_GATE_HALFLIFE_MIN,
  LIBIDO_HABIT,
  LIBIDO_ORGASM_OVULATION_CHANCE,
  LIBIDO_REFRACTORY_PREGNANCY_FLOOR,
  LIBIDO_SOFT_CEILING_OVER_URGE,
  LIBIDO_SOFT_CLASSES,
  LIBIDO_ANALGESIA_MIN,
  LIBIDO_CHARGE_RETAIN,
  buildLibidoView,
  getAfterglowForPeak,
  getChargeGainForPeak,
  getLibidoClass,
  getLibidoCycleMultiplier,
  getOrgasmTier,
  getPregnancyClassScale,
  getPregnancyGlobalScale,
} from './libido_config.js';
import {
  getLaborFloorDays,
  getEngagementLockDays,
  getBaseDailyLaborChance,
  getEngagementLaborMultiplier,
  getPressureLaborMultiplier,
  dailyChanceToTickChance,
  FULL_ENGAGEMENT_DAYS,
  MAX_DAILY_LABOR_CHANCE,
} from './labor_onset_config.js';
import {
  buildRecentMessages,
  cloneValue,
  createChildId,
  derivePregnancyStageState,
  getGestationEffectiveSpeed,
  getGestationSpeciesSpeed,
  getGestationModifierMultiplier,
  getChatState,
  getPsyStressInitByLevel,
  getSettings,
  getVitalityInitByLevel,
  saveSettings,
  summarizeOperationLogs,
  summarizeRawResult,
  syncCharacterStageFromProfile,
} from './state.js';
import {
  buildEmptyPsychologyGroup,
  normalizePsychologyGroup,
  normalizePsychologyStageProfiles,
  PSY_MENS_FIELDS,
  PSY_MENS_BOOL_FIELDS,
  PSY_PREG_FIELDS,
  PSY_PREG_BOOL_FIELDS,
} from './registry_psy_config.js';
import {
  DEFAULT_WARDROBE_ITEM,
  DEFAULT_WEAR_STATE,
  getNextWardrobeItemId,
  normalizeTemporaryOutfitItems,
  normalizeWardrobeItem,
  resolveWardrobeItemRef,
  sanitizeWearState,
  WARDROBE_DIMENSIONS,
} from './wardrobe_config.js';
import {
  FIRST_STAGE_NATURAL_BIRTH_EXPERIENCE,
  LABOR_STAGES,
  LABOR_STAGE_BASE_HOURS,
  LABOR_STAGE_INCREMENT,
  LABOR_POSTPARTUM_OBSERVATION_HOURS,
  MENSTRUAL_STAGE_DAYS,
  MENSTRUAL_STAGES,
  PREGNANCY_STAGE_DAYS,
  PREGNANCY_STAGES,
} from './stage_config.js';
import {
  BASE_METABOLISM_CAP,
  METABOLISM_KEYS,
  METABOLISM_LABELS,
  STOOL_CHECK,
  URINE_ROUTINE_VOID,
  canUrineStressLeak,
  getLibidoBandWeights,
  getLibidoLevel,
  getLibidoLines,
  getMetabolismBandWeights,
  getMetabolismLevel,
  getMilkCapacityFromDays,
  getMilkDevelopmentFromDays,
  getMilkGate,
  getMilkGateAdjusted,
  getMilkConstitution,
  getMilkSprayChance,
  MILK_LETDOWN_ESTABLISH_HOURS,
  MILK_OVERFLOW_SPRAY_BONUS,
  MILK_CONSTITUTION_KEYS,
  engagementProgressFromDescent,
  getStoolEngagedDifficulty,
  getStoolStageDifficulty,
  getStoolStageRateMultiplier,
  getUrineBandWeights,
  getUrineFloorFactor,
  getUrineFloor,
  getUrineHardCap,
  getUrineLeakTier,
  getUrineLevel,
  getUrineMultipleAdjust,
  getUrineOrgasmDropRange,
  getUrineOrgasmIncontinenceChance,
  getUrineProduction,
  getUrineResidualValue,
  getUrineStressLeakChance,
  getUrineUrgeCap,
  getUrineUrgencyBreakChance,
  getUrineVoidDifficulty,
  getUrineVoidThreshold,
  URINE_INTERMITTENT_DROP_RATIO,
  URINE_INTERMITTENT_RESIDUAL_MULT,
  URINE_POSTPARTUM_DISCHARGE_DAYS,
  URINE_POSTPARTUM_DISCHARGE_EXTRA,
  URINE_SWEAT_DISCOUNT,
  URINE_SWEAT_PREGNANCY_EXTRA,
  URINE_VOID_POSTURE_DISCOUNT,
} from './metabolism_config.js';
import {
  STOOL_COOLDOWN_MINUTES,
  STOOL_DIFFICULTY_DECAY_PER_HOUR,
  STOOL_FAIL_ROUND_STEP,
  STOOL_GAS_RELIEF,
  STOOL_SUCCESS_RELIEF,
  STOOL_WATERY,
  STOOL_WATERY_LEAK_DOOR,
  canStoolWateryLeak,
  clampExcretionAmount,
  clampMealGain,
  composeStoolFoodTags,
  computeStoolCrampChance,
  computeStoolGasChance,
  computeStoolGasChanceStraining,
  computeStoolSuccessChance,
  computeStoolWateryChance,
  getStoolDifficultyTier,
  getStoolExcretionRange,
  getStoolFoodTag,
  getStoolLevel,
  getStoolLines,
  getStoolMealTier,
  getStoolPostureRelief,
  isStoolImpacted,
} from './stool_engine.js';
import {
  getVitalityBand,
  getVitalitySoftCap,
  SLEEP_RECOVERY_PER_SLEEPINESS,
  SLEEPINESS_RECOVERY_HALF,
  SLEEPINESS_RECOVERY_QUARTER,
  SLEEP_RECOVERY_MULT_HALF,
  SLEEP_RECOVERY_MULT_QUARTER,
  MEAL_RECOVERY_PER_HUNGER,
  SUGAR_DOSE,
  ENGAGED_SLEEP_RECOVERY_MULT,
  ENGAGED_SLEEP_PROGRESS_THRESHOLD,
  SLEEP_TO_URINE_RATIO,
  LOW_VITALITY_SLEEPINESS_PER_HOUR,
  VITALITY_EXHAUSTED_RATIO,
  VITALITY_FAINT_HUNGER_RATIO,
  VITALITY_BLACKOUT_RATIO,
  FAINT_MIN_MINUTES,
  FAINT_MAX_MINUTES,
  VITALITY_IDLE_DRAIN_PER_HOUR,
  VITALITY_ACTIVITY_PER_MIN,
  VITALITY_ACTIVITY_MAX_CLASS,
  VITALITY_MULT_CAP,
  VITALITY_MENSTRUAL_MULT,
  VITALITY_TIRED_MULT,
  VITALITY_ENGAGED_MIN_MULT,
  VITALITY_ENGAGED_MAX_MULT,
  LABOR_VITALITY_PER_HOUR,
  PRESSURE_MULT_EXHAUSTED,
  PRESSURE_MULT_PSY,
  PRESSURE_PSY_THRESHOLD,
} from './vitality_config.js';
import {
  getBaseRaceName,
  getDerivedTypeInheritanceProfile,
  getDerivedTypeMetabolismExemptions,
  getEmbryoTypeByRace,
  getMergedRacePhysiologyProfile,
  parseRaceDescriptor,
  getRaceDescriptorComponents,
  getRaceComponents as getConfiguredRaceComponents,
} from './race_config.js';
import {
  addSkillExperience,
  addTalentExperience,
  appendSkillHistory,
  normalizeSkillList,
  normalizeTalentList,
  registerSkillDefinition,
  requiredExp,
  resolveSkillDefinition,
} from './skill_config.js';

export const TOOL_DEFINITIONS = Object.freeze([
  {
    name: 'bsPassedTime',
    description: '推进当前聊天中已注册角色的时间。会处理月经阶段、受精着床、孕期推进、产兆前驱、第一至第三产程、产后恢复，以及最近性行为计时。',
    input_schema: {
      type: 'object',
      properties: {
        minute: { type: 'integer' },
        hour: { type: 'integer' },
        day: { type: 'integer' },
        week: { type: 'integer' },
        month: { type: 'integer' },
        year: { type: 'integer' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'bsWriteDiary',
    description: '为单一角色追加一条主观日记。time 是日记的日期标题，不是具体钟点；请填写故事内日期、年月日、某日/第几天等，不要填 HH:mm、午後 这类时刻。同一角色每个故事日（24 小时）最多只能写一篇；若当天已写过，不得再次调用。content 应像角色事后写下的日记，不是即时心声或旁白；通常在跨日后回顾昨日，重大事件或 notify 提醒时也应写成事后补记。角色不在场也可以写。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        time: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['female', 'time', 'content'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsUpdateCharacterStatus',
    description: '对单一角色的体力、情压、性欲、宫压做增减更新。会联动代谢累积、高潮排卵、羊膜耐久警告等状态。urine 与 stool 是剧情刺激带来的尿意／便意增量：只按事件量级给一个小整数（轻 5／中 10／强 20），不必自行折算孕期倍率与容量——系统会按当前阶段、入盆状态与所处档位加权。urine 的刺激来源如喝水、受寒、紧张、久坐、被压被顶、性交、咳嗽打喷嚏；stool 的刺激来源如进食后（最重）、晨起、温热饮水。urineHolding 表示她此刻去不了厕所——被场合、他人、束缚或手头脱不开的事困住，附近没有可用的地方，或她自己不肯去。置 true 后系统才会让尿意持续往上爬并可能漏尿或失禁；能去时置 false，系统会按常规趟数自行处理，不必逐趟调用 bsExcreteMetabolism。默认为 false。'
      + '体力是存量资源条：读数是余量，不是此刻状态——同一个 40%，躺着没事、爬楼就现形。只在睡觉与进食时回复（bsExcreteMetabolism 排解困意／饿意），做事只扣不加。'
      + '活动消耗只报两样：vitalityClass 是这一回合哪一档活动（1 轻——能边做边正常聊天，慢走、家务、做饭、洗澡、逛街、坐着上课／2 中——会喘但能持续，说不了长句，快走、爬楼、拎重购物袋、久站排队、普通性交、跳舞／3 重——一分钟就喘、顾不上别的、做不满半小时，跑、搬家具、激烈挣扎、剧烈性交、全力用力、惊慌逃窜），'
      + 'vitalityMinutes 是这一档持续了几分钟。静坐、躺着、被抱着不报——底噪系统自己扣。体力见底会晕倒，授权与时长系统自算并写进 notify，不要自行判定她晕不晕。'
      + 'vitalitySugar 置 true 表示剧情里喂了糖水／巧克力／运动饮料这类快糖：即时小回体力，当日第 1／2／3 次各回不同量、第 4 次起无效——吊命的口子，不是无限续命。'
      + '性欲只报两样：libidoClass 是这一回合哪一档刺激（0 无／1 想象／2 环境，走路、坐着顶着、衣服箍着，没人动手／3 轻，隔着衣服或不是核心部位或直接碰但很轻很慢／4 中，隔一层薄的碰核心或直接碰、中等力度／5 重，直接碰核心而且用力或者快），'
      + 'libidoMinutes 是这一档持续了几分钟。不按器具分——手、口、道具、插入都在同一根梯子上，同一个东西用法不同落在不同档；她自己用玩具也算。'
      + '刺激分钟不等于本轮分钟：一轮可能覆盖半小时但只有五分钟在动手，那就报 5，报多了系统会拿本轮实际推进的时长截掉。'
      + '去没去、是小是中是大、还差多少，一概不要自行判断——系统算完写进 notify，没看到就是没去。旧的 libido 增量写法仍然收，但不会走这套判定。'
      + 'fetalPushback 是把胎头往回顶的力度（轻 5／中 10／强 20）：剧情里她刻意躺下抬胯、用手往上推、避免走动以延后分娩时使用。'
      + '胎头下降得越深越顶不回去，深固定之后完全无效——不要自行判断成功与否，系统会算出实际退了多少并写进 notify。'
      + 'morningSicknessResolved 置 true 表示正文明确写了她的孕吐开始好转／消退：孕早期那阵压性欲的低谷从这一刻起取消，性欲涨速回到正常。只在正文明写好转时报一次，没写不报——有些孕妇没有孕吐，没写就一直按默认曲线走。'
      + 'prolongedPregnancy 置 true 表示正文明确了她是延产（吃了延产药／ curse 术式／过期妊娠体质等把孕期按住的外力）：逾期阶段的数值切到延产线。只在正文明写时报一次，没写就一直按自然逾期走。'
      + 'urineSense 报栏二感觉事件（不产尿、只是更想去）：water_sound 水声或冲水声／seeing_toilet 看到厕所或到家门口／caffeine 喝了咖啡浓茶可乐奶茶／cold_food 吃冰的碳酸的酸的辣的／nervousness 紧张考试被看着赶时间（可带 strength 4-10 表强度）／fetal_kick 胎动踢到膀胱／posture_shift 站起来那一下或弯腰／arousal 性兴奋或插入／overactive 憋太久了。同一种几分钟内重复报会被系统忽略。'
      + 'sweating 报出汗强度（轻=微热日常活动／中=运动热天／重=剧烈运动高温劳动），只减尿意产量不降值，效果两小时；剧情里她出汗了就报一次。'
      + 'urineStressEvent 报应激事件（咳嗽 cough／笑 laugh／喷嚏 sneeze／搬东西或用力 lift／插入 insert／高潮 orgasm）：系统按当前档位和阶段掷漏尿，不加值——不要再用 urine 加值来表达漏。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        options: {
          type: 'object',
          properties: {
            vitality: { type: 'integer' },
            vitalityClass: { type: 'integer', minimum: 1, maximum: 3 },
            vitalityMinutes: { type: 'integer', minimum: 0, maximum: 1440 },
            vitalitySugar: { type: 'boolean' },
            libido: { type: 'integer' },
            libidoClass: { type: 'integer', minimum: 0, maximum: 5 },
            libidoMinutes: { type: 'integer', minimum: 0, maximum: 1440 },
            uterinePressure: { type: 'integer' },
            psyStress: { type: 'integer' },
            urine: { type: 'integer' },
            stool: { type: 'integer' },
            urineHolding: { type: 'boolean' },
            urineSense: { type: 'string', enum: ['water_sound', 'seeing_toilet', 'caffeine', 'cold_food', 'nervousness', 'fetal_kick', 'posture_shift', 'arousal', 'overactive'] },
            urineSenseStrength: { type: 'integer', minimum: 1, maximum: 10 },
            sweating: { type: 'string', enum: ['轻', '中', '重'] },
            urineStressEvent: { type: 'string', enum: ['cough', 'laugh', 'sneeze', 'lift', 'insert', 'orgasm'] },
            fetalPushback: { type: 'integer', minimum: 0, maximum: 30 },
            morningSicknessResolved: { type: 'boolean' },
            prolongedPregnancy: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
      required: ['female', 'options'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsAddWardrobeItem',
    description: '向单一角色衣柜添加或更新一件衣物。id 引用规则：更新既有衣物时传其整数 id 或准确名称字符串；新增衣物可省略 id，系统会自动分配下一个整数 id，不要自造大数字 id。main 主件可给 parts 数组列出组成部件名（如 ["白衬衫","牛仔裤"]，连身装可省略）；剧情中重新搭配上下装时，应用本工具铸造新的组合主件再换上。accessory 配件可给 layer：inner=贴身内衣等穿在主件之下，outer=外套鞋饰等穿在主件之外（默认 outer）。衣物保存稳定外观 note 与机械数值；note 只写衣物稳定外观与来源：颜色、材质、版型、长短、固定开口、图案、制服/病服/借装来源等。禁止写当前穿着反应、角色感受、近期身体变化、怀孕/胀痛/压胸/勒红/变紧/显怀等动态状态；这些由四维、pregFit 与当轮叙事推导。slot=main 为主件，slot=accessory 为配件。主件通常使用 0-10；配件只是补正，单项只能 -3 到 3，通常只影响 1-2 个维度，其他维度填 0。四维：masking 掩盖身体曲线/孕肚变化、support 对胸腹腰与重心的承托、capacity 容许孕肚/胸腹/骨盆/水肿等体型变化、convenience 行动/穿脱/如厕/哺乳或排解需求的方便程度。皮肤暴露与稳定外观写入 note，不作为机械数值。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        item: {
          type: 'object',
          properties: {
            id: { type: ['integer', 'string'] },
            name: { type: 'string' },
            note: { type: 'string' },
            slot: { type: 'string', enum: ['main', 'accessory'] },
            parts: { type: 'array', items: { type: 'string' } },
            layer: { type: 'string', enum: ['inner', 'outer'] },
            masking: { type: 'number' },
            support: { type: 'number' },
            capacity: { type: 'number' },
            convenience: { type: 'number' },
          },
          required: ['name', 'note', 'slot', 'masking', 'support', 'capacity', 'convenience'],
          additionalProperties: false,
        },
      },
      required: ['female', 'item'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsRemoveWardrobeItem',
    description: '从单一角色衣柜删除一件衣物。itemId 可传整数 id 或准确衣物名称字符串。不能删除默认主件 id=0。若删除当前主件，穿着会回到 id=0；若删除当前配件，会从当前配件列表移除，并重算 pregFit。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        itemId: { type: ['integer', 'string'] },
      },
      required: ['female', 'itemId'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsChangeOutfit',
    description: '更换单一角色当前穿着。mainItemId 指定主件。穿上或脱下个别配件时优先用增量参数：addAccessoryItemIds 穿上、removeAccessoryItemIds 脱下，均在当前配件基础上生效，不需要重述其他配件。accessoryItemIds 则是覆盖式完整列表（空数组=脱掉所有配件），与增量参数同传时以 accessoryItemIds 为准。衣物引用优先传整数 id；若不确定 id，可传准确衣物名称字符串，系统会按名称解析（含临时衣物）。注意：wearState 只是状态标签，不会改变穿了哪些衣物；穿上鞋、戴上外套等必须通过配件参数完成。wearState 为当前穿着状态短标签（12 字内）：建议使用 整齐/凌乱/敞开/半褪/撩起/上衣已褪/下装已褪/湿透，也可按情境自造同粒度短标签；主件有 parts 时优先引用部件名消歧（如 毛衣已脱）。只更新穿着状态时可只传 wearState。换主件时未显式传 wearState 会自动重置为整齐。temporaryItems 可放病服、借装等临时衣物，只保存于当前 outfit，不写入 wardrobe；换回衣柜服装时可传 temporaryItems: [] 清除临时衣物。临时衣物也要写稳定外观 note，且 note 只写衣物稳定外观与来源：颜色、材质、版型、长短、固定开口、图案、制服/病服/借装来源等。禁止写当前穿着反应、角色感受、近期身体变化、怀孕/胀痛/压胸/勒红/变紧/显怀等动态状态；这些由四维、pregFit 与当轮叙事推导。全裸也是主件 id=0。角色处于真实妊娠/产兆前驱/产程/产后恢复时会重算 outfit.pregFit（产后恢复的衣着压力随恢复进度递减）；其余阶段 pregFit 为 null。衣着状态变化的叙事文字由当轮叙事自行处理，不写回 wardrobe/outfit。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        mainItemId: { type: ['integer', 'string'] },
        accessoryItemIds: { type: 'array', items: { type: ['integer', 'string'] } },
        addAccessoryItemIds: { type: 'array', items: { type: ['integer', 'string'] } },
        removeAccessoryItemIds: { type: 'array', items: { type: ['integer', 'string'] } },
        wearState: { type: 'string' },
        temporaryItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer', minimum: 0 },
              name: { type: 'string' },
              note: { type: 'string' },
              slot: { type: 'string', enum: ['main', 'accessory'] },
              parts: { type: 'array', items: { type: 'string' } },
              layer: { type: 'string', enum: ['inner', 'outer'] },
              masking: { type: 'number' },
              support: { type: 'number' },
              capacity: { type: 'number' },
              convenience: { type: 'number' },
            },
            required: ['id', 'name', 'note', 'slot', 'masking', 'support', 'capacity', 'convenience'],
            additionalProperties: false,
          },
        },
      },
      required: ['female'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsSetDescription',
    description:
      '更新单一角色的描述字段。调用前必须逐一检查该描述栏位的所有既有子字段；未传入某子字段仅表示它已检查且完全不变，不得因求简短而省略受本轮剧情、姿势、衣着、表情、身体状态或环境影响的字段。不能新增角色原本没有的子字段。描述内容必须使用格式：字段名|描述内容;;字段名|描述内容;;...字段名|描述内容;;，不可改成自然段或换行文本。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        options: {
          type: 'object',
          properties: {
            normalDescription: { type: 'string' },
            pregnantDescription: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      required: ['female', 'options'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsSetCharacterPresence',
    description: '设置角色是否在场。设为 false 后，tracker 默认不会再把该角色完整状态发送给 LLM，直到重新设为 true。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        isPresent: { type: 'boolean' },
      },
      required: ['female'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsUpdateExperience',
    description: '直接更新单一角色的经验/关系字段。适合修正贞洁、伴侣、怀孕/分娩/流产经历等记录，不触发额外规则。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        options: {
          type: 'object',
          properties: {
            virginity: { type: ['string', 'null'] },
            latestSexPartner: { type: ['string', 'null'] },
            emotionalMate: { type: ['string', 'null'] },
            marriageMate: { type: ['string', 'null'] },
            pregnantExperience: { type: 'integer' },
            naturalBirthExperience: { type: 'integer' },
            surgicalBirthExperience: { type: 'integer' },
            miscarriageExperience: { type: 'integer' },
          },
          additionalProperties: false,
        },
      },
      required: ['female', 'options'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsNameChild',
    description: '给单一角色已出生的某个孩子命名。只修改 children 指定索引的 name，不触发额外规则。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        childIndex: { type: 'integer' },
        name: { type: 'string' },
      },
      required: ['female', 'childIndex', 'name'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsRegisterSkillDefinition',
    description: '向当前聊天的全局技能图鉴登记一个全新技能定义。新增时 name 与 description 都必填；先检查 skill_catalog，已有同名技能时直接引用，不要制造近义重复。此工具只建立定义，不会让任何角色觉醒或获得经验。',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['name', 'description'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsTrainSkill',
    description: '依最近剧情让单一角色觉醒或锻炼一个已登记技能。skillExp 只能非负，技能只会进步、不会降级；技能不存在时必须明确传 awaken=true 才会从 Lv1 觉醒。角色自己的 talents 对所有 LLM 工具均为只读，只能作为判断 skillExp 的参考，绝不可直接修改；角色天赋仅能由用户在外部界面调整。若角色处于孕中期、孕晚期、临产期、逾期、产兆前驱或第一产程，系统每次只随机选择一胎，把本次 skillExp 按该胎 affinity/50 转为正负胎儿天赋经验；第二、第三产程不会传递。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        skill: { type: ['integer', 'string'] },
        skillExp: { type: 'integer', minimum: 0, maximum: 1000000 },
        awaken: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['female', 'skill', 'skillExp', 'reason'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsUpdatePsychology',
    description: '按当前阶段更新单一角色的心理倾向数值。月经阶段使用 mens，妊娠/假孕/产兆前驱/产程使用 preg。系统会自动重算 *_interpret。每名角色在每个新小时内最多成功更新一次；在 bsPassedTime 推进满下一小时之前，重复调用会被跳过。注意：数值字段传入的是“变化量(delta)”而不是目标值，例如当前 stance_value=78，传入 {"preg":{"stance":2}} 会变成 80，而不是设为 2。建议一次只调整一个心理项，且尽量小幅变动；单次以 ±1 到 ±3 为宜，±5 已属于偏大变化。布林字段则是直接设为 true/false。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        options: {
          type: 'object',
          properties: {
              mens: {
                type: 'object',
                properties: {
                  mastery: { type: 'number' },
                  desire: { type: 'number' },
                  autonomy: { type: 'number' },
                  isChaste: { type: 'boolean' },
                  hasContraception: { type: 'boolean' },
                },
                additionalProperties: false,
              },
              preg: {
                type: 'object',
                properties: {
                  cognition: { type: 'number' },
                  bonding: { type: 'number' },
                  stance: { type: 'number' },
                  knowsFatherSource: { type: 'boolean' },
                  hasProfessionalPrenatalCare: { type: 'boolean' },
                },
                additionalProperties: false,
              },
          },
          additionalProperties: false,
        },
      },
      required: ['female', 'options'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsAddSperm',
    description: '向单一角色体内加入精液，用于性交后留下受孕机会。amount 必须为正数，建议 10-30（残留每天自动衰减 10，即 1-3 天内自然消失）；给过大的值会让正文连续多日描写残留。扣除/排出精液请用 bsDrainSperm。race 使用 [derivedType-装饰子项]race-装饰子项 格式，混血种族以 X 分隔；父系 derivedType 直接从这个字符串解析。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        male: { type: 'string' },
        race: { type: 'string' },
        amount: { type: 'number' },
      },
      required: ['female', 'male', 'race', 'amount'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsDrainSperm',
    description: '让角色主动排出体内部分或全部精液残留，按当前各来源比例一并减少。用于角色主动清洗、灌洗或使用道具排出。注意：受精是在每次时间推进时用当下仍存在的精液判定，清空后这次性交不再有受孕机会——若剧情只是洗澡沐浴、角色并不打算避孕，不要调用本工具，残留本来就会自行衰减。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        amount: { type: 'number' },
      },
      required: ['female', 'amount'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsSetMenstrualPhases',
    description: '直接设置月经相关阶段，用于催情、药物、外力或剧情推进。切到排卵期时会重新允许高潮排卵；假孕期可留精但不会排卵或受孕。不会覆盖正在进行的受精、真妊娠、产兆前驱或产程。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        stage: { type: 'string' },
      },
      required: ['female', 'stage'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsExcreteMetabolism',
    description: '缓解角色的生理需求。普通种族用于处理尿意、便意、饿意、困意与乳意。urine（尿意）在孕晚期与入盆后无法排空，系统会自动留下残值；stool（便意）不是减法而是一次检定——信号来了不等于排得出，排不出则阻力涨、失败天数累加，只要传了 stool 就视为一次尝试。stoolMeal 用于在进食时触发胃结肠反射（便意立刻涨），可选值：snack（垫一口）/small（小份）/normal（一顿正常饭）/heavy（吃撑了）；stoolTags 是食物标签数组，可选值：laxative（利便）/gassy（产气）/greasy（油腻）/cold（生冷）/dry（干硬）/fiber（高纤）/iron（铁剂）/hydrate（灌水），可叠加。乳意在普通周期表示乳房胀敏，在妊娠、假孕或产后恢复则可表示乳胀与泌乳需求；性欲波动会自然产生乳意。进食缓解 hunger 会增加 urine、stool 与少量 sleep，睡眠缓解 sleep 会增加少量 hunger。带 derivedType 的角色以 flux 进行极性解放，并处理未抵免需求；要解放 flux 时请传 flux，或不传 options 使用默认释放量。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        options: {
          type: 'object',
          properties: {
            urine: { type: 'number', minimum: 0, maximum: 200 },
            stool: { type: 'number', minimum: 0, maximum: 200 },
            hunger: { type: 'number', minimum: 0, maximum: 200 },
            sleep: { type: 'number', minimum: 0, maximum: 200 },
            milk: { type: 'number', minimum: 0, maximum: 200 },
            milkWarmCompress: { type: 'boolean', description: '热敷乳房缓解堵奶。堵住（第四格）时才生效，其余时段传了不报错也不做额外处理。' },
            flux: { type: 'number', minimum: 0, maximum: 400 },
            stoolMeal: { type: 'string', enum: ['snack', 'small', 'normal', 'heavy'] },
            stoolTags: {
              type: 'array',
              items: { type: 'string', enum: ['laxative', 'gassy', 'greasy', 'cold', 'dry', 'fiber', 'iron', 'hydrate'] },
            },
          },
          additionalProperties: false,
        },
      },
      required: ['female'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsAbortion',
    description: '终止当前受精或妊娠状态。月经阶段且着床前视为避孕成功，其他阶段视为流产；可指定 fetusIndex 做减胎。若 miscarriage 保护开启，则需 force=true 才会生效。'
      + '【重要】凡是会真的让她失去孩子的调用（即除「着床前避孕成功」与「多胎减胎后仍有存活胎儿」之外的一切情形），'
      + '仅在使用者本人的发言里明确要求时才可调用，此时必须提供 userDirective，原文摘抄使用者那句话的关键片段（10 字以上），系统会回查使用者发言核对，抄错或凭空编造都会被拒绝。'
      + '不要因为剧情里出现了跌倒、腹部受击、剧烈运动、激烈性交、束腹压迫、情绪剧变或子宫压力升高就自行判断需要流产——'
      + '健康孕妇在这些情形下不会失去孩子，这些只会诱发假性宫缩或先兆征象，由系统自行处理。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        force: { type: 'boolean' },
        fetusIndex: { type: 'integer' },
        userDirective: { type: 'string' },
      },
      required: ['female'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsImplantEmbryo',
    description: '把外源胚胎植入角色体内：代孕、胚胎移植、虫母注卵、寄生产卵等，凡是「孕育者不是遗传母亲」的情节都用这个。'
      + 'provider 是胚胎真正的归属方（提供卵子的一方／虫母／委托母亲），分娩后孩子会转交给她；若她尚未注册，孩子会留在承载者名下并标注来源。'
      + '胚胎种族依遗传母方推导而非承载者，所以虫母的卵放进人类宿主仍是虫族血统。'
      + 'race 与 fatherRace 使用 [derivedType-装饰子项]race-装饰子项 格式，混血种族以 X 分隔。母系 derivedType 永远来自承载者；父系优先取 fatherRace，未写时才取 race。'
      + 'provider 若尚未注册，用 race 指明遗传母方种族；父方种族预设与遗传母方同族，跨种族时用 fatherRace 指明。'
      + '工具加入的是尚未着床的受精卵，可在同一着床窗口重复调用；第一颗会启动共用 fertilizationDays，之后由 bsPassedTime 推进并统一着床。已进入妊娠阶段后不可再加入。自然受孕请勿使用本工具。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        provider: { type: 'string' },
        fathers: { type: 'string' },
        count: { type: 'integer', minimum: 1, maximum: 50 },
        race: { type: 'string' },
        fatherRace: { type: 'string' },
      },
      required: ['female', 'provider'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsRuptureMembranes',
    description: '让角色破水（羊膜破裂）。只有在产兆前驱且宫压已达上限的 66%，或已在第一／第二产程时才会生效；条件不足会被拒绝，此时叙事不得写成已经破水。'
      + '产兆前驱破水会直接进入第一产程。剧情写到羊水流出、破水时必须调用本工具，让叙事与系统状态一致；系统未确认破水前不要擅自描写破水。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
      },
      required: ['female'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsChildbirth',
    description: '让角色立即结束分娩并进入产后恢复，并把剩余胎儿转为 children 记录。外部直接调用视为手术产；产程自然结束时则记为自然产。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
      },
      required: ['female'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsForceGestation',
    description: '【剧情强制令专用】把角色的妊娠状态直接改写成使用者指定的样子，绕过受精与着床流程。'
      + '仅在使用者本人的发言里明确下达状态强制令时才可调用：妊娠诅咒、神力干涉、时间跳跃、系统改写、设定补正等。'
      + '角色自己的台词、旁白、剧情描写都不算强制令；AI 不得自行判断「剧情需要」而调用本工具。'
      + 'userDirective 必须原文摘抄使用者那句强制令中的关键片段（10 字以上），系统会回查使用者发言核对，抄错或凭空编造都会被拒绝。'
      + 'equivalentDays 是人类等效产科孕期天数：孕早期 0-84、孕中期 84-189、孕晚期 189-252、临产期 252-280、逾期 280 以上；'
      + '换算方式是周数乘 7，例如 38 周填 266、40 周填 280、41 周填 287。'
      + 'fetusWeight 是每胎体重系数，1.0 为标准，1.5 以上为巨大儿，上限 3.0。'
      + 'engagedCount 指定有几胎已经入盆（胎头下降压住膀胱与直肠），例如双胎中只有一胎入盆就填 1；'
      + '省略时由系统按胎位与阶段自行判定，不必强写。入盆会压缩膀胱容量、加重便意阻力。'
      + '本工具会覆盖既有妊娠状态，但保留日记、技能、孩子记录与经历。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        userDirective: { type: 'string' },
        equivalentDays: { type: 'integer', minimum: 0, maximum: 300 },
        fetusCount: { type: 'integer', minimum: 1, maximum: 9 },
        fetusWeight: { type: 'number', minimum: 0.33, maximum: 3.0 },
        engagedCount: { type: 'integer', minimum: 0, maximum: 9 },
        father: { type: 'string' },
        race: { type: 'string' },
        genders: { type: 'string' },
      },
      required: ['female', 'userDirective', 'equivalentDays'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsSetGestationLock',
    description: '【剧情强制令专用】给角色加上或解除妊娠阶段锁定，用于「卡在某个孕期永不推进」或「分娩后退回原阶段」这类诅咒与循环设定。'
      + '仅在使用者本人的发言里明确下达时才可调用，规则与 bsForceGestation 相同；userDirective 必须原文摘抄使用者的强制令片段。'
      + 'freeze=true 会把妊娠速度设为 0，胎儿停止发育、孕期不再推进；freeze=false 恢复正常速度。'
      + 'loopBackDays 填写后，角色每次分娩结束都会自动退回该等效孕期天数并重新怀上同样的胎儿数，形成分娩循环；填 0 或省略则不循环。'
      + '下锁这一刻会把当前胎儿存成模板（种族、父方、胎位、体重），每轮循环照着复刻，所以请先用 bsForceGestation 把胎儿设好再下锁。'
      + 'fetusWeight 可覆盖循环胎儿的体重系数，1.5 以上为巨大儿，上限 3.0；省略则沿用当前胎儿的体重。'
      + 'name 是这个效果在系统里显示的名字，例如「妊娠诅咒」。clear=true 时解除全部锁定与循环。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        userDirective: { type: 'string' },
        freeze: { type: 'boolean' },
        loopBackDays: { type: 'integer', minimum: 0, maximum: 300 },
        fetusWeight: { type: 'number', minimum: 0.33, maximum: 3.0 },
        name: { type: 'string' },
        description: { type: 'string' },
        clear: { type: 'boolean' },
      },
      required: ['female', 'userDirective'],
      additionalProperties: false,
    },
  },
  {
    name: 'bsMaternalFetalInteraction',
    description: '处理母体与胎儿之间的互动。每名角色在每个新小时内最多成功互动一次；在 bsPassedTime 推进满下一小时之前，重复调用会被跳过。direction=fetal 表示胎儿对母体的亲近或排斥，必须传 change，并调整随机一胎的 affinity，不会补充供养力。direction=maternal 表示母体安抚胎儿，不使用 change；系统会随机判定 affinity 变化，若成功且有尚待安抚的妊娠不适，会消耗一次并依轻微/显著变化补回 1/2 点供养力。若当前处于产兆前驱且 direction=maternal，则改为分娩抵抗判定。',
    input_schema: {
      type: 'object',
      properties: {
        female: { type: 'string' },
        change: {
          type: 'string',
          enum: ['slight_increase', 'significant_increase', 'slight_decrease', 'significant_decrease'],
        },
        direction: {
          type: 'string',
          enum: ['fetal', 'maternal'],
        },
      },
      required: ['female'],
      additionalProperties: false,
    },
  },
]);

function clampNumber(value, min, max, fallback = 0) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function ensureWardrobeState(profile) {
  if (!profile.wardrobe || typeof profile.wardrobe !== 'object' || Array.isArray(profile.wardrobe)) profile.wardrobe = {};
  profile.wardrobe.enabled = true;
  const sourceItems = Array.isArray(profile.wardrobe.items) ? profile.wardrobe.items : [];
  const items = [];
  for (const source of sourceItems) {
    const item = normalizeWardrobeItem(source);
    if (!item || items.some((existing) => existing.id === item.id)) continue;
    items.push(item);
  }
  if (!items.some((item) => item.id === DEFAULT_WARDROBE_ITEM.id)) items.unshift({ ...DEFAULT_WARDROBE_ITEM });
  profile.wardrobe.items = items;
  return profile.wardrobe;
}

function hasPreparedWardrobe(profile) {
  return Boolean(profile?.wardrobe?.enabled === true);
}

function hasBreedingPsychology(profile) {
  const stageProfiles = profile?.psychology?.stageProfiles;
  return Boolean(stageProfiles && typeof stageProfiles === 'object' && !Array.isArray(stageProfiles)
    && Object.keys(stageProfiles).length > 0);
}

function findWardrobeItem(profile, itemRef, slot = '') {
  const wardrobe = ensureWardrobeState(profile);
  return resolveWardrobeItemRef(wardrobe.items, itemRef, slot);
}

function getAvailableOutfitItems(profile) {
  const wardrobe = ensureWardrobeState(profile);
  const temporaryItems = Array.isArray(profile?.outfit?.temporaryItems)
    ? profile.outfit.temporaryItems.map(normalizeWardrobeItem).filter(Boolean).map((item) => ({ ...item, source: 'temporary' }))
    : [];
  return [...wardrobe.items, ...temporaryItems.filter((item) => item.id !== DEFAULT_WARDROBE_ITEM.id)];
}

function findOutfitItem(profile, itemRef, slot = '') {
  return resolveWardrobeItemRef(getAvailableOutfitItems(profile), itemRef, slot);
}

function ensureOutfitState(profile) {
  ensureWardrobeState(profile);
  if (!profile.outfit || typeof profile.outfit !== 'object' || Array.isArray(profile.outfit)) profile.outfit = {};
  profile.outfit.temporaryItems = normalizeTemporaryOutfitItems(profile.outfit.temporaryItems);
  const mainItem = findOutfitItem(profile, profile.outfit.mainItemId ?? DEFAULT_WARDROBE_ITEM.id, 'main');
  const accessoryItems = Array.isArray(profile.outfit.accessoryItemIds)
    ? profile.outfit.accessoryItemIds
      .map((ref) => findOutfitItem(profile, ref, 'accessory'))
      .filter(Boolean)
    : [];
  profile.outfit.mainItemId = mainItem ? mainItem.id : DEFAULT_WARDROBE_ITEM.id;
  profile.outfit.accessoryItemIds = accessoryItems
    .map((item) => item.id)
    .filter((id, index, list) => list.indexOf(id) === index);
  profile.outfit.wearState = sanitizeWearState(profile.outfit.wearState);
  if (!('pregFit' in profile.outfit)) profile.outfit.pregFit = null;
  return profile.outfit;
}

function getOutfitItems(profile) {
  const outfit = ensureOutfitState(profile);
  const main = findOutfitItem(profile, outfit.mainItemId, 'main') || { ...DEFAULT_WARDROBE_ITEM };
  const accessories = outfit.accessoryItemIds
    .map((id) => findOutfitItem(profile, id, 'accessory'))
    .filter(Boolean);
  return [main, ...accessories];
}

function getOutfitDimensionTotals(profile) {
  const totals = Object.fromEntries(WARDROBE_DIMENSIONS.map((key) => [key, 0]));
  for (const item of getOutfitItems(profile)) {
    for (const key of WARDROBE_DIMENSIONS) totals[key] += clampNumber(item[key], -10, 10, 0);
  }
  for (const key of WARDROBE_DIMENSIONS) totals[key] = clampNumber(totals[key], 0, 10, 0);
  return totals;
}

function calculatePregWearPressure(profile) {
  const pregnant = profile?.pregnant || {};
  const effectiveDays = clampNumber(pregnant.effectivePregnantDays, 0, 9999, 0);
  if (effectiveDays <= 0) return 0;
  const fetalEnergyDrain = clampNumber(pregnant.fetalEnergyDrain, 0, 9999, 0);
  const fullPregnancyDays = Object.values(PREGNANCY_STAGE_DAYS).reduce((sum, value) => sum + (Number(value) || 0), 0) || 280;
  const progress = Math.min(1.25, effectiveDays / fullPregnancyDays);
  const basePressure = 0.5;
  const progressPressure = Math.pow(progress, 1.35) * 6;
  const fetalPressure = Math.max(0, fetalEnergyDrain - 0.1) * 1.5;
  return clampNumber(basePressure + progressPressure + fetalPressure, 0, 10, 0);
}

// 产后恢复的衣着压力：从产后初期的水平随恢复进度线性递减到 0（体型回缩、乳胀消退）。
const POSTPARTUM_START_WEAR_PRESSURE = 4;

function calculatePostpartumWearPressure(profile) {
  const days = clampNumber(profile?.base?.days, 0, 9999, 0);
  const recoveryDays = getStageLimit(profile, '产后恢复') || 56;
  const progress = Math.min(1, days / recoveryDays);
  return clampNumber(POSTPARTUM_START_WEAR_PRESSURE * (1 - progress), 0, 10, 0);
}

function refreshOutfitPregFit(profile) {
  if (!profile?.wardrobe?.enabled) return null;
  const outfit = ensureOutfitState(profile);
  const stage = String(profile?.base?.stage || '');
  const inPostpartum = stage === '产后恢复';
  if (!inPostpartum && !isTruePregnancyStage(stage) && stage !== '产兆前驱' && !LABOR_STAGES.includes(stage)) {
    outfit.pregFit = null;
    return outfit;
  }
  const totals = getOutfitDimensionTotals(profile);
  const pregWearPressure = inPostpartum ? calculatePostpartumWearPressure(profile) : calculatePregWearPressure(profile);
  outfit.pregFit = {
    pregWearPressure,
    gap: {
      masking: clampNumber(totals.masking - pregWearPressure, -20, 20, 0),
      support: clampNumber(totals.support - pregWearPressure, -20, 20, 0),
      capacity: clampNumber(totals.capacity - pregWearPressure, -20, 20, 0),
      convenience: clampNumber(totals.convenience - pregWearPressure, -20, 20, 0),
    },
  };
  return outfit;
}
/**
 * 单个排卵期自然排出的卵数 = 1 颗基础 + orgasmOvulationAmount 额外排卵倾向。
 *
 * 旧算法是「每天至少 1 颗 x 排卵天数」，而排卵天数随 menstrualLengthRatio 线性拉长，
 * 于是长周期种族按窗口长度虚增：精灵额外倾向明明是 0 却每周期排 6 颗、龙族排 8 颗，
 * 与该字段的语义（高潮诱发的额外排卵量，见 applyOrgasmOvulation）完全无关。
 * 周期越长排得越多也让「一年一次经期」这类设定无法成立。
 */
function getNaturalOvulationTotal(profile) {
  const extra = clampNumber(profile?.bio?.orgasmOvulationAmount, 0, 100, 1);
  return Math.max(1, Math.round(1 + extra));
}

/** 自然排卵每个排卵期只发生一次，离开排卵期即重置 */
function shouldResetNaturalOvulation(stage) {
  return stage !== '排卵期';
}

function getImplantationDays(profile) {
  const cycleLength = getMenstrualCycleLength(profile);
  return Math.max(1, (6 * cycleLength) / 28);
}

function getObstetricPregnancyOffsetDays(profile) {
  return Math.max(0, getMenstrualCycleLength(profile) / 2);
}

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomNumber(min, max + 1));
}

function wrapAngle(angle) {
  let next = Number(angle) || 0;
  while (next < 0) next += 360;
  while (next >= 360) next -= 360;
  return next;
}

function angleDistance(from, to) {
  const direct = Math.abs(from - to);
  return Math.min(direct, 360 - direct);
}

function shuffleInPlace(list) {
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
}

function getBaseRace(race) {
  return getBaseRaceName(race);
}

function getRaceComponents(race) {
  return getConfiguredRaceComponents(race);
}

function isSameRaceGroup(leftRace, rightRace) {
  const left = getRaceComponents(leftRace).sort();
  const right = getRaceComponents(rightRace).sort();
  if (left.length === 0 || right.length === 0 || left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function deriveFetusRace(motherRace, fatherRace) {
  // 血统显示保留每个种族的 -装饰子项；生理运算另用 getRaceComponents 取基础种族。
  const motherParts = getRaceDescriptorComponents(motherRace);
  const fatherParts = getRaceDescriptorComponents(fatherRace);
  const combined = [...fatherParts, ...motherParts].filter(Boolean);
  if (combined.length === 0) return '人类';
  // 必须去重，否则同族生育会得到「人类x人类」这种自我混血的种族。
  // race_prompt_context.js 的同名函数一直有去重，这里漏了。
  const unique = [];
  for (const part of combined) {
    if (!unique.includes(part)) unique.push(part);
  }
  return unique.join('x');
}

function deriveFetusEmbryoType(race) {
  return getEmbryoTypeByRace(race);
}

function deriveFetusGender(race) {
  const profile = getMergedRacePhysiologyProfile(race);
  if (profile?.genderRatio === -1) return '无';
  if (profile?.genderRatio === null) return '双';
  const ratio = clampNumber(profile?.genderRatio, 0, 100, 50);
  return Math.random() < (ratio / 100) ? '男' : '女';
}

function getConceptionWeight(stage, gender, weightRatio = 1.0) {
  const stageWeights = {
    黄体期: 1.2,
    排卵期: 1.1,
    卵泡期: 1.0,
    产后恢复: 1 / 1.1,
    月经期: 1 / 1.2,
  };
  const baseWeight = stageWeights[String(stage || '')] || 1.0;
  const fluctuation = Math.exp(randomNumber(-0.083, 0.083));
  const sexMultiplier = gender === '男' ? 1.05 : gender === '女' ? 1 / 1.05 : 1.0;
  return Math.max(0.33, Math.min(3.0, Number(baseWeight * fluctuation * sexMultiplier * weightRatio)));
}

function getConceptionWeightRatio(profile, sperm) {
  const motherBreedTolerance = clampNumber(profile?.bio?.breedTolerance, 0.1, 100, 1.0);
  const fatherProfile = getMergedRacePhysiologyProfile(sperm?.race);
  const fatherBreedTolerance = clampNumber(fatherProfile?.breedTolerance, 0.1, 100, 1.0);
  const dominance = (fatherBreedTolerance - motherBreedTolerance) / Math.max(motherBreedTolerance + fatherBreedTolerance, 0.1);
  return clampNumber(1 + (dominance * 0.65), 0.625, 1.6, 1.0);
}

function getDerivedTypeSeed(motherDerivedType, fatherDerivedType) {
  const mother = motherDerivedType ? String(motherDerivedType) : null;
  const father = fatherDerivedType ? String(fatherDerivedType) : null;
  if (!mother && !father) return { affinity: 0, progress: 0 };
  if (mother && father && mother === father) return { affinity: 30, progress: 30 };
  if (mother && father && mother !== father) return { affinity: -30, progress: -30 };
  return { affinity: 15, progress: 0 };
}

function updateDerivedTypeProgress(profile, tick) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  const motherDerivedType = base.derivedType ? String(base.derivedType) : null;
  const passedDays = Math.max(0, tick.passedDays);
  if (fetuses.length === 0 || passedDays <= 0) return;

  for (const fetus of fetuses) {
    const fatherDerivedType = fetus?.fatherDerivedType ? String(fetus.fatherDerivedType) : null;
    if (!motherDerivedType && !fatherDerivedType) continue;
    const currentProgress = clampNumber(fetus?.maternalDerivedTypeProgress, -100, 100, 0);
    if (currentProgress === 0) continue;

    const direction = Math.sign(currentProgress);
    const affinity = clampNumber(fetus?.affinity, -50, 50, 0);
    const alignment = direction * affinity;
    const factor = clampNumber(1 + (alignment / 30), 0, 3, 1);
    const activeDerivedType = direction > 0 ? motherDerivedType : fatherDerivedType;
    const inheritanceSpeed = clampNumber(getDerivedTypeInheritanceProfile(activeDerivedType)?.inheritanceSpeed, 0.2, 3.0, 1.0);
    const delta = direction * passedDays * 3 * factor * inheritanceSpeed;
    fetus.maternalDerivedTypeProgress = clampNumber(currentProgress + delta, -100, 100, currentProgress);
  }

  pregnant.fetuses = fetuses;
  profile.pregnant = pregnant;
}

function cloneIdenticalFetus(fetus) {
  return {
    ...fetus,
    embryoId: null,
    fusionCheckedWith: [],
    providerSources: Array.isArray(fetus?.providerSources) ? [...fetus.providerSources] : undefined,
    chimera: fetus?.chimera ? cloneValue(fetus.chimera) : undefined,
    tendencyAngle: randomInt(0, 360),
    affinity: 0,
  };
}

function uniqueNonEmptyStrings(values) {
  const result = [];
  for (const value of values || []) {
    const text = String(value ?? '').trim();
    if (text && !result.includes(text)) result.push(text);
  }
  return result;
}

function getNextEmbryoId(fetuses) {
  return fetuses.reduce((max, fetus) => {
    const value = Number(fetus?.embryoId);
    return Number.isInteger(value) && value > max ? value : max;
  }, 0) + 1;
}

function ensureEmbryoMetadata(pregnant) {
  const fetuses = Array.isArray(pregnant?.fetuses) ? pregnant.fetuses : [];
  const used = new Set();
  let nextId = getNextEmbryoId(fetuses);
  for (const fetus of fetuses) {
    let id = Number(fetus?.embryoId);
    if (!Number.isInteger(id) || id <= 0 || used.has(id)) {
      id = nextId;
      nextId += 1;
    }
    fetus.embryoId = id;
    used.add(id);
  }
  for (const fetus of fetuses) {
    fetus.fusionCheckedWith = [...new Set(
      (Array.isArray(fetus?.fusionCheckedWith) ? fetus.fusionCheckedWith : [])
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0 && id !== fetus.embryoId),
    )];
  }
  return fetuses;
}

function getFetusFatherSources(fetus) {
  return uniqueNonEmptyStrings(
    Array.isArray(fetus?.chimera?.fatherSources)
      ? fetus.chimera.fatherSources
      : String(fetus?.fathers || '').split(/\s*[×Xx]\s*/),
  );
}

function getFetusMaternalSources(fetus, carrierName) {
  if (Array.isArray(fetus?.providerSources) && fetus.providerSources.length > 0) {
    return uniqueNonEmptyStrings(fetus.providerSources);
  }
  const provider = String(fetus?.provider || '').trim();
  return uniqueNonEmptyStrings([provider || carrierName]);
}

function combineRaceDescriptors(...values) {
  return uniqueNonEmptyStrings(values.flatMap((value) => getRaceDescriptorComponents(value))).join('x') || '人类';
}

export function calculateChimeraFusionProbability(fetusA, fetusB) {
  const derivedA = String(fetusA?.fatherDerivedType || '').trim();
  const derivedB = String(fetusB?.fatherDerivedType || '').trim();
  let derivedMultiplier = 1;
  if (derivedA && derivedB) {
    if (derivedA !== derivedB) return 0;
    derivedMultiplier = 1.5;
  } else if (derivedA || derivedB) {
    derivedMultiplier = 0.5;
  }

  const raceA = String(fetusA?.race || '人类');
  const raceB = String(fetusB?.race || '人类');
  const physiologyA = getMergedRacePhysiologyProfile(raceA);
  const physiologyB = getMergedRacePhysiologyProfile(raceB);
  const identicalA = clampNumber(physiologyA?.identicalProbability, 0, 100, 5);
  const identicalB = clampNumber(physiologyB?.identicalProbability, 0, 100, 5);
  const difficultyA = clampNumber(physiologyA?.impregnationDifficulty, 0.1, 100, 1);
  const difficultyB = clampNumber(physiologyB?.impregnationDifficulty, 0.1, 100, 1);
  const identicalFactor = Math.sqrt(identicalA * identicalB);
  const difficultyFactor = 2 / (1 + Math.sqrt(difficultyA * difficultyB));
  const typeMultiplier = String(fetusA?.embryoType || deriveFetusEmbryoType(raceA))
    === String(fetusB?.embryoType || deriveFetusEmbryoType(raceB)) ? 1 : 0.25;
  return clampNumber(identicalFactor * difficultyFactor * typeMultiplier * derivedMultiplier, 0, 75, 0);
}

function createChimeraFetus(profile, carrierName, fetusA, fetusB, embryoId) {
  const fathers = uniqueNonEmptyStrings([...getFetusFatherSources(fetusA), ...getFetusFatherSources(fetusB)]);
  const maternalSources = uniqueNonEmptyStrings([
    ...getFetusMaternalSources(fetusA, carrierName),
    ...getFetusMaternalSources(fetusB, carrierName),
  ]);
  const genderSources = [String(fetusA?.gender || '未知'), String(fetusB?.gender || '未知')];
  const hasMale = genderSources.includes('男');
  const hasFemale = genderSources.includes('女');
  const gender = hasMale && hasFemale
    ? '待定'
    : (genderSources[0] === genderSources[1] ? genderSources[0] : (genderSources.includes('双') ? '双' : genderSources[0]));
  const fatherDerivedType = fetusA?.fatherDerivedType || fetusB?.fatherDerivedType || null;
  const race = combineRaceDescriptors(fetusA?.race, fetusB?.race);
  const motherDerivedType = profile?.base?.derivedType ? String(profile.base.derivedType) : null;
  const derivedSeed = getDerivedTypeSeed(motherDerivedType, fatherDerivedType);
  const providerSources = maternalSources.length > 1
    ? maternalSources
    : maternalSources.filter((source) => source !== carrierName);
  return {
    embryoId,
    fusionCheckedWith: [],
    fathers: fathers.join(' × ') || '未知',
    provider: providerSources.length === 0 ? null : providerSources.join(' × '),
    providerSources,
    race,
    fatherRace: combineRaceDescriptors(fetusA?.fatherRace, fetusB?.fatherRace),
    fatherDerivedType,
    gender,
    embryoType: deriveFetusEmbryoType(race),
    weight: (clampNumber(fetusA?.weight, 0.33, 3, 1) + clampNumber(fetusB?.weight, 0.33, 3, 1)) / 2,
    tendencyAngle: randomInt(0, 360),
    affinity: derivedSeed.affinity,
    maternalDerivedTypeProgress: derivedSeed.progress,
    chimera: {
      sourceCount: (Number(fetusA?.chimera?.sourceCount) || 1) + (Number(fetusB?.chimera?.sourceCount) || 1),
      fatherSources: fathers,
      maternalSources,
      genderSources,
    },
  };
}

function applyChimeraFusion(profile, carrierName) {
  const pregnant = profile.pregnant || {};
  const fetuses = ensureEmbryoMetadata(pregnant);
  if (clampNumber(profile?.base?.fertilizationDays, 0, 9999, 0) <= 1 || fetuses.length < 2) return;

  const candidates = fetuses.filter((fetus) => !fetus?.chimera);
  const pairs = [];
  for (let left = 0; left < candidates.length; left += 1) {
    for (let right = left + 1; right < candidates.length; right += 1) {
      const fetusA = candidates[left];
      const fetusB = candidates[right];
      if (!fetusA.fusionCheckedWith.includes(fetusB.embryoId)
        && !fetusB.fusionCheckedWith.includes(fetusA.embryoId)) {
        pairs.push([fetusA, fetusB]);
      }
    }
  }
  shuffleInPlace(pairs);
  const consumed = new Set();
  const fused = [];
  let nextId = getNextEmbryoId(fetuses);
  for (const [fetusA, fetusB] of pairs) {
    fetusA.fusionCheckedWith.push(fetusB.embryoId);
    fetusB.fusionCheckedWith.push(fetusA.embryoId);
    if (consumed.has(fetusA.embryoId) || consumed.has(fetusB.embryoId)) continue;
    const probability = calculateChimeraFusionProbability(fetusA, fetusB);
    if (probability > 0 && Math.random() < probability / 100) {
      consumed.add(fetusA.embryoId);
      consumed.add(fetusB.embryoId);
      fused.push(createChimeraFetus(profile, carrierName, fetusA, fetusB, nextId));
      nextId += 1;
    }
  }
  if (fused.length > 0) pregnant.fetuses = [...fetuses.filter((fetus) => !consumed.has(fetus.embryoId)), ...fused];
  pregnant.fetusesCount = pregnant.fetuses.length;
}

function resolvePendingChimeraGenders(fetuses) {
  for (const fetus of fetuses) {
    if (fetus?.gender !== '待定') continue;
    const roll = Math.random();
    fetus.gender = roll < 0.4 ? '男' : roll < 0.8 ? '女' : '双';
  }
}

function applyIdenticalSplit(profile) {
  const pregnant = profile.pregnant || {};
  const fetuses = ensureEmbryoMetadata(pregnant);
  if (fetuses.length === 0) return;

  const result = [];
  let nextId = getNextEmbryoId(fetuses);
  for (const baseFetus of fetuses) {
    result.push(baseFetus);
    const physiology = getMergedRacePhysiologyProfile(baseFetus?.race);
    const splitRate = clampNumber(
      physiology?.identicalProbability,
      0,
      100,
      clampNumber(profile?.bio?.identicalProbability, 0, 100, 5),
    ) / 100;
    let targetCount = 1;
    if (splitRate > 0 && Math.random() < splitRate) {
      targetCount = 2;
      if (Math.random() < splitRate * splitRate) {
        targetCount = 3;
        if (Math.random() < splitRate * splitRate * splitRate) targetCount = 4;
      }
    }
    while (targetCount > 1) {
      const clone = cloneIdenticalFetus(baseFetus);
      clone.embryoId = nextId;
      nextId += 1;
      result.push(clone);
      targetCount -= 1;
    }
  }
  pregnant.fetuses = result;
  pregnant.fetusesCount = result.length;
}

/**
 * @param profile 承载妊娠的角色（决定孕育环境：体重倍率、亲和度种子）
 * @param options.geneticProfile 提供卵子的一方；代孕／注卵时与承载者不同。
 *        胎儿种族按她推导；母系衍生类型始终来自实际孕育胚胎的承载者。
 */
function createSimpleFetus(profile, sperm, cycleStage, options = {}) {
  const geneticProfile = options.geneticProfile || profile;
  const motherRace = parseRaceDescriptor(geneticProfile?.base?.race || '人类').race || '人类';
  const fatherRace = parseRaceDescriptor(sperm?.race || motherRace || '人类').race || motherRace || '人类';
  const fetusRace = deriveFetusRace(motherRace, fatherRace);
  const gender = deriveFetusGender(fetusRace);
  const weightRatio = getConceptionWeightRatio(profile, sperm);
  const motherDerivedType = profile?.base?.derivedType ? String(profile.base.derivedType) : null;
  const fatherDerivedType = sperm?.derivedType ? String(sperm.derivedType) : null;
  const derivedSeed = getDerivedTypeSeed(motherDerivedType, fatherDerivedType);
  return {
    embryoId: null,
    fusionCheckedWith: [],
    fathers: String(sperm?.male || '未知'),
    // 自然受精恒为 null；代孕／注卵由植入工具指定归属
    provider: options.provider ? String(options.provider) : null,
    providerSources: options.provider ? [String(options.provider)] : [],
    race: fetusRace,
    fatherRace,
    fatherDerivedType,
    gender,
    embryoType: deriveFetusEmbryoType(fetusRace),
    weight: getConceptionWeight(cycleStage, gender, weightRatio),
    tendencyAngle: randomInt(0, 360),
    affinity: derivedSeed.affinity,
    maternalDerivedTypeProgress: derivedSeed.progress,
  };
}

function updateFetalEnergyDrain(profile) {
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  const effectivePregnantDays = clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0);
  const motherBreedTolerance = clampNumber(profile?.bio?.breedTolerance, 0.1, 100, 1.0);
  profile.pregnant.fetalEnergyDrain = fetuses.reduce((sum, fetus) => {
    const weight = clampNumber(fetus?.weight, 0.33, 3.0, 1.0);
    const ageInDays = effectivePregnantDays * weight;
    const fetalAgeWeeks = ageInDays / 7;
    const fetalLoad = fetalAgeWeeks / 40;
    const fetusEnergyDrain = fetalLoad / motherBreedTolerance;
    return sum + fetusEnergyDrain;
  }, 0);
}

function getEmbryoTypeModifiers(embryoType) {
  switch (String(embryoType || '胎生')) {
    case '卵生':
      return { recoveryCoefficient: 0.6 };
    case '卵胎生':
      return { recoveryCoefficient: 0.4 };
    case '胎转卵生':
      return { recoveryCoefficient: 1.0 };
    case '不定型':
      return { recoveryCoefficient: 0.8 };
    case '胎生':
    default:
      return { recoveryCoefficient: 0.2 };
  }
}

function snapshotOriginalPregnancyBio(character) {
  const runtime = character.runtime || {};
  if (runtime.originalPregnancyBio) return runtime.originalPregnancyBio;
  const bio = character?.profile?.bio || {};
  const snapshot = {
    gestationSpeciesSpeed: clampNumber(getGestationSpeciesSpeed(character?.profile), 0.1, 20, 1.0),
    birthDifficulty: clampNumber(bio.birthDifficulty, 0.1, 100, 1.0),
    breedTolerance: clampNumber(bio.breedTolerance, 0.1, 100, 1.0),
    recoveryDays: Math.max(1, Math.round(clampNumber(bio.recoveryDays, 1, 9999, 56))),
  };
  runtime.originalPregnancyBio = snapshot;
  character.runtime = runtime;
  return snapshot;
}

function applyPregnancyPhysiology(profile, runtime) {
  const pregnant = profile.pregnant || {};
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  if (fetuses.length === 0) return false;

  const originalBio = runtime?.originalPregnancyBio || {
    gestationSpeciesSpeed: clampNumber(getGestationSpeciesSpeed(profile), 0.1, 20, 1.0),
    birthDifficulty: clampNumber(profile?.bio?.birthDifficulty, 0.1, 100, 1.0),
    breedTolerance: clampNumber(profile?.bio?.breedTolerance, 0.1, 100, 1.0),
    recoveryDays: Math.max(1, Math.round(clampNumber(profile?.bio?.recoveryDays, 1, 9999, 56))),
  };

  let totalWeight = 0;
  let gestationDaysAccumulator = 0;
  let gestationCount = 0;
  let birthAccumulator = 0;
  let birthCount = 0;
  let recoveryAccumulator = 0;

  for (const fetus of fetuses) {
    const weight = clampNumber(fetus?.weight, 0.33, 3.0, 1.0);
    const embryoModifiers = getEmbryoTypeModifiers(fetus?.embryoType);
    const raceProfile = getMergedRacePhysiologyProfile(fetus?.race) || {};

    totalWeight += weight;
    const gestationSpeed = clampNumber(raceProfile.gestationSpeciesSpeed, 0.1, 20, 1.0);
    gestationDaysAccumulator += 280 / gestationSpeed;
    gestationCount += 1;
    birthAccumulator += clampNumber(raceProfile.birthDifficulty, 0.1, 100, 1.0);
    birthCount += 1;
    recoveryAccumulator += weight * embryoModifiers.recoveryCoefficient;
  }

  const averageGestationDays = gestationDaysAccumulator / Math.max(gestationCount, 1);
  const averageGestation = averageGestationDays > 0 ? 280 / averageGestationDays : 1.0;
  const averageBirth = birthAccumulator / Math.max(birthCount, 1);
  const averageRecoveryCoefficient = recoveryAccumulator / Math.max(totalWeight, 0.33);
  const fetusCountModifier = 1 + ((fetuses.length - 1) * 0.08);
  const toleranceCountModifier = Math.max(0.6, 1 - ((fetuses.length - 1) * 0.04));
  const gestationModifierMultiplier = getGestationModifierMultiplier(profile);

  const gestationEffectiveSpeed = clampNumber(averageGestation * gestationModifierMultiplier, 0, 20, averageGestation);
  const recoveryGestationSpeed = Math.max(0.1, gestationEffectiveSpeed > 0 ? gestationEffectiveSpeed : averageGestation);
  const birthDifficulty = clampNumber(averageBirth * fetusCountModifier, 0.1, 100, originalBio.birthDifficulty);
  // 承载耐受只取母体自身 x 胎数修正：breedTolerance 描述「这具身体多能扛妊娠」，
  // 是承载者的属性。此前还乘上胎儿族的 breedTolerance，等于把胎儿族的承载力
  // 当成母体的加成——人类怀龙胎会变成十倍耐受，比怀人类胎还轻松，方向是反的。
  // 跨种族的额外负担已由 getConceptionWeightRatio 换算成胎重，不该在这里再算一遍。
  const breedTolerance = clampNumber(originalBio.breedTolerance * toleranceCountModifier, 0.1, 100, originalBio.breedTolerance);
  const recoveryDays = Math.max(
    1,
    Math.round(clampNumber(averageRecoveryCoefficient, 0.1, 2.0, 0.2) * (280 / recoveryGestationSpeed) * (birthDifficulty / Math.max(breedTolerance, 0.1))),
  );

  profile.bio = {
    ...(profile.bio || {}),
    gestationSpeciesSpeed: clampNumber(averageGestation, 0.1, 20, 1.0),
    gestationEffectiveSpeed,
    birthDifficulty,
    breedTolerance,
    recoveryDays,
  };
  return true;
}

function restorePregnancyPhysiology(profile, runtime) {
  const originalBio = runtime?.originalPregnancyBio;
  if (!originalBio) return false;
  const gestationModifierMultiplier = getGestationModifierMultiplier(profile);
  profile.bio = {
    ...(profile.bio || {}),
    gestationSpeciesSpeed: clampNumber(originalBio.gestationSpeciesSpeed, 0.1, 20, 1.0),
    gestationEffectiveSpeed: clampNumber(originalBio.gestationSpeciesSpeed * gestationModifierMultiplier, 0, 20, 1.0),
    birthDifficulty: clampNumber(originalBio.birthDifficulty, 0.1, 100, 1.0),
    breedTolerance: clampNumber(originalBio.breedTolerance, 0.1, 100, 1.0),
    recoveryDays: Math.max(1, Math.round(clampNumber(originalBio.recoveryDays, 1, 9999, 56))),
  };
  delete runtime.originalPregnancyBio;
  return true;
}

function isObliquePosition(angle, fetus) {
  if (fetus && (fetus.embryoType === '胎转卵生' || fetus.embryoType === '不定型')) return false;
  const normalized = wrapAngle(angle);
  if ((normalized >= 0 && normalized <= 15) || (normalized >= 345 && normalized <= 360)) return false;
  if (normalized >= 165 && normalized <= 195) return false;
  if ((normalized >= 75 && normalized <= 105) || (normalized >= 265 && normalized <= 285)) return false;
  return true;
}

function calculateNearestMainPosition(angle) {
  const normalized = wrapAngle(angle);
  const positions = [0, 90, 180, 270];
  let nearest = positions[0];
  let minDiff = angleDistance(normalized, positions[0]);
  for (const position of positions) {
    const diff = angleDistance(normalized, position);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = position;
    }
  }
  return nearest;
}

function isTransversePosition(angle) {
  const normalized = wrapAngle(angle);
  return (normalized >= 75 && normalized <= 105) || (normalized >= 255 && normalized <= 285);
}

function getRealisticLaborObstruction(fetuses) {
  if (!Array.isArray(fetuses) || fetuses.length === 0) return null;
  const firstAngle = Number.isFinite(Number(fetuses[0]?.tendencyAngle)) ? wrapAngle(fetuses[0].tendencyAngle) : 0;
  if (isTransversePosition(firstAngle)) return '首位胎儿呈横位';
  if (fetuses.length < 2) return null;
  const secondAngle = Number.isFinite(Number(fetuses[1]?.tendencyAngle)) ? wrapAngle(fetuses[1].tendencyAngle) : 0;
  if (Math.abs(angleDistance(firstAngle, secondAngle) - 180) <= 15) return '前两胎胎位互锁';
  return null;
}

function calculatePositionDifficulty(angle, fetus) {
  const normalized = wrapAngle(angle);
  const embryoType = String(fetus?.embryoType || '胎生');

  if (embryoType === '胎转卵生') {
    const targetAngles = [0, 90, 180, 270, 360];
    let minDistance = 360;
    for (const targetAngle of targetAngles) {
      let distance = Math.abs(normalized - targetAngle);
      if (targetAngle === 360) distance = Math.min(distance, Math.abs(normalized - 0));
      if (distance < minDistance) minDistance = distance;
    }
    if (minDistance <= 5) return 1.5;
    return Math.min(2.25, 1.5 + ((minDistance - 5) * 0.075));
  }

  if (embryoType === '不定型') {
    const race = String(fetus?.race || '人类');
    const combinedSeed = Math.round(normalized * 1000) + race.charCodeAt(0) + race.charCodeAt(Math.max(0, race.length - 1));
    const seededValue = ((combinedSeed * 1664525 + 1013904223) % 2147483648) / 2147483648;
    return 1.0 + seededValue;
  }

  if (embryoType === '卵胎生') {
    if ((normalized >= 0 && normalized <= 5) || (normalized >= 355 && normalized <= 360)) return 1.0;
    if ((normalized >= 0 && normalized <= 15) || (normalized >= 345 && normalized <= 360)) return 1.25;
    if (normalized >= 175 && normalized <= 185) return 1.5;
    if (normalized >= 165 && normalized <= 195) return 1.75;
    if ((normalized >= 85 && normalized <= 95) || (normalized >= 275 && normalized <= 285)) return 2.0;
    if ((normalized >= 75 && normalized <= 105) || (normalized >= 265 && normalized <= 285)) return 2.25;
    return 1.33;
  }

  if (embryoType === '卵生') {
    if ((normalized >= 0 && normalized <= 15) || (normalized >= 345 && normalized <= 360)) return 1.0;
    if (normalized >= 165 && normalized <= 195) return 1.0;
    if ((normalized >= 75 && normalized <= 105) || (normalized >= 265 && normalized <= 285)) return 1.5;
    return 1.33;
  }

  if ((normalized >= 0 && normalized <= 15) || (normalized >= 345 && normalized <= 360)) return 1.0;
  if (normalized >= 165 && normalized <= 195) return 1.5;
  if ((normalized >= 75 && normalized <= 105) || (normalized >= 265 && normalized <= 285)) return 2.0;
  return 1.33;
}

function updateFetalPositions(profile, tick, female) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const stage = String(base.stage || '');
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  if (fetuses.length === 0) return;

  const gestationSpeed = clampNumber(getGestationEffectiveSpeed(profile), 0, 20, 1);
  // 逐日步进的上限：bsPassedTime 可以叠出十几万天，逐日推进会拖死 UI。
  // 10 年远超任何种族的妊娠期（最慢的 gestationSpeciesSpeed=0.1 也才 2800 天），
  // 正常剧情不会触到；只有荒谬的时间跳跃才会被截断。
  const MAX_DAILY_STEPS = 3650;
  const iterations = Math.min(MAX_DAILY_STEPS, Math.max(0, tick.passedDays));
  if (iterations <= 0 || !PREGNANCY_STAGES.includes(stage)) return;

  for (let step = 0; step < iterations; step += 1) {
    const totalWeight = fetuses.reduce((sum, fetus) => sum + clampNumber(fetus?.weight, 0.33, 3.0, 1.0), 0);
    if (stage === '孕晚期' && fetuses.length > 1) {
      const positionedIndexes = [];
      for (let index = 0; index < fetuses.length; index += 1) {
        const fetus = fetuses[index];
        if (!Number.isFinite(Number(fetus?.tendencyAngle))) fetus.tendencyAngle = randomInt(0, 360);
        const angle = wrapAngle(fetus.tendencyAngle);
        if ((angle >= 0 && angle <= 15) || (angle >= 345 && angle <= 360)) positionedIndexes.push(index);
      }
      if (positionedIndexes.length > 0) {
        const targetIndex = positionedIndexes[randomInt(0, positionedIndexes.length - 1)];
        const targetFetus = fetuses[targetIndex];
        const adjustmentSuccessRate = clampNumber(targetFetus?.weight, 0.33, 3.0, 1.0) / Math.max(totalWeight, 0.33);
        if (Math.random() > adjustmentSuccessRate) {
          targetFetus.tendencyAngle = wrapAngle(Number(targetFetus.tendencyAngle || 0) + (randomInt(-15, 15) * gestationSpeed));
        }
      }
    }

    for (const fetus of fetuses) {
      if (!Number.isFinite(Number(fetus?.tendencyAngle))) fetus.tendencyAngle = randomInt(0, 360);
      if (stage === '逾期') continue;

      let adjustmentSuccessRate = 1;
      if (fetuses.length > 1) {
        adjustmentSuccessRate = clampNumber(fetus?.weight, 0.33, 3.0, 1.0) / Math.max(totalWeight, 0.33);
      }
      if (Math.random() > adjustmentSuccessRate) continue;

      const currentAngle = wrapAngle(fetus.tendencyAngle);
      if (stage === '孕早期') {
        fetus.tendencyAngle = wrapAngle(currentAngle + (randomInt(-45, 45) * gestationSpeed));
      } else if (stage === '孕中期') {
        fetus.tendencyAngle = wrapAngle(currentAngle + (randomInt(-30, 30) * gestationSpeed));
      } else if (stage === '孕晚期') {
        if (currentAngle >= 0 && currentAngle <= 180) {
          fetus.tendencyAngle = Math.max(0, currentAngle - (randomInt(1, 5) * gestationSpeed));
        } else {
          const shifted = currentAngle + (randomInt(1, 5) * gestationSpeed);
          fetus.tendencyAngle = shifted >= 360 ? 0 : shifted;
        }
        if (fetus.tendencyAngle === 0 || fetus.tendencyAngle === 360) {
          fetus.tendencyAngle = wrapAngle(Number(fetus.tendencyAngle || 0) + (randomInt(-2, 2) * gestationSpeed));
        }
      } else if (stage === '临产期') {
        const targetAngle = calculateNearestMainPosition(currentAngle);
        const diffRaw = targetAngle - currentAngle;
        let diff = diffRaw;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        if (angleDistance(currentAngle, targetAngle) > 15) {
          fetus.tendencyAngle = wrapAngle(currentAngle + (Math.sign(diff) * randomInt(1, 3) * gestationSpeed));
        }
      }
    }

    if (fetuses.length > 1) {
      const originalOrder = fetuses.slice();
      if (stage === '孕早期' || stage === '孕中期') {
        shuffleInPlace(fetuses);
      } else if (stage === '孕晚期') {
        const oblique = [];
        const total = fetuses.reduce((sum, fetus) => sum + clampNumber(fetus?.weight, 0.33, 3.0, 1.0), 0);
        for (let index = fetuses.length - 1; index >= 0; index -= 1) {
          const fetus = fetuses[index];
          if (isObliquePosition(fetus?.tendencyAngle || 0, fetus)) {
            oblique.push({
              index,
              fetus,
              rate: clampNumber(fetus?.weight, 0.33, 3.0, 1.0) / Math.max(total, 0.33),
            });
          }
        }
        for (const entry of oblique) {
          if (Math.random() < entry.rate) {
            fetuses.splice(entry.index, 1);
            const newIndex = randomInt(0, fetuses.length);
            fetuses.splice(newIndex, 0, entry.fetus);
          }
        }
      } else if (stage === '临产期') {
        const total = fetuses.reduce((sum, fetus) => sum + clampNumber(fetus?.weight, 0.33, 3.0, 1.0), 0);
        if (fetuses.length > 1) {
          const firstRate = clampNumber(fetuses[0]?.weight, 0.33, 3.0, 1.0) / Math.max(total, 0.33);
          if (Math.random() < firstRate) {
            [fetuses[0], fetuses[1]] = [fetuses[1], fetuses[0]];
          }
        }
        if (fetuses.length > 2) {
          const lastIndex = fetuses.length - 1;
          const lastRate = clampNumber(fetuses[lastIndex]?.weight, 0.33, 3.0, 1.0) / Math.max(total, 0.33);
          if (Math.random() < lastRate) {
            [fetuses[lastIndex], fetuses[lastIndex - 1]] = [fetuses[lastIndex - 1], fetuses[lastIndex]];
          }
        }
      }
      const orderChanged = fetuses.some((fetus, index) => fetus !== originalOrder[index]);
      if (orderChanged) {
        profile.notify = {
          ...(profile.notify || {}),
          secondly: `${female}的胚胎分布发生了变化`,
        };
      }
    }
    // 下降不在这里推：这个循环是逐日的（passedDays <= 0 时整个函数直接 return），
    // 而下降是连续过程，推小时也该走。见 updateFetalDescent 的独立调用。
  }

  pregnant.fetuses = fetuses;
  pregnant.fetusesCount = fetuses.length;
  profile.pregnant = pregnant;
}

// 入盆：胎头下降到骨盆入口。引擎原先只有胎位角，没有承载这件事的字段，
// 于是「一个已经入盆、另一个还在上面」只能写在描述文字里，数值层不知道。
// 判定沿用既有的体重占比成功率——多胎抢同一个入口，谁都下得慢，巨大儿更慢；
// 臀位与横位根本入不了盆，胎头没朝下就没有可下降的东西。
function updateFetalDescent(profile, tick, female) {
  const stage = String(profile?.base?.stage || '');
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  if (fetuses.length === 0) return;
  const totalWeight = fetuses.reduce((sum, fetus) => sum + clampNumber(fetus?.weight, 0.33, 3.0, 1.0), 0);
  // 原地改 fetus 对象，不替换 profile.pregnant：外层 applyPassedTime 早先抓了
  // pregnant 的引用，换掉这个对象会把后续写进它的东西（engagedDays）切断。
  resolveFetalEngagement(profile, fetuses, stage, totalWeight, female, tick);
}

function resolveFetalEngagement(profile, fetuses, stage, totalWeight, female, tick) {
  if (!['临产期', '逾期'].includes(stage)) return;
  // 入盆锁：孕周没到，胎头不许开始下降。分娩要靠入盆加速，
  // 所以锁住入盆等于结构性地保证这段时间不会生——不是概率低，是路没修通。
  const effectiveDays = clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0);
  if (effectiveDays < getEngagementLockDays(Math.max(1, fetuses.length))) return;

  const hours = Math.max(0, Number(tick?.passedHours) || 0);

  for (const fetus of fetuses) {
    // 老数据只有布尔 engaged：给它一个对应的下降度，之后就都走这根轴。
    if (fetus.descent === undefined || fetus.descent === null) {
      fetus.descent = fetus.engaged ? DESCENT_ENGAGED : 0;
    }
    const wasEngaged = isDescentEngaged(fetus.descent);

    const angle = wrapAngle(Number(fetus?.tendencyAngle) || 0);
    const isHeadDown = angle <= 30 || angle >= 330;
    if (!isHeadDown) {
      // 转成臀位或横位就没有可下降的东西了。已经深固定的例外：
      // 胎头卡在骨盆里转不回去，那时候胎位数字变了也不该把它拔出来。
      if (!isDescentFixed(fetus.descent)) fetus.descent = 0;
      fetus.engaged = isDescentEngaged(fetus.descent);
      continue;
    }

    // 多胎抢同一个入口，谁都下得慢，巨大儿更慢。
    const share = fetuses.length > 1
      ? clampNumber(fetus?.weight, 0.33, 3.0, 1.0) / Math.max(totalWeight, 0.33)
      : 1;
    const wasFixed = isDescentFixed(fetus.descent);
    const step = getDescentStep(stage, hours, share, angle);
    fetus.descent = clampNumber(fetus.descent + step, 0, 100, fetus.descent);
    fetus.engaged = isDescentEngaged(fetus.descent);

    if (!wasEngaged && fetus.engaged) {
      profile.notify = {
        ...(profile.notify || {}),
        secondly: `${female}的一名胎儿已入盆，胎头压住膀胱与直肠`,
      };
    } else if (!wasFixed && isDescentFixed(fetus.descent)) {
      profile.notify = {
        ...(profile.notify || {}),
        secondly: `${female}的胎头已深固定在骨盆里，再也推不回去了`,
      };
    }
  }
}

/**
 * 把胎头往回顶一部分。
 *
 * 这是下降轴存在的理由：二值 engaged 只能表达「整个浮回去」，
 * 表达不了「退一」。深度越大越推不动，到固定线完全无效。
 * 引擎不关心她用什么姿势推、推得多用力——那些是剧情层的事，
 * 这里只把力度折算成实际退了多少。
 */
function applyFetalPushback(profile, amount, female) {
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  if (fetuses.length === 0 || !(amount > 0)) return;

  let movedAny = false;
  let blockedAny = false;
  for (const fetus of fetuses) {
    const current = clampNumber(fetus?.descent, 0, 100, 0);
    if (current <= 0) continue;
    const back = resolveDescentPushback(current, amount);
    if (back <= 0) {
      if (isDescentFixed(current)) blockedAny = true;
      continue;
    }
    fetus.descent = clampNumber(current - back, 0, 100, current);
    fetus.engaged = isDescentEngaged(fetus.descent);
    movedAny = true;
  }
  if (!movedAny && !blockedAny) return;

  profile.notify = {
    ...(profile.notify || {}),
    secondly: movedAny
      ? `${female}把胎头往回顶了一些，下坠感暂时轻了`
      : `${female}再怎么使力也顶不回去了，胎头卡在骨盆里不动`,
  };
}

function updateProdromalFetalPositions(profile, tick) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const stage = String(base.stage || '');
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  if (fetuses.length === 0 || stage !== '产兆前驱') return;
  const passedHours = Math.max(0, tick.passedHours);
  if (passedHours <= 0) return;

  const birthDifficulty = clampNumber(profile?.bio?.birthDifficulty, 0.1, 100, 1);
  for (const fetus of fetuses) {
    const currentAngle = Number.isFinite(Number(fetus?.tendencyAngle)) ? wrapAngle(fetus.tendencyAngle) : randomInt(0, 360);
    fetus.tendencyAngle = currentAngle;
    if (!isObliquePosition(currentAngle, fetus)) continue;
    const targetAngle = calculateNearestMainPosition(currentAngle);
    let diff = targetAngle - currentAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const adjustment = Math.min(angleDistance(currentAngle, targetAngle), (passedHours * 5) / birthDifficulty);
    fetus.tendencyAngle = wrapAngle(currentAngle + (Math.sign(diff) * adjustment));
  }

  pregnant.fetuses = fetuses;
  profile.pregnant = pregnant;
}

function stageAllowsSpermRetention(stage) {
  return MENSTRUAL_STAGES.includes(stage) || PREGNANCY_STAGES.includes(stage) || stage === '产后恢复' || stage === '假孕期';
}

function processSpermLifecycle(profile, stage, tick) {
  const base = profile.base || {};
  const sperms = Array.isArray(base.sperms) ? base.sperms.map((item) => ({ ...item })) : [];
  if (sperms.length === 0) {
    base.sperms = [];
    return;
  }

  if (stage === '月经期' && tick.passedHours > 0) {
    base.sperms = [];
    return;
  }

  if (!stageAllowsSpermRetention(stage)) {
    base.sperms = [];
    return;
  }

  base.sperms = sperms
    .map((item) => ({
      ...item,
      value: Math.max(0, clampNumber(item?.value, 0, 999999, 0) - (tick.deltaDays * 10)),
    }))
    .filter((item) => item.value > 0);
}

function processSimpleConception(profile, tick, notify, name) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const stage = String(base.stage || '');
  const deltaDays = tick.deltaDays;
  const fullDays = tick.passedDays;
  const passedHours = tick.passedHours;
  const allowsNaturalConception = [...MENSTRUAL_STAGES, '产后恢复'].includes(stage);

  if (allowsNaturalConception) {
    // 一次性排出本周期的份额：按天累加会让长排卵期窗口把卵数堆到上限，
    // 而取 min 封顶又会把高潮诱发排卵已经排出的卵砍掉
    if (stage === '排卵期' && fullDays > 0 && !(profile.cooldown || {}).naturalOvulationUsed) {
      base.eggs = clampNumber(base.eggs, 0, 99, 0) + getNaturalOvulationTotal(profile);
      profile.cooldown = { ...(profile.cooldown || {}), naturalOvulationUsed: true };
    }

    if (stage === '月经期' && passedHours > 0) {
      base.eggs = 0;
    } else if (base.eggs > 0 && fullDays > 0 && stage !== '排卵期') {
      base.eggs = Math.max(0, clampNumber(base.eggs, 0, 99, 0) - fullDays);
    }

    const sperms = Array.isArray(base.sperms) ? base.sperms.map((item) => ({ ...item })) : [];
    const availableSperms = sperms.filter((item) => clampNumber(item?.value, 0, 999999, 0) > 0);
    let eggs = clampNumber(base.eggs, 0, 99, 0);
    const femaleDifficulty = clampNumber(profile?.bio?.impregnationDifficulty, 0.1, 100, 1.0);

    while (eggs > 0 && availableSperms.length > 0) {
      const totalSperm = availableSperms.reduce((sum, item) => sum + clampNumber(item?.value, 0, 999999, 0), 0);
      let winner = null;
      for (const sperm of availableSperms) {
        const share = totalSperm > 0 ? clampNumber(sperm?.value, 0, 999999, 0) / totalSperm : 0;
        const maleDifficulty = clampNumber(getMergedRacePhysiologyProfile(sperm?.race)?.impregnationDifficulty, 0.1, 100, 1.0);
        const isSameRace = isSameRaceGroup(profile?.base?.race, sperm?.race);
        let effectiveDifficulty = isSameRace ? femaleDifficulty : (femaleDifficulty + maleDifficulty);
        const femaleEmbryoType = deriveFetusEmbryoType(profile?.base?.race);
        const maleEmbryoType = deriveFetusEmbryoType(sperm?.race);
        if (femaleEmbryoType !== maleEmbryoType) effectiveDifficulty *= 1.5;
        const spermBaseChance = Math.max(0.001, Math.min(0.8, (deltaDays * 12 * 0.5) / effectiveDifficulty));
        const spermChance = Math.max(0.001, Math.min(0.8, spermBaseChance * share));
        if (Math.random() <= spermChance) {
          winner = sperm;
          break;
        }
      }
      if (winner) {
        pregnant.fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
        pregnant.fetuses.push(createSimpleFetus(profile, winner, stage));
        notify.secondly = `${name}受精成功`;
        eggs -= 1;
      }
      break;
    }
    base.eggs = eggs;
  }

  const hasPreimplantationEmbryos = !isPregnancyStage(stage)
    && Array.isArray(pregnant.fetuses)
    && pregnant.fetuses.length > 0;
  if (hasPreimplantationEmbryos) {
    ensureEmbryoMetadata(pregnant);
    base.fertilizationDays = clampNumber(base.fertilizationDays, 0, 9999, 0) + deltaDays;
    const beforeFusionCount = pregnant.fetuses.length;
    applyChimeraFusion(profile, name);
    if (pregnant.fetuses.length < beforeFusionCount) notify.secondly = `${name}的早期受精卵发生了融合`;
    if (base.fertilizationDays >= getImplantationDays(profile)) {
      const vitalityCap = getVitalityInitByLevel(base.vitalityLevel);
      const vitalityRatio = clampNumber(base.vitality, 0, vitalityCap, vitalityCap) / Math.max(1, vitalityCap);
      const implantationFailChance = (1 - vitalityRatio) * 0.5;
      if (Math.random() < implantationFailChance) {
        pregnant.fetuses = [];
        pregnant.fetusesCount = 0;
        pregnant.fetalEnergyDrain = 0;
        base.fertilizationDays = 0;
        notify.secondly = `${name}因身体虚弱，胚胎著床失败`;
      } else {
        const obstetricPregnantDays = base.fertilizationDays + getObstetricPregnancyOffsetDays(profile);
        const gestationSpeed = clampNumber(getGestationEffectiveSpeed(profile), 0, 20, 1);
        applyIdenticalSplit(profile);
        resolvePendingChimeraGenders(pregnant.fetuses);
        base.stage = '孕早期';
        base.days = 0;
        base.fertilizationDays = 0;
        pregnant.pregnantDays = obstetricPregnantDays;
        pregnant.effectivePregnantDays = obstetricPregnantDays * gestationSpeed;
        pregnant.amnionDurability = 100;
        profile.experience = {
          ...(profile.experience || {}),
          pregnantExperience: clampNumber(profile?.experience?.pregnantExperience, 0, 999, 0) + 1,
        };
        notify.firstly = `${name}进入了孕早期`;
      }
    }
  } else if (!isPregnancyStage(stage)) {
    base.fertilizationDays = 0;
  }

  pregnant.fetusesCount = Array.isArray(pregnant.fetuses) ? pregnant.fetuses.length : 0;
  updateFetalEnergyDrain(profile);
}
function normalizeToolCallArguments(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function isPregnancyStage(stage) {
  return PREGNANCY_STAGES.includes(stage) || stage === '假孕期' || stage === '产兆前驱' || LABOR_STAGES.includes(stage);
}

function clearPsychologyTransitionState(profile, stage, days) {
  const psychology = profile?.psychology;
  if (!psychology || typeof psychology !== 'object') return;
  const pregnant = profile?.pregnant || {};

  if (isTruePregnancyStage(stage) && clampNumber(pregnant.effectivePregnantDays, 0, 9999, 0) > 7) {
    psychology.mens = buildEmptyPsychologyGroup(PSY_MENS_FIELDS, PSY_MENS_BOOL_FIELDS);
  }

  if (stage === '产后恢复' && clampNumber(days, 1, 9999, 1) > 7) {
    psychology.preg = buildEmptyPsychologyGroup(PSY_PREG_FIELDS, PSY_PREG_BOOL_FIELDS);
  }
}

function isTruePregnancyStage(stage) {
  return PREGNANCY_STAGES.includes(stage) || stage === '产兆前驱' || LABOR_STAGES.includes(stage);
}

function canProduceMilk(profile) {
  const stage = String(profile?.base?.stage || '');
  return stage === '假孕期' || stage === '产后恢复' || isTruePregnancyStage(stage);
}

function hasDerivedMetabolism(profile) {
  return Boolean(String(profile?.base?.derivedType || '').trim());
}

function getMetabolismExemptionSet(profile) {
  if (!hasDerivedMetabolism(profile)) return new Set();
  return new Set(getDerivedTypeMetabolismExemptions(profile?.base?.derivedType));
}

function isMetabolismExempt(profile, key) {
  return getMetabolismExemptionSet(profile).has(key);
}

function applyDerivedMetabolismExemptions(profile) {
  if (!hasDerivedMetabolism(profile)) return;
  const metabolism = profile.metabolism || {};
  for (const key of getMetabolismExemptionSet(profile)) {
    metabolism[key] = 0;
  }
  profile.metabolism = metabolism;
}


// 已经入盆的胎数。膀胱只认「有没有」（一个胎头压住骨盆入口就到顶，
// 第二个挤不进同一个位置），直肠认「有几个」（压的是子宫下段的重量）。
// engaged 由 descent 派生：下降度够深就算入盆。
//
// 保留 fetus.engaged 作为兼容读数（显式设过就认），但真源是 descent——
// 于是「入盆」不再是一个开关，而是一根轴上的一段，能被往回推一部分。
function isFetusEngaged(fetus) {
  if (fetus?.descent !== undefined && fetus.descent !== null) {
    return isDescentEngaged(fetus.descent);
  }
  return Boolean(fetus?.engaged);
}

// 入盆进度（连续）：先露胎 descent 映射到 [0,1]。膀胱的「有没有」仍是二值
//（getEngagedFetusCount），压多重归这根连续轴——多胎只有先露那一个往里走。
// ── 体力引擎（TASK-11）───────────────────────────────────────────────
// 三层：体质上限（VITALITY_CAPS，天赋）/ 软顶（派生，回不到满）/ 当前值。
// 消耗只读行为（底噪＋活动档位＋产程速率），状态的影响全在软顶那边。

function getVitalityCapOf(profile) {
  return getVitalityInitByLevel(profile?.base?.vitalityLevel);
}

function getVitalityRuntime(profile) {
  if (!profile.vitalityRuntime || typeof profile.vitalityRuntime !== 'object') {
    profile.vitalityRuntime = { acuteLevel: 0, acuteMinutes: 0, faintMinutes: 0, sugarToday: 0, sugarDay: '' };
  }
  if (!Number.isFinite(profile.vitalityRuntime.acuteLevel)) profile.vitalityRuntime.acuteLevel = 0;
  if (!Number.isFinite(profile.vitalityRuntime.acuteMinutes)) profile.vitalityRuntime.acuteMinutes = 0;
  if (!Number.isFinite(profile.vitalityRuntime.faintMinutes)) profile.vitalityRuntime.faintMinutes = 0;
  return profile.vitalityRuntime;
}

// 软顶的单源入口。派生量、不存盘；只压回复上限，永不砸当前值。
function getVitalitySoftCapOf(profile) {
  return getVitalitySoftCap(profile, getVitalityCapOf(profile));
}

// 活动消耗：模型报「哪一档（1 轻／2 中／3 重）＋几分钟」。
// 乘数：经期 × 吃力期以下 × 入盆深度，叠乘后钳 VITALITY_MULT_CAP。
// 耗竭档硬撑（class ≥ 2）触发晕倒授权。
function applyVitalityActivity(profile, activityClass, minutes, female) {
  if (profile?.immune?.metabolism) return { drained: 0 };
  const runtime = getVitalityRuntime(profile);
  if (runtime.faintMinutes > 0) return { drained: 0, fainted: true };
  const cls = Math.max(1, Math.min(VITALITY_ACTIVITY_MAX_CLASS, Math.floor(Number(activityClass) || 0)));
  const mins = Math.max(0, Math.min(600, Number(minutes) || 0));
  if (mins <= 0) return { drained: 0 };

  const base = profile.base || {};
  const cap = getVitalityCapOf(profile);
  const value = clampNumber(base.vitality, 0, cap, cap);
  const ratio = value / Math.max(1, cap);

  let mult = 1;
  if (['月经期'].includes(String(base.stage || ''))) mult *= VITALITY_MENSTRUAL_MULT;
  if (ratio < 0.5) mult *= VITALITY_TIRED_MULT;
  const progress = getEngagementProgress(profile);
  const engagedMult = VITALITY_ENGAGED_MIN_MULT + (VITALITY_ENGAGED_MAX_MULT - VITALITY_ENGAGED_MIN_MULT) * progress;
  mult *= engagedMult;
  mult = Math.min(VITALITY_MULT_CAP, mult);

  const ratePerMin = VITALITY_ACTIVITY_PER_MIN[cls] || 0;
  const drained = ratePerMin * mins * mult;

  // 急性状态：重档拉满、中档一半——分钟级演出，提示词层读它把演出压一档。
  if (cls >= 3) {
    runtime.acuteLevel = 2;
    runtime.acuteMinutes = Math.max(runtime.acuteMinutes, 12);
  } else if (cls === 2) {
    runtime.acuteLevel = Math.max(runtime.acuteLevel, 1);
    runtime.acuteMinutes = Math.max(runtime.acuteMinutes, 6);
  }

  const next = clampNumber(value - drained, 0, cap, value);
  base.vitality = next;

  // 晕倒授权：耗竭档＋硬撑，或直接贴底。晕倒期间消耗暂停（tick 里跳过）。
  let fainted = false;
  if (ratio <= VITALITY_EXHAUSTED_RATIO && cls >= 2) {
    runtime.faintMinutes = FAINT_MIN_MINUTES + Math.floor(Math.random() * (FAINT_MAX_MINUTES - FAINT_MIN_MINUTES + 1));
    fainted = true;
  } else if (value <= VITALITY_BLACKOUT_RATIO * cap) {
    runtime.faintMinutes = FAINT_MAX_MINUTES;
    fainted = true;
  }
  if (fainted) {
    profile.notify = {
      ...(profile.notify || {}),
      secondly: female + '眼前一黑，身子软了下去——晕了过去',
    };
  }
  return { drained, fainted };
}

// 逐轮结算：底噪（全程）＋产程速率（阶段给，模型不用报）＋急性衰减＋体力低推困意。
// 闭式计算：deltaMinutes × 速率一次算完，绝不逐分钟循环。
function applyVitalityTick(profile, tick) {
  if (profile?.immune?.metabolism) return;
  const runtime = getVitalityRuntime(profile);
  const base = profile.base || {};
  const cap = getVitalityCapOf(profile);
  const stage = String(base.stage || '');
  const minutes = Math.max(0, Number(tick?.deltaMinutes) || 0);

  // 晕倒中：消耗暂停，倒计时走完自己醒。
  if (runtime.faintMinutes > 0) {
    runtime.faintMinutes = Math.max(0, runtime.faintMinutes - minutes);
    runtime.acuteMinutes = 0;
    runtime.acuteLevel = 0;
    return;
  }

  let drain = VITALITY_IDLE_DRAIN_PER_HOUR * (minutes / 60);

  // 产程：速率由阶段给，模型不用报档。
  const laborRate = LABOR_VITALITY_PER_HOUR[stage];
  if (laborRate !== undefined) {
    drain += laborRate * (minutes / 60);
  }

  // 急性衰减：分钟倒计时走完清档。「跑完歇会儿能走了」＝这里衰减完毕，零特判。
  if (runtime.acuteMinutes > 0) {
    runtime.acuteMinutes = Math.max(0, runtime.acuteMinutes - minutes);
    if (runtime.acuteMinutes === 0) runtime.acuteLevel = 0;
  }

  const value = clampNumber(base.vitality, 0, cap, cap);
  const softCap = getVitalitySoftCapOf(profile);

  // 体力低于软顶 30%：困意按小时爬（长期虚弱可见化）。困意有满档兜底，环收敛。
  if (softCap > 0 && value < softCap * 0.3) {
    const sleepCap = BASE_METABOLISM_CAP;
    const currentSleep = clampNumber(profile?.metabolism?.sleep, 0, sleepCap, 0);
    if (currentSleep < sleepCap) {
      profile.metabolism.sleep = clampNumber(currentSleep + LOW_VITALITY_SLEEPINESS_PER_HOUR * (minutes / 60), 0, sleepCap, currentSleep);
    }
  }

  base.vitality = clampNumber(value - drain, 0, cap, value);
}

// 睡觉回复：排解困意的每一点回体力。困意高打折（没睡够，歇也歇不回来）。
// 入盆深睡不实，再打八折。回复量的两成推尿意（晨起那一次）。
function applyVitalitySleepRecovery(profile, relievedSleepiness) {
  if (!(relievedSleepiness > 0) || profile?.immune?.metabolism) return 0;
  const runtime = getVitalityRuntime(profile);
  if (runtime.faintMinutes > 0) return 0;
  const base = profile.base || {};
  const cap = getVitalityCapOf(profile);
  const softCap = getVitalitySoftCapOf(profile);
  const sleepCap = BASE_METABOLISM_CAP;
  const sleepiness = clampNumber(profile?.metabolism?.sleep, 0, sleepCap, 0) / Math.max(1, sleepCap);
  let mult = 1;
  if (sleepiness > SLEEPINESS_RECOVERY_QUARTER) mult = SLEEP_RECOVERY_MULT_QUARTER;
  else if (sleepiness > SLEEPINESS_RECOVERY_HALF) mult = SLEEP_RECOVERY_MULT_HALF;
  if (getEngagementProgress(profile) >= ENGAGED_SLEEP_PROGRESS_THRESHOLD) mult *= ENGAGED_SLEEP_RECOVERY_MULT;

  const value = clampNumber(base.vitality, 0, cap, cap);
  const room = Math.max(0, Math.min(softCap, cap) - value);   // 软顶只管回复上限
  const recovery = Math.min(room, relievedSleepiness * SLEEP_RECOVERY_PER_SLEEPINESS * mult);
  if (recovery <= 0) return 0;
  base.vitality = clampNumber(value + recovery, 0, cap, value);

  // 晨起尿意：回复量的两成——是「那一次」，不是两趟厕所。
  addMetabolismValue(profile, 'urine', recovery * SLEEP_TO_URINE_RATIO, 0, BASE_METABOLISM_CAP);
  return recovery;
}

// 正餐小回：排解饿意顺带回一点体力。
function applyVitalityMealRecovery(profile, relievedHunger) {
  if (!(relievedHunger > 0) || profile?.immune?.metabolism) return 0;
  const base = profile.base || {};
  const cap = getVitalityCapOf(profile);
  const softCap = getVitalitySoftCapOf(profile);
  const value = clampNumber(base.vitality, 0, cap, cap);
  const room = Math.max(0, Math.min(softCap, cap) - value);
  const recovery = Math.min(room, relievedHunger * MEAL_RECOVERY_PER_HUNGER);
  if (recovery <= 0) return 0;
  base.vitality = clampNumber(value + recovery, 0, cap, value);
  return recovery;
}

// 快糖：即时小额，当日第 n 次递减（12/8/4），不许靠糖水无限续命。
function applyVitalitySugar(profile, female) {
  const runtime = getVitalityRuntime(profile);
  const today = new Date().toISOString().slice(0, 10);
  if (runtime.sugarDay !== today) {
    runtime.sugarDay = today;
    runtime.sugarToday = 0;
  }
  if (runtime.sugarToday >= SUGAR_DOSE.length) {
    return { applied: false, message: '快糖当日上限已用完（' + SUGAR_DOSE.length + ' 次）' };
  }
  const dose = SUGAR_DOSE[runtime.sugarToday];
  runtime.sugarToday += 1;
  const base = profile.base || {};
  const cap = getVitalityCapOf(profile);
  const softCap = getVitalitySoftCapOf(profile);
  const value = clampNumber(base.vitality, 0, cap, cap);
  const room = Math.max(0, Math.min(softCap, cap) - value);
  const recovery = Math.min(room, dose);
  base.vitality = clampNumber(value + recovery, 0, cap, value);
  return { applied: true, recovery, message: female + '吃了点甜的，缓过来一口气（体力 +' + Math.round(recovery) + '）' };
}

// 宫压增速打折：体力耗竭与情压过阈两路，叠乘不归零（产程照走，只是更慢）。
function getVitalityPressureMultiplier(profile) {
  const cap = getVitalityCapOf(profile);
  const value = clampNumber(profile?.base?.vitality, 0, cap, cap);
  let mult = 1;
  if (value <= VITALITY_EXHAUSTED_RATIO * cap) mult *= PRESSURE_MULT_EXHAUSTED;
  const psy = clampNumber(profile?.base?.psyStress, 0, 200, 100);
  if (psy > PRESSURE_PSY_THRESHOLD) mult *= PRESSURE_MULT_PSY;
  return mult;
}

function getEngagementProgress(profile) {
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  let deepest = 0;
  for (const fetus of fetuses) {
    const d = Number(fetus?.descent) || 0;
    if (d > deepest) deepest = d;
  }
  return engagementProgressFromDescent(deepest);
}

function getEngagedFetusCount(profile) {
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  return fetuses.reduce((sum, fetus) => sum + (isFetusEngaged(fetus) ? 1 : 0), 0);
}

// 先露胎（已入盆里最深的那个）的 descent——入盆修正的深度插值读它。
function getEngagedFetusDescent(profile) {
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  const engaged = fetuses.filter((fetus) => isFetusEngaged(fetus));
  if (engaged.length === 0) return 40;
  return Math.max(...engaged.map((fetus) => clampNumber(fetus?.descent, 0, 100, 40)));
}

// 深固定的胎数：真前驱的判据。跟入盆不是一回事——入盆还能被顶回去，
// 深固定不能。
function getFixedFetusCount(profile) {
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  return fetuses.reduce((sum, fetus) => sum + (isDescentFixed(fetus?.descent) ? 1 : 0), 0);
}


// 延产声明：AI 在正文里报一次（延产药/过期妊娠体质等）系统记住，默认自然逾期。
// 照 morningSicknessResolved 覆写口同一模式。
function isProlongedPregnancy(profile) {
  return profile?.pregnant?.prolonged === true;
}

// 尿意的「该去了」那条线。档位的满档落在这里，排空落点也以它为基准。
// 多胎把满档收窄（结构性差异，TASK-02 §十二）。
function getUrineUrgeThreshold(profile) {
  const base = getUrineUrgeCap(
    String(profile?.base?.stage || ''),
    getEngagedFetusCount(profile),
    getEngagementProgress(profile),
    isProlongedPregnancy(profile),
  );
  const adjust = getUrineMultipleAdjust(Math.max(1, clampNumber(profile?.pregnant?.fetusesCount, 0, 99, 1)));
  return Math.max(1, base + adjust.urge);
}

// ── 栏二：感觉层（TASK-02_尿意重写 §四，2026-09-04 接口拍板）────────
// 临时压 urge 线，会退，不加值——值只在两种时候动：栏一真的产出来（加），
// 或者尿真的出去了（减）。存储形态拍板：{source, amount, expiresAt} 列表单键存取，
// 「最小间隔」存 lastTriggeredAt；同一来源在间隔内再触发直接忽略，不叠加也不刷新。
// 咖啡因/酒精走「浓度」单值：续杯只刷新 expiresAt，不叠倍数。
export const URINE_SENSE_EFFECTS = Object.freeze({
  water_sound: { amount: 6, min: 10, max: 20, cooldownMin: 5 },
  seeing_toilet: { amount: 10, durationMin: null, cooldownMin: 20, onlyHighBand: true }, // 到她去为止
  caffeine: { amount: 8, min: 180, max: 300, refreshOnRepeat: true },
  cold_food: { amount: 5, min: 60, max: 120, cooldownMin: 30 },
  nervousness: { amount: 7, min: 4, max: 10, untilClear: true, strength: true },
  fetal_kick: { amount: 8, min: 2, max: 5, cooldownMin: 10 },
  posture_shift: { amount: 5, min: 2, max: 4, cooldownMin: 2 },
  arousal: { amount: 10, durationMin: null, untilClear: true },   // 接触期间
  overactive: { amount: 4, durationMin: 240, cooldownMin: 60, stack: true }, // 憋久可叠
});

function getUrineSenseEffects(profile) {
  const list = profile?.urine?.senseEffects;
  return Array.isArray(list) ? list : [];
}

function writeUrineSenseEffects(profile, list) {
  profile.urine = { ...(profile.urine || {}), senseEffects: list };
}

// 清掉过期的，返回还活着的偏移总量。
function pruneUrineSenseEffects(profile, now = Date.now()) {
  const alive = getUrineSenseEffects(profile).filter((e) => e.expiresAt === null || e.expiresAt > now);
  if (alive.length !== getUrineSenseEffects(profile).length) writeUrineSenseEffects(profile, alive);
  return alive.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

// 有效满线 = 满线 − Σ活着的栏二偏移。档位切分与触发线都读这条。
function getUrineEffectiveUrge(profile) {
  const base = getUrineUrgeThreshold(profile);
  return Math.max(0, base - pruneUrineSenseEffects(profile));
}

// 触发一次栏二效果。strength 1-10 只对 nervousness 那类有效，钳进表的 min/max。
function applyUrineSenseEffect(profile, source, strength = null) {
  const spec = URINE_SENSE_EFFECTS[source];
  if (!spec || profile?.immune?.metabolism || isMetabolismExempt(profile, 'urine')) return false;
  const now = Date.now();
  pruneUrineSenseEffects(profile, now);

  // 「看到厕所」第二道钳：只在高档起生效——膀胱空着时看到厕所不会突然想尿。
  if (spec.onlyHighBand) {
    const cap = getMetabolismCap(profile, 'urine');
    const current = clampNumber(profile?.metabolism?.urine, 0, cap, 0);
    if (getUrineLevel(current, getUrineUrgeThreshold(profile), cap) !== '高' && getUrineLevel(current, getUrineUrgeThreshold(profile), cap) !== '满' && getUrineLevel(current, getUrineUrgeThreshold(profile), cap) !== '爆') {
      return false;
    }
  }

  const list = getUrineSenseEffects(profile);
  const existing = list.find((e) => e.source === source);
  const lastAt = existing?.lastTriggeredAt || 0;
  if (spec.cooldownMin && now - lastAt < spec.cooldownMin * 60000) return false;   // 间隔内：忽略，不叠不刷新

  const amount = spec.strength && strength !== null
    ? clampNumber(Number(strength), spec.min, spec.max, spec.amount)
    : (spec.min !== undefined ? Math.floor(randomNumber(spec.min, spec.max + 1)) : spec.amount);

  // 排尿清口：seeing_toilet / arousal 持续到她去/接触结束，由排尿与刺激结束方清。
  const durationMin = spec.untilClear ? null : (spec.durationMin ?? (spec.refreshOnRepeat ? Math.floor(randomNumber(spec.min, spec.max + 1)) : (spec.min ?? 10) ));
  const expiresAt = durationMin === null ? null : now + durationMin * 60000;

  if (existing && (spec.refreshOnRepeat || spec.stack)) {
    existing.expiresAt = spec.refreshOnRepeat ? expiresAt : existing.expiresAt;
    if (spec.stack) existing.amount = clampNumber(existing.amount + amount, 0, 20, existing.amount); // 憋久可叠，钳 20
    existing.lastTriggeredAt = now;
  } else {
    const cleared = list.filter((e) => e.source !== source);
    cleared.push({ source, amount, expiresAt, lastTriggeredAt: now });
    writeUrineSenseEffects(profile, cleared);
  }
  return true;
}

// 排尿那一刻清掉「到她去为止」的两条。
function clearUrineSenseOnVoid(profile) {
  const kept = getUrineSenseEffects(profile).filter((e) => e.source !== 'seeing_toilet' && e.source !== 'overactive');
  writeUrineSenseEffects(profile, kept);
}

// ── 漏表（TASK-02 §八）：应激事件 × 当前档 → 倾向等，与阶段开等取更低 ──
// 六步结算：阶段开到哪一等 → 动作倾向等 → 两头取更低 → 按等扣值（孕晚及以后大漏取高端）
// → 不破地板（失禁例外，先落到失禁落点再由地板回推）→ 已湿的衣外仍可写湿，里面只扣渗的点。
// 等：0 无 / 1 渗 / 2 一小股 / 3 一股 / 4 失禁。
const URINE_LEAK_STAGE_MATRIX = Object.freeze({
  非孕:      [0, 0, 0, 1, 2, 3],
  孕早期:    [0, 0, 0, 0, 1, 3],
  孕中期:    [0, 0, 0, 1, 2, 4],
  孕晚期:    [0, 0, 0, 1, 2, 4],
  临产期:    [0, 0, 0, 2, 3, 4],
  自然逾期:  [0, 0, 0, 1, 3, 4],
  延产:      [0, 0, 0, 2, 3, 4],
  产后恢复:  [0, 0, 0, 1, 2, 4],
  产兆前驱:  [0, 0, 0, 2, 3, 4],
  第一产程:  [0, 0, 0, 2, 3, 4],
  第二产程:  [0, 0, 0, 2, 3, 4],
  第三产程:  [0, 0, 0, 1, 2, 3],
});
// 倾向等：半档 = 概率二选一（0.5=无或渗，3.5=一股或失禁）。
const URINE_LEAK_ACTION_TIER = Object.freeze({
  cough:  { 无: 0, 低: 0, 中: 0, 高: 1, 满: 2, 爆: 2.5 },
  laugh:  { 无: 0, 低: 0, 中: 0, 高: 1, 满: 2, 爆: 2.5 },
  sneeze: { 无: 0, 低: 0, 中: 0, 高: 1, 满: 2, 爆: 2.5 },
  lift:   { 无: 0, 低: 0.5, 中: 0.5, 高: 2, 满: 3, 爆: 3.5 },
  insert: { 无: 1, 低: 1, 中: 1, 高: 3, 满: 3.5, 爆: 4 },
  orgasm: { 无: 1, 低: 1, 中: 1, 高: 3, 满: 3.5, 爆: 4 },
});
const URINE_LEAK_TIER_LABELS = Object.freeze({ 1: '渗', 2: '漏了一小股', 3: '漏了一股', 4: '失禁' });

function resolveUrineStressEvent(profile, event, female) {
  const tierByLevel = URINE_LEAK_ACTION_TIER[event];
  if (!tierByLevel || profile?.immune?.metabolism || isMetabolismExempt(profile, 'urine')) return null;
  const stage = String(profile?.base?.stage || '');
  if (stage === '第二产程') {
    // 锁定机制：没得憋，用力就漏。
    const drop = Math.floor(randomNumber(8, 13));
    const metabolism = profile.metabolism || {};
    metabolism.urine = Math.max(0, clampNumber(metabolism.urine, 0, 39, 0) - drop);
    profile.metabolism = metabolism;
    profile.notify = { ...(profile.notify || {}), secondly: `${female}用力的时候漏出了尿——这个阶段根本收不住` };
    return { tier: 3, drop, level: null };
  }
  const prolonged = isProlongedPregnancy(profile);
  const stageKey = stage === '逾期' ? (prolonged ? '延产' : '自然逾期') : stage;
  const cap = getMetabolismCap(profile, 'urine');
  const urgeCap = getUrineUrgeThreshold(profile);
  const current = clampNumber(profile?.metabolism?.urine, 0, cap, 0);
  const level = getUrineLevel(current, urgeCap, cap);
  const levelIndex = ['无', '低', '中', '高', '满', '爆'].indexOf(level);
  if (levelIndex < 0) return null;

  // 阶段开等：入盆后整行左移一格（同样的等在更低一档就开放——往右偏半格）。
  const row = URINE_LEAK_STAGE_MATRIX[stageKey] ?? URINE_LEAK_STAGE_MATRIX.非孕;
  let allowed = row[levelIndex];
  if (getEngagedFetusCount(profile) > 0 && levelIndex > 0) {
    allowed = Math.max(allowed, row[levelIndex - 1]);
  }
  // 动作倾向等，半档掷一次。
  let tier = tierByLevel[level] ?? 0;
  if (!Number.isInteger(tier)) {
    tier = Math.random() < 0.5 ? Math.floor(tier) : Math.ceil(tier);
  }
  tier = Math.min(Math.round(tier), allowed);
  if (tier < 1) return null;

  const floor = getUrineFloor(stage, getEngagedFetusCount(profile), getEngagementProgress(profile), prolonged);
  const severe = ['孕晚期', '临产期', '自然逾期', '延产'].includes(stageKey) || getEngagedFetusCount(profile) > 0;
  let drop;
  if (tier === 4) {
    // 失禁：真的空了——落到 min(0.20×满档, 0.35×地板)，随后地板回推。
    drop = Math.max(0, current - Math.min(urgeCap * 0.20, floor * 0.35));
  } else if (tier === 1) {
    drop = randomNumber(1, 3);
  } else if (tier === 2) {
    drop = severe ? randomNumber(6, 8) : randomNumber(4, 6);
  } else {
    drop = severe ? randomNumber(12, 15) : randomNumber(8, 12);
  }
  const next = tier === 4
    ? Math.min(current, Math.min(urgeCap * 0.20, floor * 0.35))
    : Math.max(floor, current - drop);
  const metabolism = profile.metabolism || {};
  metabolism.urine = clampNumber(next, 0, cap, current);
  profile.metabolism = metabolism;
  profile.notify = {
    ...(profile.notify || {}),
    secondly: `${female}${URINE_LEAK_TIER_LABELS[tier]}${tier === 4 ? '——真的收不住了' : ''}`,
  };
  return { tier, drop, level };
}

// 这个人的乳腺出口是哪一档。建卡时定，不认的值回落中档。
// 返回的是带体质修正后的闸值（openWeek 和 produce 已调整）——全链路只此一处做体质修正。
function getMilkGateOf(profile) {
  return getMilkGateAdjusted(profile?.bio?.milkGate, profile?.bio?.milkConstitution);
}

// 这个人的体质档。不认的值回落普通。
function getMilkConstitutionOf(profile) {
  return getMilkConstitution(profile?.bio?.milkConstitution);
}


// 发育进度与容量都在 metabolism_config 里算，面板（index.js）读的是同一份——
// 容量若两边各算一次，「满了几成」在两处会对不上。这里只负责从 profile 取参数。
// 体质修正（openWeek ±1）在 getMilkDevelopmentFromDays 里生效。
function getMilkDevelopment(profile) {
  return getMilkDevelopmentFromDays(
    profile?.bio?.milkGate,
    profile?.bio?.milkConstitution,
    profile?.pregnant?.effectivePregnantDays,
    isTruePregnancyStage(String(profile?.base?.stage || '')),
  );
}

// 乳意的容量。面板那根条读的是「存量 ÷ 容量 ＝ 满了几成」，所以这条线是地基：
// 不给容量随发育长，「满了几成」就退化成「绝对值除以 150」，早期永远读不到高档，
// 于是「任何阶段都能胀到发烫」这一整套落不了地。
// 容量不乘体质系数——多奶是产得多不是容器大。
export function getMilkCapacity(profile) {
  return getMilkCapacityFromDays(
    profile?.bio?.milkGate,
    profile?.bio?.milkConstitution,
    profile?.pregnant?.effectivePregnantDays,
    isTruePregnancyStage(String(profile?.base?.stage || '')),
  );
}

// getMetabolismCap 对尿意返回的是「收不住」那条硬线，也就是值的天花板。
// 想去与收不住之间那段是憋耐余量，只有 getUrineUrgeThreshold 能读到。
export function getMetabolismCap(profile, key, currentFlux = 0) {
  const baseCap = key === 'urine'
    ? getUrineHardCap(String(profile?.base?.stage || ''), getEngagedFetusCount(profile), getEngagementProgress(profile), isProlongedPregnancy(profile))
      + getUrineMultipleAdjust(Math.max(1, clampNumber(profile?.pregnant?.fetusesCount, 0, 99, 1))).urge   // 上限跟着满档收（urge 修正为负值）
    : key === 'milk'
      ? getMilkCapacity(profile)
      : key === 'libido'
        ? Math.round(getLibidoLinesOf(profile).hard)
        : BASE_METABOLISM_CAP;
  return baseCap;
}

// 尿意的档位与权重都要两条线，单独包一层省得每个调用点各算一遍。
function getUrineLevelOf(profile, value) {
  return getUrineLevel(value, getUrineUrgeThreshold(profile), getMetabolismCap(profile, 'urine'));
}

function applyMetabolismCapacityLimits(profile) {
  const metabolism = profile?.metabolism || {};
  for (const key of METABOLISM_KEYS) {
    metabolism[key] = isMetabolismExempt(profile, key)
      ? 0
      : clampNumber(metabolism[key], 0, getMetabolismCap(profile, key), 0);
  }
  if (hasDerivedMetabolism(profile)) {
    const flux = Number(metabolism.flux) || 0;
    const cap = getMetabolismCap(profile, 'flux', flux);
    metabolism.flux = clampNumber(flux, -cap, cap, 0);
  }
  profile.metabolism = metabolism;
}

// source 决定这次增量走基础侧还是刺激侧的分档权重。
// 高档起基础侧归零、刺激侧翻倍——身体到那个程度不再自己攒，全靠外部推过线。
//
// 尿意和性欲各有一张表，而且**都按满线切**（不按天花板等比缩放）：
// 两者的满线与天花板之间都留了一段余量，等比缩放会把那段的比例绑死。
// 其余五项没有满线的概念，仍走原来那张按 cap 缩放的表，行为完全不变。
// 代谢免疫挡住其余七项，但**不挡性欲**（理由见 advanceLibido 上面那一段）。
// 种族抵免（isMetabolismExempt）仍然照挡：那是「这个种族没有这一项」，
// 跟「这个角色不受生理需求累积影响」不是一回事。
function addMetabolismValue(profile, key, delta, min = 0, max = BASE_METABOLISM_CAP, source = 'base') {
  if (!delta || isMetabolismExempt(profile, key)) return 0;
  if (profile?.immune?.metabolism && key !== 'libido') return 0;
  const metabolism = profile.metabolism || {};
  const activeMax = max === BASE_METABOLISM_CAP ? getMetabolismCap(profile, key, Number(metabolism[key]) || 0) : max;
  const current = clampNumber(metabolism[key], min, activeMax, 0);
  let adjustedDelta = delta;
  if (delta > 0) {
    if (key === 'urine') {
      const weights = getUrineBandWeights(current, getUrineUrgeThreshold(profile), activeMax);
      adjustedDelta *= source === 'stimulus' ? weights.stimulus : weights.base;
    } else if (key === 'libido') {
      // ⚠️ 不能跟尿意共用一张表——方向正好相反（尿意是憋着时刺激更有效，
      // 性欲是低位想象有效、高位身体接触有效）。共用的只有「按满线切」这个做法。
      const weights = getLibidoBandWeights(current, getLibidoUrgeThreshold(profile), activeMax);
      adjustedDelta *= source === 'stimulus' ? weights.stimulus : weights.base;
    } else {
      const weights = getMetabolismBandWeights(current, activeMax);
      adjustedDelta *= source === 'stimulus' ? weights.stimulus : weights.base;
    }
  }
  const next = clampNumber(current + adjustedDelta, min, activeMax, current);
  metabolism[key] = next;
  profile.metabolism = metabolism;
  return next - current;
}

// 原本这里是 (0.15 + progress)，那个 0.15 是常数，于是受孕第一天就有产量——
// 跟开奶周（紧 22／中 16／松 13／全开 11）直接冲突。现在改成读发育进度：
// 开奶周之前是 0（面板读 0，孕早期那点胀走正文，因为它是腺体在长不是存出来的），
// 之后从 0 开始按天涨。
function getMilkFetalLoad(profile) {
  const stage = String(profile?.base?.stage || '');
  if (stage === '产后恢复') return 1.35;
  if (stage === '假孕期') return 0.08;
  if (!isTruePregnancyStage(stage)) return 0;

  const development = getMilkDevelopment(profile);
  if (development <= 0) return 0;
  const pregnant = profile?.pregnant || {};
  const fetalEnergyDrain = clampNumber(pregnant.fetalEnergyDrain, 0, 9999, 0);
  const fetusesCount = Math.max(1, clampNumber(pregnant.fetusesCount, 0, 99, 0));
  return clampNumber(development * (0.5 + fetalEnergyDrain + (fetusesCount * 0.15)), 0, 12, 0);
}

// 里面到底有没有奶。孕期看发育（开奶周之前是 0），产后和假孕沿用原来的孕周系数
// ——产后整块不做，代码原来什么样就什么样。
function hasMilkSupply(profile) {
  return getMilkFetalLoad(profile) > 0;
}

// 一次结算：一个动作从开始到停算一次，断掉的时候按「这一次爬到多高」记电荷。
// **没停、直接去了的那一次不记** —— 那一次的电荷花在这次高潮上（去了要卸）。
// 这一条就是「一直死顶最重永远是小」的全部来源：一次都没断过，攒不起来。
function closeLibidoInstance(state, orgasmed = false) {
  if (!state.instanceOpen) return state.charge;
  if (orgasmed) return state.charge;
  return clampNumber(state.charge + getChargeGainForPeak(state.instancePeak), 0, LIBIDO_CHARGE_MAX, 0);
}

// ── 大档高潮的镇痛窗口（TASK-05 拍板 #7）──────────────────────────────
// 门控理论：快感与痛觉在脊髓抢同一条上传通路，高潮那一刻内啡肽泼出来，
// 痛觉被压住。所以大档（只有大档）去完之后的这一小段时间里，阵痛按折扣读。
// 计时器挂在 pregnant 上（libidoAnalgesia 分钟），随 bsPassedTime 一起倒数；
// 折扣的施加点在 tracker.js 的读侧——产程每轮都会 updateLaborPain 重写痛值，
// 写侧打折会被下一次推进冲掉。窗口是一次性的：只在大档结算那一刻开出，
// 平时的性唤起不给镇痛，那是「去完了」才有的待遇。
function openLibidoAnalgesia(profile) {
  const pregnant = profile.pregnant || {};
  pregnant.libidoAnalgesia = LIBIDO_ANALGESIA_MIN;
  profile.pregnant = pregnant;
  return pregnant.libidoAnalgesia;
}

function tickLibidoAnalgesia(profile, minutes) {
  const pregnant = profile?.pregnant || {};
  const remaining = Math.max(0, Number(pregnant.libidoAnalgesia) || 0);
  if (remaining <= 0) return;
  pregnant.libidoAnalgesia = Math.max(0, remaining - Math.max(0, Number(minutes) || 0));
  profile.pregnant = pregnant;
}

// 去了：读一次电荷定档，然后按档卸掉、按档落 A、按档进不应期。
function fireLibidoOrgasm(profile, state) {
  const tier = getOrgasmTier(state.charge);
  const spec = LIBIDO_AFTERMATH[tier];
  const lines = getLibidoLinesOf(profile);
  const metabolism = profile.metabolism || {};

  // A 掉到哪：小 = 仍明显高于起点，中 = 刚过满线附近，大 = 起点略上。
  const dropTo = spec.dropTo === 'floor'
    ? lines.floor + (lines.urge - lines.floor) * 0.08
    : spec.dropTo === 'urge'
      ? lines.urge * 1.02
      : lines.urge - (lines.urge - lines.floor) * 0.25;
  metabolism.libido = clampNumber(dropTo, 0, lines.hard, 0);
  profile.metabolism = metabolism;

  if (tier === '大') openLibidoAnalgesia(profile);

  return {
    tier,
    gate: 0,
    charge: clampNumber(state.charge * LIBIDO_CHARGE_RETAIN[tier], 0, LIBIDO_CHARGE_MAX, 0),
    habit: clampNumber(state.habit * LIBIDO_HABIT.orgasmRetain, 0, LIBIDO_HABIT.max, 0),
    refractoryMin: getLibidoRefractoryMinutes(profile, tier),
    refractoryTier: tier,
    instancePeak: 0,
    instanceOpen: false,
    lastTier: tier,
  };
}

// 推进性欲。**必须读分钟，不能读小时** —— 一场戏推 5~15 分钟，
// 按小时算的表现不是滑落，是「连着几轮不动，然后一次掉一大块」。
//
// stimulusMinutes 是刺激分钟，不是本轮分钟：一轮可能覆盖半小时但只有五分钟在动手。
// 调用方负责拿本轮实际时长掐住它。
// ⚠️ **性欲不受「代谢免疫」管。**
// 那个开关的意思是「她不饿不困不想上厕所」，不是「她不会起来」——两件事。
// 原版性欲住在 base.libido，跟那七样不在一块，这个开关碰不到它（免疫那一段
// 只抹六项，一次都没提性欲）。我们为了用分档权重把它搬进 metabolism，
// 于是这个开关顺手把它一起关了：实测免疫开着时，最重的档做她二十分钟，
// 值 41.7 → 41.7，一步都不动。那是搬家的副作用，没人决定过。
function advanceLibido(profile, classIndex, stimulusMinutes, totalMinutes) {
  const lines = getLibidoLinesOf(profile);
  const state = getLibidoState(profile);
  const spec = getLibidoClass(classIndex);
  const stimMin = Math.max(0, Number(stimulusMinutes) || 0);
  const allMin = Math.max(stimMin, Number(totalMinutes) || 0);
  if (allMin <= 0) return null;

  const patch = {};
  let charge = state.charge;
  let gate = state.gate;
  let habit = state.habit;
  let instancePeak = state.instancePeak;
  let instanceOpen = state.instanceOpen;
  let afterglowMin = state.afterglowMin;
  let afterglowPeak = state.afterglowPeak;
  let denial = state.denial;
  let refractoryMin = clampNumber(state.refractoryMin - allMin, 0, 9999, 0);
  let refractoryTier = refractoryMin > 0 ? state.refractoryTier : null;
  let orgasmTier = null;

  // 不应期打折（2026-09-03 拍板，TASK-05 #3）：那几分钟里刺激效率剩 stimScale，
  // 值与闸都乘它。三档统一走这一条路——旧的「大档接触一刀切归零」整组旁路已删
  // （dodging 三处跳过：刺激段跳过、接触当没碰上、余韵不给），它们跟「系数替代归零」
  // 互斥，留着就是双轨。硬规则不变：刺激还在进行的分钟整列不走衰减，
  // 大档 0.2 只压增量，不改变「接触中不下落」。
  const refractorySpec = refractoryTier ? LIBIDO_AFTERMATH[refractoryTier] : null;
  const refractoryScale = refractorySpec?.stimScale ?? 1;
  const landed = spec.contact;

  // 换档把习惯化抖掉一部分；同一档一直做则继续累积。
  if (classIndex !== state.activeClass) {
    habit = clampNumber(habit - LIBIDO_HABIT.switchDropPerMin * allMin, 0, LIBIDO_HABIT.max, 0);
  }

  if (stimMin > 0 && classIndex > 0) {
    // 他又开始了 → 余韵作废。她身上那股劲现在有外面的来源了，不用自己撑着。
    afterglowMin = 0;
    afterglowPeak = 0;

    // A 涨。周期倍率、孕期类别放大、被丢下攒的敏感度都乘在这儿（闸一概不乘）。
    // 不应期效率系数也乘在这条乘区上：去完那几分钟同样的碰法只剩几成效果。
    // 孕期动态全局倍率也乘这条（拍板 #4）：早孕 0.8 谷底、孕晚 1.25 顶、
    // 正文报一次 morningSicknessResolved 直接回 1.0。它管值涨速，
    // 不乘闸——闸速是「多快去」，倍率是「多想要」，不是一回事。
    const cycleMul = getLibidoCycleMultiplier(String(profile?.base?.stage || ''));
    const pregMul = getPregnancyClassScale(classIndex, getLibidoPregnancyProgress(profile));
    const globalScale = getPregnancyGlobalScale(
      profile?.pregnant?.effectivePregnantDays,
      profile?.pregnant?.morningSicknessResolved,
    );
    const rawGain = spec.valuePerMin * stimMin * cycleMul * pregMul * globalScale * (1 + denial) * refractoryScale;

    // C1／C2 推不进爆档：最高只能把 A 送到满线上头一点。
    // 它们负责「悬在满」，不负责「顶满天花板」。
    const softCeiling = LIBIDO_SOFT_CLASSES.includes(classIndex)
      ? Math.min(lines.hard, lines.urge + LIBIDO_SOFT_CEILING_OVER_URGE)
      : lines.hard;
    const before = clampNumber(profile?.metabolism?.libido, 0, lines.hard, 0);
    if (before < softCeiling) {
      addMetabolismValue(profile, 'libido', rawGain, 0, softCeiling, spec.side);
    }

    // 闸爬。逐分钟推是为了让「超出满线多少」跟着 A 一起变，
    // 但分钟数由模型报、已被本轮时长掐住，所以循环长度有界。
    if (spec.gatePerMin > 0) {
      // ⚠️ **只有接触档（C3/C4/C5）算「一次」。** 环境类不开一次。
      // 「一次」的语义是有人在对她做一件事，那件事有开头有结尾，停下来是个事件。
      // 坐着被顶着、走路磨着是底噪，没有「他停手」那一下——
      // 让它开一次会导致每个回合（一小时）都结算一笔 4 电荷，走一整天攒出 96，
      // 下一次真去直接读大档；余韵标签也会在没人碰她的时候亮起来。
      // 这个坑跟电荷表 peak 从 0 改成 1 是同一个，换了个地方又长出来一次。
      if (spec.contact) instanceOpen = true;
      const steps = Math.min(600, Math.ceil(stimMin));
      const stepLen = stimMin / steps;
      for (let i = 0; i < steps; i += 1) {
        // 闸速同样吃不应期系数：去完那几分钟里，同一个动作推闸也只剩几成力。
        const speed = getLibidoGateSpeed(profile, classIndex, { habit }) * refractoryScale;
        gate = clampNumber(gate + speed * stepLen, 0, LIBIDO_GATE_FULL, 0);
        instancePeak = Math.max(instancePeak, gate);
        habit = clampNumber(habit + LIBIDO_HABIT.perMin * stepLen, 0, LIBIDO_HABIT.max, 0);
        if (gate >= LIBIDO_GATE_FULL) break;
      }
    }

    // 闸爬满 100 ＝ 去了。
    if (gate >= LIBIDO_GATE_FULL) {
      const fired = fireLibidoOrgasm(profile, { ...state, charge, habit });
      orgasmTier = fired.tier;
      Object.assign(patch, fired);
      writeLibidoState(profile, {
        ...patch,
        afterglowMin: 0,
        afterglowPeak: 0,
        // 去了一次就基本清掉：她要的东西拿到了，不再是「被丢下」的状态。
        denial: clampNumber(denial * LIBIDO_DENIAL.orgasmRetain, 0, LIBIDO_DENIAL.max, 0),
        activeClass: classIndex,
      });
      return { tier: orgasmTier, gate: 0, charge: patch.charge, refractoryMin: patch.refractoryMin };
    }
  }

  // 停手（或者这一轮没有刺激分钟）→ 这一次断了，按爬到多高记电荷。
  // **同一处开余韵**：他停手之后她身上那股劲不会立刻散，强度和长短看停在多高。
  // 顺带记一次「被撩起来又丢下」。
  if (instanceOpen && (classIndex === 0 || stimMin <= 0 || !landed)) {
    charge = closeLibidoInstance({ ...state, charge, instancePeak, instanceOpen }, false);
    const glow = getAfterglowForPeak(instancePeak);
    if (glow) {
      afterglowMin = glow.min;
      afterglowPeak = instancePeak;
    }
    if (instancePeak >= LIBIDO_DENIAL.minPeak) {
      denial = clampNumber(denial + LIBIDO_DENIAL.perClose, 0, LIBIDO_DENIAL.max, 0);
    }
    instanceOpen = false;
    instancePeak = 0;
  }

  // A 朝**起点**落，不朝 0 落。**刺激还在进行的那几分钟整列不走**（硬规则）。
  // （原「大档不应期整轮算闲着」的例外随 dodging 一起删了——打折语义下
  //   接触算有效刺激，只是效率两成。）
  //
  // ⚠️ 判据是「这一分钟有没有刺激」，不是「有没有身体接触」。
  // 原来这里读的是 landed（只认 C3/C4/C5），于是想象与环境类的每一分钟都同时
  // 吃进增量和衰减：C2 在高档时增量 3.2/小时、衰减 6/小时，净负——
  // 结果「走一整天可以到满」永远走不到，入盆后（起点就在高档）增量干脆是 0。
  // 口径那句「只有停手，A 才往起点落」讲的是刺激停了，不是手离开了。
  const active = spec.gatePerMin > 0 || spec.valuePerMin > 0;
  const idleMin = !active
    ? allMin
    : Math.max(0, allMin - stimMin);
  if (idleMin > 0) {
    // 没人碰她的这几分钟拆成两段：**先走余韵，烧完了才开始真的消退。**
    const glowMin = Math.min(afterglowMin, idleMin);
    const trueIdle = idleMin - glowMin;

    if (glowMin > 0) {
      const glow = getAfterglowForPeak(afterglowPeak);
      if (glow) {
        // 值在这一段**不掉**——这就是「他停手不等于什么都没发生」的全部内容。
        // 这里不写任何加值，是试过之后砍掉的：
        //
        //   走 base 那一列 → 满／爆两档的 base 是 0（挡住走路、衣服把她顶进爆档），
        //     于是余韵在她过了满线时整个乘成 0，恰好在最该起作用的地方失效。
        //   走 stimulus 那一列 → 爆档权重 1.8，余韵在她最高的时候反而最猛；
        //     再叠上爆档只掉 3/小时（那个慢是对的，高位不泄慢慢退才是实际的），
        //     结果停手一小时之后她**比他停手那一刻还高**。荒唐。
        //
        // 「被丢在那儿越久越想要」那一层没有丢，只是不放在这根条上：
        // 往上爬的那半归闸（贴边才推得动），累积的那半归 denial（下一次起得更快）。
        // 这根条在余韵里的正确行为就是**停在原地**。

        // 闸也慢慢爬。**这就是「他没收住」的全部来源**——停在很高的位置时
        // 她自己那点反应够把闸推过 100，停在中段就推不过去。不另设临界点。
        //
        // ⚠️ 乘的是**闸自己的高度**（三次方），不是「值超出满线多少」。
        // 后者在她顶着天花板时恒等于 1，会让闸 40 的时候她自己的反应也全速爬闸
        // ——那等于「他停手」在任何高度都同样致命，停在 97 和停在 40 一样。
        const ratio = clampNumber(gate / LIBIDO_GATE_FULL, 0, 1, 0);
        const nearEdge = Math.pow(ratio, LIBIDO_AFTERGLOW_GATE_CURVE);
        gate = clampNumber(gate + glow.gatePerMin * glowMin * nearEdge, 0, LIBIDO_GATE_FULL, 0);
      }
      afterglowMin = clampNumber(afterglowMin - glowMin, 0, 9999, 0);
      if (afterglowMin <= 0) afterglowPeak = 0;

      // ⚠️ **必须在消退之前结算。** 余韵和消退在时间上是先后的：她先在那股劲里，
      // 烧完了才开始平下来。原来把这个判断放在整段之后，于是余韵把闸推到 100、
      // 紧接着被后面那几分钟的消退压回去，「他没收住」永远不会发生
      //（停在 97 和停在 84 一样，都落到 77——那个 77 就是被压回来的痕迹）。
      if (gate >= LIBIDO_GATE_FULL) {
        const fired = fireLibidoOrgasm(profile, { ...state, charge, habit });
        Object.assign(patch, fired);
        writeLibidoState(profile, {
          ...patch,
          afterglowMin: 0,
          afterglowPeak: 0,
          denial: clampNumber(denial * LIBIDO_DENIAL.orgasmRetain, 0, LIBIDO_DENIAL.max, 0),
          activeClass: classIndex,
        });
        return {
          tier: fired.tier, gate: 0, charge: patch.charge, refractoryMin: patch.refractoryMin,
        };
      }
    }

    if (trueIdle > 0) {
      const metabolism = profile.metabolism || {};
      const current = clampNumber(metabolism.libido, 0, lines.hard, 0);
      // 静息位收敛（TASK-05 第二批）：高于静息位往下消（孕期 ×0.7 打折）、
      // 低于静息位往爬，收敛到静息位停。非孕/产后/谷底静息位=floor，行为退化成现状。
      const resting = getLibidoRestingTarget(profile, lines);
      if (current > resting) {
        // 消退按被丢下的次数放慢：没去成的消退比去成了慢得多，
        // 盆腔充血不会因为他停手就退。同一个计数器管两头。
        // 孕期激素维持高位底噪——消退全程打七折，体感「凉得慢」。
        const weights = getLibidoBandWeights(current, lines.urge, lines.hard);
        const relief = 1 - (denial / LIBIDO_DENIAL.max) * LIBIDO_DENIAL.decayRelief;
        const decayScale = isTruePregnancyStage(String(profile?.base?.stage || '')) ? 0.7 : 1;
        const dropped = current - (weights.decayPerHour * relief * decayScale * (trueIdle / 60));
        metabolism.libido = clampNumber(Math.max(resting, dropped), 0, lines.hard, current);
        profile.metabolism = metabolism;
      } else if (current < lines.floor) {
        // 低于起点就往起点回：起点是底噪，不是需要努力维持的高度。
        metabolism.libido = clampNumber(Math.min(lines.floor, current + (trueIdle / 60) * 6), 0, lines.hard, current);
        profile.metabolism = metabolism;
      } else if (current < resting) {
        // 起点到静息位之间：激素推力——高潮后从 floor 慢慢爬回静息位（拍板速率表）。
        const rate = getLibidoRestingClimbRate(profile);
        if (rate > 0) {
          metabolism.libido = clampNumber(Math.min(resting, current + rate * (trueIdle / 60)), 0, lines.hard, current);
          profile.metabolism = metabolism;
        }
      }
      // 闸在余韵烧完之后才开始滑走：它不是攒下来的东西，电荷才是。
      //
      // **按比例滑，不按固定速率。** 原来是每分钟固定 -3，跟当前高度无关，
      // 于是停久一点就把闸清成 0——「做 5 分钟停 15 分钟」这种慢慢撩的打法
      // 净值是负的，永远走不到去，而那是个正常玩法不该被机制堵死。
      gate = clampNumber(gate * Math.pow(0.5, trueIdle / LIBIDO_GATE_HALFLIFE_MIN), 0, LIBIDO_GATE_FULL, 0);
      // 一直没人碰她，被丢下攒的那点敏感度也慢慢散，睡一觉清光。
      denial = clampNumber(denial - LIBIDO_DENIAL.decayPerHour * (trueIdle / 60), 0, LIBIDO_DENIAL.max, 0);
      // 习惯化也在退。原来只有换档才掉，于是「做五分钟停半小时」这种打法
      // 她越做越钝，一路钝到闸再也爬得上去——那个死局有一半是这里来的。
      habit = clampNumber(habit - LIBIDO_HABIT_IDLE_DROP_PER_MIN * trueIdle, 0, LIBIDO_HABIT.max, 0);
    }
  }

  writeLibidoState(profile, {
    gate, charge, habit, refractoryMin, refractoryTier,
    instancePeak, instanceOpen, afterglowMin, afterglowPeak, denial,
    activeClass: classIndex, lastTier: state.lastTier,
  });
  return { tier: null, gate, charge, refractoryMin };
}

// ── 出口状态与堵的计数器 ──────────────────────────────────────────────
// 这两样跟存量是分开的三件事之二：
//   她多难受 → 看满了几成（存量÷容量，getMetabolismLevel 原生支持）
//   溢出来什么样 → 查表，看闸和发育，不看满了几成
//   会不会堵 → 看在高位待了多久
// 前五版都用一个数管三件事，全部崩在同一处，所以这里必须是独立字段。
const MILK_BLOCK_STAGES = Object.freeze([4, 8, 16, 24]);
const MILK_BLOCK_FULLNESS = 0.7;      // 满度到这里以上、又没有效排空，计数器才走
const MILK_CRUST_HOURS = 6;           // 长时间只有干在原地／渗一点点 → 结痂

function getMilkState(profile) {
  const milk = profile?.milk && typeof profile.milk === 'object' ? profile.milk : {};
  return {
    // 出口：通着 / 结痂。那块痂把乳头口堵住了，抠掉之后反而更容易出来。
    duct: milk.duct === '结痂' ? '结痂' : '通着',
    blockHours: clampNumber(milk.blockHours, 0, 9999, 0),
    quietHours: clampNumber(milk.quietHours, 0, 9999, 0),
  };
}

function writeMilkState(profile, next) {
  profile.milk = { ...(profile?.milk || {}), ...next };
  return profile.milk;
}

// 满了几成。容量为 0 时算 0，别让除法炸出 Infinity。
function getMilkFullness(profile) {
  const cap = Math.max(1, getMetabolismCap(profile, 'milk'));
  return clampNumber((Number(profile?.metabolism?.milk) || 0) / cap, 0, 1, 0);
}

// 堵到第几格：0=没事，1~4 对应 4／8／16／24 小时那四段。
// 最后一格（堵住）排不掉——挤压加重肿、路更窄，所以它不由排乳清零。
function getMilkBlockStage(profile) {
  const hours = getMilkState(profile).blockHours;
  let stage = 0;
  for (const threshold of MILK_BLOCK_STAGES) {
    if (hours >= threshold) stage += 1;
  }
  return stage;
}

export function isMilkBlocked(profile) {
  return getMilkBlockStage(profile) >= MILK_BLOCK_STAGES.length;
}

// 按时长算是对的，判据是「现实里那件事到底是不是时间造成的」：
// 堵奶就是「存久了自然会出事」，按时长算是它本来的样子。
// （高潮不是「绷久了自然会发生」，所以性欲那边不许按时长——别看到这里就去把两边统一。）
// 这一段时间里，有多少小时是待在阈值以上的。
// 一次算完，不逐小时循环——逐小时会把界面冻死（症状抽样那儿已经因此封了循环上限）。
//
// 交点要用真实速率解，不能拿首尾两个值线性内插：值会在容量处削平，
// 拿削平后的终值倒推会把跨线时刻算晚——全开 2.1 小时就过线，内插会算成 16.8 小时。
function hoursAboveThreshold(startValue, ratePerHour, elapsed, threshold) {
  if (elapsed <= 0) return 0;
  if (startValue >= threshold) return elapsed;
  if (ratePerHour <= 0) return 0;
  const crossedAt = (threshold - startValue) / ratePerHour;
  return crossedAt >= elapsed ? 0 : elapsed - crossedAt;
}

// 按时长算是对的，判据是「现实里那件事到底是不是时间造成的」：
// 堵奶就是「存久了自然会出事」，按时长算是它本来的样子。
// （高潮不是「绷久了自然会发生」，所以性欲那边不许按时长——别看到这里就去把两边统一。）
function advanceMilkBlockage(profile, hours, startValue = null) {
  const elapsed = Math.max(0, Number(hours) || 0);
  if (elapsed <= 0 || !hasMilkSupply(profile)) return;
  const state = getMilkState(profile);
  const cap = Math.max(1, getMetabolismCap(profile, 'milk'));
  const endValue = clampNumber(profile?.metabolism?.milk, 0, cap, 0);
  const from = startValue === null ? endValue : clampNumber(startValue, 0, cap, 0);
  // 真实速率优先；拿不到（产后那条路）就退回首尾差分。
  const rate = getMilkNetHourlyGain(profile) || ((endValue - from) / elapsed);

  // 满度七成以上又没有效排空，计数器才走。只算真的待在七成以上的那几个小时——
  // 整段都记会让跨天推进一步跳到堵住。
  const highHours = hoursAboveThreshold(from, rate, elapsed, cap * MILK_BLOCK_FULLNESS);
  const blockHours = clampNumber(state.blockHours + highHours, 0, 9999, 0);

  // 出口：一直只有干在原地／渗一点点，量就只在乳头口干掉，攒够时长结痂。
  // 有往外走／喷出去就冲掉了。紧档的阈值高到够不着，所以它天生长痂——
  // 那正好是「干在原地」的定义，也是那块初乳痂的来处。
  const gate = getMilkGateOf(profile);
  const flowing = hoursAboveThreshold(from, rate, elapsed, cap * gate.seepThreshold) > 0;
  const quietHours = flowing ? 0 : clampNumber(state.quietHours + elapsed, 0, 9999, 0);
  const duct = flowing ? '通着' : (quietHours >= MILK_CRUST_HOURS ? '结痂' : state.duct);

  writeMilkState(profile, { duct, blockHours, quietHours });
}

// 有效排空：清掉计数器。但堵住那一格排不掉，要单独的恢复条件。
// 堵住后恢复条件（TASK-06 拍板）：热敷（options.milkWarmCompress）或时间自然退（24 小时无新堵）。
function relieveMilkBlockage(profile) {
  if (isMilkBlocked(profile)) return false;
  writeMilkState(profile, { blockHours: 0, quietHours: 0, duct: '通着' });
  return true;
}

// 堵住后的恢复：热敷直接解（软化硬块、疏通乳管），或者堵满 24 小时后自然退。
// 自然退的语义是「身体自己把淤积吸收掉了」——不是挤出来，是炎症消退+重吸收。
function tryMilkBlockageRecovery(profile, options = {}) {
  if (!isMilkBlocked(profile)) return false;
  const state = getMilkState(profile);
  if (options.milkWarmCompress) {
    writeMilkState(profile, { blockHours: 0, quietHours: 0, duct: '通着' });
    return true;
  }
  // 堵满 24 小时自然退——blockHours 超过最后一格（24）后累计到 48 才退
  if (state.blockHours >= MILK_BLOCK_STAGES[MILK_BLOCK_STAGES.length - 1] * 2) {
    writeMilkState(profile, { blockHours: 0, quietHours: 0, duct: '通着' });
    return true;
  }
  return false;
}

// ── 排乳反射建立（TASK-06 拍板）──────────────────────────────────────
// 开奶周后 3 天内没有排乳反射——吸不出多少；3 天后建立，一次吸吮/哺乳当场提前。
// reflectReady 写入 milk 子对象，建立后不再重置。
function getMilkLetDownReady(profile) {
  const state = getMilkState(profile);
  if (state.reflectReady) return true;
  // 没有记录开奶时刻：按发育进度推——发育 >0 就开始计时
  if (!hasMilkSupply(profile)) return false;
  const firstSupplyMinutes = Number(state.firstSupplyMinutes) || 0;
  const nowMinutes = Number(profile?.tick?.currentMinutes) || 0;
  if (firstSupplyMinutes <= 0) return false;
  return (nowMinutes - firstSupplyMinutes) >= MILK_LETDOWN_ESTABLISH_HOURS * 60;
}

// 一次排乳/吸吮当场提前建立反射——在排乳结算中调用。
function tryEstablishMilkLetDown(profile) {
  const state = getMilkState(profile);
  if (state.reflectReady) return;
  writeMilkState(profile, { reflectReady: true });
}

// ── 存量函数（TASK-06 拍板）──────────────────────────────────────────
// 排出量 = min(档位 expel 上限, 当前存量 × 比例)。
// 体质系数不乘这里——它乘在产量上，挤出量看当前存量是独立的。
// 比例 0.7：一次排走存量的七成——「掏空」落点就是封顶两成（存量 ×0.3）。
// 排反射没建立时打三折——吸出来的少。
function getMilkExpelAmount(profile, currentMilk) {
  const gate = getMilkGateOf(profile);
  const ratio = getMilkLetDownReady(profile) ? 0.7 : 0.2;
  return Math.min(gate.expel, Math.floor(currentMilk * ratio));
}

// ── 喷乳检定（TASK-06 拍板）──────────────────────────────────────────
// 喷概率按档位和是否触发：触发时松 0.25/全开 0.45，非触发松 0.05/全开 0.15。
// 只有 canSpray 的档（松/全开）才进这张表。
// triggered=true 表示大档高潮/乳头持续刺激/排乳动作那一刻。
function maybeMilkSpray(profile, female, triggered = false) {
  const gate = getMilkGateOf(profile);
  if (!gate.canSpray) return false;
  if (!hasMilkSupply(profile)) return false;
  // 三层缺一不发生：泌乳在线 + 触发 + 有货（满度 >0.7 或堵着）
  const fullness = getMilkFullness(profile);
  const hasStock = fullness > 0.7 || isMilkBlocked(profile);
  if (!triggered && !hasStock) return false;
  if (triggered && !hasStock) return false;  // 有触发但没货也不喷
  const chance = getMilkSprayChance(profile?.bio?.milkGate, triggered);
  if (chance <= 0 || Math.random() >= chance) return false;
  // 喷出去的量从存量扣
  const cap = Math.max(1, getMetabolismCap(profile, 'milk'));
  const current = clampNumber(profile?.metabolism?.milk, 0, cap, 0);
  const sprayAmount = Math.min(current, Math.floor(gate.expel * 0.5));
  if (sprayAmount > 0) {
    addMetabolismValue(profile, 'milk', -sprayAmount, 0, cap);
  }
  relieveMilkBlockage(profile);
  return true;
}

// ── 满档溢出承接（TASK-06 拍板）──────────────────────────────────────
// 满档时加不进的量不静默丢弃：
//   全开档 → seepThreshold=0 本来就在走，无需额外处理；
//   松/中/紧档 → 触发喷乳检定（喷概率 + 溢出加成），失败则值钳在容量（不丢、不爆）。
// 在 addMetabolismValue 之后由调用方调。
function resolveMilkOverflow(profile, female) {
  const cap = getMetabolismCap(profile, 'milk');
  const current = clampNumber(profile?.metabolism?.milk, 0, cap, 0);
  if (current < cap) return;  // 没满不处理
  const gate = getMilkGateOf(profile);
  if (gate.seepThreshold <= 0) return;  // 全开档本来就在流
  // 松/中/紧档满档 → 试喷（溢出加成）
  const chance = getMilkSprayChance(profile?.bio?.milkGate, true) + MILK_OVERFLOW_SPRAY_BONUS;
  if (chance > 0 && Math.random() < chance) {
    const sprayAmount = Math.min(current, Math.floor(gate.expel * 0.3));
    if (sprayAmount > 0) {
      addMetabolismValue(profile, 'milk', -sprayAmount, 0, cap);
    }
    relieveMilkBlockage(profile);
  }
  // 检定失败：值钳在容量，不丢不爆——addMetabolismValue 已钳住
}

// ── 排乳接宫压（TASK-06 拍板）────────────────────────────────────────
// 松档以上排乳一次性 +1~2 宫压（比高潮 +2 低，因为它高频）。
// 「哺乳引发宫缩」这条现实链保留。不做抬地板——一次性加值会回落，不叠加。
function applyMilkVoidUterinePressure(profile, female, relievedMilk) {
  if (relievedMilk <= 0) return;
  const gate = getMilkGateOf(profile);
  // 松档以上才算——中/紧档排出来太慢，不到催产素反射阈值
  const gateKey = String(profile?.bio?.milkGate || '').trim();
  if (gateKey !== '松' && gateKey !== '全开') return;
  if (!isTruePregnancyStage(String(profile?.base?.stage || ''))) return;
  const base = profile.base || {};
  const pressureCap = getUterinePressureCap(profile);
  const gain = randomNumber(1, 3);  // +1~2（randomNumber(1,3) 含 1 和 2）
  base.uterinePressure = clampNumber(
    (base.uterinePressure || 0) + gain,
    0, pressureCap, base.uterinePressure || 0,
  );
  profile.base = base;
}

// 每小时净涨：产出来的奶分两路，一路存下来、一路直接漏掉，
// 漏掉那一路从来不碰已经存下来的——所以这个数必然是正的（漏只能是产量的一部分）。
// 于是数字只往上，四个档都会堵，全开涨得最快、最先堵。
// 「一直在流」和「会堵」同时成立：一边往外淌，里面一边还在攒。
//
// 只有真妊娠走档位表。产后／假孕仍走原来的 0.08×孕周系数那条路，不动。
function getMilkNetHourlyGain(profile) {
  const development = getMilkDevelopment(profile);
  if (development <= 0) return 0;
  const gate = getMilkGateOf(profile);
  const net = Math.max(0, gate.produce - gate.leak);
  const breedTolerance = clampNumber(profile?.bio?.breedTolerance, 0.1, 8, 1);
  return net * development * breedTolerance;
}

function getMilkGainMultiplier(profile) {
  const fetalLoad = getMilkFetalLoad(profile);
  if (fetalLoad <= 0) return 0;
  const breedTolerance = clampNumber(profile?.bio?.breedTolerance, 0.1, 100, 1);
  return fetalLoad * clampNumber(breedTolerance, 0.1, 8, 1);
}


function applyMilkGain(profile, rawAmount) {
  const multiplier = getMilkGainMultiplier(profile);
  if (multiplier <= 0 || rawAmount <= 0) return 0;
  return addMetabolismValue(profile, 'milk', rawAmount * multiplier, 0, getMetabolismCap(profile, 'milk'));
}

// 黄体素推着乳房胀，它只在排卵之后才升——所以排卵期是谷底（0），
// 经前最胀，月经一来就缓解：黄体期攒下的 0.15×24×12≈43 要在三天内清掉，即 0.6/时。
function applyCycleBreastNeedGain(profile, hours) {
  const stage = String(profile?.base?.stage || '');
  const hourlyRate = stage === '黄体期' ? 0.15 : stage === '月经期' ? -0.6 : 0;
  if (hourlyRate === 0) return 0;
  return addMetabolismValue(profile, 'milk', hourlyRate * hours, 0, getMetabolismCap(profile, 'milk'));
}

function applyPassiveMetabolism(profile, tick) {
  if (profile?.immune?.metabolism) return;
  const hours = Math.max(0, tick.passedHours);
  if (hours <= 0) return;
  const milkBefore = clampNumber(profile?.metabolism?.milk, 0, 9999, 0);
  applyCycleBreastNeedGain(profile, hours);
  // 真妊娠走档位的净涨（产量只看孕周和档位）；产后／假孕沿用原来那条路。
  if (getMilkDevelopment(profile) > 0) {
    // 首次有奶供应时记录时间戳——排乳反射从这一刻起计时 3 天
    const state = getMilkState(profile);
    if (!state.firstSupplyMinutes || state.firstSupplyMinutes <= 0) {
      const nowMinutes = Number(profile?.tick?.currentMinutes) || 0;
      writeMilkState(profile, { firstSupplyMinutes: nowMinutes });
    }
    addMetabolismValue(profile, 'milk', getMilkNetHourlyGain(profile) * hours, 0, getMetabolismCap(profile, 'milk'));
  } else {
    applyMilkGain(profile, 0.08 * hours);
  }
  advanceMilkBlockage(profile, hours, milkBefore);
  // 满档溢出承接（TASK-06）：满了不静默丢，走喷乳检定。
  const female = profile?.base?.female || '她';
  resolveMilkOverflow(profile, female);
  // stool 阻力衰减放在这里：所有角色都跑（不只孕期），
  // 按 tick.passedHours 闭式衰减——时间粒度不变性：一次推 8h ≡ 八次推 1h。
  applyStoolDifficultyDrift(profile, hours);
}

// 性欲涨 → 乳意涨。刺激上来把奶往前推，她觉得更胀，值该往上跳。
// 加到存量上（面板那根条是存量÷容量算出来的，不是能往上加的东西）。
//
// 三处跟原来不同：
// 1. 删掉了排卵期那个 delta×0.05——世界书 uid 37 里找不到依据，是插件自己加的。
//    tracker_prompt_context.js 里「排卵期可因性欲波动少量累积」那句是它的说明书，一起删了。
// 2. 不走 applyMilkGain。那里面还会再乘一次孕周系数（足月能到 1.9），
//    等于把「折两成」放大成三成半。折两成就是折两成。
// 3. 开奶周之前不加：那时候里面没有奶，往前推也推不出东西。
function applyMilkFromLibido(profile, changeValue) {
  // 性欲下降不该泌乳：调用方传的是带符号的增量
  const delta = Number(changeValue) || 0;
  if (delta <= 0) return;
  if (!hasMilkSupply(profile)) return;
  addMetabolismValue(profile, 'milk', delta * 0.18, 0, getMetabolismCap(profile, 'milk'));
}


function getDerivedFluxDirection(currentFlux, fallbackDirection = 1) {
  const current = Number(currentFlux) || 0;
  if (current > 0) return 1;
  if (current < 0) return -1;
  return fallbackDirection >= 0 ? 1 : -1;
}

function shouldResetOrgasmOvulation(stage) {
  return stage === '月经期' || stage === '产后恢复';
}

// 性欲的三条线。原来这里是 getLibidoCap，只给一条上限、而且按月取整（会出台阶）。
// 现在三条线一起给，按天插值：
//   起点 = 什么都不做时她待在哪（停手往这儿落，不落回 0）
//   满线 = 她自己知道想要了（过线本身什么都不发生）
//   天花板 = 值的上限
function getLibidoLinesOf(profile) {
  const stage = String(profile?.base?.stage || '');
  const engagedCount = getEngagedFetusCount(profile);
  // 入盆修正按深度插值：先露胎的 descent 换算成 progress（未入盆=0，盆底=1）。
  const progress = engagedCount > 0 ? engagementProgressFromDescent(Number(getEngagedFetusDescent(profile)) || 40) : 0;
  const lines = getLibidoLines(
    stage,
    clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0),
    engagedCount,
    isTruePregnancyStage(stage),
    isProlongedPregnancy(profile),
    progress,
  );
  return lines;
}

// 满线：她知道自己想要了。闸只在 A 过了这条线之后才爬。
function getLibidoUrgeThreshold(profile) {
  return getLibidoLinesOf(profile).urge;
}

// ── 春梦（TASK-05 第二批拍板）──────────────────────────────────────
// 睡眠中按睡前性欲档位掷一次概率 × 孕期倍率（封顶 100%）。
// 入盆不给倍率修正：入盆压短线→档位变高→概率看档位，效果已经进来，再乘是双算。
// 无/低两档不触发；爆档延产 50%×1.9=95%，不封顶。
const LIBIDO_WET_DREAM_CHANCE = Object.freeze({ 无: 0, 低: 0, 中: 0.10, 高: 0.20, 满: 0.35, 爆: 0.50 });
const LIBIDO_WET_DREAM_MULT = Object.freeze({
  非孕: 1.0, 孕早期谷底: 0.3, 孕早期回升: 1.0, 孕中期: 1.2,
  孕晚期: 1.7, 临产期: 1.8, 自然逾期: 1.8, 延产: 1.9, 产后: 1.0,
});
const LIBIDO_WET_DREAM_TONE = Object.freeze({
  中: '梦里只有暧昧的擦边，身体的反应先醒了；醒来发热，细节想不全',
  高: '梦得清楚，睡着会夹腿、往被子里蹭；醒来内裤已经潮了',
  满: '整场梦就是那件事，身体从头跟到尾；醒来跟真做过一次差不多，内裤湿透要换',
  爆: '梦的内容突破了她清醒时的边界，越界的程度连她自己醒来都心惊——而且是被那一下直接顶醒的',
});
function getLibidoWetDreamMultiplier(profile) {
  const stage = String(profile?.base?.stage || '');
  if (stage === '产后恢复') return LIBIDO_WET_DREAM_MULT.产后;
  if (!isTruePregnancyStage(stage)) return LIBIDO_WET_DREAM_MULT.非孕;
  const days = clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0);
  if (days < 91) return LIBIDO_WET_DREAM_MULT.孕早期谷底;
  if (days < 120) return LIBIDO_WET_DREAM_MULT.孕早期回升;
  if (days < 189) return LIBIDO_WET_DREAM_MULT.孕中期;
  if (days < 252) return LIBIDO_WET_DREAM_MULT.孕晚期;
  if (days < 280) return LIBIDO_WET_DREAM_MULT.临产期;
  return isProlongedPregnancy(profile) ? LIBIDO_WET_DREAM_MULT.延产 : LIBIDO_WET_DREAM_MULT.自然逾期;
}
function maybeLibidoWetDream(profile, female) {
  if (profile?.immune?.metabolism || isMetabolismExempt(profile, 'libido')) return null;
  const lines = getLibidoLinesOf(profile);
  const level = getLibidoLevel(clampNumber(profile?.metabolism?.libido, 0, lines.hard, 0), lines.urge, lines.hard);
  const base = LIBIDO_WET_DREAM_CHANCE[level] ?? 0;
  if (!(base > 0)) return null;
  const chance = Math.min(1, base * getLibidoWetDreamMultiplier(profile));
  if (Math.random() >= chance) return null;
  // 睡着不会去——只写那股劲，不动闸不加电荷：去不去仍然由醒着的剧情决定。
  const tone = LIBIDO_WET_DREAM_TONE[level] ?? LIBIDO_WET_DREAM_TONE.高;
  profile.notify = {
    ...(profile.notify || {}),
    thirdly: `${female}夜里做了春梦——${tone}`,
  };
  return { level, tone };
}

// ── 孕期静息位（TASK-05 第二批拍板）────────────────────────────────
// 静息位 = (起点+满线)/2，派生量不存盘。A 低于它按速率表慢慢爬、高于它
// 消退（孕期 ×0.7 打折）到它停——一个收敛点干两件事：凉得慢、凉不到底。
// 非孕/产后/早孕谷底（day<91）静息位=floor：激素退了没有持续推力，逻辑退化成现状。
function getLibidoRestingTarget(profile, lines) {
  const stage = String(profile?.base?.stage || '');
  if (stage === '产后恢复' || !isTruePregnancyStage(stage)) return lines.floor;
  const days = clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0);
  if (days < 91) return lines.floor;
  return (lines.floor + lines.urge) / 2;
}

// 爬升速率（floor→静息位这段，按孕天）：全程递增，越往后激素顶得越足。
// 回升 0.5 / 孕中 0.8 / 孕晚 1.2 / 临产 1.3 / 自然逾期 1.4 / 延产 1.6。
function getLibidoRestingClimbRate(profile) {
  const days = clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0);
  if (days < 91) return 0;
  if (days < 120) return 0.5;
  if (days < 189) return 0.8;
  if (days < 252) return 1.2;
  if (days < 280) return 1.3;
  return isProlongedPregnancy(profile) ? 1.6 : 1.4;
}

// ── 性欲的隐藏量 ────────────────────────────────────────────────────
// 闸、电荷、习惯化、不应剩余，外加「这一次爬到多高」和「现在在哪一档」。
// 都存在 profile.libido 上，跟面板那根条（metabolism.libido）分开。
function getLibidoState(profile) {
  const s = profile?.libido && typeof profile.libido === 'object' ? profile.libido : {};
  return {
    gate: clampNumber(s.gate, 0, LIBIDO_GATE_FULL, 0),
    charge: clampNumber(s.charge, 0, LIBIDO_CHARGE_MAX, 0),
    habit: clampNumber(s.habit, 0, LIBIDO_HABIT.max, 0),
    refractoryMin: clampNumber(s.refractoryMin, 0, 9999, 0),
    refractoryTier: LIBIDO_AFTERMATH[s.refractoryTier] ? s.refractoryTier : null,
    // 这一次（一个动作从开始到停）闸爬到过多高。断掉的时候按它记电荷。
    instancePeak: clampNumber(s.instancePeak, 0, LIBIDO_GATE_FULL, 0),
    instanceOpen: Boolean(s.instanceOpen),
    // 他停手之后还剩几分钟余韵，以及那一次停在多高（余韵强度看它）。
    afterglowMin: clampNumber(s.afterglowMin, 0, 9999, 0),
    afterglowPeak: clampNumber(s.afterglowPeak, 0, LIBIDO_GATE_FULL, 0),
    // 被撩起来又丢下攒的敏感度。只加在值上，不加在闸上。
    denial: clampNumber(s.denial, 0, LIBIDO_DENIAL.max, 0),
    activeClass: clampNumber(s.activeClass, 0, 5, 0),
    // ⚠️ 这里原来有个 suppress（压抑芯片），已整个删掉。老存档里可能还留着那个键，
    // 但没人读它了——不要因为看见残留就把机制加回来，理由见 libido_config.js。
    lastTier: LIBIDO_AFTERMATH[s.lastTier] ? s.lastTier : null,
  };
}

function writeLibidoState(profile, patch) {
  profile.libido = { ...(profile?.libido || {}), ...patch };
  return profile.libido;
}

// 孕期进度，用来给类别放大和不应期缩短做插值。
function getLibidoPregnancyProgress(profile) {
  const stage = String(profile?.base?.stage || '');
  if (!isTruePregnancyStage(stage)) return 0;
  return clampNumber(clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0) / 280, 0, 1, 0);
}

// 不应期那几分钟：孕期缩短，理由是盆腔充血不消退。
function getLibidoRefractoryMinutes(profile, tier) {
  const spec = LIBIDO_AFTERMATH[tier];
  if (!spec) return 0;
  const progress = getLibidoPregnancyProgress(profile);
  const scale = 1 - ((1 - LIBIDO_REFRACTORY_PREGNANCY_FLOOR) * progress);
  return spec.refractoryMin * scale;
}

// 闸爬多快：满速 × 超出满线多少 × 习惯化。
// 「还差多少」不是个定数——它随 A 的高度在变，刚过线时几乎不动。
//
// 这里原来还乘一个压抑芯片的系数，已整个删掉（理由见 libido_config.js 那一段）。
// **别再往这个乘法里塞「她忍不忍」那类东西**——会不会去只许看她身上到哪一步了。
function getLibidoGateSpeed(profile, classIndex, state) {
  const spec = getLibidoClass(classIndex);
  if (spec.gatePerMin <= 0) return 0;   // C1 想象恒为 0：只想，永远不会去
  const lines = getLibidoLinesOf(profile);
  const value = clampNumber(profile?.metabolism?.libido, 0, lines.hard, 0);
  if (value <= lines.urge) return 0;    // 闸只在过了满线之后才爬
  const span = Math.max(1, lines.hard - lines.urge);
  const excess = clampNumber((value - lines.urge) / span, 0, 1, 0);
  const habitScale = 1 - clampNumber(state.habit, 0, LIBIDO_HABIT.max, 0);
  return spec.gatePerMin * excess * habitScale;
}

// 性欲的对外视图。真身在 libido_config（buildLibidoView），这里只是把 profile
// 拆成它要的原始参数。三处调用点：引擎自己、面板（index.js）、tracker 载荷。
// **必须是同一个函数**，否则模型看到的档名跟面板显示的会不一样
//（这个坑刚在乳意容量上踩过一次：面板分母写死 150，引擎按孕周算）。
export function getLibidoView(profile) {
  const lines = getLibidoLinesOf(profile);
  const value = clampNumber(profile?.metabolism?.libido, 0, lines.hard, 0);
  const state = getLibidoState(profile);
  const stage = String(profile?.base?.stage || '');
  return buildLibidoView({
    value,
    urge: lines.urge,
    hard: lines.hard,
    level: getLibidoLevel(value, lines.urge, lines.hard),
    gate: state.gate,
    refractoryMin: state.refractoryMin,
    refractoryTier: state.refractoryTier,
    afterglowMin: state.afterglowMin,
    stage,
    effectivePregnantDays: clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0),
    engagedCount: getEngagedFetusCount(profile),
    isPregnant: isTruePregnancyStage(stage),
  });
}

function getUterinePressureCap(profile) {
  const stage = profile?.base?.stage;
  if (!isTruePregnancyStage(stage)) return 50;
  const effectivePregnantDays = clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0);
  const months = Math.floor(effectivePregnantDays / 28);
  const progress = Math.max(0, Math.min(10, months)) / 10;
  return Math.round(50 + (150 - 50) * progress);
}

// 漏尿有两种成因，判据不一样，所以分成两段：
//
// 一、憋不住（urgency）——量真的到顶了。这一种跟怀不怀孕无关：正常人憋到 hard
//    一样会尿出来，只是她的 hard 是 150、余量厚得多，日常够不到。抵到 hard 不掷骰。
// 二、应激性漏尿（stress）——盆底关不紧。在 urge 之下也会漏，因为问题不是量太多
//    而是闸门坏了；这一种要看阶段，健康的非孕角色不会因为膀胱半满就漏。
//
// 分成两个函数不只是为了整洁：只有第一种该跟着时间走。憋是量的事，时间会把量推上去；
// 应激性得先有个应激（咳嗽、笑、搬东西），那是模型递 urine 时才发生的事。
// 所以推时间只判憋不住，有刺激事件才两条都判。
function applyUrineUrgencyBreak(profile, female) {
  if (profile?.immune?.metabolism || isMetabolismExempt(profile, 'urine')) return null;
  const metabolism = profile.metabolism || {};
  const hardCap = getMetabolismCap(profile, 'urine');
  const urgeCap = getUrineUrgeThreshold(profile);
  const current = clampNumber(metabolism.urine, 0, hardCap, 0);

  // 抵到 hard 就是撑不住，谁都一样。之下按余量吃掉多少掷骰，越接近越容易崩。
  const breakChance = getUrineUrgencyBreakChance(current, urgeCap, hardCap);
  if (!(breakChance > 0) || Math.random() >= breakChance) return null;

  // 失禁落点（TASK-02 §六拍板）：min(0.20×满档, 0.35×地板)——真的空了。
  // 随后的地板回推由 applyUrineProduction 兜底（地板是压着的感觉，一直在）。
  const prolonged = isProlongedPregnancy(profile);
  const floor = getUrineFloor(String(profile?.base?.stage || ''), getEngagedFetusCount(profile), getEngagementProgress(profile), prolonged);
  const landing = Math.min(urgeCap * 0.20, floor * 0.35);
  const drop = Math.max(0, current - landing);
  metabolism.urine = Math.max(0, current - drop);
  profile.metabolism = metabolism;
  // 记失禁时刻：出声资格的恢复有最短静默期（refreshUrineLeakCooldown 门控），
  // 否则失禁把值打到远低于排空线的位置，「每小时一句」在新数值下会复发。
  const cooldown = { ...(profile.cooldown || {}) };
  cooldown.urineIncontinenceAt = Number(profile?.tick?.currentMinutes) || 0;
  profile.cooldown = cooldown;
  return emitUrineLeakNotify(profile, female, 'incontinence', drop, '整个收不住，一直流到腿上');
}

function applyUrineStressLeak(profile, female) {
  if (profile?.immune?.metabolism || isMetabolismExempt(profile, 'urine')) return null;
  const stage = String(profile?.base?.stage || '');
  if (!canUrineStressLeak(stage)) return null;
  const metabolism = profile.metabolism || {};
  const hardCap = getMetabolismCap(profile, 'urine');
  const urgeCap = getUrineUrgeThreshold(profile);
  const current = clampNumber(metabolism.urine, 0, hardCap, 0);

  const tier = getUrineLeakTier(current, urgeCap, hardCap);
  if (!tier || tier.kind === 'seep') return null;
  const engagedCount = getEngagedFetusCount(profile);
  const progress = getEngagementProgress(profile);
  const effectivePregnantDays = Number(profile?.pregnant?.effectivePregnantDays) || 0;
  const factor = getUrineFloorFactor(stage, effectivePregnantDays, engagedCount, progress);
  const chance = getUrineStressLeakChance(current, urgeCap, hardCap, factor, null, stage, effectivePregnantDays);
  if (Math.random() >= chance) return null;

  const [minDrop, maxDrop] = tier.drop;
  const drop = randomInt(minDrop, maxDrop);
  metabolism.urine = Math.max(0, current - drop);
  profile.metabolism = metabolism;
  return emitUrineLeakNotify(profile, female, tier.kind, drop, tier.extent);
}

// 先判憋不住：它是硬机制，不该被应激那条的阶段门挡掉。
function applyUrineLeak(profile, female) {
  return applyUrineUrgencyBreak(profile, female) || applyUrineStressLeak(profile, female);
}

// §八 高潮失禁：逼尿肌收缩，不是潮吹（潮吹不从膀胱走、不减值，两者独立）。
// 跟应激漏尿不共用插值——逼尿肌收缩跟盆底无关，非孕也会发生，孕期只抬高度不改形状。
// 不走 urineLeakWarned 冷却：那个防「反复提示膀胱满」，套到这里会让同一场第二次高潮不出声。
// 不算排空：落值就是落值，地板照旧，下一次很快又满。
function applyUrineOrgasmIncontinence(profile, female) {
  if (profile?.immune?.metabolism || isMetabolismExempt(profile, 'urine')) return null;
  const metabolism = profile.metabolism || {};
  const hardCap = getMetabolismCap(profile, 'urine');
  const urgeCap = getUrineUrgeThreshold(profile);
  const current = clampNumber(metabolism.urine, 0, hardCap, 0);

  const stage = String(profile?.base?.stage || '');
  const engagedCount = getEngagedFetusCount(profile);
  const progress = getEngagementProgress(profile);
  const effectivePregnantDays = Number(profile?.pregnant?.effectivePregnantDays) || 0;
  const factor = getUrineFloorFactor(stage, effectivePregnantDays, engagedCount, progress);
  const chance = getUrineOrgasmIncontinenceChance(current, urgeCap, hardCap, factor);
  if (!(chance > 0) || Math.random() >= chance) return null;

  const level = getUrineLevel(current, urgeCap, hardCap);
  const [minDrop, maxDrop] = getUrineOrgasmDropRange(level);
  const drop = randomInt(minDrop, maxDrop);
  metabolism.urine = Math.max(0, current - drop);
  profile.metabolism = metabolism;

  // 每次都出声，不走冷却
  const notify = profile.notify || {};
  const extent = drop >= 22 ? '大量涌出，顺着腿往下流'
    : drop >= 14 ? '一股，洇开直径五到八公分'
    : '一小股，洇开直径三五公分';
  notify.secondly = `${female}高潮时逼尿肌收缩，失禁了一点（${extent}）`;
  profile.notify = notify;
  return { kind: 'orgasm', drop, silent: false };
}

// 漏过一次之后除非回落跨档不再出声，否则高位挂着会每轮刷同一句。
function emitUrineLeakNotify(profile, female, kind, drop, extent) {
  const cooldown = { ...(profile.cooldown || {}) };
  const cooldownKey = kind === 'incontinence' ? 'urineIncontinenceWarned' : 'urineLeakWarned';
  if (cooldown[cooldownKey]) {
    profile.cooldown = cooldown;
    return { kind, drop, silent: true };
  }
  cooldown[cooldownKey] = true;
  profile.cooldown = cooldown;

  const notify = profile.notify || {};
  if (kind === 'incontinence') {
    notify.firstly = `${female}没能忍住，尿液不受控地涌出（${extent}）；排空的轻松感并未到来，只剩压迫感`;
  } else {
    notify.secondly = `${female}漏了一点尿（${extent}）`;
  }
  profile.notify = notify;
  return { kind, drop, silent: false };
}

// 回落跨档就把出声资格还回来：连着漏两次是自然结果，不该被冷却永久压住。
//
// 失禁那一位在新数值下（落点 = min(0.20×满档, 0.35×地板)）必然落到排空线之下——
// 「掉到排空线以下 = 她去清理了」的旧判据失灵：失禁自己就会把值打下去。
// 改用时间门控：失禁后 90 分钟内不出声（防同一句每小时重复），
// 过了静默期、值重新涨回高位再漏，才再次有资格出声。
const URINE_INCONTINENCE_QUIET_MIN = 90;
function refreshUrineLeakCooldown(profile) {
  const cap = getMetabolismCap(profile, 'urine');
  const current = clampNumber(profile?.metabolism?.urine, 0, cap, 0);
  const level = getUrineLevelOf(profile, current);
  const cooldown = { ...(profile?.cooldown || {}) };
  if (!['高', '满', '爆'].includes(level)) cooldown.urineLeakWarned = false;
  const nowMinutes = Number(profile?.tick?.currentMinutes) || 0;
  const sinceIncontinence = nowMinutes - (Number(cooldown.urineIncontinenceAt) || 0);
  const voidedLine = getUrineFloor(String(profile?.base?.stage || ''), getEngagedFetusCount(profile), getEngagementProgress(profile), isProlongedPregnancy(profile))
    + getUrineResidualValue(String(profile?.base?.stage || ''), getEngagedFetusCount(profile), getEngagementProgress(profile), isProlongedPregnancy(profile));
  if (current <= voidedLine && (Number.isFinite(sinceIncontinence) ? sinceIncontinence >= URINE_INCONTINENCE_QUIET_MIN : true)) {
    cooldown.urineIncontinenceWarned = false;
  }
  profile.cooldown = cooldown;
}

// 常规排空：没在憋的时候，越过「该去了」那条线就是去了，不出声。
// 这是推时间的默认假设——见 URINE_ROUTINE_VOID 那段注释。
// ── 自然产量（TASK-02 §三）─────────────────────────────────────────
// 非孕和孕期都走：每阶段固定产量（非孕 12 / 孕早 15 / 孕中 14 / 孕晚 15 /
// 临产·逾期 16 / 延产 16 / 产后 13），多胎加产量。弃用 fetalEnergyDrain 产量链。
function applyUrineProduction(profile, tick) {
  if (profile?.immune?.metabolism || isMetabolismExempt(profile, 'urine')) return 0;
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (hours <= 0) return 0;
  const stage = String(profile?.base?.stage || '');
  if (stage === '第二产程') {
    lockSecondStageUrine(profile);
    return 0;
  }
  const prolonged = isProlongedPregnancy(profile);
  const fetuses = Math.max(1, clampNumber(profile?.pregnant?.fetusesCount, 0, 99, 1));
  const adjust = getUrineMultipleAdjust(fetuses);
  const production = (getUrineProduction(stage, prolonged) + adjust.production) * getSweatProductionDiscount(profile, stage);
  if (production <= 0) return 0;
  // 地板回推：值掉到地板之下（失禁真的空了之后）由地板顶回来——
  // 地板是压着的感觉，一直在，不靠产尿。
  const floor = getUrineFloor(stage, getEngagedFetusCount(profile), getEngagementProgress(profile), prolonged)
    + adjust.floor;
  const metabolism = profile.metabolism || {};
  if (clampNumber(metabolism.urine, 0, BASE_METABOLISM_CAP, 0) < floor) {
    metabolism.urine = floor;
    profile.metabolism = metabolism;
  }
  return addMetabolismValue(profile, 'urine', production * hours, 0, BASE_METABOLISM_CAP);
}

// 出汗折扣只在出汗那段时间生效：模型报 sweating 事件（轻/中/重），存 urine.sweat
// 带 2 小时过期；不报不出汗立刻恢复。孕期额外打折叠乘，产后排液期（头 5 天）持续折扣。
function getSweatProductionDiscount(profile, stage) {
  let discount = 1;
  const sweat = profile?.urine?.sweat;
  if (sweat && Number(sweat.expiresAt) > Date.now() && URINE_SWEAT_DISCOUNT[sweat.level]) {
    discount = URINE_SWEAT_DISCOUNT[sweat.level];
    const extra = URINE_SWEAT_PREGNANCY_EXTRA[stage];
    if (extra) discount *= extra;
  }
  if (stage === '产后恢复' && clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0) <= URINE_POSTPARTUM_DISCHARGE_DAYS) {
    discount *= URINE_POSTPARTUM_DISCHARGE_EXTRA;
  }
  return clampNumber(discount, 0.05, 1, 1);
}

// 第二产程：胎头卡在产道里，膀胱被压在胎头和耻骨之间，容量基本没了。
// 值恒锁 10（拍板：锁 0 没有戏，10 是最低戏剧量）；用力漏一次 −8~12 在排尿口处理，
// 漏空后这一拍直接锁回 10——「漏空→回一点→再漏空」的循环由两处共同落出。
function lockSecondStageUrine(profile) {
  const metabolism = profile.metabolism || {};
  metabolism.urine = clampNumber(10, 0, 39, 10);
  profile.metabolism = metabolism;
}

function applyRoutineUrineVoid(profile) {
  if (profile?.immune?.metabolism || isMetabolismExempt(profile, 'urine')) return 0;
  if (profile?.urine?.holding) return 0;
  const stage = String(profile?.base?.stage || '');
  if (stage === '第二产程') return 0;   // 锁定机制：不走日常自动排
  const metabolism = profile.metabolism || {};
  const cap = getMetabolismCap(profile, 'urine');
  const prolonged = isProlongedPregnancy(profile);
  const engagedCount = getEngagedFetusCount(profile);
  const progress = getEngagementProgress(profile);
  const urgeCap = getUrineUrgeThreshold(profile);
  const current = clampNumber(metabolism.urine, 0, cap, 0);
  // 「又想去」尺子：非孕/孕早期看中档下界，其余看高档下界（TASK-02 §四）。
  // 栏二偏移压 urge 线，触发线跟着有效满线走。
  const effectiveUrge = getUrineEffectiveUrge(profile);
  const trigger = getUrineVoidThreshold(stage, effectiveUrge, prolonged);
  if (current < trigger) return 0;

  const floor = getUrineFloor(stage, engagedCount, progress, prolonged);
  const residualValue = getUrineResidualValue(stage, engagedCount, progress, prolonged);
  const residual = floor + residualValue;
  // 越过多少份 urge 就算几趟：一小时积累 56 而 urge 是 52 时，她跑的不止一趟。
  const trips = URINE_ROUTINE_VOID.countTripsByOverflow
    ? Math.min(URINE_ROUTINE_VOID.maxTripsPerTick, Math.max(1, Math.ceil((current - residual) / Math.max(1, urgeCap))))
    : 1;
  metabolism.urine = residual;
  profile.metabolism = metabolism;
  clearUrineSenseOnVoid(profile);

  const urine = { ...(profile.urine || {}) };
  urine.voidsToday = clampNumber(urine.voidsToday, 0, 999, 0) + trips;
  profile.urine = urine;
  return trips;
}

// 憋到爆档而且胎头已入盆时，膀胱隔着压在宫颈上——这才是憋尿对宫缩真正的意义。
//
// 写成「抬地板」而不是「每小时加一笔」：后者会跟回落打架，加得比落得少等于没加，
// 多了又无限累积。抬地板则是——勒着、憋着的这段时间值稳定停在某一档，松开就落下去。
function getUterinePressureStandingFloor(profile) {
  let floor = 0;
  // 前驱发作期间宫缩本身就在抬地板，所以发作会把分娩概率乘区推上去。
  if (clampNumber(profile?.pregnant?.prodromalEpisodeHours, 0, 9999, 0) > 0) {
    floor = Math.max(floor, EPISODE_PRESSURE_FLOOR);
  }
  // 真前驱：地板随倒计时进度爬升，于是破水有一个「越接近越可能」的窗口。
  if (String(profile?.base?.stage || '') === '产兆前驱') {
    const initial = Math.max(1, getProdromalInitialHours(profile));
    const remaining = clampNumber(profile?.pregnant?.prodromalRemainingHours, 0, 9999, initial);
    floor = Math.max(floor, getTrueProdromalPressureFloor(1 - (remaining / initial)));
  }
  if (profile?.immune?.metabolism || isMetabolismExempt(profile, 'urine')) return floor;
  if (getEngagedFetusCount(profile) <= 0) return floor;
  if (!profile?.urine?.holding) return floor;
  const cap = getMetabolismCap(profile, 'urine');
  const current = clampNumber(profile?.metabolism?.urine, 0, cap, 0);
  if (getUrineLevel(current, getUrineUrgeThreshold(profile), cap) !== '爆') return floor;
  return Math.max(floor, PRESSURE_STANDING_FLOOR.urineHoldEngaged);
}

function applyUrineHoldUterinePressure(profile, tick) {
  if (profile?.immune?.metabolism || isMetabolismExempt(profile, 'urine')) return;
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (hours <= 0) return;
  const floor = getUterinePressureStandingFloor(profile);
  if (floor <= 0) return;

  const base = profile.base || {};
  const pressureCap = getUterinePressureCap(profile);
  const baseline = getUterinePressureBaseline(
    clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0),
    pressureCap,
  );
  const current = clampNumber(base.uterinePressure, 0, pressureCap, 0);
  // 只抬到地板，不越抬越高：憋着这件事有它的上限。
  base.uterinePressure = clampNumber(
    Math.max(current, baseline + floor),
    0,
    pressureCap,
    base.uterinePressure || 0,
  );
  profile.base = base;
}

// 便意的阻力轴：stool.difficulty 是隐藏持久状态，由引擎维护，对模型不可见。
// TASK-01 双轴重写后，旧五个死标志位（ironSupplement/dehydrated/squatPosture/
// fiberIntake/hydrated）已删——阻力输入改由食物标签一次性加减（§6.3），
// 姿势改由检定时临时抵扣（§七），不进值。
//
// 阻力值的加减规则：
// - 食物标签（§6.3 那一列）是一次性加减到值上——吃一次加一次，之后由衰减拉回底噪。
// - 姿势不进值，是检定时的临时抵扣。
// - 衰减只往底噪拉（STOOL_STAGE_DIFFICULTY），不往 0 拉；食物和姿势可以压到底噪之下。
function getStoolDifficulty(profile) {
  const stool = profile?.stool || {};
  return clampNumber(stool.difficulty, 0, 100, 0);
}

// 衰减：每小时 −0.5，落到阶段底噪（STOOL_STAGE_DIFFICULTY）就停。
// 食物和姿势可以把它压到底噪之下，时间不行。
// hours 参数让一次推多小时与多次推 1 小时结果一致（时间粒度不变性）。
function applyStoolDifficultyDrift(profile, hours = 1) {
  const stage = String(profile?.base?.stage || '');
  const floor = getStoolStageDifficulty(stage) + getStoolEngagedDifficulty(getEngagedFetusCount(profile), getEngagementProgress(profile));
  const stool = { ...(profile?.stool || {}) };
  const current = clampNumber(stool.difficulty, 0, 100, floor);
  if (current > floor) {
    const decay = STOOL_DIFFICULTY_DECAY_PER_HOUR * Math.max(0, Number(hours) || 1);
    stool.difficulty = Math.max(floor, current - decay);
  } else {
    stool.difficulty = current;
  }
  stool.failDays = clampNumber(stool.failDays, 0, 99, 0);
  profile.stool = stool;
}

// §6.2 吃饭四档：胃结肠反射——食物进胃几分钟内触发结肠集团蠕动，
// 便意在吃下去那一刻就涨。默认区间不能省：自动推时间时模型不在场。
// §6.3 食物标签：速率/阻力/排气乘数/稀加量一次性加减到值上。
function applyStoolMeal(profile, portion, tags = []) {
  if (isMetabolismExempt(profile, 'stool')) return 0;
  const tier = getStoolMealTier(portion);
  if (!tier) return 0;
  const composed = composeStoolFoodTags(tags);
  const baseGain = Math.floor(randomNumber(tier.amount[0], tier.amount[1] + 1));
  const gain = clampMealGain(baseGain * composed.rateMult);
  addMetabolismValue(profile, 'stool', gain, 0, BASE_METABOLISM_CAP, 'stimulus');
  // 食物标签的阻力加减是一次性到值上
  if (composed.difficultyAdd !== 0) {
    const stool = { ...(profile?.stool || {}) };
    const floor = getStoolStageDifficulty(String(profile?.base?.stage || ''))
      + getStoolEngagedDifficulty(getEngagedFetusCount(profile), getEngagementProgress(profile));
    stool.difficulty = clampNumber((Number(stool.difficulty) || floor) + composed.difficultyAdd, 0, 100, floor);
    profile.stool = stool;
  }
  // 稀值累积（隐藏持久状态）
  if (composed.wateryAdd > 0) {
    const stool = { ...(profile?.stool || {}) };
    stool.wateryValue = Math.max(0, (Number(stool.wateryValue) || 0) + composed.wateryAdd);
    profile.stool = stool;
  }
  // 排气乘数存为临时加成，带过期清扫（§6.5 产气 4h/8h）
  if (composed.gasMult > 1) {
    const stool = { ...(profile?.stool || {}) };
    const nowMinutes = Number(profile?.pregnant?.effectivePregnantDays || 0) * 1440;
    const list = Array.isArray(stool.gasBoosts) ? stool.gasBoosts.filter((b) => !b.expiresAt || b.expiresAt > nowMinutes) : [];
    list.push({ mult: composed.gasMult, expiresAt: nowMinutes + 480 }); // 产气持续 8h
    stool.gasBoosts = list;
    profile.stool = stool;
  }
  return gain;
}

// 计算当前排气乘数（从临时加成列表合成）
function getStoolGasMult(stool) {
  const nowMinutes = Number(stool?.nowMinutes || 0);
  const boosts = Array.isArray(stool?.gasBoosts) ? stool.gasBoosts : [];
  let mult = 1;
  for (const b of boosts) {
    if (!b.expiresAt || b.expiresAt > nowMinutes) mult *= Number(b.mult) || 1;
  }
  return mult;
}

// §6.4 排气掷骰（每小时）：概率/小时 = 阶段基数 × 胎数 × 类型标签 × 档位系数
function applyStoolGasRoll(profile, tick) {
  if (isMetabolismExempt(profile, 'stool')) return;
  const stage = String(profile?.base?.stage || '');
  const engagedCount = getEngagedFetusCount(profile);
  const lines = getStoolLines(stage, engagedCount, getEngagementProgress(profile));
  const signal = clampNumber(profile?.metabolism?.stool, 0, lines.cap, 0);
  const level = getStoolLevel(signal, lines);
  const stool = profile?.stool || {};
  const gasMult = getStoolGasMult(stool);
  const chance = computeStoolGasChance(stage, engagedCount, level, gasMult, engagedCount > 0);
  if (chance <= 0) return;
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (hours <= 0) return;
  // 闭式概率合成：一小时掷一次，按时间比例缩放
  const rollChance = 1 - Math.pow(1 - chance, hours);
  if (Math.random() >= rollChance) return;
  // 放屁减便意 §6.6
  const relief = STOOL_GAS_RELIEF.silent.amount;
  const drop = Math.floor(randomNumber(relief[0], relief[1] + 1));
  addMetabolismValue(profile, 'stool', -drop, 0, BASE_METABOLISM_CAP);
}

// §6.7 窜稀掷骰（每小时）：稀值 × 系数 × 0.3
function applyStoolWateryRoll(profile, tick) {
  if (isMetabolismExempt(profile, 'stool')) return;
  const stool = { ...(profile?.stool || {}) };
  const watery = Math.max(0, Number(stool.wateryValue) || 0);
  if (watery <= 0) return;
  const stage = String(profile?.base?.stage || '');
  const engagedCount = getEngagedFetusCount(profile);
  const lines = getStoolLines(stage, engagedCount, getEngagementProgress(profile));
  const signal = clampNumber(profile?.metabolism?.stool, 0, lines.cap, 0);
  const level = getStoolLevel(signal, lines);
  const chance = computeStoolWateryChance(watery, level);
  if (chance <= 0) return;
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (hours <= 0) return;
  const rollChance = 1 - Math.pow(1 - chance, hours);
  if (Math.random() >= rollChance) return;
  // 中了 → 进前摇
  stool.wateryPrelude = Math.floor(randomNumber(STOOL_WATERY.preludeMinutes.min, STOOL_WATERY.preludeMinutes.max + 1));
  stool.wateryWaves = 0;
  profile.stool = stool;
}

// §6.7 窜稀前摇推进：每波便意 +[6,12]，这段阻力压到最低
function applyStoolWateryPrelude(profile, tick) {
  if (isMetabolismExempt(profile, 'stool')) return;
  const stool = { ...(profile?.stool || {}) };
  const prelude = Number(stool.wateryPrelude) || 0;
  if (prelude <= 0) return;
  const minutes = Math.max(0, Number(tick?.passedMinutes) || 0);
  if (minutes <= 0) return;
  const remaining = Math.max(0, prelude - minutes);
  stool.wateryPrelude = remaining;
  // 每波 +[6,12]
  const waves = Math.max(1, Math.ceil(prelude / 10));
  for (let i = 0; i < waves; i += 1) {
    const gain = Math.floor(randomNumber(STOOL_WATERY.waveSignal[0], STOOL_WATERY.waveSignal[1] + 1));
    addMetabolismValue(profile, 'stool', gain, 0, BASE_METABOLISM_CAP, 'stimulus');
  }
  // 前摇走完 → 排 [25,40] 或走漏屎判定
  if (remaining <= 0) {
    const discharge = Math.floor(randomNumber(STOOL_WATERY.discharge[0], STOOL_WATERY.discharge[1] + 1));
    const signal = clampNumber(profile?.metabolism?.stool, 0, 200, 0);
    profile.metabolism.stool = Math.max(0, signal - discharge);
    stool.wateryPrelude = 0;
    stool.wateryWaves = 0;
    // §9.3 窜稀减阻力看阻力高不高
    const difficulty = clampNumber(stool.difficulty, 0, 100, 0);
    if (!canStoolWateryLeak(difficulty)) {
      // 低/中阻力：阻力也降（整条清了）
      stool.difficulty = Math.max(0, difficulty - STOOL_SUCCESS_RELIEF);
    }
    // 高阻力：阻力一点不降（漏的是绕过硬块的水）
  }
  profile.stool = stool;
}

// §6.8 绞痛掷骰（每小时）：中了就临时 +[8,15]，靠 decayPerHour 掉
function applyStoolCrampRoll(profile, tick) {
  if (isMetabolismExempt(profile, 'stool')) return;
  const stage = String(profile?.base?.stage || '');
  const engagedCount = getEngagedFetusCount(profile);
  const lines = getStoolLines(stage, engagedCount, getEngagementProgress(profile));
  const signal = clampNumber(profile?.metabolism?.stool, 0, lines.cap, 0);
  const level = getStoolLevel(signal, lines);
  const chance = computeStoolCrampChance(level);
  if (chance <= 0) return;
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (hours <= 0) return;
  const rollChance = 1 - Math.pow(1 - chance, hours);
  if (Math.random() >= rollChance) return;
  const gain = Math.floor(randomNumber(8, 16));
  addMetabolismValue(profile, 'stool', gain, 0, BASE_METABOLISM_CAP, 'stimulus');
}

// §8.5 检定公式：一趟不是一次掷骰，是一个回合序列。
// 每回合 ≈ 1–2 分钟用力，上限默认 3–5 回合。
// 成功按绝对量扣（排出量见 §8.3）；失败阻力 +N（N=2，防重试洞）。
// 冷却窗口内直接被挡回，不给掷骰。
function resolveStoolAttempt(profile, female, options = {}) {
  if (isMetabolismExempt(profile, 'stool')) return null;
  const metabolism = profile.metabolism || {};
  const cap = getMetabolismCap(profile, 'stool');
  const current = clampNumber(metabolism.stool, 0, cap, 0);
  const stage = String(profile?.base?.stage || '');
  const engagedCount = getEngagedFetusCount(profile);
  const progress = getEngagementProgress(profile);
  const lines = getStoolLines(stage, engagedCount, progress);
  if (current < lines.floor) return null;

  const stool = { ...(profile.stool || {}) };
  // 冷却窗口内直接挡回（§8.1 20–40 分钟防重试洞）。
  const nowMinutes = Number(options.nowMinutes || 0);
  const lastAttempt = Number(stool.lastAttemptMinutes || 0);
  const cooldown = randomNumber(STOOL_COOLDOWN_MINUTES.min, STOOL_COOLDOWN_MINUTES.max);
  if (lastAttempt > 0 && nowMinutes > 0 && (nowMinutes - lastAttempt) < cooldown) {
    profile.stool = { ...stool, cooldownUntil: lastAttempt + cooldown };
    profile.metabolism = metabolism;
    return { success: false, cooldown: true, failDays: stool.failDays, difficulty: stool.difficulty };
  }

  const posture = String(options.posture || '');
  const postureRelief = getStoolPostureRelief(posture, stage, engagedCount, progress);
  const maxRounds = clampNumber(options.maxRounds, 1, 10, 5);
  let difficulty = clampNumber(stool.difficulty, 0, 100, 0);
  let signal = current;
  let anySuccess = false;
  let totalExcreted = 0;
  let gasRolled = false;

  for (let round = 0; round < maxRounds; round += 1) {
    if (signal < lines.floor) break;
    const chance = computeStoolSuccessChance(signal, difficulty, lines, postureRelief);
    // §8.2 排气判定独立于排出判定：概率为 0 也照样掷排气——干使劲只放个屁。
    if (!gasRolled) {
      const level = getStoolLevel(signal, lines);
      const gasMult = stool.gasMult || 1;
      const gasChance = computeStoolGasChanceStraining(stage, engagedCount, level, gasMult, engagedCount > 0);
      if (Math.random() < gasChance) {
        gasRolled = true;
        const relief = [1, 3];
        const drop = Math.floor(randomNumber(relief[0], relief[1] + 1));
        signal = Math.max(0, signal - drop);
        metabolism.stool = signal;
        profile.metabolism = metabolism;
      }
    }
    if (Math.random() >= chance) {
      // 失败：阻力 +N，信号不动（防重试全靠阻力涨 + 冷却）
      difficulty = Math.min(100, difficulty + STOOL_FAIL_ROUND_STEP);
      continue;
    }
    // 成功：排出量按阻力档，钳 ≤ 信号 − 地板
    const range = getStoolExcretionRange(difficulty);
    const rawAmount = Math.floor(randomNumber(range.amount[0], range.amount[1] + 1));
    const amount = clampExcretionAmount(rawAmount, signal, lines);
    signal = Math.max(lines.floor, signal - amount);
    totalExcreted += amount;
    anySuccess = true;
    // 成功一次 −20（§9.1）
    difficulty = Math.max(0, difficulty - STOOL_SUCCESS_RELIEF);
    if (signal < lines.urge) break; // 信号跌回 urge 之下自己停
  }

  stool.difficulty = difficulty;
  stool.lastAttemptMinutes = nowMinutes || stool.lastAttemptMinutes;
  if (anySuccess) {
    stool.failDays = 0;
  } else {
    stool.failDays = clampNumber(stool.failDays, 0, 99, 0) + 1;
  }
  metabolism.stool = signal;
  profile.metabolism = metabolism;
  profile.stool = stool;
  void female;
  return { success: anySuccess, excreted: totalExcreted, failDays: stool.failDays, difficulty: stool.difficulty, gas: gasRolled };
}

function applyHourlyPregnancyMetabolism(profile, tick, female) {
  const immune = profile?.immune || {};
  if (immune.metabolism) return;
  const stage = String(profile?.base?.stage || '');
  if (!isTruePregnancyStage(stage)) return;
  if (tick.passedHours <= 0) return;

  const pregnant = profile?.pregnant || {};
  const metabolism = profile?.metabolism || {};
  const fetalEnergyDrain = clampNumber(pregnant.fetalEnergyDrain, 0, 9999, 0);
  const delta = (1 + fetalEnergyDrain) * 2 * tick.passedHours;

  if (hasDerivedMetabolism(profile)) {
    const stressMultiplier = clampNumber(1 + ((clampNumber(profile?.base?.psyStress, 0, 200, 100) - 100) / 200), 0.5, 1.5, 1.0);
    const direction = getDerivedFluxDirection(metabolism.flux, 1);
    const fluxCap = getMetabolismCap(profile, 'flux', Number(metabolism.flux) || direction);
    metabolism.flux = clampNumber((Number(metabolism.flux) || 0) + (delta * stressMultiplier * direction), -fluxCap, fluxCap, metabolism.flux || 0);
  }
  const engagedCount = getEngagedFetusCount(profile);
  // 尿意产量已统一移到主流程 applyUrineProduction（非孕+孕期都走新自然产量表）：
  // 弃用 fetalEnergyDrain 产量链与 URINE_STAGE_RATE 倍率体系。
  addMetabolismValue(profile, 'stool', delta * getStoolStageRateMultiplier(stage), 0, BASE_METABOLISM_CAP);
  addMetabolismValue(profile, 'hunger', delta, 0, BASE_METABOLISM_CAP);
  addMetabolismValue(profile, 'sleep', delta, 0, BASE_METABOLISM_CAP);
  // 尿意的自动排已统一移到主流程（applyUrineProduction 后紧跟 applyRoutineUrineVoid），
  // 这里不再重复调。
  // 顺序有意义：宫压读的是她实际憋到的峰值，所以放在渗漏和失禁把值拉下来之前。
  applyUrineHoldUterinePressure(profile, tick);
  // 憋不住是时间的函数，不需要模型递刺激——不挂在这里，推一整夜也不会尿床。
  applyUrineUrgencyBreak(profile, female);
  refreshUrineLeakCooldown(profile);
  applyStoolGasRoll(profile, tick);
  applyStoolWateryRoll(profile, tick);
  applyStoolWateryPrelude(profile, tick);
  applyStoolCrampRoll(profile, tick);
  applyDerivedMetabolismExemptions(profile);

  const vitalityCap = getVitalityInitByLevel(profile?.base?.vitalityLevel);
  const vitality = clampNumber(profile?.base?.vitality, 0, vitalityCap, vitalityCap);
  const vitalityRatio = vitality / Math.max(1, vitalityCap);
  const days = Math.max(1, Math.ceil(tick.deltaDays));
  // 症状抽样的轮数上限：bsPassedTime 各分量独立 clamp 后可叠到十几万天，
  // 乘上 fetalEnergyDrain 就是十亿级循环，会把 UI 冻死。
  // 封顶的是循环次数而不是时间本身——时间推进与阶段推进保持原语义，
  // 超长时间跳跃只是症状擲骰次数不再线性增长（本来也不该线性增长）。
  const MAX_SYMPTOM_ROUNDS = 2000;
  const rounds = Math.min(MAX_SYMPTOM_ROUNDS, Math.max(1, Math.ceil(fetalEnergyDrain)) * days);
  for (let i = 0; i < rounds; i += 1) {
    const symptomChance = (1 - vitalityRatio) * 100;
    if (Math.random() * 100 < symptomChance) {
      pregnant.nutrition = (Number(pregnant.nutrition) || 0) - 1;
      pregnant.symptomReliefPending = clampNumber(pregnant.symptomReliefPending, 0, 999, 0) + 1;
      profile.pregnant = pregnant;
      profile.notify = {
        ...(profile.notify || {}),
        secondly: `${female}的妊娠症状使身体感到不适，供养力有所流失`,
      };
      break;
    }
  }
}

function applyWeeklyNutrition(profile) {
  const pregnant = profile?.pregnant || {};
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  if (fetuses.length === 0) return false;

  const nutrition = Number(pregnant.nutrition) || 0;
  if (nutrition === 0) return false;

  const absAffinities = fetuses.map((fetus) => Math.abs(clampNumber(fetus?.affinity, -50, 50, 0)));
  const totalAbs = absAffinities.reduce((sum, value) => sum + value, 0);

  const gestationSpeed = clampNumber(getGestationEffectiveSpeed(profile), 0.1, 20, 1);
  const weightScale = 0.02;

  if (nutrition > 0) {
    for (let i = 0; i < fetuses.length; i += 1) {
      const share = totalAbs > 0 ? nutrition * (absAffinities[i] / totalAbs) : nutrition / fetuses.length;
      const factor = 1 + share * gestationSpeed * weightScale;
      fetuses[i].weight = clampNumber((Number(fetuses[i].weight) || 1) * factor, 0.33, 3.0, 1);
    }
  } else {
    const maxAbs = Math.max(...absAffinities, 0);
    const reverseWeights = absAffinities.map((value) => maxAbs - value + 1);
    const totalReverse = reverseWeights.reduce((sum, value) => sum + value, 0);
    for (let i = 0; i < fetuses.length; i += 1) {
      const share = totalReverse > 0 ? nutrition * (reverseWeights[i] / totalReverse) : nutrition / fetuses.length;
      const factor = 1 + share * gestationSpeed * weightScale;
      fetuses[i].weight = clampNumber((Number(fetuses[i].weight) || 1) * factor, 0.33, 3.0, 1);
    }
  }

  pregnant.nutrition = 0;
  pregnant.fetuses = fetuses;
  profile.pregnant = pregnant;
  return true;
}

// 逾期只出声，不再直接加压。
//
// 「离临产越来越近」这件事现在由基线承载（见 getUterinePressureBaseline），
// 基线随孕周自己爬。若这里再往当前值上加一笔，那笔会被回落慢慢抹掉，
// 于是同一件事有两个来源、其中一个还会漏——不如只留基线那一个。
function applyOverduePressure(profile, tick, female) {
  const stage = String(profile?.base?.stage || '');
  if (stage !== '逾期' || tick.passedDays <= 0) return;
  profile.notify = {
    ...(profile.notify || {}),
    secondly: `${female}已逾期，宫缩压力持续增强`,
  };
}

/**
 * 压力往基线回落。
 *
 * 这是整个拆分的核心：没有它，事件加值就是永久的，跳绳那一次两个月后还在。
 * 落到基线而不是落到 0——「接近临产」不该被回落抹掉。
 * 持续性刺激期间地板被抬起来，所以回落只落到地板，松开之后才继续往下走。
 */
function applyUterinePressureDecay(profile, tick) {
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (hours <= 0) return;
  const base = profile.base || {};
  const pressureCap = getUterinePressureCap(profile);
  const current = clampNumber(base.uterinePressure, 0, pressureCap, 0);
  const baseline = getUterinePressureBaseline(
    clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0),
    pressureCap,
  );
  const floor = Math.min(pressureCap, baseline + getUterinePressureStandingFloor(profile));
  if (current <= floor) {
    // 低于基线时往上补：孕周走到这儿了，压力不该比基线还低。
    if (current < baseline) {
      base.uterinePressure = Math.min(baseline, current + (PRESSURE_DECAY_PER_HOUR * hours));
      profile.base = base;
    }
    return;
  }
  base.uterinePressure = Math.max(floor, current - (PRESSURE_DECAY_PER_HOUR * hours));
  profile.base = base;
}

// 高出基线多少——分档与分娩乘区读的都是这个，不是绝对值。
function getUterinePressureOverBaseline(profile) {
  const pressureCap = getUterinePressureCap(profile);
  const current = clampNumber(profile?.base?.uterinePressure, 0, pressureCap, 0);
  const baseline = getUterinePressureBaseline(
    clampNumber(profile?.pregnant?.effectivePregnantDays, 0, 9999, 0),
    pressureCap,
  );
  return Math.max(0, current - baseline);
}

function applyNaturalMetabolismRecovery(profile, tick) {
  const immune = profile?.immune || {};
  const metabolism = profile?.metabolism || {};
  if (immune.metabolism) {
    metabolism.urine = 0;
    metabolism.stool = 0;
    metabolism.hunger = 0;
    metabolism.sleep = 0;
    metabolism.flux = 0;
    // 乳意是冻住而不是抹掉：奶已经产出来了，免疫代谢不该让它凭空消失。
    // 存量、出口状态、堵的计数器都原样留着，只是停止变化
    //（容量是算出来的，没有东西要冻）。其余六项的冻结语义未定，先不动。
    // ⚠️ **性欲这里一个字都不能加。** 它既不抹也不冻，是照常走——
    // 这个开关管的是生理需求，不管她起不起来（见 advanceLibido 上面那一段）。
    profile.metabolism = metabolism;
    return;
  }
  applyDerivedMetabolismExemptions(profile);

  const passedDays = Math.max(0, tick.passedDays);

  if (hasDerivedMetabolism(profile)) {
    if (passedDays > 0) {
      const fluxCap = getMetabolismCap(profile, 'flux', Number(metabolism.flux) || 0);
      const currentFlux = clampNumber(metabolism.flux, -fluxCap, fluxCap, 0);
      const recovery = 14 * passedDays;
      if (currentFlux > 0) metabolism.flux = Math.max(0, currentFlux - recovery);
      else if (currentFlux < 0) metabolism.flux = Math.min(0, currentFlux + recovery);
      else metabolism.flux = 0;
    }
    profile.metabolism = metabolism;
  }

  if (passedDays <= 0) return;

  const dayHungerRecovery = 16 * passedDays;
  const daySleepRecovery = 18 * passedDays;

  // 尿意不做减法：在孕晚期的积累速率面前每天减 12 等于没有。
  // 这一项的语义本来是「离场的日子默认她自己去过厕所」，那就直接压到残值——
  // 二十趟厕所是背景，不该占正文，也不该在结算日之后留着一个虚高的值。
  if (isMetabolismExempt(profile, 'urine')) {
    metabolism.urine = 0;
  } else {
    const urineCap = getMetabolismCap(profile, 'urine');
    const prolonged = isProlongedPregnancy(profile);
    const residual = getUrineFloor(String(profile?.base?.stage || ''), getEngagedFetusCount(profile), getEngagementProgress(profile), prolonged)
      + getUrineResidualValue(String(profile?.base?.stage || ''), getEngagedFetusCount(profile), getEngagementProgress(profile), prolonged);
    metabolism.urine = Math.min(clampNumber(metabolism.urine, 0, urineCap, 0), residual);
  }
  // 跨天就把趟数归零，也把「憋着」放掉：没有哪段憋尿能跨过一整天。
  if (profile.urine) profile.urine = { ...profile.urine, voidsToday: 0, holding: false };
  // 便意按天走抽卡：离场的每一天都掷一次，排出则清零，排不出则天数累加。
  if (isMetabolismExempt(profile, 'stool')) {
    metabolism.stool = 0;
  } else {
    const stoolCap = getMetabolismCap(profile, 'stool');
    metabolism.stool = clampNumber(metabolism.stool, 0, stoolCap, 0);
    profile.metabolism = metabolism;
    const attempts = Math.min(30, Math.ceil(passedDays));
    for (let day = 0; day < attempts; day += 1) {
      addMetabolismValue(profile, 'stool', 24 * getStoolStageRateMultiplier(String(profile?.base?.stage || '')), 0, BASE_METABOLISM_CAP);
      resolveStoolAttempt(profile);
    }
    // 衰减按整天小时数（日结算的离场日子也要衰减）。
    // hourly metabolism 里也衰减了 passedHours 小时——但 passedHours 包含 passedDays*24，
    // 两者在同一次 bsPassedTime 里会双算。这里传 0 是因为：
    // 衰减只由 hourly metabolism 负责（按 passedHours），日结算只负责 stool 循环。
    // 非孕角色不走 hourly metabolism，但底噪 0、检定有概率成功就 −20，
    // difficulty 不会无限涨。
  }
  metabolism.hunger = isMetabolismExempt(profile, 'hunger') ? 0 : Math.max(0, clampNumber(metabolism.hunger, 0, getMetabolismCap(profile, 'hunger'), 0) - dayHungerRecovery);
  metabolism.sleep = isMetabolismExempt(profile, 'sleep') ? 0 : Math.max(0, clampNumber(metabolism.sleep, 0, getMetabolismCap(profile, 'sleep'), 0) - daySleepRecovery);
  applyDerivedMetabolismExemptions(profile);
  profile.metabolism = metabolism;
}

function applyWeeklyMetabolismRoutine(profile, tick, options = {}) {
  if (profile?.immune?.metabolism) return;
  const metabolism = profile.metabolism || {};
  const settledWeeks = Math.max(0, Math.floor(Number(tick.passedLifestyleWeeks) || 0));
  if (settledWeeks > 0) {
  }
  if (options.enteredFollicular && !canProduceMilk({ ...profile, base: { ...(profile.base || {}), stage: options.stage } })) {
    metabolism.milk = 0;
  }
  applyDerivedMetabolismExemptions(profile);
  profile.metabolism = metabolism;
}

// （原 applyMetabolismFromVitality 已删，2026-09-03，TASK-05 拍板 #9：
//   「掉体力→攒尿便」是旧状态值模型的因果，跟新体力存量条＋活动档接口
//   重复计费。代谢推进各走各的 tick。）

function getDerivedFluxLevel(value, cap = BASE_METABOLISM_CAP) {
  return getMetabolismLevel(Math.abs(Number(value) || 0), cap);
}

function getDerivedFluxNeedLabel(value) {
  return (Number(value) || 0) >= 0 ? '正极释放需求' : '负极释放需求';
}

function updateAdvisoryNotify(profile, female) {
  const notify = profile?.notify || {};
  const metabolism = profile?.metabolism || {};
  const base = profile?.base || {};
  const pregnant = profile?.pregnant || {};
  const needs = [];

  const hungerLevel = getMetabolismLevel(metabolism.hunger, getMetabolismCap(profile, 'hunger'));
  const sleepLevel = getMetabolismLevel(metabolism.sleep, getMetabolismCap(profile, 'sleep'));
  const milkLevel = getMetabolismLevel(metabolism.milk, getMetabolismCap(profile, 'milk'));
  const maybePushNeed = (key, label, level) => {
    if (!isMetabolismExempt(profile, key) && ['高', '满', '爆'].includes(level)) needs.push(`${label}:${level}`);
  };

  // 尿意不进这条清单：孕晚期它常驻高档以上，每轮挂一句「应优先处理」会把正文
  // 拖成一连串上厕所。趟数是过程，不出声；漏尿与失禁是结果，走 firstly/secondly。
  // 便意同理，只在连着几天排不出来时出声。
  maybePushNeed('hunger', '饿意', hungerLevel);
  maybePushNeed('sleep', '困意', sleepLevel);
  maybePushNeed('milk', '乳意', milkLevel);

  const reminders = [];
  if (hasDerivedMetabolism(profile)) {
    const fluxCap = getMetabolismCap(profile, 'flux', Number(metabolism.flux) || 0);
    const flux = clampNumber(metabolism.flux, -fluxCap, fluxCap, 0);
    if (Math.abs(flux) >= 75) {
      reminders.push(`${female}的${getDerivedFluxNeedLabel(flux)}已达到${getDerivedFluxLevel(flux, fluxCap)}，应优先使用 bsExcreteMetabolism 进行解放；若释放量足够大，需求极性才会跨过 0 翻转`);
    }
    if (needs.length > 0) {
      reminders.push(`${female}仍有未被衍生代谢抵免的生理需求（${needs.join('、')}），可用 bsExcreteMetabolism 处理`);
    }
  } else if (needs.length > 0) {
    reminders.push(`${female}有强烈的生理需求（${needs.join('、')}），应优先使用 bsExcreteMetabolism 缓解生理不适`);
  }
  // 便意只在连着几天没排出来时出声：这是状态而不是频次，出现得少才值得写。
  const stoolFailDays = clampNumber(profile?.stool?.failDays, 0, 99, 0);
  if (!isMetabolismExempt(profile, 'stool') && stoolFailDays >= STOOL_CHECK.notifyFailDays) {
    reminders.push(`${female}已连续${stoolFailDays}天没能顺利排便，腹胀与坠感明显，用力时需顾虑腹压`);
  }
  // 堵住那一格是剧情事件，不是每天都发生的事，所以只有它出声——
  // 而且必须出声：它跟别的需求相反，越挤越出不来，模型不知道就会写成「挤一挤好了」。
  if (!isMetabolismExempt(profile, 'milk') && isMilkBlocked(profile)) {
    reminders.push(`${female}的乳房已经堵住：局部硬块、碰不得，而且越挤越出不来（挤压会加重肿、让路更窄）。bsExcreteMetabolism 排不掉这一格，方向是热敷软化加轻手法`);
  }

  const stage = String(base.stage || '');
  if (['临产期', '逾期', '产兆前驱', '第一产程', '第二产程'].includes(stage)) {
    const amnion = clampNumber(pregnant.amnionDurability, -100, 100, 0);
    if (amnion > 0) {
      // 陈述句会被当成背景资讯忽略，必须写成禁令：设定上产程前羊膜恒不破，
      // 模型却很常自行写出破水，导致叙事与系统状态脱节。
      // 但只在真的能破水的阶段才指向工具——临产期／逾期调用必被拒，
      // 提示它去调等于教它做一件必定失败的事。
      const canRupture = RUPTURE_ALLOWED_PRELABOR_STAGES.includes(stage) || ['第一产程', '第二产程'].includes(stage);
      reminders.push(canRupture
        ? `${female}尚未破水（膜耐性还有${Math.round(amnion)}%）：禁止描写破水、羊水流出或羊膜破裂。若剧情确实需要破水，必须先调用 bsRuptureMembranes，成功后才可如此描写`
        : `${female}尚未破水（膜耐性还有${Math.round(amnion)}%）：禁止描写破水、羊水流出或羊膜破裂。此阶段无法破水，必须先进入产兆前驱`);
    } else if (stage !== '第三产程') {
      reminders.push(`${female}已破水`);
    }
  }

  if (stage === '产兆前驱') {
    reminders.push(Boolean(profile?.immune?.realisticLabor)
      ? `${female}正处于产兆前驱阶段，可使用 bsMaternalFetalInteraction（direction=maternal）尝试延后分娩；真实产程下分娩只能延后、无法取消，累计延后到上限后必然进入产程`
      : `${female}正处于产兆前驱阶段，可优先使用 bsMaternalFetalInteraction（direction=maternal）尝试延后分娩`);
  }

  profile.notify = {
    ...notify,
    thirdly: reminders.join('；'),
  };
}

function applyAmnionDurabilityFromPressure(profile, finalPressure, female) {
  const base = profile?.base || {};
  const pregnant = profile?.pregnant || {};
  const stage = String(base.stage || '');
  if (!PREGNANCY_STAGES.includes(stage)) return;

  const pressureCap = getUterinePressureCap(profile);
  const warningThreshold = pressureCap * 0.33;
  if (finalPressure <= warningThreshold) return;

  const currentDurability = clampNumber(pregnant.amnionDurability, 0, 100, 100);
  const drain = Math.max(1, clampNumber(pregnant.fetalEnergyDrain, 0, 9999, 1));
  const minDurability = LABOR_STAGES.includes(stage) ? 0 : 1;
  const nextDurability = Math.max(minDurability, currentDurability - drain);

  pregnant.amnionDurability = nextDurability;
  profile.pregnant = pregnant;

  const notify = profile.notify || {};
  if (stage === '孕早期' || stage === '孕中期') {
    notify.secondly = `${female}子宫压力过高，有流产风险`;
  } else {
    notify.secondly = `${female}子宫收缩强烈，即将生产`;
  }
  profile.notify = notify;
}

function applyExcreteMetabolism(chatState, args) {
  const female = String(args?.female || '').trim();
  const options = args?.options && typeof args.options === 'object' ? args.options : {};
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsExcreteMetabolism skipped: unknown character ${female || '(empty)'}.` };

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const metabolism = profile.metabolism || {};
  const notify = profile.notify || {};
  const immune = profile.immune || {};
  if (immune.metabolism) return { applied: false, message: `bsExcreteMetabolism skipped for ${female}: metabolism immune.` };
  applyDerivedMetabolismExemptions(profile);
  applyMetabolismCapacityLimits(profile);

  const isDerived = hasDerivedMetabolism(profile);
  const hasOptions = Object.keys(options).length > 0;
  const wantsFluxRelease = isDerived && (!hasOptions || options.flux !== undefined);
  if (wantsFluxRelease) {
    const fluxCap = getMetabolismCap(profile, 'flux', Number(metabolism.flux) || 0);
    const currentFlux = clampNumber(metabolism.flux, -fluxCap, fluxCap, 0);
    const direction = getDerivedFluxDirection(currentFlux, 1);
    const releasePower = options.flux !== undefined ? Math.max(0, Number(options.flux) || 0) : 40;
    metabolism.flux = clampNumber(currentFlux - (direction * releasePower), -fluxCap, fluxCap, currentFlux);
    profile.metabolism = metabolism;
    const nextFlux = clampNumber(metabolism.flux, -fluxCap, fluxCap, 0);
    const didFlip = currentFlux !== 0 && Math.sign(currentFlux) !== Math.sign(nextFlux) && nextFlux !== 0;
    profile.notify = {
      ...notify,
      secondly: didFlip
        ? `${female}完成了一次${direction > 0 ? '正极' : '负极'}解放，需求强度被压过头，极性翻转为${nextFlux > 0 ? '正极' : '负极'}`
        : `${female}完成了一次${direction > 0 ? '正极' : '负极'}解放，当前需求降为 ${Math.round(nextFlux)}`,
    };
  }

  const currentUrine = clampNumber(metabolism.urine, 0, getMetabolismCap(profile, 'urine'), 0);
  const currentStool = clampNumber(metabolism.stool, 0, getMetabolismCap(profile, 'stool'), 0);
  const currentHunger = clampNumber(metabolism.hunger, 0, getMetabolismCap(profile, 'hunger'), 0);
  const currentSleep = clampNumber(metabolism.sleep, 0, getMetabolismCap(profile, 'sleep'), 0);
  const currentMilk = clampNumber(metabolism.milk, 0, getMetabolismCap(profile, 'milk'), 0);

  const optionReduction = (key, fallback = 0) => Math.max(0, options[key] !== undefined ? Number(options[key]) || 0 : fallback);
  const useDefaults = !hasOptions && !isDerived;
  const urineReduction = isMetabolismExempt(profile, 'urine') ? 0 : optionReduction('urine', useDefaults ? 30 : 0);
  const stoolReduction = isMetabolismExempt(profile, 'stool') ? 0 : optionReduction('stool', useDefaults ? 30 : 0);
  const hungerReduction = isMetabolismExempt(profile, 'hunger') ? 0 : optionReduction('hunger', useDefaults ? 40 : 0);
  const sleepReduction = isMetabolismExempt(profile, 'sleep') ? 0 : optionReduction('sleep', useDefaults ? 40 : 0);
  // 排乳按存量函数扣（TASK-06 拍板）：min(档位 expel 上限, 当前存量 × 比例)。
  // 不是固定 30 也不是固定 expel——刚排完只剩几滴时挤不出 expel 的量。
  // 排乳反射没建立时打三折（吸出来的少）。
  const milkExpelAmount = getMilkExpelAmount(profile, currentMilk);
  const milkReduction = isMetabolismExempt(profile, 'milk') ? 0 : optionReduction('milk', useDefaults ? milkExpelAmount : 0);

  let relievedUrine = Math.min(currentUrine, urineReduction);
  const relievedHunger = Math.min(currentHunger, hungerReduction);
  const relievedSleep = Math.min(currentSleep, sleepReduction);
  const relievedMilk = Math.min(currentMilk, milkReduction);
  // 排乳落点（TASK-06 拍板）：掏空=封顶两成 / 排了大半=封顶一半 / 几滴=−5~15。
  // 存量函数取 0.7 比例 → 掏空落点 ≈ 存量 ×0.3（封顶三成），再钳到两成封顶。
  const milkCap = getMetabolismCap(profile, 'milk');
  const milkResidualMax = Math.floor(milkCap * 0.2);  // 残值封顶两成
  const milkResidual = Math.min(milkResidualMax, currentMilk - relievedMilk);

  // §九 排不出来检定：胎头把尿道压扁。入盆深度 0.6 起才有，产程里更狠。
  // 起不了流 = 排尿失败，值不减，20分钟冷却；断断续续 = 排出量打七折、残值×1.3。
  // 姿势抵扣：站姿/后仰减概率，有人托肚子减更多。抵扣是临时减概率，不进值。
  let urineVoidResult = null;
  if (relievedUrine > 0 && !isMetabolismExempt(profile, 'urine')) {
    const voidStage = String(base.stage || '');
    const engagedCount = getEngagedFetusCount(profile);
    const engProgress = getEngagementProgress(profile);
    const effDays = Number(profile?.pregnant?.effectivePregnantDays) || 0;
    const urineState = { ...(profile.urine || {}) };
    const nowMinutes = Number(profile?.tick?.currentMinutes) || 0;
    // 第二产程锁定机制（TASK-02 拍板）：胎头卡在产道里，膀胱基本没了——
    // 不掷排不出检定，用力就漏一次 −8~12，漏空后由产量 tick 锁回 10。
    if (voidStage === '第二产程') {
      relievedUrine = Math.floor(randomNumber(8, 13));
      urineVoidResult = { result: 'secondStageLeak', amount: relievedUrine };
      profile.urine = urineState;
    } else {
    // 冷却期内直接挡回——刚排完膀胱还没恢复，蹲着也挤不出来。
    // 不管上次是成功还是失败，排完都进冷却。
    const cooldownUntil = Number(urineState.voidCooldownUntil) || 0;
    if (cooldownUntil > 0 && nowMinutes < cooldownUntil) {
      relievedUrine = 0;
      urineVoidResult = { result: 'blocked', reason: '排完冷却内' };
    } else {
      // 姿势抵扣：模型递 options.urinePosture = 'stand'|'leanBack'|'supportBelly'
      const postureKey = String(options.urinePosture || '');
      let postureDiscount = 0;
      if (postureKey === 'stand' || postureKey === 'leanBack') {
        postureDiscount = engProgress >= 1.0
          ? URINE_VOID_POSTURE_DISCOUNT.stand_lean_back_full
          : URINE_VOID_POSTURE_DISCOUNT.stand_lean_back;
      } else if (postureKey === 'supportBelly') {
        postureDiscount = voidStage === '第二产程'
          ? URINE_VOID_POSTURE_DISCOUNT.support_belly_full
          : URINE_VOID_POSTURE_DISCOUNT.support_belly;
      }
      // 多胎：排不出来概率更高（TASK-02 §十二）——抢同一个出口，谁都下得慢。
      const multipleAdjust = getUrineMultipleAdjust(Math.max(1, clampNumber(profile?.pregnant?.fetusesCount, 0, 99, 1)));
      const diff = getUrineVoidDifficulty(voidStage, engagedCount, engProgress, effDays, postureDiscount);
      diff.noFlow = clampNumber(diff.noFlow + multipleAdjust.failRate, 0, 0.95, diff.noFlow);
      if (diff.noFlow > 0 || diff.intermittent > 0) {
        const roll = Math.random();
        if (diff.noFlow > 0 && roll < diff.noFlow) {
          // 起不了流：值不减，进20分钟冷却
          relievedUrine = 0;
          urineState.voidCooldownUntil = nowMinutes + 20;
          profile.urine = urineState;
          urineVoidResult = { result: 'noFlow' };
        } else if (diff.intermittent > 0 && roll < diff.noFlow + diff.intermittent) {
          // 断断续续：排出量打七折
          relievedUrine = Math.floor(relievedUrine * URINE_INTERMITTENT_DROP_RATIO);
          urineVoidResult = { result: 'intermittent' };
        }
      }
      // 排成功（不管有没有检定概率、是不是断断续续）：也进冷却——
      // 膀胱刚收缩完，要恢复才能再排。双次排尿要等 20 分钟就是这个意思。
      if (relievedUrine > 0) {
        urineState.voidCooldownUntil = nowMinutes + 20;
        profile.urine = urineState;
      }
    }
    }
  }

  // 孕晚期排空留残值：膀胱被压着排不干净，「尿完还滴几秒」。
  // 这一条比压容量更影响体感——刚上完厕所就已经在低档，到爆只剩七成空间。
  // 基数是 urge 而不是 hard：残值的语义是「排空目标没排到底」，那条目标线就是 urge。
  // 拿 hard 算会得出入盆后排空落在 18.6、而失禁落在 23.4——两者几乎贴在一起，
  // 「她去处理过」与「她漏了」就再也分不出来（渗漏那边一直用的也是 urge）。
  // §三拆分后（TASK-02 定稿）：落点 = 地板（不可减）+ 残值绝对值（可靠双次排尿清掉）。
  const prolonged = isProlongedPregnancy(profile);
  const urineFloor = getUrineFloor(String(profile?.base?.stage || ''), getEngagedFetusCount(profile), getEngagementProgress(profile), prolonged);
  const baseResidual = urineFloor + getUrineResidualValue(String(profile?.base?.stage || ''), getEngagedFetusCount(profile), getEngagementProgress(profile), prolonged);
  let urineResidual = baseResidual;
  // 已经落在排空线上（刚排过、在残值区）再排一次：双次排尿清残值——这次的目标是地板。
  // 判断用放大前的基线，否则断断续续放大残值线后会被误判成「已在残值区」。
  const doubleVoid = currentUrine <= baseResidual + 0.01;
  // 断断续续排不干净：残值再放大（地板不变，只有残值那一份放大）
  if (urineVoidResult?.result === 'intermittent') {
    urineResidual = urineFloor + (urineResidual - urineFloor) * URINE_INTERMITTENT_RESIDUAL_MULT;
  }
  const nextUrine = Math.max(0, currentUrine - relievedUrine);
  const voidTarget = doubleVoid ? urineFloor : Math.min(currentUrine, urineResidual);
  metabolism.urine = isMetabolismExempt(profile, 'urine')
    ? 0
    : Math.max(nextUrine, Math.min(currentUrine, voidTarget));
  // 主动去排过＝她处理过了：把失禁时刻戳过期，refresh 的静默门控随即放行——
  // 静默期只挡「失禁自己把值打下去」的被动恢复，不挡真的去了厕所（哪怕没排出什么）。
  if (!isMetabolismExempt(profile, 'urine') && relievedUrine > 0) {
    const cooldownAfterVoid = { ...(profile.cooldown || {}) };
    cooldownAfterVoid.urineIncontinenceAt = -999999;
    profile.cooldown = cooldownAfterVoid;
  }
  // 便意不是减法而是检定：想去不等于排得出。排解请求先加一截信号，再掷一次。
  metabolism.stool = currentStool;
  metabolism.hunger = Math.max(0, currentHunger - relievedHunger);
  metabolism.sleep = Math.max(0, currentSleep - relievedSleep);
  // 排乳落点用残值（TASK-06）：排完不是落 0，是落封顶两成。
  metabolism.milk = Math.max(milkResidual, currentMilk - relievedMilk);
  // 挤过／吸过就把堵的计数器清零，顺带冲掉那块痂。但堵住那一格排不掉，
  // relieveMilkBlockage 自己会拒绝——越挤越出不来，方向是热敷软化加轻手法。
  if (relievedMilk > 0) {
    relieveMilkBlockage(profile);
    // 排乳当场提前建立排乳反射（TASK-06 拍板）：一次吸吮/哺乳就建立
    tryEstablishMilkLetDown(profile);
    // 排乳接宫压（TASK-06 拍板）：松档以上一次性 +1~2 宫压
    applyMilkVoidUterinePressure(profile, female, relievedMilk);
  }
  // 堵住恢复尝试：热敷直接解，或时间自然退
  if (options.milkWarmCompress) tryMilkBlockageRecovery(profile, options);
  profile.metabolism = metabolism;

  // §6.2 吃饭四档：胃结肠反射——便意在吃下去那一刻就涨。
  // §6.3 食物标签：速率/阻力/排气乘数/稀加量一次性加减到值上。
  if (options.stoolMeal) {
    applyStoolMeal(profile, options.stoolMeal, Array.isArray(options.stoolTags) ? options.stoolTags : []);
  }

  let stoolAttempt = null;
  let relievedStool = 0;
  if (stoolReduction > 0 && !isMetabolismExempt(profile, 'stool')) {
    stoolAttempt = resolveStoolAttempt(profile, female);
    const afterStool = clampNumber(profile.metabolism?.stool, 0, getMetabolismCap(profile, 'stool'), 0);
    relievedStool = Math.max(0, currentStool - afterStool);
  }
  applyStoolDifficultyDrift(profile);
  // 真的去处理过，失禁那一位才该解除：这条路径原先不刷新冷却，于是漏过一次之后
  // 出声资格要么永久压住、要么被下一次回落误放。
  refreshUrineLeakCooldown(profile);

  addMetabolismValue(profile, 'urine', relievedHunger * 0.5, 0, BASE_METABOLISM_CAP);
  addMetabolismValue(profile, 'stool', relievedHunger * 0.6, 0, BASE_METABOLISM_CAP);
  addMetabolismValue(profile, 'sleep', relievedHunger * 0.1, 0, BASE_METABOLISM_CAP);
  addMetabolismValue(profile, 'hunger', relievedSleep * 0.1, 0, BASE_METABOLISM_CAP);
  // 春梦判定挂在睡眠结算上（TASK-05 第二批拍板）：按睡前性欲档位掷概率 × 孕期倍率。
  maybeLibidoWetDream(profile, female);
  applyDerivedMetabolismExemptions(profile);
  // 睡回体力、吃回体力：跟排解同一条路（排困意＝睡了一觉，排饿意＝吃了顿饭）。
  applyVitalitySleepRecovery(profile, relievedSleep);
  applyVitalityMealRecovery(profile, relievedHunger);

  profile.metabolism = metabolism;

  // §九 排不出来出声
  if (urineVoidResult) {
    const notify2 = profile.notify || {};
    if (urineVoidResult.result === 'noFlow') {
      notify2.secondly = `${female}蹲下去但尿不出来——胎头把尿道压住了，得换个姿势`;
    } else if (urineVoidResult.result === 'intermittent') {
      notify2.secondly = `${female}尿得断断续续，排不干净`;
    } else if (urineVoidResult.result === 'blocked') {
      notify2.secondly = `${female}刚试过尿不出来，还没缓过来`;
    }
    profile.notify = notify2;
  }

  updateAdvisoryNotify(profile, female);
  next.profile = profile;
  chatState.characters[female] = next;
  return { applied: true, message: `bsExcreteMetabolism applied to ${female}.` };
}

function clearPregnancyState(profile) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  base.fertilizationDays = 0;
  base.uterinePressure = 0;
  pregnant.pregnantDays = 0;
  pregnant.effectivePregnantDays = 0;
  pregnant.laborHours = 0;
  pregnant.effectiveLaborHours = 0;
  pregnant.laborPhase = null;
  pregnant.laborFetusIndex = 0;
  pregnant.laborPain = 0;
  // 镇痛窗口跟着产程一起清：窗口只在产程里有意义（laborPain 都归零了），
  // 留着只会在下次怀孕的孕晚期读侧凭空打折。
  pregnant.libidoAnalgesia = 0;
  pregnant.prodromalOriginStage = null;
  pregnant.prodromalRemainingHours = 0;
  pregnant.prodromalDelayProgressHours = 0;
  pregnant.fetuses = [];
  pregnant.fetusesCount = 0;
  pregnant.fetalEnergyDrain = 0;
  pregnant.amnionDurability = 0;
  pregnant.nutrition = 0;
  pregnant.symptomReliefPending = 0;
  profile.base = base;
  profile.pregnant = pregnant;
}

function appendChildrenFromFetuses(profile, fetuses) {
  const children = Array.isArray(profile.children) ? profile.children.map((item) => ({ ...item })) : [];
  const base = profile.base || {};
  const motherDerivedType = base.derivedType ? String(base.derivedType) : null;
  for (const fetus of fetuses) {
    const progress = clampNumber(fetus?.maternalDerivedTypeProgress, -100, 100, 0);
    const fatherDerivedType = fetus?.fatherDerivedType ? String(fetus.fatherDerivedType) : null;
    let childDerivedType = null;

    if (progress > 75 && motherDerivedType) {
      childDerivedType = motherDerivedType;
    }
    if (progress < -75 && fatherDerivedType) {
      childDerivedType = fatherDerivedType;
    }

    // 代孕／寄生：孩子不属于承载者，但先如实记下并标注 provider。
    // 之前是直接 continue 跳过，孩子记录会凭空消失——承载者不得、提供者也没有。
    // 之后由 transferProviderChildren 在拿得到 chatState 的层级转交给 provider。
    const provider = fetus?.provider === null || fetus?.provider === undefined
      ? null
      : String(fetus.provider).trim() || null;
    children.push({
      name: null,
      fathers: String(fetus?.fathers || '未知'),
      provider,
      providerSources: Array.isArray(fetus?.providerSources) ? [...fetus.providerSources] : [],
      chimera: fetus?.chimera ? cloneValue(fetus.chimera) : null,
      gender: String(fetus?.gender || '未知'),
      race: String(fetus?.race || '未知'),
      derivedType: childDerivedType,
      fatherRace: fetus?.fatherRace ? String(fetus.fatherRace) : null,
      fatherDerivedType: fetus?.fatherDerivedType ? String(fetus.fatherDerivedType) : null,
      age: 0,
      birthWeightRatio: clampNumber(fetus?.weight, 0.33, 3.0, 1.0),
      birthAffinity: clampNumber(fetus?.affinity, -50, 50, 0),
      id: createChildId(),
      talents: normalizeTalentList(fetus?.talents ?? fetus?.inheritedTalents),
    });
  }
  profile.children = children;
}

/**
 * 把代孕／寄生产下的孩子转交给 provider。
 *
 * 分娩逻辑只拿得到单一角色的 profile，无法写进别人的资料，
 * 所以先把孩子留在承载者名下并标注 provider，再由这里（有 chatState）转交。
 * provider 尚未注册时保留在承载者名下且保留标记，等对方注册后仍可辨认，
 * 总之不能像先前那样直接丢弃。
 */
function transferProviderChildren(chatState) {
  const characters = chatState?.characters;
  if (!characters || typeof characters !== 'object') return;
  for (const [hostName, host] of Object.entries(characters)) {
    const children = Array.isArray(host?.profile?.children) ? host.profile.children : null;
    if (!children || children.length === 0) continue;
    const kept = [];
    let moved = false;
    for (const child of children) {
      const providerSources = uniqueNonEmptyStrings(child?.providerSources);
      // 多母源嵌合体默认登记在孕育者名下，只允许之后手动转移给其中一位母源。
      if (providerSources.length > 1) {
        kept.push(child);
        continue;
      }
      const provider = providerSources[0] || String(child?.provider || '').trim();
      const target = provider && provider !== hostName ? characters[provider] : null;
      if (!target?.profile) {
        kept.push(child);
        continue;
      }
      // 已经在正确的人名下，不必再留 provider 标记
      const { provider: _ignored, providerSources: _sources, ...received } = child;
      target.profile.children = [...(Array.isArray(target.profile.children) ? target.profile.children : []), received];
      moved = true;
    }
    if (moved) host.profile.children = kept;
  }
}

function resolveLaborStageHours(stage, fetusesCount, birthDifficulty) {
  const safeCount = Math.max(1, fetusesCount);
  const baseHours = LABOR_STAGE_BASE_HOURS[stage] || 0;
  const increment = LABOR_STAGE_INCREMENT[stage] || 0;
  return (baseHours + ((safeCount - 1) * increment)) * birthDifficulty;
}

/**
 * 分娩循环回退：把刚清空的子宫推回锁定的孕期天数，并重新怀上同样的胎儿。
 *
 * 只重置子宫，不重置历史——孩子已经在 applyChildbirthInternal 里记进 children，
 * naturalBirthExperience 也已经累加，所以循环越久产程越短，这是有意保留的。
 *
 * 触发节奏靠子宫压力：applyOverduePressure 每天按胎儿能耗给压力，
 * applyPressureCrisis 在压力到达上限一半时先警告、下次推进才真的发动产兆。
 * 所以这里把压力种子按「再过随机几天才够阈值」倒推，
 * 既得到「一周内不定期发动」，也顺带保证两次分娩至少隔一天。
 */
function applyGestationLoopBack(profile, female, lock, runtime) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const notify = profile.notify || {};
  const loopBackDays = clampNumber(lock?.loopBackDays, 0, 300, 0);
  if (loopBackDays <= 0) return false;

  const templates = Array.isArray(lock?.loopFetusTemplates) ? lock.loopFetusTemplates : [];
  const fallbackWeight = clampNumber(lock?.loopFetusWeight, 0.33, 3.0, 1.0);
  const fetusCount = Math.max(1, clampNumber(lock?.loopFetusCount, 1, 9, templates.length || 1));
  const motherRace = parseRaceDescriptor(base.race || '人类').race || '人类';
  const fetuses = [];
  for (let index = 0; index < fetusCount; index += 1) {
    const template = templates.length > 0 ? templates[index % templates.length] : null;
    if (template) {
      // 照模板复刻：种族、父方、胎位、体重全部沿用，
      // 「一个已入盆一个还在上面」这种胎位差才不会一生就丢。
      fetuses.push({
        ...cloneValue(template),
        embryoId: null,
        fusionCheckedWith: [],
      });
      continue;
    }
    fetuses.push({
      embryoId: null,
      fusionCheckedWith: [],
      fathers: '未知',
      provider: null,
      providerSources: [],
      race: motherRace,
      fatherRace: motherRace,
      fatherDerivedType: null,
      gender: deriveFetusGender(motherRace),
      embryoType: deriveFetusEmbryoType(motherRace),
      weight: fallbackWeight,
      tendencyAngle: randomInt(0, 360),
      affinity: 0,
      maternalDerivedTypeProgress: 0,
    });
  }

  pregnant.fetuses = ensureEmbryoMetadata({ fetuses });
  pregnant.fetusesCount = fetuses.length;
  profile.pregnant = pregnant;
  // 重新怀上就要重新按这一胎的构成算孕育生理，
  // 顺便把 originalPregnancyBio 存回去，下次分娩才还原得回来。
  applyPregnancyPhysiology(profile, runtime || {});

  const effectiveSpeed = clampNumber(getGestationEffectiveSpeed(profile), 0, 20, 1);
  pregnant.effectivePregnantDays = loopBackDays;
  // 冻结（速度 0）时孕日无从反推，直接取等效值，免得除以 0 把存档写坏。
  pregnant.pregnantDays = effectiveSpeed > 0 ? loopBackDays / effectiveSpeed : loopBackDays;
  pregnant.amnionDurability = 100;
  pregnant.nutrition = 0;
  pregnant.symptomReliefPending = 0;

  const derived = derivePregnancyStageState(pregnant.effectivePregnantDays, 1);
  base.stage = derived.stage;
  base.days = derived.days;
  base.fertilizationDays = 0;
  profile.base = base;
  updateFetalEnergyDrain(profile);

  const pressureCap = getUterinePressureCap(profile);
  const crisisThreshold = pressureCap * 0.5;
  const overdueDays = Math.max(0, pregnant.effectivePregnantDays - 280);
  const overdueMultiplier = 1 + (overdueDays / 28);
  const dailyGain = clampNumber(pregnant.fetalEnergyDrain, 0, 9999, 0) * overdueMultiplier;
  // 留 1~5 天攒压力，压力到阈值还要先警告一轮，合起来落在一周内。
  const delayDays = randomInt(1, 5);
  const seededPressure = dailyGain > 0
    ? crisisThreshold - (dailyGain * delayDays)
    : crisisThreshold * 0.5;
  base.uterinePressure = clampNumber(seededPressure, 0, crisisThreshold, 0);
  // 压力已经压到阈值以下，警告冷却自然会在下次推进时重置。
  profile.cooldown = {
    ...(profile.cooldown || {}),
    pregnancyPressureWarning: false,
  };

  profile.notify = {
    ...notify,
    firstly: `${female}进入了${base.stage}`,
    secondly: [
      String(notify.secondly || '').trim(),
      `${lock?.name || '妊娠锁定'}再次生效：${female}的子宫被推回等效妊娠${Math.round(loopBackDays)}天，重新怀上了${fetuses.length}胎`,
    ].filter(Boolean).join('；'),
  };
  return true;
}

function applyChildbirthInternal(profile, female, isNatural) {
  const pregnant = profile.pregnant || {};
  const base = profile.base || {};
  const notify = profile.notify || {};
  const experience = profile.experience || {};
  const runtime = profile.__runtimeRef || null;
  const remainingFetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses.map((item) => ({ ...item })) : [];
  if (remainingFetuses.length > 0) appendChildrenFromFetuses(profile, remainingFetuses);
  clearPregnancyState(profile);
  if (runtime) restorePregnancyPhysiology(profile, runtime);
  base.stage = '产后恢复';
  base.days = 0;
  experience.naturalBirthExperience = clampNumber(experience.naturalBirthExperience, 0, 999, 0) + (isNatural ? 1 : 0);
  experience.surgicalBirthExperience = clampNumber(experience.surgicalBirthExperience, 0, 999, 0) + (isNatural ? 0 : 1);
  profile.experience = experience;
  profile.notify = {
    ...notify,
    firstly: `${female}进入了产后恢复`,
    secondly: remainingFetuses.length > 0
      ? (isNatural
        ? `${female}自然分娩，生下了${remainingFetuses.length}个孩子`
        : `${female}通过手术分娩，生下了${remainingFetuses.length}个孩子`)
      : (isNatural
        ? `${female}完成了自然分娩，进入产后恢复`
        : `${female}完成了手术分娩，进入产后恢复`),
  };
  profile.base = base;
  // 妊娠锁定要在这里消费：孩子已经记进 children、分娩经历也已经累加，
  // 此刻回退只会重置子宫，不会抹掉这一轮生下的孩子和攒下的经验。
  if (profile.gestationLock) {
    applyGestationLoopBack(profile, female, profile.gestationLock, runtime || {});
  }
  return true;
}

function applyLaborAmnionWear(profile, female, options = {}) {
  const pregnant = profile.pregnant || {};
  const notify = profile.notify || {};
  const forceRupture = Boolean(options.forceRupture);
  const silent = Boolean(options.silent);
  const currentDurability = clampNumber(pregnant.amnionDurability, -100, 100, 0);

  if (forceRupture) {
    if (currentDurability > 0) pregnant.amnionDurability = 0;
    profile.pregnant = pregnant;
    return false;
  }

  const drainBase = Math.max(1, clampNumber(pregnant.fetalEnergyDrain, 0, 9999, 1));
  const multiplier = clampNumber(options.multiplier, 0.1, 10, 1);
  const nextDurability = currentDurability - (drainBase * multiplier);
  const ruptured = currentDurability > 0 && nextDurability <= 0;
  pregnant.amnionDurability = nextDurability;
  profile.pregnant = pregnant;

  if (ruptured && !silent) {
    profile.notify = {
      ...notify,
      secondly: `${female}破水了`,
    };
  }
  return ruptured;
}

function getProdromalInitialHours(profile) {
  return 48 * clampNumber(profile?.bio?.birthDifficulty, 0.1, 100, 1);
}

/** 真实产程下产兆前驱的累计延后上限（占初始时长的比例）：只能拖，拖不掉 */
const REALISTIC_PRODROMAL_DELAY_CAP_RATIO = 1.0;

function clearProdromalState(pregnant) {
  pregnant.prodromalOriginStage = null;
  pregnant.prodromalRemainingHours = 0;
  pregnant.prodromalDelayProgressHours = 0;
}

function beginLaborPhase(pregnant, phase, fetusIndex = 0) {
  pregnant.laborPhase = phase;
  pregnant.laborFetusIndex = fetusIndex;
  pregnant.laborHours = 0;
  pregnant.effectiveLaborHours = 0;
}

/**
 * 一次可逆的前驱发作：成串宫缩，会痛，但会散。
 *
 * 她仍然停在临产期／逾期——发作不是一个阶段，是阶段内的一件事。
 * 散掉之后回到等待状态，可以反复无限次。这就是「狼来了」。
 *
 * 物理上：子宫在试着把胎头压进骨盆。胎头还没深固定，那股力就白费了，
 * 于是宫缩自己停下来。所以判据是深固定，不是压力大小。
 */
function startProdromalEpisode(profile, female) {
  const pregnant = profile.pregnant;
  if (!pregnant) return;
  pregnant.prodromalEpisodeHours = rollEpisodeHours();
  pregnant.prodromalEpisodeCount = clampNumber(pregnant.prodromalEpisodeCount, 0, 999, 0) + 1;
  // 原地写，不换 base 对象：换掉会被外层早先抓的引用覆盖回去。
  if (profile.base) profile.base.laborPain = EPISODE_PAIN;
  // 走 firstly：发作是事件。secondly 归压力档那条状态线，
  // 而 applyPressureCrisis 在这之后才跑，写 secondly 会被它盖掉。
  profile.notify = {
    ...(profile.notify || {}),
    firstly: `${female}的宫缩成串发作起来，一阵接一阵，腰骶发酸——但仍不规律，还不是真的要生`,
  };
}

/**
 * 发作期间与散掉那一刻。
 *
 * 发作会抬高子宫压力的地板（跟憋尿那一层同一个形状），所以分娩概率乘区
 * 确实被推上去了——她真的更接近了一点，只是不必然。
 */
function updateProdromalEpisode(profile, tick, female) {
  const pregnant = profile.pregnant;
  if (!pregnant) return;
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (hours <= 0) return;

  if (clampNumber(pregnant.prodromalEpisodeCooldownHours, 0, 9999, 0) > 0) {
    pregnant.prodromalEpisodeCooldownHours = Math.max(
      0,
      clampNumber(pregnant.prodromalEpisodeCooldownHours, 0, 9999, 0) - hours,
    );
  }

  const remaining = clampNumber(pregnant.prodromalEpisodeHours, 0, 9999, 0);
  if (remaining <= 0) return;

  const next = remaining - hours;
  if (next > 0) {
    pregnant.prodromalEpisodeHours = next;
    if (profile.base) profile.base.laborPain = EPISODE_PAIN;
    profile.notify = {
      ...(profile.notify || {}),
      firstly: `${female}的宫缩仍成串来着，痛得不轻，但间隔时长时短、始终没规律起来`,
    };
    return;
  }

  // 散了。这一次又白折腾——正是「以为要生了、结果落空」。
  pregnant.prodromalEpisodeHours = 0;
  pregnant.prodromalEpisodeCooldownHours = EPISODE_COOLDOWN_HOURS;
  if (profile.base) profile.base.laborPain = 0;
  profile.notify = {
    ...(profile.notify || {}),
    firstly: `${female}的宫缩渐渐散了，肚子松下来——又一次白折腾，孩子还在里面`,
  };
}

function isInProdromalEpisode(profile) {
  return clampNumber(profile?.pregnant?.prodromalEpisodeHours, 0, 9999, 0) > 0;
}

function enterProdromalStage(profile, female, stage, message) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  base.stage = '产兆前驱';
  base.days = 0;
  pregnant.laborHours = 0;
  pregnant.effectiveLaborHours = 0;
  pregnant.laborPhase = null;
  pregnant.laborFetusIndex = 0;
  pregnant.prodromalOriginStage = stage;
  pregnant.prodromalRemainingHours = getProdromalInitialHours(profile);
  pregnant.prodromalDelayProgressHours = 0;
  // 真前驱开始就把可逆发作清掉：两种状态不能并存。
  // 不清的话那次发作会继续抬着压力地板，真前驱自己的压力曲线就被它顶住不动。
  pregnant.prodromalEpisodeHours = 0;
  pregnant.prodromalEpisodeCooldownHours = 0;
  pregnant.laborPain = 0;
  profile.pregnant = pregnant;
  updateLaborPain(profile, '产兆前驱', null, 0);
  profile.notify = {
    ...(profile.notify || {}),
    firstly: `${female}进入了产兆前驱`,
    secondly: message,
  };
}

/**
 * 胎头入盆持续了多久。
 *
 * 这个计数器必须独立于孕周。凭空造出来的角色——强制令、魔法、跨过很长时间的
 * 存档——可能一上场就是 41 周且胎头已入盆；那也该从第 1 天算起。拿孕周倒推会
 * 得出「她已经完全入盆十几天了」，当天就必生。
 *
 * 浮回去（engaged 转假）就清零：于是「下降—浮回—再下降」的拉锯会一次次把
 * 计时打回原点，而这是拉锯行为自己的后果，引擎里没有一条规则提到它。
 */
function updateFetalEngagementDays(profile, tick) {
  // 原地改，不替换 profile.pregnant：替换会切断 fetuses 数组的引用，
  // 把同一轮里 updateFetalDescent 写进去的下降度弄丢。
  const pregnant = profile.pregnant;
  if (!pregnant) return;
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (getEngagedFetusCount(profile) <= 0) {
    if (pregnant.engagedDays) pregnant.engagedDays = 0;
    return;
  }
  if (hours <= 0) return;
  pregnant.engagedDays = clampNumber(pregnant.engagedDays, 0, 9999, 0) + (hours / 24);
}

/**
 * 自然发动：每天掷骰，不是过阈值。
 *
 * 分娩底线之前一票否决——压力多高、入盆多久都不掷。过了底线之后，
 * 没入盆也有极低概率发动（现实里正是这条路给出 41、42 周才生的那部分人），
 * 入盆与压力只是把概率乘上去。
 */
function maybeStartLabor(profile, tick, female) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const stage = String(base.stage || '');
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (!['临产期', '逾期'].includes(stage) || hours <= 0) return false;

  const fetusesCount = Math.max(1, Array.isArray(pregnant.fetuses) ? pregnant.fetuses.length : 1);
  const effectiveDays = clampNumber(pregnant.effectivePregnantDays, 0, 9999, 0);
  // 硬底线：不到孕周就是不掷骰，不是概率低。
  if (effectiveDays < getLaborFloorDays(fetusesCount)) return false;

  const baseChance = getBaseDailyLaborChance(effectiveDays, fetusesCount);
  if (!(baseChance > 0)) return false;

  const engagementMultiplier = getEngagementLaborMultiplier(
    getEngagedFetusCount(profile),
    clampNumber(pregnant.engagedDays, 0, 9999, 0),
  );
  // 读高出基线多少而不是绝对值：基线本身代表「离临产多近」，
  // 那件事已经由基础概率按孕周表达过了，再算一次等于重复计入。
  const pressureMultiplier = getPressureLaborMultiplier(getUterinePressureOverBaseline(profile));

  const dailyChance = Math.min(
    MAX_DAILY_LABOR_CHANCE,
    baseChance * engagementMultiplier * pressureMultiplier,
  );
  // 按存活率折算：否则把时间推得越碎就越容易生。
  if (Math.random() >= dailyChanceToTickChance(dailyChance, hours)) return false;

  // 胎头没深固定就催不动产程：子宫那股力是白费的，宫缩来一阵又散。
  // 这一句是「催产反复失败」的全部来源——不是运气不好，是路没修通。
  if (getFixedFetusCount(profile) <= 0) return false;

  enterProdromalStage(profile, female, stage, `${female}开始出现分娩前兆，距离正式产程已经不远`);
  return true;
}

/**
 * 前驱发作有自己的频率，不跟分娩共用掷骰。
 *
 * 挂在同一次掷骰上会让发作变得跟分娩一样罕见，而它们是两种量级的事：
 * 「狼来了」要反复好几次，分娩只有一次。
 */
function maybeStartProdromalEpisode(profile, tick, female) {
  const stage = String(profile?.base?.stage || '');
  if (!['临产期', '逾期'].includes(stage)) return;
  const hours = Math.max(0, Number(tick?.passedHours) || 0);
  if (hours <= 0) return;
  const pregnant = profile.pregnant;
  if (!pregnant) return;
  if (isInProdromalEpisode(profile)) return;
  if (clampNumber(pregnant.prodromalEpisodeCooldownHours, 0, 9999, 0) > 0) return;

  const chance = dailyChanceToTickChance(getEpisodeDailyChance(getEngagedFetusCount(profile)), hours);
  if (Math.random() >= chance) return;
  startProdromalEpisode(profile, female);
}

// 出声资格看「高出基线多少」：基线随孕周爬，若按绝对值判，逾期光靠基线
// 就会一直挂着警告，而那时候她身上其实什么都没发生。
function shouldKeepPregnancyPressureWarning(profile) {
  const stage = String(profile?.base?.stage || '');
  if (!isPregnancyStage(stage)) return false;
  return Boolean(getUterinePressureBand(getUterinePressureOverBaseline(profile)));
}

function applyPressureCrisis(profile, runtime, female) {
  const base = profile?.base || {};
  const pregnant = profile?.pregnant || {};
  const immune = profile?.immune || {};
  const experience = profile?.experience || {};
  const cooldown = profile?.cooldown || {};
  const stage = String(base.stage || '');
  if (!isPregnancyStage(stage)) return { changed: false, warned: false };

  // 判据是高出基线多少，不是绝对值：同一次事件在孕中期与逾期给出同样的体感强度，
  // 而「离临产多近」由基线单独承载，两件事不互相冒充。
  const band = getUterinePressureBand(getUterinePressureOverBaseline(profile));
  if (!band) return { changed: false, warned: false };

  const notify = profile.notify || {};
  // 压力高只出声，不改状态。
  //
  // 原先这里的后果是孕早中期流产、孕晚期起直接进产兆前驱。那意味着剧烈运动、
  // 勒腹、一次激烈性交这类事件攒够了就能让她失去孩子或提前发动——而生理事实是
  // 反的：胎儿有子宫壁＋羊水＋宫颈黏液栓三层保护，日常程度的外力只会诱发假性
  // 宫缩，停下来就缓解；真要造成胎盘早剥需要车祸、高处坠落那个量级的瞬间冲击。
  // 孕晚期同理——宫颈没成熟，任何刺激都催不动产程。
  //
  // 所以健康角色的这条路到「先兆征象」为止：她会紧、会痛、会以为要出事，
  // 但结果是确定的。真要失去孩子只有两个入口——使用者亲自下令（bsAbortion，
  // 带 userDirective），或角色带显式病理标记（pregnant.complication）。
  // 低概率的事会发生，不存在的事不会；要玩起来不提心吊胆，就得是后者。
  const complication = String(pregnant?.complication || '').trim();
  const isEarly = stage === '孕早期' || stage === '孕中期';

  // 出声按档，不按「第几次」：只分首次与后续会让「发紧」那一档也说出
  // 「可能有少量出血」——那是先兆档的话，两档强度差着一截。
  const bandText = {
    tightening: `${female}下腹一阵阵发紧，摸上去硬，几十秒后自行松开`,
    series: `${female}宫缩成串发作、腰骶酸胀，但仍不规律，换姿势或休息后会散去`,
    threatened: `${female}下腹持续发紧、隐隐作痛，可能带少量出血；胎动正常，胎儿情况稳定`,
  }[band.key];

  if (!cooldown.pregnancyPressureWarning) {
    profile.cooldown = {
      ...cooldown,
      pregnancyPressureWarning: true,
    };
    profile.notify = { ...notify, secondly: bandText };
    return { changed: false, warned: true };
  }

  // 带病理标记的角色才走得通原来那条路：胎盘前置、宫颈松弛这类。
  // 没有标记 = 健康 = 压力再高也只到先兆。
  // 而且必须到先兆那一档才谈得上「出事」——发紧、成串本来就只是假性宫缩。
  if (!complication || band.key !== 'threatened') {
    profile.notify = { ...notify, secondly: bandText };
    return { changed: false, warned: false };
  }

  if (isEarly) {
    if (immune.miscarriage) {
      profile.notify = {
        ...notify,
        secondly: `${female}的胚胎受到保护，流产无效，胚胎依旧留着`,
      };
      return { changed: false, warned: false };
    }

    clearPregnancyState(profile);
    restorePregnancyPhysiology(profile, runtime || {});
    base.stage = '产后恢复';
    base.days = 0;
    experience.miscarriageExperience = clampNumber(experience.miscarriageExperience, 0, 999, 0) + 1;
    profile.experience = experience;
    profile.notify = {
      ...notify,
      firstly: `${female}进入了产后恢复`,
      secondly: `${female}因${complication}导致子宫压力过高而流产了`,
    };
    return { changed: true, warned: false };
  }

  if ((stage === '孕晚期' || stage === '临产期') && immune.miscarriage) {
    profile.notify = {
      ...notify,
      secondly: `${female}的胎儿受到保护，早产被阻止了`,
    };
    return { changed: false, warned: false };
  }

  if (stage === '孕晚期' || stage === '临产期' || stage === '逾期') {
    enterProdromalStage(profile, female, stage, `${female}因${complication}导致子宫压力达到临界值，开始出现分娩前兆`);
    return { changed: true, warned: false };
  }

  return { changed: false, warned: false };
}

function resolveSecondPhaseHours(profile, phase, fetuses) {
  const birthDifficulty = clampNumber(profile?.bio?.birthDifficulty, 0.1, 100, 1);
  if (phase === '间歇期') return Math.max(0.5, birthDifficulty * 0.5);
  const firstFetus = Array.isArray(fetuses) && fetuses.length > 0 ? fetuses[0] : null;
  const fetalAngle = Number.isFinite(Number(firstFetus?.tendencyAngle)) ? wrapAngle(firstFetus.tendencyAngle) : 0;
  const positionDifficulty = firstFetus ? calculatePositionDifficulty(fetalAngle, firstFetus) : 1;
  const fetalWeight = firstFetus ? clampNumber(firstFetus?.weight, 0.33, 3.0, 1.0) : 1;
  const total = resolveLaborStageHours('第二产程', 1, birthDifficulty) * positionDifficulty * fetalWeight;
  return total * (phase === '胎体娩出' ? 0.4 : 0.6);
}

function resolveFirstStageExperienceMultiplier(profile) {
  const naturalBirthCount = Math.min(
    FIRST_STAGE_NATURAL_BIRTH_EXPERIENCE.maxCount,
    Math.floor(clampNumber(profile?.experience?.naturalBirthExperience, 0, 999, 0)),
  );
  return Math.max(
    FIRST_STAGE_NATURAL_BIRTH_EXPERIENCE.minMultiplier,
    1 - (naturalBirthCount * FIRST_STAGE_NATURAL_BIRTH_EXPERIENCE.reductionPerBirth),
  );
}

function resolveLaborPhaseHours(profile, stage, phase, fetuses) {
  const birthDifficulty = clampNumber(profile?.bio?.birthDifficulty, 0.1, 100, 1);
  if (stage === '第一产程') {
    const total = resolveLaborStageHours('第一产程', Math.max(fetuses.length, 1), birthDifficulty)
      * resolveFirstStageExperienceMultiplier(profile);
    if (phase === '活跃期') return total * 0.35;
    if (phase === '过渡期') return total * 0.15;
    return total * 0.5;
  }
  if (stage === '第二产程') return resolveSecondPhaseHours(profile, phase, fetuses);
  if (stage === '第三产程') {
    if (phase === '产后观察') return Math.max(
      LABOR_POSTPARTUM_OBSERVATION_HOURS,
      birthDifficulty * LABOR_POSTPARTUM_OBSERVATION_HOURS,
    );
    return Math.max(0.5, resolveLaborStageHours('第三产程', 1, birthDifficulty));
  }
  return 1;
}

function getLaborPhaseForStage(stage, currentPhase) {
  if (stage === '第一产程') return ['潜伏期', '活跃期', '过渡期'].includes(currentPhase) ? currentPhase : '潜伏期';
  if (stage === '第二产程') return ['胎体下降', '胎体娩出', '间歇期'].includes(currentPhase) ? currentPhase : '胎体下降';
  if (stage === '第三产程') return ['供养器官娩出', '产后观察'].includes(currentPhase) ? currentPhase : '供养器官娩出';
  return null;
}

function updateLaborPain(profile, stage, phase, progress = 0, obstruction = false) {
  const pregnant = profile.pregnant || {};
  const base = profile.base || {};
  const ratio = clampNumber(progress, 0, 1, 0);
  const ranges = {
    产兆前驱: [0.5, 2.5],
    潜伏期: [2, 4],
    活跃期: [4, 7],
    过渡期: [7, 8.5],
    胎体下降: [6, 8],
    胎体娩出: [8, 9],
    间歇期: [3, 5],
    供养器官娩出: [3, 5.5],
    产后观察: [1, 3],
  };
  const range = stage === '产兆前驱' ? ranges.产兆前驱 : (ranges[phase] || [0, 0]);
  let pain = range[0] + ((range[1] - range[0]) * ratio);
  const birthDifficulty = clampNumber(profile?.bio?.birthDifficulty, 0.1, 100, 1);
  const difficultyWeight = stage === '产兆前驱' ? (0.25 + (ratio * 0.25)) : (phase === '潜伏期' ? (0.25 + (ratio * 0.75)) : (phase === '产后观察' ? 0.5 : 1));
  pain += clampNumber((birthDifficulty - 1) * 1.5, -1.5, 3, 0) * difficultyWeight;
  const toleranceWeight = stage === '产兆前驱' ? 0.5 : (phase === '潜伏期' ? (0.5 + (ratio * 0.5)) : (phase === '产后观察' ? 0.5 : 1));
  pain += (4 - clampNumber(base.vitalityLevel, 1, 7, 4)) * toleranceWeight;
  pain += ((clampNumber(base.psyStressLevel, 1, 7, 4) - 4) * 0.5) * toleranceWeight;
  if (obstruction) pain += 1.5;
  pregnant.laborPain = Math.round(clampNumber(pain, 0, 10, 0) * 10) / 10;
  profile.pregnant = pregnant;
  return pregnant.laborPain;
}

function processLabor(profile, tick, female) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const notify = profile.notify || {};
  const realisticLabor = Boolean(profile?.immune?.realisticLabor);
  const stage = String(base.stage || '');
  const rawHours = tick.deltaDays * 24;
  if (rawHours <= 0) return false;

  const pressureCap = getUterinePressureCap(profile);
  const currentPressure = clampNumber(base.uterinePressure, 0, pressureCap, 0);
  // 高性欲推产程，方向是对的。但不能读「值除以上限」那个比值——
  // 孕晚期起点抬到 42~50，那样她什么都不做也一直是高乘数。
  // 改成读**高出起点多少**：坐在起点上就是 1.0，真的起来了才给加成。
  const libidoLines = getLibidoLinesOf(profile);
  const libido = clampNumber(profile?.metabolism?.libido, 0, libidoLines.hard, 0);
  const libidoRange = Math.max(1, libidoLines.hard - libidoLines.floor);
  const libidoExcess = clampNumber((libido - libidoLines.floor) / libidoRange, 0, 1, 0);
  const libidoMultiplier = 1 + (libidoExcess * 0.25);
  const baseEffectiveHours = rawHours * libidoMultiplier;
  let currentStageHours = clampNumber(pregnant.laborHours, 0, 9999, 0);
  let currentEffectiveHours = clampNumber(pregnant.effectiveLaborHours, 0, 9999, 0);

  if (stage === '产兆前驱') {
    updateProdromalFetalPositions(profile, tick);
    const initialHours = getProdromalInitialHours(profile);
    // 倒计时按她的状态慢下来：耗竭或情压过阈时宫缩排不动钟点，产程照走只是更慢。
    const remainingHours = clampNumber(pregnant.prodromalRemainingHours, 0, 9999, initialHours) - (rawHours * getVitalityPressureMultiplier(profile));
    pregnant.prodromalRemainingHours = Math.max(0, remainingHours);
    updateLaborPain(profile, stage, null, 1 - (Math.max(0, remainingHours) / initialHours));
    if (remainingHours <= 0) {
      base.stage = '第一产程';
      base.days = 0;
      beginLaborPhase(pregnant, '潜伏期', 0);
      updateLaborPain(profile, '第一产程', '潜伏期', 0);
      clearProdromalState(pregnant);
      profile.notify = {
        ...notify,
        firstly: `${female}进入了第一产程`,
        secondly: `${female}的产兆前驱结束，宫缩进一步加剧，正式进入分娩`,
      };
      return true;
    }
    notify.secondly = `${female}仍处于产兆前驱，距离正式产程约剩${Math.ceil(remainingHours)}小时`;
    profile.notify = notify;
    return false;
  }

  if (!LABOR_STAGES.includes(stage)) return false;

  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  const phase = getLaborPhaseForStage(stage, String(pregnant.laborPhase || ''));
  pregnant.laborPhase = phase;
  if (stage === '第二产程' && clampNumber(pregnant.laborFetusIndex, 0, 99, 0) <= 0) pregnant.laborFetusIndex = 1;
  const realisticObstruction = realisticLabor && stage === '第二产程'
    ? getRealisticLaborObstruction(fetuses)
    : null;
  if (realisticObstruction) {
    notify.firstly = `${female}发生难产警示：${realisticObstruction}，建议使用 bsChildbirth 进行手术产`;
  }
  const threshold = resolveLaborPhaseHours(profile, stage, phase, fetuses);
  const stallThreshold = pressureCap * 0.66;
  const isThirdStageWithNoFetuses = stage === '第三产程' && fetuses.length === 0;

  currentStageHours += rawHours;
  pregnant.laborHours = currentStageHours;

  if (currentPressure < stallThreshold && !isThirdStageWithNoFetuses) {
    const currentRatio = pressureCap > 0 ? (currentPressure / pressureCap) : 0;
    const chanceToStall = Math.max(0, Math.min(1, 1 - currentRatio));
    if (Math.random() < chanceToStall) {
      profile.notify = {
        ...notify,
        secondly: `${female}的子宫收缩微弱，产程进展停滞`,
      };
      pregnant.effectiveLaborHours = currentEffectiveHours;
      updateLaborPain(profile, stage, phase, currentEffectiveHours / threshold, Boolean(realisticObstruction));
      return false;
    }
  } else if (currentPressure >= pressureCap && !realisticLabor) {
    if (stage === '第一产程') {
      applyLaborAmnionWear(profile, female, { forceRupture: true, silent: true });
      base.uterinePressure = pressureCap * 0.5;
      base.stage = '第二产程';
      base.days = 0;
      beginLaborPhase(pregnant, '胎体下降', 1);
      updateLaborPain(profile, '第二产程', '胎体下降', 0);
      profile.notify = {
        ...notify,
        firstly: `${female}进入了第二产程`,
        secondly: `${female}宫口开全，产程突然加速`,
      };
      return true;
    }

    if (stage === '第二产程') {
      applyLaborAmnionWear(profile, female, { forceRupture: true, silent: true });
      let father = '未知';
      let gender = '未知';
      if (fetuses.length > 0) {
        const baby = fetuses.shift();
        father = String(baby?.fathers || '未知');
        gender = String(baby?.gender || '未知');
        appendChildrenFromFetuses(profile, [baby]);
        pregnant.fetuses = fetuses;
        pregnant.fetusesCount = fetuses.length;
        updateFetalEnergyDrain(profile);
      }
      base.uterinePressure = pressureCap * 0.5;
      if (fetuses.length === 0) {
        base.stage = '第三产程';
        base.days = 0;
        beginLaborPhase(pregnant, '供养器官娩出', 0);
        updateLaborPain(profile, '第三产程', '供养器官娩出', 0);
        profile.notify = {
          ...notify,
          firstly: `${female}进入了第三产程`,
          secondly: `${female}产程突然加速，生下了${father}的孩子，性别为${gender}，正在娩出胎盘`,
        };
      } else {
        beginLaborPhase(pregnant, '胎体下降', clampNumber(pregnant.laborFetusIndex, 1, 99, 1) + 1);
        updateLaborPain(profile, '第二产程', '胎体下降', 0);
        profile.notify = {
          ...notify,
          secondly: `${female}产程突然加速，生下了${father}的孩子，性别为${gender}，仍有${fetuses.length}胎待产`,
        };
      }
      return base.stage !== stage;
    }

    if (stage === '第三产程') {
      applyLaborAmnionWear(profile, female, { forceRupture: true, silent: true });
      return applyChildbirthInternal(profile, female, true);
    }
  }

  const pressureMultiplier = stage === '第三产程'
    ? 1
    : Math.max(0.5, Math.min(1.5, 0.5 + (currentPressure / 150)));
  // 她那边跟不上了，宫缩就慢下来：体力耗竭与情压过阈各打七折、叠乘不归零——
  // 第三产程除外（那一程靠她自己的力量已经不多，且孩子必须出来）。
  const vitalityDrag = stage === '第三产程' ? 1 : getVitalityPressureMultiplier(profile);
  const effectiveHoursGain = baseEffectiveHours * pressureMultiplier * vitalityDrag;
  currentEffectiveHours += effectiveHoursGain;
  pregnant.effectiveLaborHours = currentEffectiveHours;
  updateLaborPain(profile, stage, phase, currentEffectiveHours / threshold, Boolean(realisticObstruction));

  if (stage === '第一产程') {
    applyLaborAmnionWear(profile, female, { multiplier: rawHours * 0.35 });
  } else if (stage === '第二产程') {
    applyLaborAmnionWear(profile, female, { multiplier: rawHours * 0.75 });
  } else if (stage === '第三产程') {
    applyLaborAmnionWear(profile, female, { forceRupture: true, silent: true });
  }
  if (pregnant.effectiveLaborHours <= threshold) {
    if (stage === '第二产程' && realisticObstruction && phase === '胎体娩出') {
      notify.secondly = `${female}因${realisticObstruction}无法自然娩出胎儿，产程持续受阻`;
    } else if (stage === '第二产程' && fetuses.length > 0) {
      const firstFetus = fetuses[0];
      const fetalAngle = Number.isFinite(Number(firstFetus?.tendencyAngle)) ? wrapAngle(firstFetus.tendencyAngle) : 0;
      const positionDifficulty = calculatePositionDifficulty(fetalAngle, firstFetus);
      const fetalWeight = clampNumber(firstFetus?.weight, 0.33, 3.0, 1.0);
      notify.secondly = phase === '间歇期'
        ? `${female}正在第${pregnant.laborFetusIndex}胎娩出后的间歇期`
        : `${female}正处于第${pregnant.laborFetusIndex}胎的${phase}，胚位${fetalAngle.toFixed(1)}°，难度${positionDifficulty.toFixed(2)}，胎重${fetalWeight.toFixed(2)}，进度${pregnant.effectiveLaborHours.toFixed(2)}/${threshold.toFixed(2)}小时`;
    } else {
      if (stage === '第一产程') {
        notify.secondly = `${female}正处于第一产程的${phase}`;
      } else {
        notify.secondly = phase === '产后观察'
          ? `${female}已进入产后观察，疼痛与出血状况正在监测`
          : `${female}正在娩出供养器官，进度${pregnant.effectiveLaborHours.toFixed(2)}/${threshold.toFixed(2)}小时`;
      }
    }
    profile.notify = notify;
    return false;
  }

  if (stage === '第一产程') {
    if (phase === '潜伏期') {
      beginLaborPhase(pregnant, '活跃期', 0);
      updateLaborPain(profile, stage, '活跃期', 0);
      profile.notify = { ...notify, firstly: `${female}进入了第一产程·活跃期`, secondly: `${female}的规律宫缩明显加强` };
      return false;
    }
    if (phase === '活跃期') {
      beginLaborPhase(pregnant, '过渡期', 0);
      updateLaborPain(profile, stage, '过渡期', 0);
      profile.notify = { ...notify, firstly: `${female}进入了第一产程·过渡期`, secondly: `${female}的分娩疼痛与压迫感进一步攀升` };
      return false;
    }
    base.stage = '第二产程';
    base.days = 0;
    beginLaborPhase(pregnant, '胎体下降', 1);
    updateLaborPain(profile, '第二产程', '胎体下降', 0);
    profile.notify = { ...notify, firstly: `${female}进入了第二产程·第1胎体下降`, secondly: `${female}开始推动胎儿下降` };
    return true;
  }

  if (stage === '第二产程') {
    if (realisticObstruction && phase === '胎体娩出') {
      pregnant.effectiveLaborHours = threshold;
      profile.notify = {
        ...notify,
        secondly: `${female}因${realisticObstruction}无法自然娩出胎儿`,
      };
      return false;
    }
    if (phase === '胎体下降') {
      beginLaborPhase(pregnant, '胎体娩出', pregnant.laborFetusIndex);
      updateLaborPain(profile, stage, '胎体娩出', 0);
      profile.notify = {
        ...notify,
        firstly: `${female}进入了第二产程·第${pregnant.laborFetusIndex}胎体娩出`,
        secondly: `${female}的第${pregnant.laborFetusIndex}胎开始娩出`,
      };
      return false;
    }
    if (phase === '间歇期') {
      const nextIndex = clampNumber(pregnant.laborFetusIndex, 1, 99, 1) + 1;
      beginLaborPhase(pregnant, '胎体下降', nextIndex);
      updateLaborPain(profile, stage, '胎体下降', 0);
      profile.notify = {
        ...notify,
        firstly: `${female}进入了第二产程·第${nextIndex}胎体下降`,
        secondly: `${female}开始推动下一胎下降`,
      };
      return false;
    }
    if (fetuses.length > 0) {
      const baby = fetuses.shift();
      const father = String(baby?.fathers || '未知');
      const gender = String(baby?.gender || '未知');
      appendChildrenFromFetuses(profile, [baby]);
      pregnant.fetuses = fetuses;
      pregnant.fetusesCount = fetuses.length;
      updateFetalEnergyDrain(profile);
      if (fetuses.length === 0) {
        base.stage = '第三产程';
        base.days = 0;
        beginLaborPhase(pregnant, '供养器官娩出', 0);
        updateLaborPain(profile, '第三产程', '供养器官娩出', 0);
        profile.notify = {
          ...notify,
          firstly: `${female}进入了第三产程·供养器官娩出`,
          secondly: `${female}生下了${father}的孩子，性别为${gender}，正在娩出胎盘`,
        };
      } else {
        beginLaborPhase(pregnant, '间歇期', pregnant.laborFetusIndex);
        updateLaborPain(profile, stage, '间歇期', 0);
        profile.notify = {
          ...notify,
          firstly: `${female}进入了第二产程·第${pregnant.laborFetusIndex}胎后间歇期`,
          secondly: `${female}生下了${father}的孩子，性别为${gender}，仍有${fetuses.length}胎待产`,
        };
      }
      return base.stage !== stage;
    }
    base.stage = '第三产程';
    base.days = 0;
    beginLaborPhase(pregnant, '供养器官娩出', 0);
    updateLaborPain(profile, '第三产程', '供养器官娩出', 0);
    return true;
  }

  if (stage === '第三产程') {
    if (phase === '供养器官娩出') {
      beginLaborPhase(pregnant, '产后观察', 0);
      updateLaborPain(profile, stage, '产后观察', 0);
      profile.notify = {
        ...notify,
        firstly: `${female}进入了第三产程·产后观察`,
        secondly: `${female}的供养器官已娩出，开始观察产后状态`,
      };
      return false;
    }
    return applyChildbirthInternal(profile, female, true);
  }

  return false;
}

function applyAbortion(chatState, args) {
  const female = String(args?.female || '').trim();
  const force = Boolean(args?.force);
  const fetusIndex = args?.fetusIndex;
  const character = chatState.characters?.[female];
  if (!female || !character) {
    return { applied: false, message: `bsAbortion skipped: unknown character ${female || '(empty)'}.` };
  }

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const notify = profile.notify || {};
  const experience = profile.experience || {};
  const immune = profile.immune || {};
  const stage = String(base.stage || '');
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses.map((item) => ({ ...item })) : [];
  const hasConceptionState = fetuses.length > 0 || clampNumber(base.fertilizationDays, 0, 9999, 0) > 0 || isPregnancyStage(stage);

  if (!hasConceptionState) {
    return { applied: false, message: `bsAbortion skipped for ${female}: no conception state.` };
  }

  // 假孕期没有胎儿：结束假孕请走 bsSetMenstrualPhases，不该记进流产经验
  if (stage === '假孕期' && fetuses.length === 0) {
    return { applied: false, message: `bsAbortion skipped for ${female}: 假孕期无胎儿，请用 bsSetMenstrualPhases 结束假孕。` };
  }

  if (immune.miscarriage && !force) {
    profile.notify = {
      ...notify,
      secondly: `${female}的胚胎受到保护，流产无效，胚胎依旧留着`,
    };
    next.profile = profile;
    chatState.characters[female] = next;
    return { applied: false, message: `bsAbortion skipped for ${female}: miscarriage immune.` };
  }

  if (fetusIndex !== undefined && (!Number.isInteger(fetusIndex) || fetusIndex < 0 || fetusIndex >= fetuses.length)) {
    return { applied: false, message: `bsAbortion skipped for ${female}: invalid fetusIndex.` };
  }

  if (Number.isInteger(fetusIndex) && fetusIndex >= 0 && fetusIndex < fetuses.length) {
    const removedFetus = fetuses.splice(fetusIndex, 1)[0];
    pregnant.fetuses = fetuses;
    pregnant.fetusesCount = fetuses.length;
    profile.pregnant = pregnant;
    updateFetalEnergyDrain(profile);
    if (fetuses.length > 0) applyPregnancyPhysiology(profile, next.runtime || {});
    if (fetuses.length > 0) {
      const gender = String(removedFetus?.gender || '未知');
      const race = String(removedFetus?.race || '未知');
      profile.notify = {
        ...notify,
        secondly: `${female}的第${fetusIndex + 1}胎（${gender}，${race}）消失了`,
      };
      next.profile = profile;
      chatState.characters[female] = next;
      return { applied: true, message: `bsAbortion reduced fetus count for ${female}.` };
    }
  }

  clearPregnancyState(profile);
  restorePregnancyPhysiology(profile, next.runtime || {});

  if (MENSTRUAL_STAGES.includes(stage)) {
    base.stage = '卵泡期';
    base.days = 0;
    profile.notify = {
      ...notify,
      firstly: `${female}进入了卵泡期`,
      secondly: `${female}避孕成功`,
    };
  } else {
    base.stage = '产后恢复';
    base.days = 0;
    experience.miscarriageExperience = clampNumber(experience.miscarriageExperience, 0, 999, 0) + 1;
    profile.experience = experience;
    profile.notify = {
      ...notify,
      firstly: `${female}进入了产后恢复`,
      secondly: `${female}流产了`,
    };
  }

  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsAbortion applied to ${female}.` };
}

/**
 * 植入外源胚胎：代孕、胚胎移植、虫母注卵、寄生产卵。
 *
 * 与自然受精的差别在于胚胎的遗传来源与承载者分离。工具只把受精卵加入
 * 共用 fertilizationDays 窗口，不直接完成着床；遗传资料由 race/fatherRace 描述，
 * provider 只记录母源归属。单一母源出生后自动转交，多母源嵌合体留在孕母名下。
 */
function applyImplantEmbryo(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) {
    return { applied: false, message: `bsImplantEmbryo skipped: unknown character ${female || '(empty)'}.` };
  }
  const provider = String(args?.provider || '').trim();
  if (!provider) {
    return { applied: false, message: `bsImplantEmbryo skipped for ${female}: provider is required.` };
  }
  if (provider === female) {
    return { applied: false, message: `bsImplantEmbryo skipped for ${female}: provider must differ from the carrier; use natural conception instead.` };
  }

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const notify = profile.notify || {};
  const currentStage = String(base.stage || '');
  if (isPregnancyStage(currentStage)) {
    return { applied: false, message: `bsImplantEmbryo skipped for ${female}: implantation has already completed.` };
  }

  const count = Math.max(1, Math.min(50, Math.floor(Number(args?.count) || 1)));
  const fathers = String(args?.fathers || '').trim() || '未知';
  // provider 只负责归属；遗传资料来自 race/fatherRace 描述符。
  // race 未提供时，已注册 provider 的状态仅作为兼容性预设，不依赖 provider 名称一定可解析。
  const providerCharacter = chatState.characters?.[provider];
  const explicitRace = String(args?.race || '').trim();
  const providerRace = String(providerCharacter?.profile?.base?.race || '').trim();
  const geneticDescriptor = explicitRace
    ? parseRaceDescriptor(explicitRace)
    : {
      race: parseRaceDescriptor(providerRace || base.race || '人类').race || '人类',
      derivedType: providerCharacter?.profile?.base?.derivedType
        ? String(providerCharacter.profile.base.derivedType)
        : null,
    };
  const geneticRace = geneticDescriptor.race || '人类';
  const fatherRaceText = String(args?.fatherRace || '').trim();
  const fatherDescriptor = parseRaceDescriptor(fatherRaceText || geneticRace);
  const geneticProfile = { base: { race: geneticRace } };
  const spermSeed = {
    male: fathers,
    race: fatherDescriptor.race || geneticRace,
    // 所有外部遗传衍生类型都占父系槽：fatherRace 明示者优先，否则退回卵源 race。
    derivedType: fatherDescriptor.derivedType || geneticDescriptor.derivedType || null,
  };

  const existingFetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  ensureEmbryoMetadata(pregnant);
  for (let index = 0; index < count; index += 1) {
    existingFetuses.push(createSimpleFetus(profile, spermSeed, currentStage, { geneticProfile, provider }));
  }
  pregnant.fetuses = existingFetuses;
  ensureEmbryoMetadata(pregnant);
  pregnant.fetusesCount = existingFetuses.length;
  if (existingFetuses.length === count) base.fertilizationDays = 0;

  profile.base = base;
  profile.pregnant = pregnant;
  updateFetalEnergyDrain(profile);
  profile.notify = {
    ...notify,
    secondly: `${female}加入了${count}个来自${provider}的受精卵，正等待共同著床窗口`,
  };

  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsImplantEmbryo applied to ${female}: ${count} pre-implantation embryo(s) from ${provider}.` };
}
/** 破水只允许在已进入产兆前驱后作为转入正式产程的受控事件。 */
const RUPTURE_ALLOWED_PRELABOR_STAGES = Object.freeze(['产兆前驱']);
/**
 * 产兆前驱中破水所需的宫压门槛，读「高出基线多少」。
 *
 * 原先读的是绝对值（上限的 66%，逾期是 99）。压力改成基线＋波动之后那条线
 * 再也够不着：真前驱期间压力稳定在基线 +26 到 +58 之间，绝对值只有六十几，
 * 于是破水永远被拒。改成读高出基线多少，门槛落在真前驱后半段能到的量级——
 * 越接近正式产程越可能破，这也正是「越接近越可能」该有的形状。
 */
const RUPTURE_PRESSURE_OVER_BASELINE = 40;

/**
 * 破水。
 *
 * 设定上产程前 amnionDurability 恒 ≥ 1（任何磨损只让羊膜变薄），
 * 所以模型经常写出系统层面不可能发生的破水叙事，两边就此脱节。
 * 这里给出唯一一条受控入口：条件足够才破，并直接推进第一产程；
 * 条件不足则明确拒绝，让模型知道该改写叙事而不是继续假设已破水。
 */
function applyRuptureMembranes(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) {
    return { applied: false, message: `bsRuptureMembranes skipped: unknown character ${female || '(empty)'}.` };
  }

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const notify = profile.notify || {};
  const stage = String(base.stage || '');
  const inPrelabor = RUPTURE_ALLOWED_PRELABOR_STAGES.includes(stage);
  const inLabor = ['第一产程', '第二产程'].includes(stage);

  if (!inPrelabor && !inLabor) {
    return {
      applied: false,
      message: `bsRuptureMembranes skipped for ${female}: stage ${stage || '(none)'} cannot rupture; do not narrate rupture yet.`,
    };
  }

  if (clampNumber(pregnant.amnionDurability, -100, 100, 0) <= 0) {
    return { applied: false, message: `bsRuptureMembranes skipped for ${female}: already ruptured.` };
  }

  if (inPrelabor && getUterinePressureOverBaseline(profile) < RUPTURE_PRESSURE_OVER_BASELINE) {
    return {
      applied: false,
      message: `bsRuptureMembranes skipped for ${female}: uterine pressure too low to rupture; do not narrate rupture yet.`,
    };
  }

  pregnant.amnionDurability = 0;
  profile.pregnant = pregnant;

  if (inPrelabor) {
    base.stage = '第一产程';
    base.days = 0;
    beginLaborPhase(pregnant, '潜伏期', 0);
    updateLaborPain(profile, '第一产程', '潜伏期', 0);
    clearProdromalState(pregnant);
    profile.notify = {
      ...notify,
      firstly: `${female}进入了第一产程`,
      secondly: `${female}破水了，分娩正式开始`,
    };
  } else {
    profile.notify = { ...notify, secondly: `${female}破水了` };
  }

  profile.base = base;
  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsRuptureMembranes applied to ${female}.` };
}

function applyChildbirth(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) {
    return { applied: false, message: `bsChildbirth skipped: unknown character ${female || '(empty)'}.` };
  }

  const next = cloneValue(character);
  const profile = next.profile || {};
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  if (fetuses.length === 0) {
    return { applied: false, message: `bsChildbirth skipped for ${female}: no fetuses.` };
  }
  const childbirthStage = String(profile?.base?.stage || '');
  const childbirthAllowedStages = ['孕早期', '孕中期', '孕晚期', '临产期', '逾期', '产兆前驱', '第一产程', '第二产程', '第三产程'];
  if (!childbirthAllowedStages.includes(childbirthStage)) {
    return { applied: false, message: `bsChildbirth skipped for ${female}: stage ${childbirthStage || '(none)'} 不允许手术分娩（需已着床进入妊娠阶段）。` };
  }

  profile.__runtimeRef = next.runtime || {};
  applyChildbirthInternal(profile, female, false);
  delete profile.__runtimeRef;
  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  transferProviderChildren(chatState);
  return { applied: true, message: `bsChildbirth applied to ${female}.` };
}

function applyLaborResistance(profile, female) {
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const notify = profile.notify || {};
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  if (String(base.stage || '') !== '产兆前驱') {
    profile.notify = {
      ...notify,
      thirdly: `${female}不在产兆前驱阶段，无法执行抵抗判定`,
    };
    return { applied: false, message: `bsMaternalFetalInteraction skipped for ${female}: not in prodromal stage.` };
  }
  const realisticLabor = Boolean(profile?.immune?.realisticLabor);
  const vitality = clampNumber(base.vitality, 0, 9999, 100);
  const uterinePressure = clampNumber(base.uterinePressure, 0, 9999, 0);
  const fetalEnergyDrain = clampNumber(pregnant.fetalEnergyDrain, 0, 9999, 0);
  const birthDifficulty = clampNumber(profile?.bio?.birthDifficulty, 0.1, 100, 1);
  const breedTolerance = clampNumber(profile?.bio?.breedTolerance, 0.1, 100, 1);
  const judgeCount = Math.max(1, Math.round(fetalEnergyDrain + birthDifficulty - breedTolerance));
  let successCount = 0;
  let failureCount = 0;

  // 抵抗判定(TASK-11 重设计):体力按比率进概率,不再和宫压直接对撞——
  // 满体力＋高压 → 大概率扛住;耗竭 → 几乎必败。每轮仍有胎位漂移与羊膜磨损。
  const vitalityCapJudge = getVitalityInitByLevel(base.vitalityLevel);
  const vitalityRatio = clampNumber(vitality, 0, vitalityCapJudge, vitalityCapJudge) / Math.max(1, vitalityCapJudge);
  const pressureCap = getUterinePressureCap(profile);
  const pressureRatio = pressureCap > 0 ? Math.max(0, Math.min(1, uterinePressure / pressureCap)) : 0;
  const resistSuccessChance = Math.max(0.05, Math.min(0.95, 0.25 + 0.45 * vitalityRatio + 0.30 * pressureRatio));
  for (let round = 0; round < judgeCount; round += 1) {
    const passed = Math.random() < resistSuccessChance;
    if (passed) successCount += 1;
    else failureCount += 1;

    if (fetuses.length > 0) {
      // 单胎时 randomInt(0,0) 在 Math.random()=1 的注入下会返回 1 而不是 0
      //（Math.floor(1*(0-0+1))=1，独取上界），取模钳回来，别让数组越界。
      const randomFetusIndex = randomInt(0, fetuses.length - 1) % fetuses.length;
      const fetus = fetuses[randomFetusIndex];
      const currentAngle = Number.isFinite(Number(fetus?.tendencyAngle))
        ? Number(fetus.tendencyAngle)
        : randomInt(0, 360);
      fetus.tendencyAngle = wrapAngle(currentAngle + randomInt(-90, 90));
    }

    if (clampNumber(pregnant.amnionDurability, 0, 100, 100) > 0) {
      const drain = Math.max(1, fetalEnergyDrain || 1);
      pregnant.amnionDurability = Math.max(1, clampNumber(pregnant.amnionDurability, 0, 100, 100) - drain);
    }
  }

  const initialHours = getProdromalInitialHours(profile);
  const rawDeltaHours = (successCount * 6) - (failureCount * 12);
  let deltaHours = Math.max(rawDeltaHours, -(initialHours * 0.75));

  // 真实产程：分娩只能延后、不能取消。累计延后上限为初始时长的 100%，
  // 到顶后再怎么抵抗成功也不会继续往后推，也不会退回妊娠阶段。
  const currentProgress = Math.max(0, clampNumber(pregnant.prodromalDelayProgressHours, 0, 9999, 0));
  const delayCapped = realisticLabor && deltaHours > 0;
  if (delayCapped) {
    const delayCap = initialHours * REALISTIC_PRODROMAL_DELAY_CAP_RATIO;
    deltaHours = Math.max(0, Math.min(deltaHours, delayCap - currentProgress));
  }
  const atDelayCap = delayCapped && deltaHours <= 0;

  const remainingHours = clampNumber(pregnant.prodromalRemainingHours, 0, 9999, initialHours) + deltaHours;
  const progressHours = Math.max(0, currentProgress + deltaHours);
  pregnant.prodromalRemainingHours = Math.max(0, remainingHours);
  pregnant.prodromalDelayProgressHours = progressHours;
  updateLaborPain(profile, '产兆前驱', null, 1 - (Math.max(0, remainingHours) / initialHours));
  pregnant.fetuses = fetuses;
  profile.pregnant = pregnant;
  if (remainingHours <= 0) {
    base.stage = '第一产程';
    base.days = 0;
    beginLaborPhase(pregnant, '潜伏期', 0);
    updateLaborPain(profile, '第一产程', '潜伏期', 0);
    clearProdromalState(pregnant);
    profile.notify = {
      ...notify,
      firstly: `${female}进入了第一产程`,
      secondly: `${female}的产兆前驱时间耗尽，进入分娩`,
      thirdly: `${female}的抵抗判定为${successCount}次成功、${failureCount}次失败，未能继续延后分娩`,
    };
    return { applied: true, message: `bsMaternalFetalInteraction applied to ${female}: prodromal duration exhausted.` };
  }

  // 真实产程下分娩不可取消：即使抵抗再成功，也不会退回妊娠阶段
  if (progressHours >= initialHours && !realisticLabor) {
    const target = derivePregnancyStageState(clampNumber(pregnant.effectivePregnantDays, 0, 9999, 0), 1);
    const reducedPressure = Math.floor(uterinePressure * 0.25);
    base.stage = target.stage;
    base.days = target.days;
    base.uterinePressure = reducedPressure;
    pregnant.laborPhase = null;
    pregnant.laborFetusIndex = 0;
    pregnant.laborHours = 0;
    pregnant.effectiveLaborHours = 0;
    pregnant.laborPain = 0;
    clearProdromalState(pregnant);
    profile.notify = {
      ...notify,
      firstly: `${female}进入了${target.stage}`,
      secondly: `${female}的分娩前兆缓解，回到${target.stage}`,
      thirdly: `${female}的抵抗判定为${successCount}次成功、${failureCount}次失败，成功延缓分娩`,
    };
    return { applied: true, message: `bsMaternalFetalInteraction applied to ${female}: labor resisted.` };
  }

  profile.notify = {
    ...notify,
    thirdly: atDelayCap
      ? `${female}的抵抗判定为${successCount}次成功、${failureCount}次失败，但分娩已无法再延后，剩余约${Math.ceil(remainingHours)}小时`
      : `${female}的抵抗判定为${successCount}次成功、${failureCount}次失败，产兆前驱时间变动${deltaHours >= 0 ? '+' : ''}${deltaHours.toFixed(1)}小时，剩余约${Math.ceil(remainingHours)}小时`,
  };
  return { applied: true, message: `bsMaternalFetalInteraction applied to ${female}: prodromal duration adjusted.` };
}

function applyMaternalFetalInteraction(chatState, args) {
  const female = String(args?.female || '').trim();
  const direction = String(args?.direction || 'fetal').trim();
  const change = String(args?.change || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) {
    return { applied: false, message: `bsMaternalFetalInteraction skipped: unknown character ${female || '(empty)'}.` };
  }

  const changeMap = Object.freeze({
    slight_increase: 0.5,
    significant_increase: 1,
    slight_decrease: -0.5,
    significant_decrease: -1,
  });
  const changeDisplayMap = Object.freeze({
    slight_increase: '轻微增加',
    significant_increase: '显著增加',
    slight_decrease: '轻微减少',
    significant_decrease: '显著减少',
  });
  const maternalNutritionGainMap = Object.freeze({
    slight_increase: 1,
    significant_increase: 2,
    slight_decrease: 1,
    significant_decrease: 2,
  });
  const next = cloneValue(character);
  const profile = next.profile || {};
  const stage = String(profile?.base?.stage || '');
  const interactionCooldown = profile.cooldown || {};
  if (interactionCooldown.maternalFetalInteractionUsed) {
    return { applied: false, message: `bsMaternalFetalInteraction skipped for ${female}: already changed during this story hour.` };
  }
  if (direction === 'maternal' && stage === '产兆前驱') {
    const result = applyLaborResistance(profile, female);
    if (result.applied) {
      profile.cooldown = {
        ...(profile.cooldown || {}),
        maternalFetalInteractionUsed: true,
      };
    }
    next.profile = profile;
    chatState.characters[female] = syncCharacterStageFromProfile(next);
    return result;
  }

  const pregnant = profile.pregnant || {};
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  if (fetuses.length === 0) {
    return { applied: false, message: `bsMaternalFetalInteraction skipped for ${female}: no fetuses.` };
  }

  const cooldown = profile.cooldown || {};
  if (direction === 'maternal') {
    const selectedIndex = randomInt(0, fetuses.length - 1);
    const selectedFetus = fetuses[selectedIndex];
    const maternalChangeKeys = Object.keys(changeMap);
    const maternalChange = maternalChangeKeys[randomInt(0, maternalChangeKeys.length - 1)];
    const maternalChangeValue = changeMap[maternalChange];
    const maternalChangeDisplay = changeDisplayMap[maternalChange];
    let nutritionMessage = '';

    const psyStress = clampNumber(profile?.base?.psyStress, 0, 9999, 0);
    const success = Math.random() >= Math.min(1, psyStress / 200);
    if (success) {
      const currentAffinity = clampNumber(selectedFetus?.affinity, -50, 50, 0);
      selectedFetus.affinity = clampNumber(currentAffinity + maternalChangeValue, -50, 50, 0);
      const symptomReliefPending = clampNumber(pregnant.symptomReliefPending, 0, 999, 0);
      if (symptomReliefPending > 0) {
        const nutritionGain = maternalNutritionGainMap[maternalChange];
        pregnant.nutrition = (Number(pregnant.nutrition) || 0) + nutritionGain;
        pregnant.symptomReliefPending = symptomReliefPending - 1;
        nutritionMessage = pregnant.symptomReliefPending > 0
          ? `，身体补回了${nutritionGain}点供养力（仍有${pregnant.symptomReliefPending}次不适待安抚）`
          : `，身体补回了${nutritionGain}点供养力`;
      }
    } else {
      const currentAngle = Number.isFinite(Number(selectedFetus?.tendencyAngle))
        ? Number(selectedFetus.tendencyAngle)
        : randomInt(0, 360);
      selectedFetus.tendencyAngle = wrapAngle(currentAngle + randomInt(-10, 10));
    }
    pregnant.fetuses = fetuses;
    pregnant.fetusesCount = fetuses.length;
    profile.cooldown = {
      ...cooldown,
      maternalFetalInteractionUsed: true,
    };
    profile.pregnant = pregnant;
    profile.notify = {
      ...(profile.notify || {}),
      secondly: success
        ? `${female}安抚了第${selectedIndex + 1}胎，亲密度${maternalChangeDisplay}了${nutritionMessage}`
        : `${female}尝试安抚第${selectedIndex + 1}胎，但因心理压力过大而失败，胎位角度发生了微小转动${nutritionMessage}`,
    };
    next.profile = profile;
    chatState.characters[female] = next;
    return { applied: true, message: `bsMaternalFetalInteraction applied to ${female}: maternal interaction.` };
  }

  const changeValue = changeMap[change];
  if (changeValue === undefined) {
    return { applied: false, message: `bsMaternalFetalInteraction skipped for ${female}: direction=fetal requires a valid change.` };
  }
  const selectedIndex = randomInt(0, fetuses.length - 1);
  const selectedFetus = fetuses[selectedIndex];
  const currentAffinity = clampNumber(selectedFetus?.affinity, -50, 50, 0);
  selectedFetus.affinity = clampNumber(currentAffinity + changeValue, -50, 50, 0);

  pregnant.fetuses = fetuses;
  pregnant.fetusesCount = fetuses.length;
  profile.pregnant = pregnant;
  profile.cooldown = {
    ...cooldown,
    maternalFetalInteractionUsed: true,
  };

  const notify = profile.notify || {};
  const changeDisplay = changeDisplayMap[change];
  const targetName = `第${selectedIndex + 1}胎`;
  notify.secondly = `${targetName}对${female}的亲密度${changeDisplay}了`;
  profile.notify = notify;

  next.profile = profile;
  chatState.characters[female] = next;
  return { applied: true, message: `bsMaternalFetalInteraction applied to ${female}.` };
}

function applyEggGain(profile, amount) {
  const nextAmount = Math.max(0, Number(amount) || 0);
  if (nextAmount <= 0) return { applied: false, usedCooldown: false };

  const base = profile.base || {};
  const cooldown = profile.cooldown || {};
  const stage = String(base.stage || '');

  if (stage === '假孕期') {
    return { applied: false, usedCooldown: false };
  }

  if (stage === '排卵期') {
    base.eggs = clampNumber(base.eggs, 0, 999, 0) + nextAmount;
    base.uterinePressure = clampNumber(base.uterinePressure, 0, 999, 0) + 2;
    return { applied: true, usedCooldown: false };
  }

  if (cooldown.orgasmOvulationUsed) {
    return { applied: false, usedCooldown: true };
  }

  base.eggs = clampNumber(base.eggs, 0, 999, 0) + nextAmount;
  base.uterinePressure = clampNumber(base.uterinePressure, 0, 999, 0) + 2;
  return { applied: true, usedCooldown: true };
}

// 高潮诱发排卵。**挂在真高潮上，按档掷概率**（中档极小、大档较大、小档不给）。
//
// 原来这里是 maybeTriggerOrgasmOvulation：判据是「metabolism.libido 顶到天花板」、
// 触发后把值归零。两条都跟现行口径对台——
//   §十三 明确否决「A 顶到头等于高潮」；归零跟「落回起点不落回 0」冲突。
// 现在去不去由闸决定，值落到哪由 fireLibidoOrgasm 按档处理，这里只管排不排卵。
//
// 排多少颗仍归种族的 bio.orgasmOvulationAmount；那个值为 0 的种族连骰都不掷。
function maybeTriggerOrgasmOvulation(profile, tier, female) {
  const chance = LIBIDO_ORGASM_OVULATION_CHANCE[tier] || 0;
  if (chance <= 0) return false;
  const bio = profile.bio || {};
  const amount = Math.max(0, clampNumber(bio.orgasmOvulationAmount, 0, 100, 1));
  if (amount <= 0) return false;
  if (profile.cooldown?.orgasmOvulationUsed) return false;
  if (Math.random() >= chance) return false;

  const eggResult = applyEggGain(profile, amount);
  if (!eggResult.applied) return false;
  profile.cooldown = {
    ...(profile.cooldown || {}),
    orgasmOvulationUsed: eggResult.usedCooldown ? true : Boolean(profile.cooldown?.orgasmOvulationUsed),
  };
  profile.notify = {
    ...(profile.notify || {}),
    secondly: `${female}因高潮而额外排卵`,
  };
  return true;
}

function getMenstrualCycleLength(profile) {
  const total = MENSTRUAL_STAGES.reduce((sum, stage) => sum + (getStageLimit(profile, stage) || 0), 0);
  return Math.max(1, total || 28);
}

function buildTimeTick(character, addedMinutes) {
  const runtime = character?.runtime || {};
  const dayCarryMinutes = clampNumber(runtime.dayCarryMinutes, 0, 24 * 60, 0);
  const hourCarryMinutes = clampNumber(runtime.hourCarryMinutes, 0, 60, 0);
  const lifestyleWeekCarryMinutes = clampNumber(runtime.lifestyleWeekCarryMinutes, 0, 7 * 24 * 60, 0);
  const totalDayMinutes = dayCarryMinutes + addedMinutes;
  const totalHourMinutes = hourCarryMinutes + addedMinutes;
  const totalLifestyleWeekMinutes = lifestyleWeekCarryMinutes + addedMinutes;
  return {
    deltaMinutes: addedMinutes,
    deltaDays: addedMinutes / (24 * 60),
    passedDays: Math.floor(totalDayMinutes / (24 * 60)),
    passedHours: Math.floor(totalHourMinutes / 60),
    passedLifestyleWeeks: Math.floor(totalLifestyleWeekMinutes / (7 * 24 * 60)),
    nextRuntime: {
      dayCarryMinutes: totalDayMinutes % (24 * 60),
      hourCarryMinutes: totalHourMinutes % 60,
      lifestyleWeekCarryMinutes: totalLifestyleWeekMinutes % (7 * 24 * 60),
    },
  };
}

function appendNotifyReminder(notify, message) {
  const current = String(notify?.thirdly || '').trim();
  notify.thirdly = current ? `${current}；${message}` : message;
}

function getMenstrualStageFluctuation(profile, stage) {
  if (!MENSTRUAL_STAGE_DAYS[stage]) return 0;

  const base = profile?.base || {};
  const vitalityLevel = clampNumber(base.vitalityLevel, 1, 7, 4);
  const psyStressLevel = clampNumber(base.psyStressLevel, 1, 7, 4);

  let maxFluctuationRatio = 0;
  if (vitalityLevel === 2) maxFluctuationRatio += 0.08;
  if (vitalityLevel === 1) maxFluctuationRatio += 0.15;
  if (psyStressLevel === 6) maxFluctuationRatio += 0.08;
  if (psyStressLevel === 7) maxFluctuationRatio += 0.15;
  if (maxFluctuationRatio <= 0) return 0;

  const seedText = `${stage}:${vitalityLevel}:${psyStressLevel}`;
  let seed = 0;
  for (const char of seedText) seed += char.charCodeAt(0);
  const normalized = ((seed % 1001) / 1000) * 2 - 1;
  return normalized * maxFluctuationRatio;
}

function getStageLimit(profile, stage) {
  if (MENSTRUAL_STAGE_DAYS[stage]) {
    const ratio = clampNumber(profile?.bio?.menstrualLengthRatio, 0.1, 20, 1);
    const fluctuation = getMenstrualStageFluctuation(profile, stage);
    return Math.max(1, MENSTRUAL_STAGE_DAYS[stage] * ratio * (1 + fluctuation));
  }
  if (stage === '产后恢复') return Math.max(1, clampNumber(profile?.bio?.recoveryDays, 1, 9999, 56));
  return null;
}

function advanceMenstrualStage(profile, stage, daysValue) {
  let nextStage = stage;
  let nextDays = daysValue;
  let changed = false;
  let enteredFollicular = false;
  while (MENSTRUAL_STAGES.includes(nextStage)) {
    const limit = getStageLimit(profile, nextStage);
    if (limit === null || nextDays <= limit) break;
    nextDays -= limit;
    const stageIndex = MENSTRUAL_STAGES.indexOf(nextStage);
    nextStage = MENSTRUAL_STAGES[(stageIndex + 1) % MENSTRUAL_STAGES.length];
    if (nextStage === '卵泡期') enteredFollicular = true;
    changed = true;
  }
  return {
    stage: nextStage,
    days: Math.max(0, nextDays),
    changed,
    enteredFollicular,
  };
}

function shouldEnterPseudoPregnancy(profile, previousStage, nextStage) {
  if (previousStage === '月经期' || nextStage !== '月经期') return false;
  const base = profile?.base || {};
  const experience = profile?.experience || {};
  const psyStress = clampNumber(base.psyStress, 0, 9999, 0);
  const latestSexPartner = String(experience.latestSexPartner || '').trim();
  // 性欲门槛读「高出基线多少」，不读绝对值（同宫压）：基线本身会动
  // （起点就是底噪，涨落都朝它走），拿 50 这个绝对数当地板，
  // 孕吐谷底那样起点被压低的周期里门等于永远开着。有效门槛仍是原值
  // 换算过来那一档：50 − 基线 18 = 32。
  const libidoBaseline = getLibidoLinesOf(profile).floor;
  const libidoOverBaseline = Math.max(0, clampNumber(profile?.metabolism?.libido, 0, 9999, 0) - libidoBaseline);
  return psyStress >= 100 && libidoOverBaseline >= 32 && latestSexPartner.length > 0;
}

function applyTimeToCharacter(character, tick) {
  const next = cloneValue(character);
  snapshotOriginalPregnancyBio(next);
  const profile = next.profile || {};
  profile.__runtimeRef = next.runtime || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const bio = profile.bio || {};
  const notify = {
    firstly: '',
    secondly: '',
    thirdly: '',
  };
  profile.notify = notify;
  const cooldown = profile.cooldown || {};
  const deltaDays = tick.deltaDays;
  const isHere = base.isHere !== false;

  let stage = String(base.stage || '');
  let days = clampNumber(base.days, 0, 9999, 0);
  let stageChanged = false;
  let enteredFollicular = false;
  const oldStage = stage;

  if (deltaDays <= 0) return { character: next, stageChanged: false, oldStage, newStage: stage };

  processSimpleConception(profile, tick, notify, next.name);
  stage = String(base.stage || stage);
  if (Array.isArray(pregnant.fetuses) && pregnant.fetuses.length > 0 && isPregnancyStage(stage)) {
    applyPregnancyPhysiology(profile, next.runtime || {});
  }

  if (MENSTRUAL_STAGES.includes(stage)) {
    const currentStageDay = Math.max(0, Number(days) || 0);
    const advanced = advanceMenstrualStage(profile, stage, currentStageDay + deltaDays);
    stage = advanced.stage;
    days = advanced.days;
    stageChanged = advanced.changed;
    enteredFollicular = advanced.enteredFollicular;
    if (stageChanged && shouldEnterPseudoPregnancy(profile, oldStage, stage)) {
      stage = '假孕期';
      days = 0;
      pregnant.pregnantDays = 0;
      pregnant.effectivePregnantDays = 0;
      notify.secondly = `${next.name}因进入月经期时心理压力偏高、性欲偏高且近期有性接触记录，出现了假孕症状`;
    }
  } else if (PREGNANCY_STAGES.includes(stage)) {
    const oldPregnantDays = clampNumber(pregnant.pregnantDays, 0, 9999, 0);
    pregnant.pregnantDays = oldPregnantDays + deltaDays;
    pregnant.effectivePregnantDays = clampNumber(pregnant.effectivePregnantDays, 0, 9999, 0) + (deltaDays * clampNumber(getGestationEffectiveSpeed({ ...profile, bio }), 0, 20, 1));
    const oldWeek = Math.floor(oldPregnantDays / 7);
    const newWeek = Math.floor(pregnant.pregnantDays / 7);
    if (newWeek > oldWeek && isHere) {
      applyWeeklyNutrition(profile);
    }
    updateDerivedTypeProgress(profile, tick);
    const derived = derivePregnancyStageState(pregnant.effectivePregnantDays, 1);
    stage = derived.stage;
    days = derived.days;
    stageChanged = stage !== oldStage;
    base.stage = stage;
    base.days = days;
    updateFetalPositions(profile, tick, next.name);
    // 下降单独走：它是连续过程，推小时也要动，而 updateFetalPositions 是逐日的。
    updateFetalDescent(profile, tick, next.name);
    // 发作的推进与散掉，然后判这一段要不要来一次新的。
    // 都在压力回落之前：发作期间它抬着地板。
    if (isHere) {
      updateProdromalEpisode(profile, tick, next.name);
      maybeStartProdromalEpisode(profile, tick, next.name);
    }
    // 要在 maybeStartLabor 之前更新：入盆时长是它的乘区之一。
    updateFetalEngagementDays(profile, tick);
    if (isHere) {
      applyOverduePressure(profile, tick, next.name);
      applyHourlyPregnancyMetabolism(profile, tick, next.name);
      // 回落要在判档与分娩掷骰之前：那两者读的都是「高出基线多少」。
      applyUterinePressureDecay(profile, tick);
    }
    const pressureCrisis = isHere ? applyPressureCrisis(profile, next.runtime || {}, next.name) : { changed: false, warned: false };
    if (pressureCrisis.changed) {
      stage = String(base.stage || stage);
      days = clampNumber(base.days, 0, 9999, 0);
      stageChanged = true;
    }
    // 不再被 pressureCrisis.warned 挡着。那道门原本的意思是「这一轮已经出过声，
    // 别同一轮又翻阶段」；但压力警告现在是常态出声（发紧、成串都会报），
    // 而前驱发作本身就抬高压力——于是发作会把分娩掷骰堵死，越接近越不会生。
    if (isHere && maybeStartLabor(profile, tick, next.name)) {
      stage = String(base.stage || stage);
      days = clampNumber(base.days, 0, 9999, 0);
      stageChanged = true;
    }
  } else if (stage === '产后恢复') {
    days += deltaDays;
    const recoveryDays = getStageLimit(profile, '产后恢复');
    if (days > recoveryDays) {
      stage = '卵泡期';
      days = 0;
      stageChanged = true;
      enteredFollicular = true;
      pregnant.pregnantDays = 0;
      pregnant.effectivePregnantDays = 0;
      pregnant.laborHours = 0;
      pregnant.effectiveLaborHours = 0;
      pregnant.laborPhase = null;
      pregnant.laborFetusIndex = 0;
      pregnant.laborPain = 0;
      clearProdromalState(pregnant);
      pregnant.fetuses = [];
      pregnant.fetusesCount = 0;
      pregnant.fetalEnergyDrain = 0;
      base.fertilizationDays = 0;
    }
  } else if (stage === '假孕期') {
    pregnant.pregnantDays = clampNumber(pregnant.pregnantDays, 0, 9999, 0) + deltaDays;
    const pseudoLimit = Math.max(1, 84 * clampNumber(getGestationEffectiveSpeed({ ...profile, bio }), 0.1, 20, 1));
    if (pregnant.pregnantDays > pseudoLimit) {
      stage = '月经期';
      days = 0;
      stageChanged = true;
      pregnant.pregnantDays = 0;
      pregnant.effectivePregnantDays = 0;
    }
  } else if (stage === '产兆前驱') {
    const oldPregnantDays = clampNumber(pregnant.pregnantDays, 0, 9999, 0);
    pregnant.pregnantDays = oldPregnantDays + deltaDays;
    pregnant.effectivePregnantDays = clampNumber(pregnant.effectivePregnantDays, 0, 9999, 0) + (deltaDays * clampNumber(getGestationEffectiveSpeed({ ...profile, bio }), 0, 20, 1));
    const oldWeek = Math.floor(oldPregnantDays / 7);
    const newWeek = Math.floor(pregnant.pregnantDays / 7);
    if (newWeek > oldWeek && isHere) {
      applyWeeklyNutrition(profile);
    }
    if (isHere) applyHourlyPregnancyMetabolism(profile, tick, next.name);
    updateDerivedTypeProgress(profile, tick);
    const laborChanged = processLabor(profile, tick, next.name);
    stage = String(base.stage || stage);
    days = clampNumber(base.days, 0, 9999, 0);
    stageChanged = stageChanged || laborChanged || stage !== oldStage;
  } else if (LABOR_STAGES.includes(stage)) {
    if (isHere) applyHourlyPregnancyMetabolism(profile, tick, next.name);
    updateDerivedTypeProgress(profile, tick);
    const laborChanged = processLabor(profile, tick, next.name);
    stage = String(base.stage || stage);
    days = clampNumber(base.days, 0, 9999, 0);
    stageChanged = stageChanged || laborChanged || stage !== oldStage;
  } else if (stage === '无经期' || stage === '未激活') {
    days += deltaDays;
    } else {
      days += deltaDays;
    }

  processSpermLifecycle(profile, stage, tick);

  if (base.latestSexDays !== null && base.latestSexDays !== undefined && Number(base.latestSexDays) >= 0) {
    base.latestSexDays = clampNumber(base.latestSexDays, -1, 9999, 0) + tick.passedDays;
    if (base.latestSexDays >= getMenstrualCycleLength(profile)) {
      base.latestSexDays = -1;
      profile.experience = {
        ...(profile.experience || {}),
        latestSexPartner: null,
      };
    }
  }

  if (isHere) applyPassiveMetabolism(profile, tick);
  // 尿意自然产量统一入口（非孕+孕期都走）：每阶段固定产量 × 多胎 × 出汗折扣，
  // 第二产程在这里锁值。放在自然恢复之前——离场结算的压残值语义在它后面。
  applyUrineProduction(profile, tick);
  applyRoutineUrineVoid(profile);
  // 性欲读 deltaMinutes 而不是 passedHours：后者是整数小时，一场戏推 5~15 分钟时
  // 经常是 0，表现出来不是滑落而是「连着几轮不动，然后一次掉一大块」。
  // 这里传 0 刺激分钟 —— 时间推进本身不是刺激，只让 A 朝起点落、不应期走完。
  advanceLibido(profile, 0, 0, tick.deltaMinutes);
  // 镇痛窗口与不应期同一拍倒数：不用等下一次工具调用，bsPassedTime 自己会烧它。
  tickLibidoAnalgesia(profile, tick.deltaMinutes);
  applyNaturalMetabolismRecovery(profile, tick);
  applyWeeklyMetabolismRoutine(profile, tick, { enteredFollicular, stage });
  // 体力逐轮结算：底噪＋产程速率都是时间的函数，跟代谢同一时机吃 tick。
  applyVitalityTick(profile, tick);

  base.age = clampNumber(base.age, 0, 99999, 15) + (deltaDays / 365);
  if (Array.isArray(profile.children) && profile.children.length > 0) {
    profile.children = profile.children.map((child) => ({
      ...child,
      age: child?.age === null || child?.age === undefined ? child?.age : clampNumber(child.age, 0, 99999, 0) + (deltaDays / 365),
    }));
  }

  if (Array.isArray(pregnant.fetuses) && pregnant.fetuses.length > 0 && clampNumber(pregnant.effectivePregnantDays, 0, 9999, 0) > 0 && !isPregnancyStage(stage)) {
    const derived = derivePregnancyStageState(pregnant.effectivePregnantDays, 1);
    stage = derived.stage;
    days = derived.days;
    stageChanged = stage !== oldStage;
  }

  if ((!Array.isArray(pregnant.fetuses) || pregnant.fetuses.length === 0) && !isPregnancyStage(stage)) {
    restorePregnancyPhysiology(profile, next.runtime || {});
  }

  clearPsychologyTransitionState(profile, stage, days);

  profile.base = {
    ...base,
    stage,
    days,
  };
  applyMetabolismCapacityLimits(profile);
  refreshOutfitPregFit(profile);
  profile.pregnant = {
    ...pregnant,
    fetusesCount: Array.isArray(pregnant.fetuses) ? pregnant.fetuses.length : clampNumber(pregnant.fetusesCount, 0, 99, 0),
  };
  const currentNotify = profile.notify || notify;
  profile.notify = {
    ...currentNotify,
    firstly: stageChanged ? `${next.name}进入了${stage}` : currentNotify.firstly || '',
  };
  // 摊开的必须是 profile.cooldown 而不是函数开头抓的 cooldown 快照：
  // 本轮的代谢结算（漏尿、失禁的出声冷却）就写在 profile.cooldown 上，
  // 用旧快照会把它们整批盖回去——下面几项各自 `(profile.cooldown || cooldown)`
  // 就是在逐个绕这个坑，漏一项就是一个静默回退。
  profile.cooldown = {
    ...cooldown,
    ...(profile.cooldown || {}),
    orgasmOvulationUsed: shouldResetOrgasmOvulation(stage) ? false : Boolean(cooldown.orgasmOvulationUsed),
    naturalOvulationUsed: shouldResetNaturalOvulation(stage) ? false : Boolean((profile.cooldown || cooldown).naturalOvulationUsed),
    pregnancyPressureWarning: shouldKeepPregnancyPressureWarning(profile) ? Boolean((profile.cooldown || cooldown).pregnancyPressureWarning) : false,
    psychologyUpdateUsed: tick.passedHours > 0 ? false : Boolean(cooldown.psychologyUpdateUsed),
    maternalFetalInteractionUsed: tick.passedHours > 0 ? false : Boolean(cooldown.maternalFetalInteractionUsed),
  };
  updateAdvisoryNotify(profile, next.name);
  if (tick.passedDays > 0) {
    appendNotifyReminder(profile.notify || notify, '已跨入新的一天；若角色有值得沉淀的经历、心境、关系或身体变化，可调用 bsWriteDiary 写入主观日记');
  }
  delete profile.__runtimeRef;
  next.profile = profile;
  next.runtime = {
    ...(next.runtime || {}),
    ...tick.nextRuntime,
  };
  return {
    character: syncCharacterStageFromProfile(next),
    stageChanged,
    oldStage,
    newStage: stage,
  };
}

function applyWriteDiary(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsWriteDiary skipped: unknown character ${female || '(empty)'}.` };

  const time = String(args?.time || '').trim();
  const content = String(args?.content || '').trim();
  if (!time) return { applied: false, message: `bsWriteDiary skipped for ${female}: empty time.` };
  if (!content) return { applied: false, message: `bsWriteDiary skipped for ${female}: empty content.` };

  const next = cloneValue(character);
  const profile = next.profile || {};
  profile.diary = Array.isArray(profile.diary) ? profile.diary : [];
  const currentStoryDayIndex = Math.floor(Math.max(0, Number(chatState?.minutesPassed) || 0) / 1440);
  const existsSameStoryDay = profile.diary.some((entry) => Number(entry?.storyDayIndex) === currentStoryDayIndex);
  if (existsSameStoryDay) {
    return { applied: false, message: `bsWriteDiary skipped for ${female}: story day ${currentStoryDayIndex + 1} is still on diary cooldown.` };
  }
  profile.diary.push({
    time,
    content,
    storyDayIndex: currentStoryDayIndex,
    createdAt: Date.now(),
  });
  next.profile = profile;
  chatState.characters[female] = next;
  return { applied: true, message: `bsWriteDiary applied to ${female}: ${time}.` };
}

function applyPassedTime(chatState, args) {
  const minute = clampNumber(args?.minute, 0, 60 * 24 * 365, 0);
  const hour = clampNumber(args?.hour, 0, 24 * 365, 0);
  const day = clampNumber(args?.day, 0, 36500, 0);
  const week = clampNumber(args?.week, 0, 5200, 0);
  const month = clampNumber(args?.month, 0, 1200, 0);
  const year = clampNumber(args?.year, 0, 200, 0);
  const totalMinutes = minute + (hour * 60) + (day * 24 * 60) + (week * 7 * 24 * 60) + (month * 30 * 24 * 60) + (year * 365 * 24 * 60);
  if (totalMinutes <= 0) return { applied: false, message: 'bsPassedTime skipped: no positive duration.' };

  for (const name of Object.keys(chatState.characters || {})) {
    const current = chatState.characters[name];
    if (!current || typeof current !== 'object') continue;
    const tick = buildTimeTick(current, totalMinutes);
    const result = applyTimeToCharacter(current, tick);
    chatState.characters[name] = result.character;
  }
  transferProviderChildren(chatState);
  const elapsedMinutes = Math.round(totalMinutes);
  const previousMinutes = Math.max(0, Number(chatState.minutesPassed) || 0);
  chatState.minutesPassed = previousMinutes + elapsedMinutes;
  // 记下这一轮实际推了多久，给性欲的刺激分钟当上限用：
  // 模型报的刺激分钟不能超过本轮真实时长，否则它能靠虚报分钟把档位刷上去。
  chatState.lastAdvanceMinutes = elapsedMinutes;
  return { applied: true, message: `bsPassedTime applied ${elapsedMinutes} minutes; accumulated ${chatState.minutesPassed} minutes.` };
}

function applyCharacterStatus(chatState, args) {
  const female = String(args?.female || '').trim();
  const options = args?.options && typeof args.options === 'object' ? args.options : {};
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsUpdateCharacterStatus skipped: unknown character ${female || '(empty)'}.` };

  const next = cloneValue(character);
  const base = next.profile?.base || {};
  const profile = next.profile || {};
  const vitalityCap = getVitalityInitByLevel(base.vitalityLevel);
  const stressCap = getPsyStressInitByLevel(base.psyStressLevel) * 2;
  const uterinePressureCap = getUterinePressureCap(profile);

  if (options.vitality !== undefined) {
    // 直改增量通道：只动值，不再联动代谢（旧联动 2026-09-03 删，TASK-05 拍板 #9）。
    // 正路是下面的 vitalityClass/vitalityMinutes 活动档——这个口留着给剧情直调
    // （工具调回复、剧本抢救），但它刷不出任何代谢副产品。
    base.vitality = clampNumber((base.vitality || 0) + Number(options.vitality || 0), 0, vitalityCap, base.vitality || 0);
  }
  if (options.psyStress !== undefined) base.psyStress = clampNumber((base.psyStress || 0) + Number(options.psyStress || 0), 0, stressCap, base.psyStress || 0);
  // 体力活动档：与性欲同一手法的接口——模型报「哪一档活动 + 几分钟」，
  // 倍率（经期／低体力／入盆）与晕倒授权全由引擎算，模型只判档。
  // 分钟同样拿本轮真实时长掐——虚报分钟不会刷出超额消耗以外的任何东西。
  if (options.vitalityClass !== undefined) {
    profile.base = base;
    const turnMinutes = clampNumber(chatState?.lastAdvanceMinutes, 0, 1440, 0);
    const asked = clampNumber(options.vitalityMinutes, 0, 1440, 0);
    const activityMinutes = turnMinutes > 0 ? Math.min(asked, turnMinutes) : asked;
    const activityResult = applyVitalityActivity(profile, Number(options.vitalityClass || 0), activityMinutes, female);
    // 晕倒出声走 notify（applyVitalityActivity 内部已写），消耗量不逐次打扰。
    if (activityResult?.fainted) {
      const notify = { ...(profile.notify || {}) };
      appendNotifyReminder(notify, `${female}体力见底晕了过去`);
      profile.notify = notify;
    }
  }
  // 快糖：剧情里喂糖水／巧克力／运动饮料时置 true——分娩剧本吊命的那口。
  // 当日递减（12/8/4）由引擎记着，上限用完会拒绝并写进 notify。
  if (options.vitalitySugar) {
    profile.base = base;
    const sugarResult = applyVitalitySugar(profile, female);
    if (sugarResult?.message) {
      profile.notify = { ...(profile.notify || {}), secondly: sugarResult.message };
    }
  }
  // 首选接口：模型报「哪一档刺激 + 几分钟」，其余全由引擎算
  //（去没去、哪一档、还差多少，一概不问模型）。
  //
  // 刺激分钟 ≠ 本轮分钟：一轮可能覆盖半小时但只有五分钟在动手，所以要单独报。
  // 报多了就拿本轮实际时长掐掉——不掐的话模型能靠虚报分钟把档位刷上去。
  if (options.libidoClass !== undefined) {
    profile.base = base;
    const turnMinutes = clampNumber(chatState?.lastAdvanceMinutes, 0, 1440, 0);
    const asked = clampNumber(options.libidoMinutes, 0, 1440, 0);
    const stimulusMinutes = turnMinutes > 0 ? Math.min(asked, turnMinutes) : asked;
    const before = clampNumber(profile?.metabolism?.libido, 0, 9999, 0);
    const result = advanceLibido(profile, Number(options.libidoClass || 0), stimulusMinutes, Math.max(stimulusMinutes, turnMinutes));
    const gained = clampNumber(profile?.metabolism?.libido, 0, 9999, 0) - before;
    // 只认外部刺激那一笔折两成给乳意。身体自己攒的、朝起点掉的、习惯化，全都不折。
    // 晚孕环境类虽然按 stimulus 那一列加权，但它算「身体自己攒」——所以走路不会让她漏奶。
    if (gained > 0 && getLibidoClass(options.libidoClass).side === 'stimulus') {
      applyMilkFromLibido(profile, gained);
    }
    if (result?.tier) {
      const notify = { ...(profile.notify || {}) };
      appendNotifyReminder(notify, `${female}去了一次（${result.tier}）`);
      // 大档之后的提示：那几分钟是「受不了」不是「没反应」——
      // 刚去完大的，碰到的是过强的刺激，她缩、她躲、她求停。
      // 只提示一轮（结算那一次），不用每轮重复。
      if (result.tier === '大') {
        appendNotifyReminder(notify, `${female}刚去完大的一次，眼下碰到是受不了——她缩、躲、求停，不是没反应`);
      }
      profile.notify = notify;
      // 高潮诱发排卵挂在这儿：按档掷概率，小档不给。
      maybeTriggerOrgasmOvulation(profile, result.tier, female);
      // 大档高潮触发喷乳检定（TASK-06 拍板）：催产素峰值 → 喷乳反射。
      // 三层缺一不发生：泌乳在线 + 触发（大档高潮）+ 有货（满度高或堵着）。
      if (result.tier === '大') {
        maybeMilkSpray(profile, female, true);
      }
    }
  } else if (options.libido !== undefined) {
    // 兼容旧写法：直接给增量。走 addMetabolismValue 才能吃到分档权重表。
    const libidoDelta = Number(options.libido || 0);
    profile.base = base;
    addMetabolismValue(profile, 'libido', libidoDelta, 0, BASE_METABOLISM_CAP, 'stimulus');
    applyMilkFromLibido(profile, libidoDelta);
  }
  if (options.uterinePressure !== undefined) {
    base.uterinePressure = clampNumber((base.uterinePressure || 0) + Number(options.uterinePressure || 0), 0, uterinePressureCap, base.uterinePressure || 0);
    applyAmnionDurabilityFromPressure(profile, base.uterinePressure, female);
  }
  // 剧情刺激走 stimulus 侧的分档权重：越接近临界，同一个动作推得越多。
  // 模型只报量级，倍率与容量由引擎算——一张逐项加值表交给模型逐轮对照会飘。
  if (options.urine !== undefined) {
    profile.base = base;
    addMetabolismValue(profile, 'urine', Number(options.urine || 0), 0, BASE_METABOLISM_CAP, 'stimulus');
    applyUrineLeak(profile, female);
    refreshUrineLeakCooldown(profile);
  }
  if (options.stool !== undefined) {
    profile.base = base;
    addMetabolismValue(profile, 'stool', Number(options.stool || 0), 0, BASE_METABOLISM_CAP, 'stimulus');
    applyStoolDifficultyDrift(profile);
  }
  // 去不了厕所是一段状态，不是一次事件：置真之后一直算她在憋，直到剧情放她走。
  if (options.urineHolding !== undefined) {
    const urine = { ...(profile.urine || {}) };
    urine.holding = Boolean(options.urineHolding);
    profile.urine = urine;
  }
  // 把胎头往回顶。越深越推不动，过了深固定线完全无效——
  // 于是「拖延」有它的窗口，错过就错过了。
  if (options.fetalPushback !== undefined) {
    applyFetalPushback(profile, Number(options.fetalPushback || 0), female);
  }
  // 孕吐好转覆写口（拍板 #4）：正文写她孕吐开始消退时报一次。
  // 之后孕期全局倍率不再走 0.8 谷底曲线，直接回 1.0——
  // 「没有孕吐的人不吃这个亏」靠这一笔兑现，不是靠概率。
  if (options.morningSicknessResolved === true) {
    profile.pregnant = { ...(profile.pregnant || {}), morningSicknessResolved: true };
  }
  // 延产声明口（TASK-02 拍板）：正文明确延产外力（药/术式/体质）时报一次，
  // 逾期阶段数值切延产线；没报一律自然逾期。
  if (options.prolongedPregnancy === true) {
    profile.pregnant = { ...(profile.pregnant || {}), prolonged: true };
  }
  // 栏二感觉事件：临时压 urge 线，不加值。
  if (options.urineSense !== undefined) {
    applyUrineSenseEffect(profile, String(options.urineSense), options.urineSenseStrength ?? null);
  }
  // 出汗事件：只减尿意产量，效果两小时。
  if (options.sweating !== undefined) {
    const level = String(options.sweating);
    if (URINE_SWEAT_DISCOUNT[level]) {
      profile.urine = { ...(profile.urine || {}), sweat: { level, expiresAt: Date.now() + 2 * 3600 * 1000 } };
    }
  }
  // 应激事件口（TASK-02 拍板：新开不加值口子）：
  // 咳嗽/笑/喷嚏/用力/插入/高潮 → 查漏表掷漏，metabolism.urine 不经过加值链。
  if (options.urineStressEvent !== undefined) {
    resolveUrineStressEvent(profile, String(options.urineStressEvent), female);
  }
  applyDerivedMetabolismExemptions(profile);

  next.profile.base = base;
  chatState.characters[female] = next;
  return { applied: true, message: `bsUpdateCharacterStatus applied to ${female}.` };
}

const DESCRIPTION_FIELD_NAMES = ['normalDescription', 'pregnantDescription'];

function parseDescriptionText(text) {
  const rawText = String(text || '').trim();
  if (!rawText) return { entries: [], error: '' };

  const entries = [];
  const segments = rawText.split(';;').map((part) => part.trim()).filter(Boolean);
  for (const segment of segments) {
    const separatorIndex = segment.indexOf('|');
    if (separatorIndex <= 0) {
      return { entries: [], error: `invalid segment "${segment}"` };
    }
    const name = segment.slice(0, separatorIndex).trim();
    const value = segment.slice(separatorIndex + 1).trim();
    if (!name) return { entries: [], error: `invalid empty field name in "${segment}"` };
    entries.push({ name, value });
  }
  return { entries, error: '' };
}

function mergeDescriptionText(currentText, patchText) {
  const current = parseDescriptionText(currentText);
  if (current.error) return { ok: false, value: String(currentText || ''), error: `existing description is malformed: ${current.error}` };

  const patch = parseDescriptionText(patchText);
  if (patch.error) return { ok: false, value: String(currentText || ''), error: `patch description is malformed: ${patch.error}` };
  // 空补丁视为 no-op：模型常把「不改」表达成空字符串，清空整栏会造成静默数据丢失。
  if (patch.entries.length === 0) return { ok: true, value: String(currentText || '') };

  // Registration is allowed to leave a description field blank. In that
  // state there is no schema to merge against yet, so the first tracker
  // update must be able to establish its fields (for example, a pregnancy
  // description after a debug injection). Once a field has content, keep
  // the normal strict schema guard below.
  if (current.entries.length === 0) {
    return {
      ok: true,
      value: patch.entries.map((entry) => `${entry.name}|${entry.value};;`).join(''),
    };
  }

  const allowedNames = new Set(current.entries.map((entry) => entry.name));
  const unknownNames = patch.entries.map((entry) => entry.name).filter((name) => !allowedNames.has(name));
  if (unknownNames.length > 0) {
    return {
      ok: false,
      value: String(currentText || ''),
      error: `unknown subfield(s): ${Array.from(new Set(unknownNames)).join(', ')}`,
    };
  }

  const patchByName = new Map(patch.entries.map((entry) => [entry.name, entry.value]));
  const merged = current.entries.map((entry) => ({
    name: entry.name,
    value: patchByName.has(entry.name) ? patchByName.get(entry.name) : entry.value,
  }));
  return {
    ok: true,
    value: merged.map((entry) => `${entry.name}|${entry.value};;`).join(''),
  };
}

function applyAddWardrobeItem(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsAddWardrobeItem skipped: unknown character ${female || '(empty)'}.` };
  const item = normalizeWardrobeItem(args?.item, { allowMissingId: true });
  if (!item) return { applied: false, message: `bsAddWardrobeItem skipped for ${female}: invalid item.` };
  if (item.id === DEFAULT_WARDROBE_ITEM.id) return { applied: false, message: `bsAddWardrobeItem skipped for ${female}: id=0 is reserved.` };
  const next = cloneValue(character);
  const profile = next.profile || {};
  if (!hasPreparedWardrobe(profile)) return { applied: false, message: `bsAddWardrobeItem skipped for ${female}: wardrobe is not prepared.` };
  const wardrobe = ensureWardrobeState(profile);
  const rawId = args?.item?.id;
  const hasExplicitIntegerId = Number.isInteger(Number(rawId)) && String(rawId ?? '').trim() !== '';
  // 定位更新目标：显式整数 id 直接比对；否则按 id 引用（含名称/hash 兼容）或衣物名称匹配既有条目。
  let target = null;
  if (hasExplicitIntegerId) {
    target = wardrobe.items.find((entry) => entry.id === item.id) || null;
  } else {
    target = resolveWardrobeItemRef(wardrobe.items, rawId)
      || resolveWardrobeItemRef(wardrobe.items, item.name)
      || null;
  }
  if (target && target.id === DEFAULT_WARDROBE_ITEM.id) return { applied: false, message: `bsAddWardrobeItem skipped for ${female}: id=0 is reserved.` };
  if (target) {
    item.id = target.id;
    const existingIndex = wardrobe.items.findIndex((entry) => entry.id === target.id);
    wardrobe.items[existingIndex] = item;
  } else {
    // 新衣物：显式整数 id 沿用；缺失或字符串 id 自动分配下一个序号，避免 hash id 污染长期衣柜。
    if (!hasExplicitIntegerId) item.id = getNextWardrobeItemId(wardrobe.items);
    wardrobe.items.push(item);
  }
  refreshOutfitPregFit(profile);
  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsAddWardrobeItem applied to ${female}: ${item.name} (id=${item.id}).` };
}

function applyRemoveWardrobeItem(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsRemoveWardrobeItem skipped: unknown character ${female || '(empty)'}.` };
  const next = cloneValue(character);
  const profile = next.profile || {};
  if (!hasPreparedWardrobe(profile)) return { applied: false, message: `bsRemoveWardrobeItem skipped for ${female}: wardrobe is not prepared.` };
  const wardrobe = ensureWardrobeState(profile);
  const target = resolveWardrobeItemRef(wardrobe.items, args?.itemId);
  if (!target) return { applied: false, message: `bsRemoveWardrobeItem skipped for ${female}: item not found (${JSON.stringify(args?.itemId ?? null)}).` };
  const itemId = target.id;
  if (itemId === DEFAULT_WARDROBE_ITEM.id) return { applied: false, message: `bsRemoveWardrobeItem skipped for ${female}: id=0 cannot be removed.` };
  wardrobe.items = wardrobe.items.filter((item) => item.id !== itemId);
  const outfit = ensureOutfitState(profile);
  if (outfit.mainItemId === itemId) outfit.mainItemId = DEFAULT_WARDROBE_ITEM.id;
  outfit.accessoryItemIds = outfit.accessoryItemIds.filter((id) => id !== itemId);
  refreshOutfitPregFit(profile);
  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsRemoveWardrobeItem applied to ${female}: ${itemId}.` };
}

function applyChangeOutfit(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsChangeOutfit skipped: unknown character ${female || '(empty)'}.` };
  const next = cloneValue(character);
  const profile = next.profile || {};
  if (!hasPreparedWardrobe(profile)) return { applied: false, message: `bsChangeOutfit skipped for ${female}: wardrobe is not prepared.` };
  const outfit = ensureOutfitState(profile);
  if (args?.temporaryItems !== undefined) {
    if (!Array.isArray(args.temporaryItems)) return { applied: false, message: `bsChangeOutfit skipped for ${female}: temporaryItems must be an array.` };
    outfit.temporaryItems = normalizeTemporaryOutfitItems(args.temporaryItems);
  }
  const previousMainItemId = outfit.mainItemId;
  if (args?.mainItemId !== undefined) {
    const mainItem = findOutfitItem(profile, args.mainItemId, 'main');
    if (!mainItem) return { applied: false, message: `bsChangeOutfit skipped for ${female}: unknown main item ${JSON.stringify(args.mainItemId ?? null)}.` };
    outfit.mainItemId = mainItem.id;
  }
  if (args?.accessoryItemIds !== undefined) {
    if (!Array.isArray(args.accessoryItemIds)) return { applied: false, message: `bsChangeOutfit skipped for ${female}: accessoryItemIds must be an array.` };
    const nextAccessoryIds = [];
    for (const rawRef of args.accessoryItemIds) {
      const accessory = findOutfitItem(profile, rawRef, 'accessory');
      if (!accessory) return { applied: false, message: `bsChangeOutfit skipped for ${female}: unknown accessory item ${JSON.stringify(rawRef ?? null)}.` };
      if (!nextAccessoryIds.includes(accessory.id)) nextAccessoryIds.push(accessory.id);
    }
    outfit.accessoryItemIds = nextAccessoryIds;
  } else if (args?.addAccessoryItemIds !== undefined || args?.removeAccessoryItemIds !== undefined) {
    // 增量穿脱：在当前配件列表基础上加/减，避免模型必须整表重述。
    const current = [...outfit.accessoryItemIds];
    if (args?.removeAccessoryItemIds !== undefined) {
      if (!Array.isArray(args.removeAccessoryItemIds)) return { applied: false, message: `bsChangeOutfit skipped for ${female}: removeAccessoryItemIds must be an array.` };
      for (const rawRef of args.removeAccessoryItemIds) {
        const accessory = findOutfitItem(profile, rawRef, 'accessory');
        if (!accessory) return { applied: false, message: `bsChangeOutfit skipped for ${female}: unknown accessory item ${JSON.stringify(rawRef ?? null)}.` };
        const index = current.indexOf(accessory.id);
        if (index >= 0) current.splice(index, 1);
      }
    }
    if (args?.addAccessoryItemIds !== undefined) {
      if (!Array.isArray(args.addAccessoryItemIds)) return { applied: false, message: `bsChangeOutfit skipped for ${female}: addAccessoryItemIds must be an array.` };
      for (const rawRef of args.addAccessoryItemIds) {
        const accessory = findOutfitItem(profile, rawRef, 'accessory');
        if (!accessory) return { applied: false, message: `bsChangeOutfit skipped for ${female}: unknown accessory item ${JSON.stringify(rawRef ?? null)}.` };
        if (!current.includes(accessory.id)) current.push(accessory.id);
      }
    }
    outfit.accessoryItemIds = current;
  }
  if (args?.wearState !== undefined) {
    outfit.wearState = sanitizeWearState(args.wearState);
  } else if (outfit.mainItemId !== previousMainItemId) {
    // 换了主件且未显式指定穿着状态：新衣服默认穿整齐。
    outfit.wearState = DEFAULT_WEAR_STATE;
  }
  refreshOutfitPregFit(profile);
  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsChangeOutfit applied to ${female}.` };
}
function applyDescription(chatState, args) {
  const female = String(args?.female || '').trim();
  const options = args?.options && typeof args.options === 'object' ? args.options : {};
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsSetDescription skipped: unknown character ${female || '(empty)'}.` };

  const next = cloneValue(character);
  next.profile.descriptions = {
    ...(next.profile?.descriptions || {}),
  };
  const failures = [];
  const appliedKeys = [];
  for (const key of DESCRIPTION_FIELD_NAMES) {
    if (options[key] === undefined) continue;
    const merged = mergeDescriptionText(next.profile.descriptions[key] || '', options[key]);
    if (!merged.ok) {
      failures.push(`${key}: ${merged.error}`);
      continue;
    }
    next.profile.descriptions[key] = merged.value;
    appliedKeys.push(key);
  }
  if (failures.length > 0) return { applied: false, message: `bsSetDescription skipped for ${female}: ${failures.join('; ')}.` };
  if (appliedKeys.length === 0) return { applied: false, message: `bsSetDescription skipped for ${female}: empty options.` };
  chatState.characters[female] = next;
  return { applied: true, message: `bsSetDescription applied to ${female}: ${appliedKeys.join(', ')}.` };
}

function applySetCharacterPresence(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsSetCharacterPresence skipped: unknown character ${female || '(empty)'}.` };
  // 缺省视为在场会让模型漏填时静默改状态：要求显式传入
  if (args?.isPresent === undefined) return { applied: false, message: `bsSetCharacterPresence skipped for ${female}: isPresent 必须显式传入 true/false。` };
  const isPresent = Boolean(args.isPresent);

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  base.isHere = isPresent;
  profile.base = base;
  next.profile = profile;
  chatState.characters[female] = next;
  return { applied: true, message: `bsSetCharacterPresence applied to ${female}: isHere=${isPresent}.` };
}

function applyUpdateExperience(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  const options = args?.options && typeof args.options === 'object' ? args.options : null;
  if (!female || !character) return { applied: false, message: `bsUpdateExperience skipped: unknown character ${female || '(empty)'}.` };
  if (!options) return { applied: false, message: 'bsUpdateExperience skipped: empty options.' };

  const next = cloneValue(character);
  const profile = next.profile || {};
  const experience = profile.experience || {};
  const allowedStringFields = ['virginity', 'latestSexPartner', 'emotionalMate', 'marriageMate'];
  const allowedNumberFields = ['pregnantExperience', 'naturalBirthExperience', 'surgicalBirthExperience', 'miscarriageExperience'];

  let changed = false;
  for (const field of allowedStringFields) {
    if (options[field] === undefined) continue;
    experience[field] = options[field] === null ? null : String(options[field]);
    changed = true;
  }
  for (const field of allowedNumberFields) {
    if (options[field] === undefined) continue;
    experience[field] = clampNumber(options[field], 0, 9999, experience[field] || 0);
    changed = true;
  }

  if (!changed) return { applied: false, message: `bsUpdateExperience skipped for ${female}: no allowed fields.` };

  profile.experience = experience;
  next.profile = profile;
  chatState.characters[female] = next;
  return { applied: true, message: `bsUpdateExperience applied to ${female}.` };
}

function applyNameChild(chatState, args) {
  const female = String(args?.female || '').trim();
  const childIndex = Number(args?.childIndex);
  const childName = String(args?.name || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsNameChild skipped: unknown character ${female || '(empty)'}.` };
  if (!Number.isInteger(childIndex)) return { applied: false, message: 'bsNameChild skipped: invalid childIndex.' };
  if (!childName) return { applied: false, message: 'bsNameChild skipped: empty name.' };

  const next = cloneValue(character);
  const profile = next.profile || {};
  const children = Array.isArray(profile.children) ? profile.children.map((item) => ({ ...item })) : [];
  if (childIndex < 0 || childIndex >= children.length) {
    return { applied: false, message: `bsNameChild skipped for ${female}: childIndex ${childIndex} out of range.` };
  }

  children[childIndex].name = childName;
  profile.children = children;
  next.profile = profile;
  chatState.characters[female] = next;
  return { applied: true, message: `bsNameChild applied to ${female}: child ${childIndex} named ${childName}.` };
}

function applyRegisterSkillDefinition(chatState, args) {
  const result = registerSkillDefinition(chatState.skillCatalog, args, chatState.nextSkillId);
  if (!result.ok) return { applied: false, message: `bsRegisterSkillDefinition skipped: ${result.message}` };
  chatState.skillCatalog = result.catalog;
  chatState.nextSkillId = result.nextSkillId;
  return {
    applied: result.created,
    message: result.created
      ? `bsRegisterSkillDefinition registered #${result.definition.id} ${result.definition.name}.`
      : `bsRegisterSkillDefinition skipped: ${result.definition.name} already exists as #${result.definition.id}.`,
  };
}

const FETAL_TALENT_TRANSFER_STAGES = new Set(['孕中期', '孕晚期', '临产期', '逾期', '产兆前驱', '第一产程']);

function applyTrainSkill(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsTrainSkill skipped: unknown character ${female || '(empty)'}.` };

  const definition = resolveSkillDefinition(chatState.skillCatalog, args?.skill);
  const reason = String(args?.reason || '').trim();
  const skillExp = Number(args?.skillExp);
  if (!definition) return { applied: false, message: `bsTrainSkill skipped for ${female}: skill is not registered in skill_catalog.` };
  if (!reason) return { applied: false, message: `bsTrainSkill skipped for ${female}: training reason is required.` };
  if (args?.talentExp !== undefined) {
    return { applied: false, message: `bsTrainSkill skipped for ${female}: character talents are read-only to LLM tools; remove talentExp.` };
  }
  if (!Number.isInteger(skillExp) || skillExp < 0 || skillExp > 1000000) {
    return { applied: false, message: `bsTrainSkill skipped for ${female}: skillExp must be an integer from 0 to 1000000.` };
  }

  const next = cloneValue(character);
  const profile = next.profile || {};
  const skills = normalizeSkillList(profile.skills);
  let skill = skills.find((item) => item.skillId === definition.id);
  const previousLevel = skill?.level || 0;
  const awakened = !skill && args?.awaken === true;
  if (!skill && !awakened) {
    return { applied: false, message: `bsTrainSkill skipped for ${female}: ${definition.name} is not awakened; pass awaken=true only when the story triggers awakening.` };
  }
  if (!skill) {
    skill = { skillId: definition.id, level: 1, exp: 0 };
    skills.push(skill);
  }
  const trained = addSkillExperience(skill, skillExp);
  Object.assign(skill, trained);
  profile.skills = skills;

  let levelUpNotify = null;
  if (skill.level > previousLevel) {
    profile.skillHistory = appendSkillHistory(profile.skillHistory, {
      skillId: definition.id,
      fromLevel: previousLevel,
      toLevel: skill.level,
      reason,
      source: 'story',
      timestamp: Date.now(),
    });
    const awakenedNow = previousLevel === 0;
    levelUpNotify = {
      type: awakenedNow ? 'skill_awakened' : 'skill_level_up',
      female,
      skillId: definition.id,
      skillName: definition.name,
      fromLevel: previousLevel,
      toLevel: skill.level,
      awakened: awakenedNow,
      text: awakenedNow
        ? `${female}觉醒了技能「${definition.name}」${skill.level > 1 ? `，并提升至 Lv${skill.level}` : ''}`
        : `${female}的「${definition.name}」由 Lv${previousLevel} 提升至 Lv${skill.level}`,
    };
  }

  let inheritedFetusIndex = -1;
  let inheritedExp = 0;
  const stage = String(profile?.base?.stage || '');
  if (skillExp > 0 && FETAL_TALENT_TRANSFER_STAGES.has(stage)) {
    const pregnant = profile.pregnant || {};
    const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses.map((fetus) => ({ ...fetus })) : [];
    if (fetuses.length > 0) {
      inheritedFetusIndex = randomInt(0, fetuses.length - 1);
      const selectedFetus = fetuses[inheritedFetusIndex];
      const affinity = clampNumber(selectedFetus?.affinity, -50, 50, 0);
      inheritedExp = Math.round(skillExp * (Math.abs(affinity) / 50)) * Math.sign(affinity);
      const fetusTalents = normalizeTalentList(selectedFetus.talents ?? selectedFetus.inheritedTalents);
      let fetusTalent = fetusTalents.find((item) => item.skillId === definition.id);
      if (inheritedExp !== 0 && !fetusTalent) {
        fetusTalent = { skillId: definition.id, level: 0, exp: 0 };
        fetusTalents.push(fetusTalent);
      }
      if (inheritedExp !== 0) {
        Object.assign(fetusTalent, addTalentExperience(fetusTalent, inheritedExp));
        selectedFetus.talents = fetusTalents;
        delete selectedFetus.inheritedTalents;
      }
    }
    pregnant.fetuses = fetuses;
    profile.pregnant = pregnant;
  }

  next.profile = profile;
  next.updatedAt = Date.now();
  chatState.characters[female] = next;
  return {
    applied: true,
    message: `bsTrainSkill applied to ${female}: ${definition.name} Lv${skill.level}, EXP ${skill.exp}/${skill.level >= 10 ? 0 : requiredExp(skill.level)}${awakened ? '; awakened' : ''}${inheritedFetusIndex >= 0 ? `; fetus #${inheritedFetusIndex + 1} selected${inheritedExp !== 0 ? `, inherited EXP ${inheritedExp}` : ', no inherited EXP'}` : ''}.`,
    ...(levelUpNotify ? { notify: levelUpNotify } : {}),
  };
}

function applyUpdatePsychology(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  const options = args?.options && typeof args.options === 'object' ? args.options : null;
  if (!female || !character) return { applied: false, message: `bsUpdatePsychology skipped: unknown character ${female || '(empty)'}.` };
  if (!options) return { applied: false, message: 'bsUpdatePsychology skipped: empty options.' };

  const next = cloneValue(character);
  const profile = next.profile || {};
  if (!hasBreedingPsychology(profile)) {
    return { applied: false, message: `bsUpdatePsychology skipped for ${female}: breeding psychology is not inferred.` };
  }
  const psychology = profile.psychology || {};
  const base = profile.base || {};
  const stage = String(base.stage || '');
  const isPregnancySide = PREGNANCY_STAGES.includes(stage) || stage === '假孕期' || stage === '产兆前驱' || LABOR_STAGES.includes(stage);

  const targetGroup = isPregnancySide ? 'preg' : 'mens';
  const sourcePatch = options[targetGroup];
  if (!sourcePatch || typeof sourcePatch !== 'object') {
    return { applied: false, message: `bsUpdatePsychology skipped for ${female}: current stage expects ${targetGroup} updates.` };
  }

  const fieldConfig = targetGroup === 'preg' ? PSY_PREG_FIELDS : PSY_MENS_FIELDS;
  const boolFieldConfig = targetGroup === 'preg' ? PSY_PREG_BOOL_FIELDS : PSY_MENS_BOOL_FIELDS;
  const stageProfiles = normalizePsychologyStageProfiles(psychology.stageProfiles);
  const target = normalizePsychologyGroup(psychology[targetGroup], fieldConfig, {
    booleanFields: boolFieldConfig,
    stageProfiles: stageProfiles[targetGroup],
  });
  const allowedFields = Object.keys(fieldConfig);
  const allowedBoolFields = Object.keys(boolFieldConfig);

  let changed = false;
  for (const field of allowedFields) {
    if (sourcePatch[field] === undefined) continue;
    const valueKey = `${field}_value`;
    const currentValue = target[valueKey] === null || target[valueKey] === undefined ? 0 : clampNumber(target[valueKey], 0, 100, 0);
    target[valueKey] = clampNumber(currentValue + Number(sourcePatch[field] || 0), 0, 100, currentValue);
    changed = true;
  }
  for (const field of allowedBoolFields) {
    if (sourcePatch[field] === undefined) continue;
    target[field] = Boolean(sourcePatch[field]);
    changed = true;
  }

  if (!changed) {
    return { applied: false, message: `bsUpdatePsychology skipped for ${female}: no allowed ${targetGroup} fields.` };
  }
  const cooldown = profile.cooldown || {};
  if (cooldown.psychologyUpdateUsed) {
    return { applied: false, message: `bsUpdatePsychology skipped for ${female}: already changed during this story hour.` };
  }

  const normalizedTarget = normalizePsychologyGroup(target, fieldConfig, {
    booleanFields: boolFieldConfig,
    stageProfiles: stageProfiles[targetGroup],
  });
  profile.psychology = {
    ...(profile.psychology || {}),
    stageProfiles,
    mens: targetGroup === 'mens'
      ? normalizedTarget
      : normalizePsychologyGroup(profile.psychology?.mens, PSY_MENS_FIELDS, {
        booleanFields: PSY_MENS_BOOL_FIELDS,
        stageProfiles: stageProfiles.mens,
      }),
    preg: targetGroup === 'preg'
      ? normalizedTarget
      : normalizePsychologyGroup(profile.psychology?.preg, PSY_PREG_FIELDS, {
        booleanFields: PSY_PREG_BOOL_FIELDS,
        stageProfiles: stageProfiles.preg,
      }),
  };
  profile.cooldown = {
    ...cooldown,
    psychologyUpdateUsed: true,
  };
  next.profile = profile;
  chatState.characters[female] = next;
  return { applied: true, message: `bsUpdatePsychology applied to ${female}.` };
}

function applyAddSperm(chatState, args) {
  const female = String(args?.female || '').trim();
  const male = String(args?.male || '').trim();
  const parsedRace = parseRaceDescriptor(args?.race || '人类');
  const race = parsedRace.race || '人类';
  const amount = Number(args?.amount || 0);
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsAddSperm skipped: unknown character ${female || '(empty)'}.` };
  if (!male) return { applied: false, message: 'bsAddSperm skipped: empty male.' };
  if (!Number.isFinite(amount) || amount === 0) return { applied: false, message: 'bsAddSperm skipped: invalid amount.' };
  if (amount < 0) return { applied: false, message: 'bsAddSperm skipped: negative amount 请改用 bsDrainSperm 扣除精液。' };

  const next = cloneValue(character);
  const base = next.profile?.base || {};
  const sperms = Array.isArray(base.sperms) ? base.sperms.map((item) => ({ ...item })) : [];
  const maleDerivedType = parsedRace.derivedType || null;
  const existing = sperms.find((item) => String(item?.male || '') === male);
  if (existing) {
    existing.value = Math.max(0, clampNumber(existing.value, 0, 999999, 0) + amount);
    existing.race = race;
    existing.derivedType = maleDerivedType;
  } else if (amount > 0) {
    sperms.push({ male, race, derivedType: maleDerivedType, value: amount });
  }
  base.sperms = sperms.filter((item) => clampNumber(item?.value, 0, 999999, 0) > 0);
  base.latestSexDays = 0;
  next.profile.base = base;
  const experience = {
    ...(next.profile?.experience || {}),
    latestSexPartner: male,
  };
  if (experience.virginity === null || experience.virginity === undefined) {
    experience.virginity = male;
  }
  next.profile.experience = experience;
  if (amount > 0) {
  }
  chatState.characters[female] = next;
  return { applied: true, message: `bsAddSperm applied to ${female}.` };
}

function applyDrainSperm(chatState, args) {
  const female = String(args?.female || '').trim();
  const amount = Number(args?.amount || 0);
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsDrainSperm skipped: unknown character ${female || '(empty)'}.` };
  if (!Number.isFinite(amount) || amount <= 0) return { applied: false, message: 'bsDrainSperm skipped: invalid amount.' };

  const next = cloneValue(character);
  const base = next.profile?.base || {};
  let sperms = Array.isArray(base.sperms) ? base.sperms.map((item) => ({ ...item })) : [];
  const total = sperms.reduce((sum, item) => sum + clampNumber(item?.value, 0, 999999, 0), 0);

  if (total <= amount) {
    base.sperms = [];
    next.profile.base = base;
    chatState.characters[female] = next;
    return { applied: true, message: `bsDrainSperm cleared all sperm for ${female}.` };
  }

  const factor = amount / total;
  sperms = sperms
    .map((item) => ({
      ...item,
      value: Math.max(Math.floor(clampNumber(item?.value, 0, 999999, 0) - (clampNumber(item?.value, 0, 999999, 0) * factor)), 0),
    }))
    .filter((item) => item.value > 0);

  base.sperms = sperms;
  next.profile.base = base;
  chatState.characters[female] = next;
  return { applied: true, message: `bsDrainSperm applied to ${female}.` };
}

function applySetMenstrualPhases(chatState, args) {
  const female = String(args?.female || '').trim();
  const stage = String(args?.stage || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsSetMenstrualPhases skipped: unknown character ${female || '(empty)'}.` };
  if (!stage) return { applied: false, message: 'bsSetMenstrualPhases skipped: empty stage.' };

  const allowedStages = new Set([...MENSTRUAL_STAGES, '产后恢复', '假孕期']);
  if (!allowedStages.has(stage)) {
    return { applied: false, message: `bsSetMenstrualPhases skipped: invalid stage ${stage}.` };
  }

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const cooldown = profile.cooldown || {};
  const notify = profile.notify || {};
  const currentStage = String(base.stage || '');
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  const hasConceptionState = fetuses.length > 0
    || clampNumber(base.fertilizationDays, 0, 9999, 0) > 0
    || clampNumber(pregnant.pregnantDays, 0, 9999, 0) > 0
    || clampNumber(pregnant.effectivePregnantDays, 0, 9999, 0) > 0;
  const hasProtectedPregnancyState = PREGNANCY_STAGES.includes(currentStage)
    || currentStage === '产兆前驱'
    || LABOR_STAGES.includes(currentStage);

  if (hasConceptionState || hasProtectedPregnancyState) {
    return {
      applied: false,
      message: `bsSetMenstrualPhases skipped for ${female}: active conception or pregnancy state must not be overridden.`,
    };
  }

  base.stage = stage;
  base.days = 0;
  profile.base = base;
  if (stage === '卵泡期') {
    const metabolism = profile.metabolism || {};
    metabolism.milk = 0;
    profile.metabolism = metabolism;
  }
  if (stage === '排卵期') {
    profile.cooldown = {
      ...cooldown,
      orgasmOvulationUsed: false,
    };
  } else {
    profile.cooldown = {
      ...cooldown,
      orgasmOvulationUsed: shouldResetOrgasmOvulation(stage) ? false : Boolean(cooldown.orgasmOvulationUsed),
      naturalOvulationUsed: false,
    };
  }

  if (stage === '假孕期') {
    pregnant.pregnantDays = 0;
    pregnant.effectivePregnantDays = 0;
  }

  profile.base = base;
  profile.pregnant = pregnant;
  profile.notify = {
    ...notify,
    firstly: `${female}进入了${stage}`,
  };
  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsSetMenstrualPhases applied to ${female}.` };
}

function applyDebugInjectPregnancy(chatState, args) {
  const female = String(args?.female || '').trim();
  const fatherInput = String(args?.father || '').trim();
  const raceInput = String(args?.race || '人类').trim();
  const fetusCount = clampNumber(args?.fetusCount, 1, 9, 1);
  const equivalentDays = clampNumber(args?.equivalentDays, 0, 300, 0);
  const genderInput = String(args?.genders || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsDebugInjectPregnancy skipped: unknown character ${female || '(empty)'}.` };

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const experience = profile.experience || {};
  const notify = profile.notify || {};
  const bio = profile.bio || {};
  const currentStage = String(base.stage || '');
  const existingFetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  const hasConceptionState = existingFetuses.length > 0
    || clampNumber(base.fertilizationDays, 0, 9999, 0) > 0
    || isPregnancyStage(currentStage);
  if (hasConceptionState) {
    return { applied: false, message: `bsDebugInjectPregnancy skipped for ${female}: pregnancy/conception state already exists.` };
  }

  const rawGenderList = genderInput
    ? genderInput.split(',').map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  if (rawGenderList.length > 1 && rawGenderList.length !== fetusCount) {
    return { applied: false, message: `bsDebugInjectPregnancy skipped for ${female}: genders count must be 1 or match fetusCount.` };
  }

  const rawFatherList = fatherInput
    ? fatherInput.split(',').map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  if (rawFatherList.length > 1 && rawFatherList.length !== fetusCount) {
    return { applied: false, message: `bsDebugInjectPregnancy skipped for ${female}: fathers count must be 1 or match fetusCount.` };
  }

  const rawRaceList = raceInput
    ? raceInput.split(',').map((item) => String(item || '').trim()).filter(Boolean)
    : ['人类'];
  if (rawRaceList.length > 1 && rawRaceList.length !== fetusCount) {
    return { applied: false, message: `bsDebugInjectPregnancy skipped for ${female}: races count must be 1 or match fetusCount.` };
  }

  const allowedGenderMap = {
    男: '男',
    女: '女',
    双: '双',
    雙: '双',
    無: '无',
    无: '无',
  };
  const normalizedGenderList = rawGenderList.map((item) => allowedGenderMap[item]);
  if (normalizedGenderList.some((item) => !item)) {
    return { applied: false, message: `bsDebugInjectPregnancy skipped for ${female}: unsupported gender value.` };
  }

  const fetuses = [];
  for (let index = 0; index < fetusCount; index += 1) {
    const spermSeed = {
      male: rawFatherList.length === 0 ? '未知' : (rawFatherList.length === 1 ? rawFatherList[0] : rawFatherList[index]),
      race: parseRaceDescriptor(rawRaceList.length === 1 ? rawRaceList[0] : rawRaceList[index]).race || '人类',
      derivedType: null,
    };
    const fetus = createSimpleFetus(profile, spermSeed, equivalentDays === 0 ? currentStage : '孕早期');
    if (normalizedGenderList.length === 1) {
      fetus.gender = normalizedGenderList[0];
    } else if (normalizedGenderList.length === fetusCount) {
      fetus.gender = normalizedGenderList[index];
    }
    fetuses.push(fetus);
  }

  pregnant.fetuses = fetuses;
  pregnant.fetusesCount = fetuses.length;
  pregnant.laborHours = 0;
  pregnant.effectiveLaborHours = 0;
  pregnant.laborPhase = null;
  pregnant.laborFetusIndex = 0;
  pregnant.laborPain = 0;
  pregnant.prodromalOriginStage = null;
  pregnant.prodromalRemainingHours = 0;
  pregnant.prodromalDelayProgressHours = 0;
  pregnant.amnionDurability = equivalentDays === 0 ? 0 : 100;
  pregnant.pregnantDays = 0;
  pregnant.effectivePregnantDays = equivalentDays === 0 ? 0 : equivalentDays;

  profile.base = base;
  if (equivalentDays === 0) {
    base.fertilizationDays = 0;
  } else {
    applyPregnancyPhysiology(profile, next.runtime || {});
    const actualGestationSpeed = clampNumber(getGestationEffectiveSpeed(profile), 0, 20, 1);
    pregnant.pregnantDays = actualGestationSpeed > 0 ? Math.max(0, equivalentDays / actualGestationSpeed) : equivalentDays;
    pregnant.effectivePregnantDays = Math.max(0, equivalentDays);
    const derived = derivePregnancyStageState(pregnant.effectivePregnantDays, 1);
    base.stage = derived.stage;
    base.days = derived.days;
    base.fertilizationDays = 0;
    experience.pregnantExperience = clampNumber(experience.pregnantExperience, 0, 999, 0) + 1;
  }

  profile.pregnant = pregnant;
  profile.experience = experience;
  updateFetalEnergyDrain(profile);
  profile.notify = {
    ...notify,
    secondly: equivalentDays === 0
      ? `${female}已注入${fetusCount}个刚受精胚胎，尚未着床`
      : `${female}已注入${fetusCount}胎，当前为等效妊娠${equivalentDays}天`,
  };

  next.profile = profile;
  chatState.characters[female] = equivalentDays > 0 ? syncCharacterStageFromProfile(next) : next;
  return { applied: true, message: `bsDebugInjectPregnancy applied to ${female}.` };
}

/**
 * 剧情强制令：把妊娠状态直接改写成指定的样子。
 *
 * 与 bsDebugInjectPregnancy 的关键差别有三点：
 * 一是不做 hasConceptionState 检查——强制令的用途正是覆盖既有状态，
 *   「已经怀着了」不该成为拒绝理由；
 * 二是允许指定每胎体重系数，巨大儿这类设定得靠它落地；
 * 三是 children／skills／diary／experience 一律不动，只重写子宫里的事。
 */
function applyForceGestation(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsForceGestation skipped: unknown character ${female || '(empty)'}.` };

  const equivalentDays = clampNumber(args?.equivalentDays, 0, 300, 0);
  const fetusCount = clampNumber(args?.fetusCount, 1, 9, 1);
  const fatherInput = String(args?.father || '').trim();
  const raceInput = String(args?.race || '').trim();
  const genderInput = String(args?.genders || '').trim();
  const hasWeightOverride = args?.fetusWeight !== undefined && args?.fetusWeight !== null && args?.fetusWeight !== '';
  const fetusWeight = clampNumber(args?.fetusWeight, 0.33, 3.0, 1.0);

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const experience = profile.experience || {};
  const notify = profile.notify || {};
  const previousStage = String(base.stage || '');
  const previousFetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];

  const rawGenderList = genderInput
    ? genderInput.split(',').map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  if (rawGenderList.length > 1 && rawGenderList.length !== fetusCount) {
    return { applied: false, message: `bsForceGestation skipped for ${female}: genders count must be 1 or match fetusCount.` };
  }

  const rawFatherList = fatherInput
    ? fatherInput.split(',').map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  if (rawFatherList.length > 1 && rawFatherList.length !== fetusCount) {
    return { applied: false, message: `bsForceGestation skipped for ${female}: fathers count must be 1 or match fetusCount.` };
  }

  // 未指定父方种族时沿用母体种族，避免强制令把混血算成人类。
  const motherRace = parseRaceDescriptor(base.race || '人类').race || '人类';
  const rawRaceList = raceInput
    ? raceInput.split(',').map((item) => String(item || '').trim()).filter(Boolean)
    : [motherRace];
  if (rawRaceList.length > 1 && rawRaceList.length !== fetusCount) {
    return { applied: false, message: `bsForceGestation skipped for ${female}: races count must be 1 or match fetusCount.` };
  }

  const allowedGenderMap = {
    男: '男',
    女: '女',
    双: '双',
    雙: '双',
    無: '无',
    无: '无',
  };
  const normalizedGenderList = rawGenderList.map((item) => allowedGenderMap[item]);
  if (normalizedGenderList.some((item) => !item)) {
    return { applied: false, message: `bsForceGestation skipped for ${female}: unsupported gender value.` };
  }

  // 已经怀着同样胎数时保留原胎儿（父方、种族、性别、亲和度都留着），
  // 只改孕期——「诅咒把她推到 41 周」不该顺手把孩子换成别人的。
  const reuseExisting = previousFetuses.length === fetusCount
    && !fatherInput
    && !raceInput
    && !genderInput;

  const fetuses = [];
  if (reuseExisting) {
    for (const fetus of previousFetuses) {
      const copy = { ...fetus };
      if (hasWeightOverride) copy.weight = fetusWeight;
      fetuses.push(copy);
    }
  } else {
    for (let index = 0; index < fetusCount; index += 1) {
      const spermSeed = {
        male: rawFatherList.length === 0 ? '未知' : (rawFatherList.length === 1 ? rawFatherList[0] : rawFatherList[index]),
        race: parseRaceDescriptor(rawRaceList.length === 1 ? rawRaceList[0] : rawRaceList[index]).race || motherRace,
        derivedType: null,
      };
      const fetus = createSimpleFetus(profile, spermSeed, equivalentDays === 0 ? previousStage : '孕早期');
      if (normalizedGenderList.length === 1) {
        fetus.gender = normalizedGenderList[0];
      } else if (normalizedGenderList.length === fetusCount) {
        fetus.gender = normalizedGenderList[index];
      }
      if (hasWeightOverride) fetus.weight = fetusWeight;
      fetuses.push(fetus);
    }
  }

  pregnant.fetuses = fetuses;
  pregnant.fetusesCount = fetuses.length;
  // 入盆是数值状态而不是描述文字：显式给了就照写，让「一胎已入盆、一胎还在上面」
  // 落进 fetus.engaged；没给就交回给系统按胎位与阶段自行判定。
  if (args?.engagedCount !== undefined && args?.engagedCount !== null && args?.engagedCount !== '') {
    const engagedTarget = clampNumber(args.engagedCount, 0, fetuses.length, 0);
    for (let index = 0; index < fetuses.length; index += 1) {
      const isEngaged = index < engagedTarget;
      fetuses[index].engaged = isEngaged;
      // 下降度也要一起写：engaged 是由它派生的读数，只设布尔会让两者从一开始
      // 就不自洽。落在入盆线上而不是更深——强制令说的是「已入盆」，
      // 不是「已深固定」，后者意味着马上要生，那得由剧情自己走到。
      fetuses[index].descent = isEngaged ? DESCENT_ENGAGED : 0;
    }
  }
  // 入盆时长从这一刻重新起算，不因为孕周被设到 41 周就当成「已经入盆十几天」。
  // 强制令造出的角色若继承一个虚高的计时，会当天就掷出必生。
  pregnant.engagedDays = 0;
  // 强制令给的是一个干净的状态，不该继承上一次的前驱发作。
  pregnant.prodromalEpisodeHours = 0;
  pregnant.prodromalEpisodeCooldownHours = 0;
  pregnant.prodromalEpisodeCount = 0;
  pregnant.laborHours = 0;
  pregnant.effectiveLaborHours = 0;
  pregnant.laborPhase = null;
  pregnant.laborFetusIndex = 0;
  pregnant.laborPain = 0;
  pregnant.prodromalOriginStage = null;
  pregnant.prodromalRemainingHours = 0;
  pregnant.prodromalDelayProgressHours = 0;
  pregnant.nutrition = 0;
  pregnant.symptomReliefPending = 0;
  pregnant.amnionDurability = equivalentDays === 0 ? 0 : 100;
  pregnant.pregnantDays = 0;
  pregnant.effectivePregnantDays = 0;

  profile.base = base;
  profile.pregnant = pregnant;

  if (equivalentDays === 0) {
    base.fertilizationDays = 0;
  } else {
    applyPregnancyPhysiology(profile, next.runtime || {});
    // 冻结（倍率 0）时 pregnantDays 无从反推，直接取等效值，
    // 免得除以 0 得出 Infinity 把存档写坏。
    const actualGestationSpeed = clampNumber(getGestationEffectiveSpeed(profile), 0, 20, 1);
    pregnant.pregnantDays = actualGestationSpeed > 0 ? Math.max(0, equivalentDays / actualGestationSpeed) : equivalentDays;
    pregnant.effectivePregnantDays = Math.max(0, equivalentDays);
    const derived = derivePregnancyStageState(pregnant.effectivePregnantDays, 1);
    base.stage = derived.stage;
    base.days = derived.days;
    base.fertilizationDays = 0;
    // 原本没怀着才算多一次妊娠经历；把 40 周推到 41 周不该重复计数。
    if (previousFetuses.length === 0) {
      experience.pregnantExperience = clampNumber(experience.pregnantExperience, 0, 999, 0) + 1;
    }
  }

  profile.experience = experience;
  updateFetalEnergyDrain(profile);

  const weightNote = hasWeightOverride ? `，每胎体重系数 ${fetusWeight.toFixed(2)}` : '';
  profile.notify = {
    ...notify,
    firstly: equivalentDays > 0 && base.stage !== previousStage ? `${female}进入了${base.stage}` : '',
    secondly: equivalentDays === 0
      ? `${female}的妊娠状态已按剧情强制令重置为${fetusCount}个刚受精胚胎，尚未着床`
      : `${female}的妊娠状态已按剧情强制令改写为${fetusCount}胎、等效妊娠${equivalentDays}天（约${Math.floor(equivalentDays / 7)}周${equivalentDays % 7}天）${weightNote}`,
  };

  next.profile = profile;
  chatState.characters[female] = equivalentDays > 0 ? syncCharacterStageFromProfile(next) : next;
  return { applied: true, message: `bsForceGestation applied to ${female}: ${fetusCount} fetus(es), ${equivalentDays} equivalent days.` };
}

function applyDebugClearContainers(chatState, args) {
  const female = String(args?.female || '').trim();
  const container = String(args?.container || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsDebugClearContainers skipped: unknown character ${female || '(empty)'}.` };
  if (!['sperms', 'fetuses', 'children'].includes(container)) {
    return { applied: false, message: `bsDebugClearContainers skipped for ${female}: unsupported container ${container || '(empty)'}.` };
  }

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const experience = profile.experience || {};
  const notify = profile.notify || {};
  const stage = String(base.stage || '');

  if (container === 'sperms') {
    const sperms = Array.isArray(base.sperms) ? base.sperms : [];
    if (sperms.length === 0) {
      return { applied: false, message: `bsDebugClearContainers skipped for ${female}: no sperms.` };
    }
    base.sperms = [];
    profile.base = base;
    profile.notify = {
      ...notify,
      secondly: `${female}体内残留精液已被调试淨空`,
    };
    next.profile = profile;
    chatState.characters[female] = next;
    return { applied: true, message: `bsDebugClearContainers cleared sperms for ${female}.` };
  }

  if (container === 'children') {
    const children = Array.isArray(profile.children) ? profile.children : [];
    if (children.length === 0) {
      return { applied: false, message: `bsDebugClearContainers skipped for ${female}: no children.` };
    }
    profile.children = [];
    profile.notify = {
      ...notify,
      secondly: `${female}的孩子记录已被调试淨空`,
    };
    next.profile = profile;
    chatState.characters[female] = next;
    return { applied: true, message: `bsDebugClearContainers cleared children for ${female}.` };
  }

  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  const fertilizationDays = clampNumber(base.fertilizationDays, 0, 9999, 0);
  const hasConceptionState = fetuses.length > 0 || fertilizationDays > 0 || isPregnancyStage(stage);
  if (!hasConceptionState) {
    return { applied: false, message: `bsDebugClearContainers skipped for ${female}: no fetuses or conception state.` };
  }

  const implantedPregnancy = isPregnancyStage(stage) || clampNumber(pregnant.effectivePregnantDays, 0, 9999, 0) > 0;
  clearPregnancyState(profile);
  restorePregnancyPhysiology(profile, next.runtime || {});
  if (implantedPregnancy) {
    base.stage = '产后恢复';
    base.days = 0;
    experience.miscarriageExperience = clampNumber(experience.miscarriageExperience, 0, 999, 0) + 1;
    profile.experience = experience;
    profile.notify = {
      ...notify,
      firstly: `${female}进入了产后恢复`,
      secondly: `${female}的胎儿已被调试淨空，并记录一次流产/堕胎经验`,
    };
    next.profile = profile;
    chatState.characters[female] = syncCharacterStageFromProfile(next);
    return { applied: true, message: `bsDebugClearContainers cleared implanted pregnancy for ${female}.` };
  }

  profile.notify = {
    ...notify,
    secondly: `${female}尚未着床的受精卵已被调试淨空`,
  };
  next.profile = profile;
  chatState.characters[female] = next;
  return { applied: true, message: `bsDebugClearContainers cleared pre-implantation conception for ${female}.` };
}

function applyDebugSetGestationModifier(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  const clear = Boolean(args?.clear);
  if (!female || !character) return { applied: false, message: `bsDebugSetGestationModifier skipped: unknown character ${female || '(empty)'}.` };

  const next = cloneValue(character);
  const profile = next.profile || {};
  const bio = profile.bio || {};
  const notify = profile.notify || {};
  const stage = String(profile?.base?.stage || '');
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];
  const runtimeBaseSpeed = Number(next.runtime?.originalPregnancyBio?.gestationSpeciesSpeed);
  const baseSpeed = clampNumber(
    Number.isFinite(runtimeBaseSpeed) && runtimeBaseSpeed > 0 ? runtimeBaseSpeed : getGestationSpeciesSpeed(profile),
    0.1,
    20,
    1.0,
  );

  bio.gestationSpeciesSpeed = baseSpeed;
  if (clear) {
    bio.gestationModifierMultiplier = 1.0;
    bio.gestationModifierName = '';
    bio.gestationModifierDescription = '';
  } else {
    const name = String(args?.name || '').trim();
    const description = String(args?.description || '').trim();
    const multiplier = clampNumber(args?.multiplier, 0, 20, 1.0);
    if (!name) return { applied: false, message: `bsDebugSetGestationModifier skipped for ${female}: empty name.` };
    bio.gestationModifierMultiplier = multiplier;
    bio.gestationModifierName = name;
    bio.gestationModifierDescription = description;
  }

  bio.gestationEffectiveSpeed = clampNumber(getGestationEffectiveSpeed({ ...profile, bio }), 0, 20, baseSpeed);
  profile.bio = bio;

  if (fetuses.length > 0 && isPregnancyStage(stage)) {
    applyPregnancyPhysiology(profile, next.runtime || {});
  }

  profile.notify = {
    ...notify,
    firstly: clear
      ? `${female}失去了妊娠变速效果`
      : `${female}获得了妊娠变速效果「${bio.gestationModifierName}」x${Number(bio.gestationModifierMultiplier || 0).toFixed(2)}`,
    secondly: clear
      ? `${female}的妊娠变速效果已被清除`
      : Number(bio.gestationModifierMultiplier || 0) === 0
        ? `${female}的胎儿发育已被冻结`
        : `${female}当前妊娠变速倍率为 x${Number(bio.gestationModifierMultiplier || 0).toFixed(2)}`,
  };

  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsDebugSetGestationModifier applied to ${female}.` };
}

/**
 * 剧情强制令：妊娠阶段锁定与分娩循环。
 *
 * 冻结走的是既有的 gestationModifierMultiplier=0 通路——孕日推进那两处
 * （PREGNANCY_STAGES 与产兆前驱分支）都乘这个倍率，归零即孕期不再前进。
 * 冻结不影响分娩：maybeStartLabor 只看子宫压力，与孕日无关，
 * 所以「卡在 41 周但随时可能生」是成立的。
 *
 * loopBackDays 记在 profile.gestationLock 上，由 applyChildbirthInternal 消费。
 */
function applySetGestationLock(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsSetGestationLock skipped: unknown character ${female || '(empty)'}.` };

  const clear = Boolean(args?.clear);
  const next = cloneValue(character);
  const profile = next.profile || {};
  const bio = profile.bio || {};
  const notify = profile.notify || {};
  const stage = String(profile?.base?.stage || '');
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];

  const runtimeBaseSpeed = Number(next.runtime?.originalPregnancyBio?.gestationSpeciesSpeed);
  const baseSpeed = clampNumber(
    Number.isFinite(runtimeBaseSpeed) && runtimeBaseSpeed > 0 ? runtimeBaseSpeed : getGestationSpeciesSpeed(profile),
    0.1,
    20,
    1.0,
  );
  bio.gestationSpeciesSpeed = baseSpeed;

  if (clear) {
    bio.gestationModifierMultiplier = 1.0;
    bio.gestationModifierName = '';
    bio.gestationModifierDescription = '';
    delete profile.gestationLock;
  } else {
    const name = String(args?.name || '').trim() || '剧情强制令';
    const description = String(args?.description || '').trim();
    const freeze = Boolean(args?.freeze);
    const loopBackDays = clampNumber(args?.loopBackDays, 0, 300, 0);
    if (!freeze && loopBackDays <= 0) {
      return { applied: false, message: `bsSetGestationLock skipped for ${female}: nothing to do (freeze=false and no loopBackDays); pass clear=true to remove an existing lock.` };
    }
    bio.gestationModifierMultiplier = freeze ? 0 : 1.0;
    bio.gestationModifierName = name;
    bio.gestationModifierDescription = description;
    if (loopBackDays > 0) {
      const lockFetusWeight = Number.isFinite(Number(args?.fetusWeight))
        ? clampNumber(args.fetusWeight, 0.33, 3.0, 1.0)
        : null;
      // 分娩当下胎儿已经清空了，读不到种族、父方、胎位和体重。
      // 所以下锁这一刻先把胎儿存成模板，每轮循环照着复刻，
      // 巨大儿和「一个已入盆一个还在上面」才不会一生就丢。
      const loopFetusTemplates = fetuses.map((fetus) => {
        const { embryoId: _embryoId, fusionCheckedWith: _fusionCheckedWith, ...template } = fetus || {};
        return {
          ...cloneValue(template),
          weight: clampNumber(lockFetusWeight ?? fetus?.weight, 0.33, 3.0, 1.0),
        };
      });
      profile.gestationLock = {
        name,
        description,
        loopBackDays,
        // 循环回去时要生成几胎；分娩当下才读不到，先记下来
        loopFetusCount: Math.max(1, fetuses.length || clampNumber(profile?.pregnant?.fetusesCount, 1, 9, 1)),
        loopFetusTemplates,
        // 模板缺失时（下锁时还没怀上）的兜底体重
        loopFetusWeight: lockFetusWeight ?? null,
        freeze,
      };
    } else {
      delete profile.gestationLock;
    }
  }

  bio.gestationEffectiveSpeed = clampNumber(getGestationEffectiveSpeed({ ...profile, bio }), 0, 20, baseSpeed);
  profile.bio = bio;

  if (fetuses.length > 0 && isPregnancyStage(stage)) {
    applyPregnancyPhysiology(profile, next.runtime || {});
  }

  const lock = profile.gestationLock;
  const frozen = Number(bio.gestationModifierMultiplier || 0) === 0;
  profile.notify = {
    ...notify,
    firstly: clear
      ? `${female}摆脱了妊娠锁定`
      : `${female}被施加了「${bio.gestationModifierName}」`,
    secondly: clear
      ? `${female}的妊娠锁定与分娩循环已解除，孕期恢复正常推进`
      : [
        frozen ? `${female}的孕期已被冻结，胎儿停止发育` : `${female}的孕期恢复正常推进`,
        lock ? `每次分娩结束后会退回等效妊娠${lock.loopBackDays}天并重新怀上${lock.loopFetusCount}胎` : '',
      ].filter(Boolean).join('；'),
  };

  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsSetGestationLock applied to ${female}.` };
}

function applyDebugFetalActivity(chatState, args) {
  const female = String(args?.female || '').trim();
  const activityText = String(args?.activityText || '').trim().slice(0, 500);
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsDebugFetalActivity skipped: unknown character ${female || '(empty)'}.` };
  if (!activityText) return { applied: false, message: `bsDebugFetalActivity skipped for ${female}: empty activity text.` };

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const fetuses = Array.isArray(pregnant.fetuses) ? pregnant.fetuses : [];
  const stage = String(base.stage || '');
  const allowedStages = [...PREGNANCY_STAGES, '产兆前驱', ...LABOR_STAGES];
  if (fetuses.length === 0 || !allowedStages.includes(stage)) {
    return { applied: false, message: `bsDebugFetalActivity skipped for ${female}: fetal activity requires an active pregnancy or labor state with fetuses.` };
  }

  const notify = profile.notify || {};
  const existingSecondary = String(notify.secondly || '').trim();
  profile.notify = {
    ...notify,
    secondly: existingSecondary ? `${existingSecondary}；${activityText}` : activityText,
  };
  next.profile = profile;
  chatState.characters[female] = next;
  return { applied: true, message: `bsDebugFetalActivity applied to ${female}.` };
}

function applyDebugSetProdromal(chatState, args) {
  const female = String(args?.female || '').trim();
  const character = chatState.characters?.[female];
  if (!female || !character) return { applied: false, message: `bsDebugSetProdromal skipped: unknown character ${female || '(empty)'}.` };

  const next = cloneValue(character);
  const profile = next.profile || {};
  const base = profile.base || {};
  const pregnant = profile.pregnant || {};
  const stage = String(base.stage || '');
  const allowedEntryStages = ['孕晚期', '临产期', '逾期'];
  if (!allowedEntryStages.includes(stage) && stage !== '产兆前驱') {
    return { applied: false, message: `bsDebugSetProdromal skipped for ${female}: stage must be late pregnancy, term, overdue, or prodromal.` };
  }

  const progressPercent = clampNumber(args?.progressPercent, 0, 100, 0);
  const enteringProdromal = stage !== '产兆前驱';
  if (enteringProdromal) {
    enterProdromalStage(profile, female, stage, `${female}已通过调试进入产兆前驱`);
  }

  const initialHours = getProdromalInitialHours(profile);
  pregnant.prodromalRemainingHours = initialHours * (1 - (progressPercent / 100));
  pregnant.prodromalDelayProgressHours = 0;
  updateLaborPain(profile, '产兆前驱', null, progressPercent / 100);
  profile.notify = {
    ...(profile.notify || {}),
    firstly: enteringProdromal ? `${female}进入了产兆前驱` : '',
    secondly: `${female}的产兆前驱调试进度设为${Math.round(progressPercent)}%，剩余约${Math.ceil(pregnant.prodromalRemainingHours)}小时`,
  };

  next.profile = profile;
  chatState.characters[female] = syncCharacterStageFromProfile(next);
  return { applied: true, message: `bsDebugSetProdromal applied to ${female}.` };
}

// ── 剧情强制令（使用者授权）────────────────────────────────────────────────
//
// 追踪流程原本只能改「生理系统自己算得出来的东西」：孕期靠受精着床一天天推，
// 阶段由 effectivePregnantDays 反推。于是「神秘大手让她突然怀孕 41 周」这种
// 剧情设定永远落不进状态里——阶段死锁在黄体期，因为没有任何工具能直接写 stage。
//
// 这里开的后门只对使用者本人开放。判据是消息的 role：模型看不见也伪造不了
// role，只能原文摘抄使用者说过的话。摘抄对不上就整个调用作废。
const FORCE_DIRECTIVE_TOOLS = new Set(['bsForceGestation', 'bsSetGestationLock']);
// bsAbortion 只有在真的会失去孩子时才要授权：着床前避孕成功不是流产，不该被门挡。
// 判据放在调用处（要读 chatState 才知道当前阶段），这里只登记「它可能需要门」。
const CONDITIONAL_DIRECTIVE_TOOLS = new Set(['bsAbortion']);
const FORCE_DIRECTIVE_MIN_LENGTH = 10;

// 摘抄核对前先抹掉标点与空白：模型常把「（妊娠诅咒：强制固定为……）」里的
// 全角括号、冒号换成半角，或者顺手删掉换行。这些差异不该判成伪造。
function normalizeDirectiveText(value) {
  return String(value || '')
    .replace(/\s+/gu, '')
    .replace(/[\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

/**
 * 核对 userDirective 是否真的出自使用者发言。
 *
 * recentMessages 为 null 表示拿不到聊天上下文（手动面板直接调用），
 * 此时视为使用者亲自操作，直接放行。
 */
function verifyUserDirective(recentMessages, directive) {
  const raw = String(directive || '').trim();
  if (!raw) return { ok: false, reason: 'userDirective 为空。' };
  if (raw.length < FORCE_DIRECTIVE_MIN_LENGTH) {
    return { ok: false, reason: `userDirective 过短（需至少 ${FORCE_DIRECTIVE_MIN_LENGTH} 字），无法核对。` };
  }
  if (!Array.isArray(recentMessages)) return { ok: true, reason: '' };

  const needle = normalizeDirectiveText(raw);
  if (!needle) return { ok: false, reason: 'userDirective 去除标点后为空。' };
  const hit = recentMessages.some((message) => (
    message?.role === 'user' && normalizeDirectiveText(message.text).includes(needle)
  ));
  if (!hit) {
    return {
      ok: false,
      reason: '未能在使用者发言中找到 userDirective 的原文，强制令被拒绝。'
        + '本工具仅供使用者亲自下达状态强制令时使用，不得由 AI 自行判断剧情需要而调用。',
    };
  }
  return { ok: true, reason: '' };
}

// 强制令一旦写进状态就该收手。但使用者那句话会在 contextSize 窗口里停留好几轮，
// 每轮追踪都看得到，模型会老实地反复调用同一个强制令——孕期于是被反复重置到
// 41 周，使用者推进的时间全部作废。这里按「角色＋强制令原文」记指纹，
// 同一条指令只认第一次。
function getForceDirectiveFingerprint(toolName, female, directive) {
  return `${toolName}|${female}|${normalizeDirectiveText(directive).slice(0, 120)}`;
}

function hasForceDirectiveApplied(character, fingerprint) {
  const history = character?.forceDirectiveHistory;
  return Array.isArray(history) && history.includes(fingerprint);
}

function recordForceDirective(chatState, female, fingerprint) {
  const character = chatState?.characters?.[female];
  if (!character) return;
  const history = Array.isArray(character.forceDirectiveHistory) ? character.forceDirectiveHistory : [];
  // 只留最近 20 条：够覆盖 contextSize 窗口，又不会让存档无限膨胀。
  character.forceDirectiveHistory = [...history, fingerprint].slice(-20);
}

function clearForceDirectiveHistory(chatState, female) {
  const character = chatState?.characters?.[female];
  if (character) delete character.forceDirectiveHistory;
}

function applyGatedToolCall(chatState, name, args) {
  if (name === 'bsForceGestation') return applyForceGestation(chatState, args);
  if (name === 'bsSetGestationLock') return applySetGestationLock(chatState, args);
  if (name === 'bsAbortion') return applyAbortion(chatState, args);
  return { applied: false, message: `Unknown gated tool ${name}.` };
}

/**
 * 这一次 bsAbortion 会不会真的让她失去孩子。
 *
 * 会失去 → 要使用者亲自下令；不会 → 放行。
 * 月经阶段且尚未着床是避孕成功，减胎（多胎里去掉一个、还剩胎儿）另算，
 * 这两种都不记流产经验，也就不该要授权。
 */
function abortionNeedsUserDirective(chatState, args) {
  const female = String(args?.female || '').trim();
  const profile = chatState?.characters?.[female]?.profile;
  if (!profile) return false;
  const stage = String(profile?.base?.stage || '');
  const fetuses = Array.isArray(profile?.pregnant?.fetuses) ? profile.pregnant.fetuses : [];

  // 避孕成功：还没进妊娠阶段。
  if (MENSTRUAL_STAGES.includes(stage) && fetuses.length === 0) return false;

  // 假孕期无胎儿：本来就没有孩子可失去，该走「请用 bsSetMenstrualPhases」那条提示，
  // 被门挡在前面会把一句有用的引导换成一句看不懂的拒绝。
  if (stage === '假孕期' && fetuses.length === 0) return false;

  // 减胎：拿掉一个之后还剩，孩子没全丢。
  const fetusIndex = args?.fetusIndex;
  if (Number.isInteger(fetusIndex) && fetusIndex >= 0 && fetusIndex < fetuses.length && fetuses.length > 1) {
    return false;
  }
  return true;
}

export function applyToolCall(chatState, call, options = {}) {
  const name = String(call?.name || '').trim();
  const args = normalizeToolCallArguments(call?.arguments);
  if (!name) return { applied: false, message: 'Empty tool call name.' };

  const gated = FORCE_DIRECTIVE_TOOLS.has(name)
    || (CONDITIONAL_DIRECTIVE_TOOLS.has(name) && abortionNeedsUserDirective(chatState, args));
  if (gated) {
    const female = String(args?.female || '').trim();
    const directive = String(args?.userDirective || '').trim();
    const verdict = verifyUserDirective(options.recentMessages ?? null, directive);
    if (!verdict.ok) {
      return { applied: false, message: `${name} rejected for ${female || '(empty)'}: ${verdict.reason}` };
    }
    // 解锁是下锁的反向操作，不该跟下锁共用一条指纹被去重挡住：
    // 使用者常拿同一句诅咒原话「解除刚才那个设定」。
    const isClearCall = name === 'bsSetGestationLock' && Boolean(args?.clear);
    // 流产不做指纹去重：她可以怀上第二次、再流一次，同一句原话必须还能用。
    // 去重是为了防「同一条强制令被反复套用」，而流产本身就是一次性事件，
    // 调用成功之后状态已经不满足前置（没有妊娠状态了），天然不会重复生效。
    const dedup = !CONDITIONAL_DIRECTIVE_TOOLS.has(name);
    const fingerprint = getForceDirectiveFingerprint(name, female, directive);
    if (dedup && !isClearCall && hasForceDirectiveApplied(chatState?.characters?.[female], fingerprint)) {
      return { applied: false, message: `${name} skipped for ${female}: 这条强制令已经生效过，不再重复套用。` };
    }
    const result = applyGatedToolCall(chatState, name, args);
    if (result?.applied && dedup) {
      // 解除之后旧指纹全部作废，同一句原话以后还能再下一次同样的强制令。
      if (isClearCall) clearForceDirectiveHistory(chatState, female);
      else recordForceDirective(chatState, female, fingerprint);
    }
    return result;
  }
  if (name === 'bsPassedTime') return applyPassedTime(chatState, args);
  if (name === 'bsWriteDiary') return applyWriteDiary(chatState, args);
  if (name === 'bsUpdateCharacterStatus') return applyCharacterStatus(chatState, args);
  if (name === 'bsAddWardrobeItem') return applyAddWardrobeItem(chatState, args);
  if (name === 'bsRemoveWardrobeItem') return applyRemoveWardrobeItem(chatState, args);
  if (name === 'bsChangeOutfit') return applyChangeOutfit(chatState, args);
  if (name === 'bsSetDescription') return applyDescription(chatState, args);
  if (name === 'bsSetCharacterPresence') return applySetCharacterPresence(chatState, args);
  if (name === 'bsUpdateExperience') return applyUpdateExperience(chatState, args);
  if (name === 'bsNameChild') return applyNameChild(chatState, args);
  if (name === 'bsRegisterSkillDefinition') return applyRegisterSkillDefinition(chatState, args);
  if (name === 'bsTrainSkill') return applyTrainSkill(chatState, args);
  if (name === 'bsUpdatePsychology') return applyUpdatePsychology(chatState, args);
  if (name === 'bsAddSperm') return applyAddSperm(chatState, args);
  if (name === 'bsDrainSperm') return applyDrainSperm(chatState, args);
  if (name === 'bsSetMenstrualPhases') return applySetMenstrualPhases(chatState, args);
  if (name === 'bsExcreteMetabolism') return applyExcreteMetabolism(chatState, args);
  if (name === 'bsAbortion') return applyAbortion(chatState, args);
  if (name === 'bsImplantEmbryo') return applyImplantEmbryo(chatState, args);
  if (name === 'bsRuptureMembranes') return applyRuptureMembranes(chatState, args);
  if (name === 'bsChildbirth') return applyChildbirth(chatState, args);
  if (name === 'bsMaternalFetalInteraction') return applyMaternalFetalInteraction(chatState, args);
  if (name === 'bsDebugInjectPregnancy') return applyDebugInjectPregnancy(chatState, args);
  if (name === 'bsDebugClearContainers') return applyDebugClearContainers(chatState, args);
  if (name === 'bsDebugSetGestationModifier') return applyDebugSetGestationModifier(chatState, args);
  if (name === 'bsDebugFetalActivity') return applyDebugFetalActivity(chatState, args);
  if (name === 'bsDebugSetProdromal') return applyDebugSetProdromal(chatState, args);
  return { applied: false, message: `Unsupported tool: ${name}` };
}

export function applyToolCallsResult(ctx, result, options = {}) {
  const settings = getSettings(ctx);
  const chatState = getChatState(ctx, settings);
  const toolCalls = Array.isArray(result?.tool_calls) ? result.tool_calls : [];
  const logs = [];
  // 强制令工具要核对使用者原话，才现取一次对话窗口；普通追踪轮次不必白跑一遍。
  // 条件门的工具也要取：漏了这一句，recentMessages 是 null，
  // verifyUserDirective 会当成「使用者亲自操作」直接放行——门等于没装。
  const needsDirectiveCheck = toolCalls.some((call) => {
    const callName = String(call?.name || '').trim();
    return FORCE_DIRECTIVE_TOOLS.has(callName) || CONDITIONAL_DIRECTIVE_TOOLS.has(callName);
  });
  let recentMessages = null;
  if (needsDirectiveCheck) {
    const endIndexExclusive = Number.isFinite(options.messageIndex) ? options.messageIndex + 1 : null;
    try {
      recentMessages = buildRecentMessages(ctx, settings, endIndexExclusive) || [];
    } catch (error) {
      // 取不到聊天记录时宁可挡下强制令，也不要放行一条没人核对过的。
      console.warn('[BS BioTracker] buildRecentMessages failed while verifying user directive', error);
      recentMessages = [];
    }
  }
  for (const call of toolCalls) {
    const normalizedCall = {
      name: String(call?.name || '').trim(),
      arguments: normalizeToolCallArguments(call?.arguments),
    };
    const appliedResult = applyToolCall(chatState, normalizedCall, { recentMessages });
    if (appliedResult?.notify?.text) globalThis.toastr?.info?.(appliedResult.notify.text, '[BS BioTracker]');
    logs.push({
      ...appliedResult,
      name: normalizedCall.name,
      arguments: cloneValue(normalizedCall.arguments),
    });
  }
  if (result?.scene_summary !== undefined) chatState.sceneSummary = String(result.scene_summary || '');
  chatState.lastRawResult = summarizeRawResult(result);
  chatState.lastOperationLogs = summarizeOperationLogs(logs);
  saveSettings(ctx);
  return { chatState, logs };
}
