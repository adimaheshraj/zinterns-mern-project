/**
 * ThreeButton — Beautiful Animated Button (Canvas 2D)
 * ─────────────────────────────────────────────────────
 * Uses Canvas 2D + globalCompositeOperation:'lighter' to
 * replicate additive-blending particle bursts without
 * creating a WebGL context (browsers cap WebGL at ~8-16
 * contexts, which crashes when there are many buttons).
 *
 * Effects:
 *  • Radial glow pulse on hover
 *  • Particle burst (50 particles) on click
 *  • Press / hover scale spring
 *
 * Variants:
 *  primary   — indigo (default)
 *  secondary — slate
 *  gradient  — indigo→purple→pink
 *  danger    — rose
 *  success   — emerald
 *  ghost     — transparent
 *  icon      — square icon-only
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

/* ── Variant config ─────────────────────────────────────── */
const VARIANTS = {
  primary: {
    bg: 'bg-indigo-600',
    hover: 'hover:bg-indigo-700',
    text: 'text-white',
    shadow: 'shadow-md shadow-indigo-500/30',
    glow: 'rgba(99,102,241,',   // indigo
    particles: ['#818cf8','#a78bfa','#c4b5fd','#e0e7ff','#ffffff'],
  },
  secondary: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    hover: 'hover:bg-slate-200 dark:hover:bg-slate-700',
    text: 'text-slate-700 dark:text-slate-200',
    shadow: '',
    glow: 'rgba(148,163,184,',
    particles: ['#94a3b8','#cbd5e1','#e2e8f0','#f8fafc'],
  },
  gradient: {
    bg: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600',
    hover: 'hover:opacity-90',
    text: 'text-white',
    shadow: 'shadow-lg shadow-indigo-500/40',
    glow: 'rgba(139,92,246,',
    particles: ['#818cf8','#a78bfa','#ec4899','#f9a8d4','#ffffff'],
  },
  danger: {
    bg: 'bg-rose-600',
    hover: 'hover:bg-rose-700',
    text: 'text-white',
    shadow: 'shadow-md shadow-rose-500/30',
    glow: 'rgba(244,63,94,',
    particles: ['#fb7185','#fda4af','#ffe4e6','#ffffff'],
  },
  success: {
    bg: 'bg-emerald-600',
    hover: 'hover:bg-emerald-700',
    text: 'text-white',
    shadow: 'shadow-md shadow-emerald-500/30',
    glow: 'rgba(16,185,129,',
    particles: ['#34d399','#6ee7b7','#a7f3d0','#d1fae5','#ffffff'],
  },
  ghost: {
    bg: 'bg-transparent',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-800/60',
    text: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
    shadow: '',
    glow: 'rgba(148,163,184,',
    particles: ['#94a3b8','#cbd5e1','#e2e8f0'],
  },
  icon: {
    bg: 'bg-transparent',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    text: 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
    shadow: '',
    glow: 'rgba(99,102,241,',
    particles: ['#818cf8','#a78bfa','#c4b5fd','#ffffff'],
  },
};

