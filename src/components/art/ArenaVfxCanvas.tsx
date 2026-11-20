import React, { useEffect, useImperativeHandle, useRef } from 'react';

export type VfxBurstKind = 'FIREBALL' | 'CRIT' | 'SHIELD' | 'VAMPIRE' | 'PARRY' | 'ENEMY_HIT' | 'SHOCKWAVE';

export interface ArenaVfxHandle {
  spawnAttack: (kind: VfxBurstKind, label?: string) => void;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  color: string;
  radius: number;
  kind: VfxBurstKind;
  life: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface RingWave {
  x: number;
  y: number;
  r: number;
  maxR: number;
  color: string;
  life: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  big?: boolean;
}

export const ArenaVfxCanvas = React.forwardRef<ArenaVfxHandle, { className?: string }>(({ className = '' }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{
    projectiles: Projectile[];
    sparks: Spark[];
    rings: RingWave[];
    texts: FloatingText[];
  }>({
    projectiles: [],
    sparks: [],
    rings: [],
    texts: [],
  });

  useImperativeHandle(ref, () => ({
    spawnAttack(kind, label) {
      const canvas = canvasRef.current;
      const w = canvas?.width || 360;
      const h = canvas?.height || 200;
      // RTL visual alignment: player card sits on right (~0.75w), enemy on left (~0.25w)
      const playerX = w * 0.74;
      const enemyX = w * 0.26;
      const midY = h * 0.54;
      const s = stateRef.current;

      const addSparks = (cx: number, cy: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 45 + Math.random() * 165;
          s.sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 20,
            color,
            size: 2 + Math.random() * 3.5,
            life: 0,
            maxLife: 0.35 + Math.random() * 0.35,
          });
        }
      };

      if (kind === 'FIREBALL' || kind === 'CRIT') {
        const col = kind === 'CRIT' ? '#fb7185' : '#facc15';
        s.projectiles.push({
          x: playerX,
          y: midY,
          vx: (enemyX - playerX) * 4.4,
          vy: (Math.random() - 0.5) * 35,
          tx: enemyX,
          ty: midY,
          color: col,
          radius: kind === 'CRIT' ? 11 : 7,
          kind,
          life: 0,
        });
        if (label) {
          s.texts.push({
            x: enemyX + (Math.random() - 0.5) * 24,
            y: midY - 22,
            vy: -48,
            text: label,
            color: col,
            life: 0,
            big: kind === 'CRIT',
          });
        }
      } else if (kind === 'SHIELD' || kind === 'PARRY') {
        const col = kind === 'PARRY' ? '#34d399' : '#38bdf8';
        s.rings.push({ x: playerX, y: midY, r: 10, maxR: 86, color: col, life: 0 });
        addSparks(playerX, midY, col, kind === 'PARRY' ? 24 : 14);
        if (kind === 'PARRY') {
          s.projectiles.push({
            x: playerX,
            y: midY,
            vx: (enemyX - playerX) * 5.2,
            vy: 0,
            tx: enemyX,
            ty: midY,
            color: '#34d399',
            radius: 10,
            kind: 'CRIT',
            life: 0,
          });
        }
        if (label) {
          s.texts.push({ x: playerX, y: midY - 34, vy: -42, text: label, color: col, life: 0, big: true });
        }
      } else if (kind === 'VAMPIRE') {
        s.projectiles.push({
          x: enemyX,
          y: midY,
          vx: (playerX - enemyX) * 3.8,
          vy: 0,
          tx: playerX,
          ty: midY,
          color: '#e879f9',
          radius: 9,
          kind: 'VAMPIRE',
          life: 0,
        });
        addSparks(enemyX, midY, '#e879f9', 14);
        if (label) {
          s.texts.push({ x: playerX, y: midY - 28, vy: -40, text: label, color: '#f0abfc', life: 0, big: true });
        }
      } else if (kind === 'ENEMY_HIT') {
        s.rings.push({ x: playerX, y: midY, r: 8, maxR: 62, color: '#f43f5e', life: 0 });
        addSparks(playerX, midY, '#f43f5e', 14);
        if (label) {
          s.texts.push({ x: playerX, y: midY - 22, vy: -42, text: label, color: '#fda4af', life: 0 });
        }
      } else if (kind === 'SHOCKWAVE') {
        s.rings.push({ x: w * 0.5, y: midY, r: 12, maxR: w * 0.45, color: '#a855f7', life: 0 });
        addSparks(enemyX, midY, '#c084fc', 22);
        if (label) {
          s.texts.push({ x: enemyX, y: midY - 28, vy: -46, text: label, color: '#fde047', life: 0, big: true });
        }
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = Math.max(240, parent.clientWidth);
      canvas.height = Math.max(160, parent.clientHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastTs = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      const s = stateRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & draw projectiles
      for (let i = s.projectiles.length - 1; i >= 0; i--) {
        const p = s.projectiles[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.radius * 2.2);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, p.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const reached = (p.vx < 0 && p.x <= p.tx) || (p.vx > 0 && p.x >= p.tx) || p.life > 0.45;
        if (reached) {
          s.rings.push({ x: p.tx, y: p.ty, r: 4, maxR: p.kind === 'CRIT' ? 54 : 34, color: p.color, life: 0 });
          for (let k = 0; k < (p.kind === 'CRIT' ? 14 : 7); k++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 50 + Math.random() * 140;
            s.sparks.push({
              x: p.tx,
              y: p.ty,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              color: p.color,
              size: 2.5,
              life: 0,
              maxLife: 0.35,
            });
          }
          s.projectiles.splice(i, 1);
        }
      }

      // Update & draw shockwaves
      for (let i = s.rings.length - 1; i >= 0; i--) {
        const rg = s.rings[i];
        rg.life += dt * 2.5;
        const curR = rg.r + (rg.maxR - rg.r) * rg.life;
        ctx.save();
        ctx.strokeStyle = rg.color;
        ctx.globalAlpha = Math.max(0, 1 - rg.life);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rg.x, rg.y, curR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (rg.life >= 1) s.rings.splice(i, 1);
      }

      // Update & draw sparks
      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        sp.life += dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 120 * dt;
        const alpha = Math.max(0, 1 - sp.life / sp.maxLife);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (sp.life >= sp.maxLife) s.sparks.splice(i, 1);
      }

      // Floating numbers
      for (let i = s.texts.length - 1; i >= 0; i--) {
        const tx = s.texts[i];
        tx.life += dt;
        tx.y += tx.vy * dt;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - tx.life / 0.85);
        ctx.font = tx.big ? '900 18px "JetBrains Mono", monospace' : '800 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#090b11';
        ctx.fillText(tx.text, tx.x + 1.5, tx.y + 1.5);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, tx.x, tx.y);
        ctx.restore();
        if (tx.life >= 0.85) s.texts.splice(i, 1);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 z-20 w-full h-full ${className}`} />;
});

ArenaVfxCanvas.displayName = 'ArenaVfxCanvas';
