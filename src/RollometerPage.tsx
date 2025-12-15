
import React, { useState, useEffect, useCallback } from 'react';
import { Page, Session, UserSettings, Motion, AppState } from './skate_session_review/types';
import { MOTIONS } from './skate_session_review/constants';
import Onboarding from './skate_session_review/components/Onboarding';
import SessionTracker from './skate_session_review/components/SessionTracker';
import SessionHistory from './skate_session_review/components/SessionHistory';
import SkateboardIcon from './skate_session_review/SkateboardIcon';

// These props are passed from App.tsx but we will largely ignore 'sessions' 
// in favor of the locally managed 'skate_sense_sessions' to match the new tracker's data source.
type Props = {
    onClose: () => void;
    sessions: any[]; 
    onAddSession: (session: any) => void;
    onDeleteSession: (sessionId: string) => void;
    onViewSession: (session: any) => void;
    onSetPage: (page: any) => void;
};

const RollometerPage: React.FC<Props> = ({ onClose }) => {
  const [appState, setAppState] = useState<AppState>({
    page: Page.Onboarding,
    userSettings: null,
    sessions: [],
  });

  // Manage Motions State (persisted)
  const [motions, setMotions] = useState<Motion[]>(() => {
    try {
      const savedMotions = localStorage.getItem('skate_sense_motions');
      return savedMotions ? JSON.parse(savedMotions) : MOTIONS;
    } catch {
      return MOTIONS;
    }
  });

  useEffect(() => {
    // Load persisted state from localStorage on initial load
    try {
      const savedSettings = localStorage.getItem('skate_sense_settings');
      const savedSessions = localStorage.getItem('skate_sense_sessions');
      
      const userSettings = savedSettings ? JSON.parse(savedSettings) : null;
      const sessions = savedSessions ? JSON.parse(savedSessions) : [];

      if (userSettings) {
        // If we have settings, go straight to history
        setAppState({ page: Page.SessionHistory, userSettings, sessions });
      } else {
        setAppState(prev => ({ ...prev, sessions }));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const handleAddMotion = (name: string) => {
    const newMotion: Motion = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name
    };
    // Avoid duplicates
    if (motions.some(m => m.id === newMotion.id)) return;

    const updated = [newMotion, ...motions];
    setMotions(updated);
    localStorage.setItem('skate_sense_motions', JSON.stringify(updated));
  };

  const handleDeleteMotion = (id: string) => {
    const updated = motions.filter(m => m.id !== id);
    setMotions(updated);
    localStorage.setItem('skate_sense_motions', JSON.stringify(updated));
  };

  const handleOnboardingComplete = (settings: UserSettings) => {
    localStorage.setItem('skate_sense_settings', JSON.stringify(settings));
    setAppState(prev => ({ ...prev, userSettings: settings, page: Page.SessionTracker }));
  };

  const handleSessionComplete = useCallback((session: Session) => {
    setAppState(prev => {
      const updatedSessions = [...prev.sessions, session];
      localStorage.setItem('skate_sense_sessions', JSON.stringify(updatedSessions));
      return { ...prev, sessions: updatedSessions, page: Page.SessionHistory };
    });
  }, []);

  const handleSessionUpdate = useCallback((updatedSession: Session) => {
    setAppState(prev => {
      const updatedSessions = prev.sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
      localStorage.setItem('skate_sense_sessions', JSON.stringify(updatedSessions));
      return { ...prev, sessions: updatedSessions };
    });
  }, []);

  const handleDeleteSessionLocal = useCallback((sessionId: string) => {
    // Removed window.confirm to ensure delete works in all environments/webviews
    setAppState(prev => {
      const updatedSessions = prev.sessions.filter(s => s.id !== sessionId);
      localStorage.setItem('skate_sense_sessions', JSON.stringify(updatedSessions));
      return { ...prev, sessions: updatedSessions };
    });
  }, []);

  const navigate = (page: Page) => {
    setAppState(prev => ({ ...prev, page }));
  };

  const renderPage = () => {
    switch (appState.page) {
      case Page.Onboarding:
        return <Onboarding onComplete={handleOnboardingComplete} />;
      case Page.SessionTracker:
        return (
          <SessionTracker 
            onSessionComplete={handleSessionComplete} 
            previousSessions={appState.sessions} 
            onBack={() => navigate(Page.SessionHistory)}
            motions={motions}
          />
        );
      case Page.SessionHistory:
        return (
          <SessionHistory 
            navigate={navigate} 
            sessions={appState.sessions} 
            onSessionUpdate={handleSessionUpdate}
            onDeleteSession={handleDeleteSessionLocal}
            motions={motions}
            onAddMotion={handleAddMotion}
            onDeleteMotion={handleDeleteMotion}
            onBack={onClose} // Exit to main Home
          />
        );
      default:
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-mono flex flex-col items-center p-4 sm:p-6">
       <header className="flex items-center justify-between mb-6 relative h-10 w-full max-w-4xl">
            <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="text-center w-full absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
                <h1 className="text-xl font-bold tracking-wider text-cyan-400">SKATE SENSE</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Motion Tracker</p>
            </div>
       </header>

       <div className="w-full max-w-lg mx-auto flex-grow">
        {renderPage()}
       </div>
    </div>
  );
};

export default RollometerPage;
