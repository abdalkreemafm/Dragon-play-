import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare,
  Egg,
  Flame,
  ShoppingBag,
  Sparkles,
  Store,
  Swords,
  TrendingUp,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import {
  AppScreen,
  Duck,
  DuckAuraId,
  DuckGearId,
  DuckSkinId,
  EggItemType,
  GameState,
  MainTab,
  Rarity,
} from './types/game';
import {
  BATTLE_PASS_LEVELS,
  DRAGON_SLOTS,
  DUCK_EVOLUTION_LEVELS,
  EGG_ITEM_META,
  RARITY_ORDER,
  RARITY_STYLE,
  SKIN_CATALOG,
  STORE_PACKAGES,
  WEEKEND_EVENTS,
  checkSlotUnlockEligibility,
  createInitialGameState,
  createInitialMarketListings,
  createRandomGodOrder,
  formatCompactNumber,
  getCustomUpgradeCost,
  getDragonDmdPerHour,
  getDragonMaxCapDmd,
  getFeedCost,
  getLeagueMeta,
} from './data/gameData';
import { soundFX } from './utils/sound';
import { TitleScreen } from './components/TitleScreen';
import { CornIcon, StarIcon } from './components/art/DuckArt';
import { DucksTab } from './components/tabs/DucksTab';
import { EggsTab } from './components/tabs/EggsTab';
import { ArenaTab } from './components/tabs/ArenaTab';
import { GodsTab } from './components/tabs/GodsTab';
import { TasksTab } from './components/tabs/TasksTab';
import { MarketTab } from './components/tabs/MarketTab';
import { ActiveModal, GameModals } from './components/modals/GameModals';

const STORAGE_KEY = 'dragon_dmd_save_v1';
const AUCTION_RIVALS = ['DRAGON_KING', 'ZLOYPHILIPP', 'NUBUBIICA', 'SOLAFEIFEI', 'IGNIS_LORD'];

function loadSavedState(): { state: GameState; hasSave: boolean } {
  const defaults = createInitialGameState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameState>;
      if (parsed && Array.isArray(parsed.ducks) && Array.isArray(parsed.grid)) {
        const mergedDragons = parsed.ducks.map((d, idx) => ({
          ...d,
          customLevel: d.customLevel ?? 0,
          dmdStored: d.dmdStored ?? 0,
          slotIndex: d.slotIndex !== undefined ? d.slotIndex : idx < (parsed.unlockedSlots ?? 3) ? idx : null,
          feedCost: getFeedCost(d.level ?? 1),
          skillLevel: d.skillLevel ?? 1,
          powerRating: d.powerRating ?? RARITY_STYLE[d.rarity].basePower + (d.level ?? 1) * 20,
        }));
        return {
          state: {
            ...defaults,
            ...parsed,
            ducks: mergedDragons,
            unlockedSlots: parsed.unlockedSlots ?? 3,
            activeDuckIndex: Math.min(parsed.activeDuckIndex ?? 0, Math.max(0, mergedDragons.length - 1)),
            treasury: { ...defaults.treasury, ...(parsed.treasury ?? {}) },
            league: { ...defaults.league, ...(parsed.league ?? {}) },
            battlePass: { ...defaults.battlePass, ...(parsed.battlePass ?? {}) },
            stats: { ...defaults.stats, ...(parsed.stats ?? {}) },
          },
          hasSave: true,
        };
      }
    }
  } catch {
    // ignore corrupted save
  }
  return { state: defaults, hasSave: false };
}

