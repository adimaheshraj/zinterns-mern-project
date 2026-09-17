import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Award,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Layers,
  MapPin,
  TrendingUp,
  Shield,
  Star,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function EmployeeProfileDrawer({ isOpen, employeeId, onClose }) {
  const { token, API_URL } = useApp();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!isOpen || !employeeId) return;

    async function fetchProfile() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/org/profile/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        } else {
          const data = await res.json().catch(() => ({}));
          setProfileData(null);
          setError(data.error || 'Unable to load employee profile.');
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setProfileData(null);
        setError('Unable to load employee profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [isOpen, employeeId, token, API_URL]);

  useEffect(() => {
    setActiveTab('Overview');
  }, [employeeId]);

  if (!isOpen) return null;

  const isIntern = profileData?.profile?.role?.toLowerCase() === 'intern';
  const tabs = [
    'Overview',
    'Profile',
    'Attendance',
    ...(isIntern ? ['Daily Reports'] : []),
    'Tasks',
    'Leave',
    'Files',
    ...(isIntern ? ['Performance'] : []),
    'Activity'
  ];

  const profile = profileData?.profile || {};
  const stats = profileData?.stats || {};

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-white/20"></div>
              <div className="space-y-2">
                <div className="w-48 h-5 bg-white/20 rounded"></div>
                <div className="w-32 h-4 bg-white/10 rounded"></div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{error}</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/50 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center border-2 border-indigo-400/50 shadow-lg">
                  {profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-white tracking-tight">{profile.name}</h2>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                    {profile.employeeId}
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-pink-500/30 border border-pink-400/30 text-pink-200">
                    {profile.role}
                  </span>
                </div>

                <p className="text-xs text-indigo-200 font-medium flex items-center gap-3 flex-wrap">
                  <span>{profile.designation || profile.role}</span>
                  <span>•</span>
                  <span>{profile.department}</span>
                  <span>•</span>
                  <span>{profile.team || 'General'}</span>
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> {profile.location || 'Headquarters'}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-emerald-400" /> {profile.workMode || 'Office'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar border-t border-white/10 pt-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-xs text-slate-400 font-semibold mt-3">Loading profile records...</p>
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase">Attendance %</p>
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.attendancePercentage || 100}%</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase">Tasks Completed</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.completedTasks} / {stats.totalTasks}</p>
                    </div>
                    {isIntern && (
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase">Daily Reports</p>
                        <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.submittedReports}</p>
                      </div>
                    )}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase">Leave Balance</p>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.leaveBalance} Days</p>
                    </div>
                  </div>

                  {/* Hierarchy & Leadership */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-500" /> Organizational Allocation
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {profile.role?.toLowerCase() === 'intern' && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Mentor</span>
                          <p className="font-extrabold text-slate-700 dark:text-slate-200">{profile.mentorName || profile.mentor || 'Not Assigned'}</p>
                        </div>
                      )}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Reporting Manager</span>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200">{profile.reportingManagerName || profile.reportingManager || 'Not Assigned'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Summary */}
                  {isIntern && profileData?.performance && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" /> Overall Performance Rating
                      </h3>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl font-bold">
                          <p className="text-[10px] uppercase text-slate-400">Mentor Rating</p>
                          <p className="text-xl font-black mt-1">⭐ {profileData.performance.mentorRating || 4.5} / 5</p>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold">
                          <p className="text-[10px] uppercase text-slate-400">Project Score</p>
                          <p className="text-xl font-black mt-1">{profileData.performance.projectScore || 85}%</p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold">
                          <p className="text-[10px] uppercase text-slate-400">Learning Index</p>
                          <p className="text-xl font-black mt-1">{profileData.performance.learningProgress || 80}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. PROFILE DETAILS TAB */}
              {activeTab === 'Profile' && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Full Profile Metadata</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div><span className="text-slate-400 block">Full Name:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.name}</span></div>
                    <div><span className="text-slate-400 block">Employee ID:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.employeeId}</span></div>
                    <div><span className="text-slate-400 block">Email Address:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.email}</span></div>
                    <div><span className="text-slate-400 block">Phone Number:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.phone || 'N/A'}</span></div>
                    <div><span className="text-slate-400 block">Role:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">{profile.role}</span></div>
                    <div><span className="text-slate-400 block">Designation:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.designation || profile.role}</span></div>
                    <div><span className="text-slate-400 block">Department:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.department}</span></div>
                    <div><span className="text-slate-400 block">Team:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.team || 'General'}</span></div>
                    <div><span className="text-slate-400 block">Joining Date:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}</span></div>
                    {isIntern && (
                      <div><span className="text-slate-400 block">Internship Duration:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.durationMonths || 6} Months</span></div>
                    )}
                    <div><span className="text-slate-400 block">Work Mode:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.workMode || 'Office'}</span></div>
                    <div><span className="text-slate-400 block">Office Location:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{profile.location || 'Headquarters'}</span></div>
                  </div>
                </div>
              )}

              {/* 3. ATTENDANCE TAB */}
              {activeTab === 'Attendance' && (
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Attendance Logs</h3>
                  {profileData.attendance?.length > 0 ? (
                    <div className="divide-y border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
                      {profileData.attendance.map((rec) => (
                        <div key={rec._id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">
                              {rec.checkIn ? new Date(rec.checkIn).toLocaleDateString() : 'Date N/A'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Check-In: {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : 'N/A'} | Distance: {rec.distance || 0}m
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            rec.status === 'Present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            rec.status === 'WFH' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' :
                            rec.status === 'Late' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                            'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">No attendance records found.</p>
                  )}
                </div>
              )}

              {/* 4. DAILY REPORTS TAB */}
              {activeTab === 'Daily Reports' && (
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Submitted Daily Reports</h3>
                  {profileData.dailyReports?.length > 0 ? (
                    profileData.dailyReports.map((rep) => (
                      <div key={rep._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{rep.date}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded font-bold">
                            ⭐ Rating: {rep.rating || 'Pending'} / 5
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300"><strong>Work Done:</strong> {rep.completedWork || rep.tasksToday}</p>
                        {rep.feedback && <p className="text-indigo-600 dark:text-indigo-400 text-[11px] italic">Mentor Feedback: "{rep.feedback}"</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-8">No daily reports submitted yet.</p>
                  )}
                </div>
              )}

              {/* 5. TASKS TAB */}
              {activeTab === 'Tasks' && (
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Assigned Sprint Tasks</h3>
                  {profileData.tasks?.length > 0 ? (
                    profileData.tasks.map((task) => (
                      <div key={task._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{task.title}</p>
                          <p className="text-[10px] text-slate-400">{task.project} • Priority: {task.priority}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-8">No tasks assigned.</p>
                  )}
                </div>
              )}

              {/* 6. LEAVE TAB */}
              {activeTab === 'Leave' && (
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Leave History</h3>
                  {profileData.leaves?.length > 0 ? (
                    profileData.leaves.map((l) => (
                      <div key={l._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{l.leaveType} Leave</p>
                          <p className="text-[10px] text-slate-400">Reason: {l.reason}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          l.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-8">No leave requests found.</p>
                  )}
                </div>
              )}

              {/* 7. FILES TAB */}
              {activeTab === 'Files' && (
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Uploaded Documentation</h3>
                  {profileData.files?.length > 0 ? (
                    profileData.files.map((f) => (
                      <div key={f._id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{f.name}</span>
                        <a href={f.url} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-8">No files uploaded.</p>
                  )}
                </div>
              )}

              {/* 8. PERFORMANCE TAB */}
              {activeTab === 'Performance' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Performance Scorecard Breakdown</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between font-bold mb-1"><span>Attendance Score</span><span>{profileData.performance?.attendanceScore || 100}%</span></div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${profileData.performance?.attendanceScore || 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-bold mb-1"><span>Project Delivery Score</span><span>{profileData.performance?.projectScore || 85}%</span></div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${profileData.performance?.projectScore || 85}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-bold mb-1"><span>Learning Progress</span><span>{profileData.performance?.learningProgress || 80}%</span></div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${profileData.performance?.learningProgress || 80}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. ACTIVITY TIMELINE TAB */}
              {activeTab === 'Activity' && (
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Assignment & Activity History</h3>
                  {profileData.assignmentHistory?.length > 0 ? (
                    <div className="space-y-3 relative pl-4 border-l-2 border-indigo-500/30">
                      {profileData.assignmentHistory.map((hist) => (
                        <div key={hist._id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <p className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px]">{hist.targetType} Change</p>
                          <p className="text-slate-500">{hist.previousValue} ➔ <strong className="text-indigo-600 dark:text-indigo-400">{hist.newValue}</strong></p>
                          <span className="text-[9px] text-slate-400">Assigned by {hist.assignedByName} on {new Date(hist.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">No assignment history logged.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
