import React, { useEffect, useRef, useState } from 'react';
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
import ThreeButton from './components/3d/ThreeButton';

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

const navigationItems = [
  { id: 'home', label: 'Dashboard', mobileLabel: 'Home', icon: Home },
  { id: 'timetracker', label: 'Time Tracker', mobileLabel: 'Time', icon: Clock },
  { id: 'tasks', label: 'Tasks Board', mobileLabel: 'Tasks', icon: ListTodo },
  { id: 'leaves', label: 'Leave Tracker', mobileLabel: 'Leave', icon: Calendar },
  { id: 'reports', label: 'Daily Reports', mobileLabel: 'Reports', icon: FileSpreadsheet },
  { id: 'teamspace', label: 'Team Space', mobileLabel: 'Team', icon: MessageSquare },
  { id: 'directory', label: 'Directory', mobileLabel: 'Directory', icon: Users },
  { id: 'calendar', label: 'Calendar Grid', mobileLabel: 'Calendar', icon: Calendar },
  { id: 'files', label: 'File Cabinet', mobileLabel: 'Files', icon: Folder },
  { id: 'settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings }
];

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
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'directory') setActiveSpace('organization');
    else if (tab === 'teamspace') setActiveSpace('team_space');
    else setActiveSpace('my_space');
  };

  return (
    <div className="h-dvh min-h-0 flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans relative">
      {/* Three.js Dynamic 3D Canvas Background */}
      <Background3D />

      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Container */}
      <div className="min-w-0 min-h-0 flex-1 flex flex-col overflow-hidden">
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
        <div className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/40 px-3 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-x-auto z-20 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1 whitespace-nowrap">
                <Building className="w-3.5 h-3.5 text-indigo-500" /> Org Module:
              </span>
              {[
                { key: 'employee_list', label: 'Employee List' },
                { key: 'employee_tree', label: 'Employee Tree' },
                { key: 'department_tree', label: 'Department Tree' },
                ...(isHR ? [{ key: 'assignments', label: 'Assignment Management' }] : []),
              ].map(({ key, label }) => (
                <ThreeButton
                  key={key}
                  variant={orgSubTab === key ? 'primary' : 'ghost'}
                  onClick={() => setOrgSubTab(key)}
                  className="!px-3 !py-1.5 !rounded-xl whitespace-nowrap"
                  style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '12px', fontWeight: 700 }}
                >
                  {label}
                </ThreeButton>
              ))}
            </div>

            {isHR && (
              <ThreeButton
                variant="primary"
                onClick={() => setIsAddEmployeeOpen(true)}
                className="!px-3.5 !py-1.5 whitespace-nowrap self-start sm:self-auto"
                style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '12px', fontWeight: 800 }}
              >
                <UserPlus className="w-3.5 h-3.5" /> + Add Employee
              </ThreeButton>
            )}
          </div>
        )}

        {/* Dynamic Content Wrapper */}
        <main className="min-w-0 min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="max-w-6xl min-w-0 min-h-full mx-auto">
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

      <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} />

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

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/60 backdrop-blur-md">
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
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <ThreeButton
              key={item.id}
              variant={isActive ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(item.id)}
              className={`w-full justify-start gap-3.5 !uppercase-none !tracking-normal !text-xs !font-bold ${isActive ? '' : ''}`}
              style={{ textTransform: 'none', letterSpacing: 'normal', paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </ThreeButton>
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
        <ThreeButton
          variant="icon"
          onClick={logout}
          title="Sign Out"
          aria-label="Sign Out"
          className="!rounded-xl"
        >
          <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-500 transition-colors" />
        </ThreeButton>
      </div>
    </aside>
  );
}

function MobileNav({ activeTab, setActiveTab }) {
  return (
    <nav
      aria-label="Main navigation"
      className="md:hidden shrink-0 grid grid-cols-5 gap-1 border-t border-slate-200/70 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/95 px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur-md z-30"
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <ThreeButton
            key={item.id}
            variant={isActive ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className="min-w-0 min-h-10 flex-col !gap-0.5 !rounded-xl !px-0.5 !py-1.5 flex-1"
            style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '9px', fontWeight: 700, lineHeight: 1.2 }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="w-full truncate text-center" style={{ fontSize: 9 }}>{item.mobileLabel}</span>
          </ThreeButton>
        );
      })}
    </nav>
  );
}

