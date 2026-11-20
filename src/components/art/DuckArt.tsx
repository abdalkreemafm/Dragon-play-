import React, { useId } from 'react';
import { DuckAuraId, DuckGearId, DuckSkinId, EggItemType, GodPatronId } from '../../types/game';

// Energy Grain / Crystal Icon (الطاقة / الحبوب الطاقية)
export const CornIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <defs>
        <radialGradient id={`energyCore_${uid}`} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#ecfccb" />
          <stop offset="40%" stopColor="#4ade80" />
          <stop offset="82%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#042f2e" />
        </radialGradient>
        <linearGradient id={`energyShell_${uid}`} x1="6" y1="3" x2="26" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5L25 11.5L22.5 24.5L16 29.5L9.5 24.5L7 11.5L16 2.5Z"
        fill={`url(#energyCore_${uid})`}
        stroke={`url(#energyShell_${uid})`}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M16 2.5L16 15.5L7 11.5Z" fill="#ffffff" opacity="0.32" />
      <path d="M16 2.5L25 11.5L16 15.5Z" fill="#bef264" opacity="0.24" />
      <path d="M16 15.5L22.5 24.5L16 29.5Z" fill="#064e3b" opacity="0.45" />
      <circle cx="14" cy="10.5" r="2.2" fill="#ffffff" opacity="0.45" />
    </svg>
  );
};

export const StarIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <defs>
        <radialGradient id={`starGem_${uid}`} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="35%" stopColor="#a78bfa" />
          <stop offset="72%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#312e81" />
        </radialGradient>
      </defs>
      <path
        d="M16 2.5L19.9 10.9L29.1 12.1L22.3 18.5L24.1 27.6L16 23.1L7.9 27.6L9.7 18.5L2.9 12.1L12.1 10.9L16 2.5Z"
        fill={`url(#starGem_${uid})`}
        stroke="#c4b5fd"
        strokeOpacity="0.65"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M16 2.5L16 16L12.1 10.9Z" fill="#ffffff" opacity="0.4" />
      <path d="M16 2.5L19.9 10.9L16 16Z" fill="#ddd6fe" opacity="0.22" />
      <path d="M16 16L29.1 12.1L22.3 18.5Z" fill="#4338ca" opacity="0.35" />
      <path d="M16 16L7.9 27.6L9.7 18.5Z" fill="#312e81" opacity="0.38" />
    </svg>
  );
};

export const DmdIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <defs>
        <linearGradient id={`dmdRim_${uid}`} x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <radialGradient id={`dmdCore_${uid}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="90%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="13.5" fill="#0b0f19" stroke={`url(#dmdRim_${uid})`} strokeWidth="2.4" />
      <circle cx="16" cy="16" r="10.2" fill={`url(#dmdCore_${uid})`} />
      <circle cx="16" cy="16" r="8.8" stroke="#78350f" strokeOpacity="0.45" strokeWidth="0.8" />
      <path d="M12.4 10.8H16.6C19.2 10.8 20.8 12.6 20.8 16C20.8 19.4 19.2 21.2 16.6 21.2H12.4V10.8Z" fill="#111827" />
      <path d="M14.7 13.1V18.9H16.4C17.6 18.9 18.4 17.8 18.4 16C18.4 14.2 17.6 13.1 16.4 13.1H14.7Z" fill="#fde047" />
      <path d="M8.5 10.5C11 7.2 16 6.2 20.5 8" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
};

export const GoldIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <defs>
        <linearGradient id={`topaz_${uid}`} x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="85%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5L28.5 16L16 29.5L3.5 16L16 2.5Z"
        fill={`url(#topaz_${uid})`}
        stroke="#fef08a"
        strokeOpacity="0.65"
        strokeWidth="1"
      />
      <path d="M16 2.5L16 16L3.5 16Z" fill="#ffffff" opacity="0.35" />
      <path d="M16 2.5L28.5 16L16 16Z" fill="#fde047" opacity="0.22" />
      <path d="M16 7.5L23.5 16L16 24.5L8.5 16L16 7.5Z" fill="#fef08a" opacity="0.3" stroke="#92400e" strokeOpacity="0.35" strokeWidth="0.8" />
    </svg>
  );
};

