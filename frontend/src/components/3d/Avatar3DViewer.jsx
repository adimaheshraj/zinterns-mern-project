import React from 'react';

export default function Avatar3DViewer({ avatarUrl, name, size = "w-20 h-20", gender = "male" }) {
  return (
    <div className={`relative ${size} flex items-center justify-center group`}>
      <div className={`absolute inset-0 rounded-full border-2 ${gender === 'female' ? 'border-pink-500' : 'border-indigo-500'} animate-spin`} />
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-[78%] h-[78%] rounded-full object-cover z-0 shadow-lg group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-[78%] h-[78%] rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-sm z-0">
          {name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}
