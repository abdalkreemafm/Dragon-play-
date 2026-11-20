import {
  DragonSlotMeta,
  Duck,
  DuckAuraId,
  DuckGearId,
  DuckSkillMeta,
  DuckSkinId,
  EggItemType,
  FlipCoinPack,
  GameState,
  GodCard,
  GodOrder,
  GodPatronId,
  GridCell,
  LeagueTier,
  MarketListing,
  Rarity,
} from '../types/game';

export const RARITY_ORDER: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export const RARITY_STYLE: Record<
  Rarity,
  {
    label: string;
    labelAr: string;
    color: string;
    glow: string;
    border: string;
    bg: string;
    baseDmdPerHour: number;
    maxCapHours: number;
    basePower: number;
  }
> = {
  COMMON: {
    label: 'COMMON',
    labelAr: 'شائع',
    color: 'text-slate-300',
    glow: 'from-slate-500/20 via-amber-500/10 to-transparent',
    border: 'border-slate-600/60',
    bg: 'bg-slate-700/40',
    baseDmdPerHour: 0.4,
    maxCapHours: 6,
    basePower: 110,
  },
  UNCOMMON: {
    label: 'UNCOMMON',
    labelAr: 'غير شائع',
    color: 'text-emerald-400',
    glow: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/15',
    baseDmdPerHour: 0.85,
    maxCapHours: 7,
    basePower: 185,
  },
  RARE: {
    label: 'RARE',
    labelAr: 'نادر',
    color: 'text-sky-400',
    glow: 'from-sky-500/35 via-indigo-500/10 to-transparent',
    border: 'border-sky-500/50',
    bg: 'bg-sky-500/15',
    baseDmdPerHour: 1.6,
    maxCapHours: 8,
    basePower: 290,
  },
  EPIC: {
    label: 'EPIC',
    labelAr: 'ملحمي',
    color: 'text-purple-400',
    glow: 'from-purple-500/35 via-fuchsia-500/10 to-transparent',
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/15',
    baseDmdPerHour: 3.1,
    maxCapHours: 10,
    basePower: 440,
  },
  LEGENDARY: {
    label: 'LEGENDARY',
    labelAr: 'أسطوري',
    color: 'text-amber-400',
    glow: 'from-amber-400/40 via-orange-500/15 to-transparent',
    border: 'border-amber-400/60',
    bg: 'bg-amber-500/15',
    baseDmdPerHour: 6.0,
    maxCapHours: 12,
    basePower: 680,
  },
};

// Exact Feeding Cost Formula: 15 * (1.30)^(LVL - 1)
export function getFeedCost(level: number): number {
  return Math.round(15 * Math.pow(1.3, Math.max(0, level - 1)));
}

// Exact Star Customization Cost Formula: 10 * (1.35)^Custom_LVL (0 -> 10)
export function getCustomUpgradeCost(customLevel: number): number {
  return Math.round(10 * Math.pow(1.35, Math.max(0, customLevel)));
}

// Unified Diminishing Returns Law across ALL players:
// Slot 1 & 2 -> 100%, Slot 3 & 4 -> 75%, Slot 5..8 -> 50%
export function getSlotEfficiency(slotIndex: number | null): number {
  if (slotIndex === null || slotIndex < 0) return 0;
  if (slotIndex <= 1) return 1.0;
  if (slotIndex <= 3) return 0.75;
  return 0.5;
}

export function getDragonDmdPerHour(dragon: Duck): number {
  if (dragon.level < 5 || dragon.customLevel < 1 || dragon.slotIndex === null) return 0;
  const base = RARITY_STYLE[dragon.rarity].baseDmdPerHour;
  const customFactor = 1 + 0.12 * dragon.customLevel;
  const eff = getSlotEfficiency(dragon.slotIndex);
  return base * customFactor * eff;
}

export function getDragonMaxCapDmd(dragon: Duck): number {
  const rate = getDragonDmdPerHour(dragon);
  if (rate <= 0) return 0;
  return rate * RARITY_STYLE[dragon.rarity].maxCapHours;
}

export const DRAGON_SLOTS: DragonSlotMeta[] = [
  {
    slotIndex: 0,
    label: 'الخانة 1',
    efficiency: 1.0,
    efficiencyPct: 100,
    starCost: 0,
    requirementText: 'مفتوحة من البداية',
  },
  {
    slotIndex: 1,
    label: 'الخانة 2',
    efficiency: 1.0,
    efficiencyPct: 100,
    starCost: 0,
    requirementText: 'مفتوحة من البداية',
  },
  {
    slotIndex: 2,
    label: 'الخانة 3',
    efficiency: 0.75,
    efficiencyPct: 75,
    starCost: 0,
    requirementText: 'مفتوحة من البداية',
  },
  {
    slotIndex: 3,
    label: 'الخانة 4',
    efficiency: 0.75,
    efficiencyPct: 75,
    starCost: 30,
    requirementText: 'تنين واحد يصل إلى LVL 5',
  },
  {
    slotIndex: 4,
    label: 'الخانة 5',
    efficiency: 0.5,
    efficiencyPct: 50,
    starCost: 75,
    requirementText: 'إتمام أول ترقية تخصيص بالنجوم',
  },
  {
    slotIndex: 5,
    label: 'الخانة 6',
    efficiency: 0.5,
    efficiencyPct: 50,
    starCost: 150,
    requirementText: 'امتلاك تنينين من فئة نادر (RARE) فأعلى',
  },
  {
    slotIndex: 6,
    label: 'الخانة 7',
    efficiency: 0.5,
    efficiencyPct: 50,
    starCost: 300,
    requirementText: 'الفوز بـ 10 مواجهات في الحلبة',
  },
  {
    slotIndex: 7,
    label: 'الخانة 8',
    efficiency: 0.5,
    efficiencyPct: 50,
    starCost: 600,
    requirementText: 'تنين ملحمي مخصص + PASS LV.5',
  },
];

