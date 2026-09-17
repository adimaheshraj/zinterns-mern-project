import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, ListTodo, Calendar, MessageSquare, CheckSquare, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Task3DCube from '../components/3d/Task3DCube';

const columns = [
  { id: 'todo', title: 'To Do', border: 'border-t-slate-400 bg-slate-100/30' },
  { id: 'in_progress', title: 'In Progress', border: 'border-t-indigo-500 bg-indigo-50/10' },
  { id: 'review', title: 'In Review', border: 'border-t-amber-500 bg-amber-50/10' },
  { id: 'completed', title: 'Completed', border: 'border-t-emerald-500 bg-emerald-50/10' }
];

export default function Tasks() {
  const { user, token, API_URL } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const getInternNameByEmployeeId = (employeeId) => {
    const intern = interns.find((i) => String(i.employeeId) === String(employeeId));
    return intern?.name;
  };
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for new task
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignTo, setNewAssignTo] = useState('');
  const [newProject, setNewProject] = useState('');

  const [interns, setInterns] = useState([]);

  const [newPriority, setNewPriority] = useState('medium');
  const [newDeadline, setNewDeadline] = useState('');
  const [newChecklist, setNewChecklist] = useState(['']);

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch interns for assignee dropdown
  const fetchInterns = async () => {
    try {
      const res = await fetch(`${API_URL}/org/directory?role=Intern`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInterns(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchInterns();
  }, [token, API_URL]);

  // Update task status
  const moveTask = async (taskId, nextStatus) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchTasks();
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask(prev => ({ ...prev, status: nextStatus }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDeadline) return;

    const checklistObjs = newChecklist
      .filter(item => item.trim() !== '')
      .map(text => ({ text, done: false }));

    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          project: newProject,
          title: newTitle,
          description: newDesc,
          assignedTo: newAssignTo,
          deadline: newDeadline,
          priority: newPriority,
          checklist: checklistObjs
        })
      });
      if (res.ok) {
        fetchTasks();
        setShowCreateModal(false);
        // Reset form
        setNewTitle('');
        setNewDesc('');
        setNewDeadline('');
        setNewChecklist(['']);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle checklist item done
  const handleToggleChecklist = async (task, index) => {
    const updatedChecklist = [...task.checklist];
    updatedChecklist[index].done = !updatedChecklist[index].done;

    // Calculate progress %
    const doneCount = updatedChecklist.filter(c => c.done).length;
    const progress = Math.round((doneCount / updatedChecklist.length) * 100);

    try {
      const res = await fetch(`${API_URL}/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          checklist: updatedChecklist,
          progress
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTask(data);
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Comment
  const [commentText, setCommentText] = useState('');
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`${API_URL}/tasks/${selectedTask._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTask(data);
        setCommentText('');
        fetchTasks();
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

  return (
    <div className="space-y-6 h-full flex flex-col animate-fadeIn">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ListTodo className="w-7 h-7 text-indigo-500" />
            Task Management Board
          </h1>
          <p className="text-sm text-slate-400 mt-1">Sprints backlog and task progression.</p>
        </div>
        {user.role !== 'Intern' && user.role !== 'HR' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow transition-colors"
          >
            <Plus className="w-5 h-5" />
            Assign New Task
          </button>
        )}
      </div>

      {/* Kanban Board columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-y-auto pb-6 min-h-[500px]">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className={`rounded-3xl border-t-4 p-4 border shadow-md flex flex-col backdrop-blur-xl ${col.border}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Task3DCube status={col.id} size="w-6 h-6" />
                  {col.title}
                </span>
                <span className="text-xs px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full font-black border border-indigo-200/40">
                  {colTasks.length}
                </span>
              </div>

              {/* Task list container */}
              <div className="flex-1 space-y-3.5 overflow-y-auto">
                {colTasks.map(task => (
                  <motion.div
                    key={task._id}
                    layoutId={`task-${task._id}`}
                    onClick={() => setSelectedTask(task)}
                    className="p-4 rounded-2xl cyber-card cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between z-10 relative">
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md font-extrabold uppercase">
                        {task.project}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Task3DCube priority={task.priority} status={task.status} size="w-5 h-5" />
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                              : task.priority === 'low'
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 z-10 relative">
                      {task.title}
                    </h4>

                    {/* Progress bar */}
                    {task.checklist && task.checklist.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Checklist</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${task.progress}%` }}></div>
                        </div>
                      </div>
                    )}

                    {/* Bottom row */}
                    <div className="flex items-center justify-between border-t dark:border-slate-800/50 pt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {task.comments && task.comments.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" />
                          {task.comments.length}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Task modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              layoutId={`task-${selectedTask._id}`}
              className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl border shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Top Details */}
              <div className="p-6 border-b dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/20">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-md font-bold">
                      {selectedTask.project}
                    </span>
                      <span className="text-xs text-slate-400">
                        Assigned by: {selectedTask.assignedBy}
                      {selectedTask.assignedTo ? (
                          <>
                            {' '}| Assignee: {getInternNameByEmployeeId(selectedTask.assignedTo) || selectedTask.assignedTo}
                          </>
                        ) : null}
                      </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedTask.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Contents scroll */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h5>
                  <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border">
                    {selectedTask.description || 'No description provided.'}
                  </p>
                </div>

                {/* Checklist items */}
                {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Checklist Progress</h5>
                    <div className="space-y-2 border p-4 rounded-xl bg-slate-50/20">
                      {selectedTask.checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => handleToggleChecklist(selectedTask, idx)}
                            className="w-4 h-4 rounded text-indigo-600"
                          />
                          <span className={item.done ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status selector */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Workflow Status</h5>
                  <div className="flex gap-2">
                    {columns.map(col => (
                      <button
                        key={col.id}
                        onClick={() => moveTask(selectedTask._id, col.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          selectedTask.status === col.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-transparent text-slate-500'
                        }`}
                      >
                        {col.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments block */}
                <div className="border-t dark:border-slate-800 pt-4 space-y-3">
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Comment Threads</h5>
                  <div className="space-y-3">
                    {selectedTask.comments &&
                      selectedTask.comments.map((c, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border text-sm">
                          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                            <span>{c.sender}</span>
                            <span>{new Date(c.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">{c.text}</p>
                        </div>
                      ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ask a question or report status..."
                      className="flex-1 p-2 border rounded-xl bg-transparent text-sm"
                    />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                      Comment
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl border shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-500" />
                  Assign Sprint Task
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Project Name</label>
                    <input
                      type="text"
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Assignee ID</label>
                    <select
                      value={newAssignTo}
                      onChange={(e) => setNewAssignTo(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-transparent"
                    >
                      <option value="">Select intern</option>
                      {interns.map((i) => (
                        <option key={i.employeeId} value={i.employeeId}>
                          {i.name} ({i.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Task Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Implement geofenced dashboard warning logs"
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Description</label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Deadline</label>
                    <input
                      type="date"
                      required
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-transparent"
                    />
                  </div>
                </div>

                {/* Dynamic Checklist */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase block">Checklist Items</label>
                  {newChecklist.map((item, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const copy = [...newChecklist];
                        copy[idx] = e.target.value;
                        setNewChecklist(copy);
                      }}
                      placeholder={`Item ${idx + 1}`}
                      className="w-full p-2 border rounded-lg bg-transparent mb-1"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewChecklist([...newChecklist, ''])}
                    className="text-xs text-indigo-500 font-bold hover:underline"
                  >
                    + Add Checklist Row
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700"
                >
                  Create and Broadcast Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