// ----------------------------------------------------
// Header Component
// ----------------------------------------------------
function Header({ activeSpace, setActiveSpace, onOpenWFH, onOpenAddEmployee }) {
  const { user, token, API_URL, theme, toggleTheme, logout, notifications, setNotifications } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationToast, setNotificationToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    const handleRealtimeNotification = (event) => {
      setNotificationToast(event.detail);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setNotificationToast(null), 6500);
    };
    window.addEventListener('zinterns:notification', handleRealtimeNotification);
    return () => {
      window.removeEventListener('zinterns:notification', handleRealtimeNotification);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

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
    <header className="min-h-16 h-auto border-b border-slate-200/60 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md px-3 py-2 flex flex-col gap-2 flex-shrink-0 relative z-30 md:h-16 md:px-6 md:py-0 md:flex-row md:items-center md:justify-between">
      {/* Top Space Switcher Tabs */}
      <div className="min-w-0 flex items-center justify-center gap-3">
        <div className="max-w-full flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          {[
            { key: 'my_space', label: 'My Space' },
            { key: 'team_space', label: 'Team Space' },
            { key: 'organization', label: 'Organization' },
          ].map(({ key, label }) => (
            <ThreeButton
              key={key}
              variant={activeSpace === key ? 'primary' : 'ghost'}
              onClick={() => setActiveSpace(key)}
              className="!px-2.5 sm:!px-3.5 !py-1.5 !rounded-xl whitespace-nowrap"
              style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '11px', fontWeight: 700 }}
            >
              {label}
            </ThreeButton>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-bold hidden lg:inline">ID: {user.employeeId}</span>
      </div>

      <div className="flex items-center justify-end gap-1.5 sm:gap-3">
        {/* WFH Pass Action Button */}
        <ThreeButton
          variant="secondary"
          onClick={onOpenWFH}
          className="!px-3 !py-1.5"
          style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '12px', fontWeight: 700 }}
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">WFH Pass</span>
        </ThreeButton>

        {isHR && (
          <ThreeButton
            variant="gradient"
            onClick={onOpenAddEmployee}
            className="!px-3.5 !py-1.5"
            style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '12px', fontWeight: 800 }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Employee</span>
          </ThreeButton>
        )}

        {/* Dark/Light mode Toggle */}
        <ThreeButton
          variant="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </ThreeButton>

        <ThreeButton
          variant="icon"
          onClick={logout}
          className="md:hidden"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </ThreeButton>

        {/* Notifications Panel */}
        <div className="relative">
          <ThreeButton
            variant="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-indigo-600 px-1 text-[9px] font-black leading-none text-white pointer-events-none dark:border-slate-900">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </ThreeButton>

          <AnimatePresence>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-1.5rem)] max-w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <div>
                    <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">Notifications</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">Live team and account updates</span>
                  </div>
                  {notifications.length > 0 && (
                    <ThreeButton
                      variant="ghost"
                      onClick={() => setNotifications([])}
                      style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '10px', fontWeight: 700, padding: '2px 8px' }}
                      className="!py-0.5 !px-2 !rounded-lg text-indigo-500"
                    >
                      Clear All
                    </ThreeButton>
                  )}
                </div>

                <div className="max-h-[min(70vh,26rem)] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="flex gap-3 px-4 py-3.5">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                          <Bell className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{n.title}</p>
                            {n.timestamp && (
                              <time className="shrink-0 text-[10px] text-slate-400" dateTime={new Date(n.timestamp).toISOString()}>
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </time>
                            )}
                          </div>
                          <p className="break-words text-xs leading-relaxed text-slate-500 dark:text-slate-400">{n.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <Bell className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />
                      <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">You’re all caught up</p>
                      <p className="mt-1 text-[11px] text-slate-400">New team updates will appear here instantly.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="fixed right-4 top-20 z-[100] flex w-[calc(100vw-2rem)] max-w-sm gap-3 rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-2xl shadow-indigo-950/15 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
            role="status"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-200">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{notificationToast.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-300">{notificationToast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotificationToast(null)}
              className="h-7 w-7 shrink-0 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ----------------------------------------------------
// AI Chatbot Floating panel
// ----------------------------------------------------
function ChatMessageText({ text }) {
  const renderInline = (line) => line.split(/(\*\*[^*]+\*\*)/g).map((part, index) => (
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part
  ));

  return (
    <div className="space-y-1 whitespace-pre-wrap break-words">
      {text.split('\n').map((line, index) => {
        const listItem = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
        if (listItem) {
          return (
            <div key={index} className="flex items-start gap-1.5">
              <span aria-hidden="true">•</span>
              <span>{renderInline(listItem[1])}</span>
            </div>
          );
        }
        return <div key={index} className={line ? '' : 'h-2'}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

function AIChatBot() {
  const { token, API_URL } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I’m your ZInterns Guide. Ask me how to use a workspace feature or get help with attendance, WFH, leave requests, tasks, reports, or your team.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [typing, setTyping] = useState(false);
  const conversationRef = useRef(null);

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, typing, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userText = chatInput.trim();
    if (!userText || typing) return;

    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setTyping(true);

    try {
      const history = messages
        .filter((item) => ['user', 'assistant'].includes(item.role))
        .slice(-10)
        .map((item) => ({ role: item.role, content: item.text }));
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText, history })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'The guide could not respond. Please try again.');
      }
      if (typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('The guide returned an empty response. Please try again.');
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'error', text: error.message || 'Unable to reach the guide. Check your connection and try again.' }
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* Floating AI button */}
      <ThreeButton
        variant="gradient"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-28 right-4 md:bottom-6 md:right-6 z-40 !rounded-full !px-0 !py-0"
        style={{ width: 56, height: 56, textTransform: 'none' }}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </ThreeButton>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 left-3 right-3 z-50 w-auto h-[min(560px,calc(100dvh-9rem))] bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden md:left-auto md:right-6 md:bottom-24 md:w-[400px]"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/40 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <div>
                <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  ZInterns Guide
                </span>
                <span className="block text-[10px] text-indigo-100 mt-1 ml-5">Workspace help and answers</span>
              </div>
              <ThreeButton
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="!p-1 !rounded-lg text-white !bg-white/10 hover:!bg-white/20"
                style={{ textTransform: 'none', fontSize: '14px', fontWeight: 700, minWidth: 28, minHeight: 28 }}
                aria-label="Close AI guide"
              >
                ✕
              </ThreeButton>
            </div>

            {/* Conversation list */}
            <div ref={conversationRef} aria-live="polite" className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto text-sm">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : m.role === 'error'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/40'
                    }`}
                  >
                    <ChatMessageText text={m.text} />
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center gap-1.5 text-xs">
                    <span className="mr-1">Thinking</span>
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
                aria-label="Ask the ZInterns Guide"
                maxLength={2000}
                disabled={typing}
                required
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                className="min-w-0 flex-1 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
              <ThreeButton
                type="submit"
                variant="primary"
                disabled={typing || !chatInput.trim()}
                className="!px-4 !py-2.5 !rounded-xl"
                style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}
              >
                Send
              </ThreeButton>
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

            <ThreeButton
              type="submit"
              variant="gradient"
              disabled={loading}
              className="w-full !py-4 !rounded-2xl"
              style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '12px', fontWeight: 800 }}
            >
              {loading ? 'Updating Password...' : 'Save New Password & Open Dashboard'}
            </ThreeButton>

            <div className="text-center pt-2">
              <ThreeButton
                type="button"
                variant="ghost"
                onClick={logout}
                style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '11px', fontWeight: 700 }}
                className="text-slate-400 hover:text-rose-500 underline"
              >
                Sign out &amp; cancel
              </ThreeButton>
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
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get('resetToken') || '');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetFeedback, setResetFeedback] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [loginNotice, setLoginNotice] = useState('');
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
    setLoginNotice('');
    setLoadingLogin(true);

    try {
      await login(username, password);
    } catch (e) {
      setErrorMsg(e.message || 'Login details are incorrect.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetFeedback(null);
    setResetLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to send a password reset link.');
      }
      setResetFeedback({ type: 'success', text: data.message });
    } catch (error) {
      setResetFeedback({ type: 'error', text: error.message || 'Unable to send a password reset link.' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetFeedback(null);
    if (newPassword.length < 8) {
      setResetFeedback({ type: 'error', text: 'Your password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetFeedback({ type: 'error', text: 'The passwords do not match.' });
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to reset the password.');
      }

      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('resetToken');
      window.history.replaceState({}, '', currentUrl);
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');
      setForgotPassword(false);
      setLoginNotice(data.message);
    } catch (error) {
      setResetFeedback({ type: 'error', text: error.message || 'Unable to reset the password.' });
    } finally {
      setResetLoading(false);
    }
  };

  const returnToSignIn = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('resetToken');
    window.history.replaceState({}, '', currentUrl);
    setResetToken('');
    setResetFeedback(null);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden font-sans"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 15% 20%, rgba(79, 70, 229, 0.24), transparent 38%), radial-gradient(ellipse at 85% 80%, rgba(168, 85, 247, 0.2), transparent 36%), linear-gradient(135deg, #080b1c, #111827 55%, #090b18)'
      }}
    >
      <Background3D />

      <div className="w-full max-w-5xl bg-slate-900/55 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl shadow-indigo-950/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10 my-6">
        
        {/* Left Side - Enterprise Workspace Preview & Quick Logins */}
        <div className="lg:col-span-7 p-8 sm:p-10 bg-gradient-to-br from-indigo-950/65 via-slate-900/55 to-purple-950/65 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 space-y-8">
          <div>
            {/* Header branding */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-xl border border-white/20">
                Z
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">ZInterns</h1>
                <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest mt-1 block">
                  Team workspace
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-200 font-medium leading-relaxed mt-6 max-w-lg">
              Bring your team’s day together in one place. Track attendance, organize tasks, share updates, and manage time off with a clear view of what needs attention.
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
        <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-slate-950/20">
          <div className="space-y-6">
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {resetToken ? 'Choose a new password' : forgotPassword ? 'Forgot your password?' : 'Welcome back'}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {resetToken
                  ? 'Set a new password for your account.'
                  : forgotPassword
                    ? 'Enter the email address registered to your account.'
                    : 'Sign in to continue to your team workspace.'}
              </p>
            </div>

            {resetToken ? (
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full p-3.5 border border-slate-800 rounded-xl bg-slate-950 text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Confirm new password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full p-3.5 border border-slate-800 rounded-xl bg-slate-950 text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                  />
                </div>
                <ThreeButton
                  type="submit"
                  variant="gradient"
                  disabled={resetLoading}
                  className="w-full !py-4 !rounded-2xl"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px', fontWeight: 800 }}
                >
                  {resetLoading ? 'Updating password...' : 'Set new password'}
                </ThreeButton>
                <button
                  type="button"
                  onClick={returnToSignIn}
                  className="w-full text-center text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  Back to sign in
                </button>
                {resetFeedback && (
                  <div className={`p-3 rounded-xl font-bold text-center text-xs ${resetFeedback.type === 'error' ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'}`}>
                    {resetFeedback.text}
                  </div>
                )}
              </form>
            ) : forgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Account email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email address"
                    className="w-full p-3.5 border border-slate-800 rounded-xl bg-slate-950 text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                  />
                </div>
                <ThreeButton
                  type="submit"
                  variant="gradient"
                  disabled={resetLoading}
                  className="w-full !py-4 !rounded-2xl"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px', fontWeight: 800 }}
                >
                  {resetLoading ? 'Sending reset link...' : 'Email password reset link'}
                </ThreeButton>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(false);
                    setResetFeedback(null);
                  }}
                  className="w-full text-center text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  Back to sign in
                </button>
                {resetFeedback && (
                  <div className={`p-3 rounded-xl font-bold text-center text-xs ${resetFeedback.type === 'error' ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'}`}>
                    {resetFeedback.text}
                  </div>
                )}
              </form>
            ) : (
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
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(username.includes('@') ? username : '');
                    setForgotPassword(true);
                    setResetFeedback(null);
                    setErrorMsg(null);
                  }}
                  className="block ml-auto text-[11px] font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  Forgot password?
                </button>
              </div>

              <ThreeButton
                type="submit"
                variant="gradient"
                disabled={loadingLogin}
                className="w-full !py-4 !rounded-2xl"
                style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px', fontWeight: 800 }}
              >
                {loadingLogin ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Sign in'
                )}
              </ThreeButton>

              {loginNotice && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold text-center text-xs">
                  {loginNotice}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl font-bold text-center text-xs animate-pulse">
                  {errorMsg}
                </div>
              )}
            </form>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/35 border border-indigo-400/25 text-[11px] text-indigo-200 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <span>✦</span> Need an account?
            </div>
            <p className="text-indigo-100/75 leading-normal">
              Contact your team administrator to get access to the workspace.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