export function checkSlotUnlockEligibility(slotIndex: number, state: GameState) {
  const meta = DRAGON_SLOTS[slotIndex];
  if (!meta) return { metCondition: false, hasEnoughStars: false, canUnlock: false, reason: 'خانة غير صالحة' };
  if (slotIndex < state.unlockedSlots) {
    return { metCondition: true, hasEnoughStars: true, canUnlock: false, reason: 'مفتوحة بالفعل' };
  }
  if (slotIndex > state.unlockedSlots) {
    return {
      metCondition: false,
      hasEnoughStars: false,
      canUnlock: false,
      reason: `افتح الخانة ${slotIndex} أولاً`,
    };
  }

  let metCondition = true;
  if (slotIndex === 3) {
    metCondition = state.ducks.some((d) => d.level >= 5);
  } else if (slotIndex === 4) {
    metCondition = state.ducks.some((d) => d.customLevel >= 1);
  } else if (slotIndex === 5) {
    const rareOrHigher = state.ducks.filter((d) => RARITY_ORDER.indexOf(d.rarity) >= 2).length;
    metCondition = rareOrHigher >= 2;
  } else if (slotIndex === 6) {
    metCondition = state.league.wins >= 10;
  } else if (slotIndex === 7) {
    const passLv = Math.floor(state.battlePass.xp / 100) + 1;
    const hasCustomEpic = state.ducks.some(
      (d) => RARITY_ORDER.indexOf(d.rarity) >= 3 && d.customLevel >= 1
    );
    metCondition = hasCustomEpic && passLv >= 5;
  }

  const hasEnoughStars = state.stars >= meta.starCost;
  return {
    metCondition,
    hasEnoughStars,
    canUnlock: metCondition && hasEnoughStars,
    reason: !metCondition ? `المتطلب: ${meta.requirementText}` : !hasEnoughStars ? `تحتاج ${meta.starCost} ★` : 'جاهز للفتح',
  };
}

export interface StorePackage {
  id: string;
  title: string;
  desc: string;
  priceUsd: number;
  starsReward: number;
  energyReward: number;
  eggsReward: EggItemType[];
  legendaryDragon?: {
    name: string;
    skin: DuckSkinId;
    rarity: Rarity;
    gear: DuckGearId;
    aura: DuckAuraId;
  };
  tag: string;
}

export const STORE_PACKAGES: StorePackage[] = [
  {
    id: 'pkg_stars_starter',
    title: 'حزمة نجوم التخصيص',
    desc: '+80 نجمة ★ و +1,200 طاقة إطعام لتسريع الوصول للمرحلة 5',
    priceUsd: 1.99,
    starsReward: 80,
    energyReward: 1200,
    eggsReward: ['egg_3', 'egg_3'],
    tag: 'تقدّم سريع',
  },
  {
    id: 'pkg_rare_hatchery',
    title: 'صندوق البيض الملكي',
    desc: '+220 نجمة ★ و 4 بيضات نادرة مع معزز دمج فوري',
    priceUsd: 4.99,
    starsReward: 220,
    energyReward: 3500,
    eggsReward: ['egg_5', 'egg_5', 'egg_6', 'egg_4'],
    tag: 'الأكثر طلباً',
  },
  {
    id: 'pkg_legendary_dragon',
    title: 'صندوق التنين الإمبراطوري الأسطوري',
    desc: 'تنين أسطوري بمستوى 3 وتاج المجد + 400 نجمة ★ جاهز للهيمنة',
    priceUsd: 9.99,
    starsReward: 400,
    energyReward: 8000,
    eggsReward: ['egg_7', 'egg_love'],
    legendaryDragon: {
      name: 'التنين الإمبراطوري الأسطوري',
      skin: 'royal',
      rarity: 'LEGENDARY',
      gear: 'crown',
      aura: 'gold',
    },
    tag: 'عنصر أسطوري',
  },
];

export const WEEKEND_EVENTS = [
  {
    title: 'فعالية نهاية الأسبوع: مضاعفة نجوم الحلبة ×2',
    desc: 'كل فوز في الحلبة أو السباق يمنح ضعف مكافأة النجوم لتسريع التخصيص!',
    starBonusMult: 2,
  },
  {
    title: 'فعالية حُمّى التفقيس والطاقات',
    desc: 'مكافآت طاقة مضاعفة من المعبد وتسريع تفقيس بيض التنانين!',
    starBonusMult: 1,
  },
];

export const DUCK_GEAR_CATALOG: {
  id: DuckGearId;
  nameAr: string;
  icon: string;
  bonusDesc: string;
  powerBonus: number;
}[] = [
  { id: 'none', nameAr: 'طبيعي', icon: '🐉', bonusDesc: 'الشكل الفطري للتنين', powerBonus: 0 },
  { id: 'crown', nameAr: 'تاج الملوك', icon: '👑', bonusDesc: '+15 قوة و +5% هيبة', powerBonus: 15 },
  { id: 'helmet', nameAr: 'درع الحراشف', icon: '🪖', bonusDesc: '+25 صحة في الحلبة', powerBonus: 20 },
  { id: 'shades', nameAr: 'عدسة اللهب', icon: '🕶️', bonusDesc: '+6% ضربة حاسمة', powerBonus: 18 },
  { id: 'wings', nameAr: 'أجنحة العاصفة', icon: '🪽', bonusDesc: '+15% سرعة طيران', powerBonus: 24 },
];

