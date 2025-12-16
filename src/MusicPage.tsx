
import React, { useRef, useState, useEffect } from 'react';
import { GENRES } from './constants';
import { GENRE_COLORS } from './genreColors';
import { MooseekLogo, ButtonHeartIcon, MagnifyingGlassIcon, PlayArrowIcon, RadioIcon } from './Icons';
import MusicNoteIcon from './MusicNoteIcon';
import { SkateboardGraphic } from './SkateboardGraphic';
import GrainIcon from './GrainIcon';
import { getTemplateClasses, TemplateName } from './templateStyles';
import { ActiveTemplate, CustomTemplate } from './App';
import SkateboardIcon from './skate_session_review/SkateboardIcon';
import Logo from './Logo';

type Page = 'home' | 'music' | 'player' | 'my-music' | 'disclaimer' | 'editor' | 'rollometer';
type RpMix = 'main' | 'rock' | 'mellow' | 'world';

/* i1n */
const UI_TEXT: Record<string, Record<string, string>> = {
  selectAll:     { en: 'Select All', es: 'Seleccionar todo', de: 'Alle auswählen' },
  deselectAll:   { en: 'Deselect All', es: 'Deseleccionar todo', de: 'Alle abwählen' },
  settings:      { en: 'Settings', es: 'Ajustes', de: 'Einstellungen' },
  play:          { en: 'PLAY', es: 'REPRODUCIR', de: 'PLAY' },
  myMusic:       { en: 'My Music', es: 'Mi música', de: 'Meine Musik' },
  favorites:     { en: 'Favorites', es: 'Favoritos', de: 'Favoriten' },
  radioParadise: { en: 'Radio', es: 'Radio', de: 'Radio' },
  chooseRpMix:   { en: 'Choose Radio mix', es: 'Elegir mezcla de Radio', de: 'Radio-Mix wählen' },
  mainMix:       { en: 'Main Mix', es: 'Mezcla principal', de: 'Haupt-Mix' },
  rockMix:       { en: 'Rock Mix', es: 'Mezcla Rock', de: 'Rock-Mix' },
  mellowMix:     { en: 'Mellow Mix', es: 'Mezcla suave', de: 'Mellow-Mix' },
  worldMix:      { en: 'World/ECM Mix', es: 'Mezcla World/ECM', de: 'World/ECM-Mix' },
  disclaimer:    { en: 'Disclaimer & Liability', es: 'Descargo de responsabilidad', de: 'Haftung & Hinweis' },
  enterJamId:    { en: 'Enter Jamendo Client ID', es: 'Introduce el Client ID de Jamendo', de: 'Jamendo-Client-ID eingeben' },
  jamHelp:       { en: "To discover music, you need a Client ID from the Jamendo API. It's free!",
                   es: 'Para descubrir música, necesitas un Client ID de la API de Jamendo. ¡Es gratis!',
                   de: 'Um Musik zu entdecken, benötigst du eine Client-ID der Jamendo-API. Sie ist kostenlos!' },
  save:          { en: 'Save', es: 'Guardar', de: 'Speichern' },
  dontHaveOne:   { en: "Don't have one?", es: '¿No tienes uno?', de: 'Noch keinen?' },
  getClientId:   { en: 'Get a Client ID here', es: 'Consigue un Client ID aquí', de: 'Client-ID hier anfordern' },
};
function tr(key: keyof typeof UI_TEXT, lang?: string) {
  const L = (lang || 'en').toLowerCase();
  return UI_TEXT[key][L] ?? UI_TEXT[key].en;
}

const OverlaySlider: React.FC<{
  opacity: number;
  onOpacityChange: (opacity: number) => void;
}> = ({ opacity, onOpacityChange }) => {
  return (
    <div
      className="absolute bottom-4 z-10 flex justify-end pointer-events-none"
      style={{ right: 10, width: '50%' }}
    >
      <input
        type="range"
        min="0"
        max="0.85"
        step="0.01"
        value={opacity}
        onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
        className="overlay-slider w-full pointer-events-auto"
        aria-label="Background overlay opacity"
        style={{
          transform: 'none',
          writingMode: 'horizontal-tb' as any,
        }}
      />
    </div>
  );
};

