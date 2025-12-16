
import React from 'react';
import AdditionalYouTubeGrid from './AdditionalYouTubeGrid';
import { YouTubeChannelSlot } from './types';
import Logo from './Logo';

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
      className="bg-gray-800 text-white rounded-xl shadow-lg flex flex-col items-center justify-center p-4 gap-0 transition-transform transform hover:scale-105 active:scale-100 border border-gray-700 hover:border-red-500/50"
    >
      <div className="w-24 h-24 flex items-center justify-center">
        {icon}
      </div>
      <span className="font-bold tracking-wider uppercase text-center text-sm -mt-2">{label}</span>
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
          <NavButton 
            icon={<img src="./assets/homepage_icons/homepage_icon_session_tracker.png" alt="Tracker" className="w-full h-full object-contain translate-y-2.5" />} 
            label="Session Tracker" 
            onClick={() => onSetPage('rollometer')} 
          />
          <NavButton 
            icon={<img src="./assets/homepage_icons/homepage_icon_music.png" alt="Music" className="w-full h-full object-contain -translate-y-[5px]" />} 
            label="Music" 
            onClick={() => onSetPage('music')} 
          />
          <NavButton 
            icon={<img src="./assets/homepage_icons/homepage_icon_games.png" alt="Games" className="w-full h-full object-contain" />} 
            label="Games" 
            onClick={() => onSetPage('games')} 
          />
          <NavButton 
            icon={<img src="./assets/homepage_icons/homepage_icon_video.png" alt="Video" className="w-full h-full object-contain" />} 
            label="Video" 
            onClick={() => onSetPage('editor')} 
          />
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