export const DUCK_AURA_CATALOG: {
  id: DuckAuraId;
  nameAr: string;
  swatch: string;
  bonusDesc: string;
}[] = [
  { id: 'auto', nameAr: 'هالة العنصر', swatch: 'bg-sky-400', bonusDesc: 'تتبدل مع المستوى' },
  { id: 'gold', nameAr: 'لهيب ذهبي', swatch: 'bg-amber-400', bonusDesc: 'توهج إمبراطوري' },
  { id: 'flame', nameAr: 'جمر البركان', swatch: 'bg-rose-500', bonusDesc: 'طاقة هجومية' },
  { id: 'emerald', nameAr: 'زمرد السديم', swatch: 'bg-emerald-400', bonusDesc: 'حيوية وتجدد' },
];

export function getDuckCombatStats(
  duck: Duck,
  totalDmd: number,
  packJoined: boolean,
  packPower: number
) {
  const gearBonus = DUCK_GEAR_CATALOG.find((g) => g.id === (duck.gear ?? 'none'))?.powerBonus ?? 0;
  const customPowerBonus = duck.customLevel * 28;
  const dmdSynergyPct = Math.min(35, Math.round(totalDmd * 0.4));
  const packSynergyPct = packJoined ? 10 + Math.min(20, Math.floor(packPower / 30)) : 0;
  const totalMult = 1 + (dmdSynergyPct + packSynergyPct) / 100;

  const baseHp =
    240 +
    duck.level * 24 +
    duck.skillLevel * 20 +
    Math.round((duck.powerRating + gearBonus + customPowerBonus) * 0.35) +
    (duck.gear === 'helmet' ? 25 : 0);
  const maxHp = Math.round(baseHp * totalMult);

  const baseAtk =
    12 +
    duck.level * 2 +
    duck.skillLevel * 3 +
    Math.round((duck.powerRating + gearBonus + customPowerBonus) * 0.04);
  const attack = Math.round(baseAtk * totalMult);

  const baseCrit = duck.skin === 'gamer' || duck.skin === 'ninja' ? 34 : 20;
  const critChance = baseCrit + (duck.gear === 'shades' ? 6 : 0) + Math.min(10, duck.customLevel);

  return {
    maxHp,
    attack,
    critChance,
    dmdSynergyPct,
    packSynergyPct,
    totalPowerScore: Math.round(maxHp * 0.45 + attack * 8 + critChance * 2),
  };
}

export interface DuckEvolutionStage {
  level: number;
  titleAr: string;
  scaleClass: string;
  powerBonus: number;
  feedsRequired: number;
  ringColor: string;
  badgeText: string;
}

export const DUCK_EVOLUTION_LEVELS: DuckEvolutionStage[] = [
  {
    level: 1,
    titleAr: 'المرحلة 1 · فقس التنين',
    scaleClass: 'scale-[0.86]',
    powerBonus: 0,
    feedsRequired: 5,
    ringColor: 'border-slate-500/40 bg-slate-400/10',
    badgeText: 'I',
  },
  {
    level: 2,
    titleAr: 'المرحلة 2 · تنين يافع',
    scaleClass: 'scale-[0.92]',
    powerBonus: 25,
    feedsRequired: 7,
    ringColor: 'border-emerald-400/55 bg-emerald-400/15',
    badgeText: 'II',
  },
  {
    level: 3,
    titleAr: 'المرحلة 3 · تنين مقاتل',
    scaleClass: 'scale-[0.97]',
    powerBonus: 60,
    feedsRequired: 9,
    ringColor: 'border-sky-400/65 bg-sky-400/20',
    badgeText: 'III',
  },
  {
    level: 4,
    titleAr: 'المرحلة 4 · تنين مجنّح',
    scaleClass: 'scale-[1.02]',
    powerBonus: 110,
    feedsRequired: 12,
    ringColor: 'border-purple-400/75 bg-purple-400/25',
    badgeText: 'IV',
  },
  {
    level: 5,
    titleAr: 'المرحلة 5 · التنين البالغ ★',
    scaleClass: 'scale-[1.08]',
    powerBonus: 180,
    feedsRequired: 12,
    ringColor: 'border-amber-400/90 bg-amber-400/30',
    badgeText: 'V ★',
  },
];

