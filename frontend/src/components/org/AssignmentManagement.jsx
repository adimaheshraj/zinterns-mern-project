import React, { useState, useEffect } from 'react';
import { RefreshCw, Users, Shield, ArrowRight, History, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AssignmentManagement({ onAssignmentUpdated }) {
  const { token, API_URL } = useApp();

  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserData, setSelectedUserData] = useState(null);

  // New assignment selections
  const [newMentor, setNewMentor] = useState('');
  const [newRM, setNewRM] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDesignation, setNewDesignation] = useState('');

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchDirectory();
  }, [token, API_URL]);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/org/directory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (empId) => {
    setSelectedUser(empId);
    setStatusMsg(null);
    const u = employees.find(e => e.employeeId === empId || e._id === empId);
    if (u) {
      setSelectedUserData(u);
      setNewMentor(u.mentor || '');
      setNewRM(u.reportingManager || '');
      setNewDepartment(u.department || 'Technical');
      setNewTeam(u.team || 'Full Stack Development');
      setNewRole(u.role || 'Intern');
      setNewDesignation(u.designation || u.role);

      // Fetch assignment history for this user
      try {
        const histRes = await fetch(`${API_URL}/org/assignments/history/${u.employeeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (histRes.ok) {
          const hist = await histRes.json();
          setHistory(hist);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveAssignments = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_URL}/org/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          mentor: newMentor,
          reportingManager: newRM,
          department: newDepartment,
          team: newTeam,
          role: newRole,
          designation: newDesignation
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg('🟢 Hierarchy & Team Assignments Updated Successfully!');
        fetchDirectory();
        if (onAssignmentUpdated) onAssignmentUpdated();
        // Refresh history
        handleSelectUser(selectedUser);
      } else {
        setStatusMsg('🔴 Error: ' + data.error);
      }
    } catch (err) {
      setStatusMsg('🔴 Failed to update assignment.');
    } finally {
      setSaving(false);
    }
  };

  const mentors = employees.filter(e => e.role === 'Mentor' && e.status === 'active');
  const rms = employees.filter(e => e.role === 'RM' && e.status === 'active');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-xs font-semibold text-slate-400 mt-3">Loading Assignment Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] px-3 py-1 bg-white/20 backdrop-blur-md rounded-full font-bold uppercase tracking-wider">
            HR Control Panel
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-tight">Assignment & Dynamic Hierarchy Management</h1>
          <p className="text-xs text-purple-100 mt-1">Reassign Intern → Mentor, Mentor → RM, Department, Team, or System Role with complete audit logging.</p>
        </div>
        <RefreshCw className="w-8 h-8 text-purple-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Select Employee */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> 1. Select Target Employee
          </h2>

          <div className="space-y-2">
            {employees.map(emp => (
              <div
                key={emp._id}
                onClick={() => handleSelectUser(emp.employeeId)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedUser === emp.employeeId
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-extrabold'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{emp.name}</p>
                  <p className="text-[10px] text-slate-400">{emp.employeeId} • {emp.role} • {emp.department}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column: Assignment Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedUserData ? (
            <form onSubmit={handleSaveAssignments} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Re-assign Hierarchy for: {selectedUserData.name}
                  </h3>
                  <p className="text-xs text-slate-400">Employee ID: {selectedUserData.employeeId} | Current Role: {selectedUserData.role}</p>
                </div>
                <span className="text-[10px] px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-full font-bold uppercase">
                  {selectedUserData.department}
                </span>
              </div>

              {statusMsg && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold">
                  {statusMsg}
                </div>
              )}

              {/* Assignment Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {newRole.toLowerCase() === 'intern' && (
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Assigned Mentor</label>
                    <select
                      value={newMentor}
                      onChange={(e) => setNewMentor(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none font-bold"
                    >
                      <option value="">Unassigned</option>
                      {mentors.map(m => (
                        <option key={m._id} value={m.employeeId}>{m.name} ({m.employeeId})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Reporting Manager</label>
                  <select
                    value={newRM}
                    onChange={(e) => setNewRM(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none font-bold"
                  >
                    <option value="">Unassigned</option>
                    {rms.map(rm => (
                      <option key={rm._id} value={rm.employeeId}>{rm.name} ({rm.employeeId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                  >
                    <optgroup label="Smartbridge Departments">
                      <option value="Accounts Dept">Accounts Dept</option>
                      <option value="Business Development Dept">Business Development Dept</option>
                      <option value="HR Dept">HR Dept</option>
                      <option value="Marketing Dept.">Marketing Dept.</option>
                      <option value="Operations Dept.">Operations Dept.</option>
                      <option value="Product Dept">Product Dept</option>
                      <option value="Sales Dept">Sales Dept</option>
                      <option value="ServiceNow Dept">ServiceNow Dept</option>
                    </optgroup>
                    <optgroup label="Technical Dept Sub-Departments">
                      <option value="AI-ML Dept">AI-ML Dept</option>
                      <option value="Full Stack Dept">Full Stack Dept</option>
                      <option value="Salesforce Dept">Salesforce Dept</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Team / Stream</label>
                  <select
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none font-bold"
                  >
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="AI / ML">AI / ML</option>
                    <option value="ServiceNow">ServiceNow</option>
                    <option value="Salesforce">Salesforce</option>
                    <option value="Data Science">Data Science</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="QA">QA</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                  >
                    <option value="Intern">Intern</option>
                    <option value="Mentor">Mentor</option>
                    <option value="RM">Reporting Manager</option>
                    <option value="HR">HR Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors uppercase tracking-wider text-xs"
                >
                  {saving ? 'Updating Assignments...' : 'Save & Log Assignment'}
                </button>
              </div>

              {/* Assignment Audit History */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" /> Historical Re-assignment Log
                </h4>
                {history.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map(h => (
                      <div key={h._id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-bold uppercase text-[9px] text-indigo-500">{h.targetType} Change</span>
                          <p className="text-slate-600 dark:text-slate-300 font-medium">{h.previousValue} ➔ <strong className="text-indigo-600 dark:text-indigo-400">{h.newValue}</strong></p>
                        </div>
                        <span className="text-[9px] text-slate-400">{new Date(h.createdAt).toLocaleDateString()} by {h.assignedByName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-4">No previous reassignments logged for this user.</p>
                )}
              </div>
            </form>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm text-center space-y-3 flex flex-col items-center justify-center min-h-[350px]">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700" />
              <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">Select an employee from the left panel</h3>
              <p className="text-slate-400 text-xs max-w-sm">Re-assign their mentor, reporting manager, department, team stream or system role with full audit tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