export default function App() {
  const [initialLoaded] = useState(() => loadSavedState());
  const [screen, setScreen] = useState<AppScreen>('TITLE');
  const [activeTab, setActiveTab] = useState<MainTab>('DUCKS');
  const [godsInitialSubTab, setGodsInitialSubTab] = useState<'TREASURES' | 'TASKS' | 'GODS'>('GODS');
  const [modal, setModal] = useState<ActiveModal>(null);
  const [state, setState] = useState<GameState>(initialLoaded.state);
  const [hasSave, setHasSave] = useState<boolean>(initialLoaded.hasSave);
  const [timedBonusReadyIn, setTimedBonusReadyIn] = useState<number>(0);
  const [blitzSecLeft, setBlitzSecLeft] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    soundFX.muted = state.muted;
  }, [state.muted]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }));
      setHasSave(true);
    } catch {
      // ignore storage quota
    }
  }, [state]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'PLAYING') return;
      if (e.key === 'Escape') {
        setModal((prev) => (prev ? null : 'PAUSE'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen]);

  // 1-second simulation loop: DMD generation (ONLY LVL 5 + Custom_LVL >= 1 + Slot Efficiency + Max Cap), Market Auctions & Tournament timer
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimedBonusReadyIn((sec) => Math.max(0, sec - 1));
      setBlitzSecLeft((sec) => Math.max(0, sec - 1));

      setState((prev) => {
        let updatedDucks = prev.ducks.map((d) => {
          if (d.slotIndex === null || d.slotIndex >= prev.unlockedSlots) return d;
          const ratePerHour = getDragonDmdPerHour(d);
          if (ratePerHour <= 0) return d;
          const maxCap = getDragonMaxCapDmd(d);
          const nextStored = Math.min(maxCap, (d.dmdStored ?? 0) + ratePerHour / 3600);
          return {
            ...d,
            staked: true,
            stakeRatePerHour: ratePerHour,
            dmdStored: nextStored,
          };
        });

        let snipeOccurred = false;
        let wonAuction = false;

        const updatedListings = prev.marketListings.map((item) => {
          if (item.soldStatus !== 'ACTIVE') return item;

          if (item.isUserBid && item.timeLeftSec <= 5 && item.timeLeftSec >= 2 && Math.random() < 0.42) {
            const rivalName = AUCTION_RIVALS[Math.floor(Math.random() * AUCTION_RIVALS.length)];
            snipeOccurred = true;
            return {
              ...item,
              cornPrice: Math.round(item.cornPrice * 1.1),
              isUserBid: false,
              rivalSniped: true,
              lastBidder: rivalName,
              timeLeftSec: item.timeLeftSec + 6,
            };
          }

          if (item.timeLeftSec > 1) {
            return { ...item, timeLeftSec: item.timeLeftSec - 1 };
          }

          if (item.isUserBid) {
            const freeSlot = Array.from({ length: prev.unlockedSlots }, (_, i) => i).find(
              (sIdx) => !updatedDucks.some((dr) => dr.slotIndex === sIdx)
            );
            const wonDragon: Duck = {
              id: `dragon_won_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              name: item.duckName,
              skin: item.skin,
              rarity: item.rarity,
              level: item.level,
              maxLevel: 5,
              customLevel: 0,
              dmd: 0,
              dmdStored: 0,
              slotIndex: freeSlot ?? null,
              feedCost: getFeedCost(item.level),
              feedsProgress: item.level >= 5 ? 12 : 0,
              feedsRequired: DUCK_EVOLUTION_LEVELS[Math.max(0, Math.min(4, item.level - 1))].feedsRequired,
              staked: false,
              stakeRatePerHour: 0,
              xl: item.xl,
              skillLevel: 1,
              powerRating: RARITY_STYLE[item.rarity].basePower + item.level * 20,
              unlockedAt: Date.now(),
            };
            updatedDucks = [...updatedDucks, wonDragon];
            wonAuction = true;
            return { ...item, timeLeftSec: 0, soldStatus: 'SOLD_YOU' as const, rivalSniped: false };
          }
          return { ...item, timeLeftSec: 0, soldStatus: 'SOLD_OTHER' as const, rivalSniped: false };
        });

        if (snipeOccurred) soundFX.playAuctionAlert();
        if (wonAuction) soundFX.playVictory();

        const activeCount = updatedListings.filter((l) => l.soldStatus === 'ACTIVE').length;
        const finalListings = activeCount < 3 ? createInitialMarketListings() : updatedListings;

        return {
          ...prev,
          ducks: updatedDucks,
          marketListings: finalListings,
          tournament: {
            ...prev.tournament,
            resetSeconds: Math.max(0, prev.tournament.resetSeconds - 1),
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screen]);

  const activeGodHarvest = state.godCards.some((g) => g.godKey === 'harvest' && g.owned);
  const activeGodHype = state.godCards.some((g) => g.godKey === 'hype' && g.owned);
  const activeGodFortune = state.godCards.some((g) => g.godKey === 'fortune' && g.owned);
  const activeGodPlunder = state.godCards.some((g) => g.godKey === 'plunder' && g.owned);
  const currentWeekendEvent = WEEKEND_EVENTS[state.weekendEventIndex % WEEKEND_EVENTS.length];

  // === FEEDING HANDLER (LVL 1 -> LVL 5 using Energy; strictly NO DMD generated until LVL 5 + Star Custom) ===
  const handleFeedDuck = (
    duckId: string,
    comboMultiplier = 1,
    isCrit = false
  ): { gainedEnergyBonus: number; leveledUp: boolean } | null => {
    const target = state.ducks.find((d) => d.id === duckId);
    if (!target || target.level >= target.maxLevel) return null;
    const baseFeedCost = getFeedCost(target.level);
    const effectiveCost = activeGodHarvest ? Math.ceil(baseFeedCost * 0.75) : baseFeedCost;
    if (state.corn < effectiveCost) {
      showToast('طاقة الإطعام غير كافية! اجمع الطاقة من البيض أو الحلبة أو الإعلان الاختياري.');
      return null;
    }

    // Combo grants extra Energy burst when chaining consecutive feeds
    const comboEnergyBonus = comboMultiplier >= 2 ? Math.round(effectiveCost * 0.25 * comboMultiplier) : 0;
    const tapSteps = isCrit ? 2 : 1;
    const nextProgress = target.feedsProgress + tapSteps;
    const leveledUp = nextProgress >= target.feedsRequired;
    const nextLv = Math.min(target.maxLevel, target.level + 1);
    const nextEvoStage = DUCK_EVOLUTION_LEVELS[Math.max(0, Math.min(4, nextLv - 1))];
    const levelPowerGain = 30 + nextEvoStage.level * 15;

    setState((prev) => ({
      ...prev,
      corn: prev.corn - effectiveCost + comboEnergyBonus,
      battlePass: {
        ...prev.battlePass,
        xp: prev.battlePass.xp + (isCrit ? 6 : 3) + (leveledUp ? 30 : 0),
      },
      ducks: prev.ducks.map((d) => {
        if (d.id !== duckId) return d;
        if (leveledUp) {
          return {
            ...d,
            level: nextLv,
            feedCost: getFeedCost(nextLv),
            powerRating: d.powerRating + levelPowerGain,
            feedsProgress: nextLv >= d.maxLevel ? nextEvoStage.feedsRequired : 0,
            feedsRequired: nextEvoStage.feedsRequired,
          };
        }
        return {
          ...d,
          feedsProgress: nextProgress,
        };
      }),
      eggQueue: (prev.stats.totalFeeds + 1) % 3 === 0 ? [...prev.eggQueue, 'egg_1'] : prev.eggQueue,
      stats: {
        ...prev.stats,
        totalFeeds: prev.stats.totalFeeds + 1,
        hearts: prev.stats.hearts + (target.skin === 'cupid' ? 20 : 12),
      },
      dailyTasks: prev.dailyTasks.map((dt) =>
        dt.id === 'dt_feed' ? { ...dt, progress: Math.min(dt.target, dt.progress + 1) } : dt
      ),
    }));

    if (leveledUp) {
      if (nextLv >= 5) {
        showToast('🔥 بلغ التنين المرحلة 5! خصّصه الآن بالنجوم لبدء توليد DMD!');
      } else {
        showToast(`ترقى التنين إلى ${nextEvoStage.titleAr}! (+${levelPowerGain} قوة ⚡)`);
      }
    }
    return { gainedEnergyBonus: comboEnergyBonus, leveledUp };
  };

  // === STAR CUSTOMIZATION UPGRADE (Custom_LVL 0 -> 10; Unlocks DMD generation at LVL 5!) ===
  const handleUpgradeStarCustomization = (duckId: string) => {
    const target = state.ducks.find((d) => d.id === duckId);
    if (!target) return;
    if (target.level < 5) {
      soundFX.playError();
      showToast('يجب وصول التنين إلى المرحلة 5 أولاً قبل التخصيص بالنجوم!');
      return;
    }
    if (target.customLevel >= 10) {
      soundFX.playError();
      showToast('وصل التنين إلى أقصى مستوى تخصيص بالنجوم (10/10)!');
      return;
    }

    const starCost = getCustomUpgradeCost(target.customLevel);
    if (state.stars < starCost) {
      soundFX.playError();
      showToast(`تحتاج ${starCost} نجمة ★ للترقية إلى التخصيص ${target.customLevel + 1}!`);
      return;
    }

    soundFX.playGodConfirm();
    setState((prev) => {
      const nextCustom = target.customLevel + 1;
      const updatedDucks = prev.ducks.map((d) => {
        if (d.id !== duckId) return d;
        const updated: Duck = {
          ...d,
          customLevel: nextCustom,
          staked: d.slotIndex !== null && d.slotIndex < prev.unlockedSlots,
          powerRating: d.powerRating + 45,
        };
        return {
          ...updated,
          stakeRatePerHour: getDragonDmdPerHour(updated),
        };
      });

      return {
        ...prev,
        stars: prev.stars - starCost,
        battlePass: { ...prev.battlePass, xp: prev.battlePass.xp + 35 },
        ducks: updatedDucks,
      };
    });
    showToast(`⭐ تمت ترقية التخصيص إلى ★${target.customLevel + 1}! بدأ توليد DMD بنسبة +12%!`);
  };

  const handleCollectDragonDmd = (duckId: string) => {
    const target = state.ducks.find((d) => d.id === duckId);
    if (!target || target.dmdStored <= 0) {
      soundFX.playError();
      showToast('لا يوجد رصيد DMD متراكم للجمع حالياً.');
      return;
    }

    const collected = target.dmdStored;
    soundFX.playClaim();
    setState((prev) => ({
      ...prev,
      dmdTotal: prev.dmdTotal + collected,
      ducks: prev.ducks.map((d) =>
        d.id === duckId ? { ...d, dmd: d.dmd + collected, dmdStored: 0 } : d
      ),
    }));
    showToast(`تم جمع +${collected.toFixed(3)} DMD إلى رصيدك المستقبلي!`);
  };

  const handleUpgradeDuckSkill = (duckId: string) => {
    const target = state.ducks.find((d) => d.id === duckId);
    if (!target || target.skillLevel >= 5) return;
    const cost = target.skillLevel * 450;
    if (state.corn < cost) {
      soundFX.playError();
      showToast(`تحتاج ${cost.toLocaleString()} طاقة لترقية المهارة!`);
      return;
    }
    setState((prev) => ({
      ...prev,
      corn: prev.corn - cost,
      battlePass: { ...prev.battlePass, xp: prev.battlePass.xp + 25 },
      ducks: prev.ducks.map((d) =>
        d.id === duckId ? { ...d, skillLevel: d.skillLevel + 1, powerRating: d.powerRating + 38 } : d
      ),
    }));
    showToast(`تمت ترقية مهارة ${target.name} إلى م${target.skillLevel + 1}! (+38 قوة)`);
  };

  // === UNLOCK DRAGON SLOT (Slots 4..8 with exact Star cost & Progression requirement) ===
  const handleUnlockDragonSlot = (slotIndex: number) => {
    const check = checkSlotUnlockEligibility(slotIndex, state);
    if (!check.canUnlock) {
      soundFX.playError();
      showToast(check.reason);
      return;
    }

    const meta = DRAGON_SLOTS[slotIndex];
    soundFX.playChestOpen();

    // Pick a reserve unassigned dragon or hatch a fresh companion dragon into the new slot
    const skins: DuckSkinId[] = ['cool', 'dj', 'gamer', 'pharaoh', 'ninja'];
    const pick = skins[slotIndex % skins.length];

    setState((prev) => {
      const reserveDragon = prev.ducks.find((d) => d.slotIndex === null);
      let nextDucks = prev.ducks;
      let targetIdx = prev.activeDuckIndex;

      if (reserveDragon) {
        nextDucks = prev.ducks.map((d, idx) => {
          if (d.id !== reserveDragon.id) return d;
          targetIdx = idx;
          const updated = { ...d, slotIndex };
          return { ...updated, stakeRatePerHour: getDragonDmdPerHour(updated) };
        });
      } else {
        const newDragon: Duck = {
          id: `dragon_slot_${slotIndex}_${Date.now()}`,
          name: SKIN_CATALOG[pick].name,
          skin: pick,
          rarity: slotIndex >= 5 ? 'RARE' : 'UNCOMMON',
          level: 1,
          maxLevel: 5,
          customLevel: 0,
          dmd: 0,
          dmdStored: 0,
          slotIndex,
          feedCost: getFeedCost(1),
          feedsProgress: 0,
          feedsRequired: 5,
          staked: false,
          stakeRatePerHour: 0,
          skillLevel: 1,
          powerRating: slotIndex >= 5 ? 290 : 185,
          unlockedAt: Date.now(),
        };
        nextDucks = [...prev.ducks, newDragon];
        targetIdx = nextDucks.length - 1;
      }

      return {
        ...prev,
        stars: prev.stars - meta.starCost,
        unlockedSlots: slotIndex + 1,
        ducks: nextDucks,
        activeDuckIndex: targetIdx,
      };
    });

    showToast(`تم فتح ${meta.label} (كفاءة ${meta.efficiencyPct}%) بنجاح!`);
  };

  const handleAssignDragonToSlot = (duckId: string, slotIndex: number) => {
    if (slotIndex >= state.unlockedSlots) return;
    soundFX.playTabSwitch();
    setState((prev) => {
      const currentOccupant = prev.ducks.find((d) => d.slotIndex === slotIndex);
      const movingDragon = prev.ducks.find((d) => d.id === duckId);
      if (!movingDragon) return prev;
      const oldSlot = movingDragon.slotIndex;

      const updatedDucks = prev.ducks.map((d) => {
        if (d.id === duckId) {
          const next = { ...d, slotIndex };
          return { ...next, stakeRatePerHour: getDragonDmdPerHour(next) };
        }
        if (currentOccupant && d.id === currentOccupant.id) {
          const next = { ...d, slotIndex: oldSlot };
          return { ...next, stakeRatePerHour: getDragonDmdPerHour(next) };
        }
        return d;
      });
      return { ...prev, ducks: updatedDucks };
    });
    showToast(`تم نقل التنين إلى الخانة ${slotIndex + 1}!`);
  };

  const handleMergeDucks = (duckIds: string[]) => {
    const picked = state.ducks.filter((d) => duckIds.includes(d.id));
    if (picked.length !== 4) return;
    const curRarityIdx = RARITY_ORDER.indexOf(picked[0].rarity);
    const nextRarity: Rarity = RARITY_ORDER[Math.min(curRarityIdx + 1, RARITY_ORDER.length - 1)];
    const skins: DuckSkinId[] = ['gamer', 'pumpkin', 'pharaoh', 'royal', 'cool'];
    const newSkin = skins[(curRarityIdx + state.stats.totalDucksMerged) % skins.length];
    const freedSlot = picked.find((d) => d.slotIndex !== null)?.slotIndex ?? null;

    const mergedDragon: Duck = {
      id: `dragon_merged_${Date.now()}`,
      name: SKIN_CATALOG[newSkin].name,
      skin: newSkin,
      rarity: nextRarity,
      level: 1,
      maxLevel: 5,
      customLevel: 0,
      dmd: 0,
      dmdStored: 0,
      slotIndex: freedSlot,
      feedCost: getFeedCost(1),
      feedsProgress: 0,
      feedsRequired: 5,
      staked: false,
      stakeRatePerHour: 0,
      skillLevel: 2,
      powerRating: RARITY_STYLE[nextRarity].basePower + 55,
      unlockedAt: Date.now(),
    };

    setState((prev) => {
      const remaining = prev.ducks.filter((d) => !duckIds.includes(d.id));
      return {
        ...prev,
        ducks: [mergedDragon, ...remaining],
        activeDuckIndex: 0,
        battlePass: { ...prev.battlePass, xp: prev.battlePass.xp + 75 },
        stats: {
          ...prev.stats,
          totalDucksMerged: prev.stats.totalDucksMerged + 1,
        },
      };
    });
    showToast(`نجح دمج التنانين! حصلت على تنين ${RARITY_STYLE[nextRarity].labelAr}!`);
  };

  const handleCustomizeDuck = (duckId: string, gear: DuckGearId, aura: DuckAuraId) => {
    setState((prev) => ({
      ...prev,
      ducks: prev.ducks.map((d) => (d.id === duckId ? { ...d, gear, aura } : d)),
    }));
    showToast('تم حفظ مظهر التنين وتجهيزه بنجاح!');
  };

  // === STORE PACKAGE PURCHASE (Feeds 50% to DMD Reserve Treasury & 50% to Ops!) ===
  const handleBuyStorePackage = (packageId: string) => {
    const pkg = STORE_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;

    soundFX.playChestOpen();
    const reserveShare = pkg.priceUsd * 0.5;
    const opsShare = pkg.priceUsd * 0.5;

    setState((prev) => {
      let extraDucks = prev.ducks;
      if (pkg.legendaryDragon) {
        const freeSlot = Array.from({ length: prev.unlockedSlots }, (_, i) => i).find(
          (sIdx) => !prev.ducks.some((dr) => dr.slotIndex === sIdx)
        );
        const leg: Duck = {
          id: `dragon_store_${Date.now()}`,
          name: pkg.legendaryDragon.name,
          skin: pkg.legendaryDragon.skin,
          rarity: pkg.legendaryDragon.rarity,
          level: 3,
          maxLevel: 5,
          customLevel: 0,
          dmd: 0,
          dmdStored: 0,
          slotIndex: freeSlot ?? null,
          feedCost: getFeedCost(3),
          feedsProgress: 0,
          feedsRequired: 9,
          staked: false,
          stakeRatePerHour: 0,
          gear: pkg.legendaryDragon.gear,
          aura: pkg.legendaryDragon.aura,
          skillLevel: 3,
          powerRating: RARITY_STYLE.LEGENDARY.basePower + 80,
          unlockedAt: Date.now(),
        };
        extraDucks = [leg, ...prev.ducks];
      }

      return {
        ...prev,
        corn: prev.corn + pkg.energyReward,
        stars: prev.stars + pkg.starsReward,
        ducks: extraDucks,
        activeDuckIndex: pkg.legendaryDragon ? 0 : prev.activeDuckIndex,
        eggQueue: [...pkg.eggsReward, ...prev.eggQueue],
        treasury: {
          ...prev.treasury,
          reserveUsd: prev.treasury.reserveUsd + reserveShare,
          opsUsd: prev.treasury.opsUsd + opsShare,
          storeRevenueUsd: prev.treasury.storeRevenueUsd + pkg.priceUsd,
          totalPurchases: prev.treasury.totalPurchases + 1,
        },
        stats: {
          ...prev.stats,
          autoMergeBoosters: prev.stats.autoMergeBoosters + (pkg.id === 'pkg_rare_hatchery' ? 1 : 0),
        },
      };
    });
    showToast(`تم الشراء! +$${reserveShare.toFixed(2)} إلى صندوق دعم DMD المستقبلية (50%)!`);
  };

  // === OPTIONAL REWARDED AD (Capped at 5/day, feeds 50% into DMD Reserve Treasury) ===
  const handleWatchRewardedAd = (kind: 'energy' | 'stars' | 'eggs') => {
    if (state.treasury.adsWatchedToday >= state.treasury.maxAdsPerDay) {
      soundFX.playError();
      showToast(`وصلت للحد اليومي (${state.treasury.maxAdsPerDay}/${state.treasury.maxAdsPerDay}) للإعلانات الاختيارية!`);
      return;
    }

    soundFX.playClaim();
    const adRevenue = 0.04;
    const reserveShare = adRevenue * 0.5;
    const opsShare = adRevenue * 0.5;

    setState((prev) => ({
      ...prev,
      corn: kind === 'energy' ? prev.corn + 350 : prev.corn,
      stars: kind === 'stars' ? prev.stars + 8 : prev.stars,
      eggQueue: kind === 'eggs' ? ['egg_3', 'egg_2', ...prev.eggQueue] : prev.eggQueue,
      treasury: {
        ...prev.treasury,
        reserveUsd: prev.treasury.reserveUsd + reserveShare,
        opsUsd: prev.treasury.opsUsd + opsShare,
        adRevenueUsd: prev.treasury.adRevenueUsd + adRevenue,
        adsWatchedToday: prev.treasury.adsWatchedToday + 1,
      },
    }));

    const label =
      kind === 'energy' ? '+350 طاقة إطعام' : kind === 'stars' ? '+8 نجوم ★' : '+2 بيضة تنين';
    showToast(`شكراً لمشاهدتك! ${label} (دعم الصندوق بـ 50% من العائد)`);
  };

  const handleMergeCells = (fromIndex: number, toIndex: number) => {
    const fromCell = state.grid[fromIndex];
    const toCell = state.grid[toIndex];
    if (!fromCell || !toCell || fromCell.locked || toCell.locked || !fromCell.item) return;

    if (!toCell.item) {
      soundFX.playTapFeed();
      setState((prev) => ({
        ...prev,
        grid: prev.grid.map((c) => {
          if (c.index === fromIndex) return { ...c, item: null, justMerged: false };
          if (c.index === toIndex) return { ...c, item: fromCell.item, justMerged: false };
          return { ...c, justMerged: false };
        }),
      }));
      return;
    }

    if (fromCell.item === toCell.item) {
      const meta = EGG_ITEM_META[fromCell.item];
      if (!meta.next) {
        soundFX.playError();
        return;
      }

      let resultItem: EggItemType = meta.next;
      if (activeGodFortune && Math.random() < 0.2 && EGG_ITEM_META[resultItem]?.next) {
        resultItem = EGG_ITEM_META[resultItem].next!;
      }

      const resultMeta = EGG_ITEM_META[resultItem];
      const blitzMult = blitzSecLeft > 0 ? 2 : 1;
      soundFX.playMerge(resultMeta.tier);

      setState((prev) => ({
        ...prev,
        corn: prev.corn + resultMeta.cornValue * blitzMult,
        battlePass: { ...prev.battlePass, xp: prev.battlePass.xp + 6 * blitzMult },
        stats: {
          ...prev.stats,
          totalMerges: prev.stats.totalMerges + 1,
          totalEggsHatched: prev.stats.totalEggsHatched + 1,
          hearts: prev.stats.hearts + (resultItem === 'egg_love' ? 350 : 25),
        },
        dailyTasks: prev.dailyTasks.map((dt) =>
          dt.id === 'dt_merge' ? { ...dt, progress: Math.min(dt.target, dt.progress + 1) } : dt
        ),
        grid: prev.grid.map((c) => {
          if (c.index === fromIndex) return { ...c, item: null, justMerged: false };
          if (c.index === toIndex) return { ...c, item: resultItem, justMerged: true };
          return { ...c, justMerged: false };
        }),
      }));
    }
  };

  const handleStartBlitz = () => {
    setBlitzSecLeft(30);
    setState((p) => ({
      ...p,
      eggQueue: ['egg_2', 'egg_2', 'egg_3', 'egg_1', 'egg_1', 'grapes', ...p.eggQueue],
    }));
    showToast('🔥 بدأت موجة دمج بيض التنانين 2× لمدة 30 ثانية!');
  };

  const handleAutoMergeBoard = (): number => {
    if (state.stats.autoMergeBoosters <= 0) {
      showToast('لا توجد شحنات دمج تلقائي متبقية! احصل عليها من تذكرة الموسم.');
      return 0;
    }

    let mergesPerformed = 0;
    let totalCornEarned = 0;
    const nextGrid = state.grid.map((c) => ({ ...c, justMerged: false }));

    const itemBuckets = new Map<EggItemType, number[]>();
    nextGrid.forEach((cell) => {
      if (!cell.locked && cell.item && EGG_ITEM_META[cell.item]?.next) {
        const list = itemBuckets.get(cell.item) ?? [];
        list.push(cell.index);
        itemBuckets.set(cell.item, list);
      }
    });

    itemBuckets.forEach((indices, itemType) => {
      const nextTier = EGG_ITEM_META[itemType]?.next;
      if (!nextTier) return;
      for (let i = 0; i + 1 < indices.length && mergesPerformed < 6; i += 2) {
        const idxA = indices[i];
        const idxB = indices[i + 1];
        nextGrid[idxA].item = null;
        nextGrid[idxB].item = nextTier;
        nextGrid[idxB].justMerged = true;
        mergesPerformed++;
        totalCornEarned += EGG_ITEM_META[nextTier].cornValue;
      }
    });

    if (mergesPerformed === 0) {
      showToast('لا توجد أزواج متطابقة جاهزة للدمج الآن!');
      return 0;
    }

    setState((prev) => ({
      ...prev,
      corn: prev.corn + totalCornEarned,
      battlePass: { ...prev.battlePass, xp: prev.battlePass.xp + mergesPerformed * 8 },
      grid: nextGrid,
      stats: {
        ...prev.stats,
        autoMergeBoosters: prev.stats.autoMergeBoosters - 1,
        totalMerges: prev.stats.totalMerges + mergesPerformed,
      },
    }));
    showToast(`⚡ الدمج الذكي نفّذ ${mergesPerformed} عمليات دمج (+${totalCornEarned} طاقة)!`);
    return mergesPerformed;
  };

  const handleUseHammerOnCell = (cellIndex: number) => {
    const cell = state.grid[cellIndex];
    if (!cell || !cell.item || state.stats.hammerBoosters <= 0) return;
    const nextTier = EGG_ITEM_META[cell.item]?.next;
    if (!nextTier) return;

    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((c) =>
        c.index === cellIndex ? { ...c, item: nextTier, justMerged: true } : { ...c, justMerged: false }
      ),
      stats: { ...prev.stats, hammerBoosters: prev.stats.hammerBoosters - 1 },
    }));
    showToast(`🔨 تمت ترقية العنصر إلى ${EGG_ITEM_META[nextTier].name}!`);
  };

  const handlePlaceQueuedEgg = (targetIndex?: number) => {
    if (state.eggQueue.length === 0) return;
    const nextItem = state.eggQueue[0];
    const emptyIdx =
      targetIndex !== undefined && !state.grid[targetIndex]?.locked && !state.grid[targetIndex]?.item
        ? targetIndex
        : state.grid.findIndex((c) => !c.locked && c.item === null);

    if (emptyIdx === -1) {
      soundFX.playError();
      showToast('الساحة ممتلئة! استخدم الدمج التلقائي أو ادمج يدوياً.');
      return;
    }

    setState((prev) => ({
      ...prev,
      eggQueue: prev.eggQueue.slice(1),
      grid: prev.grid.map((c) =>
        c.index === emptyIdx ? { ...c, item: nextItem, justMerged: true } : { ...c, justMerged: false }
      ),
    }));
  };

  const handleDeliverToGod = (orderId: string, cellIndex?: number) => {
    const order = state.godOrders.find((o) => o.id === orderId);
    if (!order) return;
    const idx =
      cellIndex !== undefined
        ? cellIndex
        : state.grid.findIndex((c) => !c.locked && c.item === order.wantedItem);
    if (idx === -1) return;

    const blitzMult = blitzSecLeft > 0 ? 2 : 1;
    const basePts = activeGodHype ? Math.round(order.trophyPoints * 1.5) : order.trophyPoints;
    const ptsEarned = basePts * blitzMult;
    const newOrder = createRandomGodOrder(state.stats.totalErrands + 1);

    setState((prev) => ({
      ...prev,
      corn: prev.corn + order.cornReward * blitzMult,
      duckGold: prev.duckGold + 1,
      battlePass: { ...prev.battlePass, xp: prev.battlePass.xp + 25 },
      godOrders: prev.godOrders.map((o) => (o.id === orderId ? newOrder : o)),
      grid: prev.grid.map((c) => (c.index === idx ? { ...c, item: null, justMerged: false } : c)),
      tournament: {
        ...prev.tournament,
        score: prev.tournament.score + ptsEarned,
      },
      stats: {
        ...prev.stats,
        totalErrands: prev.stats.totalErrands + 1,
        medals: prev.stats.medals + 10,
      },
      dailyTasks: prev.dailyTasks.map((dt) =>
        dt.id === 'dt_errands' ? { ...dt, progress: Math.min(dt.target, dt.progress + 1) } : dt
      ),
    }));
    showToast(`تم تسليم ${EGG_ITEM_META[order.wantedItem].name}! +${order.cornReward * blitzMult} طاقة و +${ptsEarned} 🏆`);
  };

  const handleOpenSnackChest = (cellIndex: number) => {
    const drops: EggItemType[] = ['grapes', 'chalice', 'cornucopia', 'feast', 'egg_4'];
    const energyBonus = activeGodPlunder ? 610 : 450;
    setState((prev) => ({
      ...prev,
      corn: prev.corn + energyBonus,
      grid: prev.grid.map((c) => (c.index === cellIndex ? { ...c, item: 'chalice', justMerged: true } : c)),
      eggQueue: [...drops, ...prev.eggQueue],
      stats: {
        ...prev.stats,
        autoMergeBoosters: prev.stats.autoMergeBoosters + 1,
      },
    }));
    showToast(`تم فتح صندوق الكنوز! +${energyBonus} طاقة و +1 معزز دمج!`);
  };

  const handleUnlockGridSlot = (cellIndex: number) => {
    if (state.stars < 10) return;
    setState((prev) => ({
      ...prev,
      stars: prev.stars - 10,
      grid: prev.grid.map((c) => (c.index === cellIndex ? { ...c, locked: false } : c)),
    }));
    showToast('تم فتح خانة جديدة في حقل البيض!');
  };

  const handleActivateGod = (godId: string, payWith: 'gold' | 'stars') => {
    const god = state.godCards.find((g) => g.id === godId);
    if (!god || god.owned) return;
    if (payWith === 'gold' && state.duckGold < god.goldCost) return;
    if (payWith === 'stars' && state.stars < god.starCost) return;

    setState((prev) => ({
      ...prev,
      duckGold: payWith === 'gold' ? prev.duckGold - god.goldCost : prev.duckGold,
      stars: payWith === 'stars' ? prev.stars - god.starCost : prev.stars,
      godCards: prev.godCards.map((g) => (g.id === godId ? { ...g, owned: true, active: true } : g)),
    }));
    showToast(`تم تفعيل ${god.name} بشكل دائم!`);
  };

  const handleFlipCoin = (packId: string): DuckSkinId | null => {
    const pack = state.flipCoins.find((p) => p.id === packId);
    if (!pack || pack.count <= 0) return null;
    const pickedSkin = pack.possibleSkins[Math.floor(Math.random() * pack.possibleSkins.length)];

    setState((prev) => {
      const updatedPacks = prev.flipCoins.map((p) => {
        if (p.id !== packId) return p;
        const nextUnlocked = p.unlockedSkins.includes(pickedSkin)
          ? p.unlockedSkins
          : [...p.unlockedSkins, pickedSkin];
        return { ...p, count: p.count - 1, unlockedSkins: nextUnlocked };
      });
      const updatedDucks = prev.ducks.map((d, idx) =>
        idx === prev.activeDuckIndex ? { ...d, skin: pickedSkin, name: SKIN_CATALOG[pickedSkin].name } : d
      );
      const nextSkins = prev.unlockedSkins.includes(pickedSkin)
        ? prev.unlockedSkins
        : [...prev.unlockedSkins, pickedSkin];
      return {
        ...prev,
        flipCoins: updatedPacks,
        ducks: updatedDucks,
        unlockedSkins: nextSkins,
      };
    });
    return pickedSkin;
  };

  const handleSpinWheel = (mega: boolean) => {
    if (mega && state.stars < 100) return null;
    if (!mega && state.stats.medals < 100) return null;

    const outcomes = [
      { label: '2,500 طاقة ⚡', type: 'corn' as const, amount: mega ? 15000 : 2500 },
      { label: '20 نجمة ★', type: 'stars' as const, amount: mega ? 150 : 20 },
      { label: '25 ذهب 💎', type: 'gold' as const, amount: mega ? 120 : 25 },
      { label: 'تنين نادر 🐉', type: 'duck' as const, amount: 1 },
      { label: '150 ميدالية 🏅', type: 'medals' as const, amount: mega ? 400 : 150 },
    ];
    const pick = outcomes[Math.floor(Math.random() * outcomes.length)];

    setState((prev) => {
      let extraDucks = prev.ducks;
      if (pick.type === 'duck') {
        const freeSlot = Array.from({ length: prev.unlockedSlots }, (_, i) => i).find(
          (sIdx) => !prev.ducks.some((dr) => dr.slotIndex === sIdx)
        );
        const newDragon: Duck = {
          id: `dragon_wheel_${Date.now()}`,
          name: 'التنين الإمبراطوري الملكي',
          skin: 'royal',
          rarity: 'RARE',
          level: 1,
          maxLevel: 5,
          customLevel: 0,
          dmd: 0,
          dmdStored: 0,
          slotIndex: freeSlot ?? null,
          feedCost: getFeedCost(1),
          feedsProgress: 0,
          feedsRequired: 5,
          staked: false,
          stakeRatePerHour: 0,
          skillLevel: 2,
          powerRating: 315,
          unlockedAt: Date.now(),
        };
        extraDucks = [...prev.ducks, newDragon];
      }
      return {
        ...prev,
        corn: pick.type === 'corn' ? prev.corn + pick.amount : prev.corn,
        stars: (mega ? prev.stars - 100 : prev.stars) + (pick.type === 'stars' ? pick.amount : 0),
        duckGold: pick.type === 'gold' ? prev.duckGold + pick.amount : prev.duckGold,
        ducks: extraDucks,
        stats: {
          ...prev.stats,
          medals: (!mega ? prev.stats.medals - 100 : prev.stats.medals) + (pick.type === 'medals' ? pick.amount : 0),
          wheelSpins: prev.stats.wheelSpins + 1,
        },
      };
    });

    return pick;
  };

  const handleRedeemPromo = (code: string): { ok: boolean; message: string } => {
    const valid: Record<string, { corn: number; stars: number; gold: number; label: string }> = {
      DRAGON2026: { corn: 2000, stars: 25, gold: 0, label: '+2,000 طاقة و +25 ★' },
      GOLD100: { corn: 0, stars: 0, gold: 40, label: '+40 ذهب تنانين' },
      DRACO50: { corn: 1200, stars: 15, gold: 0, label: '+1,200 طاقة و +15 ★' },
    };
    const match = valid[code];
    if (!match) return { ok: false, message: 'الرمز غير صحيح! جرّب DRAGON2026 أو GOLD100' };
    if (state.usedPromoCodes.includes(code)) return { ok: false, message: 'تم استخدام هذا الرمز مسبقاً.' };

    setState((prev) => ({
      ...prev,
      corn: prev.corn + match.corn,
      stars: prev.stars + match.stars,
      duckGold: prev.duckGold + match.gold,
      usedPromoCodes: [...prev.usedPromoCodes, code],
    }));
    return { ok: true, message: `تم التفعيل! حصلت على ${match.label}` };
  };

  const handleBidListing = (listingId: string) => {
    const item = state.marketListings.find((l) => l.id === listingId);
    if (!item || item.soldStatus !== 'ACTIVE') return;
    const bidCost = Math.round(item.cornPrice * 1.12);
    if (state.corn < bidCost) return;

    setState((prev) => ({
      ...prev,
      corn: prev.corn - bidCost,
      marketListings: prev.marketListings.map((l) =>
        l.id === listingId
          ? {
              ...l,
              cornPrice: bidCost,
              isUserBid: true,
              rivalSniped: false,
              lastBidder: prev.username,
              timeLeftSec: Math.max(l.timeLeftSec, 8),
            }
          : l
      ),
    }));
    showToast('تم تسجيل مزايدتك بالطاقة! احذر من كسر الخصوم في الثواني الأخيرة.');
  };

  const handleBuyNowListing = (listingId: string) => {
    const item = state.marketListings.find((l) => l.id === listingId);
    if (!item || item.soldStatus !== 'ACTIVE' || state.stars < item.starPrice) return;

    const freeSlot = Array.from({ length: state.unlockedSlots }, (_, i) => i).find(
      (sIdx) => !state.ducks.some((dr) => dr.slotIndex === sIdx)
    );
    const wonDragon: Duck = {
      id: `dragon_buy_${Date.now()}`,
      name: item.duckName,
      skin: item.skin,
      rarity: item.rarity,
      level: item.level,
      maxLevel: 5,
      customLevel: 0,
      dmd: 0,
      dmdStored: 0,
      slotIndex: freeSlot ?? null,
      feedCost: getFeedCost(item.level),
      feedsProgress: item.level >= 5 ? 12 : 0,
      feedsRequired: DUCK_EVOLUTION_LEVELS[Math.max(0, Math.min(4, item.level - 1))].feedsRequired,
      staked: false,
      stakeRatePerHour: 0,
      xl: item.xl,
      skillLevel: 2,
      powerRating: RARITY_STYLE[item.rarity].basePower + item.level * 20,
      unlockedAt: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      stars: prev.stars - item.starPrice,
      ducks: [...prev.ducks, wonDragon],
      marketListings: prev.marketListings.map((l) =>
        l.id === listingId ? { ...l, soldStatus: 'SOLD_YOU', timeLeftSec: 0 } : l
      ),
    }));
    showToast(`تم اقتناء ${item.duckName} بنجاح!`);
  };

  const handleBattleResult = useCallback(
    (won: boolean, rewardCorn: number, rewardStars: number, leaguePts: number, xp: number, gold: number) => {
      const eventStarMult = won ? currentWeekendEvent.starBonusMult : 1;
      const plunderMult = activeGodPlunder && won ? 1.35 : 1;
      const finalCorn = Math.round(rewardCorn * plunderMult);
      const finalStars = Math.round(rewardStars * eventStarMult);

      setState((prev) => ({
        ...prev,
        corn: prev.corn + finalCorn,
        stars: prev.stars + finalStars,
        duckGold: prev.duckGold + gold,
        battlePass: { ...prev.battlePass, xp: prev.battlePass.xp + xp },
        league: {
          ...prev.league,
          points: prev.league.points + leaguePts,
          wins: won ? prev.league.wins + 1 : prev.league.wins,
          winStreak: won ? prev.league.winStreak + 1 : 0,
        },
        dailyTasks: prev.dailyTasks.map((dt) =>
          dt.id === 'dt_claims' && won ? { ...dt, progress: Math.min(dt.target, dt.progress + 1) } : dt
        ),
      }));
    },
    [activeGodPlunder, currentWeekendEvent.starBonusMult]
  );

  const handleRaceResult = useCallback(
    (place: number, rewardCorn: number, rewardStars: number, leaguePts: number, xp: number) => {
      const finalStars = rewardStars * currentWeekendEvent.starBonusMult;
      setState((prev) => ({
        ...prev,
        corn: prev.corn + rewardCorn,
        stars: prev.stars + finalStars,
        battlePass: { ...prev.battlePass, xp: prev.battlePass.xp + xp },
        league: {
          ...prev.league,
          points: prev.league.points + leaguePts,
          racesWon: place === 1 ? prev.league.racesWon + 1 : prev.league.racesWon,
        },
      }));
      showToast(`أنهيت السباق في المركز #${place}! +${rewardCorn.toLocaleString()} طاقة و +${finalStars} ★`);
    },
    [currentWeekendEvent.starBonusMult, showToast]
  );

  const handleClaimDailyLeague = () => {
    if (state.league.dailyClaimed) return;
    const meta = getLeagueMeta(state.league.points);
    setState((p) => ({
      ...p,
      corn: p.corn + meta.dailyCorn,
      stars: p.stars + meta.dailyStars,
      duckGold: p.duckGold + meta.dailyGold,
      league: { ...p.league, dailyClaimed: true },
    }));
    showToast(`تم استلام مكافأة ${meta.nameAr}!`);
  };

  const handleClaimBattlePassReward = (level: number, track: 'FREE' | 'PREMIUM') => {
    const meta = BATTLE_PASS_LEVELS.find((l) => l.level === level);
    if (!meta) return;
    setState((prev) => {
      if (track === 'FREE') {
        if (prev.battlePass.claimedFree.includes(level)) return prev;
        return {
          ...prev,
          corn: meta.freeType === 'corn' ? prev.corn + meta.freeAmount : prev.corn,
          stars: meta.freeType === 'stars' ? prev.stars + meta.freeAmount : prev.stars,
          eggQueue:
            meta.freeType === 'eggs'
              ? [...prev.eggQueue, ...Array.from({ length: meta.freeAmount }, () => 'egg_3' as EggItemType)]
              : prev.eggQueue,
          battlePass: { ...prev.battlePass, claimedFree: [...prev.battlePass.claimedFree, level] },
        };
      } else {
        if (!prev.battlePass.premiumUnlocked || prev.battlePass.claimedPremium.includes(level)) return prev;
        let extraDucks = prev.ducks;
        if (meta.premiumType === 'duck') {
          const freeSlot = Array.from({ length: prev.unlockedSlots }, (_, i) => i).find(
            (sIdx) => !prev.ducks.some((dr) => dr.slotIndex === sIdx)
          );
          extraDucks = [
            {
              id: `dragon_bp_${Date.now()}`,
              name: 'التنين الإمبراطوري الأسطوري',
              skin: 'royal',
              rarity: 'LEGENDARY',
              level: 1,
              maxLevel: 5,
              customLevel: 0,
              dmd: 0,
              dmdStored: 0,
              slotIndex: freeSlot ?? null,
              feedCost: getFeedCost(1),
              feedsProgress: 0,
              feedsRequired: 5,
              staked: false,
              stakeRatePerHour: 0,
              skillLevel: 3,
              powerRating: 750,
              unlockedAt: Date.now(),
            },
            ...prev.ducks,
          ];
        }
        return {
          ...prev,
          stars: meta.premiumType === 'stars' ? prev.stars + meta.premiumAmount : prev.stars,
          duckGold: meta.premiumType === 'gold' ? prev.duckGold + meta.premiumAmount : prev.duckGold,
          ducks: extraDucks,
          stats:
            meta.premiumType === 'boost'
              ? {
                  ...prev.stats,
                  autoMergeBoosters: prev.stats.autoMergeBoosters + meta.premiumAmount,
                  hammerBoosters: prev.stats.hammerBoosters + 1,
                }
              : prev.stats,
          battlePass: { ...prev.battlePass, claimedPremium: [...prev.battlePass.claimedPremium, level] },
        };
      }
    });
    showToast(`تم استلام جائزة المستوى ${level} من تذكرة الموسم!`);
  };

  const claimableDailyCount = state.dailyTasks.filter((t) => !t.claimed && t.progress >= t.target).length;

  if (screen === 'TITLE') {
    return (
      <TitleScreen
        hasSavedProgress={hasSave}
        savedDmd={state.dmdTotal}
        savedDuckCount={state.ducks.length}
        muted={state.muted}
        onToggleMute={() => setState((p) => ({ ...p, muted: !p.muted }))}
        onStart={() => setScreen('PLAYING')}
        onResetNewGame={() => {
          const fresh = createInitialGameState();
          setState(fresh);
          setScreen('PLAYING');
        }}
      />
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#0b0d14] text-slate-100 overflow-hidden select-none">
      {/* Persistent Top Bar (Overlap-Free Mobile & Desktop) */}
      <header className="shrink-0 h-14 px-2 sm:px-5 bg-[#12151f] border-b border-slate-800/90 flex items-center justify-between gap-1.5 z-20">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setModal('PAUSE')}
            title="القائمة والإعدادات"
            className="flex items-center gap-1.5 px-2 h-8 sm:h-9 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-amber-400/50 cursor-pointer shrink-0"
          >
            <span className="w-5 h-5 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-black">
              🐉
            </span>
            <span className="font-mono-num text-[11px] font-bold text-slate-200 hidden md:inline">
              {state.username}
            </span>
          </button>

          <button
            onClick={() => {
              soundFX.playTabSwitch();
              setModal('PACK');
            }}
            className="flex items-center gap-1 px-2 sm:px-2.5 h-8 sm:h-9 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-rose-400/60 text-[11px] sm:text-xs font-bold text-slate-100 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>السرب</span>
          </button>

          <button
            onClick={() => {
              soundFX.playTabSwitch();
              setModal('TRADER');
            }}
            title="التاجر المتنقل"
            className="flex items-center gap-1 px-2 sm:px-2.5 h-8 sm:h-9 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-amber-400/60 text-[11px] font-extrabold text-amber-300 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">التاجر</span>
          </button>

          <button
            onClick={() => {
              soundFX.playTabSwitch();
              setModal('WALLET');
            }}
            aria-label="صندوق DMD والمحفظة"
            title="صندوق DMD والمحفظة"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-sky-400/60 flex items-center justify-center text-slate-200 cursor-pointer shrink-0"
          >
            <Wallet className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            title="طاقة الإطعام"
            className="flex items-center gap-1 font-mono-num text-xs sm:text-base font-black text-white whitespace-nowrap"
          >
            <span>{formatCompactNumber(state.corn)}</span>
            <CornIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>

          <div
            title="النجوم (عملة التخصيص والخانات)"
            className="flex items-center gap-1 font-mono-num text-xs sm:text-base font-black text-white whitespace-nowrap"
          >
            <span>{state.stars.toLocaleString()}</span>
            <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>

          <button
            onClick={() => setState((p) => ({ ...p, muted: !p.muted }))}
            aria-label={state.muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer shrink-0"
          >
            {state.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'DUCKS' && (
          <DucksTab
            state={state}
            onSelectDuck={(idx) => setState((p) => ({ ...p, activeDuckIndex: idx }))}
            onFeedDuck={handleFeedDuck}
            onUpgradeStarCustomization={handleUpgradeStarCustomization}
            onCollectDragonDmd={handleCollectDragonDmd}
            onUpgradeDuckSkill={handleUpgradeDuckSkill}
            onCustomizeDuck={handleCustomizeDuck}
            onUnlockSlot={handleUnlockDragonSlot}
            onAssignSlot={handleAssignDragonToSlot}
            onMergeDucks={handleMergeDucks}
            onWatchRewardedAd={handleWatchRewardedAd}
            onOpenDuckerPass={() => setModal('DUCKER_PASS')}
            onOpenDailyPass={() => setModal('DAILY_PASS')}
            onOpenDailyTasks={() => setModal('DAILY_TASKS')}
            onOpenTreasures={() => {
              setGodsInitialSubTab('TREASURES');
              setActiveTab('GODS');
            }}
            onGoToArena={() => setActiveTab('ARENA')}
            onClaimTimedBonus={() => {
              setTimedBonusReadyIn(45);
              setState((p) => ({
                ...p,
                corn: p.corn + 250,
                eggQueue: [...p.eggQueue, 'egg_1', 'egg_2'],
              }));
              showToast('تم استلام المكافأة المؤقتة (+250 طاقة و +2 بيضة تنين)!');
            }}
            timedBonusReadyIn={timedBonusReadyIn}
          />
        )}

        {activeTab === 'EGGS' && (
          <EggsTab
            state={state}
            blitzSecLeft={blitzSecLeft}
            onStartBlitz={handleStartBlitz}
            onAutoMergeBoard={handleAutoMergeBoard}
            onUseHammerOnCell={handleUseHammerOnCell}
            onMergeCells={handleMergeCells}
            onPlaceQueuedEgg={handlePlaceQueuedEgg}
            onDeliverToGod={handleDeliverToGod}
            onOpenSnackChest={handleOpenSnackChest}
            onUnlockGridSlot={handleUnlockGridSlot}
            onOpenTournament={() => setModal('TOURNAMENT')}
          />
        )}

        {activeTab === 'ARENA' && (
          <ArenaTab
            state={state}
            onBattleResult={handleBattleResult}
            onRaceResult={handleRaceResult}
            onClaimDailyLeague={handleClaimDailyLeague}
            onRotateWeekendEvent={() =>
              setState((p) => ({ ...p, weekendEventIndex: (p.weekendEventIndex + 1) % WEEKEND_EVENTS.length }))
            }
          />
        )}

        {activeTab === 'GODS' && (
          <GodsTab
            state={state}
            initialSubTab={godsInitialSubTab}
            onActivateGod={handleActivateGod}
            onClaimTreasureStep={(threshold, cornReward, starReward) => {
              setState((p) => ({
                ...p,
                corn: p.corn + cornReward,
                stars: p.stars + starReward,
                claimedTreasureSteps: [...p.claimedTreasureSteps, threshold],
              }));
              showToast(`تم استلام مكافأة الكنز (+${cornReward.toLocaleString()} طاقة و +${starReward} ★)!`);
            }}
            onOpenExchangeGold={() => setModal('WALLET')}
          />
        )}

        {activeTab === 'TASKS' && (
          <TasksTab
            state={state}
            onSwitchTab={(t) => setActiveTab(t)}
            onOpenDailyTasks={() => setModal('DAILY_TASKS')}
            onOpenTrader={() => setModal('TRADER')}
            onFlipCoin={handleFlipCoin}
            onClaimHonorPack={(id, cost, cornReward, starReward) => {
              setState((p) => ({
                ...p,
                corn: p.corn + cornReward,
                stars: p.stars + starReward,
                claimedHonorPacks: [...p.claimedHonorPacks, id],
                stats: { ...p.stats, honorLetters: p.stats.honorLetters - cost },
              }));
              showToast(`تم استلام حزمة الشرف (+${cornReward.toLocaleString()} طاقة و +${starReward} ★)!`);
            }}
            onClaimWatchBonus={() => handleWatchRewardedAd('energy')}
            onClaimAchievement={(id, rewardCorn, rewardStars) => {
              setState((p) => ({
                ...p,
                corn: p.corn + rewardCorn,
                stars: p.stars + rewardStars,
                claimedAchievements: [...p.claimedAchievements, id],
              }));
              showToast('تم استلام مكافأة الإنجاز!');
            }}
            onClaimHeartMilestone={(threshold, rewardType) => {
              setState((p) => {
                let extraDucks = p.ducks;
                if (rewardType === 'duck') {
                  const freeSlot = Array.from({ length: p.unlockedSlots }, (_, i) => i).find(
                    (sIdx) => !p.ducks.some((dr) => dr.slotIndex === sIdx)
                  );
                  extraDucks = [
                    ...p.ducks,
                    {
                      id: `dragon_heart_${Date.now()}`,
                      name: 'تنين القلوب الوردية',
                      skin: 'cupid',
                      rarity: 'RARE',
                      level: 1,
                      maxLevel: 5,
                      customLevel: 0,
                      dmd: 0,
                      dmdStored: 0,
                      slotIndex: freeSlot ?? null,
                      feedCost: getFeedCost(1),
                      feedsProgress: 0,
                      feedsRequired: 5,
                      staked: false,
                      stakeRatePerHour: 0,
                      skillLevel: 2,
                      powerRating: 310,
                      unlockedAt: Date.now(),
                    },
                  ];
                }
                return {
                  ...p,
                  stars: rewardType === 'stars' ? p.stars + 12 : p.stars,
                  corn: rewardType === 'corn' ? p.corn + 2000 : p.corn,
                  ducks: extraDucks,
                  claimedHeartMilestones: [...p.claimedHeartMilestones, threshold],
                };
              });
              showToast('تم استلام مكافأة القلوب!');
            }}
            onClaimSocial={(id, rewardCorn) => {
              setState((p) => ({
                ...p,
                corn: p.corn + rewardCorn,
                claimedSocials: [...p.claimedSocials, id],
              }));
              showToast(`+${rewardCorn} طاقة من المهام الاجتماعية!`);
            }}
            onRedeemPromo={handleRedeemPromo}
            onSpinWheel={handleSpinWheel}
            onInviteFriendSim={(premium) => {
              setState((p) => ({
                ...p,
                corn: p.corn + (premium ? 1500 : 400),
                stars: premium ? p.stars + 8 : p.stars,
              }));
              showToast(premium ? '+1,500 طاقة و +8 ★ من صديق مميز!' : '+400 طاقة من دعوة صديق!');
            }}
            onInstantMerge={(rarity) => {
              const cost = rarity === 'RARE' ? 40 : 15;
              if (state.stars < cost) {
                soundFX.playError();
                showToast(`تحتاج ${cost} ★ للاستدعاء الفوري!`);
                return;
              }
              const freeSlot = Array.from({ length: state.unlockedSlots }, (_, i) => i).find(
                (sIdx) => !state.ducks.some((dr) => dr.slotIndex === sIdx)
              );
              const newDragon: Duck = {
                id: `dragon_inst_${Date.now()}`,
                name: rarity === 'RARE' ? 'تنين الرمال الفرعوني' : 'تنين الجحيم اليقطيني',
                skin: rarity === 'RARE' ? 'pharaoh' : 'pumpkin',
                rarity,
                level: 1,
                maxLevel: 5,
                customLevel: 0,
                dmd: 0,
                dmdStored: 0,
                slotIndex: freeSlot ?? null,
                feedCost: getFeedCost(1),
                feedsProgress: 0,
                feedsRequired: 5,
                staked: false,
                stakeRatePerHour: 0,
                skillLevel: 2,
                powerRating: RARITY_STYLE[rarity].basePower + 25,
                unlockedAt: Date.now(),
              };
              setState((p) => ({
                ...p,
                stars: p.stars - cost,
                ducks: [newDragon, ...p.ducks],
                activeDuckIndex: 0,
              }));
              showToast(`تم استدعاء تنين ${RARITY_STYLE[rarity].labelAr} فوري!`);
            }}
          />
        )}

        {activeTab === 'MARKET' && (
          <MarketTab
            state={state}
            onBidListing={handleBidListing}
            onBuyNowListing={handleBuyNowListing}
            onSellOwnDuck={(duckId, cornPrice) => {
              setState((p) => {
                const remaining = p.ducks.filter((d) => d.id !== duckId);
                return {
                  ...p,
                  corn: p.corn + cornPrice,
                  ducks: remaining,
                  activeDuckIndex: 0,
                };
              });
              showToast(`تم بيع التنين مقابل ${formatCompactNumber(cornPrice)} طاقة!`);
            }}
            onBuyMarketGod={(godId) => handleActivateGod(godId, 'stars')}
            onBuyStorePackage={handleBuyStorePackage}
            onWatchRewardedAd={handleWatchRewardedAd}
            onBarterTrade={(tradeType) => {
              if (tradeType === 'CORN_TO_STARS' && state.corn >= 2500) {
                soundFX.playClaim();
                setState((p) => ({ ...p, corn: p.corn - 2500, stars: p.stars + 10 }));
                showToast('تمت المقايضة: +10 نجوم ★ مقابل 2.5K طاقة!');
              } else if (tradeType === 'STARS_TO_CORN' && state.stars >= 10) {
                soundFX.playClaim();
                setState((p) => ({ ...p, stars: p.stars - 10, corn: p.corn + 1800 }));
                showToast('تمت المقايضة: +1.8K طاقة مقابل 10 نجوم ★!');
              } else {
                soundFX.playError();
                showToast('الرصيد غير كافٍ لإتمام المقايضة.');
              }
            }}
          />
        )}

        {toast && (
          <div className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border border-amber-400/60 text-amber-200 text-xs font-extrabold shadow-2xl text-center max-w-[90vw]">
            {toast}
          </div>
        )}
      </main>

      {/* Persistent 6-Tab Bottom Navigation Bar */}
      <nav className="shrink-0 h-16 bg-[#12151f] border-t border-slate-800/90 px-1 flex items-center justify-around z-20">
        {[
          { id: 'MARKET' as MainTab, label: 'المتجر', icon: TrendingUp, badge: 0 },
          { id: 'EGGS' as MainTab, label: 'البيض', icon: Egg, badge: state.eggQueue.length },
          { id: 'DUCKS' as MainTab, label: 'التنانين', icon: ShoppingBag, badge: 0 },
          { id: 'ARENA' as MainTab, label: 'الحلبة', icon: Swords, badge: state.league.dailyClaimed ? 0 : 1 },
          { id: 'GODS' as MainTab, label: 'البركات', icon: Sparkles, badge: 0 },
          { id: 'TASKS' as MainTab, label: 'المهام', icon: CheckSquare, badge: claimableDailyCount },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundFX.playTabSwitch();
                setActiveTab(item.id);
              }}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all cursor-pointer min-w-[50px] ${
                active ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'scale-110 transition-transform' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[15px] px-1 rounded-full bg-rose-500 text-white font-mono-num text-[9px] font-black flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <GameModals
        modal={modal}
        state={state}
        onClose={() => setModal(null)}
        onSwitchTab={(t) => setActiveTab(t)}
        onClaimTournamentMilestone={(threshold, type, amount) => {
          setState((p) => ({
            ...p,
            duckGold: type === 'gold' ? p.duckGold + amount : p.duckGold,
            eggQueue:
              type === 'eggs'
                ? [...p.eggQueue, ...Array.from({ length: amount }, () => 'egg_2' as EggItemType)]
                : p.eggQueue,
            stats: {
              ...p.stats,
              medals: type === 'medals' ? p.stats.medals + amount : p.stats.medals,
            },
            tournament: {
              ...p.tournament,
              claimedMilestones: [...p.tournament.claimedMilestones, threshold],
            },
          }));
          showToast('تم استلام جائزة البطولة الكبرى!');
        }}
        onBuyTraderDeal={() => {
          if (state.stars < 20) return;
          setState((p) => ({
            ...p,
            stars: p.stars - 20,
            eggQueue: ['cornucopia', 'chalice', 'egg_3', 'egg_3', 'egg_2', 'egg_2', 'egg_2', 'egg_1', ...p.eggQueue],
            stats: { ...p.stats, traderDeals: p.stats.traderDeals + 1 },
          }));
          setModal(null);
          showToast('تمت الصفقة! وصلت كنوز التنانين لقائمة انتظار البيض.');
        }}
        onClaimDailyTask={(taskId) => {
          const task = state.dailyTasks.find((t) => t.id === taskId);
          if (!task || task.claimed) return;
          setState((p) => ({
            ...p,
            corn: p.corn + task.rewardEnergy,
            stars: p.stars + task.rewardStars,
            battlePass: { ...p.battlePass, xp: p.battlePass.xp + 30 },
            dailyTasks: p.dailyTasks.map((t) => (t.id === taskId ? { ...t, claimed: true } : t)),
            stats: { ...p.stats, totalTasksClaimed: p.stats.totalTasksClaimed + 1 },
          }));
          showToast(`تم استلام مكافأة المهمة (+${task.rewardStars} ★ و +${task.rewardEnergy} طاقة)!`);
        }}
        onClaimDailyLevelReward={(rewardId, cornReward, eggsReward) => {
          setState((p) => ({
            ...p,
            corn: p.corn + cornReward,
            eggQueue:
              eggsReward > 0
                ? [...p.eggQueue, ...Array.from({ length: eggsReward }, () => 'egg_1' as EggItemType)]
                : p.eggQueue,
            claimedDailyLevelRewards: [...p.claimedDailyLevelRewards, rewardId],
          }));
          showToast('تم استلام مكافأة المرحلة!');
        }}
        onClaimDailyPassDay={() => {
          setState((p) => ({
            ...p,
            corn: p.corn + 2500,
            stars: p.stars + 12,
            eggQueue: ['cornucopia', 'egg_4', 'egg_4', 'egg_4', ...p.eggQueue],
            stats: {
              ...p.stats,
              dailyPassClaimedToday: true,
              autoMergeBoosters: p.stats.autoMergeBoosters + 1,
            },
          }));
          showToast('تم استلام هدية اليوم (+2,500 طاقة و +12 ★)!');
        }}
        onUnlockBattlePassPremium={() => {
          if (state.stars < 60 || state.battlePass.premiumUnlocked) return;
          setState((p) => ({
            ...p,
            stars: p.stars - 60,
            battlePass: { ...p.battlePass, premiumUnlocked: true },
          }));
          showToast('👑 تم تفعيل المسار الملكي لتذكرة الموسم!');
        }}
        onClaimBattlePassReward={handleClaimBattlePassReward}
        onJoinPack={() => {
          setState((p) => ({
            ...p,
            corn: p.corn + 1000,
            stars: p.stars + 8,
            pack: { ...p.pack, joined: true, members: p.pack.members + 1 },
          }));
          showToast('انضممت إلى عش التنانين (+1,000 طاقة و +8 ★)!');
        }}
        onContributePack={(amount) => {
          if (state.corn < amount) return;
          setState((p) => ({
            ...p,
            corn: p.corn - amount,
            stars: p.stars + 5,
            autoMergeUnlocked: true,
            pack: {
              ...p.pack,
              power: p.pack.power + 10,
              treasuryCorn: p.pack.treasuryCorn + amount,
            },
            stats: { ...p.stats, autoMergeBoosters: p.stats.autoMergeBoosters + 1 },
          }));
          showToast('تم دعم السرب (+10 قوة للسرب و +5 ★ و +1 معزز دمج)!');
        }}
        onSendPackMessage={(text) => {
          setState((p) => ({
            ...p,
            pack: {
              ...p.pack,
              messages: [
                ...p.pack.messages,
                {
                  id: `msg_${Date.now()}`,
                  sender: p.username,
                  text,
                  time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                },
              ],
            },
          }));
        }}
        onToggleWalletConnect={() => {
          setState((p) => ({
            ...p,
            wallet: { ...p.wallet, connected: !p.wallet.connected },
          }));
        }}
        onSwapWallet={(direction) => {
          setState((p) => {
            if (direction === 'CORN_TO_STARS' && p.corn >= 2500) {
              return { ...p, corn: p.corn - 2500, stars: p.stars + 10 };
            }
            if (direction === 'CORN_TO_GOLD' && p.corn >= 2000) {
              return { ...p, corn: p.corn - 2000, duckGold: p.duckGold + 15 };
            }
            return p;
          });
          showToast('تمت عملية التحويل بنجاح!');
        }}
        onToggleMute={() => setState((p) => ({ ...p, muted: !p.muted }))}
        onBackToTitle={() => {
          setModal(null);
          setScreen('TITLE');
        }}
        onResetGame={() => {
          const fresh = createInitialGameState();
          setState(fresh);
          setModal(null);
          showToast('تم بدء رحلة جديدة في عالم التنانين!');
        }}
      />
    </div>
  );
}
