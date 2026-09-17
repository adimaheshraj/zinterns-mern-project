import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Clock, ShieldCheck, Search, Home, Building, ExternalLink, Users, Calendar, Filter } from 'lucide-react';
import Card3DCanvas from '../components/3d/Card3DCanvas';
import Stat3DSphere from '../components/3d/Stat3DSphere';

export default function TimeTracker() {
  const { user, token, API_URL } = useApp();
  const isSuperAdmin = user?.role === 'Super Admin';
  const isManagement = ['Super Admin', 'HR', 'RM'].includes(user?.role);

  const [attendance, setAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workMode, setWorkMode] = useState('Office'); // 'Office' or 'WFH'
  const [statusMessage, setStatusMessage] = useState(null);
  const [timerStr, setTimerStr] = useState('00:00:00');

  // Super Admin / Management Tracking filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, Office, WFH
  const [filterDept, setFilterDept] = useState('ALL');

  // Database-driven settings
  const [officeLat, setOfficeLat] = useState(12.9716);
  const [officeLng, setOfficeLng] = useState(77.5946);
  const [radiusMeters, setRadiusMeters] = useState(100);

  // GPS Coordinates state
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('locating');

  useEffect(() => {
    requestCurrentLocation();
  }, []);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return Promise.reject(new Error('Geolocation is not supported by this browser.'));
    }

    setGpsStatus('locating');
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setCurrentCoords(coords);
          setGpsStatus('ready');
          resolve(coords);
        },
        (error) => {
          setGpsStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const activeCoords = currentCoords || [officeLat, officeLng];

  // Fetch status, settings, and employee history tracks
  const loadTrackerData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Today's Punch status for logged in user (if not Super Admin)
      if (!isSuperAdmin) {
        const res = await fetch(`${API_URL}/attendance/today`, { headers });
        if (res.ok) {
          const data = await res.json();
          setAttendance(data.attendance);
        }
      }

      // 2. Fetch Settings
      const setRes = await fetch(`${API_URL}/auth/settings`, { headers });
      if (setRes.ok) {
        const setData = await setRes.json();
        setOfficeLat(setData.officeLat || 12.9716);
        setOfficeLng(setData.officeLng || 77.5946);
        setRadiusMeters(setData.radiusMeters || 100);
      }

      // 3. Fetch all employee logs for management, otherwise only the user's logs
      const histRes = await fetch(`${API_URL}/attendance/history${isManagement ? '?all=true' : ''}`, { headers });
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackerData();
  }, [token, API_URL, isSuperAdmin, isManagement]);

  // Timer loop for active shift
  useEffect(() => {
    if (!attendance || !attendance.checkIn || attendance.checkOut) {
      setTimerStr('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(attendance.checkIn).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimerStr(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [attendance]);

  const handleCheckIn = async () => {
    setStatusMessage(null);
    try {
      const [finalLat, finalLng] = await requestCurrentLocation();

      const res = await fetch(`${API_URL}/attendance/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lat: finalLat,
          lng: finalLng,
          workMode: workMode,
          device: navigator.userAgent.includes('Mobile') ? 'Mobile Web' : 'Desktop Browser'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAttendance(data.attendance);
        setStatusMessage(`🟢 Checked in successfully! Mode: ${data.attendance.workMode || workMode} | Status: ${data.attendance.status}`);
        loadTrackerData();
      } else {
        setStatusMessage('🔴 Error: ' + (data.error || 'Check-in failed'));
      }
    } catch (e) {
      console.error(e);
      setStatusMessage('🔴 Error checking in. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    setStatusMessage(null);
    try {
      const [finalLat, finalLng] = await requestCurrentLocation();

      const res = await fetch(`${API_URL}/attendance/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lat: finalLat,
          lng: finalLng
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAttendance(data.attendance);
        setStatusMessage(`🔴 Checked out! Shift Duration: ${data.hoursWorked} hrs`);
        loadTrackerData();
      } else {
        setStatusMessage('🔴 Error: ' + (data.error || 'Check-out failed'));
      }
    } catch (e) {
      console.error(e);
      setStatusMessage('🔴 Error checking out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Filter employee tracks for Super Admin & Management
  const filteredHistory = history.filter(track => {
    const matchesSearch = !searchQuery || 
      (track.userName && track.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (track.userId && track.userId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (track.userDepartment && track.userDepartment.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMode = filterMode === 'ALL' || track.workMode === filterMode;
    const matchesDept = filterDept === 'ALL' || track.userDepartment === filterDept;

    return matchesSearch && matchesMode && matchesDept;
  });

  const uniqueDepartments = Array.from(new Set(history.map(h => h.userDepartment).filter(Boolean)));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-500" />
            {isManagement ? 'Employee Time & Attendance' : 'Geo-Attendance & Shift Desk'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isManagement
              ? 'Review employee check-ins, check-outs, GPS coordinates, work mode, and shift durations.'
              : 'Punch in/out with accurate GPS location coordinates and select work mode (WFH or Office).'}
          </p>
        </div>
      </div>

      {/* SUPER ADMIN VIEW: Employee Time & Location Tracks */}
      {isManagement ? (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Card3DCanvas themeColor="indigo" className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Check-ins Logged</p>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{history.length}</p>
              </div>
              <Stat3DSphere theme="indigo" size="w-10 h-10" />
            </Card3DCanvas>

            <Card3DCanvas themeColor="emerald" className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">In-Office Employees</p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {history.filter(h => h.workMode === 'Office').length}
                </p>
              </div>
              <Building className="w-8 h-8 text-emerald-500 opacity-80" />
            </Card3DCanvas>

            <Card3DCanvas themeColor="purple" className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">WFH Employees</p>
                <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {history.filter(h => h.workMode === 'WFH').length}
                </p>
              </div>
              <Home className="w-8 h-8 text-purple-500 opacity-80" />
            </Card3DCanvas>

            <Card3DCanvas themeColor="pink" className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Completed Shifts</p>
                <p className="text-3xl font-black text-pink-600 dark:text-pink-400 mt-1">
                  {history.filter(h => h.checkOut).length}
                </p>
              </div>
              <ShieldCheck className="w-8 h-8 text-pink-500 opacity-80" />
            </Card3DCanvas>
          </div>

            {/* Management visibility banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-900/30 border border-purple-500/30 text-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-purple-300">Management Attendance View</h4>
                <p className="text-xs text-purple-300/80">
                  You have visibility into employee check-in and check-out records, locations, work modes, and logged hours.
                </p>
              </div>
            </div>
          </div>

          {/* Employee Tracks & Filters */}
          <div className="p-6 rounded-3xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-slate-800 pb-4">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                All Employee Time & Location Tracks
              </h3>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by employee name or ID..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold outline-none"
                >
                  <option value="ALL">All Modes (Office & WFH)</option>
                  <option value="Office">🏢 Office Only</option>
                  <option value="WFH">🏠 WFH Only</option>
                </select>

                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold outline-none"
                >
                  <option value="ALL">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-2">Work Mode</th>
                    <th className="py-3 px-2">Check In Time</th>
                    <th className="py-3 px-2">Check Out Time</th>
                    <th className="py-3 px-2">Time Logged</th>
                    <th className="py-3 px-2">Login Coordinates</th>
                    <th className="py-3 px-2">Logout Coordinates</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((row, idx) => (
                      <tr key={row._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {row.userAvatar ? (
                              <img src={row.userAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black flex items-center justify-center text-xs">
                                {row.userName?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200">{row.userName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{row.userId} • {row.userDepartment}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            row.workMode === 'WFH'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}>
                            {row.workMode === 'WFH' ? <Home className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                            {row.workMode || 'Office'}
                          </span>
                        </td>

                        <td className="py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                          {row.checkIn ? new Date(row.checkIn).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </td>

                        <td className="py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                          {row.checkOut ? new Date(row.checkOut).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : (
                            <span className="text-amber-500 font-bold animate-pulse">Shift Active</span>
                          )}
                        </td>

                        <td className="py-3 px-2 font-black font-mono text-indigo-600 dark:text-indigo-400">
                          {row.hoursWorked ? `${row.hoursWorked} hrs` : '0 hrs'}
                        </td>

                        <td className="py-3 px-2 font-mono text-[11px]">
                          {row.lat ? (
                            <a
                              href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3 flex-shrink-0 text-rose-500" />
                              {row.lat.toFixed(4)}°, {row.lng.toFixed(4)}°
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : <span className="text-slate-400">—</span>}
                        </td>

                        <td className="py-3 px-2 font-mono text-[11px]">
                          {row.checkOutLat ? (
                            <a
                              href={`https://www.google.com/maps?q=${row.checkOutLat},${row.checkOutLng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3 flex-shrink-0 text-emerald-500" />
                              {row.checkOutLat.toFixed(4)}°, {row.checkOutLng.toFixed(4)}°
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : <span className="text-slate-400">{row.checkOut ? 'Recorded' : 'Active'}</span>}
                        </td>

                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            row.status === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            row.status === 'WFH' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
                            row.status === 'Late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No employee attendance logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD EMPLOYEE VIEW: Check-in / Check-out Desk */
        <div className="max-w-2xl">
          <div className="space-y-6">
            <Card3DCanvas themeColor="indigo" className="p-6 flex flex-col justify-between min-h-[340px]">
              <div className="flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-indigo-500" />
                    Attendance Punch
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Select location mode & report shift start.</p>
                </div>
                <Stat3DSphere theme="indigo" size="w-10 h-10" />
              </div>

              {/* Work Mode Option Selector (WFH vs Office) */}
              {!attendance && (
                <div className="my-4 z-10 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                    Working Location Option
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWorkMode('Office')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-extrabold text-xs transition-all ${
                        workMode === 'Office'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      In Office
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkMode('WFH')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-extrabold text-xs transition-all ${
                        workMode === 'WFH'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                          : 'bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      WFH
                    </button>
                  </div>
                </div>
              )}

              <div className="my-4 space-y-4 z-10">
                {!attendance ? (
                  <button
                    onClick={handleCheckIn}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black text-lg hover:opacity-95 active:scale-[0.98] transition-transform shadow-xl flex items-center justify-center gap-2 border border-white/20"
                  >
                    <Navigation className="w-5 h-5 animate-pulse" />
                    Check In ({workMode})
                  </button>
                ) : !attendance.checkOut ? (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/50">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        Active Shift ({attendance.workMode || 'Office'})
                      </p>
                      <p className="text-4xl font-black text-gradient-primary font-mono mt-1">
                        {timerStr}
                      </p>
                    </div>
                    <button
                      onClick={handleCheckOut}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-lg hover:opacity-95 active:scale-[0.98] transition-transform shadow-xl"
                    >
                      Check Out Now
                    </button>
                  </div>
                ) : (
                  <div className="p-5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-center space-y-1.5">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">Daily Shift Completed Today</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      You checked in at {new Date(attendance.checkIn).toLocaleTimeString()} and checked out at {new Date(attendance.checkOut).toLocaleTimeString()}.
                    </p>
                    <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      🔴 Re-check-in blocked: Multiple check-ins per day are strictly disabled.
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-500 flex flex-col gap-1 border-t dark:border-slate-800 pt-3 z-10 font-medium">
                <div>Office GPS: <span className="font-bold text-slate-700 dark:text-slate-300">{officeLat}° N, {officeLng}° E</span></div>
                <div>Punch Location: <span className="font-bold text-slate-700 dark:text-slate-300">{activeCoords[0].toFixed(4)}°, {activeCoords[1].toFixed(4)}°</span></div>
              </div>
            </Card3DCanvas>

            {/* Automatic GPS status */}
            <div className="p-6 rounded-2xl glass-card border shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-indigo-500" />
                  Automatic GPS Location
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Your browser location is used automatically for attendance.</p>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${gpsStatus === 'ready' ? 'bg-emerald-500' : gpsStatus === 'locating' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {gpsStatus === 'ready' ? 'Location detected automatically' : gpsStatus === 'locating' ? 'Detecting your location...' : 'Location permission required'}
                  </span>
                </div>
                {gpsStatus !== 'ready' && (
                  <button type="button" onClick={requestCurrentLocation} className="text-xs font-bold text-indigo-600 hover:text-indigo-500 shrink-0">
                    Try again
                  </button>
                )}
              </div>

              {statusMessage && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {statusMessage}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Employee's Own Punch History Logs */}
            <div className="p-6 rounded-2xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                My Recent Punch History
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Mode</th>
                      <th className="py-2.5">Check In</th>
                      <th className="py-2.5">Check Out</th>
                      <th className="py-2.5">Duration</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {history.length > 0 ? (
                      history.slice(0, 5).map((h, i) => (
                        <tr key={h._id || i}>
                          <td className="py-2.5 font-medium text-slate-700 dark:text-slate-300">
                            {new Date(h.checkIn || h.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-extrabold text-[10px]">
                              {h.workMode || 'Office'}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">
                            {h.checkIn ? new Date(h.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">
                            {h.checkOut ? new Date(h.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2.5 font-mono font-bold text-indigo-600">
                            {h.hoursWorked ? `${h.hoursWorked} hrs` : '0 hrs'}
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              h.status === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                              h.status === 'WFH' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">No punch records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
