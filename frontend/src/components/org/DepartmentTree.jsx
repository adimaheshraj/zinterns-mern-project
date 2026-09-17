import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  CheckCircle,
  Clock,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DepartmentTree({ onSelectTeam }) {
  const { token, API_URL } = useApp();
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Collapsible states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSmartbridgeExpanded, setIsSmartbridgeExpanded] = useState(true);
  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(true);

  // Selected department for right panel detail view
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    async function fetchDeptTree() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/org/department-tree`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTreeData(data);
          // Set initial default selected department to AI-ML Dept or first dept
          if (data.technicalDeptGroup?.subDepartments?.length > 0) {
            setSelectedDept(data.technicalDeptGroup.subDepartments[0]);
          } else if (data.smartbridgeDepartments?.length > 0) {
            setSelectedDept(data.smartbridgeDepartments[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch department tree', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDeptTree();
  }, [token, API_URL]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-xs font-semibold text-slate-400 mt-3">Loading Organization Department Tree...</p>
      </div>
    );
  }

  const smartbridgeDepts = treeData?.smartbridgeDepartments || [];
  const technicalDepts = treeData?.technicalDeptGroup?.subDepartments || [];

  // Filter items based on search query
  const filteredSmartbridge = smartbridgeDepts.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTechnical = technicalDepts.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-white/10">
        <div>
          <span className="text-[10px] px-3 py-1 bg-white/20 backdrop-blur-md rounded-full font-bold uppercase tracking-wider">
            Enterprise Hierarchy
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-tight">Organization & Department Tree</h1>
          <p className="text-xs text-indigo-200 mt-1">
            Browse main departments under Smartbridge and sub-departments under Technical Dept.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
          <Building className="w-6 h-6 text-indigo-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* LEFT PANEL: Department Hierarchy Tree (Matching reference screenshot) */}
        <div className="md:col-span-1 rounded-3xl bg-slate-900 text-slate-100 p-5 border border-slate-800 shadow-2xl space-y-4">
          {/* Search Bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Department"
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none text-slate-200 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tree Structure */}
          <div className="space-y-3 font-medium text-xs">
            {/* 1. Smartbridge Root Group */}
            <div className="space-y-1">
              <div
                onClick={() => setIsSmartbridgeExpanded(!isSmartbridgeExpanded)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer font-bold text-slate-200"
              >
                <div className="flex items-center gap-2">
                  {isSmartbridgeExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>Smartbridge</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-400">
                  {treeData?.smartbridgeCount || 9}
                </span>
              </div>

              {isSmartbridgeExpanded && (
                <div className="pl-6 space-y-1 border-l border-slate-800 ml-3">
                  {filteredSmartbridge.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDept(dept)}
                      className={`p-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                        selectedDept?.name === dept.name
                          ? 'bg-indigo-600 text-white font-extrabold shadow-md'
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      <span>{dept.name}</span>
                      <span className="text-[10px] font-mono opacity-80">{dept.strength}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Technical Dept Parent Group */}
            <div className="space-y-1 pt-2">
              <div
                onClick={() => setIsTechnicalExpanded(!isTechnicalExpanded)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer font-bold text-slate-200"
              >
                <div className="flex items-center gap-2">
                  {isTechnicalExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>Technical Dept</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-400">
                  {treeData?.technicalDeptGroup?.count || 3}
                </span>
              </div>

              {isTechnicalExpanded && (
                <div className="pl-6 space-y-1 border-l border-indigo-500/30 ml-3">
                  {filteredTechnical.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDept(dept)}
                      className={`p-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                        selectedDept?.name === dept.name
                          ? 'bg-indigo-600 text-white font-extrabold shadow-md'
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      <span>{dept.name}</span>
                      <span className="text-[10px] font-mono opacity-80">{dept.strength}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Selected Department Team Details & Telemetry */}
        <div className="md:col-span-2">
          {selectedDept ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-6">
              {/* Department Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-full">
                      Parent: {selectedDept.parent}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{selectedDept.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Reporting Manager: <strong className="text-slate-700 dark:text-slate-200">{selectedDept.reportingManager}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Strength</span>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{selectedDept.strength} Members</p>
                </div>
              </div>

              {/* Attendance & Status Metrics Cards */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase">Present</span>
                  <p className="text-xl font-black">{selectedDept.presentToday || 0}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase">WFH</span>
                  <p className="text-xl font-black">{selectedDept.wfhToday || 0}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 text-amber-700 dark:text-amber-400 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase">Leave</span>
                  <p className="text-xl font-black">{selectedDept.onLeave || 0}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-rose-700 dark:text-rose-400 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase">Absent</span>
                  <p className="text-xl font-black">{selectedDept.absentToday || 0}</p>
                </div>
              </div>

              {/* Mentors & Interns Assigned List */}
              <div className="space-y-4 pt-2">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> Allocated Mentors & Interns
                </h3>

                {selectedDept.mentors?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDept.mentors.map((m) => {
                      const mInterns = selectedDept.interns?.filter(i => String(i.mentor) === String(m.employeeId) || String(i.mentor) === String(m._id)) || [];

                      return (
                        <div key={m._id} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold flex items-center justify-center text-xs">
                                {m.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{m.name} <span className="text-[10px] font-normal text-slate-400">({m.employeeId})</span></p>
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Mentor</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                              {mInterns.length} Interns
                            </span>
                          </div>

                          {mInterns.length > 0 && (
                            <div className="pl-6 space-y-1.5 border-l-2 border-indigo-500/30 pt-1">
                              {mInterns.map((i) => (
                                <div key={i._id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{i.name} ({i.employeeId})</span>
                                  <span className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-slate-500">{i.workMode || 'Office'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl">
                    No active mentors or interns assigned directly to {selectedDept.name} yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
              Select a department from the tree on the left to view detailed team metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