export const DUCK_SKILLS: Record<DuckSkinId, DuckSkillMeta> = {
  aqua: {
    name: 'نَفَس المدّ السماوي',
    desc: 'موجة بحرية خاطفة تضرب الخصم وتزيد سرعة الطيران +40%.',
    type: 'TURBO',
    cooldownSec: 5,
    basePower: 38,
    passiveBonus: '+18% سرعة سباق وكومبو الإطعام',
  },
  lilac: {
    name: 'زئير السديم الليلكي',
    desc: 'طاقة بنفسجية تمتص صحة الخصم وتضاعف القوة الهجومية.',
    type: 'VAMPIRE',
    cooldownSec: 6,
    basePower: 46,
    passiveBonus: '+15% طاقة كومبو عند الإطعام',
  },
  classic: {
    name: 'لهب التنين الذهبي',
    desc: 'اندفاع ناري مباشر مع تسريع اندفاع السباق +35%.',
    type: 'TURBO',
    cooldownSec: 5,
    basePower: 28,
    passiveBonus: '+10% سرعة شحن الكومبو',
  },
  dj: {
    name: 'صاعقة الرعد الصوتي',
    desc: 'موجة رعدية تهز الحلبة وتضاعف الضربات الحرجة.',
    type: 'FRENZY',
    cooldownSec: 6,
    basePower: 34,
    passiveBonus: '+15% مدة وضع الحماس',
  },
  gamer: {
    name: 'مخلب البرق الحرج',
    desc: 'هجوم دقيق يطلق 3 ضربات حاسمة متتالية على الخصم.',
    type: 'BURST',
    cooldownSec: 6,
    basePower: 42,
    passiveBonus: '+12% فرصة ضربة حاسمة',
  },
  cupid: {
    name: 'شعاع الأثير الممتص',
    desc: 'يسحب طاقة الخصم ويعالج تنينك أثناء القتال.',
    type: 'VAMPIRE',
    cooldownSec: 7,
    basePower: 30,
    passiveBonus: '+25% قلوب إضافية عند الإطعام',
  },
  pumpkin: {
    name: 'درع الجحيم المشتعل',
    desc: 'درع ناري يحجب هجمة الخصم القادمة ويرد الضرر.',
    type: 'SHIELD',
    cooldownSec: 7,
    basePower: 32,
    passiveBonus: 'درع مقاومة قوي في الحلبة',
  },
  skeleton: {
    name: 'زئير العظام الأثري',
    desc: 'ضربة تخترق الدفاعات وتُحدث ضرراً مضاعفاً.',
    type: 'BURST',
    cooldownSec: 6,
    basePower: 44,
    passiveBonus: '+15% ضرر قتالي',
  },
  bride: {
    name: 'بريق اللؤلؤ السماوي',
    desc: 'يعيد التوازن والصحة ويمنح سرعة طيران متقدمة.',
    type: 'VAMPIRE',
    cooldownSec: 6,
    basePower: 33,
    passiveBonus: '+15% كفاءة حلبة وسباق',
  },
  cool: {
    name: 'عاصفة الصقيع الأزرق',
    desc: 'انطلاق جليدي خارق السرعة يتجاوز خصوم السباق.',
    type: 'TURBO',
    cooldownSec: 5,
    basePower: 36,
    passiveBonus: '+18% سرعة طيران',
  },
  pharaoh: {
    name: 'درع رمال الفراعنة',
    desc: 'درع رملي حصين لمدة 3.5 ثوانٍ مع صاعقة ذهبية.',
    type: 'SHIELD',
    cooldownSec: 7,
    basePower: 46,
    passiveBonus: '+20% مكافآت الطاقة والذهب',
  },
  royal: {
    name: 'مرسوم التنين الإمبراطوري',
    desc: 'عاصفة ملكية مزدوجة ترفع ضرر الضربات إلى الذروة.',
    type: 'FRENZY',
    cooldownSec: 6,
    basePower: 52,
    passiveBonus: '+20% نقاط خبرة ومكافآت',
  },
  coffee: {
    name: 'انفجار الحمم البركانية',
    desc: 'تسريع جنوني لضربات المخالب لمدة 4 ثوانٍ.',
    type: 'TURBO',
    cooldownSec: 5,
    basePower: 35,
    passiveBonus: '+20% سرعة شحن المهارات',
  },
  ninja: {
    name: 'ظلّ التنين الصامت',
    desc: 'هجوم مباغت بنسبة حرج 100% لا يمكن صده.',
    type: 'BURST',
    cooldownSec: 5.5,
    basePower: 48,
    passiveBonus: '+20% فرصة ضربة حاسمة',
  },
};

export interface LeagueTierMeta {
  tier: LeagueTier;
  nameAr: string;
  minPoints: number;
  color: string;
  bg: string;
  border: string;
  dailyCorn: number;
  dailyStars: number;
  dailyGold: number;
}

export const LEAGUE_TIERS: LeagueTierMeta[] = [
  {
    tier: 'BRONZE',
    nameAr: 'الدوري البرونزي',
    minPoints: 0,
    color: 'text-orange-300',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    dailyCorn: 1200,
    dailyStars: 8,
    dailyGold: 5,
  },
  {
    tier: 'SILVER',
    nameAr: 'الدوري الفضي',
    minPoints: 150,
    color: 'text-slate-200',
    bg: 'bg-slate-400/15',
    border: 'border-slate-400/40',
    dailyCorn: 2500,
    dailyStars: 16,
    dailyGold: 10,
  },
  {
    tier: 'GOLD',
    nameAr: 'الدوري الذهبي',
    minPoints: 400,
    color: 'text-amber-300',
    bg: 'bg-amber-400/15',
    border: 'border-amber-400/50',
    dailyCorn: 5000,
    dailyStars: 28,
    dailyGold: 20,
  },
  {
    tier: 'DIAMOND',
    nameAr: 'الدوري الماسي',
    minPoints: 800,
    color: 'text-sky-300',
    bg: 'bg-sky-400/15',
    border: 'border-sky-400/50',
    dailyCorn: 9500,
    dailyStars: 45,
    dailyGold: 35,
  },
  {
    tier: 'LEGENDARY',
    nameAr: 'الدوري الأسطوري',
    minPoints: 1400,
    color: 'text-rose-300',
    bg: 'bg-rose-500/15',
    border: 'border-rose-400/60',
    dailyCorn: 18000,
    dailyStars: 80,
    dailyGold: 75,
  },
];

export function getLeagueMeta(points: number): LeagueTierMeta {
  let current = LEAGUE_TIERS[0];
  for (const tier of LEAGUE_TIERS) {
    if (points >= tier.minPoints) current = tier;
  }
  return current;
}

export interface BattlePassLevelReward {
  level: number;
  xpRequired: number;
  freeLabel: string;
  freeType: 'corn' | 'stars' | 'eggs' | 'boost';
  freeAmount: number;
  premiumLabel: string;
  premiumType: 'stars' | 'gold' | 'duck' | 'boost';
  premiumAmount: number;
}

