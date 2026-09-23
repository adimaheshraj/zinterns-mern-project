import React, { useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import { io } from 'socket.io-client';
import {
  Home,
  Clock,
  ListTodo,
  Calendar,
  FileSpreadsheet,
  MessageSquare,
  Users,
  Folder,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  Bot,
  Layers,
  Network,
  UserPlus,
  RefreshCw,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Background3D from './components/3d/Background3D';
import Hero3DCanvas from './components/3d/Hero3DCanvas';

// Import sub-pages
import Dashboard from './pages/Dashboard';
import TimeTracker from './pages/TimeTracker';
import Tasks from './pages/Tasks';
import Leaves from './pages/Leaves';
import Reports from './pages/Reports';
import TeamSpace from './pages/TeamSpace';
import DirectoryPage from './pages/Directory';
import CalendarView from './pages/CalendarView';
import Files from './pages/Files';
import SettingsView from './pages/SettingsView';

// Import Org components
import OrgTree from './components/org/OrgTree';
import DepartmentTree from './components/org/DepartmentTree';
import AssignmentManagement from './components/org/AssignmentManagement';
import AddEmployeeModal from './components/org/AddEmployeeModal';
import EmployeeProfileDrawer from './components/org/EmployeeProfileDrawer';
import TeamDashboardModal from './components/org/TeamDashboardModal';
import WFHRequestModal from './components/org/WFHRequestModal';

export default function App() {
  const { user, loading, theme, toggleTheme, logout, activeTab, setActiveTab } = useApp();

  const [activeSpace, setActiveSpace] = useState('my_space'); // 'my_space' | 'team_space' | 'organization'
  const [orgSubTab, setOrgSubTab] = useState('employee_list'); // 'employee_list' | 'employee_tree' | 'department_tree' | 'assignments'

  // Modals & Drawers
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isWFHModalOpen, setIsWFHModalOpen] = useState(false);
  const [selectedProfileEmpId, setSelectedProfileEmpId] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400 mt-4 animate-pulse">Initializing ZInterns Enterprise Platform...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.mustChangePassword) {
    return <ForcePasswordChangeScreen />;
  }

  const isHR = ['Super Admin', 'HR'].includes(user.role);

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans relative">
      {/* Three.js Dynamic 3D Canvas Background */}
      <Background3D />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'directory') setActiveSpace('organization');
          else if (tab === 'teamspace') setActiveSpace('team_space');
          else setActiveSpace('my_space');
        }}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header bar */}
        <Header
          activeSpace={activeSpace}
          setActiveSpace={(space) => {
            setActiveSpace(space);
            if (space === 'organization') setActiveTab('directory');
            else if (space === 'team_space') setActiveTab('teamspace');
            else setActiveTab('home');
          }}
          onOpenWFH={() => setIsWFHModalOpen(true)}
          onOpenAddEmployee={() => setIsAddEmployeeOpen(true)}
        />

        {/* Organization Navigation Bar (shown when in Organization space or Directory tab) */}
        {(activeSpace === 'organization' || activeTab === 'directory') && (
          <div className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/40 px-6 py-2 flex items-center justify-between overflow-x-auto z-20 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-indigo-500" /> Org Module:
              </span>
              <button
                onClick={() => setOrgSubTab('employee_list')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orgSubTab === 'employee_list'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                Employee List
              </button>

              <button
                onClick={() => setOrgSubTab('employee_tree')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orgSubTab === 'employee_tree'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                Employee Tree
              </button>

              <button
                onClick={() => setOrgSubTab('department_tree')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orgSubTab === 'department_tree'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                Department Tree
              </button>

              {isHR && (
                <button
                  onClick={() => setOrgSubTab('assignments')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    orgSubTab === 'assignments'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                >
                  Assignment Management
                </button>
              )}
            </div>

            {isHR && (
              <button
                onClick={() => setIsAddEmployeeOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-xl text-xs font-extrabold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> + Add Employee
              </button>
            )}
          </div>
        )}

        {/* Dynamic Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="max-w-6xl mx-auto h-full">
            {activeTab === 'home' && <Dashboard />}
            {activeTab === 'timetracker' && <TimeTracker />}
            {activeTab === 'tasks' && <Tasks />}
            {activeTab === 'leaves' && <Leaves />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'teamspace' && <TeamSpace />}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'files' && <Files />}
            {activeTab === 'settings' && <SettingsView />}

            {/* Directory / Organization Views */}
            {activeTab === 'directory' && (
              <>
                {orgSubTab === 'employee_list' && (
                  <DirectoryPage />
                )}
                {orgSubTab === 'employee_tree' && (
                  <OrgTree onSelectUser={(empId) => setSelectedProfileEmpId(empId)} />
                )}
                {orgSubTab === 'department_tree' && (
                  <DepartmentTree onSelectTeam={(team) => setSelectedTeam(team)} />
                )}
                {orgSubTab === 'assignments' && (
                  <AssignmentManagement />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
      />

      <WFHRequestModal
        isOpen={isWFHModalOpen}
        onClose={() => setIsWFHModalOpen(false)}
      />

      <EmployeeProfileDrawer
        isOpen={!!selectedProfileEmpId}
        employeeId={selectedProfileEmpId}
        onClose={() => setSelectedProfileEmpId(null)}
      />

      <TeamDashboardModal
        isOpen={!!selectedTeam}
        team={selectedTeam}
        onClose={() => setSelectedTeam(null)}
        onSelectUser={(empId) => setSelectedProfileEmpId(empId)}
      />

      {/* AI Floating Chat Assistant */}
      <AIChatBot />
    </div>
  );
}

// ----------------------------------------------------
// Sidebar Component
// ----------------------------------------------------
function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useApp();

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'timetracker', label: 'Time Tracker', icon: Clock },
    { id: 'tasks', label: 'Tasks Board', icon: ListTodo },
    { id: 'leaves', label: 'Leave Tracker', icon: Calendar },
    { id: 'reports', label: 'Daily Reports', icon: FileSpreadsheet },
    { id: 'teamspace', label: 'Team Space', icon: MessageSquare },
    { id: 'directory', label: 'Directory', icon: Users },
    { id: 'calendar', label: 'Calendar Grid', icon: Calendar },
    { id: 'files', label: 'File Cabinet', icon: Folder },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/60 backdrop-blur-md">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20">
          Z
        </div>
        <div>
          <span className="font-black text-lg text-slate-800 dark:text-slate-100 tracking-tight block leading-none">
            ZInterns
          </span>
          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1 block">
            Enterprise Management
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Profile summary footer */}
      <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/40 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/10">
        <div className="flex items-center gap-3 overflow-hidden">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100 dark:border-slate-800"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-indigo-100 dark:border-slate-800 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xs">
              {user.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="font-extrabold text-xs truncate leading-none text-slate-800 dark:text-slate-200">
              {user.name}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase">
              {user.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </aside>
  );
}

// ----------------------------------------------------
// Header Component
// ----------------------------------------------------
function Header({ activeSpace, setActiveSpace, onOpenWFH, onOpenAddEmployee }) {
  const { user, token, API_URL, theme, toggleTheme, notifications, setNotifications } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    async function fetchUpcomingEvents() {
      try {
        const res = await fetch(`${API_URL}/holidays`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const holidays = await res.json();
          const todayStr = new Date().toISOString().split('T')[0];
          const upcoming = holidays.filter(h => h.date >= todayStr).slice(0, 3);
          if (upcoming.length > 0) {
            const holidayNotifs = upcoming.map(h => ({
              id: `holiday-${h._id || h.name}-${h.date}`,
              title: `📅 Upcoming Holiday: ${h.name}`,
              message: `${h.type || 'Government'} Holiday scheduled on ${h.date}.`
            }));
            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const fresh = holidayNotifs.filter(n => !existingIds.has(n.id));
              return [...fresh, ...prev];
            });
          }
        }
      } catch (e) {
        console.error('Error fetching upcoming holidays for notifications', e);
      }
    }
    fetchUpcomingEvents();
  }, [API_URL, token, setNotifications]);

  const isHR = ['Super Admin', 'HR'].includes(user.role);

  return (
    <header className="h-16 border-b border-slate-200/60 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0 relative z-30">
      {/* Top Space Switcher Tabs */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setActiveSpace('my_space')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSpace === 'my_space'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            My Space
          </button>
          <button
            onClick={() => setActiveSpace('team_space')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSpace === 'team_space'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Team Space
          </button>
          <button
            onClick={() => setActiveSpace('organization')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSpace === 'organization'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Organization
          </button>
        </div>

        <span className="text-xs text-slate-400 font-bold hidden lg:inline">ID: {user.employeeId}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* WFH Pass Action Button */}
        <button
          onClick={onOpenWFH}
          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" /> WFH Pass
        </button>

        {isHR && (
          <button
            onClick={onOpenAddEmployee}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-extrabold text-xs shadow hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Employee
          </button>
        )}

        {/* Dark/Light mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Panel */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                  <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">Latest Alerts</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-indigo-500 font-bold hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="divide-y dark:divide-slate-900">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="py-3 space-y-1 text-xs">
                        <p className="font-bold text-slate-700 dark:text-slate-300">{n.title}</p>
                        <p className="text-slate-400 leading-normal">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No recent updates.</p>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

// ----------------------------------------------------
// AI Chatbot Floating panel
// ----------------------------------------------------
function AIChatBot() {
  const { token, API_URL } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your ZInterns Enterprise AI Assistant. How can I help you with org structure, check-ins, tasks, or WFH passes?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [typing, setTyping] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setTyping(true);

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl hover:opacity-90 active:scale-95 transition-transform"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[400px] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/40 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                ZInterns AI Guide
              </span>
              <button onClick={() => setIsOpen(false)} className="font-bold">
                ✕
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/40'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200/60 dark:border-slate-800/40 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about geofence, leaves, rules..."
                className="flex-1 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-xs outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ----------------------------------------------------
// Login Component
// ----------------------------------------------------
// ----------------------------------------------------
// 1. Mandatory First-Time Password Reset Interceptor
// ----------------------------------------------------
function ForcePasswordChangeScreen() {
  const { user, updatePassword, logout } = useApp();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword === oldPassword) {
      setErrorMsg('New password must be different from temporary password.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(oldPassword, newPassword);
      setSuccessMsg('🟢 Password updated successfully! Accessing your dashboard...');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden font-sans">
      <Background3D />
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl p-8 space-y-6 z-10 relative">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-lg border border-white/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            First-Time Security Setup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-sm mx-auto">
            Welcome, <span className="text-indigo-600 dark:text-indigo-400 font-bold">{user?.name}</span>! Your account was initialized with temporary credentials. Please set a new secure password to access your dashboard.
          </p>
        </div>

        {successMsg ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-center font-bold text-xs rounded-2xl animate-pulse">
            {successMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold text-center animate-pulse">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Current Temporary Password *
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter password from welcome email..."
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters..."
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password..."
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-xl transition-all uppercase tracking-wider text-xs"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Open Dashboard'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={logout}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-500 underline transition-colors"
              >
                Sign out & cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. Enhanced Enterprise Login Portal
// ----------------------------------------------------
function LoginPage() {
  const { login, API_URL } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [telemetry, setTelemetry] = useState({ allocatedUsers: 0, departmentCount: 0, radiusMeters: 0, socketStatus: 'Connecting' });

  useEffect(() => {
    let socket;
    const loadTelemetry = async () => {
      try {
        const res = await fetch(`${API_URL}/public/telemetry`);
        if (res.ok) {
          const data = await res.json();
          setTelemetry(current => ({ ...current, ...data }));
        }
      } catch (error) {
        console.error('Failed to load public telemetry', error);
      }
    };

    loadTelemetry();
    socket = io(window.location.origin, { timeout: 3000, reconnection: false });
    socket.on('connect', () => setTelemetry(current => ({ ...current, socketStatus: 'Active' })));
    socket.on('connect_error', () => setTelemetry(current => ({ ...current, socketStatus: 'Offline' })));

    return () => socket?.disconnect();
  }, [API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setErrorMsg(null);
    setLoadingLogin(true);

    try {
      await login(username, password);
    } catch (e) {
      setErrorMsg(e.message || 'Login details are incorrect.');
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden font-sans">
      <Background3D />

      <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10 my-6">
        
        {/* Left Side - Enterprise Workspace Preview & Quick Logins */}
        <div className="lg:col-span-7 p-8 sm:p-10 bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-purple-950/90 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 space-y-8">
          <div>
            {/* Header branding */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-xl border border-white/20">
                Z
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">ZInterns</h1>
                <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest mt-1 block">
                  Enterprise Management Platform 2.0
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed mt-6 max-w-lg">
              Next-generation organization platform featuring interactive 3D Org Hierarchy trees, backend geofenced attendance validation, WFH pass approvals, and real-time email credentials dispatch.
            </p>

            {/* Platform Metrics Telemetry Cards */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider block">Allocated Users</span>
                <span className="text-xl font-black text-white mt-1 block">{telemetry.allocatedUsers}</span>
                <span className="text-[9px] text-slate-400 font-semibold">{telemetry.departmentCount} Smartbridge Depts</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider block">GPS Geofence</span>
                <span className="text-xl font-black text-white mt-1 block">{telemetry.radiusMeters}m</span>
                <span className="text-[9px] text-slate-400 font-semibold">GPS Radius</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-[9px] font-extrabold text-pink-400 uppercase tracking-wider block">Live Socket.IO</span>
                <span className="text-xl font-black text-white mt-1 block">{telemetry.socketStatus}</span>
                <span className="text-[9px] text-slate-400 font-semibold">Real-time Telemetry</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side - Secure Sign In Desk */}
        <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-slate-900/60">
          <div className="space-y-6">
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Portal Mahesh Raj Sign In</h2>
              <p className="text-xs text-slate-400 font-medium">Enter your credentials to access your dashboard desk.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                  Username / Email
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username or email address..."
                  className="w-full p-3.5 border border-slate-800 rounded-xl bg-slate-950 text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3.5 border border-slate-800 rounded-xl bg-slate-950 text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loadingLogin}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl shadow-xl transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                {loadingLogin ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Sign In To Desk'
                )}
              </button>

              {errorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl font-bold text-center text-xs animate-pulse">
                  {errorMsg}
                </div>
              )}
            </form>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <span>✉️</span> New Employee Account?
            </div>
            <p className="text-indigo-300/80 leading-normal">
              Your login credentials are delivered directly to your email. First-time login will prompt password customization.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
