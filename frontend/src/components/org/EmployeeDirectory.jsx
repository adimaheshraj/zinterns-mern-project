import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreVertical,
  Shield,
  Briefcase,
  MapPin,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function EmployeeDirectory({ onOpenAddEmployee, onSelectEmployee }) {
  const { user, token, API_URL } = useApp();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sorting & Pagination
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    fetchDirectory();
  }, [token, API_URL]);

  // Handle account status toggle (HR only)
  const handleToggleStatus = async (empId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`${API_URL}/org/users/${empId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchDirectory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !search ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      (emp.designation && emp.designation.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
    const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;
    const matchesTeam = teamFilter === 'All' || emp.team === teamFilter;
    const matchesWorkMode = workModeFilter === 'All' || emp.workMode === workModeFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesDept && matchesTeam && matchesWorkMode && matchesStatus;
  });

  // Sort logic
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ["Employee ID", "Name", "Email", "Role", "Designation", "Department", "Team", "Reporting Manager", "Mentor", "Work Mode", "Location", "Joining Date", "Status"];
    const rows = sortedEmployees.map(e => [
      e.employeeId,
      `"${e.name}"`,
      e.email,
      e.role,
      `"${e.designation || e.role}"`,
      `"${e.department}"`,
      `"${e.team || 'General'}"`,
      e.reportingManager || 'N/A',
      e.mentor || 'N/A',
      e.workMode || 'Office',
      `"${e.location || 'Headquarters'}"`,
      e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : 'N/A',
      e.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZInterns_Employee_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isHR = ['Super Admin', 'HR'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-white/10">
        <div>
          <span className="text-[10px] px-3 py-1 bg-white/20 backdrop-blur-md rounded-full font-bold uppercase tracking-wider">
            Employee Operations
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-tight">Enterprise Employee Directory</h1>
          <p className="text-xs text-indigo-200 mt-1">Manage all organization staff, assigned mentors, managers & work profiles.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-xs border border-white/15"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          {isHR && (
            <button
              onClick={onOpenAddEmployee}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition-opacity flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <UserPlus className="w-4 h-4" /> + Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, email..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none font-bold"
            >
              <option value="All">All Departments</option>
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

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none font-bold"
            >
              <option value="All">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="HR">HR Admin</option>
              <option value="RM">Reporting Manager</option>
              <option value="Mentor">Mentor</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          {/* Work Mode Filter */}
          <div>
            <select
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none font-bold"
            >
              <option value="All">All Work Modes</option>
              <option value="Office">Office</option>
              <option value="WFH">WFH</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 outline-none font-bold"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-xs font-semibold text-slate-400 mt-3">Fetching directory records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/60 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="p-4 cursor-pointer" onClick={() => handleSort('employeeId')}>
                    <span className="flex items-center gap-1">Employee ID <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">Employee Name <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSort('role')}>
                    <span className="flex items-center gap-1">Role & Designation <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSort('department')}>
                    <span className="flex items-center gap-1">Department & Team <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="p-4">Mentor / Manager</th>
                  <th className="p-4">Work Mode</th>
                  <th className="p-4">Status</th>
                  {isHR && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>

              <tbody className="divide-y border-slate-100 dark:divide-slate-800/60">
                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((emp) => (
                    <tr
                      key={emp._id}
                      onClick={() => onSelectEmployee && onSelectEmployee(emp.employeeId)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                        {emp.employeeId}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {emp.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center">
                              {emp.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                              {emp.name}
                            </p>
                            <span className="text-[10px] text-slate-400">Joined: {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-500">
                        <p>{emp.email}</p>
                        <p className="text-[10px] text-slate-400">{emp.phone || 'No phone'}</p>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase inline-block ${
                          emp.role === 'Super Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          emp.role === 'HR' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' :
                          emp.role === 'RM' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                          emp.role === 'Mentor' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {emp.role}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{emp.designation || emp.role}</p>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-700 dark:text-slate-200">{emp.department}</p>
                        <p className="text-[10px] text-slate-400">{emp.team || 'General'}</p>
                      </td>

                      <td className="p-4 text-slate-500">
                        <p>Mentor: <strong className="text-slate-700 dark:text-slate-300">{emp.mentor || 'None'}</strong></p>
                        <p className="text-[10px]">Manager: <strong className="text-slate-700 dark:text-slate-300">{emp.reportingManager || 'None'}</strong></p>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-600 dark:text-slate-300">
                          {emp.workMode || 'Office'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          emp.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                          {emp.status}
                        </span>
                      </td>

                      {isHR && (
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleStatus(emp._id, emp.status)}
                            className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                              emp.status === 'active'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}
                          >
                            {emp.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isHR ? 9 : 8} className="p-8 text-center text-slate-400 font-medium">
                      No matching employee records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Pagination */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {paginatedEmployees.length} of {sortedEmployees.length} employees</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 dark:text-slate-300">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
