import React, { useState } from 'react';
import {
  Check,
  Crown,
  Gift,
  Lock,
  LogOut,
  RotateCcw,
  Send,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from 'lucide-react';
import { GameState, MainTab } from '../../types/game';
import { BATTLE_PASS_LEVELS, formatTimer } from '../../data/gameData';
import {
  CornIcon,
  GodIllustration,
  GoldIcon,
  ItemIcon,
  StarIcon,
} from '../art/DuckArt';
import { soundFX } from '../../utils/sound';

export type ActiveModal =
  | null
  | 'TOURNAMENT'
  | 'TRADER'
  | 'DAILY_TASKS'
  | 'DAILY_PASS'
  | 'DUCKER_PASS'
  | 'PACK'
  | 'WALLET'
  | 'PAUSE';

interface GameModalsProps {
  modal: ActiveModal;
  state: GameState;
  onClose: () => void;
  onSwitchTab: (tab: MainTab) => void;
  onClaimTournamentMilestone: (milestone: number, rewardType: 'eggs' | 'medals' | 'gold', amount: number) => void;
  onBuyTraderDeal: () => void;
  onClaimDailyTask: (taskId: string) => void;
  onClaimDailyLevelReward: (rewardId: number, corn: number, eggs: number) => void;
  onClaimDailyPassDay: () => void;
  onUnlockBattlePassPremium: () => void;
  onClaimBattlePassReward: (level: number, track: 'FREE' | 'PREMIUM') => void;
  onJoinPack: () => void;
  onContributePack: (amount: number) => void;
  onSendPackMessage: (text: string) => void;
  onToggleWalletConnect: () => void;
  onSwapWallet: (direction: 'CORN_TO_STARS' | 'STARS_TO_GRAM' | 'CORN_TO_GOLD') => void;
  onToggleMute: () => void;
  onBackToTitle: () => void;
  onResetGame: () => void;
}

const TOURNAMENT_MILESTONES = [
  { threshold: 40, label: '30 بيضة', type: 'eggs' as const, amount: 15 },
  { threshold: 100, label: '50 ميدالية', type: 'medals' as const, amount: 50 },
  { threshold: 250, label: '40 ذهب 💎', type: 'gold' as const, amount: 40 },
  { threshold: 400, label: '100 ميدالية', type: 'medals' as const, amount: 100 },
];

export const GameModals: React.FC<GameModalsProps> = ({
  modal,
  state,
  onClose,
  onSwitchTab,
  onClaimTournamentMilestone,
  onBuyTraderDeal,
  onClaimDailyTask,
  onClaimDailyLevelReward,
  onClaimDailyPassDay,
  onUnlockBattlePassPremium,
  onClaimBattlePassReward,
  onJoinPack,
  onContributePack,
  onSendPackMessage,
  onToggleWalletConnect,
  onSwapWallet,
  onToggleMute,
  onBackToTitle,
  onResetGame,
}) => {
  const [packMsgInput, setPackMsgInput] = useState('');
  const [walletTab, setWalletTab] = useState<'GRAM' | 'DMD' | 'GODS'>('GRAM');

  if (!modal) return null;

  const currentPassLevel = Math.min(15, Math.floor(state.battlePass.xp / 100) + 1);
  const currentPassProgress = state.battlePass.xp % 100;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 1. DIVINE TOURNAMENT MODAL */}
      {modal === 'TOURNAMENT' && (
        <div className="w-full max-w-md bg-[#161923] border border-amber-400/40 rounded-3xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col">
          <div className="relative bg-gradient-to-b from-purple-900/60 to-[#161923] p-5 text-center border-b border-slate-800">
            <button onClick={onClose} className="absolute top-4 left-4 text-slate-300 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-2 mb-2">
              <GodIllustration godId="bastet" className="w-14 h-14" />
              <GodIllustration godId="dionysus" className="w-16 h-16 -mx-2 z-10" />
              <GodIllustration godId="anubis" className="w-14 h-14" />
            </div>
            <h3 className="font-display text-xl font-black tracking-wide text-white">البطولة الكبرى</h3>
            <p className="text-xs text-slate-300 mt-0.5 font-mono-num">
              نقاطك: <strong className="text-amber-300">{state.tournament.score}</strong> · ينتهي خلال{' '}
              {formatTimer(state.tournament.resetSeconds)}
            </p>
          </div>

          <div className="p-4 overflow-y-auto space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {TOURNAMENT_MILESTONES.map((m) => {
                const reached = state.tournament.score >= m.threshold;
                const claimed = state.tournament.claimedMilestones.includes(m.threshold);
                return (
                  <div
                    key={m.threshold}
                    className={`rounded-2xl p-2 border text-center flex flex-col justify-between ${
                      claimed
                        ? 'bg-slate-900/60 border-slate-800 opacity-70'
                        : reached
                          ? 'bg-amber-400/15 border-amber-400'
                          : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-200">{m.label}</div>
                    <div className="font-mono-num text-[11px] font-black text-emerald-400 my-1">{m.threshold} 🏆</div>
                    <button
                      disabled={!reached || claimed}
                      onClick={() => {
                        soundFX.playChestOpen();
                        onClaimTournamentMilestone(m.threshold, m.type, m.amount);
                      }}
                      className={`w-full py-1 rounded-lg text-[10px] font-black ${
                        claimed
                          ? 'bg-slate-800 text-slate-500'
                          : reached
                            ? 'bg-amber-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {claimed ? 'تم الاستلام' : reached ? 'استلام' : 'مقفل'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5">
              {[
                { rank: 1, name: 'PLAYER6379241', score: 1360, prize: '600 🏁 · 300' },
                { rank: 2, name: 'PLAYER_MAXIM', score: 1090, prize: '450 🏁 · 200' },
                { rank: 3, name: 'PLAYER6642278', score: 820, prize: '300 🏁 · 150' },
                { rank: 4, name: 'DARK_MONSTER', score: 631, prize: '200 🏁 · 120' },
                { rank: 5, name: 'FERMER_DICK', score: 565, prize: '150 🏁 · 100' },
                {
                  rank: Math.max(6, 55 - Math.floor(state.tournament.score / 10)),
                  name: state.username,
                  score: state.tournament.score,
                  prize: 'مكافأتك الحالية',
                  isYou: true,
                },
              ].map((row) => (
                <div
                  key={row.name}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                    row.isYou
                      ? 'bg-amber-400/20 border-amber-400 text-white font-black'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-amber-400 font-black w-7">#{row.rank}</span>
                    <span>{row.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono-num">
                    <span className="text-[11px] text-slate-400">{row.prize}</span>
                    <span className="text-emerald-400 font-bold">{row.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. TRADER MODAL */}
      {modal === 'TRADER' && (
        <div className="w-full max-w-md bg-[#161923] border border-amber-400/40 rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative bg-gradient-to-b from-indigo-950 via-purple-950/60 to-[#161923] p-5 text-center border-b border-slate-800">
            <button onClick={onClose} className="absolute top-4 left-4 text-slate-300 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-2xl font-black text-white">التاجر المتنقل</h3>
            <p className="text-xs text-slate-300 mb-3">تاجر ما لا تحتاجه بما تحتاجه</p>
            <div className="flex justify-center">
              <GodIllustration godId="trader" className="w-24 h-24" />
            </div>
          </div>

          <div className="p-5 space-y-4 text-center">
            <div className="text-xs font-bold text-slate-400 font-mono-num">صفقة {state.stats.traderDeals}/100</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 flex flex-col items-center">
                <ItemIcon item="cornucopia" className="w-10 h-10" />
                <span className="text-[11px] font-bold text-slate-200 mt-1">سلة الخيرات</span>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 flex flex-col items-center">
                <ItemIcon item="chalice" className="w-10 h-10" />
                <span className="text-[11px] font-bold text-slate-200 mt-1">الكأس الذهبي</span>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 flex flex-col items-center">
                <ItemIcon item="egg_3" className="w-10 h-10" />
                <span className="text-[11px] font-bold text-slate-200 mt-1">+8 بيضات</span>
              </div>
            </div>

            <div>
              <span className="inline-block mb-1.5 px-2.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black">
                وفر 25%
              </span>
              <button
                disabled={state.stars < 20}
                onClick={() => {
                  soundFX.playChestOpen();
                  onBuyTraderDeal();
                }}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${
                  state.stars >= 20
                    ? 'bg-gradient-to-b from-[#facc15] to-[#eab308] text-slate-950 hover:brightness-105 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <StarIcon className="w-5 h-5" />
                <span className="font-mono-num">20 ★ (بدلاً من 30)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DAILY TASKS & LEVEL 8 DRAWER */}
      {modal === 'DAILY_TASKS' && (
        <div className="w-full max-w-md bg-[#161923] border border-sky-500/30 rounded-3xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col">
          <div className="p-5 bg-gradient-to-b from-sky-900/30 to-[#161923] border-b border-slate-800 text-center relative">
            <button onClick={onClose} className="absolute top-4 left-4 text-slate-300 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-xl font-black text-white">المهام اليومية</h3>
            <p className="text-xs text-slate-400">أكمل المهام لكسب النجوم ★ وطاقة إطعام التنانين ⚡</p>
          </div>

          <div className="p-4 overflow-y-auto space-y-3">
            {state.dailyTasks.map((t) => {
              const done = t.progress >= t.target;
              return (
                <div
                  key={t.id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-white truncate">{t.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-rose-500"
                          style={{ width: `${Math.min(100, (t.progress / t.target) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono-num text-[10px] text-amber-300 font-bold">
                        +{t.rewardStars} ★ · +{t.rewardEnergy} ⚡
                      </span>
                    </div>
                  </div>
                  {t.claimed ? (
                    <span className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </span>
                  ) : done ? (
                    <button
                      onClick={() => {
                        soundFX.playClaim();
                        onClaimDailyTask(t.id);
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer shrink-0"
                    >
                      استلام
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (t.actionTab) onSwitchTab(t.actionTab);
                        onClose();
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-[11px] hover:bg-slate-700 cursor-pointer shrink-0"
                    >
                      {t.actionLabel}
                    </button>
                  )}
                </div>
              );
            })}

            <div className="rounded-2xl bg-[#1a1f2e] border border-amber-400/30 p-4 text-center space-y-2.5">
              <div className="font-display text-sm font-black text-amber-300">أنت في المستوى 8</div>
              <div className="text-[11px] font-mono-num text-slate-300">
                نقاط DMD للمستوى التالي: {state.dmdTotal.toFixed(2)} / 150
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { id: 1, title: '10 بيضات تنين', corn: 0, eggs: 10 },
                  { id: 2, title: '1,500 طاقة ⚡', corn: 1500, eggs: 0 },
                ].map((rw) => {
                  const claimed = state.claimedDailyLevelRewards.includes(rw.id);
                  return (
                    <button
                      key={rw.id}
                      disabled={claimed}
                      onClick={() => {
                        soundFX.playChestOpen();
                        onClaimDailyLevelReward(rw.id, rw.corn, rw.eggs);
                      }}
                      className={`py-2.5 rounded-xl font-black text-xs ${
                        claimed ? 'bg-slate-800 text-slate-500' : 'bg-amber-400 text-slate-950 cursor-pointer'
                      }`}
                    >
                      {claimed ? 'تم الاستلام ✓' : `استلام ${rw.title}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DAILY PASS */}
      {modal === 'DAILY_PASS' && (
        <div className="w-full max-w-md bg-[#161923] border border-emerald-500/40 rounded-3xl p-5 space-y-4 relative">
          <button onClick={onClose} className="absolute top-4 left-4 text-slate-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <Gift className="w-10 h-10 text-emerald-400 mx-auto mb-1" />
            <h3 className="font-display text-xl font-black text-white">تذكرة الهدايا اليومية</h3>
            <p className="text-xs text-slate-400">مكافآت 7 أيام متتالية + معززات دمج</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 text-center">
              <ItemIcon item="cornucopia" className="w-12 h-12 mx-auto" />
              <div className="text-xs font-bold text-white mt-1">سلة الخيرات + معززات</div>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 text-center">
              <ItemIcon item="egg_4" className="w-12 h-12 mx-auto" />
              <div className="text-xs font-bold text-white mt-1">2,500 طاقة + 12 ★</div>
            </div>
          </div>
          <button
            disabled={state.stats.dailyPassClaimedToday}
            onClick={() => {
              soundFX.playChestOpen();
              onClaimDailyPassDay();
            }}
            className={`w-full py-3.5 rounded-2xl font-black text-sm ${
              state.stats.dailyPassClaimedToday
                ? 'bg-slate-800 text-slate-400'
                : 'bg-emerald-400 text-slate-950 hover:brightness-105 cursor-pointer'
            }`}
          >
            {state.stats.dailyPassClaimedToday
              ? `تم استلام مكافأة اليوم ${state.stats.dailyPassDay}`
              : `استلام حزمة اليوم ${state.stats.dailyPassDay}`}
          </button>
        </div>
      )}

      {/* 5. 15-LEVEL DUCKER BATTLE PASS */}
      {modal === 'DUCKER_PASS' && (
        <div className="w-full max-w-lg bg-[#161923] border border-amber-400/40 rounded-3xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col">
          <div className="p-4 bg-gradient-to-b from-amber-500/20 to-[#161923] border-b border-slate-800 relative">
            <button onClick={onClose} className="absolute top-4 left-4 text-slate-300 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center">
                <Crown className="w-7 h-7 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-black text-white">تذكرة الموسم · الموسم 1</h3>
                <div className="flex items-center gap-2 text-xs text-amber-300 font-mono-num">
                  <span>المستوى {currentPassLevel} / 15</span>
                  <span>·</span>
                  <span>{currentPassProgress}/100 XP</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900 mt-1.5 overflow-hidden border border-slate-800">
                  <div className="h-full bg-amber-400" style={{ width: `${currentPassProgress}%` }} />
                </div>
              </div>
            </div>

            {!state.battlePass.premiumUnlocked && (
              <button
                disabled={state.stars < 60}
                onClick={() => {
                  soundFX.playChestOpen();
                  onUnlockBattlePassPremium();
                }}
                className={`mt-3 w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 ${
                  state.stars >= 60
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>تفعيل المسار الملكي PREMIUM (60 ★)</span>
              </button>
            )}
          </div>

          <div className="p-4 overflow-y-auto space-y-2">
            {BATTLE_PASS_LEVELS.map((lv) => {
              const unlocked = currentPassLevel >= lv.level;
              const freeClaimed = state.battlePass.claimedFree.includes(lv.level);
              const premClaimed = state.battlePass.claimedPremium.includes(lv.level);

              return (
                <div
                  key={lv.level}
                  className={`rounded-2xl p-2.5 border grid grid-cols-12 items-center gap-2 ${
                    unlocked ? 'bg-slate-900/90 border-slate-700' : 'bg-slate-950/60 border-slate-800/60 opacity-70'
                  }`}
                >
                  <div className="col-span-2 text-center font-mono-num font-black text-xs text-amber-400">
                    LV {lv.level}
                  </div>

                  {/* Free Track */}
                  <button
                    disabled={!unlocked || freeClaimed}
                    onClick={() => {
                      soundFX.playClaim();
                      onClaimBattlePassReward(lv.level, 'FREE');
                    }}
                    className={`col-span-5 py-2 px-2 rounded-xl text-[11px] font-extrabold border ${
                      freeClaimed
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : unlocked
                          ? 'bg-slate-800 border-amber-400/50 text-white hover:bg-slate-700 cursor-pointer'
                          : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {freeClaimed ? '✓ مجاني' : lv.freeLabel}
                  </button>

                  {/* Premium Track */}
                  <button
                    disabled={!unlocked || !state.battlePass.premiumUnlocked || premClaimed}
                    onClick={() => {
                      soundFX.playChestOpen();
                      onClaimBattlePassReward(lv.level, 'PREMIUM');
                    }}
                    className={`col-span-5 py-2 px-2 rounded-xl text-[11px] font-extrabold border flex items-center justify-center gap-1 ${
                      premClaimed
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : unlocked && state.battlePass.premiumUnlocked
                          ? 'bg-amber-400 text-slate-950 border-amber-300 cursor-pointer'
                          : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {!state.battlePass.premiumUnlocked && <Lock className="w-3 h-3" />}
                    <span>{premClaimed ? '✓ ملكي' : lv.premiumLabel}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. PACK / السرب */}
      {modal === 'PACK' && (
        <div className="w-full max-w-md bg-[#161923] border border-slate-700 rounded-3xl p-5 max-h-[88vh] overflow-y-auto space-y-4 relative">
          <button onClick={onClose} className="absolute top-4 left-4 text-slate-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center pt-1">
            <div className="inline-flex items-center gap-2 font-display text-xl font-black text-white">
              <Shield className="w-6 h-6 text-rose-400" />
              <span>{state.pack.packName}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono-num mt-1">
              {state.pack.power} Power · {state.pack.members} Members · الخزينة: {state.pack.treasuryCorn.toLocaleString()} طاقة
            </div>
          </div>

          {!state.pack.joined ? (
            <div className="space-y-3">
              <button
                onClick={() => {
                  soundFX.playGodConfirm();
                  onJoinPack();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-[#facc15] to-[#eab308] text-slate-950 font-black text-sm cursor-pointer"
              >
                الانضمام إلى {state.pack.packName} (+1,000 طاقة و +8 ★)
              </button>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">• نشاط السرب يمنحك طاقة ومكافآت يومية</div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">• قدرات السرب تفتح معززات الدمج التلقائي</div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">• دردشة خاصة للتنسيق بين مروّضي التنانين</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                disabled={state.corn < 500}
                onClick={() => {
                  soundFX.playClaim();
                  onContributePack(500);
                }}
                className={`w-full py-2.5 rounded-xl font-black text-xs ${
                  state.corn >= 500 ? 'bg-emerald-500 text-slate-950 cursor-pointer' : 'bg-slate-800 text-slate-500'
                }`}
              >
                تبرع بـ 500 طاقة لرفع قوة السرب (+10 Power و +5 ★)
              </button>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2 max-h-44 overflow-y-auto">
                {state.pack.messages.map((m) => (
                  <div key={m.id} className="text-xs">
                    <span className="font-bold text-amber-400">{m.sender}: </span>
                    <span className="text-slate-200">{m.text}</span>
                    <span className="text-[10px] text-slate-500 mr-2 font-mono-num">{m.time}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={packMsgInput}
                  onChange={(e) => setPackMsgInput(e.target.value)}
                  placeholder="اكتب رسالة للسرب..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => {
                    if (!packMsgInput.trim()) return;
                    soundFX.playTapFeed();
                    onSendPackMessage(packMsgInput.trim());
                    setPackMsgInput('');
                  }}
                  className="p-2.5 rounded-xl bg-amber-400 text-slate-950 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. WALLET */}
      {modal === 'WALLET' && (
        <div className="w-full max-w-md bg-[#161923] border border-slate-700 rounded-3xl p-5 space-y-4 relative">
          <button onClick={onClose} className="absolute top-4 left-4 text-slate-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-center text-lg font-black text-white">صندوق DMD والمحفظة</h3>

          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            {(['DMD', 'GRAM', 'GODS'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  soundFX.playTabSwitch();
                  setWalletTab(t);
                }}
                className={`py-1.5 rounded-lg font-display text-xs font-black cursor-pointer ${
                  walletTab === t ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                {t === 'GODS' ? 'الذهب' : t}
              </button>
            ))}
          </div>

          <div className="text-center py-2">
            <div className="font-mono-num text-3xl font-black text-white">
              {walletTab === 'GRAM'
                ? state.wallet.gram.toFixed(4)
                : walletTab === 'DMD'
                  ? state.dmdTotal.toFixed(3)
                  : state.duckGold}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {walletTab === 'GRAM'
                ? 'رصيد GRAM المتاح للربط المستقبلي'
                : walletTab === 'DMD'
                  ? 'إجمالي عملة DMD المكتسبة من تنانين LVL 5 + ★'
                  : 'رصيد ذهب التنانين لتفعيل البركات'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center font-mono-num">
            <div className="rounded-xl bg-slate-900 border border-emerald-500/30 p-2">
              <div className="text-[10px] text-slate-400">صندوق دعم DMD (50%)</div>
              <div className="text-sm font-black text-emerald-400">${state.treasury.reserveUsd.toFixed(2)}</div>
            </div>
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-2">
              <div className="text-[10px] text-slate-400">التشغيل والتطوير (50%)</div>
              <div className="text-sm font-black text-sky-300">${state.treasury.opsUsd.toFixed(2)}</div>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playTabSwitch();
              onToggleWalletConnect();
            }}
            className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer ${
              state.wallet.connected
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-slate-100 text-slate-950'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="font-mono-num">
              {state.wallet.connected ? `متصل: ${state.wallet.address}` : 'ربط المحفظة'}
            </span>
          </button>

          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold text-slate-400">تحويل موارد اللعب (لا يشمل DMD):</div>
            <button
              disabled={state.corn < 2500}
              onClick={() => {
                soundFX.playClaim();
                onSwapWallet('CORN_TO_STARS');
              }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-xs font-bold border ${
                state.corn >= 2500
                  ? 'bg-slate-900 border-slate-700 hover:border-amber-400 text-white cursor-pointer'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CornIcon className="w-4 h-4" /> 2,500 طاقة
              </span>
              <span className="flex items-center gap-1 text-indigo-400">
                ← 10 <StarIcon className="w-4 h-4" />
              </span>
            </button>

            <button
              disabled={state.corn < 2000}
              onClick={() => {
                soundFX.playClaim();
                onSwapWallet('CORN_TO_GOLD');
              }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-xs font-bold border ${
                state.corn >= 2000
                  ? 'bg-slate-900 border-slate-700 hover:border-amber-400 text-white cursor-pointer'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CornIcon className="w-4 h-4" /> 2,000 طاقة
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                ← 15 <GoldIcon className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 8. PAUSE / SETTINGS MODAL */}
      {modal === 'PAUSE' && (
        <div className="w-full max-w-sm bg-[#161923] border border-slate-700 rounded-3xl p-6 space-y-4 text-center relative">
          <button onClick={onClose} className="absolute top-4 left-4 text-slate-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-display text-xl font-black text-white">إيقاف مؤقت · الإعدادات</h3>
          <div className="space-y-2.5">
            <button
              onClick={onToggleMute}
              className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 hover:border-amber-400 cursor-pointer"
            >
              {state.muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{state.muted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}</span>
            </button>
            <button
              onClick={onBackToTitle}
              className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 hover:border-slate-500 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>العودة لشاشة البداية</span>
            </button>
            <button
              onClick={onResetGame}
              className="w-full py-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-500/25 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة ضبط التقدم (حفظ جديد)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
