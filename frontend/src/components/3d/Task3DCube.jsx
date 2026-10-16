import React from 'react';

export default function Task3DCube({ priority = "medium", status = "todo", size = "w-8 h-8" }) {
  const colorMap = {
    high: 'from-rose-500 to-red-600 shadow-rose-500/40',
    medium: 'from-indigo-500 to-purple-600 shadow-indigo-500/40',
    low: 'from-emerald-500 to-teal-600 shadow-emerald-500/40'
  };
  const colorClass = colorMap[priority] || colorMap.medium;

  const shapeClass = status === 'completed'
    ? 'rounded-full'
    : status === 'in_progress'
      ? 'rotate-45 rounded-lg'
      : 'rounded-xl';

  return (
    <div
      className={`${size} inline-block cursor-pointer bg-gradient-to-br ${colorClass} ${shapeClass} border-2 border-white/30 shadow-lg hover:scale-110 transition-all duration-300 relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-white/20 rounded-inherit" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
    </div>
  );
}
