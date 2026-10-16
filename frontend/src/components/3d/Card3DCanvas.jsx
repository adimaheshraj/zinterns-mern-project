import React, { useRef } from 'react';

export default function Card3DCanvas({ themeColor = "indigo", children, className = "" }) {
  const cardRef = useRef(null);
  const frameRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const rotateX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -5;
      const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 5;
      card.style.setProperty('--card-rotate-x', `${rotateX}deg`);
      card.style.setProperty('--card-rotate-y', `${rotateY}deg`);
      frameRef.current = null;
    });
  };

  const handleMouseLeave = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (cardRef.current) {
      cardRef.current.style.setProperty('--card-rotate-x', '0deg');
      cardRef.current.style.setProperty('--card-rotate-y', '0deg');
    }
  };

  const glowColors = {
    indigo: 'from-indigo-500/15 via-purple-500/8 to-transparent',
    purple: 'from-purple-500/15 via-pink-500/8 to-transparent',
    pink: 'from-pink-500/15 via-rose-500/8 to-transparent',
    emerald: 'from-emerald-500/15 via-teal-500/8 to-transparent',
    cyan: 'from-cyan-500/15 via-blue-500/8 to-transparent',
    amber: 'from-amber-500/15 via-orange-500/8 to-transparent'
  };

  const glowClass = glowColors[themeColor] || glowColors.indigo;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`cyber-card relative overflow-hidden group ${className}`}
    >
      <div className={`absolute inset-0 z-0 bg-gradient-to-br ${glowClass} pointer-events-none transition-opacity duration-300 group-hover:opacity-150`} />
      <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
