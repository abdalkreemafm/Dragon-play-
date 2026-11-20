import React, { useState, useRef, useEffect } from 'react';
import {
  Crown,
  Gift,
  Lock,
  Sparkles,
  Clock,
  ArrowRight,
  Plus,
  Check,
  TrendingUp,
  Coins,
  Flame,
  Zap,
  Swords,
  HelpCircle,
  Palette,
  X,
  PlayCircle,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { Duck, DuckAuraId, DuckGearId, GameState, Rarity } from '../../types/game';
import {
  BATTLE_PASS_LEVELS,
  DRAGON_SLOTS,
  DUCK_AURA_CATALOG,
  DUCK_EVOLUTION_LEVELS,
  DUCK_GEAR_CATALOG,
  DUCK_SKILLS,
  RARITY_ORDER,
  RARITY_STYLE,
  checkSlotUnlockEligibility,
  formatTimer,
  getCustomUpgradeCost,
  getDragonDmdPerHour,
  getDragonMaxCapDmd,
  getDuckCombatStats,
  getFeedCost,
  getSlotEfficiency,
} from '../../data/gameData';
import { CornIcon, DmdIcon, DragonIllustration, StarIcon } from '../art/DuckArt';
import { SanctuaryBackdrop } from '../art/SceneBackdrops';
import { soundFX } from '../../utils/sound';

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  text: string;
  isCrit?: boolean;
}

interface DucksTabProps {
  state: GameState;
  onSelectDuck: (index: number) => void;
  onFeedDuck: (
    duckId: string,
    comboMultiplier: number,
    isCrit: boolean
  ) => { gainedEnergyBonus: number; leveledUp: boolean } | null;
  onUpgradeStarCustomization: (duckId: string) => void;
  onCollectDragonDmd: (duckId: string) => void;
  onUpgradeDuckSkill: (duckId: string) => void;
  onCustomizeDuck: (duckId: string, gear: DuckGearId, aura: DuckAuraId) => void;
  onUnlockSlot: (slotIndex: number) => void;
  onAssignSlot: (duckId: string, slotIndex: number) => void;
  onMergeDucks: (duckIds: string[]) => void;
  onWatchRewardedAd: (kind: 'energy' | 'stars' | 'eggs') => void;
  onOpenDuckerPass: () => void;
  onOpenDailyPass: () => void;
  onOpenDailyTasks: () => void;
  onOpenTreasures: () => void;
  onGoToArena: () => void;
  onClaimTimedBonus: () => void;
  timedBonusReadyIn: number;
}

