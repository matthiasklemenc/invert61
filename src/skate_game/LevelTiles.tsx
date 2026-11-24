import React from 'react';
import { gameAssetUrl } from './GameConstants';

// ------------------------------------------------------------------
//  Level selection tiles (Games → Skateboard-Game → menu)
//  open    = can be played (tap starts the level)
//  locked  = previous level not finished yet (dark + lock)
//  soon    = not built yet (grey, "under construction")
//  done    = level finished (green check)
// ------------------------------------------------------------------

export type Lang = 'de' | 'en' | 'es';
export type TileState = 'open' | 'locked' | 'soon';

export interface LevelTileInfo {
    level: number;
    state: TileState;
    done?: boolean;
    onPlay?: () => void;
}

const NAMES: Record<number, Record<Lang, string>> = {
    1: { de: 'Street', en: 'Street', es: 'Street' },
    2: { de: 'Stadt, Himmel & Meer', en: 'City, Sky & Sea', es: 'Ciudad, Cielo y Mar' },
    3: { de: 'Dinoland', en: 'Dinoland', es: 'Dinolandia' },
    4: { de: 'Weltraum', en: 'Space', es: 'Espacio' },
};

const TXT: Record<string, Record<Lang, string>> = {
    title: { de: 'LEVELS', en: 'LEVELS', es: 'NIVELES' },
    soon: { de: 'BALD', en: 'SOON', es: 'PRONTO' },
    locked: { de: 'GESPERRT', en: 'LOCKED', es: 'BLOQUEADO' },
};

// language of the game: taken from the Level 3 / Level 2 save, otherwise from the phone
export function getGameLang(): Lang {
    const ok = (l: any): l is Lang => l === 'de' || l === 'en' || l === 'es';
    try {
        const l3 = JSON.parse(localStorage.getItem('invert61-level3') || 'null');
        if (l3 && ok(l3.lang)) return l3.lang;
        const l2 = JSON.parse(localStorage.getItem('invert61-level2') || 'null');
        if (l2 && ok(l2.lang)) return l2.lang;
    } catch { /* ignore */ }
    const nav = (typeof navigator !== 'undefined' ? navigator.language || '' : '').slice(0, 2).toLowerCase();
    return ok(nav) ? nav : 'de';
}

// ---------------- pictures (own drawings, viewBox 100 x 100) ----------------

const PicStreet = () => (
    <div className="relative w-full h-full">
    <svg viewBox="0 0 100 100" className="w-full h-full block">
        <defs>
            <linearGradient id="lt-sky1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3a8ee6" />
                <stop offset="1" stopColor="#ffc46b" />
            </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#lt-sky1)" />
        {/* city */}
        <g fill="#4b5a78">
            <rect x="0" y="48" width="14" height="40" />
            <rect x="15" y="38" width="12" height="50" />
            <rect x="29" y="52" width="16" height="36" />
            <rect x="70" y="42" width="13" height="46" />
            <rect x="84" y="54" width="16" height="34" />
        </g>
        <g fill="#ffe9a8">
            <rect x="18" y="43" width="3" height="3" /><rect x="22" y="50" width="3" height="3" />
            <rect x="73" y="47" width="3" height="3" /><rect x="77" y="55" width="3" height="3" />
            <rect x="4" y="54" width="3" height="3" /><rect x="88" y="60" width="3" height="3" />
        </g>
        {/* street */}
        <rect y="86" width="100" height="14" fill="#555" />
        <rect y="86" width="100" height="2" fill="#888" />
        <g fill="#ddd"><rect x="8" y="93" width="12" height="2" /><rect x="44" y="93" width="12" height="2" /><rect x="80" y="93" width="12" height="2" /></g>
        {/* shadow */}
        <ellipse cx="50" cy="89" rx="14" ry="2" fill="#000" opacity="0.3" />
    </svg>
    {/* Kai (his own picture from Level 1), a little in the air above the street */}
    <img
        src={gameAssetUrl('kai/kai_ride_1.png')}
        alt="Kai"
        draggable={false}
        className="absolute"
        style={{ left: '50%', bottom: '14%', height: '66%', transform: 'translateX(-50%) rotate(-6deg)' }}
    />
    </div>
);

