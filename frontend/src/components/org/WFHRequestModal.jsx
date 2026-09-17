import React, { useState, useEffect } from 'react';
import { X, Home, Clock, Check, AlertCircle, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function WFHRequestModal({ isOpen, onClose }) {
  const { user, token, API_URL } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workMode, setWorkMode] = useState('WFH');
  const [reason, setReason] = useState('');

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/attendance/wfh-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchRequests();
  }, [isOpen, token, API_URL]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !reason) return;
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_URL}/attendance/wfh-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date, workMode, reason })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg('🟢 WFH Request Submitted! Awaiting Reporting Manager approval.');
        setReason('');
        fetchRequests();
      } else {
        setStatusMsg('🔴 Error: ' + data.error);
      }
    } catch (err) {
      setStatusMsg('🔴 Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/attendance/wfh-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isIntern = user?.role === 'Intern';
  const canReview = ['RM', 'HR', 'Super Admin', 'Mentor'].includes(user?.role);
  const pendingRequests = requests.filter((request) => request.status === 'pending');
  const sortedRequests = [...requests].sort((first, second) => {
    if (first.status === 'pending' && second.status !== 'pending') return -1;
    if (first.status !== 'pending' && second.status === 'pending') return 1;
    return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">WFH / Hybrid Pass Portal</h2>
              <p className="text-xs text-indigo-100">Request remote check-in authorization or review team passes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Request Form */}
          {isIntern && <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Apply for WFH Pass</h3>

            {statusMsg && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl">
                {statusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-400 block mb-1">Target Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 block mb-1">Pass Type</label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                >
                  <option value="WFH">Work From Home (Full Day)</option>
                  <option value="Hybrid">Hybrid Remote Pass</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-400 block mb-1">Reason for Remote Work *</label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the reason for remote work request..."
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors uppercase tracking-wider"
            >
              {submitting ? 'Submitting Pass Request...' : 'Submit WFH Pass Request'}
            </button>
          </form>}

          {/* Pass History & Approval Queue */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
              {canReview ? `Pending WFH Approvals (${pendingRequests.length})` : isIntern ? 'My Remote Pass Requests' : 'Intern WFH Request Status'}
            </h3>

            {loading ? (
              <p className="text-slate-400 text-center py-4">Loading requests...</p>
            ) : requests.length > 0 ? (
              <div className="space-y-2">
                {sortedRequests.map((r) => (
                  <div key={r._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{r.userName} ({r.userId})</span>
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded font-bold uppercase">{r.workMode}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Date: {r.date} • Reason: {r.reason}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        r.status === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        r.status === 'rejected' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' :
                        'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {r.status}
                      </span>

                      {canReview && r.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleReview(r._id, 'approved')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 text-[10px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(r._id, 'rejected')}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 text-[10px]"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-6">No WFH pass requests submitted yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
