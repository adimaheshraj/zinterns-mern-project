import React, { useState } from 'react';
import { X, Users, Layers, CheckCircle, Clock, Calendar, AlertCircle, FileText, ChevronRight, Award, Megaphone } from 'lucide-react';

export default function TeamDashboardModal({ team, isOpen, onClose, onSelectUser }) {
  if (!isOpen || !team) return null;

  const mentors = team.mentors || [];
  const interns = team.interns || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-extrabold text-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{team.name} Team Dashboard</h2>
              <p className="text-xs text-indigo-200">Reporting Manager: <span className="font-extrabold text-white">{team.reportingManager || 'Unassigned'}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">Team Strength</span>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{team.strength || (mentors.length + interns.length)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">Present Today</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{team.presentToday || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-purple-600 dark:text-purple-400">WFH</span>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{team.wfhToday || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400">On Leave</span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{team.onLeave || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-center space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400">Absent</span>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{team.absentToday || 0}</p>
            </div>
          </div>

          {/* Mentors & Interns Hierarchy Sub-Tree */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" /> Team Mentors & Intern Breakdown
            </h3>

            {mentors.length > 0 ? (
              <div className="space-y-4">
                {mentors.map((mentor) => {
                  const mentorInterns = interns.filter(i => String(i.mentor) === String(mentor.employeeId) || String(i.mentor) === String(mentor._id));

                  return (
                    <div key={mentor._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div
                        onClick={() => onSelectUser && onSelectUser(mentor.employeeId)}
                        className="flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold flex items-center justify-center text-xs">
                            {mentor.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                              {mentor.name} <span className="text-[10px] font-normal text-slate-400">({mentor.employeeId})</span>
                            </p>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">Mentor • {mentorInterns.length} Assigned Interns</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </div>

                      {/* Nested Interns */}
                      {mentorInterns.length > 0 ? (
                        <div className="pl-6 border-l-2 border-indigo-200 dark:border-indigo-900 space-y-2 pt-1">
                          {mentorInterns.map((intern) => (
                            <div
                              key={intern._id}
                              onClick={() => onSelectUser && onSelectUser(intern.employeeId)}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{intern.name}</span>
                                <span className="text-[10px] text-slate-400">({intern.employeeId})</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-bold uppercase">
                                {intern.workMode || 'Office'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic pl-6">No interns currently assigned to this mentor.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                No mentors assigned to this team stream yet.
              </div>
            )}
          </div>

          {/* Quick Team Deliverables & Announcements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Pending Daily Report Reviews
              </h4>
              <p className="text-slate-400 text-xs">All daily reports for this team are up to date.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" /> Team Announcements & Deadlines
              </h4>
              <p className="text-slate-400 text-xs">Sprint Review meeting scheduled for Friday at 4:00 PM.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