const PicKraken = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full block">
        <defs>
            <linearGradient id="lt-sea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1f7fc4" />
                <stop offset="1" stopColor="#0a1f45" />
            </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#lt-sea)" />
        <g fill="#ffffff" opacity="0.18">
            <path d="M10 0 L22 0 L4 60 Z" /><path d="M60 0 L70 0 L52 50 Z" />
        </g>
        {/* tentacles */}
        <g stroke="#7a2f8f" strokeWidth="7" fill="none" strokeLinecap="round">
            <path d="M34 62 Q20 72 24 84 Q28 92 18 96" />
            <path d="M42 66 Q36 82 44 90" />
            <path d="M58 66 Q64 82 56 92" />
            <path d="M66 62 Q82 70 78 82 Q75 90 86 94" />
            <path d="M30 56 Q12 56 8 70" />
            <path d="M70 56 Q88 54 92 68" />
        </g>
        <g fill="#f0a6ff" opacity="0.8">
            <circle cx="24" cy="82" r="1.4" /><circle cx="44" cy="84" r="1.4" /><circle cx="57" cy="86" r="1.4" /><circle cx="79" cy="80" r="1.4" />
            <circle cx="12" cy="64" r="1.4" /><circle cx="88" cy="62" r="1.4" />
        </g>
        {/* head */}
        <path d="M24 60 Q20 22 50 16 Q80 22 76 60 Q64 70 50 68 Q36 70 24 60 Z" fill="#9b3fb3" stroke="#3d1048" strokeWidth="1.5" />
        <g fill="#c06ad6" opacity="0.7"><circle cx="38" cy="28" r="3" /><circle cx="62" cy="26" r="2.4" /><circle cx="68" cy="40" r="2" /></g>
        {/* one big eye */}
        <circle cx="50" cy="44" r="13" fill="#fff8d8" stroke="#3d1048" strokeWidth="1.5" />
        <circle cx="50" cy="45" r="7" fill="#d43c2c" />
        <ellipse cx="50" cy="45" rx="2.2" ry="5.5" fill="#111" />
        <circle cx="46" cy="40" r="2" fill="#fff" />
        <path d="M36 32 L48 36 M64 32 L52 36" stroke="#3d1048" strokeWidth="2.4" strokeLinecap="round" />
        {/* bubbles */}
        <g fill="none" stroke="#bfe6ff" strokeWidth="1">
            <circle cx="86" cy="24" r="3" /><circle cx="90" cy="14" r="2" /><circle cx="14" cy="30" r="2.5" /><circle cx="10" cy="20" r="1.6" />
        </g>
    </svg>
);

const PicTrex = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full block">
        <defs>
            <linearGradient id="lt-dino" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff9b4a" />
                <stop offset="1" stopColor="#ffe08a" />
            </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#lt-dino)" />
        {/* volcano */}
        <path d="M58 70 L74 30 L82 30 L98 70 Z" fill="#6b4a3a" />
        <path d="M74 30 Q78 24 82 30 Z" fill="#ff4b1f" />
        <path d="M76 28 Q72 14 78 6 Q84 16 80 28 Z" fill="#555" opacity="0.6" />
        {/* ground + plants */}
        <rect y="78" width="100" height="22" fill="#5a8a3a" />
        <path d="M6 78 Q10 64 14 78 M88 78 Q92 66 96 78" stroke="#2f5d22" strokeWidth="3" fill="none" />
        {/* T-Rex */}
        <g stroke="#1d3a17" strokeWidth="1.4" strokeLinejoin="round">
            {/* tail */}
            <path d="M40 54 Q20 56 4 70 Q22 66 42 64 Z" fill="#4f9a3c" />
            {/* legs */}
            <path d="M42 60 L38 80 L46 80 L50 64 Z" fill="#43862f" />
            <path d="M54 60 L54 80 L62 80 L60 62 Z" fill="#4f9a3c" />
            {/* body */}
            <path d="M36 52 Q44 38 60 40 Q70 42 68 58 Q60 68 44 64 Q34 60 36 52 Z" fill="#5cb048" />
            {/* neck + head */}
            <path d="M58 44 Q60 30 66 24 L88 24 Q94 26 92 32 L80 34 L90 38 Q88 44 78 42 Q70 44 66 52 Z" fill="#5cb048" />
            {/* small arm */}
            <path d="M64 50 L72 54 L71 57" fill="none" stroke="#1d3a17" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        {/* mouth + teeth */}
        <path d="M80 34 L91 33 L90 38 Q86 37 80 34 Z" fill="#c23a3a" />
        <g fill="#fff"><path d="M82 34 L83 36 L84 34 Z" /><path d="M86 33.6 L87 35.6 L88 33.4 Z" /><path d="M84 37 L85 35.6 L86 37.4 Z" /></g>
        <circle cx="74" cy="28" r="2.2" fill="#fff" stroke="#1d3a17" strokeWidth="0.8" />
        <circle cx="74.6" cy="28.2" r="1" fill="#111" />
        <path d="M70 25 L77 26" stroke="#1d3a17" strokeWidth="1.6" strokeLinecap="round" />
        {/* back stripes */}
        <g fill="#3c7a2c"><path d="M46 44 L50 42 L48 48 Z" /><path d="M54 41 L58 40 L56 46 Z" /></g>
    </svg>
);

