import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { 
  Waves, 
  ArrowRight, 
  Target, 
  ChevronDown
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-slate-950 text-slate-200 font-sans select-none flex flex-col justify-between">
      {/* 1. CINEMATIC FULL-BLEED UNDERWATER HUMPBACK WHALE BACKGROUND CANVAS */}
      <img 
        src="/hero-whale.jpg" 
        alt="SAGARA Deep Ocean Whale Canvas" 
        className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-90" 
      />

      {/* 2. DIRECTIONAL VIGNETTE & LEFT GRADIENT OVERLAY FOR TEXT CONTRAST */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 z-10 pointer-events-none" />

      {/* 3. BOTTOM-LEFT SONAR/BATHYMETRIC CONTOUR-LINE DECORATION */}
      <div className="absolute bottom-10 left-10 w-96 h-64 opacity-20 pointer-events-none z-10">
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <path d="M 10 100 Q 80 40 150 100 T 290 100" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 10 130 Q 80 70 150 130 T 290 130" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="6 6" />
          <path d="M 10 160 Q 80 100 150 160 T 290 160" fill="none" stroke="#38BDF8" strokeWidth="1.5" />
          <circle cx="150" cy="100" r="45" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 4" />
          <circle cx="150" cy="100" r="75" fill="none" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2 6" />
        </svg>
      </div>

      {/* 4. FLOATING TRANSLUCENT TOP NAVIGATION BAR */}
      <header className="h-20 bg-slate-950/40 backdrop-blur-md px-10 flex items-center justify-between z-50">
        {/* Top-left: SAGARA Logo & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shadow-cyan-sm">
            <Waves className="w-6 h-6 animate-pulse text-[#38BDF8]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-extrabold tracking-wider text-xl text-white">
              SAGARA
            </span>
            <span className="text-[10px] text-[#38BDF8] font-mono tracking-widest uppercase">
              SONAR AI DETECTION
            </span>
          </div>
        </div>

        {/* Center: Menu Navigation Links */}
        <nav className="hidden md:flex items-center gap-10 text-xs font-mono">
          <NavLink to="/" className="text-[#38BDF8] font-bold border-b-2 border-[#38BDF8] py-1">Home</NavLink>
          <a href="#mission" className="text-slate-300 hover:text-[#38BDF8] py-1 transition-colors">Mission</a>
          <a href="#technology" className="text-slate-300 hover:text-[#38BDF8] py-1 transition-colors">Technology</a>
          <NavLink to="/dashboard" className="text-slate-300 hover:text-[#38BDF8] py-1 transition-colors">Dashboard</NavLink>
          <a href="#contact" className="text-slate-300 hover:text-[#38BDF8] py-1 transition-colors">Contact</a>
        </nav>

        {/* Top-right: Launch App CTA Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 rounded-full bg-slate-950/80 hover:bg-[#38BDF8] text-[#38BDF8] hover:text-slate-950 border border-[#38BDF8]/60 font-mono text-xs font-bold transition-all shadow-cyan-glow flex items-center gap-2 cursor-pointer group"
        >
          <span>Launch App</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      {/* 5. HERO CONTENT CANVAS (UNCLUTTERED LEFT NARRATIVE ONLY, ZERO RIGHT METRIC STATS) */}
      <div className="relative z-20 max-w-[1600px] mx-auto px-10 pt-12 pb-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left Hero Narrative */}
        <div className="lg:col-span-8 space-y-6 animate-fade-up">
          {/* Tag Label */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#38BDF8] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
              <span>SONAR AI DETECTION</span>
            </div>
            <div className="w-12 h-0.5 bg-[#38BDF8]/60 rounded-full" />
          </div>

          {/* Primary Editorial Display Title */}
          <h1 className="text-5xl sm:text-7xl font-display font-bold tracking-tight text-white leading-[1.08] max-w-3xl">
            Exploring the Ocean.<br />
            Protecting our <span className="text-[#38BDF8] font-display">Future.</span>
          </h1>

          {/* Subtext Copy */}
          <p className="text-base sm:text-lg text-slate-300 font-sans max-w-xl leading-relaxed">
            SAGARA uses advanced side-scan sonar imaging and deep learning AI classification to detect ocean debris, ghost fishing nets, and submerged structures to protect vulnerable marine ecosystems.
          </p>

          {/* Begin Mission CTA Button */}
          <div className="pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="px-7 py-3.5 rounded-full bg-slate-950/80 hover:bg-[#38BDF8] text-[#38BDF8] hover:text-slate-950 border border-[#38BDF8]/60 font-mono text-xs font-bold transition-all shadow-cyan-glow flex items-center gap-3 group cursor-pointer"
            >
              <Target className="w-4 h-4 text-[#38BDF8] group-hover:text-slate-950" />
              <span>Begin Mission</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right side is kept completely clean and uncluttered matching prompt instructions */}
        <div className="lg:col-span-4 hidden lg:block" />
      </div>

      {/* 6. BOTTOM CENTER SCROLL INDICATOR */}
      <div className="relative z-20 pb-6 flex flex-col items-center justify-center space-y-1.5 text-slate-400 font-mono text-[11px]">
        <div className="flex items-center gap-2 bg-slate-950/70 px-4 py-1 rounded-full border border-slate-800/80 backdrop-blur-md">
          <span className="w-2 h-4 rounded-full border border-slate-400 flex justify-center p-0.5">
            <span className="w-1 h-1 rounded-full bg-[#38BDF8] animate-bounce" />
          </span>
          <span>Scroll to explore</span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500 animate-pulse" />
      </div>
    </div>
  );
};
