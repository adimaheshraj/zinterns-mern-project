import React from 'react';

export default function Avatar3DViewer({ avatarUrl, name, size = "w-20 h-20", gender = "male" }) {
  const ringColor = gender === 'female'
    ? 'from-pink-500 via-rose-400 to-fuchsia-500'
    : 'from-indigo-500 via-purple-400 to-cyan-400';

  return (
    <div className={`relative ${size} flex items-center justify-center group`}>
      {/* Animated gradient ring */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${ringColor} p-[2px]`}
        style={{ animation: 'spin 3s linear infinite' }}
      >
        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900" />
      </div>
      {/* Outer glow */}
      <div
        className={`absolute -inset-1 rounded-full bg-gradient-to-tr ${ringColor} opacity-30 blur-md pointer-events-none group-hover:opacity-50 transition-opacity duration-300`}
      />
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-[76%] h-[76%] rounded-full object-cover z-10 shadow-lg group-hover:scale-105 transition-transform duration-300 ring-2 ring-white/50 dark:ring-slate-800/50"
        />
      ) : (
        <div className="w-[76%] h-[76%] rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-sm z-10 shadow-lg">
          {name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}
