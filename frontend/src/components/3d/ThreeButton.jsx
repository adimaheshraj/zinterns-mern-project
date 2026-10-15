/**
 * ThreeButton — Global Three.js Animated Button
 * ─────────────────────────────────────────────
 * Drop-in replacement for <button>. Renders a live WebGL canvas
 * behind every button that fires a particle burst on click and
 * pulses a glowing ring on hover.
 *
 * Variants:
 *  primary   — indigo/purple (default CTA)
 *  secondary — slate (cancel / ghost)
 *  gradient  — indigo→purple→pink (login / main CTA)
 *  danger    — rose (destructive)
 *  success   — emerald (confirm)
 *  ghost     — transparent, text only
 *  icon      — square, icon-only button
 *
 * Usage:
 *   import ThreeButton from '../3d/ThreeButton';
 *   <ThreeButton variant="primary" onClick={fn}>Save</ThreeButton>
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

/* ── Variant config ───────────────────────────────────────── */
const VARIANTS = {
  primary: {
    bg: 'bg-indigo-600',
    hover: 'hover:bg-indigo-700',
    text: 'text-white',
    shadow: 'shadow-md shadow-indigo-500/30',
    ring: '#818cf8',
    particles: [0x818cf8, 0xa78bfa, 0xc4b5fd, 0xe0e7ff, 0xffffff],
  },
  secondary: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    hover: 'hover:bg-slate-200 dark:hover:bg-slate-700',
    text: 'text-slate-700 dark:text-slate-200',
    shadow: '',
    ring: '#94a3b8',
    particles: [0x94a3b8, 0xcbd5e1, 0xe2e8f0],
  },
  gradient: {
    bg: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600',
    hover: 'hover:opacity-90',
    text: 'text-white',
    shadow: 'shadow-lg shadow-indigo-500/40',
    ring: '#a78bfa',
    particles: [0x818cf8, 0xa78bfa, 0xec4899, 0xfdf4ff, 0xffffff],
  },
  danger: {
    bg: 'bg-rose-600',
    hover: 'hover:bg-rose-700',
    text: 'text-white',
    shadow: 'shadow-md shadow-rose-500/30',
    ring: '#fb7185',
    particles: [0xfb7185, 0xfda4af, 0xffe4e6, 0xffffff],
  },
  success: {
    bg: 'bg-emerald-600',
    hover: 'hover:bg-emerald-700',
    text: 'text-white',
    shadow: 'shadow-md shadow-emerald-500/30',
    ring: '#34d399',
    particles: [0x34d399, 0x6ee7b7, 0xa7f3d0, 0xffffff],
  },
  ghost: {
    bg: 'bg-transparent',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-800/60',
    text: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
    shadow: '',
    ring: '#94a3b8',
    particles: [0x94a3b8, 0xcbd5e1],
  },
  icon: {
    bg: 'bg-transparent',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    text: 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
    shadow: '',
    ring: '#818cf8',
    particles: [0x818cf8, 0xa78bfa, 0xe0e7ff],
  },
};