export const DucksTab: React.FC<DucksTabProps> = ({
  state,
  onSelectDuck,
  onFeedDuck,
  onUpgradeStarCustomization,
  onCollectDragonDmd,
  onUpgradeDuckSkill,
  onCustomizeDuck,
  onUnlockSlot,
  onAssignSlot,
  onMergeDucks,
  onWatchRewardedAd,
  onOpenDuckerPass,
  onOpenDailyPass,
  onOpenDailyTasks,
  onOpenTreasures,
  onGoToArena,
  onClaimTimedBonus,
  timedBonusReadyIn,
}) => {
  const [subView, setSubView] = useState<'MAIN' | 'MERGE' | 'STAKE'>('MAIN');
  const [showDmdGuide, setShowDmdGuide] = useState(false);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [cardShake, setCardShake] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [feverSecLeft, setFeverSecLeft] = useState(0);
  const [evolvedBurst, setEvolvedBurst] = useState(false);
  const [mergeSelectedIds, setMergeSelectedIds] = useState<string[]>([]);
  const [selectedLockedSlot, setSelectedLockedSlot] = useState<number | null>(null);

  const particleIdRef = useRef(0);
  const lastTapRef = useRef(0);

  const activeDuck: Duck | undefined = state.ducks[state.activeDuckIndex] ?? state.ducks[0];
  const rarityStyle = activeDuck ? RARITY_STYLE[activeDuck.rarity] : RARITY_STYLE.COMMON;
  const isMaxLevel = activeDuck ? activeDuck.level >= activeDuck.maxLevel : false;
  const duckSkill = activeDuck ? DUCK_SKILLS[activeDuck.skin] : DUCK_SKILLS.aqua;
  const currentEvo = activeDuck
    ? DUCK_EVOLUTION_LEVELS[Math.max(0, Math.min(4, activeDuck.level - 1))]
    : DUCK_EVOLUTION_LEVELS[0];
  const nextEvo = activeDuck && activeDuck.level < 5 ? DUCK_EVOLUTION_LEVELS[activeDuck.level] : null;

  const [draftGear, setDraftGear] = useState<DuckGearId>(activeDuck?.gear ?? 'none');
  const [draftAura, setDraftAura] = useState<DuckAuraId>(activeDuck?.aura ?? 'auto');

  useEffect(() => {
    if (activeDuck) {
      setDraftGear(activeDuck.gear ?? 'none');
      setDraftAura(activeDuck.aura ?? 'auto');
    }
  }, [activeDuck]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastTapRef.current > 1800 && comboCount > 0) {
        setComboCount(0);
      }
      setFeverSecLeft((s) => Math.max(0, s - 0.25));
    }, 250);
    return () => clearInterval(timer);
  }, [comboCount]);

  const isFever = feverSecLeft > 0;
  const comboMultiplier = isFever ? 5 : comboCount >= 10 ? 3 : comboCount >= 5 ? 2 : 1;

  const passLevel = Math.min(15, Math.floor(state.battlePass.xp / 100) + 1);
  const hasClaimablePass = BATTLE_PASS_LEVELS.some(
    (lv) =>
      passLevel >= lv.level &&
      (!state.battlePass.claimedFree.includes(lv.level) ||
        (state.battlePass.premiumUnlocked && !state.battlePass.claimedPremium.includes(lv.level)))
  );
  const hasClaimableDailyPass = !state.stats.dailyPassClaimedToday;

  const activeDmdRate = activeDuck ? getDragonDmdPerHour(activeDuck) : 0;
  const activeMaxCap = activeDuck ? getDragonMaxCapDmd(activeDuck) : 0;
  const canGenerateDmd = Boolean(
    activeDuck &&
      activeDuck.level >= 5 &&
      activeDuck.customLevel >= 1 &&
      activeDuck.slotIndex !== null &&
      activeDuck.slotIndex < state.unlockedSlots
  );

  const handleStageTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!activeDuck) return;

    // At LVL 5: if DMD is generating & stored, collect it; otherwise open customization or upgrade stars
    if (isMaxLevel) {
      if (canGenerateDmd && activeDuck.dmdStored > 0.0001) {
        onCollectDragonDmd(activeDuck.id);
      } else {
        soundFX.playTabSwitch();
        setSubView('STAKE');
      }
      return;
    }

    const now = Date.now();
    lastTapRef.current = now;
    const nextCombo = comboCount + 1;
    setComboCount(nextCombo);

    if (nextCombo === 14 && feverSecLeft <= 0) {
      setFeverSecLeft(6.5);
      soundFX.playFeverStart();
    }

    const critRate = activeDuck.skin === 'gamer' || activeDuck.skin === 'ninja' ? 0.28 : 0.14;
    const isCrit = Math.random() < critRate;

    const res = onFeedDuck(activeDuck.id, comboMultiplier, isCrit);
    if (!res) {
      soundFX.playError();
      return;
    }

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 140);

    if (res.leveledUp) {
      soundFX.playLevelUp();
      setEvolvedBurst(true);
      setTimeout(() => setEvolvedBurst(false), 1200);
    } else if (isCrit) {
      soundFX.playCritHit();
      setCardShake(true);
      setTimeout(() => setCardShake(false), 180);
    } else {
      soundFX.playComboTap(nextCombo);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    const id = ++particleIdRef.current;
    const bonusText =
      res.gainedEnergyBonus > 0 ? `+${res.gainedEnergyBonus} طاقة` : isCrit ? 'ضربة ×2!' : 'إطعام +1';
    const newParticle: FloatingParticle = {
      id,
      x,
      y,
      text: res.leveledUp ? 'ترقية! 🔥' : bonusText,
      isCrit: isCrit || isFever,
    };
    setParticles((prev) => [...prev.slice(-14), newParticle]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 850);
  };

  // --- MERGE SUB-VIEW (دمج التنانين) ---
  if (subView === 'MERGE' && activeDuck) {
    const targetRarityIdx = Math.min(RARITY_ORDER.indexOf(activeDuck.rarity) + 1, RARITY_ORDER.length - 1);
    const targetRarity: Rarity = RARITY_ORDER[targetRarityIdx];
    const baseMergeRarity: Rarity =
      mergeSelectedIds.length > 0
        ? state.ducks.find((d) => d.id === mergeSelectedIds[0])?.rarity ?? activeDuck.rarity
        : activeDuck.rarity;

    const eligibleDragons = state.ducks.filter(
      (d) =>
        d.rarity !== 'LEGENDARY' &&
        (mergeSelectedIds.length === 0 || d.rarity === baseMergeRarity)
    );

    const toggleMergePick = (id: string) => {
      soundFX.playTabSwitch();
      setMergeSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= 4) return prev;
        return [...prev, id];
      });
    };

    return (
      <div className="h-full flex flex-col max-w-2xl mx-auto px-4 py-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              soundFX.playTabSwitch();
              setMergeSelectedIds([]);
              setSubView('MAIN');
            }}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            <span>دمج التنانين</span>
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">النتيجة:</span>
            <span className={`font-bold ${RARITY_STYLE[targetRarity].color}`}>
              {RARITY_STYLE[targetRarity].labelAr}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[0, 1, 2, 3].map((slotIdx) => {
            const dragonId = mergeSelectedIds[slotIdx];
            const dragon = state.ducks.find((d) => d.id === dragonId);
            return (
              <button
                key={slotIdx}
                onClick={() => dragon && toggleMergePick(dragon.id)}
                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all cursor-pointer ${
                  dragon
                    ? 'bg-slate-800/90 border-amber-400 shadow-[0_0_16px_rgba(250,204,21,0.2)]'
                    : 'bg-slate-900/60 border-dashed border-slate-700 hover:border-slate-500'
                }`}
              >
                {dragon ? (
                  <>
                    <DragonIllustration
                      skin={dragon.skin}
                      level={dragon.level}
                      customLevel={dragon.customLevel}
                      gear={dragon.gear}
                      aura={dragon.aura}
                      staked={dragon.staked}
                      showEvolutionEffects={true}
                      className="w-14 h-14"
                    />
                    <span className="font-mono-num text-[10px] font-bold text-amber-300">
                      LVL {dragon.level}
                    </span>
                  </>
                ) : (
                  <Plus className="w-6 h-6 text-slate-500" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 mb-3 text-center">
          اختر 4 تنانين من نفس الندرة لدمجها في تنين واحد أعلى ندرة بعائد DMD وسقف ساعات أكبر!
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-5">
          {eligibleDragons.map((d) => {
            const selected = mergeSelectedIds.includes(d.id);
            const st = RARITY_STYLE[d.rarity];
            return (
              <button
                key={d.id}
                onClick={() => toggleMergePick(d.id)}
                className={`rounded-2xl p-2.5 border text-center transition-all cursor-pointer flex flex-col items-center ${
                  selected
                    ? 'bg-amber-500/15 border-amber-400 scale-[0.98]'
                    : 'bg-[#181b24] border-slate-800 hover:border-slate-600'
                }`}
              >
                <DragonIllustration
                  skin={d.skin}
                  level={d.level}
                  customLevel={d.customLevel}
                  gear={d.gear}
                  aura={d.aura}
                  staked={d.staked}
                  showEvolutionEffects={true}
                  className="w-16 h-16 mb-1"
                />
                <span className={`text-[10px] font-bold ${st.color}`}>{st.labelAr}</span>
                <span className="text-[10px] text-slate-300 font-mono-num mt-0.5">
                  LVL {d.level} · ★{d.customLevel}
                </span>
              </button>
            );
          })}
        </div>

        <button
          disabled={mergeSelectedIds.length !== 4}
          onClick={() => {
            soundFX.playGodConfirm();
            onMergeDucks(mergeSelectedIds);
            setMergeSelectedIds([]);
            setSubView('MAIN');
          }}
          className={`w-full py-3.5 rounded-2xl font-extrabold text-base transition-all mt-auto ${
            mergeSelectedIds.length === 4
              ? 'bg-gradient-to-b from-[#facc15] to-[#eab308] text-slate-950 shadow-lg hover:brightness-105 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {mergeSelectedIds.length === 4
            ? `دمج 4 تنانين ← ${RARITY_STYLE[targetRarity].labelAr}`
            : `اختر ${4 - mergeSelectedIds.length} تنانين إضافية`}
        </button>
      </div>
    );
  }

  // --- STAR CUSTOMIZATION & DMD GENERATION SUB-VIEW ---
  if (subView === 'STAKE' && activeDuck) {
    const customCost = getCustomUpgradeCost(activeDuck.customLevel);
    const canUpgradeCustom =
      activeDuck.level >= 5 && activeDuck.customLevel < 10 && state.stars >= customCost;
    const gearChanged =
      draftGear !== (activeDuck.gear ?? 'none') || draftAura !== (activeDuck.aura ?? 'auto');
    const effPct =
      activeDuck.slotIndex !== null ? Math.round(getSlotEfficiency(activeDuck.slotIndex) * 100) : 0;

    return (
      <div className="h-full flex flex-col max-w-2xl mx-auto px-4 py-3 overflow-y-auto space-y-3 pb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              soundFX.playTabSwitch();
              setSubView('MAIN');
            }}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            <span>تخصيص التنين وتوليد DMD</span>
          </button>
        </div>

        {/* Live 3D Dragon Preview + Gear & Aura */}
        <div className="realistic-card border border-amber-400/30 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="text-sm font-black text-white">{activeDuck.name}</div>
              <div className="flex items-center gap-2 text-xs font-mono-num">
                <span className={rarityStyle.color}>{rarityStyle.labelAr}</span>
                <span className="text-slate-400">· LVL {activeDuck.level}/5</span>
                <span className="text-amber-300">· ★{activeDuck.customLevel}/10</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold">
                المظهر والدرع يرفعان قوة التنين في الحلبة، وتخصيص النجوم يرفع إنتاج DMD!
              </div>
            </div>
            <div className="w-32 h-32 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-center shrink-0">
              <DragonIllustration
                skin={activeDuck.skin}
                level={activeDuck.level}
                customLevel={activeDuck.customLevel}
                gear={draftGear}
                aura={draftAura}
                staked={canGenerateDmd}
                showEvolutionEffects={true}
                className="w-28 h-28"
              />
            </div>
          </div>

          {/* Gear Selection */}
          <div>
            <div className="text-xs font-extrabold text-amber-300 mb-1.5">اختر التاج / العتاد القتالي:</div>
            <div className="grid grid-cols-5 gap-1.5">
              {DUCK_GEAR_CATALOG.map((g) => {
                const selected = draftGear === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      soundFX.playTabSwitch();
                      setDraftGear(g.id);
                    }}
                    className={`rounded-xl p-2 border text-center transition-all cursor-pointer ${
                      selected
                        ? 'bg-amber-400/20 border-amber-400 text-white'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-lg">{g.icon}</div>
                    <div className="text-[10px] font-bold truncate mt-0.5">{g.nameAr}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              مكافأة القطعة:{' '}
              <span className="text-amber-300 font-bold">
                {DUCK_GEAR_CATALOG.find((g) => g.id === draftGear)?.bonusDesc}
              </span>
            </div>
          </div>

          {/* Aura Selection */}
          <div>
            <div className="text-xs font-extrabold text-sky-300 mb-1.5">اختر هالة التنين:</div>
            <div className="grid grid-cols-4 gap-1.5">
              {DUCK_AURA_CATALOG.map((a) => {
                const selected = draftAura === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      soundFX.playTabSwitch();
                      setDraftAura(a.id);
                    }}
                    className={`rounded-xl p-2 border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selected
                        ? 'bg-sky-500/20 border-sky-400 text-white'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${a.swatch}`} />
                    <span className="text-[10px] font-bold truncate">{a.nameAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            disabled={!gearChanged}
            onClick={() => {
              soundFX.playGodConfirm();
              onCustomizeDuck(activeDuck.id, draftGear, draftAura);
            }}
            className={`w-full py-2.5 rounded-xl font-black text-xs transition-all ${
              gearChanged
                ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer'
                : 'bg-slate-800 text-slate-400 cursor-default'
            }`}
          >
            {gearChanged ? 'حفظ العتاد والهالة مجاناً ✓' : 'المظهر الحالي مُجهّز'}
          </button>
        </div>

        {/* Star Customization & DMD Generator Gate Card */}
        <div className="bg-[#181b24] border border-amber-400/30 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>تخصيص النجوم وتفعيل توليد DMD</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تبدأ عملة <strong className="text-amber-300">DMD</strong> فقط عند{' '}
                <strong className="text-white">LVL 5 + تخصيص نجوم ★1 فأعلى</strong>!
              </p>
            </div>
            <div className="text-left font-mono-num">
              <div className="text-xs font-black text-emerald-400">{activeDmdRate.toFixed(2)} DMD/س</div>
              <div className="text-[10px] text-slate-400">
                سقف {RARITY_STYLE[activeDuck.rarity].maxCapHours}س ({activeMaxCap.toFixed(2)} DMD)
              </div>
            </div>
          </div>

          {/* Slot Assignment Selector */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-bold">الخانة المُعيّنة للتنين:</span>
              <span className="font-mono-num text-amber-300 font-bold">
                {activeDuck.slotIndex !== null ? `الخانة ${activeDuck.slotIndex + 1} (${effPct}% كفاءة)` : 'في الاحتياط (0%)'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {DRAGON_SLOTS.slice(0, state.unlockedSlots).map((slot) => {
                const isHere = activeDuck.slotIndex === slot.slotIndex;
                return (
                  <button
                    key={slot.slotIndex}
                    onClick={() => onAssignSlot(activeDuck.id, slot.slotIndex)}
                    className={`py-1.5 px-2 rounded-xl border text-[10px] font-mono-num font-bold cursor-pointer transition-all ${
                      isHere
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-400/50'
                    }`}
                  >
                    خ{slot.slotIndex + 1} · {slot.efficiencyPct}%
                  </button>
                );
              })}
            </div>
          </div>

          {activeDuck.level < 5 ? (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3 text-center text-xs font-bold text-rose-300">
              أطعم التنين بالطاقة ليصل إلى المستوى 5 أولاً ({activeDuck.level}/5) قبل فتح تخصيص النجوم.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                disabled={!canUpgradeCustom}
                onClick={() => onUpgradeStarCustomization(activeDuck.id)}
                className={`py-3 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  activeDuck.customLevel >= 10
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                    : canUpgradeCustom
                      ? 'bg-gradient-to-b from-[#facc15] to-[#eab308] text-slate-950 hover:brightness-105 cursor-pointer'
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <StarIcon className="w-4 h-4" />
                <span>
                  {activeDuck.customLevel >= 10
                    ? 'تخصيص مكتمل ★10/10'
                    : `ترقية إلى ★${activeDuck.customLevel + 1} (+12% DMD) · ${customCost} ★`}
                </span>
              </button>

              <button
                disabled={!canGenerateDmd || activeDuck.dmdStored <= 0.0001}
                onClick={() => onCollectDragonDmd(activeDuck.id)}
                className={`py-3 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  canGenerateDmd && activeDuck.dmdStored > 0.0001
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>جمع ({activeDuck.dmdStored.toFixed(3)} DMD)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!activeDuck) return null;

  const skillUpgradeCost = activeDuck.skillLevel * 450;
  const currentFeedCost = getFeedCost(activeDuck.level);
  const effectiveFeedCost = state.godCards.some((g) => g.godKey === 'harvest' && g.owned)
    ? Math.ceil(currentFeedCost * 0.75)
    : currentFeedCost;
  const nextCustomCost = getCustomUpgradeCost(activeDuck.customLevel);
  const combatPreview = getDuckCombatStats(
    activeDuck,
    state.dmdTotal,
    state.pack.joined,
    state.pack.power
  );
  const reserveDragons = state.ducks.filter(
    (d) => d.slotIndex === null || d.slotIndex >= state.unlockedSlots
  );
  const capPct = activeMaxCap > 0 ? Math.min(100, (activeDuck.dmdStored / activeMaxCap) * 100) : 0;

  return (
    <div className="relative h-full flex flex-col justify-between max-w-5xl mx-auto px-3 sm:px-6 py-2 overflow-y-auto">
      <SanctuaryBackdrop variant="stage" className="opacity-70" />

      {/* Top Earned DMD Score + Guide (?) + Dragon Info */}
      <div className="relative z-20 flex flex-col items-center pt-0.5">
        <div className="flex items-center gap-2">
          <DmdIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="font-mono-num text-2xl sm:text-4xl font-black tracking-tight text-white">
            {state.dmdTotal.toFixed(3)}
          </span>
          <span className="text-[11px] font-black text-amber-300">DMD</span>
          <button
            type="button"
            onClick={() => {
              soundFX.playTabSwitch();
              setShowDmdGuide((v) => !v);
            }}
            aria-label="شرح اقتصاد التنانين وعملة DMD"
            className="w-6 h-6 rounded-full bg-slate-800/90 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-0.5 text-[11px] sm:text-xs font-bold">
          <span className={rarityStyle.color}>{rarityStyle.labelAr}</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="font-mono-num text-slate-200">LVL {activeDuck.level}/5</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="font-mono-num text-amber-300">تخصيص ★{activeDuck.customLevel}</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="font-mono-num text-rose-400">قوة {combatPreview.totalPowerScore} ⚡</span>
        </div>

        {/* Inline DMD Economy Guide Popover */}
        {showDmdGuide && (
          <div className="mt-2 w-full max-w-md rounded-2xl bg-[#161b28]/95 border border-amber-400/50 p-3 text-right shadow-2xl relative z-30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                قوانين اقتصاد التنانين وعملة DMD
              </span>
              <button
                onClick={() => setShowDmdGuide(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              • <strong className="text-white">المراحل 1 ← 5:</strong> إطعام بالطاقة لتقوية التنين (لا ينتج DMD بعد).
              <br />• <strong className="text-amber-300">توليد DMD:</strong> يبدأ فقط بعد بلوغ{' '}
              <span className="text-white font-bold">LVL 5 + تخصيص النجوم ★1</span> بسقف{' '}
              <span className="font-mono-num text-emerald-300">6–12 ساعة</span>.
              <br />• <strong className="text-sky-300">كفاءة الخانات الموحدة:</strong> 1–2 (100%) · 3–4 (75%) · 5–8 (50%).
            </p>
          </div>
        )}

        {(comboCount > 1 || isFever) && (
          <div className="mt-1 flex items-center gap-2 text-xs font-black">
            {isFever ? (
              <span className="text-amber-300 flex items-center gap-1 animate-pulse">
                <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                وضع الحماس ×5! ({feverSecLeft.toFixed(1)}ث)
              </span>
            ) : (
              <span className="text-amber-400 font-mono-num">
                كومبو ×{comboMultiplier} ({comboCount} نقرة)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Compact 4-Shortcut Action Dock */}
      <div className="relative z-10 w-full max-w-lg mx-auto grid grid-cols-4 gap-1.5 my-1">
        <button
          onClick={() => {
            soundFX.playTabSwitch();
            onOpenDuckerPass();
          }}
          className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-[#181b24]/90 border border-amber-400/30 hover:border-amber-400 transition-all cursor-pointer"
        >
          {hasClaimablePass && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <Crown className="w-4 h-4 text-amber-400 mb-0.5" />
          <span className="text-[10px] font-extrabold text-amber-200 whitespace-nowrap">موسم 1 · م{passLevel}</span>
        </button>

        <button
          onClick={() => {
            soundFX.playTabSwitch();
            onOpenDailyPass();
          }}
          className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-[#181b24]/90 border border-slate-800 hover:border-emerald-400/60 transition-all cursor-pointer"
        >
          {hasClaimableDailyPass && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <Gift className="w-4 h-4 text-emerald-400 mb-0.5" />
          <span className="text-[10px] font-extrabold text-emerald-300 whitespace-nowrap">هدية اليوم</span>
        </button>

        <button
          onClick={() => {
            soundFX.playTabSwitch();
            onOpenTreasures();
          }}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-[#181b24]/90 border border-slate-800 hover:border-amber-400/60 transition-all cursor-pointer"
        >
          <span className="text-sm leading-none mb-0.5">🧰</span>
          <span className="text-[10px] font-extrabold text-slate-200 whitespace-nowrap">كنوز التنانين</span>
        </button>

        <button
          onClick={() => {
            if (timedBonusReadyIn === 0) {
              soundFX.playChestOpen();
              onClaimTimedBonus();
            } else {
              soundFX.playTabSwitch();
              onOpenDailyTasks();
            }
          }}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border transition-all cursor-pointer ${
            timedBonusReadyIn === 0
              ? 'bg-emerald-500/20 border-emerald-400 animate-match-ring'
              : 'bg-[#181b24]/90 border-slate-800 hover:border-sky-400/60'
          }`}
        >
          <Clock className="w-4 h-4 text-sky-400 mb-0.5" />
          <span className="font-mono-num text-[10px] font-bold text-slate-200 whitespace-nowrap">
            {timedBonusReadyIn === 0 ? 'جاهز! +250' : formatTimer(timedBonusReadyIn)}
          </span>
        </button>
      </div>

      {/* Center Interactive 3D Dragon Stage */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-1 min-h-[215px]">
        <div className={`relative flex flex-col items-center ${cardShake ? 'animate-hit-shake' : ''}`}>
          <button
            type="button"
            onClick={handleStageTap}
            className={`relative w-60 h-60 sm:w-68 sm:h-68 rounded-[32px] border-2 realistic-card ${
              isFever ? 'border-amber-400 animate-fever-glow' : rarityStyle.border
            } overflow-hidden flex flex-col items-center justify-center cursor-pointer select-none focus:outline-none`}
          >
            <div
              aria-hidden="true"
              className={`absolute inset-0 bg-gradient-to-b ${
                isFever ? 'from-rose-500/30 via-amber-500/15 to-transparent' : rarityStyle.glow
              } pointer-events-none`}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 inset-x-10 h-28 bg-gradient-to-b from-amber-200/12 to-transparent blur-md"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-10 inset-x-8 h-6 rounded-full bg-amber-400/12 blur-md"
            />

            <div className="relative z-10 text-[11px] font-mono-num font-bold text-slate-300 flex items-center gap-1.5">
              <span>{activeDuck.name}</span>
              {canGenerateDmd ? (
                <span className="text-emerald-400">· {activeDmdRate.toFixed(2)} DMD/س</span>
              ) : (
                <span className="text-amber-300">· LVL {activeDuck.level}</span>
              )}
            </div>

            <div className={`relative z-10 ${isPressed ? 'animate-duck-squash' : evolvedBurst ? 'animate-merge-pop' : ''}`}>
              <DragonIllustration
                skin={activeDuck.skin}
                level={activeDuck.level}
                customLevel={activeDuck.customLevel}
                gear={activeDuck.gear}
                aura={activeDuck.aura}
                staked={canGenerateDmd}
                showEvolutionEffects={true}
                className="w-38 h-38 sm:w-44 sm:h-44"
                isPressed={isPressed}
                mood={isFever ? 'fever' : 'idle'}
              />
            </div>

            {evolvedBurst && (
              <div className="pointer-events-none absolute top-6 z-30 px-3 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shadow-xl animate-bounce">
                ✨ ترقية إلى {currentEvo.titleAr}!
              </div>
            )}

            <div className="relative z-10 mt-0.5 px-3.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-1.5 shadow">
              {canGenerateDmd ? (
                <span className="text-xs font-extrabold text-emerald-400 font-mono-num">
                  {activeDuck.dmdStored > 0.0001
                    ? `جمع +${activeDuck.dmdStored.toFixed(3)} DMD`
                    : 'يولّد DMD الآن · اضغط للتخصيص'}
                </span>
              ) : isMaxLevel ? (
                <span className="text-xs font-extrabold text-amber-300">
                  LVL 5 مكتمل! خصّص بالنجوم ★ لتوليد DMD
                </span>
              ) : (
                <>
                  <CornIcon className="w-4 h-4" />
                  <span className="font-mono-num text-xs font-extrabold text-white">{effectiveFeedCost}</span>
                  <span className="text-xs font-bold text-slate-200">اضغط لإطعام التنين</span>
                </>
              )}
            </div>

            {particles.map((p) => (
              <div
                key={p.id}
                style={{ left: p.x, top: p.y }}
                className={`pointer-events-none absolute z-30 flex items-center gap-1 font-mono-num font-black drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${
                  p.isCrit ? 'animate-crit-pop text-base text-rose-400' : 'animate-float-up text-sm text-emerald-300'
                }`}
              >
                <CornIcon className="w-4 h-4" />
                <span>{p.text}</span>
              </div>
            ))}
          </button>
        </div>
      </div>

      {/* Bottom Controls: 8 Dragon Slots + Locked Slot Requirement Modal + Skill/Customize + Evolution/DMD Card */}
      <div className="relative z-10 w-full max-w-lg mx-auto space-y-2 pb-1">
        {/* 8-Slot Dragon Strip with Unified 100% / 75% / 50% Diminishing Returns */}
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-0.5">
          {DRAGON_SLOTS.map((slot) => {
            const unlocked = slot.slotIndex < state.unlockedSlots;
            const occupantIdx = state.ducks.findIndex((d) => d.slotIndex === slot.slotIndex);
            const occupant = occupantIdx >= 0 ? state.ducks[occupantIdx] : null;
            const isSelected = occupantIdx >= 0 && occupantIdx === state.activeDuckIndex;
            const eligibility = !unlocked ? checkSlotUnlockEligibility(slot.slotIndex, state) : null;

            if (!unlocked) {
              return (
                <button
                  key={slot.slotIndex}
                  onClick={() => {
                    soundFX.playTabSwitch();
                    setSelectedLockedSlot(selectedLockedSlot === slot.slotIndex ? null : slot.slotIndex);
                  }}
                  title={`${slot.label} · ${slot.starCost} ★ (${slot.requirementText})`}
                  className={`relative w-11 h-11 rounded-xl border flex flex-col items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    eligibility?.canUnlock
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="font-mono-num text-[8px] font-bold mt-0.5">{slot.starCost}★</span>
                </button>
              );
            }

            return (
              <button
                key={slot.slotIndex}
                onClick={() => {
                  soundFX.playTabSwitch();
                  setSelectedLockedSlot(null);
                  if (occupantIdx >= 0) {
                    onSelectDuck(occupantIdx);
                  } else if (activeDuck) {
                    onAssignSlot(activeDuck.id, slot.slotIndex);
                  }
                }}
                title={occupant ? `${occupant.name} (${slot.efficiencyPct}%)` : `نقل إلى ${slot.label} (${slot.efficiencyPct}%)`}
                className={`relative w-11 h-11 rounded-xl border flex flex-col items-center justify-center shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400/20 border-amber-400 scale-105 shadow-md'
                    : 'bg-[#181b24] border-slate-800 hover:border-slate-600 opacity-85 hover:opacity-100'
                }`}
              >
                {occupant ? (
                  <>
                    <DragonIllustration
                      skin={occupant.skin}
                      level={occupant.level}
                      customLevel={occupant.customLevel}
                      gear={occupant.gear}
                      aura={occupant.aura}
                      className="w-8 h-8"
                    />
                    <span className="absolute -bottom-1 px-1 rounded bg-slate-950/90 border border-slate-700 font-mono-num text-[8px] font-black text-slate-300">
                      {slot.efficiencyPct}%
                    </span>
                    {getDragonDmdPerHour(occupant) > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono-num text-[8px] text-slate-400">{slot.efficiencyPct}%</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Locked Slot Unlock Popover */}
        {selectedLockedSlot !== null && selectedLockedSlot >= state.unlockedSlots && (
          <div className="bg-[#161b28] border border-amber-400/50 rounded-2xl p-3 flex items-center justify-between gap-3">
            {(() => {
              const meta = DRAGON_SLOTS[selectedLockedSlot];
              const check = checkSlotUnlockEligibility(selectedLockedSlot, state);
              return (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-white">
                      {meta.label} · كفاءة توليد {meta.efficiencyPct}%
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      الشرط: <span className={check.metCondition ? 'text-emerald-400 font-bold' : 'text-amber-300'}>{meta.requirementText}</span>
                    </div>
                  </div>
                  <button
                    disabled={!check.canUnlock}
                    onClick={() => {
                      onUnlockSlot(selectedLockedSlot);
                      setSelectedLockedSlot(null);
                    }}
                    className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1 shrink-0 ${
                      check.canUnlock
                        ? 'bg-amber-400 text-slate-950 hover:brightness-105 cursor-pointer'
                        : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <StarIcon className="w-3.5 h-3.5" />
                    <span className="font-mono-num">فتح {meta.starCost}</span>
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {/* Reserve Dragons Strip (if player owns extra dragons outside the active slots) */}
        {reserveDragons.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900/70 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">الاحتياط ({reserveDragons.length}):</span>
            {reserveDragons.map((rd) => {
              const idx = state.ducks.findIndex((d) => d.id === rd.id);
              const isSelected = idx === state.activeDuckIndex;
              return (
                <button
                  key={rd.id}
                  onClick={() => {
                    soundFX.playTabSwitch();
                    onSelectDuck(idx);
                  }}
                  className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <span>{rd.name}</span>
                  <span className="font-mono-num text-amber-300">LVL {rd.level}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Dragon Skill + Customize + Optional Ad Energy + Arena Jump */}
        <div className="bg-[#181b24] border border-slate-800 rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-300">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{duckSkill.name}</span>
              <span className="font-mono-num text-[10px] text-slate-400 shrink-0">م{activeDuck.skillLevel}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">{duckSkill.passiveBonus}</div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onWatchRewardedAd('energy')}
              title={`إعلان اختياري (+350 طاقة · ${state.treasury.adsWatchedToday}/${state.treasury.maxAdsPerDay} اليوم)`}
              className="px-2 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/25 text-[10px] font-black flex items-center gap-1 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span className="font-mono-num">+350⚡</span>
            </button>

            <button
              onClick={() => {
                soundFX.playTabSwitch();
                setSubView('STAKE');
              }}
              title="تخصيص المظهر والنجوم"
              className="px-2 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/40 text-sky-300 hover:bg-sky-500/25 text-[11px] font-black flex items-center gap-1 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تخصيص</span>
            </button>

            <button
              disabled={state.corn < skillUpgradeCost || activeDuck.skillLevel >= 5}
              onClick={() => {
                soundFX.playLevelUp();
                onUpgradeDuckSkill(activeDuck.id);
              }}
              className={`px-2 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 ${
                activeDuck.skillLevel >= 5
                  ? 'bg-slate-800 text-emerald-400'
                  : state.corn >= skillUpgradeCost
                    ? 'bg-indigo-500 text-white hover:bg-indigo-400 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CornIcon className="w-3 h-3" />
              <span>{activeDuck.skillLevel >= 5 ? 'أقصى' : `${skillUpgradeCost}`}</span>
            </button>

            <button
              onClick={() => {
                soundFX.playTabSwitch();
                onGoToArena();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-[11px] font-black flex items-center gap-1 cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>قاتل</span>
            </button>
          </div>
        </div>

        {/* 5-Level Evolution Ladder + Star Customization / DMD Collection Box */}
        <div className="bg-[#181b24]/95 border border-slate-800 rounded-2xl px-3.5 py-2.5 space-y-2 backdrop-blur-sm">
          <div className="grid grid-cols-5 gap-1.5">
            {DUCK_EVOLUTION_LEVELS.map((stage) => {
              const reached = activeDuck.level >= stage.level;
              const isCurrent = activeDuck.level === stage.level;
              return (
                <div
                  key={stage.level}
                  className={`rounded-xl py-1 px-1 text-center border transition-all ${
                    isCurrent
                      ? `${stage.ringColor} shadow-sm`
                      : reached
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900/70 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="font-mono-num text-[10px] font-black">
                    LVL {stage.level} {reached && !isCurrent ? '✓' : ''}
                  </div>
                  <div className="text-[9px] opacity-90 font-mono-num">
                    {stage.level === 5 ? 'يفتح ★' : `${getFeedCost(stage.level)}⚡`}
                  </div>
                </div>
              );
            })}
          </div>

          {isMaxLevel ? (
            <div className="space-y-2 pt-0.5">
              {canGenerateDmd && (
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-emerald-300 font-bold">
                      تراكم الخزان ({RARITY_STYLE[activeDuck.rarity].maxCapHours}س حد أقصى):
                    </span>
                    <span className="font-mono-num text-amber-300 font-black">
                      {activeDuck.dmdStored.toFixed(3)} / {activeMaxCap.toFixed(2)} DMD
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${capPct}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  disabled={activeDuck.customLevel >= 10 || state.stars < nextCustomCost}
                  onClick={() => onUpgradeStarCustomization(activeDuck.id)}
                  className={`py-2 px-2 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1 ${
                    activeDuck.customLevel >= 10
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : state.stars >= nextCustomCost
                        ? 'bg-gradient-to-b from-[#facc15] to-[#eab308] text-slate-950 hover:brightness-105 cursor-pointer'
                        : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <StarIcon className="w-3.5 h-3.5" />
                  <span>
                    {activeDuck.customLevel >= 10
                      ? '★10/10'
                      : `ترقية ★${activeDuck.customLevel + 1} (${nextCustomCost})`}
                  </span>
                </button>

                <button
                  disabled={!canGenerateDmd || activeDuck.dmdStored <= 0.0001}
                  onClick={() => onCollectDragonDmd(activeDuck.id)}
                  className={`py-2 px-2 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1 ${
                    canGenerateDmd && activeDuck.dmdStored > 0.0001
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <DmdIcon className="w-3.5 h-3.5" />
                  <span>جمع DMD</span>
                </button>

                <button
                  onClick={() => {
                    soundFX.playTabSwitch();
                    setSubView('MERGE');
                  }}
                  className="py-2 px-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-extrabold text-[11px] hover:border-amber-400 cursor-pointer"
                >
                  دمج للندرة
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-bold">
                  تطوير إلى LVL {activeDuck.level + 1}:{' '}
                  <span className="font-mono-num text-amber-300 font-black">
                    {activeDuck.feedsProgress}/{activeDuck.feedsRequired}
                  </span>
                </span>
                {nextEvo && (
                  <span className="font-mono-num text-emerald-400 font-bold">
                    {nextEvo.level === 5 ? 'يفتح تخصيص النجوم ★' : `+${30 + nextEvo.level * 15} قوة ⚡`}
                  </span>
                )}
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-300 transition-all duration-150"
                  style={{
                    width: `${Math.min(100, (activeDuck.feedsProgress / activeDuck.feedsRequired) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
