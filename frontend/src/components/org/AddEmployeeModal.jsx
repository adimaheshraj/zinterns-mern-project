import React, { useState, useEffect } from 'react';
import { X, UserPlus, Sparkles, Check, Copy, Shield, Users, Briefcase, Building } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AddEmployeeModal({ isOpen, onClose, onUserCreated }) {
  const { token, API_URL } = useApp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('INTERN');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Technical');
  const [team, setTeam] = useState('Full Stack Development');
  const [reportingManager, setReportingManager] = useState('');
  const [mentor, setMentor] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [internshipStartDate, setInternshipStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [internshipEndDate, setInternshipEndDate] = useState('');
  const [workMode, setWorkMode] = useState('Office');
  const [location, setLocation] = useState('Headquarters');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [createdData, setCreatedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const [availableRMs, setAvailableRMs] = useState([]);
  const [availableAuthorities, setAvailableAuthorities] = useState([]);
  const [availableMentors, setAvailableMentors] = useState([]);
  const [availableDepts, setAvailableDepts] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    async function fetchOrgData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [dirRes, deptRes] = await Promise.all([
          fetch(`${API_URL}/org/directory`, { headers }),
          fetch(`${API_URL}/org/departments`, { headers })
        ]);

        if (dirRes.ok) {
          const users = await dirRes.json();
          setAvailableRMs(users.filter(u => u.role === 'RM' && u.status === 'active'));
          setAvailableAuthorities(users.filter(u => ['HR', 'Super Admin'].includes(u.role) && u.status === 'active'));
          setAvailableMentors(users.filter(u => u.role === 'Mentor' && u.status === 'active'));
        }
        if (deptRes.ok) {
          const depts = await deptRes.json();
          setAvailableDepts(depts);
        }
      } catch (err) {
        console.error('Error loading modal dropdown options', err);
      }
    }
    fetchOrgData();
  }, [isOpen, token, API_URL]);

  const reportingManagerOptions = role === 'REPORTING_MANAGER' ? availableAuthorities : availableRMs;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload = {
        firstName,
        lastName,
        email,
        phone,
        role,
        designation: designation || (role === 'INTERN' ? 'Software Intern' : role),
        department,
        team,
        reportingManager,
        mentor,
        joiningDate,
        internshipStartDate,
        internshipEndDate,
        workMode,
        location
      };

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user account');
      }

      setCreatedData(data);
      if (onUserCreated) onUserCreated();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdData?.temporaryCredentials) return;
    const text = `ZInterns Credentials:\nUsername: ${createdData.temporaryCredentials.username}\nTemp Password: ${createdData.temporaryCredentials.password}\nEmployee ID: ${createdData.user.employeeId}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForm = () => {
    setCreatedData(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('INTERN');
    setDesignation('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Add New Employee</h2>
              <p className="text-xs text-indigo-100">Create credentials and assign hierarchy role & team</p>
            </div>
          </div>
          <button
            onClick={handleResetForm}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credentials Created Success Banner */}
        {createdData ? (
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-2xl shadow-inner animate-bounce">
              ✓
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                Employee Account Created Successfully!
              </h3>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                ✉️ {createdData.message || `Credentials dispatched to ${createdData.user.email}`}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left space-y-3 font-mono text-xs relative">
              <div className="flex items-center justify-between text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <span>Temporary Account Credentials</span>
                <button
                  onClick={handleCopyCredentials}
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Credentials'}
                </button>
              </div>
              <div>Registered Email: <span className="font-bold text-slate-800 dark:text-slate-200">{createdData.user.email}</span></div>
              <div>Username: <span className="font-bold text-slate-800 dark:text-slate-200">{createdData.temporaryCredentials.username}</span></div>
              <div>Temp Password: <span className="font-bold text-indigo-600 dark:text-indigo-400">{createdData.temporaryCredentials.password}</span></div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                * Real-time credentials email dispatched to <strong>{createdData.user.email}</strong>. Password change enforced on first login.
              </div>
            </div>

            <button
              onClick={handleResetForm}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold animate-pulse">
                {errorMsg}
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> 1. Personal & Identity
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-400 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kumar"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramesh.k@zinterns.com"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Role & Designation */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> 2. Role & Hierarchy Position
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-400 block mb-1">System Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                  >
                    <option value="INTERN">Intern</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="REPORTING_MANAGER">Reporting Manager</option>
                    <option value="HR">HR Admin</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Fullstack Intern, Senior Mentor"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Department & Assignments */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> 3. Organization Allocation
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none font-bold text-indigo-600 dark:text-indigo-400"
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
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Reporting Manager</label>
                  <select
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                  >
                    <option value="">Select Reporting Manager</option>
                    {reportingManagerOptions.map(manager => (
                      <option key={manager._id} value={manager.employeeId}>{manager.name} ({manager.employeeId})</option>
                    ))}
                  </select>
                </div>
                {role === 'INTERN' && (
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Assigned Mentor</label>
                    <select
                      value={mentor}
                      onChange={(e) => setMentor(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                    >
                      <option value="">Select Mentor</option>
                      {availableMentors.map(m => (
                        <option key={m._id} value={m.employeeId}>{m.name} ({m.employeeId})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Work Mode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="font-bold text-slate-400 block mb-1">Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-400 block mb-1">Work Mode</label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                >
                  <option value="Office">Office</option>
                  <option value="WFH">WFH</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-400 block mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Headquarters"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                {loading ? 'Creating Employee...' : 'Create Employee Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
