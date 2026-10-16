import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  Sun,
  Trash2,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  if (!value) return null;
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(value) {
  const date = parseLocalDate(value);
  return date ? formatLocalDate(date) : '';
}

function formatDate(dateString, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  const date = parseLocalDate(dateString);
  return date ? date.toLocaleDateString(undefined, options) : dateString;
}

function getEventStyle(type) {
  return {
    holiday: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    event: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    meeting: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    birthday: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20',
    deadline: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    task: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    leave: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    working_day: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20'
  }[type] || 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
}

export default function CalendarView() {
  const { user, token, API_URL, socket } = useApp();
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));
  const [holidays, setHolidays] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '', date: '', type: 'event', description: '', startTime: '', endTime: '', userId: '', department: ''
  });
  const [holidayForm, setHolidayForm] = useState({
    name: '', date: '', type: 'Company', recurring: false, departments: []
  });

  const isAdmin = ['HR', 'Super Admin'].includes(user?.role);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayString = formatLocalDate(new Date());

  const loadCalendarData = useCallback(async (signal) => {
    const headers = { Authorization: `Bearer ${token}` };
    const visibleMonths = [-1, 0, 1].map((offset) => new Date(year, month + offset, 1));
    const responses = await Promise.all([
      ...visibleMonths.map((date) => fetch(
        `${API_URL}/calendar/events?month=${date.getMonth() + 1}&year=${date.getFullYear()}`,
        { headers, signal }
      )),
      fetch(`${API_URL}/holidays`, { headers, signal }),
      fetch(`${API_URL}/tasks`, { headers, signal }),
      fetch(`${API_URL}/leaves`, { headers, signal })
    ]);
    const eventResponses = responses.slice(0, visibleMonths.length);
    const [holidayResponse, taskResponse, leaveResponse] = responses.slice(visibleMonths.length);

    if (responses.some((response) => !response.ok)) {
      throw new Error('Some calendar information could not be loaded. Please try again.');
    }

    const [eventData, holidayData, taskData, leaveData] = await Promise.all([
      Promise.all(eventResponses.map((response) => response.json())),
      holidayResponse.json(),
      taskResponse.json(),
      leaveResponse.json()
    ]);

    setEvents(eventData.flat().filter((event, index, list) =>
      list.findIndex((candidate) => candidate._id === event._id) === index
    ));
    setHolidays(Array.isArray(holidayData) ? holidayData : []);
    setTasks(Array.isArray(taskData) ? taskData : []);
    setLeaves(Array.isArray(leaveData) ? leaveData : []);
    setLoadError('');
  }, [API_URL, month, token, year]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    loadCalendarData(controller.signal)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Failed to load calendar data', error);
          setLoadError(error.message || 'Could not load calendar information.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadCalendarData]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => loadCalendarData().catch((error) => {
      console.error('Failed to refresh calendar data', error);
      setLoadError(error.message || 'Calendar updates could not be refreshed.');
    });
    socket.on('calendar_updated', refresh);
    socket.on('holiday_updated', refresh);
    return () => {
      socket.off('calendar_updated', refresh);
      socket.off('holiday_updated', refresh);
    };
  }, [loadCalendarData, socket]);

  const days = useMemo(() => {
    const firstDate = new Date(year, month, 1);
    firstDate.setDate(1 - firstDate.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstDate);
      date.setDate(firstDate.getDate() + index);
      return {
        date: formatLocalDate(date),
        day: date.getDate(),
        weekday: date.getDay(),
        inMonth: date.getMonth() === month
      };
    });
  }, [month, year]);

  const getEventsForDate = useCallback((dateString) => {
    const dayDate = parseLocalDate(dateString);
    if (!dayDate) return [];
    const items = [];

    holidays
      .filter((holiday) =>
        holiday.date === dateString ||
        (holiday.recurring && holiday.date?.slice(5) === dateString.slice(5))
      )
      .forEach((holiday) => items.push({
        id: `holiday-${holiday._id || holiday.name}-${dateString}`,
        title: holiday.name,
        type: 'holiday',
        subtitle: holiday.type || 'Holiday'
      }));

    events
      .filter((event) => event.date === dateString)
      .forEach((event) => items.push({
        id: `event-${event._id}`,
        title: event.title,
        type: event.type || 'event',
        subtitle: [event.startTime, event.endTime].filter(Boolean).join(' - ') || event.type?.replace('_', ' '),
        description: event.description,
        department: event.department,
        startTime: event.startTime
      }));

    tasks
      .filter((task) => task.deadline && toDateKey(task.deadline) === dateString)
      .forEach((task) => items.push({
        id: `task-${task._id}`,
        title: task.title,
        type: 'task',
        subtitle: 'Task deadline',
        startTime: ''
      }));

    leaves
      .filter((leave) => {
        if (leave.status !== 'approved') return false;
        const start = leave.startDate ? toDateKey(leave.startDate) : '';
        const end = leave.endDate ? toDateKey(leave.endDate) : start;
        return start && end && dateString >= start && dateString <= end;
      })
      .forEach((leave) => items.push({
        id: `leave-${leave._id}`,
        title: `${leave.applicantName || 'Team member'} leave`,
        type: 'leave',
        subtitle: leave.leaveType || 'Approved leave',
        startTime: ''
      }));

    return items.sort((a, b) => {
      if (a.type === 'holiday') return -1;
      if (b.type === 'holiday') return 1;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [events, holidays, leaves, tasks]);

  const monthDays = days.filter((day) => day.inMonth);
  const monthEntries = monthDays.flatMap((day) =>
    getEventsForDate(day.date).map((event) => ({ ...event, date: day.date }))
  );
  const sundayCount = monthDays.filter((day) => day.weekday === 0).length;
  const holidayCount = monthEntries.filter((event) => event.type === 'holiday').length;
  const selectedEvents = getEventsForDate(selectedDate);
  const selectedDayDate = parseLocalDate(selectedDate);
  const selectedDayLabel = selectedDayDate
    ? selectedDayDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : selectedDate;

  const changeMonth = (offset) => {
    const next = new Date(year, month + offset, 1);
    setCurrentDate(next);
    setSelectedDate(formatLocalDate(next));
    setActionError('');
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(formatLocalDate(today));
    setActionError('');
  };

  const selectDay = (day) => {
    setSelectedDate(day.date);
    if (!day.inMonth) {
      const date = parseLocalDate(day.date);
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const submitJson = async (url, method, body, errorMessage) => {
    const response = await fetch(`${API_URL}${url}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || errorMessage);
    }
    return response.status === 204 ? null : response.json();
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    try {
      await submitJson('/calendar/events', 'POST', eventForm, 'Could not save this event.');
      setEventForm({ title: '', date: '', type: 'event', description: '', startTime: '', endTime: '', userId: '', department: '' });
      setShowEventForm(false);
      await loadCalendarData();
    } catch (error) {
      setActionError(error.message || 'Could not save this event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setActionError('');
    try {
      await submitJson(`/calendar/events/${eventId}`, 'DELETE', null, 'Could not delete this event.');
      await loadCalendarData();
    } catch (error) {
      setActionError(error.message || 'Could not delete this event.');
    }
  };

  const handleCreateHoliday = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    try {
      await submitJson('/holidays', 'POST', holidayForm, 'Could not save this holiday.');
      setHolidayForm({ name: '', date: '', type: 'Company', recurring: false, departments: [] });
      setShowHolidayForm(false);
      await loadCalendarData();
    } catch (error) {
      setActionError(error.message || 'Could not save this holiday.');
    } finally {
      setSaving(false);
    }
  };

  const refreshCalendar = () => {
    setLoading(true);
    loadCalendarData()
      .catch((error) => setLoadError(error.message || 'Could not refresh the calendar.'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <section className="rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 sm:p-7 text-white shadow-xl shadow-indigo-900/15">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold uppercase tracking-widest">
              <CalendarDays className="h-4 w-4" /> Team calendar
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">{MONTHS[month]} {year}</h1>
            <p className="mt-1 text-sm text-indigo-100">Holidays, Sundays, team events, deadlines, and approved leave in one view.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <SummaryCard label="Holidays" value={holidayCount} icon={Sun} />
            <SummaryCard label="Sundays" value={sundayCount} icon={CalendarCheck} />
            <SummaryCard label="Month items" value={monthEntries.length} icon={Bookmark} />
          </div>
        </div>
      </section>

      {loadError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300 sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={refreshCalendar} className="inline-flex items-center gap-2 font-bold">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}

      {actionError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError('')} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
        </div>
      )}

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setShowHolidayForm(!showHolidayForm); setShowEventForm(false); setActionError(''); }} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700">
            <Plus className="h-4 w-4" /> Add holiday
          </button>
          <button type="button" onClick={() => { setShowEventForm(!showEventForm); setShowHolidayForm(false); setActionError(''); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add event
          </button>
        </div>
      )}

      {isAdmin && showEventForm && (
        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 xl:grid-cols-4">
          <input required placeholder="Event title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700" />
          <input required type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700" />
          <select value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700">
            <option value="event">Event</option><option value="meeting">Meeting</option><option value="birthday">Birthday</option><option value="deadline">Deadline</option><option value="working_day">Working day</option>
          </select>
          <input placeholder="Department (optional)" value={eventForm.department} onChange={(e) => setEventForm({ ...eventForm, department: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700" />
          <input type="time" aria-label="Start time (optional)" value={eventForm.startTime} onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700" />
          <input type="time" aria-label="End time (optional)" value={eventForm.endTime} onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700" />
          <input placeholder="Description (optional)" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700 sm:col-span-2" />
          <div className="flex justify-end sm:col-span-2 xl:col-span-4">
            <button disabled={saving} type="submit" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save event'}</button>
          </div>
        </form>
      )}

      {isAdmin && showHolidayForm && (
        <form onSubmit={handleCreateHoliday} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 xl:grid-cols-4">
          <input required placeholder="Holiday name" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700" />
          <input required type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700" />
          <select value={holidayForm.type} onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700">
            <option value="Public">Public holiday</option><option value="Company">Company holiday</option><option value="National">National holiday</option><option value="Festival">Festival holiday</option><option value="Department">Department holiday</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium dark:border-slate-700">
            <input type="checkbox" checked={holidayForm.recurring} onChange={(e) => setHolidayForm({ ...holidayForm, recurring: e.target.checked })} />
            Repeat every year
          </label>
          <div className="flex justify-end sm:col-span-2 xl:col-span-4">
            <button disabled={saving} type="submit" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save holiday'}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={goToToday} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Today</button>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
              <h2 className="ml-2 text-lg font-extrabold text-slate-800 dark:text-slate-100">{MONTHS[month]} {year}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500">
              <LegendDot color="bg-rose-500" label="Holiday" />
              <LegendDot color="bg-blue-500" label="Event" />
              <LegendDot color="bg-indigo-500" label="Deadline" />
              <LegendDot color="bg-emerald-500" label="Leave" />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center gap-3 text-sm text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              Loading calendar...
            </div>
          ) : (
            <div className="overflow-x-auto p-2 sm:p-4">
              <div className="min-w-[680px]">
                <div className="mb-2 grid grid-cols-7">
                  {WEEKDAYS.map((weekday, index) => (
                    <div key={weekday} className={`px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-wider ${index === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      <span className="hidden sm:inline">{weekday}</span>
                      <span className="sm:hidden">{weekday.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800">
                  {days.map((day) => {
                    const dayEvents = getEventsForDate(day.date);
                    const isSelected = day.date === selectedDate;
                    const isToday = day.date === todayString;
                    const isSunday = day.weekday === 0;
                    return (
                      <button
                        type="button"
                        key={day.date}
                        onClick={() => selectDay(day)}
                        aria-pressed={isSelected}
                        aria-label={`${formatDate(day.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${isSunday ? ', Sunday' : ''}${dayEvents.length ? `, ${dayEvents.length} calendar items` : ''}`}
                        className={`flex min-h-[92px] flex-col items-stretch gap-1.5 bg-white p-1.5 text-left transition-colors sm:min-h-[118px] sm:p-2 ${
                          !day.inMonth ? 'bg-slate-50/70 text-slate-400 dark:bg-slate-950/60' : ''
                        } ${isSunday && day.inMonth ? 'bg-rose-50/60 dark:bg-rose-950/10' : ''} ${
                          isSelected ? 'ring-2 ring-inset ring-indigo-500' : 'hover:bg-indigo-50/50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            isToday ? 'bg-indigo-600 text-white' : isSunday && day.inMonth ? 'text-rose-600 dark:text-rose-400' : day.inMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'
                          }`}>{day.day}</span>
                          {isSunday && day.inMonth && <span className="hidden text-[9px] font-bold text-rose-500 sm:inline">SUN</span>}
                          {dayEvents.length > 0 && <span className="text-[9px] font-semibold text-slate-400">{dayEvents.length}</span>}
                        </span>
                        <span className="flex min-h-0 flex-col gap-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map((item) => (
                            <span key={item.id} title={`${item.title} · ${item.subtitle}`} className={`truncate rounded-md border px-1.5 py-0.5 text-[9px] font-semibold leading-tight sm:text-[10px] ${getEventStyle(item.type)}`}>
                              {item.title}
                            </span>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="px-1 text-[9px] font-bold text-slate-500">+{dayEvents.length - 2} more</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> Sundays are marked as weekly days off</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Today</span>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Selected day</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-800 dark:text-slate-100">{selectedDayLabel}</h2>
              {selectedDayDate && selectedDayDate.getDay() === 0 && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                  <Sun className="h-3 w-3" /> Sunday · Weekly day off
                </span>
              )}
            </div>
            <div className="space-y-2">
              {selectedEvents.length ? selectedEvents.map((item) => (
                <EventListItem key={item.id} item={item} date={selectedDate} isAdmin={isAdmin} onDelete={handleDeleteEvent} />
              )) : (
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">No holidays or scheduled items for this day.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 font-extrabold text-slate-800 dark:text-slate-100">
              <Bookmark className="h-4 w-4 text-indigo-500" /> This month
            </h2>
            <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
              {monthEntries.length ? monthEntries
                .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
                .map((item) => (
                  <button
                    type="button"
                    key={`${item.id}-${item.date}`}
                    onClick={() => setSelectedDate(item.date)}
                    className="block w-full rounded-xl border border-slate-100 p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
                  >
                    <span className={`block truncate text-xs font-bold ${item.type === 'holiday' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>{item.title}</span>
                    <span className="mt-1 block text-[10px] text-slate-500">{formatDate(item.date)} · {item.subtitle}</span>
                  </button>
                ))
                : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">No events or holidays scheduled this month.</p>}
            </div>
          </section>
          <p className="px-1 text-[10px] leading-relaxed text-slate-400">
            Holiday dates are managed by your organization. Ask HR to add or update a holiday when your office observes an additional day off.
          </p>
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="min-w-[82px] rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm sm:min-w-[100px] sm:px-4">
      <Icon className="h-4 w-4 text-indigo-100" />
      <p className="mt-1 text-xl font-black">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-100 sm:text-[10px]">{label}</p>
    </div>
  );
}

function LegendDot({ color, label }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>;
}

function EventListItem({ item, date, isAdmin, onDelete }) {
  return (
    <div className={`flex items-start justify-between gap-2 rounded-xl border p-3 ${getEventStyle(item.type)}`}>
      <div className="min-w-0">
        <p className="break-words text-xs font-bold">{item.title}</p>
        <p className="mt-1 flex items-center gap-1 text-[10px] opacity-80">
          {item.startTime ? <Clock className="h-3 w-3 shrink-0" /> : <Calendar className="h-3 w-3 shrink-0" />}
          {item.subtitle || item.type?.replace('_', ' ')}
        </p>
        {item.department && <p className="mt-1 flex items-center gap-1 text-[10px] opacity-80"><MapPin className="h-3 w-3" />{item.department}</p>}
        {item.description && <p className="mt-2 break-words text-[11px] opacity-80">{item.description}</p>}
      </div>
      {isAdmin && item.type !== 'holiday' && item.id.startsWith('event-') && (
        <button type="button" onClick={() => onDelete(item.id.slice('event-'.length))} title={`Delete ${item.title}`} aria-label={`Delete ${item.title}`} className="shrink-0 rounded-lg p-1 text-rose-600 hover:bg-white/60 dark:text-rose-300">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      <span className="sr-only">{formatDate(date)}</span>
    </div>
  );
}