interface DragonPalette {
  bodyLight: string;
  bodyMid: string;
  bodyDark: string;
  bellyLight: string;
  bellyDark: string;
  wingOuter: string;
  wingMembrane: string;
  hornLight: string;
  hornDark: string;
  eyeGlow: string;
  crestColor: string;
}

const DRAGON_PALETTES: Record<DuckSkinId, DragonPalette> = {
  aqua: {
    bodyLight: '#67e8f9',
    bodyMid: '#06b6d4',
    bodyDark: '#164e63',
    bellyLight: '#fef3c7',
    bellyDark: '#fde68a',
    wingOuter: '#0e7490',
    wingMembrane: '#fb7185',
    hornLight: '#fde047',
    hornDark: '#b45309',
    eyeGlow: '#38bdf8',
    crestColor: '#22d3ee',
  },
  lilac: {
    bodyLight: '#d8b4fe',
    bodyMid: '#9333ea',
    bodyDark: '#3b0764',
    bellyLight: '#fce7f3',
    bellyDark: '#e9d5ff',
    wingOuter: '#581c87',
    wingMembrane: '#f59e0b',
    hornLight: '#fef08a',
    hornDark: '#a16207',
    eyeGlow: '#f472b6',
    crestColor: '#5eead4',
  },
  classic: {
    bodyLight: '#fcd34d',
    bodyMid: '#f97316',
    bodyDark: '#7c2d12',
    bellyLight: '#fef9c3',
    bellyDark: '#fdba74',
    wingOuter: '#9a3412',
    wingMembrane: '#fbbf24',
    hornLight: '#f8fafc',
    hornDark: '#64748b',
    eyeGlow: '#facc15',
    crestColor: '#fb923c',
  },
  dj: {
    bodyLight: '#818cf8',
    bodyMid: '#4f46e5',
    bodyDark: '#1e1b4b',
    bellyLight: '#e0e7ff',
    bellyDark: '#a5b4fc',
    wingOuter: '#312e81',
    wingMembrane: '#22d3ee',
    hornLight: '#38bdf8',
    hornDark: '#0284c7',
    eyeGlow: '#22d3ee',
    crestColor: '#a855f7',
  },
  gamer: {
    bodyLight: '#6ee7b7',
    bodyMid: '#10b981',
    bodyDark: '#064e3b',
    bellyLight: '#ecfdf5',
    bellyDark: '#a7f3d0',
    wingOuter: '#047857',
    wingMembrane: '#34d399',
    hornLight: '#a3e635',
    hornDark: '#3f6212',
    eyeGlow: '#4ade80',
    crestColor: '#2dd4bf',
  },
  cupid: {
    bodyLight: '#fbcfe8',
    bodyMid: '#ec4899',
    bodyDark: '#831843',
    bellyLight: '#fff1f2',
    bellyDark: '#fda4af',
    wingOuter: '#9d174d',
    wingMembrane: '#f472b6',
    hornLight: '#fef08a',
    hornDark: '#d97706',
    eyeGlow: '#fb7185',
    crestColor: '#f43f5e',
  },
  pumpkin: {
    bodyLight: '#fdba74',
    bodyMid: '#ea580c',
    bodyDark: '#431407',
    bellyLight: '#ffedd5',
    bellyDark: '#fb923c',
    wingOuter: '#7c2d12',
    wingMembrane: '#f97316',
    hornLight: '#bef264',
    hornDark: '#365314',
    eyeGlow: '#fde047',
    crestColor: '#f59e0b',
  },
  skeleton: {
    bodyLight: '#f1f5f9',
    bodyMid: '#94a3b8',
    bodyDark: '#334155',
    bellyLight: '#ffffff',
    bellyDark: '#cbd5e1',
    wingOuter: '#475569',
    wingMembrane: '#1e293b',
    hornLight: '#e2e8f0',
    hornDark: '#475569',
    eyeGlow: '#22d3ee',
    crestColor: '#cbd5e1',
  },
  bride: {
    bodyLight: '#ffffff',
    bodyMid: '#cbd5e1',
    bodyDark: '#475569',
    bellyLight: '#f8fafc',
    bellyDark: '#e2e8f0',
    wingOuter: '#64748b',
    wingMembrane: '#bae6fd',
    hornLight: '#bae6fd',
    hornDark: '#0284c7',
    eyeGlow: '#38bdf8',
    crestColor: '#e0f2fe',
  },
  cool: {
    bodyLight: '#93c5fd',
    bodyMid: '#2563eb',
    bodyDark: '#1e3a8a',
    bellyLight: '#eff6ff',
    bellyDark: '#bfdbfe',
    wingOuter: '#1d4ed8',
    wingMembrane: '#60a5fa',
    hornLight: '#e0f2fe',
    hornDark: '#0369a1',
    eyeGlow: '#67e8f9',
    crestColor: '#38bdf8',
  },
  pharaoh: {
    bodyLight: '#fde047',
    bodyMid: '#d97706',
    bodyDark: '#451a03',
    bellyLight: '#fef9c3',
    bellyDark: '#f59e0b',
    wingOuter: '#78350f',
    wingMembrane: '#38bdf8',
    hornLight: '#fef08a',
    hornDark: '#b45309',
    eyeGlow: '#38bdf8',
    crestColor: '#facc15',
  },
  royal: {
    bodyLight: '#fef08a',
    bodyMid: '#eab308',
    bodyDark: '#713f12',
    bellyLight: '#fffbeb',
    bellyDark: '#fde047',
    wingOuter: '#854d0e',
    wingMembrane: '#dc2626',
    hornLight: '#ffffff',
    hornDark: '#d97706',
    eyeGlow: '#f43f5e',
    crestColor: '#facc15',
  },
  coffee: {
    bodyLight: '#fca5a5',
    bodyMid: '#991b1b',
    bodyDark: '#2a0808',
    bellyLight: '#fed7aa',
    bellyDark: '#ea580c',
    wingOuter: '#450a0a',
    wingMembrane: '#f97316',
    hornLight: '#fdba74',
    hornDark: '#7c2d12',
    eyeGlow: '#fb923c',
    crestColor: '#ef4444',
  },
  ninja: {
    bodyLight: '#64748b',
    bodyMid: '#1e293b',
    bodyDark: '#020617',
    bellyLight: '#475569',
    bellyDark: '#0f172a',
    wingOuter: '#0f172a',
    wingMembrane: '#e11d48',
    hornLight: '#f43f5e',
    hornDark: '#881337',
    eyeGlow: '#fb7185',
    crestColor: '#f43f5e',
  },
};

