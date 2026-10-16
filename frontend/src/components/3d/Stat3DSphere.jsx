import React from 'react';
import { Users, UserCheck, Clock, Home, Calendar } from 'lucide-react';

export default function Stat3DSphere({ theme = "indigo", size = "w-12 h-12", icon: Icon, children }) {
    const themeStyles = {
      indigo: {
        bg: 'bg-indigo-500/25 dark:bg-indigo-500/35',
        border: 'border-indigo-400 dark:border-indigo-300',
        text: 'text-indigo-600 dark:text-indigo-300',
        shadow: 'shadow-[0_0_20px_rgba(99,102,241,0.5)]',
        gradient: 'from-indigo-500/35 via-purple-500/25 to-indigo-600/35',
        ring: 'ring-indigo-400/20',
        defaultIcon: Users,
      },
      purple: {
        bg: 'bg-purple-500/25 dark:bg-purple-500/35',
        border: 'border-purple-400 dark:border-purple-300',
        text: 'text-purple-600 dark:text-purple-300',
        shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
        gradient: 'from-purple-500/35 via-pink-500/25 to-purple-600/35',
        ring: 'ring-purple-400/20',
        defaultIcon: Clock,
      },
      pink: {
        bg: 'bg-pink-500/25 dark:bg-pink-500/35',
        border: 'border-pink-400 dark:border-pink-300',
        text: 'text-pink-600 dark:text-pink-300',
        shadow: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
        gradient: 'from-pink-500/35 via-rose-500/25 to-pink-600/35',
        ring: 'ring-pink-400/20',
        defaultIcon: Home,
      },
      emerald: {
        bg: 'bg-emerald-500/25 dark:bg-emerald-500/35',
        border: 'border-emerald-400 dark:border-emerald-300',
        text: 'text-emerald-600 dark:text-emerald-300',
        shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.5)]',
        gradient: 'from-emerald-500/35 via-teal-500/25 to-emerald-600/35',
        ring: 'ring-emerald-400/20',
        defaultIcon: UserCheck,
      },
      cyan: {
        bg: 'bg-cyan-500/25 dark:bg-cyan-500/35',
        border: 'border-cyan-400 dark:border-cyan-300',
        text: 'text-cyan-600 dark:text-cyan-300',
        shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.5)]',
        gradient: 'from-cyan-500/35 via-blue-500/25 to-cyan-600/35',
        ring: 'ring-cyan-400/20',
        defaultIcon: Users,
      },
      amber: {
        bg: 'bg-amber-500/25 dark:bg-amber-500/35',
        border: 'border-amber-400 dark:border-amber-300',
        text: 'text-amber-600 dark:text-amber-300',
        shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
        gradient: 'from-amber-500/35 via-orange-500/25 to-amber-600/35',
        ring: 'ring-amber-400/20',
        defaultIcon: Calendar,
      }
    };

    const currentTheme = themeStyles[theme] || themeStyles.indigo;
    const TargetIcon = Icon || currentTheme.defaultIcon;

    return (
      <div
        className={`relative ${size} flex items-center justify-center rounded-full border-2 ${currentTheme.border} ${currentTheme.bg} bg-gradient-to-br ${currentTheme.gradient} ${currentTheme.text} ${currentTheme.shadow} ring-4 ${currentTheme.ring} backdrop-blur-md transition-all duration-300 hover:scale-110 hover:ring-8`}
      >
        <div className="absolute inset-0 rounded-full bg-white/15 blur-sm pointer-events-none" />
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 border-2 border-current" />
        {TargetIcon ? (
          <TargetIcon className="w-5 h-5 text-current drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] z-10" />
        ) : (
          children
        )}
      </div>
    );
}
