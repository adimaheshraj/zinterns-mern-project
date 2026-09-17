import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Shield,
  Briefcase,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function OrgTree({ onSelectUser }) {
  const { token, API_URL } = useApp();
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Expand / collapse map for nodes
  const [expandedNodes, setExpandedNodes] = useState({});

  const containerRef = useRef(null);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/org/tree`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTreeData(data);
        
        // Auto-expand root nodes
        const initExpand = {};
        if (data.tree) {
          data.tree.forEach(rm => {
            initExpand[rm.employeeId] = true;
            if (rm.mentors) {
              rm.mentors.forEach(m => {
                initExpand[m.employeeId] = true;
              });
            }
          });
        }
        setExpandedNodes(initExpand);
      }
    } catch (err) {
      console.error('Failed to fetch org tree', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [token, API_URL]);

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(Math.max(0.6, prev + delta), 1.5));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-xs font-semibold text-slate-400 mt-4 animate-pulse">Building interactive hierarchy tree...</p>
      </div>
    );
  }

  const hrRoots = treeData?.hrRoots || [];
  const hrReports = treeData?.hrReports || [];
  const managers = treeData?.tree || [];

  // Filter managers based on department & search
  const filteredManagers = managers.filter(rm => {
    const matchesDept = departmentFilter === 'All' || rm.department === departmentFilter;
    const matchesSearch = !searchTerm ||
      rm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rm.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rm.mentors?.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.interns?.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesDept && matchesSearch;
  });

  return (
    <div ref={containerRef} className={`space-y-4 ${isFullscreen ? 'bg-slate-950 p-6 overflow-auto text-white' : ''}`}>
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search person or ID in tree..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs outline-none font-bold"
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
        </div>

        {/* Zoom & Screen Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-400 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title="Reset Zoom"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded-xl transition-colors font-bold flex items-center gap-1 text-xs"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Exit' : 'Full Screen'}
          </button>
        </div>
      </div>

      {/* Visual Tree View Container */}
      <div className="overflow-auto p-8 rounded-3xl bg-slate-900/90 text-slate-100 border border-slate-800 shadow-2xl min-h-[550px] flex flex-col items-center">
        <div
          className="transition-transform duration-200 flex flex-col items-center space-y-12"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
        >
          {/* LEVEL 1: HR / ADMIN ROOTS */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full mb-4">
              HR / Executive Control
            </span>
            <div className="flex gap-6 flex-wrap justify-center">
              {hrRoots.map(hr => (
                <TreeNodeCard
                  key={hr._id}
                  user={hr}
                  levelColor="purple"
                  badgeText="HR Admin"
                  onSelectUser={onSelectUser}
                />
              ))}
            </div>
            {hrReports.length > 0 && (
              <>
                <div className="w-0.5 h-6 bg-purple-500/50"></div>
                <div className="flex gap-6 flex-wrap justify-center">
                  {hrReports.map(hr => (
                    <TreeNodeCard
                      key={hr._id}
                      user={hr}
                      levelColor="purple"
                      badgeText="Reports to CEO"
                      onSelectUser={onSelectUser}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* VERTICAL CONNECTING LINE */}
          <div className="w-0.5 h-8 bg-indigo-500/50"></div>

          {/* LEVEL 2: REPORTING MANAGERS */}
          <div className="flex flex-col items-center w-full">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full mb-6">
              Reporting Managers
            </span>

            <div className="flex flex-wrap gap-12 justify-center items-start w-full">
              {filteredManagers.map(rm => {
                const isRMExpanded = expandedNodes[rm.employeeId] !== false;
                const mentors = rm.mentors || [];

                return (
                  <div key={rm._id} className="flex flex-col items-center space-y-6 bg-slate-950/60 p-6 rounded-3xl border border-slate-800/80 shadow-xl">
                    <TreeNodeCard
                      user={rm}
                      levelColor="indigo"
                      badgeText="Reporting Manager"
                      reportsCount={rm.directReportsCount}
                      isExpanded={isRMExpanded}
                      onToggle={() => toggleNode(rm.employeeId)}
                      onSelectUser={onSelectUser}
                    />

                    {/* Mentors Branch */}
                    {isRMExpanded && mentors.length > 0 && (
                      <div className="flex flex-col items-center space-y-6 pt-2">
                        <div className="w-0.5 h-6 bg-emerald-500/50"></div>
                        <div className="flex gap-8 flex-wrap justify-center">
                          {mentors.map(m => {
                            const isMentorExpanded = expandedNodes[m.employeeId] !== false;
                            const interns = m.interns || [];

                            return (
                              <div key={m._id} className="flex flex-col items-center space-y-4">
                                <TreeNodeCard
                                  user={m}
                                  levelColor="emerald"
                                  badgeText="Mentor"
                                  reportsCount={interns.length}
                                  isExpanded={isMentorExpanded}
                                  onToggle={() => toggleNode(m.employeeId)}
                                  onSelectUser={onSelectUser}
                                />

                                {/* Interns Branch */}
                                {isMentorExpanded && interns.length > 0 && (
                                  <div className="flex flex-col items-center space-y-3">
                                    <div className="w-0.5 h-4 bg-pink-500/50"></div>
                                    <div className="flex gap-4 flex-wrap justify-center">
                                      {interns.map(intern => (
                                        <TreeNodeCard
                                          key={intern._id}
                                          user={intern}
                                          levelColor="pink"
                                          badgeText="Intern"
                                          onSelectUser={onSelectUser}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tree Node Card Component
function TreeNodeCard({ user, levelColor = "indigo", badgeText, reportsCount, isExpanded, onToggle, onSelectUser }) {
  const colorMap = {
    purple: 'border-purple-500/50 bg-purple-950/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    indigo: 'border-indigo-500/50 bg-indigo-950/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]',
    emerald: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    pink: 'border-pink-500/50 bg-pink-950/30 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
  };

  return (
    <div
      onClick={() => onSelectUser && onSelectUser(user.employeeId || user._id)}
      className={`w-60 p-4 rounded-2xl border ${colorMap[levelColor]} backdrop-blur-md cursor-pointer hover:scale-105 transition-all duration-200 relative group flex flex-col justify-between`}
    >
      <div className="flex items-start gap-3">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-11 h-11 rounded-xl object-cover border border-white/20 shadow-md"
          />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center font-extrabold text-sm border border-white/20">
            {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="overflow-hidden flex-1">
          <p className="font-extrabold text-xs text-white truncate group-hover:text-indigo-300 transition-colors">
            {user.name}
          </p>
          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
            ID: {user.employeeId}
          </span>
          <span className="text-[10px] font-semibold text-slate-300 block truncate mt-0.5">
            {user.designation || badgeText}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px]">
        <span className="px-2 py-0.5 rounded bg-white/10 font-extrabold uppercase">
          {user.department}
        </span>

        {reportsCount !== undefined && reportsCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggle) onToggle();
            }}
            className="flex items-center gap-1 font-bold text-white bg-white/15 px-2 py-0.5 rounded hover:bg-white/30 transition-colors"
          >
            <span>{reportsCount} reports</span>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}