export const DragonIllustration: React.FC<{
  skin: DuckSkinId;
  className?: string;
  isPressed?: boolean;
  mood?: 'idle' | 'fever' | 'battle' | 'hurt';
  level?: number;
  customLevel?: number;
  showEvolutionEffects?: boolean;
  gear?: DuckGearId;
  aura?: DuckAuraId;
  staked?: boolean;
}> = ({
  skin,
  className = 'w-44 h-44',
  isPressed = false,
  mood = 'idle',
  level,
  customLevel = 0,
  showEvolutionEffects = false,
  gear = 'none',
  aura = 'auto',
  staked = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const p = DRAGON_PALETTES[skin] ?? DRAGON_PALETTES.aqua;
  const lv = Math.max(1, Math.min(5, level ?? 3));

  const levelScale =
    level === undefined
      ? ''
      : lv === 1
        ? 'scale-[0.86]'
        : lv === 2
          ? 'scale-[0.92]'
          : lv === 3
            ? 'scale-[0.97]'
            : lv === 4
              ? 'scale-[1.02]'
              : 'scale-[1.08]';

  const auraGradient =
    aura === 'gold'
      ? 'from-amber-400/50 via-yellow-300/25 to-transparent'
      : aura === 'flame'
        ? 'from-rose-500/50 via-orange-400/25 to-transparent'
        : aura === 'emerald'
          ? 'from-emerald-400/45 via-teal-300/20 to-transparent'
          : mood === 'fever'
            ? 'from-rose-500/45 via-amber-400/25 to-transparent'
            : mood === 'battle'
              ? 'from-rose-500/35 via-orange-400/15 to-transparent'
              : lv >= 5 && customLevel >= 1
                ? 'from-amber-400/45 via-yellow-300/25 to-transparent'
                : lv >= 5
                  ? 'from-amber-400/35 via-yellow-300/15 to-transparent'
                  : lv === 4
                    ? 'from-purple-400/35 via-fuchsia-400/15 to-transparent'
                    : lv === 3
                      ? 'from-sky-400/30 via-cyan-300/10 to-transparent'
                      : lv === 2
                        ? 'from-emerald-400/25 via-teal-300/10 to-transparent'
                        : 'from-slate-400/10 to-transparent';

  const pedestalClass =
    aura === 'gold' || (staked && aura === 'auto')
      ? 'border-amber-300/85 bg-amber-400/25 shadow-[0_0_22px_rgba(251,191,36,0.55)]'
      : aura === 'flame'
        ? 'border-rose-400/85 bg-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
        : aura === 'emerald'
          ? 'border-emerald-400/85 bg-emerald-500/25 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
          : lv >= 5
            ? 'border-amber-300/80 bg-amber-400/25 shadow-[0_0_20px_rgba(251,191,36,0.55)]'
            : lv === 4
              ? 'border-purple-400/70 bg-purple-400/20 shadow-[0_0_14px_rgba(192,132,252,0.45)]'
              : lv === 3
                ? 'border-sky-400/65 bg-sky-400/15 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                : 'border-emerald-400/55 bg-emerald-400/15';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className} transition-transform duration-150 ${
        isPressed ? 'scale-92' : mood === 'hurt' ? 'animate-hit-shake' : 'animate-duck-breathe'
      }`}
    >
      {/* Evolution / Custom Aura Halo */}
      {(showEvolutionEffects || aura !== 'auto' || staked || customLevel > 0) && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-1 rounded-full bg-radial ${auraGradient} blur-md`}
        />
      )}

      {/* Evolution / Staked Pedestal Ring */}
      {(showEvolutionEffects || staked || aura !== 'auto') && (lv >= 2 || staked || aura !== 'auto') && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-1 w-[76%] h-[17%] rounded-full border blur-[0.3px] ${pedestalClass}`}
        />
      )}

      {/* Custom Headgear OR LVL 5 Crown */}
      {gear === 'crown' || gear === 'helmet' ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 text-xl drop-shadow-[0_3px_8px_rgba(251,191,36,0.9)]"
        >
          {gear === 'crown' ? '👑' : '🪖'}
        </span>
      ) : (
        showEvolutionEffects &&
        lv >= 5 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-20 text-lg drop-shadow-[0_2px_6px_rgba(251,191,36,0.9)]"
          >
            👑
          </span>
        )
      )}

      {/* Custom Wings Overlay */}
      {gear === 'wings' && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-2 top-[40%] z-0 text-xl sm:text-2xl -rotate-12 drop-shadow-[0_0_10px_rgba(250,204,21,0.85)]"
          >
            🪽
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 top-[40%] z-0 text-xl sm:text-2xl rotate-12 scale-x-[-1] drop-shadow-[0_0_10px_rgba(250,204,21,0.85)]"
          >
            🪽
          </span>
        </>
      )}

      {/* Custom Shades */}
      {gear === 'shades' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[20%] left-1/2 -translate-x-1/2 z-20 text-base drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
        >
          🕶️
        </span>
      )}

      {/* Bespoke 3D-Lit Volumetric Dragon SVG */}
      <svg
        viewBox="0 0 180 180"
        className={`relative z-10 w-full h-full drop-shadow-[0_12px_16px_rgba(0,0,0,0.65)] transition-transform duration-200 ${levelScale}`}
        fill="none"
      >
        <defs>
          <radialGradient id={`dBody_${uid}`} cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor={p.bodyLight} />
            <stop offset="55%" stopColor={p.bodyMid} />
            <stop offset="100%" stopColor={p.bodyDark} />
          </radialGradient>
          <linearGradient id={`dBelly_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.bellyLight} />
            <stop offset="100%" stopColor={p.bellyDark} />
          </linearGradient>
          <linearGradient id={`dWing_${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.wingMembrane} />
            <stop offset="100%" stopColor={p.wingOuter} />
          </linearGradient>
          <linearGradient id={`dHorn_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.hornLight} />
            <stop offset="100%" stopColor={p.hornDark} />
          </linearGradient>
        </defs>

        {/* Ground Shadow */}
        <ellipse cx="90" cy="160" rx="46" ry="9" fill="#000000" opacity="0.48" />

        {/* Back Dragon Wing (larger at higher levels!) */}
        <path
          d={
            lv >= 4
              ? 'M68 88C34 56 14 48 16 74C18 92 34 106 58 112Z'
              : 'M70 92C44 68 26 64 28 84C30 98 44 108 62 112Z'
          }
          fill={`url(#dWing_${uid})`}
          stroke={p.bodyDark}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M64 94L28 74M62 102L34 94"
          stroke={p.wingOuter}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Dragon Tail curving to the right */}
        <path
          d="M112 126C140 132 158 118 162 96C152 104 142 106 136 102C134 114 124 118 110 116Z"
          fill={`url(#dBody_${uid})`}
          stroke={p.bodyDark}
          strokeWidth="2"
        />
        {/* Elemental Tail Spade */}
        <path
          d="M162 96L172 86L166 102L155 96Z"
          fill={p.crestColor}
          stroke={p.bodyDark}
          strokeWidth="1.5"
        />

        {/* Dorsal Spines along back & neck */}
        <path
          d="M64 62L55 56L62 70M60 76L50 74L58 86M58 92L48 94L58 104"
          fill={p.crestColor}
          stroke={p.bodyDark}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Dragon Torso */}
        <ellipse
          cx="90"
          cy="118"
          rx="36"
          ry="34"
          fill={`url(#dBody_${uid})`}
          stroke={p.bodyDark}
          strokeWidth="2.2"
        />

        {/* Front Belly Plated Scales */}
        <path
          d="M68 106C68 94 110 94 110 106C112 126 104 146 90 148C76 146 66 126 68 106Z"
          fill={`url(#dBelly_${uid})`}
        />
        <path
          d="M72 114H106M71 124H107M74 134H104"
          stroke={p.bodyMid}
          strokeOpacity="0.32"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Dragon Neck */}
        <path
          d="M70 96C68 74 72 60 88 58C104 60 108 76 104 98Z"
          fill={`url(#dBody_${uid})`}
        />

        {/* Front Sculpted Wing (adds heroic depth at level 2+) */}
        <path
          d={
            lv >= 3
              ? 'M106 86C136 52 162 46 158 76C154 96 134 110 108 114Z'
              : 'M106 90C128 66 148 64 144 86C140 100 124 108 106 112Z'
          }
          fill={`url(#dWing_${uid})`}
          stroke={p.bodyDark}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M110 92L146 72M110 102L140 94"
          stroke={p.wingOuter}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Dragon Legs & Claws */}
        <path
          d="M74 142L68 158L60 160M68 158L70 162M68 158L76 160"
          stroke={`url(#dHorn_${uid})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M106 142L112 158L104 160M112 158L114 162M112 158L120 160"
          stroke={`url(#dHorn_${uid})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dragon Horns */}
        <path
          d="M78 38C70 22 60 16 54 14C62 24 68 34 72 44Z"
          fill={`url(#dHorn_${uid})`}
          stroke={p.bodyDark}
          strokeWidth="1.6"
        />
        <path
          d="M102 38C110 22 120 16 126 14C118 24 112 34 108 44Z"
          fill={`url(#dHorn_${uid})`}
          stroke={p.bodyDark}
          strokeWidth="1.6"
        />

        {/* Dragon Head & Snout */}
        <ellipse
          cx="90"
          cy="54"
          rx="26"
          ry="22"
          fill={`url(#dBody_${uid})`}
          stroke={p.bodyDark}
          strokeWidth="2.2"
        />
        {/* Sculpted Snout */}
        <path
          d="M76 56C76 48 104 48 104 56C106 66 98 72 90 72C82 72 74 66 76 56Z"
          fill={p.bodyLight}
          stroke={p.bodyDark}
          strokeWidth="1.6"
        />
        {/* Nostrils + Subtle Ember Smoke */}
        <circle cx="84" cy="61" r="2" fill={p.bodyDark} />
        <circle cx="96" cy="61" r="2" fill={p.bodyDark} />
        {lv >= 3 && (
          <path
            d="M82 56C78 51 80 47 82 44M98 56C102 51 100 47 98 44"
            stroke={p.eyeGlow}
            strokeOpacity="0.5"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        )}

        {/* Fierce Expressive Dragon Eyes */}
        <ellipse cx="77" cy="49" rx="6" ry="7" fill="#090d16" />
        <ellipse cx="103" cy="49" rx="6" ry="7" fill="#090d16" />
        <ellipse cx="77" cy="49" rx="3.4" ry="4.5" fill={p.eyeGlow} />
        <ellipse cx="103" cy="49" rx="3.4" ry="4.5" fill={p.eyeGlow} />
        <circle cx="75.5" cy="46.5" r="1.8" fill="#ffffff" />
        <circle cx="101.5" cy="46.5" r="1.8" fill="#ffffff" />

        {/* Brow Ridges */}
        <path
          d="M68 41L83 44M112 41L97 44"
          stroke={p.bodyDark}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Specular Highlight on Forehead & Torso */}
        <ellipse cx="88" cy="39" rx="9" ry="4" fill="#ffffff" opacity="0.28" />
        <ellipse cx="84" cy="108" rx="10" ry="5" fill="#ffffff" opacity="0.16" />
      </svg>

      {/* Star Customization Level Badge (Custom_LVL >= 1) */}
      {showEvolutionEffects && customLevel > 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 right-1 z-20 px-1.5 h-5 rounded-full bg-indigo-500/95 border border-indigo-200 text-white font-mono-num text-[9px] font-black flex items-center justify-center shadow-md"
        >
          ★{customLevel}
        </span>
      )}

      {/* Active DMD Generator Badge */}
      {showEvolutionEffects && staked && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-1 z-20 px-1.5 h-5 rounded-full bg-amber-400/95 border border-amber-200 text-slate-950 font-mono-num text-[9px] font-black flex items-center justify-center shadow-md"
        >
          DMD
        </span>
      )}
    </div>
  );
};

