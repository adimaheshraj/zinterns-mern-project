import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Check, X, ShieldAlert, HeartPulse, Sparkles, Clock, CheckCircle, Home } from 'lucide-react';
import Card3DCanvas from '../components/3d/Card3DCanvas';
import Stat3DSphere from '../components/3d/Stat3DSphere';

export default function Leaves() {
  const { user, token, API_URL } = useApp();
  const [leaves, setLeaves] = useState([]);
  const [wfhRequests, setWfhRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' | 'wfh'

  // Form inputs for leave application
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Form inputs for WFH application
  const [wfhDate, setWfhDate] = useState(new Date().toISOString().split('T')[0]);
  const [wfhMode, setWfhMode] = useState('WFH');
  const [wfhReason, setWfhReason] = useState('');

  const [statusMessage, setStatusMessage] = useState(null);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [leavesRes, wfhRes] = await Promise.all([
        fetch(`${API_URL}/leaves`, { headers }),
        fetch(`${API_URL}/attendance/wfh-requests`, { headers })
      ]);

      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setLeaves(leavesData);
      }
      if (wfhRes.ok) {
        const wfhData = await wfhRes.json();
        setWfhRequests(wfhData);
      }
    } catch (e) {
      console.error('Error fetching leaves/wfh data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_URL]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    try {
      const res = await fetch(`${API_URL}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ leaveType, startDate, endDate, reason })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage('🟢 Leave request submitted successfully.');
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchData();
      } else {
        setStatusMessage('🔴 Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyWFH = async (e) => {
    e.preventDefault();
    if (!wfhDate || !wfhReason) return;

    try {
      const res = await fetch(`${API_URL}/attendance/wfh-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date: wfhDate, workMode: wfhMode, reason: wfhReason })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage('🟢 WFH Pass request submitted successfully.');
        setWfhReason('');
        fetchData();
      } else {
        setStatusMessage('🔴 Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewLeave = async (leaveId, decision) => {
    try {
      const res = await fetch(`${API_URL}/leaves/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: decision, comments: 'Reviewed by ' + user.name })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewWFH = async (wfhId, decision) => {
    try {
      const res = await fetch(`${API_URL}/attendance/wfh-requests/${wfhId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: decision, comments: 'Reviewed by ' + user.name })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Count summaries
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending' || l.status === 'mentor_approved').length;
  const pendingWfhCount = wfhRequests.filter(w => w.status === 'pending').length;
  const totalPending = pendingLeavesCount + pendingWfhCount;

  const approvedLeavesCount = leaves.filter(l => l.status === 'approved').length;
  const approvedWfhCount = wfhRequests.filter(w => w.status === 'approved').length;

  const canReview = ['RM', 'HR', 'Super Admin', 'Mentor'].includes(user?.role);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-indigo-500" />
          Leave & Remote Pass Tracker
        </h1>
        <p className="text-sm text-slate-400 mt-1">Apply for leaves or WFH passes, and approve team requests.</p>
      </div>

      {/* Stats summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card3DCanvas themeColor="amber" className="p-5 flex items-center justify-between">
          <div className="z-10">
            <p className="text-xs text-slate-400 font-extrabold uppercase">Pending Requests</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalPending}</p>
          </div>
          <div className="z-10">
            <Stat3DSphere theme="amber" size="w-12 h-12" icon={Clock} />
          </div>
        </Card3DCanvas>

        <Card3DCanvas themeColor="emerald" className="p-5 flex items-center justify-between">
          <div className="z-10">
            <p className="text-xs text-slate-400 font-extrabold uppercase">Approved Passes & Leaves</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{approvedLeavesCount + approvedWfhCount}</p>
          </div>
          <div className="z-10">
            <Stat3DSphere theme="emerald" size="w-12 h-12" icon={CheckCircle} />
          </div>
        </Card3DCanvas>

        <Card3DCanvas themeColor="purple" className="p-5 flex items-center justify-between">
          <div className="z-10">
            <p className="text-xs text-slate-400 font-extrabold uppercase">Leave Balance</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">12 Days</p>
          </div>
          <div className="z-10">
            <Stat3DSphere theme="purple" size="w-12 h-12" icon={Calendar} />
          </div>
        </Card3DCanvas>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form Column */}
        <div className="lg:col-span-1 p-6 rounded-2xl glass-card border shadow-sm h-fit space-y-4">
          <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => { setActiveTab('leaves'); setStatusMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'leaves'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Request Leave
            </button>
            <button
              onClick={() => { setActiveTab('wfh'); setStatusMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'wfh'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Request WFH Pass
            </button>
          </div>

          {activeTab === 'leaves' ? (
            <form onSubmit={handleApplyLeave} className="space-y-4 text-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Apply for Leave</h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent"
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                  <option value="Comp Off">Comp Off</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Brief details explaining emergency/need..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow hover:bg-indigo-700 transition-colors"
              >
                Submit Leave Application
              </button>
            </form>
          ) : (
            <form onSubmit={handleApplyWFH} className="space-y-4 text-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Apply for Remote / WFH Pass</h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Target Date</label>
                <input
                  type="date"
                  required
                  value={wfhDate}
                  onChange={(e) => setWfhDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Pass Mode</label>
                <select
                  value={wfhMode}
                  onChange={(e) => setWfhMode(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent font-bold text-indigo-600 dark:text-indigo-400"
                >
                  <option value="WFH">Work From Home (Full Day)</option>
                  <option value="Hybrid">Hybrid Remote Pass</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Reason for Remote Work</label>
                <textarea
                  required
                  rows={3}
                  value={wfhReason}
                  onChange={(e) => setWfhReason(e.target.value)}
                  placeholder="Explain reason for remote work request..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow hover:bg-indigo-700 transition-colors uppercase tracking-wider text-xs"
              >
                Submit WFH Pass Request
              </button>
            </form>
          )}

          {statusMessage && (
            <p className="text-xs text-center font-semibold text-slate-600 dark:text-slate-300 mt-2">{statusMessage}</p>
          )}
        </div>

        {/* Applied / Review Logs Column */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Leave & Remote Pass Approval Queue</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('leaves')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'leaves'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Leaves ({leaves.length})
              </button>
              <button
                onClick={() => setActiveTab('wfh')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'wfh'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                WFH Passes ({wfhRequests.length})
              </button>
            </div>
          </div>

          <div className="divide-y dark:divide-slate-800 overflow-x-auto">
            {activeTab === 'leaves' ? (
              leaves.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 font-semibold uppercase border-b dark:border-slate-800 pb-2">
                      <th className="py-2">Employee</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Duration</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {leaves.map((l) => (
                      <tr key={l._id} className="py-3">
                        <td className="py-3 pr-2">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">{l.applicantName}</div>
                          <div className="text-[10px] text-slate-400">{l.userId} | {l.applicantDept}</div>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">{l.leaveType}</td>
                        <td className="py-3 text-xs text-slate-500">
                          {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              l.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                                : l.status === 'mentor_approved'
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                                : l.status === 'rejected'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {canReview && ['pending', 'mentor_approved'].includes(l.status) ? (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => handleReviewLeave(l._id, user.role === 'Mentor' ? 'mentor_approved' : 'approved')}
                                className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReviewLeave(l._id, 'rejected')}
                                className="p-1 bg-rose-50 text-rose-600 rounded hover:bg-rose-100"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No actions</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-500 py-6 text-center">No active leave logs found.</p>
              )
            ) : wfhRequests.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 font-semibold uppercase border-b dark:border-slate-800 pb-2">
                    <th className="py-2">Employee</th>
                    <th className="py-2">Pass Type</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {wfhRequests.map((r) => (
                    <tr key={r._id} className="py-3">
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">{r.userName || r.userId}</div>
                        <div className="text-[10px] text-slate-400">{r.userId} | {r.department || 'N/A'}</div>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">{r.workMode} Pass</td>
                      <td className="py-3 text-xs text-slate-500">{r.date}</td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            r.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                              : r.status === 'rejected'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {canReview && r.status === 'pending' ? (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => handleReviewWFH(r._id, 'approved')}
                              className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReviewWFH(r._id, 'rejected')}
                              className="p-1 bg-rose-50 text-rose-600 rounded hover:bg-rose-100"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500 py-6 text-center">No active WFH pass requests found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
