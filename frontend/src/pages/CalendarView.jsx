import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, Bookmark, Plus, Trash2 } from 'lucide-react';

export default function CalendarView() {
  const { user, token, API_URL, socket } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', date: '', type: 'event', description: '', startTime: '', endTime: '', userId: '', department: '' });
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', type: 'Company', recurring: true, departments: [] });

  const isAdmin = ['HR', 'Super Admin'].includes(user?.role);
  const monthParam = currentDate.getMonth() + 1;
  const yearParam = currentDate.getFullYear();

  const loadEvents = async () => {
    const res = await fetch(`${API_URL}/calendar/events?month=${monthParam}&year=${yearParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setEvents(await res.json());
  };

  useEffect(() => {
    async function loadData() {
      try {
        await loadEvents();
        // Fetch holidays from database
        const hRes = await fetch(`${API_URL}/holidays`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (hRes.ok) {
          const hData = await hRes.json();
          setHolidays(hData);
        }

        // Fetch tasks
        const tRes = await fetch(`${API_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
        if (tRes.ok) {
          const tData = await tRes.json();
          setTasks(tData);
        }

        // Fetch leaves
        const lRes = await fetch(`${API_URL}/leaves`, { headers: { Authorization: `Bearer ${token}` } });
        if (lRes.ok) {
          const lData = await lRes.json();
          setLeaves(lData);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, [token, API_URL, currentDate]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => loadEvents().catch(console.error);
    socket.on('calendar_updated', refresh);
    return () => socket.off('calendar_updated', refresh);
  }, [socket, currentDate, token, API_URL]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const prevMonthDays = getDaysInMonth(year, month - 1);
  const daysArray = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push({ day: prevMonthDays - i, isCurrentMonth: false, dateStr: `${year}-${String(month).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}` });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({ day: i, isCurrentMonth: true, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
  }

  const remainingCells = 42 - daysArray.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysArray.push({ day: i, isCurrentMonth: false, dateStr: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
  }

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const getEventsForDate = (dateStr) => {
    const list = [];
    const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
    if (dayOfWeek > 0 && dayOfWeek < 6) {
      list.push({ name: 'Working day', type: 'working_day', color: 'bg-cyan-500' });
    }
    const dayHolidays = holidays.filter(h => h.date === dateStr || (h.recurring && h.date.slice(5) === dateStr.slice(5)));
    dayHolidays.forEach(h => list.push({ name: h.name, type: 'holiday', color: 'bg-rose-500' }));

    const dayTasks = tasks.filter(t => new Date(t.deadline).toISOString().split('T')[0] === dateStr);
    dayTasks.forEach(t => list.push({ name: `Task: ${t.title}`, type: 'task', color: 'bg-indigo-500' }));

    const dayLeaves = leaves.filter(l => {
      const start = new Date(l.startDate).toISOString().split('T')[0];
      const end = new Date(l.endDate).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end && l.status === 'approved';
    });
    dayLeaves.forEach(l => list.push({ name: `${l.applicantName || 'Intern'} Leave`, type: 'leave', color: 'bg-emerald-500' }));

    events.filter(event => event.date === dateStr).forEach(event => list.push({
      name: event.title,
      type: event.type,
      color: {
        meeting: 'bg-violet-500',
        birthday: 'bg-pink-500',
        deadline: 'bg-amber-500',
        working_day: 'bg-cyan-500',
        event: 'bg-blue-500'
      }[event.type] || 'bg-blue-500'
    }));

    return list;
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    const res = await fetch(`${API_URL}/calendar/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(eventForm)
    });
    if (res.ok) {
      setEventForm({ title: '', date: '', type: 'event', description: '', startTime: '', endTime: '', userId: '', department: '' });
      setShowEventForm(false);
      await loadEvents();
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const res = await fetch(`${API_URL}/calendar/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) await loadEvents();
  };

  const handleCreateHoliday = async (event) => {
    event.preventDefault();
    const res = await fetch(`${API_URL}/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(holidayForm)
    });
    if (res.ok) {
      const holiday = await res.json();
      setHolidays(current => [...current, holiday]);
      setHolidayForm({ name: '', date: '', type: 'Company', recurring: true, departments: [] });
      setShowHolidayForm(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-indigo-500" />
              Calendar Workspace
            </h1>
            <p className="text-sm text-slate-400 mt-1">Holidays, milestones, meetings and team leaves.</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => setShowHolidayForm(value => !value)} className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-rose-700">
                <Plus className="w-4 h-4" /> Add Holiday
              </button>
              <button onClick={() => setShowEventForm(value => !value)} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> Add Event
              </button>
            </div>
          )}
        </div>
      </div>

      {isAdmin && showEventForm && (
        <form onSubmit={handleCreateEvent} className="p-5 rounded-2xl glass-card border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
          <input required placeholder="Event title" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} className="p-2.5 rounded-xl border bg-white dark:bg-slate-900" />
          <input required type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} className="p-2.5 rounded-xl border bg-white dark:bg-slate-900" />
          <select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })} className="p-2.5 rounded-xl border bg-white dark:bg-slate-900">
            <option value="event">Event</option>
            <option value="meeting">Meeting</option>
            <option value="birthday">Birthday</option>
            <option value="deadline">Deadline</option>
            <option value="working_day">Working Day</option>
          </select>
          <input placeholder="User ID (optional)" value={eventForm.userId} onChange={e => setEventForm({ ...eventForm, userId: e.target.value })} className="p-2.5 rounded-xl border bg-white dark:bg-slate-900" />
          <input placeholder="Department (optional)" value={eventForm.department} onChange={e => setEventForm({ ...eventForm, department: e.target.value })} className="p-2.5 rounded-xl border bg-white dark:bg-slate-900" />
          <input placeholder="Description" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} className="p-2.5 rounded-xl border bg-white dark:bg-slate-900" />
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Save Event</button>
          </div>
        </form>
      )}

      {isAdmin && showHolidayForm && (
        <form onSubmit={handleCreateHoliday} className="p-5 rounded-2xl glass-card border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
          <input required placeholder="Holiday name" value={holidayForm.name} onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })} className="p-2.5 rounded-xl border bg-white dark:bg-slate-900" />
          <input required type="date" value={holidayForm.date} onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} className="p-2.5 rounded-xl border bg-white dark:bg-slate-900" />
          <select value={holidayForm.type} onChange={e => setHolidayForm({ ...holidayForm, type: e.target.value })} className="p-2.5 rounded-xl border bg-white dark:bg-slate-900">
            <option value="Public">Public Holiday</option>
            <option value="Company">Company Holiday</option>
            <option value="National">National Holiday</option>
            <option value="Festival">Festival Holiday</option>
            <option value="Department">Department Holiday</option>
          </select>
          <label className="flex items-center gap-2 p-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={holidayForm.recurring} onChange={e => setHolidayForm({ ...holidayForm, recurring: e.target.checked })} />
            Repeat every year
          </label>
          <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Save Holiday</button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 p-6 rounded-2xl glass-card border shadow-sm bg-white dark:bg-slate-900/60">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
              {monthNames[month]} {year}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextMonth} className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-sm min-h-[350px]">
            {daysArray.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.dateStr);
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border flex flex-col justify-between h-16 transition-shadow hover:shadow-sm ${
                    cell.isCurrentMonth
                      ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-800/50'
                      : 'bg-slate-100/20 border-transparent text-slate-400 opacity-40'
                  }`}
                >
                  <span className="font-semibold text-xs">{cell.day}</span>
                  
                  <div className="flex gap-0.5 mt-1 overflow-x-auto">
                    {dayEvents.map((e, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${e.color}`}
                        title={e.name}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 p-6 rounded-2xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 h-fit space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-500 animate-pulse" />
            Events in {monthNames[month]}
          </h3>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {holidays.filter(h => h.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`) || (h.recurring && h.date.slice(5, 7) === String(month + 1).padStart(2, '0'))).map((h, i) => (
              <div key={`h-${i}`} className="p-3 border bg-rose-50/10 border-rose-200/20 rounded-xl text-xs space-y-1">
                <span className="font-bold text-rose-600 dark:text-rose-400">📅 {h.name}</span>
                <div className="text-[10px] text-slate-400">{h.type} Holiday | {h.date}</div>
              </div>
            ))}

            {tasks
              .filter(t => {
                const d = new Date(t.deadline);
                return d.getMonth() === month && d.getFullYear() === year;
              })
              .map((t) => (
                <div key={`t-${t._id}`} className="p-3 border bg-indigo-50/10 border-indigo-200/20 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">🏁 Task: {t.title}</span>
                  <div className="text-[10px] text-slate-400">Deadline: {new Date(t.deadline).toLocaleDateString()}</div>
                </div>
              ))}

            {events.map((event) => (
              <div key={`e-${event._id}`} className="p-3 border bg-violet-50/10 border-violet-200/20 rounded-xl text-xs space-y-1 flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-violet-600 dark:text-violet-400">{event.title}</span>
                  <div className="text-[10px] text-slate-400">{event.type.replace('_', ' ')} | {event.date}{event.startTime ? ` | ${event.startTime}` : ''}</div>
                  {event.description && <div className="text-[10px] text-slate-500 mt-1">{event.description}</div>}
                </div>
                {isAdmin && <button onClick={() => handleDeleteEvent(event._id)} title="Delete event" className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            ))}

            {leaves
              .filter(l => {
                const d = new Date(l.startDate);
                return d.getMonth() === month && d.getFullYear() === year && l.status === 'approved';
              })
              .map((l) => (
                <div key={`l-${l._id}`} className="p-3 border bg-emerald-50/10 border-emerald-200/20 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">🛫 {l.applicantName} Leave</span>
                  <div className="text-[10px] text-slate-400">{l.leaveType} | {new Date(l.startDate).toLocaleDateString()}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