// Keep DuckIllustration export alias for backwards compatibility across components
export const DuckIllustration = DragonIllustration;

export const ItemIcon: React.FC<{ item: EggItemType; className?: string }> = ({
  item,
  className = 'w-10 h-10',
}) => {
  const uid = useId().replace(/:/g, '');
  if (item === 'chest') {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <defs>
          <linearGradient id={`chestLid_${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <rect x="6" y="16" width="36" height="24" rx="5" fill="#78350f" stroke="#f59e0b" strokeWidth="2.5" />
        <path d="M6 20C6 13 13 10 24 10C35 10 42 13 42 20H6Z" fill={`url(#chestLid_${uid})`} stroke="#fef08a" strokeWidth="1.5" />
        <rect x="20" y="18" width="8" height="10" rx="2" fill="#facc15" stroke="#451a03" strokeWidth="1.5" />
        <circle cx="24" cy="23" r="1.8" fill="#451a03" />
      </svg>
    );
  }
  if (item === 'grapes') {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <path d="M24 6L34 18L24 38L14 18L24 6Z" fill="#a855f7" stroke="#f3e8ff" strokeWidth="2" />
        <path d="M24 6L24 38M14 18H34" stroke="#e9d5ff" strokeOpacity="0.45" strokeWidth="1.5" />
      </svg>
    );
  }
  if (item === 'chalice') {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <path d="M13 10H35L31 24C30 28 27 30 24 30C21 30 18 28 17 24L13 10Z" fill="#facc15" stroke="#b45309" strokeWidth="2" />
        <rect x="21" y="30" width="6" height="8" fill="#d97706" />
        <rect x="15" y="38" width="18" height="4" rx="2" fill="#facc15" />
        <circle cx="24" cy="18" r="3.5" fill="#ef4444" />
      </svg>
    );
  }
  if (item === 'cornucopia') {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <path d="M10 30C12 16 26 10 40 16C34 26 26 36 12 36L10 30Z" fill="#d97706" stroke="#fef08a" strokeWidth="2" />
        <circle cx="16" cy="28" r="4" fill="#ef4444" />
        <circle cx="22" cy="24" r="4" fill="#22c55e" />
        <circle cx="26" cy="30" r="4" fill="#a855f7" />
        <circle cx="31" cy="22" r="3.5" fill="#facc15" />
      </svg>
    );
  }
  if (item === 'feast') {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <ellipse cx="24" cy="34" rx="18" ry="6" fill="#facc15" stroke="#92400e" strokeWidth="2" />
        <path d="M12 32C12 20 36 20 36 32H12Z" fill="#ea580c" stroke="#fef08a" strokeWidth="1.5" />
        <circle cx="24" cy="17" r="4" fill="#fde047" />
      </svg>
    );
  }

  // Dragon Eggs (egg_1 .. egg_love) with scaly dragon-shell texture & elemental glow
  const eggPalette: Record<string, { top: string; bot: string; crack: string }> = {
    egg_1: { top: '#fef3c7', bot: '#d97706', crack: '#fbbf24' },
    egg_2: { top: '#bae6fd', bot: '#0284c7', crack: '#38bdf8' },
    egg_3: { top: '#e9d5ff', bot: '#7e22ce', crack: '#c084fc' },
    egg_4: { top: '#bbf7d0', bot: '#15803d', crack: '#4ade80' },
    egg_5: { top: '#fef08a', bot: '#ea580c', crack: '#fb923c' },
    egg_6: { top: '#fecdd3', bot: '#be123c', crack: '#fb7185' },
    egg_7: { top: '#cffafe', bot: '#4338ca', crack: '#67e8f9' },
    egg_love: { top: '#fbcfe8', bot: '#db2777', crack: '#fef08a' },
  };
  const pal = eggPalette[item] ?? eggPalette.egg_1;

  return (
    <svg viewBox="0 0 48 48" className={className} fill="none">
      <defs>
        <linearGradient id={`egg_${uid}`} x1="12" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={pal.top} />
          <stop offset="100%" stopColor={pal.bot} />
        </linearGradient>
      </defs>
      <path
        d="M24 6C15 6 10 19 10 29C10 37 16 42 24 42C32 42 38 37 38 29C38 19 33 6 24 6Z"
        fill={`url(#egg_${uid})`}
        stroke="#0f172a"
        strokeWidth="2"
      />
      {/* Dragon egg scale chevrons & elemental crack */}
      <path
        d="M17 20L21 23L25 20L29 23L32 20M15 29L20 32L24 28L28 32L33 29"
        stroke={pal.crack}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="19" cy="14" rx="3" ry="5" fill="#ffffff" opacity="0.4" transform="rotate(-14 19 14)" />
    </svg>
  );
};