export const BATTLE_PASS_LEVELS: BattlePassLevelReward[] = Array.from({ length: 15 }, (_, i) => {
  const lv = i + 1;
  return {
    level: lv,
    xpRequired: lv * 100,
    freeLabel: lv % 3 === 0 ? `+${lv * 4} ★` : lv % 2 === 0 ? `+${lv * 3} بيضة` : `+${(lv * 600).toLocaleString()} طاقة`,
    freeType: lv % 3 === 0 ? 'stars' : lv % 2 === 0 ? 'eggs' : 'corn',
    freeAmount: lv % 3 === 0 ? lv * 4 : lv % 2 === 0 ? lv * 3 : lv * 600,
    premiumLabel:
      lv === 15
        ? 'تنين أسطوري 👑'
        : lv % 4 === 0
          ? '+2 معزز دمج ⚡'
          : lv % 2 === 0
            ? `+${lv * 8} ذهب 💎`
            : `+${lv * 10} ★`,
    premiumType: lv === 15 ? 'duck' : lv % 4 === 0 ? 'boost' : lv % 2 === 0 ? 'gold' : 'stars',
    premiumAmount: lv === 15 ? 1 : lv % 4 === 0 ? 2 : lv % 2 === 0 ? lv * 8 : lv * 10,
  };
});

export interface EggItemMeta {
  id: EggItemType;
  name: string;
  tier: number;
  next: EggItemType | null;
  desc: string;
  cornValue: number;
}

export const EGG_ITEM_META: Record<EggItemType, EggItemMeta> = {
  egg_1: {
    id: 'egg_1',
    name: 'بيضة تنين [1]',
    tier: 1,
    next: 'egg_2',
    desc: 'بيضة تنين بدائية. ادمج اثنتين للحصول على بيضة مدارية.',
    cornValue: 20,
  },
  egg_2: {
    id: 'egg_2',
    name: 'بيضة تنين [2]',
    tier: 2,
    next: 'egg_3',
    desc: 'بيضة بحرية لامعة. ادمجها لترقية عنصر التنين.',
    cornValue: 45,
  },
  egg_3: {
    id: 'egg_3',
    name: 'بيضة السديم [3]',
    tier: 3,
    next: 'egg_4',
    desc: 'بيضة السديم البنفسجية. اجمعها لقرابين المعبد.',
    cornValue: 100,
  },
  egg_4: {
    id: 'egg_4',
    name: 'بيضة الزمرد [4]',
    tier: 4,
    next: 'egg_5',
    desc: 'بيضة تنين الغابات المشتعلة.',
    cornValue: 220,
  },
  egg_5: {
    id: 'egg_5',
    name: 'بيضة الشمس [5]',
    tier: 5,
    next: 'egg_6',
    desc: 'بيضة شمسية مشحونة بالطاقة الذهبية.',
    cornValue: 480,
  },
  egg_6: {
    id: 'egg_6',
    name: 'بيضة الياقوت [6]',
    tier: 6,
    next: 'egg_7',
    desc: 'بيضة الياقوت القرمزية النادرة.',
    cornValue: 950,
  },
  egg_7: {
    id: 'egg_7',
    name: 'بيضة الكريستال [7]',
    tier: 7,
    next: 'egg_love',
    desc: 'بيضة الكريستال السماوية المطلقة.',
    cornValue: 2000,
  },
  egg_love: {
    id: 'egg_love',
    name: 'بيضة القلب الأسطورية ❤️',
    tier: 8,
    next: null,
    desc: 'أندر بيضة تنين! تمنح طاقة عالية ومكافآت نجوم عند التسليم.',
    cornValue: 4500,
  },
  grapes: {
    id: 'grapes',
    name: 'جوهرة الطاقة [1]',
    tier: 1,
    next: 'chalice',
    desc: 'مورد من صندوق الكنوز. ادمجها لصنع الكأس الإمبراطوري.',
    cornValue: 60,
  },
  chalice: {
    id: 'chalice',
    name: 'الكأس الإمبراطوري [2]',
    tier: 2,
    next: 'cornucopia',
    desc: 'كأس مشتعل بالطاقة. ادمجه لصنع قرن الوفرة.',
    cornValue: 180,
  },
  cornucopia: {
    id: 'cornucopia',
    name: 'قرن الوفرة [3]',
    tier: 3,
    next: 'feast',
    desc: 'قرن الوفرة المليء بجواهر التنانين.',
    cornValue: 480,
  },
  feast: {
    id: 'feast',
    name: 'وليمة التنانين [4]',
    tier: 4,
    next: null,
    desc: 'أثمن قربان يطلبه حراس المعبد في البطولات!',
    cornValue: 1200,
  },
  chest: {
    id: 'chest',
    name: 'صندوق الكنوز',
    tier: 0,
    next: null,
    desc: 'افتحه للحصول على جواهر التنين ومعززات الدمج.',
    cornValue: 300,
  },
};

export const SKIN_CATALOG: Record<DuckSkinId, { name: string; title: string }> = {
  aqua: { name: 'تنين البحار السماوي', title: 'Aqua Dragon' },
  lilac: { name: 'تنين السديم الليلكي', title: 'Lilac Dragon' },
  classic: { name: 'تنين النار الذهبي', title: 'Solar Dragon' },
  dj: { name: 'تنين الرعد الصوتي', title: 'Storm Dragon' },
  cupid: { name: 'تنين القلوب الوردية', title: 'Aether Dragon' },
  pumpkin: { name: 'تنين الجحيم اليقطيني', title: 'Inferno Dragon' },
  gamer: { name: 'تنين الكريستال الرقمي', title: 'Cyber Dragon' },
  skeleton: { name: 'تنين العظام الأثري', title: 'Bone Dragon' },
  bride: { name: 'تنين اللؤلؤ الأبيض', title: 'Pearl Dragon' },
  cool: { name: 'تنين الصقيع الأزرق', title: 'Frost Dragon' },
  pharaoh: { name: 'تنين الرمال الفرعوني', title: 'Sand Dragon' },
  royal: { name: 'التنين الإمبراطوري الملكي', title: 'Emperor Dragon' },
  coffee: { name: 'تنين البركان الداكن', title: 'Magma Dragon' },
  ninja: { name: 'تنين الظل الليلي', title: 'Shadow Dragon' },
};

