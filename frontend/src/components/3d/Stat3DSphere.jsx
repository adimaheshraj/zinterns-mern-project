import React from 'react';
import { Users, UserCheck, Clock, Home, Calendar } from 'lucide-react';

export default function Stat3DSphere({ theme = "indigo", size = "w-12 h-12", icon: Icon, children }) {
    const themeStyles = {
      indigo: {
        bg: 'bg-indigo-500/20 dark:bg-indigo-500/30',
        border: 'border-indigo-500 dark:border-indigo-400',
        text: 'text-indigo-600 dark:text-indigo-300',
        shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.4)]',
        gradient: 'from-indigo-500/30 via-purple-500/20 to-indigo-600/30',
        defaultIcon: Users,
      },
      purple: {
        bg: 'bg-purple-500/20 dark:bg-purple-500/30',
        border: 'border-purple-500 dark:border-purple-400',
        text: 'text-purple-600 dark:text-purple-300',
        shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
        gradient: 'from-purple-500/30 via-pink-500/20 to-purple-600/30',
        defaultIcon: Clock,
      },
      pink: {
        bg: 'bg-pink-500/20 dark:bg-pink-500/30',
        border: 'border-pink-500 dark:border-pink-400',
        text: 'text-pink-600 dark:text-pink-300',
        shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.4)]',
        gradient: 'from-pink-500/30 via-rose-500/20 to-pink-600/30',
        defaultIcon: Home,
      },
      emerald: {
        bg: 'bg-emerald-500/20 dark:bg-emerald-500/30',
        border: 'border-emerald-500 dark:border-emerald-400',
        text: 'text-emerald-600 dark:text-emerald-300',
        shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
        gradient: 'from-emerald-500/30 via-teal-500/20 to-emerald-600/30',
        defaultIcon: UserCheck,
      },
      cyan: {
        bg: 'bg-cyan-500/20 dark:bg-cyan-500/30',
        border: 'border-cyan-500 dark:border-cyan-400',
        text: 'text-cyan-600 dark:text-cyan-300',
        shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
        gradient: 'from-cyan-500/30 via-blue-500/20 to-cyan-600/30',
        defaultIcon: Users,
      },
      amber: {
        bg: 'bg-amber-500/20 dark:bg-amber-500/30',
        border: 'border-amber-500 dark:border-amber-400',
        text: 'text-amber-600 dark:text-amber-300',
        shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
        gradient: 'from-amber-500/30 via-orange-500/20 to-amber-600/30',
        defaultIcon: Calendar,
      }
    };

    const currentTheme = themeStyles[theme] || themeStyles.indigo;
    const TargetIcon = Icon || currentTheme.defaultIcon;

    return (
      <div
        className={`relative ${size} flex items-center justify-center rounded-full border-2 ${currentTheme.border} ${currentTheme.bg} bg-gradient-to-br ${currentTheme.gradient} ${currentTheme.text} ${currentTheme.shadow} backdrop-blur-md transition-all duration-300 hover:scale-110`}
      >
        <div className="absolute inset-0 rounded-full bg-white/10 blur-xs pointer-events-none" />
        {TargetIcon ? (
          <TargetIcon className="w-5 h-5 text-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10" />
        ) : (
          children
        )}
      </div>
    );
}
