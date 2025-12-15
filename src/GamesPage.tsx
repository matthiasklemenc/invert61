import React from 'react';
import SkateboardIcon from './skate_session_review/SkateboardIcon';
import Logo from './Logo';

const ControllerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.75 4.5H4.25C2.455 4.5 1 5.955 1 7.75v8.5C1 18.045 2.455 19.5 4.25 19.5h15.5c1.795 0 3.25-1.455 3.25-3.25v-8.5c0-1.795-1.455-3.25-3.25-3.25zM6.25 9.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm2 5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm2-2.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm-2-2.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm10.5 5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zm2.5-2.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" />
    </svg>
);

const QuestionMarkIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.202a.75.75 0 01-1.5 0v-.202c0-.944.606-1.657 1.336-2.008a2.25 2.25 0 00.5-.33c.505-.442.505-1.217 0-1.659zM12 17.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

const CityIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M3 2.25a.75.75 0 00-.75.75v18a.75.75 0 00.75.75h18a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75h-1.5V9.75a.75.75 0 00-.75-.75h-3V5.25a.75.75 0 00-.75-.75H3zm3.75 6.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm0 3.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm0 3.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm6-6.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm0 3.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm6-6a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm0 3.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm0 3.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" clipRule="evenodd" />
    </svg>
);


type Page = 'home' | 'skate-game' | 'skate-quiz' | 'general-quiz' | 'capitals-quiz';

type Props = {
    onSetPage: (page: Page) => void;
};

const GamesPage: React.FC<Props> = ({ onSetPage }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 flex flex-col">
            <header className="w-full my-8 relative">
                <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center">
                    <button onClick={() => onSetPage('home')} className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="logo-block text-left leading-none">
                        <Logo variant="games" className="text-[70px] md:text-[80px]" />
                    </div>
                </div>
            </header>

            <main className="w-full max-w-2xl mx-auto flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => onSetPage('skate-game')} className="bg-neutral-800 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-4 h-40 hover:bg-neutral-700 transition-colors group">
                        <ControllerIcon className="w-12 h-12 text-yellow-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg tracking-wide">SKATE GAME</span>
                    </button>
                    <button onClick={() => onSetPage('skate-quiz')} className="bg-neutral-800 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-4 h-40 hover:bg-neutral-700 transition-colors group">
                        <SkateboardIcon className="w-12 h-12 text-[#c52323] group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg tracking-wide">SKATE QUIZ</span>
                    </button>
                    <button onClick={() => onSetPage('general-quiz')} className="bg-neutral-800 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-4 h-40 hover:bg-neutral-700 transition-colors group">
                        <QuestionMarkIcon className="w-12 h-12 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg tracking-wide">GENERAL QUIZ</span>
                    </button>
                    <button onClick={() => onSetPage('capitals-quiz')} className="bg-neutral-800 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-4 h-40 hover:bg-neutral-700 transition-colors group">
                        <CityIcon className="w-12 h-12 text-teal-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg tracking-wide">CAPITALS QUIZ</span>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default GamesPage;