export const GOD_PATRONS: Record<GodPatronId, { name: string; title: string; color: string }> = {
  anubis: { name: 'أنوبيس', title: 'حارس المعبد', color: '#f59e0b' },
  horus: { name: 'حورس', title: 'سيد السماء', color: '#38bdf8' },
  dionysus: { name: 'ديونيسوس', title: 'سيد الولائم', color: '#a855f7' },
  bastet: { name: 'باستت', title: 'حامية الكنوز', color: '#ec4899' },
  zeus: { name: 'زيوس', title: 'سيد البرق', color: '#eab308' },
};

export function createInitialGrid(): GridCell[] {
  const lockedIndices = new Set([0, 7, 48, 55]);
  const presetItems: Partial<Record<number, EggItemType>> = {
    1: 'egg_2',
    2: 'egg_1',
    3: 'egg_3',
    4: 'egg_2',
    5: 'egg_5',
    6: 'egg_3',
    8: 'egg_1',
    9: 'egg_2',
    10: 'egg_3',
    11: 'egg_1',
    12: 'egg_4',
    13: 'egg_2',
    14: 'egg_6',
    15: 'egg_1',
    16: 'egg_3',
    17: 'egg_2',
    18: 'egg_4',
    19: 'egg_love',
    20: 'egg_5',
    21: 'chalice',
    22: 'egg_2',
    23: 'egg_3',
    24: 'egg_1',
    25: 'egg_4',
    26: 'egg_3',
    27: 'egg_5',
    28: 'egg_3',
    29: 'grapes',
    30: 'egg_6',
    31: 'egg_2',
    32: 'egg_2',
    33: 'egg_5',
    34: 'egg_1',
    35: 'egg_4',
    36: 'cornucopia',
    37: 'egg_3',
    38: 'egg_4',
    39: 'egg_2',
    41: 'egg_3',
    42: 'egg_5',
    43: 'chalice',
    44: 'egg_2',
    45: 'egg_4',
    46: 'chest',
    49: 'egg_1',
    50: 'egg_6',
    51: 'egg_2',
    52: 'egg_1',
    53: 'egg_3',
    54: 'egg_4',
  };

  return Array.from({ length: 56 }, (_, index) => ({
    index,
    locked: lockedIndices.has(index),
    item: lockedIndices.has(index) ? null : presetItems[index] ?? null,
  }));
}

export function createRandomGodOrder(indexSeed = 0): GodOrder {
  const patrons: GodPatronId[] = ['anubis', 'horus', 'dionysus', 'bastet', 'zeus'];
  const wants: { item: EggItemType; reward: number; pts: number }[] = [
    { item: 'egg_4', reward: 180, pts: 5 },
    { item: 'egg_5', reward: 360, pts: 5 },
    { item: 'egg_6', reward: 750, pts: 10 },
    { item: 'chalice', reward: 280, pts: 5 },
    { item: 'cornucopia', reward: 650, pts: 10 },
    { item: 'feast', reward: 1400, pts: 15 },
    { item: 'egg_love', reward: 2500, pts: 20 },
  ];
  const godId = patrons[(indexSeed + Math.floor(Math.random() * patrons.length)) % patrons.length];
  const pick = wants[Math.floor(Math.random() * wants.length)];
  return {
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    godId,
    name: GOD_PATRONS[godId].name,
    wantedItem: pick.item,
    cornReward: pick.reward,
    trophyPoints: pick.pts,
  };
}

export function createInitialMarketListings(): MarketListing[] {
  return [
    {
      id: 'mkt_1',
      duckName: 'تنين الصقيع الأزرق XL',
      skin: 'cool',
      rarity: 'UNCOMMON',
      level: 3,
      xl: true,
      dmd: 0,
      seller: 'CAMA_9L',
      cornPrice: 2400,
      starPrice: 35,
      timeLeftSec: 22,
      isUserBid: false,
      soldStatus: 'ACTIVE',
    },
    {
      id: 'mkt_2',
      duckName: 'تنين العظام الأثري',
      skin: 'skeleton',
      rarity: 'UNCOMMON',
      level: 4,
      dmd: 0,
      seller: 'NUBUBIICA',
      cornPrice: 3100,
      starPrice: 42,
      timeLeftSec: 28,
      isUserBid: false,
      soldStatus: 'ACTIVE',
    },
    {
      id: 'mkt_3',
      duckName: 'تنين الظل الليلي',
      skin: 'ninja',
      rarity: 'RARE',
      level: 4,
      dmd: 0,
      seller: 'MULTI_BOSS',
      cornPrice: 5400,
      starPrice: 68,
      timeLeftSec: 36,
      isUserBid: false,
      soldStatus: 'ACTIVE',
    },
    {
      id: 'mkt_4',
      duckName: 'تنين البحار السماوي',
      skin: 'aqua',
      rarity: 'RARE',
      level: 4,
      dmd: 0,
      seller: 'VIP_DRAGON',
      cornPrice: 6200,
      starPrice: 75,
      timeLeftSec: 42,
      isUserBid: false,
      soldStatus: 'ACTIVE',
    },
    {
      id: 'mkt_5',
      duckName: 'تنين السديم الليلكي',
      skin: 'lilac',
      rarity: 'EPIC',
      level: 5,
      dmd: 0,
      seller: 'SOLAFEIFEI',
      cornPrice: 14500,
      starPrice: 135,
      timeLeftSec: 52,
      isUserBid: false,
      soldStatus: 'ACTIVE',
    },
    {
      id: 'mkt_6',
      duckName: 'التنين الإمبراطوري الملكي',
      skin: 'royal',
      rarity: 'LEGENDARY',
      level: 5,
      xl: true,
      dmd: 0,
      seller: 'ZLOYPHILIPP',
      cornPrice: 32000,
      starPrice: 280,
      timeLeftSec: 60,
      isUserBid: false,
      soldStatus: 'ACTIVE',
    },
  ];
}

