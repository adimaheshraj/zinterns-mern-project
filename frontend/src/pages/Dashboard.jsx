import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Users,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Zap,
  Star,
  UserCheck,
  Home,
  Check,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import Card3DCanvas from '../components/3d/Card3DCanvas';
import Stat3DSphere from '../components/3d/Stat3DSphere';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { user, token, API_URL, setActiveTab } = useApp();
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [wfhRequests, setWfhRequests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const endpoints = [
        '/org/stats',
        '/reports',
        '/org/directory',
        '/leaves',
        '/tasks',
        '/auth/settings',
        '/attendance/wfh-requests'
      ];
      const responses = await Promise.all(endpoints.map((endpoint) => fetch(`${API_URL}${endpoint}`, { headers })));
      const payloads = await Promise.all(responses.map((response) => response.ok ? response.json() : null));
      setStats(payloads[0]);
      setRecentReports(Array.isArray(payloads[1]) ? payloads[1].slice(0, 4) : []);
      setDirectory(Array.isArray(payloads[2]) ? payloads[2] : []);
      setLeaves(Array.isArray(payloads[3]) ? payloads[3] : []);
      setTasks(Array.isArray(payloads[4]) ? payloads[4] : []);
      setSettings(payloads[5]);
      setWfhRequests(Array.isArray(payloads[6]) ? payloads[6] : []);
    } catch (e) {
      console.error('Error fetching dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, API_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const telemetry = stats || {
    totalEmployees: 0,
    activeInterns: 0,
    presentToday: 0,
    absentToday: 0,
    wfhToday: 0,
    hybridToday: 0,
    lateToday: 0,
    departmentsBreakdown: [],
    internPerformance: []
  };

  if (user.role === 'HR' || user.role === 'Super Admin') {
    return (
      <HRDashboard
        user={user}
        stats={telemetry}
        reports={recentReports}
        leaves={leaves}
        wfhRequests={wfhRequests}
        token={token}
        API_URL={API_URL}
        onRefresh={fetchDashboardData}
      />
    );
  }

  if (user.role === 'RM') {
    return (
      <RMDashboard
        stats={telemetry}
        reports={recentReports}
        directory={directory}
        leaves={leaves}
        wfhRequests={wfhRequests}
        token={token}
        API_URL={API_URL}
        onRefresh={fetchDashboardData}
      />
    );
  }

  if (user.role === 'Mentor') {
    return (
      <MentorDashboard
        stats={telemetry}
        reports={recentReports}
        leaves={leaves}
        wfhRequests={wfhRequests}
        token={token}
        API_URL={API_URL}
        onRefresh={fetchDashboardData}
        setActiveTab={setActiveTab}
      />
    );
  }

  return <InternDashboard user={user} tasks={tasks} settings={settings} token={token} API_URL={API_URL} />;
}