const PicSpace = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full block">
        <rect width="100" height="100" fill="#0b0f2a" />
        <g fill="#fff">
            <circle cx="10" cy="12" r="0.9" /><circle cx="30" cy="30" r="0.7" /><circle cx="84" cy="10" r="1" />
            <circle cx="70" cy="36" r="0.7" /><circle cx="14" cy="60" r="0.8" /><circle cx="90" cy="56" r="0.8" />
            <circle cx="44" cy="8" r="0.6" /><circle cx="24" cy="84" r="0.7" />
        </g>
        {/* planet */}
        <circle cx="80" cy="80" r="16" fill="#e0884a" />
        <ellipse cx="80" cy="80" rx="26" ry="5" fill="none" stroke="#f3c98b" strokeWidth="2" transform="rotate(-15 80 80)" />
        {/* rocket */}
        <g transform="translate(46 48) rotate(30)">
            <path d="M-6 18 Q0 34 6 18 Z" fill="#ffb13b" />
            <path d="M-3 18 Q0 28 3 18 Z" fill="#fff3a0" />
            <path d="M-8 6 L-14 18 L-6 15 Z" fill="#c52323" stroke="#222" strokeWidth="0.8" />
            <path d="M8 6 L14 18 L6 15 Z" fill="#c52323" stroke="#222" strokeWidth="0.8" />
            <path d="M0 -26 Q10 -14 8 16 L-8 16 Q-10 -14 0 -26 Z" fill="#e9edf5" stroke="#222" strokeWidth="1" />
            <path d="M0 -26 Q5 -20 6.5 -14 L-6.5 -14 Q-5 -20 0 -26 Z" fill="#c52323" stroke="#222" strokeWidth="0.8" />
            <circle cx="0" cy="-3" r="4.5" fill="#6fc3ff" stroke="#222" strokeWidth="1" />
        </g>
    </svg>
);

const PICS: Record<number, React.FC> = { 1: PicStreet, 2: PicKraken, 3: PicTrex, 4: PicSpace };

// ---------------- the tile row ----------------

// phone held upright → 2 tiles per row, otherwise 4 in one row
function useIsPortrait() {
    const get = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
    const [portrait, setPortrait] = React.useState(get);
    React.useEffect(() => {
        const on = () => setPortrait(get());
        window.addEventListener('resize', on);
        window.addEventListener('orientationchange', on);
        return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
    }, []);
    return portrait;
}

const LevelTiles: React.FC<{ tiles: LevelTileInfo[]; lang: Lang }> = ({ tiles, lang }) => {
    const portrait = useIsPortrait();
    const tileWidth = portrait ? 'min(42vw, 200px)' : 'clamp(78px, 24vh, 150px)';
    return (
    <div className="mb-4 w-full">
        <div className="text-center text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-2">{TXT.title[lang]}</div>
        <div
            className="mx-auto grid gap-2 sm:gap-3 justify-center"
            style={{ gridTemplateColumns: `repeat(${portrait ? 2 : 4}, ${tileWidth})` }}
        >
            {tiles.map(t => {
                const Pic = PICS[t.level];
                const playable = t.state === 'open' && !!t.onPlay;
                return (
                    <button
                        key={t.level}
                        disabled={!playable}
                        onClick={(e) => { e.stopPropagation(); if (playable) t.onPlay!(); }}
                        className={`relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-transform ${playable ? 'border-white/70 hover:scale-105 active:scale-95 cursor-pointer shadow-lg' : 'border-gray-700 cursor-default'}`}
                        style={{ width: tileWidth }}
                    >
                        {/* picture (square) */}
                        <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
                            <div className="absolute inset-0" style={t.state === 'open' ? undefined : { filter: 'grayscale(1)', opacity: t.state === 'soon' ? 0.35 : 0.5 }}>
                                <Pic />
                            </div>
                            {t.state === 'locked' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                    <span className="text-2xl">🔒</span>
                                    <span className="text-[9px] font-black tracking-wider text-gray-200 mt-1">{TXT.locked[lang]}</span>
                                </div>
                            )}
                            {t.state === 'soon' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl">🚧</span>
                                    <span className="text-[10px] font-black tracking-wider text-yellow-300 mt-1">{TXT.soon[lang]}</span>
                                </div>
                            )}
                            {t.done && t.state === 'open' && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-600 border border-white text-white text-[11px] font-black flex items-center justify-center">✓</div>
                            )}
                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded">LEVEL {t.level}</div>
                        </div>
                        {/* name */}
                        <div className={`w-full px-1 py-1 text-center text-[10px] sm:text-xs font-black leading-tight ${t.state === 'open' ? 'bg-[#c52323] text-white' : 'bg-gray-800 text-gray-500'}`}>
                            {NAMES[t.level][lang]}
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
    );
};

export default LevelTiles;