export function createInitialGameState(): GameState {
  // 3 Open Default Slots occupied by 3 starter dragons (LVL 1..4) — DMD starts at 0 until LVL 5 + Custom_LVL >= 1!
  const starterDragons: Duck[] = [
    {
      id: 'dragon_aqua_1',
      name: 'تنين البحار السماوي',
      skin: 'aqua',
      rarity: 'RARE',
      level: 1,
      maxLevel: 5,
      customLevel: 0,
      dmd: 0,
      dmdStored: 0,
      slotIndex: 0,
      feedCost: getFeedCost(1), // 15
      feedsProgress: 0,
      feedsRequired: 5,
      staked: false,
      stakeRatePerHour: 0,
      skillLevel: 1,
      powerRating: 240,
      unlockedAt: Date.now() - 95000000,
    },
    {
      id: 'dragon_lilac_1',
      name: 'تنين السديم الليلكي',
      skin: 'lilac',
      rarity: 'EPIC',
      level: 3,
      maxLevel: 5,
      customLevel: 0,
      dmd: 0,
      dmdStored: 0,
      slotIndex: 1,
      feedCost: getFeedCost(3), // 25
      feedsProgress: 3,
      feedsRequired: 9,
      staked: false,
      stakeRatePerHour: 0,
      skillLevel: 2,
      powerRating: 380,
      unlockedAt: Date.now() - 90000000,
    },
    {
      id: 'dragon_solar_1',
      name: 'تنين النار الذهبي',
      skin: 'classic',
      rarity: 'COMMON',
      level: 4,
      maxLevel: 5,
      customLevel: 0,
      dmd: 0,
      dmdStored: 0,
      slotIndex: 2,
      feedCost: getFeedCost(4), // 33
      feedsProgress: 8,
      feedsRequired: 12,
      staked: false,
      stakeRatePerHour: 0,
      skillLevel: 2,
      powerRating: 210,
      unlockedAt: Date.now() - 86400000,
    },
  ];

  const godCards: GodCard[] = [
    {
      id: 'god_harvest',
      godKey: 'harvest',
      name: 'بركة الحصاد',
      subtitle: 'توفير 25% طاقة إطعام',
      bonusDesc: 'يرد لك 25% من حبوب الطاقة عند إطعام التنانين تلقائياً.',
      goldCost: 40,
      starCost: 45,
      owned: false,
      active: false,
    },
    {
      id: 'god_hype',
      godKey: 'hype',
      name: 'بركة الزخم',
      subtitle: 'مكافآت البطولة +50%',
      bonusDesc: 'يرفع نقاط البطولة الكبرى والتقدم بنسبة +50%.',
      goldCost: 45,
      starCost: 50,
      owned: false,
      active: false,
    },
    {
      id: 'god_fortune',
      godKey: 'fortune',
      name: 'بركة الحظ المضاعف',
      subtitle: 'قفزة تفقيس +20%',
      bonusDesc: 'فرصة 20% لترقية بيض التنانين مستويين دفعة واحدة عند الدمج!',
      goldCost: 70,
      starCost: 75,
      owned: false,
      active: false,
    },
    {
      id: 'god_plunder',
      godKey: 'plunder',
      name: 'بركة الغنائم',
      subtitle: 'نجوم وطاقة المعارك +35%',
      bonusDesc: 'يزيد غنائم الحلبة وصناديق الكنوز بنسبة +35% دون المساس بسقف DMD.',
      goldCost: 90,
      starCost: 90,
      owned: false,
      active: false,
    },
  ];

  const flipCoins: FlipCoinPack[] = [
    {
      id: 'fc_halloween',
      name: 'فصيلة الجحيم',
      collectionName: 'فصيلة الجحيم',
      count: 3,
      totalSkins: 6,
      unlockedSkins: ['pumpkin'],
      possibleSkins: ['pumpkin', 'skeleton', 'ninja', 'cupid', 'cool', 'pharaoh'],
    },
    {
      id: 'fc_royal',
      name: 'التاج الإمبراطوري',
      collectionName: 'التاج الإمبراطوري',
      count: 2,
      totalSkins: 5,
      unlockedSkins: ['lilac'],
      possibleSkins: ['lilac', 'royal', 'bride', 'pharaoh', 'classic'],
    },
    {
      id: 'fc_festival',
      name: 'تنانين العناصر',
      collectionName: 'تنانين العناصر',
      count: 6,
      totalSkins: 6,
      unlockedSkins: ['aqua', 'dj', 'gamer'],
      possibleSkins: ['aqua', 'dj', 'gamer', 'cool', 'cupid', 'coffee'],
    },
    {
      id: 'fc_coffee',
      name: 'رماد البركان',
      collectionName: 'رماد البركان',
      count: 2,
      totalSkins: 3,
      unlockedSkins: [],
      possibleSkins: ['coffee', 'classic', 'cool'],
    },
  ];

  return {
    username: 'DRAGON_TAMER',
    corn: 2400, // Balanced starting Energy for LVL 1..5 progression
    stars: 35, // Enough to test Star Customization once reaching LVL 5 or save for Slot 4 (30 ★)
    duckGold: 15,
    dmdTotal: 0, // Strictly 0 until a dragon reaches LVL 5 AND Custom_LVL >= 1!
    ducks: starterDragons,
    activeDuckIndex: 0,
    unlockedSlots: 3, // 3 default open slots out of 8
    treasury: {
      reserveUsd: 124.5, // Transparent Reserve Treasury ledger (50% of revenue)
      opsUsd: 124.5, // 50% Operations & Dev ledger
      storeRevenueUsd: 210.0,
      adRevenueUsd: 39.0,
      adsWatchedToday: 0,
      maxAdsPerDay: 5,
      totalPurchases: 0,
    },
    weekendEventIndex: 0,
    grid: createInitialGrid(),
    eggQueue: [
      'egg_1',
      'egg_2',
      'egg_1',
      'egg_3',
      'egg_1',
      'egg_2',
      'grapes',
      'egg_4',
      'egg_2',
      'egg_1',
      'egg_3',
      'chalice',
    ],
    godOrders: [
      {
        id: 'ord_init_1',
        godId: 'anubis',
        name: 'أنوبيس',
        wantedItem: 'egg_5',
        cornReward: 360,
        trophyPoints: 5,
      },
      {
        id: 'ord_init_2',
        godId: 'horus',
        name: 'حورس',
        wantedItem: 'egg_6',
        cornReward: 750,
        trophyPoints: 10,
      },
      {
        id: 'ord_init_3',
        godId: 'dionysus',
        name: 'ديونيسوس',
        wantedItem: 'cornucopia',
        cornReward: 650,
        trophyPoints: 10,
      },
    ],
    godCards,
    dailyTasks: [
      {
        id: 'dt_login',
        title: 'تسجيل الدخول اليومي لعالم التنانين',
        progress: 1,
        target: 1,
        rewardStars: 6,
        rewardEnergy: 300,
        claimed: false,
        actionLabel: 'استلام المكافأة',
      },
      {
        id: 'dt_feed',
        title: 'أطعم التنانين 25 مرة',
        progress: 5,
        target: 25,
        rewardStars: 10,
        rewardEnergy: 600,
        claimed: false,
        actionTab: 'DUCKS',
        actionLabel: 'إطعام',
      },
      {
        id: 'dt_merge',
        title: 'ادمج 15 بيضة تنين',
        progress: 3,
        target: 15,
        rewardStars: 12,
        rewardEnergy: 800,
        claimed: false,
        actionTab: 'EGGS',
        actionLabel: 'إلى البيض',
      },
      {
        id: 'dt_errands',
        title: 'سلّم 5 قرابين لحراس المعبد',
        progress: 1,
        target: 5,
        rewardStars: 14,
        rewardEnergy: 950,
        claimed: false,
        actionTab: 'EGGS',
        actionLabel: 'إلى المعبد',
      },
      {
        id: 'dt_claims',
        title: 'اربح 3 مواجهات في الحلبة',
        progress: 0,
        target: 3,
        rewardStars: 18,
        rewardEnergy: 1200,
        claimed: false,
        actionTab: 'ARENA',
        actionLabel: 'إلى الحلبة',
      },
    ],
    claimedDailyLevelRewards: [],
    claimedChallengeRewards: [],
    claimedAchievements: [],
    claimedSocials: [],
    claimedHeartMilestones: [],
    claimedTreasureSteps: [],
    claimedHonorPacks: [],
    usedPromoCodes: [],
    flipCoins,
    unlockedSkins: ['aqua', 'lilac', 'classic', 'dj', 'gamer', 'cupid'],
    marketListings: createInitialMarketListings(),
    pack: {
      joined: false,
      packName: 'عش التنانين (Draco)',
      power: 446,
      members: 14,
      treasuryCorn: 18500,
      messages: [
        { id: 'm1', sender: 'DRAGON_LEADER', text: 'مرحباً! طوروا تنانينكم للمستوى 5 وابدأوا تخصيص النجوم!', time: '14:20' },
        { id: 'm2', sender: 'FERMER_DRACO', text: 'الخانة 4 تفتح بعد وصول تنين واحد لـ LVL 5!', time: '14:22' },
      ],
    },
    wallet: {
      connected: false,
      address: 'UQDragon...DMD99',
      gram: 0,
    },
    tournament: {
      score: 12,
      claimedMilestones: [],
      resetSeconds: 5180,
    },
    league: {
      points: 120,
      wins: 2,
      racesWon: 1,
      winStreak: 1,
      dailyClaimed: false,
    },
    battlePass: {
      xp: 140,
      premiumUnlocked: false,
      claimedFree: [],
      claimedPremium: [],
    },
    stats: {
      totalFeeds: 0,
      totalMerges: 0,
      totalErrands: 0,
      totalTasksClaimed: 0,
      totalEggsHatched: 0,
      totalDucksMerged: 0,
      hearts: 950,
      medals: 120,
      honorLetters: 18,
      coinsOfChange: 2,
      keys: 1,
      wheelSpins: 0,
      traderDeals: 0,
      dailyPassDay: 1,
      dailyPassClaimedToday: false,
      autoMergeBoosters: 2,
      hammerBoosters: 1,
    },
    autoMergeUnlocked: true,
    smartSellPrice: 1200,
    smartBuyPrice: 800,
    muted: false,
    lastSavedAt: Date.now(),
  };
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return Math.floor(num).toLocaleString();
}

export function formatTimer(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}