// Reusable Pending Approvals List Component
function PendingApprovalsList({ leaves = [], wfhRequests = [], token, API_URL, onRefresh }) {
  const [actingId, setActingId] = useState(null);

  const pendingLeaves = leaves.filter((leave) => ['pending', 'mentor_approved'].includes(leave.status));
  const pendingWfh = wfhRequests.filter((request) => request.status === 'pending');

  const combined = [
    ...pendingLeaves.map((l) => ({
      _id: l._id,
      category: 'leave',
      applicantName: l.applicantName || l.userId,
      subtitle: `${l.leaveType} Leave (${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()})`,
      reason: l.reason,
      status: l.status,
      dateSort: new Date(l.createdAt || l.startDate || 0)
    })),
    ...pendingWfh.map((w) => ({
      _id: w._id,
      category: 'wfh',
      applicantName: w.userName || w.userId,
      subtitle: `${w.workMode || 'WFH'} Pass (${w.date})`,
      reason: w.reason,
      status: w.status,
      dateSort: new Date(w.createdAt || 0)
    }))
  ].sort((a, b) => b.dateSort - a.dateSort);

  const handleReviewLeave = async (id, status) => {
    setActingId(id);
    try {
      await fetch(`${API_URL}/leaves/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, comments: 'Reviewed from Dashboard' })
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActingId(null);
    }
  };

  const handleReviewWFH = async (id, status) => {
    setActingId(id);
    try {
      await fetch(`${API_URL}/attendance/wfh-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, comments: 'Reviewed from Dashboard' })
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActingId(null);
    }
  };

  if (combined.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-6">No pending approvals.</p>;
  }

  return (
    <div className="space-y-3">
      {combined.map((item) => (
        <div
          key={item._id}
          className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-shadow"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{item.applicantName}</span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                  item.category === 'wfh'
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                }`}
              >
                {item.category === 'wfh' ? 'WFH Pass' : 'Leave Request'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{item.subtitle}</p>
            {item.reason && <p className="text-[10px] text-slate-400 italic line-clamp-1">"{item.reason}"</p>}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              disabled={actingId === item._id}
              onClick={() =>
                item.category === 'wfh'
                  ? handleReviewWFH(item._id, 'approved')
                  : handleReviewLeave(item._id, 'approved')
              }
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              disabled={actingId === item._id}
              onClick={() =>
                item.category === 'wfh'
                  ? handleReviewWFH(item._id, 'rejected')
                  : handleReviewLeave(item._id, 'rejected')
              }
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------
// 1. HR Dashboard
// ----------------------------------------------------
function HRDashboard({ user, stats, reports, leaves, wfhRequests, token, API_URL, onRefresh }) {
  const pendingLeaves = leaves.filter((leave) => ['pending', 'mentor_approved'].includes(leave.status));
  const pendingWfh = wfhRequests.filter((request) => request.status === 'pending');
  const totalPending = pendingLeaves.length + pendingWfh.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xl flex items-center justify-between border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Super Admin Control Center
          </span>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 mt-2">
            Welcome back, {user.name}! <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" />
          </h1>
          <p className="text-indigo-100 text-sm">Here is your ZInterns platform metrics summary for today.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard title="Total Employees" value={stats.totalEmployees} theme="indigo" icon={Users} />
        <StatCard title="Active Interns" value={stats.activeInterns} theme="emerald" icon={UserCheck} />
        <StatCard title="Present Today" value={stats.presentToday} theme="purple" icon={Clock} />
        <StatCard title="Pending Approvals" value={totalPending} theme="pink" icon={Clock} />
      </div>

      {/* Pending Approvals Section for HR / Admin */}
      <div className="p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
        <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Pending Approvals Queue ({totalPending})
        </h2>
        <PendingApprovalsList
          leaves={leaves}
          wfhRequests={wfhRequests}
          token={token}
          API_URL={API_URL}
          onRefresh={onRefresh}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            Department Allocations
          </h2>
          <div className="h-64">
            {stats.departmentsBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.departmentsBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="h-full flex items-center justify-center text-sm text-slate-400">No active users have departments yet.</p>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            Intern Performance Scorecard
          </h2>
          <div className="h-64">
            {stats.internPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.internPerformance}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="rating"
                  >
                    {stats.internPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} Rating`} />
                  <Legend formatter={(value, entry) => <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{entry.payload.name}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="h-full flex items-center justify-center text-sm text-slate-400">No performance evaluations have been recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60">
        <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          Latest Daily Reports Feed
        </h2>
        <div className="divide-y dark:divide-slate-800">
          {reports.length > 0 ? (
            reports.map((r) => (
              <div key={r._id} className="py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-colors">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{r.internName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.tasksToday}</p>
                </div>
                <span className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-md font-bold">
                  {r.date}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 py-2 text-center">No recent reports submitted.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------
// 2. Reporting Manager Dashboard
// ----------------------------------------------------
function RMDashboard({ stats, reports, directory, leaves, wfhRequests, token, API_URL, onRefresh }) {
  const mentorCount = directory.filter((member) => member.role === 'Mentor' && member.status === 'active').length;
  const pendingLeaves = leaves.filter((leave) => ['pending', 'mentor_approved'].includes(leave.status));
  const pendingWfh = wfhRequests.filter((request) => request.status === 'pending');
  const totalPending = pendingLeaves.length + pendingWfh.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Management Portal
          </span>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 mt-2">
            Team Workspace <TrendingUp className="w-7 h-7 text-yellow-300" />
          </h1>
          <p className="text-blue-100 text-sm">Review team logs, approve passes, and track project outputs.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard title="Team Mentors" value={mentorCount} theme="cyan" icon={Users} />
        <StatCard title="Active Interns" value={stats.activeInterns} theme="purple" icon={UserCheck} />
        <StatCard title="Checked In" value={stats.presentToday} theme="emerald" icon={CheckCircle} />
        <StatCard title="Pending Approvals" value={totalPending} theme="pink" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            Tasks Completed vs Target
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.internPerformance}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTasks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Pending Review Requests ({totalPending})
          </h2>
          <PendingApprovalsList
            leaves={leaves}
            wfhRequests={wfhRequests}
            token={token}
            API_URL={API_URL}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------
// 3. Mentor Dashboard
// ----------------------------------------------------
function MentorDashboard({ stats, reports, leaves, wfhRequests, token, API_URL, onRefresh, setActiveTab }) {
  const pendingLeaves = leaves.filter((leave) => leave.status === 'pending');
  const pendingWfh = wfhRequests.filter((request) => request.status === 'pending');
  const totalPending = pendingLeaves.length + pendingWfh.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl border border-white/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Mentor Workspace
          </span>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 mt-2">
            Mentoring Desk <Award className="w-7 h-7 text-yellow-300" />
          </h1>
          <p className="text-emerald-100 text-sm">Review, evaluate and guide interns allocated to your sprints.</p>
        </div>
      </div>

      {totalPending > 0 && (
        <div className="p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            Pending Intern Approvals ({totalPending})
          </h2>
          <PendingApprovalsList
            leaves={leaves}
            wfhRequests={wfhRequests}
            token={token}
            API_URL={API_URL}
            onRefresh={onRefresh}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Assigned Interns Performance Index
          </h2>
          <div className="h-64">
            {stats.internPerformance.some((intern) => intern.rating !== null) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.internPerformance.filter((intern) => intern.rating !== null)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="rating" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-slate-400">
                {stats.internPerformance.length > 0 ? 'Assigned interns are awaiting evaluation.' : 'No assigned interns found.'}
                <div className="flex flex-wrap justify-center gap-2">
                  {stats.internPerformance.map((intern) => (
                    <span key={intern.name} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">
                      {intern.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4 flex flex-col justify-between">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Quick Operations</h2>
          <div className="grid grid-cols-1 gap-2.5">
            <button onClick={() => setActiveTab('tasks')} className="p-3.5 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-2xl font-bold transition-all text-left flex items-center justify-between text-xs">
              Assign Sprint Deliverables
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab('reports')} className="p-3.5 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-2xl font-bold transition-all text-left flex items-center justify-between text-xs">
              Evaluate Daily Report logs
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab('timetracker')} className="p-3.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-2xl font-bold transition-all text-left flex items-center justify-between text-xs">
              Weekly Attendance review
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------
// 4. Intern Dashboard
// ----------------------------------------------------
function InternDashboard({ user, tasks, settings, token, API_URL }) {
  const [attendance, setAttendance] = useState(null);
  const [sessionTime, setSessionTime] = useState('00:00:00');
  const [quote, setQuote] = useState('');

  const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Opportunities don't happen, you create them.", author: "Chris Grosser" },
    { text: "Make each day your masterpiece.", author: "John Wooden" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" }
  ];

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
    let cancelled = false;

    async function loadAttendance() {
      try {
        const response = await fetch(`${API_URL}/attendance/today`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok && !cancelled) {
          const data = await response.json();
          setAttendance(data.attendance);
        }
      } catch (error) {
        console.error('Failed to load today attendance', error);
      }
    }

    loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [token, API_URL]);

  useEffect(() => {
    let timer;
    if (attendance?.checkIn && !attendance?.checkOut) {
      timer = setInterval(() => {
        const start = new Date(attendance.checkIn).getTime();
        const now = new Date().getTime();
        const diffMs = Math.max(0, now - start);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setSessionTime(
          `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setSessionTime('00:00:00');
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [attendance]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Intern Workspace
          </span>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 mt-2">
            Welcome, {user.name}! <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" />
          </h1>
          <p className="text-indigo-100 text-sm">Track your daily sprint performance and logged hours.</p>
        </div>
      </div>

      <div className="p-6 rounded-3xl glass-card border border-indigo-100/50 dark:border-slate-800/40 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Today's Attendance Status
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight font-mono">
              {attendance?.checkIn ? sessionTime : 'Not checked in'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {attendance?.checkIn ? `Checked in at ${new Date(attendance.checkIn).toLocaleTimeString()}` : 'Check in to start your session'}
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Mandatory Hours: <span className="font-extrabold text-slate-700 dark:text-slate-300">{settings?.mandatoryHours ?? 'Not configured'} hrs/day</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-3xl glass-card border border-slate-200/60 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Assigned Tasks Overview</h2>
          <div className="space-y-3">
            {tasks.length > 0 ? tasks.slice(0, 4).map((task) => (
              <div key={task._id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded font-bold uppercase">{task.priority}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{task.project}</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-indigo-600">{task.progress || 0}% done</span>
              </div>
            )) : <p className="text-sm text-slate-500 text-center py-4">No tasks assigned.</p>}
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-indigo-100/50 dark:border-slate-800/40 bg-indigo-50/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Today's Motivation</span>
          </div>
          <p className="text-sm italic text-slate-700 dark:text-slate-300 font-semibold leading-relaxed my-4">
            "{quote?.text}"
          </p>
          <div className="text-right text-[10px] font-bold text-slate-400">
            - {quote?.author}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, theme = "indigo", icon: Icon }) {
  return (
    <Card3DCanvas themeColor={theme} className="p-5 flex items-center justify-between">
      <div className="space-y-1 z-10">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
      </div>
      <div className="z-10">
        <Stat3DSphere theme={theme} size="w-12 h-12" icon={Icon} />
      </div>
    </Card3DCanvas>
  );
}