const MusicPage: React.FC<{
  onPlaySelectedGenres: (genres: string[]) => void;
  onSetPage: (page: Page) => void;
  onLocalFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  error: string | null;
  onErrorDismiss: () => void;
  jamendoClientId: string;
  onSetJamendoClientId: (id: string) => void;
  onShowSettings: () => void;
  onShowDisclaimer: () => void;
  selectedGenres: string[];
  onSetSelectedGenres: React.Dispatch<React.SetStateAction<string[]>>;
  onPlayRadioParadise: (mix: RpMix) => void;
  onOpenAdjustments?: () => void;
  uiTemplate?: TemplateName;
  uiLang?: string;
  activeCustomTemplate: CustomTemplate | null;
  onUpdateCustomTemplate: (id: string, updates: Partial<CustomTemplate>) => void;
  showRollometer: boolean;
  onToggleRollometer: () => void;
}> = ({
  onPlaySelectedGenres, onSetPage, onLocalFileSelect, isLoading, error, onErrorDismiss,
  jamendoClientId, onSetJamendoClientId,
  onShowSettings, onShowDisclaimer, selectedGenres, onSetSelectedGenres, onPlayRadioParadise,
  onOpenAdjustments, uiTemplate, uiLang = 'en',
  activeCustomTemplate, onUpdateCustomTemplate,
  showRollometer, onToggleRollometer,
}) => {
  const [tempClientId, setTempClientId] = useState(jamendoClientId);
  const localFilePickerRef = useRef<HTMLInputElement>(null);

  const effectiveUiTemplate = uiTemplate ?? 'invert-white';
  const t = getTemplateClasses(effectiveUiTemplate);

  const [showRpMenu, setShowRpMenu] = useState(false);
  const rpButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rpButtonRef.current) return;
      if (!rpButtonRef.current.contains(e.target as Node)) setShowRpMenu(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleGenreToggle = (genre: string) => {
    onSetSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    onSetJamendoClientId(tempClientId);
  };
  
  const areAllGenresSelected = selectedGenres.length === GENRES.length;
  const handleToggleAllGenres = () => {
    if (areAllGenresSelected) onSetSelectedGenres([]);
    else onSetSelectedGenres(GENRES);
  };

  const rpItems: { id: RpMix; label: string }[] = [
    { id: 'main',   label: tr('mainMix', uiLang) },
    { id: 'rock',   label: tr('rockMix', uiLang) },
    { id: 'mellow', label: tr('mellowMix', uiLang) },
    { id: 'world',  label: tr('worldMix', uiLang) },
  ];

  const BTN_BASE =
    'bg-gray-800 text-white font-semibold px-3 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap';
  const BTN = `h-12 ${BTN_BASE}`;
  const BTN_FULL = `w-full h-12 ${BTN_BASE}`;
  
  const isCircularButtonTemplate =
    effectiveUiTemplate === 'custom' ||
    effectiveUiTemplate === 'invert-white' ||
    effectiveUiTemplate === 'invert-black';

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6">
      <header className="w-full my-8">
        <div className="w-full max-w-4xl mx-auto relative text-center flex flex-col items-center">
        <button onClick={() => onSetPage('home')} className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

          <div className="flex items-center justify-center gap-4">
            {(effectiveUiTemplate === 'colors' || effectiveUiTemplate === 'invert-black') && (
              <MooseekLogo />
            )}
            <div className="logo-block text-left leading-none">
              <div className="text-left leading-none">
                {/* New Logo Component - FM Variant */}
                <Logo variant="fm" className="text-[70px] md:text-[80px]" />

                {/* Jamendo-Attribution */}
                <div className="mt-2">
                  <a
                    href="https://www.jamendo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                    aria-label="Music provided by Jamendo"
                  >
                    <img src="./jamendo-logo.png" alt="Jamendo Music" className="h-8 md:h-9" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-2 right-0 flex flex-col items-center gap-2 -mt-5">
            <button
              type="button"
              onClick={() => onOpenAdjustments?.()}
              aria-label="Open adjustments"
              className="p-2 rounded-lg hover:bg-white/10 text-white"
              title="Adjustments"
            >
              <GrainIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full mt-8">
            <div className="w-full max-w-2xl mx-auto flex flex-row gap-3">
              <button onClick={() => localFilePickerRef.current?.click()} className={`flex-1 ${BTN}`}>
                <MusicNoteIcon />
                <span className="text-sm">{tr('myMusic', uiLang)}</span>
              </button>
              <input
                type="file"
                accept="audio/*"
                ref={localFilePickerRef}
                onChange={onLocalFileSelect}
                className="hidden"
              />

              <button onClick={() => onSetPage('my-music')} className={`flex-1 ${BTN}`}>
                <ButtonHeartIcon />
                <span className="text-sm">{tr('favorites', uiLang)}</span>
              </button>
              
              <div ref={rpButtonRef} className="relative flex-1">
                <button
                  onClick={() => setShowRpMenu(prev => !prev)}
                  className={BTN_FULL}
                  aria-haspopup="menu"
                  aria-expanded={showRpMenu}
                  aria-label={tr('chooseRpMix', uiLang)}
                  title={tr('radioParadise', uiLang)}
                >
                  <RadioIcon className="h-6 w-6 -translate-y-[5px]" />
                  <span className="text-sm">{tr('radioParadise', uiLang)}</span>
                  <svg
                    width="14" height="14" viewBox="0 0 20 20"
                    className={`transition-transform shrink-0 ${showRpMenu ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                {showRpMenu && (
                  <div role="menu" className="absolute z-20 mt-2 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden">
                    {rpItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { onPlayRadioParadise(item.id); setShowRpMenu(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm"
                        role="menuitem"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto flex-grow">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold">Oops! Something went wrong.</h3>
              <p>{error}</p>
            </div>
            <button onClick={onErrorDismiss} className="text-2xl">&times;</button>
          </div>
        )}

        <div
          className={`relative p-6 rounded-lg mb-8 transition-colors duration-300 ${
            activeCustomTemplate ? 'bg-transparent' : 'bg-gray-800'
          }`}
          style={{ overflow: 'hidden' }}
        >
          {/* Custom Background Layer */}
          {activeCustomTemplate && (
            <>
              {activeCustomTemplate.bgType === 'image' && (
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${activeCustomTemplate.background})` }}
                />
              )}
              {activeCustomTemplate.bgType === 'video' && (
                <video
                  src={activeCustomTemplate.background}
                  autoPlay loop muted playsInline
                  className="absolute top-1/2 left-1/2 w-auto h-auto min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
                />
              )}
              {/* Overlay */}
              {activeCustomTemplate.overlayOpacity > 0 && (
                <div
                  className="absolute inset-0 bg-black transition-opacity"
                  style={{ opacity: activeCustomTemplate.overlayOpacity }}
                />
              )}
              {/* Overlay Slider */}
              <OverlaySlider
                opacity={activeCustomTemplate.overlayOpacity}
                onOpacityChange={(val) => onUpdateCustomTemplate(activeCustomTemplate.id, { overlayOpacity: val })}
              />
            </>
          )}

          <div className="relative">
            {jamendoClientId ? (
              <>
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-lg flex flex-col items-center">
                      <div className="flex gap-3 sm:gap-4 w-full mb-4">
                        <button
                          onClick={handleToggleAllGenres}
                          className={[
                            "flex-1 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center",
                            areAllGenresSelected ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600",
                            t.toolbarBtn,
                            areAllGenresSelected ? t.toolbarBtnActive : ''
                          ].join(' ')}
                        >
                          {tr(areAllGenresSelected ? 'deselectAll' : 'selectAll', uiLang)}
                        </button>
                        <button
                          onClick={onShowSettings}
                          className={[
                            "flex-1 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 bg-gray-700 text-gray-300 hover:bg-gray-600",
                            t.toolbarBtn
                          ].join(' ')}
                        >
                          <MagnifyingGlassIcon />
                          <span>{tr('settings', uiLang)}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full">
                        {GENRES.map((genre, index) => {
                          const isSelected = selectedGenres.includes(genre);
                          const key = `${genre}-${effectiveUiTemplate}`;
                          
                          if (effectiveUiTemplate === 'colors') {
                            return (
                              <button
                                key={key}
                                onClick={() => handleGenreToggle(genre)}
                                style={{ backgroundColor: GENRE_COLORS[index], color: '#ffffff' }}
                                className={`aspect-[4/1] font-semibold rounded-lg flex items-center justifycenter text-center p-1 text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md ${isSelected ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-white' : 'ring-0'} whitespace-nowrap px-2`}
                              >
                                {genre}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={key}
                              onClick={() => handleGenreToggle(genre)}
                              className={[
                                "aspect-[4/1] font-semibold rounded-xl flex items-center justify-center text-center p-1 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md whitespace-nowrap text-[12px] sm:text-sm px-2",
                                isSelected ? t.genreBtnActive : t.genreBtn
                              ].join(' ')}
                            >
                              {genre}
                            </button>
                          );
                        })}
                      </div>

                      {isCircularButtonTemplate ? (
                         <button
                            onClick={() => onPlaySelectedGenres(selectedGenres)}
                            disabled={selectedGenres.length === 0}
                            className={
                               effectiveUiTemplate === 'custom'
                               ? "group mt-4 w-24 h-24 rounded-full bg-black/20 border-2 border-white/40 backdrop-blur-sm flex items-center justify-center text-white font-black text-2xl tracking-widest transition transform hover:scale-105 hover:border-white/70 hover:bg-black/30 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                               : "group mt-4 w-24 h-24 rounded-full bg-[#c52323] flex items-center justify-center text-white font-black text-2xl tracking-widest transition transform hover:scale-105 hover:bg-red-700 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                            }
                            aria-label={tr('play', uiLang)}
                         >
                            {tr('play', uiLang)}
                         </button>
                      ) : (
                        <button
                          onClick={() => onPlaySelectedGenres(selectedGenres)}
                          disabled={selectedGenres.length === 0}
                          className={[
                            "group mt-3 transition-transform duration-150 ease-in-out transform hover:scale-105 active:scale-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none rounded-2xl",
                            t.playWrap
                          ].join(' ')}
                          aria-label={tr('play', uiLang)}
                        >
                          <div className="relative mx-auto skateboard-layer" style={{ transform: 'scale(0.6)', transformOrigin: 'center' }}>
                            <SkateboardGraphic />
                            <div className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none text-white group-hover:text-[#c52323]">
                              <span
                                className={["relative font-black text-3xl tracking-widest", t.playText].join(' ')}
                                style={{ WebkitTextStroke: '2px #c52323', paintOrder: 'stroke fill' }}
                              >
                                {tr('play', uiLang)}
                              </span>
                              <PlayArrowIcon className="group-hover:translate-x-1 transition-transform duration-150" />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSaveClientId}>
                <h2 className="text-xl font-semibold mb-4 text-center">{tr('enterJamId', uiLang)}</h2>
                <p className="text-sm text-gray-400 mb-4 text-center">
                  {tr('jamHelp', uiLang)}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={tempClientId}
                    onChange={(e) => setTempClientId(e.target.value)}
                    placeholder="Jamendo Client ID"
                    className="flex-grow p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    {tr('save', uiLang)}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  {tr('dontHaveOne', uiLang)} <a href="https://developer.jamendo.com/v3.0/applications" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">{tr('getClientId', uiLang)}</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full text-center p-4 mt-auto">
        <button onClick={onShowDisclaimer} className="text-sm text-gray-500 hover:text-gray-300 underline">
          {tr('disclaimer', uiLang)}
        </button>
      </footer>
    </div>
  );
};

export default MusicPage;