/* ── Glow ring canvas helper ──────────────────────────────── */
function createGlowTexture(color) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `${color}ff`);
  g.addColorStop(0.4, `${color}99`);
  g.addColorStop(1, `${color}00`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

/* ── Main component ───────────────────────────────────────── */
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
  const mountRef = useRef(null);
  const canvasRef = useRef(null);
  const threeRef = useRef(null);
  const rafRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [pressing, setPressing] = useState(false);

  const cfg = VARIANTS[variant] || VARIANTS.primary;

  /* ── Init Three.js scene ─────────────────────────────── */
  const initThree = useCallback(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return;

    const w = mount.offsetWidth || 120;
    const h = mount.offsetHeight || 40;
    canvas.width = w;
    canvas.height = h;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return; // No WebGL
    }
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100);
    cam.position.z = 10;

    /* Particles */
    const PCOUNT = 50;
    const pos = new Float32Array(PCOUNT * 3);
    const col = new Float32Array(PCOUNT * 3);
    const sz = new Float32Array(PCOUNT);
    const pColors = cfg.particles;

    const pData = Array.from({ length: PCOUNT }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.8;
      const c = new THREE.Color(pColors[i % pColors.length]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      sz[i] = 2.5 + Math.random() * 4.5;
      pos[i * 3] = 9999; pos[i * 3 + 1] = 9999;
      return { angle, speed, life: 1, maxLife: 0.55 + Math.random() * 0.7 };
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const glowTex = createGlowTexture('#ffffff');
    const mat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 10,
      map: glowTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* Hover glow plane */
    const glowGeo = new THREE.PlaneGeometry(w * 1.6, h * 1.6);
    const ringColor = cfg.ring;
    const glowMatPlane = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ringColor),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMatPlane);
    glowMesh.position.z = 0;
    scene.add(glowMesh);

    /* State */
    let bursting = false;
    let burstTime = 0;
    let hovOpacity = 0;
    let targetHovOpacity = 0;

    function burst() {
      bursting = true;
      burstTime = 0;
      pData.forEach(p => { p.life = 0; });
    }

    function setHoverGlow(on) {
      targetHovOpacity = on ? 0.08 : 0;
    }

    function animate() {
      rafRef.current = requestAnimationFrame(animate);

      /* Hover glow lerp */
      hovOpacity += (targetHovOpacity - hovOpacity) * 0.12;
      glowMatPlane.opacity = hovOpacity;

      if (bursting) {
        burstTime += 0.018;
        mat.opacity = Math.min(1, burstTime * 5);

        pData.forEach((p, i) => {
          p.life += 0.018;
          if (p.life > p.maxLife) {
            pos[i * 3] = 9999; pos[i * 3 + 1] = 9999;
            return;
          }
          const frac = p.life / p.maxLife;
          const r = p.speed * p.life * Math.min(w, h) * 0.55;
          pos[i * 3] = Math.cos(p.angle) * r;
          pos[i * 3 + 1] = Math.sin(p.angle) * r;
          pos[i * 3 + 2] = 0;
          // Fade the whole mat
        });
        geo.attributes.position.needsUpdate = true;

        if (burstTime > 1.1) {
          bursting = false;
          mat.opacity = 0;
          pData.forEach((_, i) => { pos[i * 3] = 9999; pos[i * 3 + 1] = 9999; });
          geo.attributes.position.needsUpdate = true;
        }
      }

      renderer.render(scene, cam);
    }
    animate();

    threeRef.current = { renderer, burst, setHoverGlow, geo, mat, glowMatPlane, glowTex };
  }, [cfg]);

  useEffect(() => {
    // Small delay so the DOM has dimensions
    const id = setTimeout(initThree, 50);
    return () => {
      clearTimeout(id);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const t = threeRef.current;
      if (t) {
        t.geo?.dispose();
        t.mat?.dispose();
        t.glowMatPlane?.dispose();
        t.glowTex?.dispose();
        t.renderer?.dispose();
        threeRef.current = null;
      }
    };
  }, [initThree]);

  const handleClick = (e) => {
    threeRef.current?.burst();
    setPressing(true);
    setTimeout(() => setPressing(false), 200);
    if (onClick) onClick(e);
  };

  const handleMouseEnter = () => {
    setHovered(true);
    threeRef.current?.setHoverGlow(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    threeRef.current?.setHoverGlow(false);
  };

  const isIcon = variant === 'icon';

  return (
    <div
      ref={mountRef}
      className={[
        'relative overflow-hidden select-none',
        isIcon ? 'rounded-xl' : 'rounded-xl',
        cfg.bg,
        cfg.shadow,
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        'transition-all duration-150',
        pressing && !disabled ? 'scale-[0.96]' : hovered && !disabled ? 'scale-[1.02]' : 'scale-100',
        className,
      ].join(' ')}
      style={style}
    >
      {/* Three.js WebGL canvas — behind everything */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Actual button — transparent bg so canvas shows through */}
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
          isIcon ? 'p-2' : 'px-4 py-3 font-bold text-xs uppercase tracking-wider',
          'transition-colors duration-150',
          'bg-transparent border-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded-xl',
        ].join(' ')}
        style={{ fontFamily: 'inherit' }}
      >
        {children}
      </button>
    </div>
  );
}
