import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/common/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewAnalysisPage } from './pages/NewAnalysisPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportPage } from './pages/ReportPage';
import { MapPage } from './pages/MapPage';
import { SettingsPage } from './pages/SettingsPage';
import { MissionProvider } from './context/MissionContext';

function AppLayout() {
  const location = useLocation();
  // Check if current route is Landing Page ('/' or '/home')
  const isLandingPage = location.pathname === '/' || location.pathname === '/home';

  return (
    <div className="flex h-screen overflow-hidden bg-[#030712] text-slate-200 font-sans">
      {/* Suppress left sidebar completely on Landing Page for true full-width cinematic view */}
      {!isLandingPage && <Sidebar />}

      {/* Dynamic Main Workspace Container */}
      <main className="flex-1 overflow-y-auto bg-[#030712] relative">
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />

          {/* Internal Workstation Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/new-analysis" element={<NewAnalysisPage />} />
          <Route path="/upload" element={<NewAnalysisPage />} />
          <Route path="/processing" element={<ProcessingPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/analysis" element={<ResultsPage />} />
          <Route path="/detection/:id" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <MissionProvider>
        <AppLayout />
      </MissionProvider>
    </Router>
  );
}

export default App;
