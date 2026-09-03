import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Compass,
  LayoutDashboard, 
  Upload, 
  Search, 
  MapPin, 
  History, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Waves,
  Clock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const location = useLocation();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Mission Overview', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload Sonar Scan', icon: Upload },
    { path: '/analysis', label: 'Analysis Workspace', icon: Search },
    { path: '/map', label: 'Map Tracker', icon: MapPin },
    { path: '/history', label: 'Scan History', icon: History },
    { path: '/reports', label: 'Reports & Export', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`bg-[#050E1E] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Identity Header */}
      <div>
        <div className={`p-4 border-b border-slate-800/80 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shadow-cyan-sm group-hover:border-[#38BDF8] transition-all">
              <Waves className="w-5 h-5 animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-display font-extrabold tracking-wider text-xl text-white flex items-center gap-1.5">
                  SAGARA
                </span>
                <span className="text-[9px] font-mono text-[#38BDF8]">
                  MARINE SURVEILLANCE
                </span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 font-sans">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-mono font-medium transition-all group relative ${
                  isActive
                    ? 'bg-[#0EA5E9]/15 text-[#38BDF8] border border-[#38BDF8]/40 font-bold shadow-cyan-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0B132B]/60'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#38BDF8]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Area: Operational Status, User Telemetry & Collapse Control */}
      <div className="p-3 border-t border-slate-800/80 space-y-3 font-mono text-xs">
        {!collapsed && (
          <>
            {/* Live Clock & Status */}
            <div className="bg-[#030712] p-3 rounded-lg border border-slate-800/80 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#38BDF8]" />
                  <span>UTC TIME:</span>
                </span>
                <span className="text-slate-200 font-bold">{utcTime || '00:09:00 UTC'}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/60 pt-1.5">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>SYSTEM:</span>
                </span>
                <span className="text-emerald-400 font-bold text-[10px]">OPERATIONAL</span>
              </div>
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-3 p-2 bg-[#0B132B]/40 rounded-lg border border-slate-800/60">
              <div className="w-8 h-8 rounded-full bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
                RS
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-slate-200 font-bold truncate text-[11px]">Capt. R. Sharma</div>
                <div className="text-slate-400 text-[10px] truncate">MoES Marine Analyst</div>
              </div>
            </div>
          </>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-[#0B132B]/60 border border-slate-800/80 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Bar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
