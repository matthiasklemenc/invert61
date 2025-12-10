import React from 'react';
import AdditionalYouTubeGrid from './AdditionalYouTubeGrid';
import { YouTubeChannelSlot } from './types';
import VideoCameraIcon from './VideoCameraIcon';
import SkateboardIcon from './skate_session_review/SkateboardIcon';
import MusicNoteIcon from './MusicNoteIcon';
import Logo from './Logo';

const ControllerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.75 4.5H4.25C2.455 4.5 1 5.955 1 7.75v8.5C1 18.045 2.455 19.5 4.25 19.5h15.5c1.795 0 3.25-1.455 3.25-3.25v-8.5c0-1.795-1.455-3.25-3.25-3.25zM6.25 9.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm2 5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm2-2.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm-2-2.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm10.5 5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm2.5-2.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" />
    </svg>
);

type Page = 'home' | 'music' | 'games' | 'editor' | 'rollometer' | 'skate-game' | 'skate-quiz' | 'general-quiz' | 'capitals-quiz' | 'trick-training' | 'trick-recording';

type Props = {
  onSetPage: (page: Page) => void;
  youTubeSlots: YouTubeChannelSlot[];
  onSetYouTubeSlots: React.Dispatch<React.SetStateAction<YouTubeChannelSlot[]>>;
};

const HomePage: React.FC<Props> = ({ onSetPage, youTubeSlots, onSetYouTubeSlots }) => {
  const NavButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="bg-gray-800 text-white rounded-xl shadow-lg flex flex-col items-center justify-center p-4 gap-2 transition-transform transform hover:scale-105 active:scale-100 border border-gray-700 hover:border-red-500/50"
    >
      <div className="w-12 h-12 text-red-500">{icon}</div>
      <span className="font-bold tracking-wider uppercase text-center text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6">
      <header className="w-full my-8">
        <div className="w-full max-w-4xl mx-auto relative text-center flex flex-col items-center">
          <div className="logo-block text-left leading-none">
            {/* New Logo Component - Home Variant */}
            <Logo variant="home" className="text-[70px] md:text-[80px]" />
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto flex-grow">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          <NavButton icon={<SkateboardIcon />} label="Session Tracker" onClick={() => onSetPage('rollometer')} />
          <NavButton icon={<MusicNoteIcon />} label="Music" onClick={() => onSetPage('music')} />
          <NavButton icon={<ControllerIcon />} label="Games" onClick={() => onSetPage('games')} />
          <NavButton icon={<VideoCameraIcon />} label="Video" onClick={() => onSetPage('editor')} />
        </div>
        
        <AdditionalYouTubeGrid
          slots={youTubeSlots}
          onSetSlots={onSetYouTubeSlots}
        />
      </main>
    </div>
  );
};

export default HomePage;