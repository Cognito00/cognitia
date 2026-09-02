import React, { createContext, useContext, useState, useEffect } from 'react';
import { Mission, MissionStats } from '../lib/types/sagaraModel';
import { missionService } from '../lib/services/missionService';

interface MissionContextType {
  activeMission: Mission | null;
  setActiveMission: (mission: Mission | null) => void;
  missions: Mission[];
  loading: boolean;
  selectMissionById: (missionId: string) => Promise<Mission | null>;
  refreshMissions: () => Promise<void>;
  stats: MissionStats;
  demoMode: boolean;
  toggleDemoMode: () => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [stats, setStats] = useState<MissionStats>({
    totalMissions: 42,
    totalDebrisDetected: 4812,
    avgConfidence: 93.4,
    areaSurveyedKm2: 14.8
  });

  const refreshMissions = async () => {
    setLoading(true);
    try {
      const data = await missionService.getMissions();
      setMissions(data);
      if (data.length > 0 && !activeMission) {
        setActiveMission(data[0]);
      }
      const aggregatedStats = await missionService.getMissionStats();
      setStats(aggregatedStats);
    } catch (e) {
      console.error('Failed to load SAGARA survey missions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMissions();
  }, []);

  const selectMissionById = async (missionId: string): Promise<Mission | null> => {
    const found = missions.find((m) => m.missionId.toLowerCase() === missionId.toLowerCase());
    if (found) {
      setActiveMission(found);
      return found;
    }
    const fetched = await missionService.getMissionById(missionId);
    if (fetched) {
      setActiveMission(fetched);
    }
    return fetched;
  };

  const toggleDemoMode = () => {
    setDemoMode((prev) => !prev);
  };

  return (
    <MissionContext.Provider
      value={{
        activeMission,
        setActiveMission,
        missions,
        loading,
        selectMissionById,
        refreshMissions,
        stats,
        demoMode,
        toggleDemoMode
      }}
    >
      {children}
    </MissionContext.Provider>
  );
};

export const useMissionContext = () => {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error('useMissionContext must be used within a MissionProvider');
  }
  return context;
};
