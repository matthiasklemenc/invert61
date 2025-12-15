
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, Page, Session, UserSettings, Motion } from './types';
import { MOTIONS } from './constants';
import Onboarding from './components/Onboarding';
import SessionTracker from './components/SessionTracker';
import SessionHistory from './components/SessionHistory';

const App: React.FC = () => {
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
        setAppState({ page: Page.SessionHistory, userSettings, sessions });
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
    // Skip calibration, go straight to tracker
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

  const handleDeleteSession = useCallback((sessionId: string) => {
    if(confirm("Are you sure you want to delete this session permanently?")) {
        setAppState(prev => {
          const updatedSessions = prev.sessions.filter(s => s.id !== sessionId);
          localStorage.setItem('skate_sense_sessions', JSON.stringify(updatedSessions));
          return { ...prev, sessions: updatedSessions };
        });
    }
  }, []);

  const navigate = (page: Page) => {
    setAppState(prev => ({ ...prev, page }));
  };

  const renderPage = () => {
    switch (appState.page) {
      case Page.Onboarding:
        return <Onboarding onComplete={handleOnboardingComplete} />;
      case Page.SessionTracker:
        // Pass previous sessions so the tracker can learn from history
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
            onDeleteSession={handleDeleteSession}
            motions={motions}
            onAddMotion={handleAddMotion}
            onDeleteMotion={handleDeleteMotion}
            onBack={() => navigate(Page.Onboarding)}
          />
        );
      default:
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-mono flex flex-col items-center p-4">
       <div className="w-full max-w-lg mx-auto">
        <header className="text-center mb-6 py-4 border-b-2 border-cyan-400">
          <h1 className="text-3xl font-bold text-cyan-400 tracking-widest">SKATE SENSE</h1>
          <p className="text-sm text-gray-400">Your Digital Skate Companion</p>
        </header>
        <main>{renderPage()}</main>
      </div>
    </div>
  );
};

export default App;