/* ── Hex colour → {r,g,b} ──────────────────────────────── */
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/* ── Main component ─────────────────────────────────────── */
export default function ThreeButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  className = '',
  title,
  'aria-label': ariaLabel,
  style,
}) {
  const mountRef  = useRef(null);
  const canvasRef = useRef(null);
  const stateRef  = useRef({
    rafId: null,
    particles: [],
    bursting: false,
    burstTime: 0,
    hovOpacity: 0,
    targetHov: 0,
  });
  const [hovered,  setHovered]  = useState(false);
  const [pressing, setPressing] = useState(false);

  const cfg = VARIANTS[variant] || VARIANTS.primary;

  /* ── Canvas 2D draw loop ───────────────────────────────── */
  const initCanvas = useCallback(() => {
    const mount  = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w   = mount.offsetWidth  || 120;
    const h   = mount.offsetHeight || 40;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const s = stateRef.current;

    /* Build particle pool */
    s.particles = Array.from({ length: 50 }, () => {
      const col = cfg.particles[Math.floor(Math.random() * cfg.particles.length)];
      const rgb = hexToRgb(col);
      return {
        angle: Math.random() * Math.PI * 2,
        speed: 40 + Math.random() * 110,   // px/s
        radius: 2 + Math.random() * 4,
        r: rgb.r, g: rgb.g, b: rgb.b,
        life: 1,       // starts at 1 (dead)
        maxLife: 0.55 + Math.random() * 0.6,
        x: 0, y: 0,
      };
    });

    let last = performance.now();

    function draw(now) {
      s.rafId = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.clearRect(0, 0, w, h);

      /* ── Hover glow ─────────────────────────────────── */
      s.hovOpacity += (s.targetHov - s.hovOpacity) * (1 - Math.pow(0.01, dt * 8));
      if (s.hovOpacity > 0.004) {
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.65);
        grad.addColorStop(0, `${cfg.glow}${(s.hovOpacity * 0.55).toFixed(3)})`);
        grad.addColorStop(1, `${cfg.glow}0)`);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── Burst particles ────────────────────────────── */
      if (!s.bursting) return;

      s.burstTime += dt;
      let anyAlive = false;

      ctx.globalCompositeOperation = 'lighter'; // additive blend = glowy!
      s.particles.forEach(p => {
        if (p.life >= p.maxLife) return;
        p.life += dt;
        const frac   = p.life / p.maxLife;
        const alpha  = frac < 0.3 ? frac / 0.3 : 1 - (frac - 0.3) / 0.7;
        const dist   = p.speed * p.life;
        p.x = Math.cos(p.angle) * dist;
        p.y = Math.sin(p.angle) * dist;

        if (alpha > 0.01) {
          anyAlive = true;
          const cx = w / 2 + p.x;
          const cy = h / 2 + p.y;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, p.radius * (1 + frac));
          grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha.toFixed(3)})`);
          grad.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.beginPath();
          ctx.arc(cx, cy, p.radius * (1 + frac * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      });

      ctx.globalCompositeOperation = 'source-over';

      if (!anyAlive) {
        s.bursting = false;
        s.burstTime = 0;
      }
    }

    s.rafId = requestAnimationFrame(draw);
  }, [cfg]);

  useEffect(() => {
    const id = setTimeout(initCanvas, 30);
    return () => {
      clearTimeout(id);
      const s = stateRef.current;
      if (s.rafId) cancelAnimationFrame(s.rafId);
      s.rafId = null;
    };
  }, [initCanvas]);

  /* ── Burst trigger ─────────────────────────────────────── */
  const triggerBurst = () => {
    const s = stateRef.current;
    s.bursting = true;
    s.burstTime = 0;
    s.particles.forEach(p => {
      p.life = 0;
      p.angle = Math.random() * Math.PI * 2;
      p.speed = 40 + Math.random() * 110;
      p.radius = 2 + Math.random() * 4;
      const col = cfg.particles[Math.floor(Math.random() * cfg.particles.length)];
      const rgb = hexToRgb(col);
      p.r = rgb.r; p.g = rgb.g; p.b = rgb.b;
    });
  };

  const handleClick = (e) => {
    triggerBurst();
    setPressing(true);
    setTimeout(() => setPressing(false), 180);
    if (onClick) onClick(e);
  };

  const handleMouseEnter = () => {
    setHovered(true);
    stateRef.current.targetHov = 1;
  };
  const handleMouseLeave = () => {
    setHovered(false);
    stateRef.current.targetHov = 0;
  };

  return (
    <div
      ref={mountRef}
      className={[
        'relative overflow-hidden select-none rounded-xl',
        cfg.bg,
        cfg.shadow,
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        'transition-transform duration-150 ease-out',
        pressing && !disabled ? 'scale-[0.96]'
          : hovered && !disabled ? 'scale-[1.025]'
          : 'scale-100',
        className,
      ].join(' ')}
      style={style}
    >
      {/* Canvas 2D — particle/glow layer */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Actual clickable button */}
      <button
        type={type}
        disabled={disabled}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={title}
        aria-label={ariaLabel}
        className={[
          'relative z-10 w-full h-full flex items-center justify-center gap-2',
          cfg.text,
          cfg.hover,
          variant === 'icon' ? 'p-2' : 'px-4 py-3 font-bold text-xs uppercase tracking-wider',
          'transition-colors duration-150',
          'bg-transparent border-0 outline-none',
          'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded-xl',
          disabled ? 'pointer-events-none' : '',
        ].join(' ')}
        style={{ fontFamily: 'inherit' }}
      >
        {children}
      </button>
    </div>
  );
}