export const GodIllustration: React.FC<{
  godId: GodPatronId | 'harvest' | 'hype' | 'fortune' | 'plunder' | 'trader';
  className?: string;
}> = ({ godId, className = 'w-16 h-16' }) => {
  const colors: Record<string, { bg: string; accent: string; symbol: string }> = {
    anubis: { bg: '#1e1b4b', accent: '#f59e0b', symbol: '🐉' },
    horus: { bg: '#0c4a6e', accent: '#38bdf8', symbol: '🦅' },
    dionysus: { bg: '#3b0764', accent: '#c084fc', symbol: '🍇' },
    bastet: { bg: '#500724', accent: '#f472b6', symbol: '🔥' },
    zeus: { bg: '#422006', accent: '#facc15', symbol: '⚡' },
    harvest: { bg: '#064e3b', accent: '#4ade80', symbol: '🌿' },
    hype: { bg: '#312e81', accent: '#fbbf24', symbol: '⚡' },
    fortune: { bg: '#4c1d95', accent: '#e879f9', symbol: '🔮' },
    plunder: { bg: '#7c2d12', accent: '#facc15', symbol: '👑' },
    trader: { bg: '#1e293b', accent: '#38bdf8', symbol: '⚖️' },
  };
  const meta = colors[godId] ?? colors.anubis;
  return (
    <div
      className={`${className} rounded-2xl border border-amber-400/35 flex items-center justify-center shadow-lg relative overflow-hidden`}
      style={{
        background: `radial-gradient(circle at 35% 30%, ${meta.accent}33, ${meta.bg})`,
      }}
    >
      <span className="text-2xl sm:text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{meta.symbol}</span>
    </div>
  );
};
