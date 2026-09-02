import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Waves, Bell, Radio, ExternalLink } from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const navLinks = [
    { path: '/home', label: 'Home' },
    { path: '/', label: 'Dashboard' },
    { path: '/new-analysis', label: 'Upload Scan' },
    { path: '/map', label: 'Map Tracker' },
    { path: '/history', label: 'History' },
    { path: '/report', label: 'Reports' },
  ];

  return (
    <header className="h-16 bg-[#020813]/90 backdrop-blur-md border-b border-[#13294B] px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Brand Identity DEEPSCAN */}
      <div className="flex items-center gap-8">
        <NavLink to="/home" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-[#050E1E] border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-cyan-sm group-hover:border-[#00F0FF] transition-all">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-extrabold tracking-widest text-lg text-white flex items-center gap-1.5">
              SAGARA <span className="text-[10px] text-[#00F0FF] font-normal px-1.5 py-0.2 bg-[#00F0FF]/10 rounded border border-[#00F0FF]/30">PRO</span>
            </span>
          </div>
        </NavLink>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-mono">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/' && link.path !== '/home' && location.pathname.startsWith(link.path));
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={`transition-colors py-1 ${
                  isActive
                    ? 'text-[#00F0FF] font-bold border-b-2 border-[#00F0FF]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Right: Notifications & Launch App CTA */}
      <div className="flex items-center gap-4">
        {/* System status pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#050E1E] border border-[#13294B] text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>System Status: <strong className="text-slate-200">Operational</strong></span>
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-[#050E1E] border border-[#13294B] text-slate-300 hover:text-[#00F0FF] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-[#020813]"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#050E1E] border border-[#13294B] rounded-lg shadow-2xl z-50 text-xs py-2 backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-[#13294B] flex justify-between items-center font-mono">
                <span className="font-bold text-slate-200">DEEPSCAN ALERTS</span>
                <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">3 NEW</span>
              </div>
              <div className="divide-y divide-[#13294B]/60 max-h-64 overflow-y-auto">
                <div className="px-3 py-2 hover:bg-[#0D1F3C]/50">
                  <p className="text-red-400 font-mono font-semibold">Ghost Net Target Detected</p>
                  <p className="text-slate-300 text-[11px]">Pune Coast Sector 4 (Confidence: 96.8%)</p>
                  <span className="text-[10px] text-slate-500 font-mono">10m ago</span>
                </div>
                <div className="px-3 py-2 hover:bg-[#0D1F3C]/50">
                  <p className="text-[#00F0FF] font-mono font-semibold">Pipeline Analysis Complete</p>
                  <p className="text-slate-300 text-[11px]">Scan OS-2026-0830 processed successfully</p>
                  <span className="text-[10px] text-slate-500 font-mono">35m ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Launch App Button */}
        <button
          onClick={() => navigate('/new-analysis')}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00F0FF]/20 to-[#0EA5E9]/20 hover:from-[#00F0FF]/30 hover:to-[#0EA5E9]/30 text-[#00F0FF] border border-[#00F0FF]/50 font-mono text-xs font-bold transition-all shadow-cyan-sm flex items-center gap-2"
        >
          <span>Launch App</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#0D1F3C] border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] font-mono text-xs font-bold">
          RS
        </div>
      </div>
    </header>
  );
};
