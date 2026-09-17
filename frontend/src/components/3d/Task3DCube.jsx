import React from 'react';

export default function Task3DCube({ priority = "medium", status = "todo", size = "w-8 h-8" }) {
  const colorClass = priority === 'high' ? 'bg-rose-500' : priority === 'low' ? 'bg-emerald-500' : 'bg-indigo-500';
  const shapeClass = status === 'completed' ? 'rounded-full' : status === 'in_progress' ? 'rotate-45 rounded-sm' : 'rounded-md';

  return <div className={`${size} inline-block cursor-pointer ${colorClass} ${shapeClass} border-2 border-white/40 shadow-lg animate-pulse`} />;
}
