import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FileSpreadsheet, Star, Sparkles, Send, Eye, ShieldAlert, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Reports() {
  const { user, token, API_URL } = useApp();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // Form inputs for new report (Intern only)
  const [tasksToday, setTasksToday] = useState('');
  const [completedWork, setCompletedWork] = useState('');
  const [pendingWork, setPendingWork] = useState('');
  const [challenges, setChallenges] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [hoursWorked, setHoursWorked] = useState('9');
  const [githubLink, setGithubLink] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  // Grading states (Mentor/RM only)
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  // AI Summary state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummaryResult, setAiSummaryResult] = useState(null);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReports(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token, API_URL]);

  const handlePostReport = async (e) => {
    e.preventDefault();
    if (!tasksToday || !completedWork) return;

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tasksToday,
          completedWork,
          pendingWork,
          challenges,
          tomorrowPlan,
          hoursWorked: Number(hoursWorked),
          githubLink,
          demoLink
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage('🟢 Daily report submitted successfully!');
        setTasksToday('');
        setCompletedWork('');
        setPendingWork('');
        setChallenges('');
        setTomorrowPlan('');
        setGithubLink('');
        setDemoLink('');
        fetchReports();
      } else {
        setStatusMessage('🔴 Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGradeReport = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/reports/${selectedReport._id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, feedback })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data.report);
        fetchReports();
        setFeedback('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerAI = async (reportId) => {
    setAiLoading(true);
    setAiSummaryResult(null);
    try {
      const res = await fetch(`${API_URL}/ai/report-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reportId })
      });
      const data = await res.json();
      if (res.ok) {
        setAiSummaryResult(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-indigo-500" />
          Daily Work Reports
        </h1>
        <p className="text-sm text-slate-400 mt-1">Submit your daily milestones or grade intern deliverables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit Form (Intern only) */}
        {user.role === 'Intern' && (
          <div className="lg:col-span-1 p-6 rounded-2xl glass-card border shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Submit Daily Report</h3>
            <form onSubmit={handlePostReport} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase">Today's Assigned Tasks</label>
                <input
                  type="text"
                  required
                  value={tasksToday}
                  onChange={(e) => setTasksToday(e.target.value)}
                  placeholder="e.g. Design UI stat panels for homepage dashboard"
                  className="w-full p-2 border rounded-lg bg-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase">Completed Work</label>
                <textarea
                  required
                  rows={2}
                  value={completedWork}
                  onChange={(e) => setCompletedWork(e.target.value)}
                  placeholder="Details of what was finished..."
                  className="w-full p-2 border rounded-lg bg-transparent text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Pending Tasks</label>
                  <input
                    type="text"
                    value={pendingWork}
                    onChange={(e) => setPendingWork(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Tomorrow's Plan</label>
                  <input
                    type="text"
                    value={tomorrowPlan}
                    onChange={(e) => setTomorrowPlan(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Challenges Faced</label>
                  <input
                    type="text"
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Hours Worked</label>
                  <input
                    type="number"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">GitHub PR/Commit Link</label>
                  <input
                    type="url"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Demo Preview Link</label>
                  <input
                    type="url"
                    value={demoLink}
                    onChange={(e) => setDemoLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                Submit Daily Report
              </button>

              {statusMessage && (
                <p className="text-center text-[10px] font-semibold text-slate-500">{statusMessage}</p>
              )}
            </form>
          </div>
        )}

        {/* History Feed */}
        <div className={`p-6 rounded-2xl glass-card border shadow-sm space-y-4 ${user.role === 'Intern' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Submitted Reports Logs</h3>

          <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
            {reports.map((r) => (
              <div
                key={r._id}
                className="p-4 rounded-xl border bg-white dark:bg-slate-900/60 shadow-sm hover:shadow transition-shadow space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                      {r.internName}
                    </h4>
                    <span className="text-[10px] text-slate-400">{r.internId} | {r.internDept}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.rating !== undefined ? (
                      <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {r.rating}/5
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-semibold uppercase">
                        Unreviewed
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {r.date}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border-t dark:border-slate-800/50 pt-2 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="font-bold block text-slate-400">Tasks Completed</span>
                    <p className="mt-0.5 line-clamp-2">{r.completedWork}</p>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-400">Next Plan & Obstacles</span>
                    <p className="mt-0.5 line-clamp-2">{r.tomorrowPlan || 'None'} / {r.challenges || 'None'}</p>
                  </div>
                </div>

                {/* Report expansion trigger */}
                <div className="flex items-center justify-end gap-2 border-t dark:border-slate-800/50 pt-2">
                  <button
                    onClick={() => handleTriggerAI(r._id)}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-100"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Summary
                  </button>
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded view Details & Review Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-2xl border shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-6 border-b dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/20">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Daily Report Details</h3>
                  <span className="text-xs text-slate-400">{selectedReport.internName} | {selectedReport.date}</span>
                </div>
                <button onClick={() => setSelectedReport(null)} className="text-slate-500 font-bold">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
                <div>
                  <span className="font-bold text-xs text-slate-400 block uppercase">Tasks Logged Today</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{selectedReport.tasksToday}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-xs text-slate-400 block uppercase">Work Finished</span>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">{selectedReport.completedWork}</p>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-400 block uppercase">Tomorrow's Schedule</span>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">{selectedReport.tomorrowPlan || 'None planned'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t dark:border-slate-800/50 pt-3">
                  <div>
                    <span className="font-bold text-xs text-slate-400 block uppercase">Hurdles / Challenges</span>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">{selectedReport.challenges || 'No challenges faced'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-400 block uppercase">Hours Logged</span>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">{selectedReport.hoursWorked} Hours</p>
                  </div>
                </div>

                {/* Git links */}
                {(selectedReport.githubLink || selectedReport.demoLink) && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border rounded-xl space-y-1 text-xs">
                    {selectedReport.githubLink && (
                      <div>GitHub Commit: <a href={selectedReport.githubLink} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">{selectedReport.githubLink}</a></div>
                    )}
                    {selectedReport.demoLink && (
                      <div>Live Demo: <a href={selectedReport.demoLink} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">{selectedReport.demoLink}</a></div>
                    )}
                  </div>
                )}

                {/* Mentor Grading block */}
                {selectedReport.rating !== undefined ? (
                  <div className="p-4 bg-emerald-50/20 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Award className="w-5 h-5" />
                        Mentor Evaluation
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {selectedReport.rating}/5
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 italic mt-1">"{selectedReport.feedback || 'Good job!'}"</p>
                  </div>
                ) : user.role === 'Mentor' || user.role === 'RM' || user.role === 'HR' ? (
                  <form onSubmit={handleGradeReport} className="border-t dark:border-slate-800 pt-4 space-y-3">
                    <h5 className="font-bold text-xs text-slate-400 uppercase">Evaluate Intern Work</h5>
                    <div className="grid grid-cols-3 gap-3 items-center">
                      <div className="space-y-1 col-span-1">
                        <label className="text-xs font-semibold text-slate-400">Rating (1-5)</label>
                        <select
                          value={rating}
                          onChange={(e) => setRating(Number(e.target.value))}
                          className="w-full p-2 border rounded-lg bg-transparent text-sm"
                        >
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="2">2 Stars</option>
                          <option value="1">1 Star</option>
                        </select>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-semibold text-slate-400">Feedback Comments</label>
                        <input
                          type="text"
                          required
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="e.g. Excellent implementation details..."
                          className="w-full p-2 border rounded-lg bg-transparent text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                    >
                      Submit Evaluation
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center pt-2">Awaiting Mentor Evaluation</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Summary Loader Overlay */}
      <AnimatePresence>
        {(aiLoading || aiSummaryResult) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 text-sm uppercase tracking-wider">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  ZInterns AI Summarizer
                </span>
                <button
                  onClick={() => {
                    setAiLoading(false);
                    setAiSummaryResult(null);
                  }}
                  className="text-slate-400 font-bold"
                >
                  ✕
                </button>
              </div>

              {aiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                  <span className="text-xs text-slate-400 animate-pulse font-medium">Scanning report parameters...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-indigo-50/10 p-4 border rounded-xl font-medium"
                    dangerouslySetInnerHTML={{
                      __html: aiSummaryResult
                        .replace(/\n/g, '<br />')
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                    }}
                  />
                  <button
                    onClick={() => setAiSummaryResult(null)}
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
