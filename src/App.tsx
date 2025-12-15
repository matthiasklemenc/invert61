
// C:\Users\user\Desktop\invert\App.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { GoogleGenAI } from '@google/genai';

import { Song, Playlist, YouTubeChannelSlot, RecentClip, SkateSession } from './types';
import { GENRES } from './constants';

import { fetchSongsByGenre } from '../jamendo';
import { fetchDisclaimerFromRemoteConfig } from './disclaimerService';

import HomePage from './HomePage';
import MusicPage from './MusicPage';
import GamesPage from './GamesPage';
import PlayerPage from './PlayerPage';
import MyMusicPage from './MyMusicPage';
import DisclaimerPage from './DisclaimerPage';
import VideoEditor from './VideoEditor';

// Corrected Import Path: RollometerPage is in src/
import RollometerPage from './RollometerPage';
import SessionReviewPage from './skate_session_review/SessionReviewPage';
import TrickTrainerPage from './skate_session_review/TrickTrainerPage';

import SkateQuizPage from './skate_quiz/SkateQuizPage';
import GeneralQuizPage from './general_quiz/GeneralQuizPage';
import CapitalsQuizPage from './capitals_quiz/CapitalsQuizPage';
import SkateGamePage from './skate_game/SkateGamePage';

import TrickRecordingPage from './TrickRecordingPage';

import MiniPlayer from './MiniPlayer';
import useLocalStorage from './useLocalStorage';
import sanitizeSong from './sanitizeSong';
import PlaylistModal from './PlaylistModal';
import LicenseModal from '../LicenseModal';
import SettingsModal from './SettingsModal';
import EqualizerModal from './EqualizerModal';

import { createPlateReverb } from './PlateReverb';
import AdjustmentsModal from './AdjustmentsModal';
import type { TemplateName } from './templateStyles';

// loose aliases so TS can’t block us
const AnyPlaylistModal: any = PlaylistModal;
const AnyLicenseModal: any = LicenseModal;
const AnySettingsModal: any = SettingsModal;
const AnyEqualizerModal: any = EqualizerModal;
const AnyAdjustmentsModal: any = AdjustmentsModal;

export type PredefinedTemplateId = 'colors' | 'invert-white' | 'invert-black';
export type CustomTemplate = {
  id: string;
  name: string;
  background: string;
  bgType: 'image' | 'video';
  overlayOpacity: number;
};
export type ActiveTemplate =
  | { type: 'predefined'; id: PredefinedTemplateId }
  | { type: 'custom'; id: string };

/* ===== License Helpers ===== */

const isNonDerivativeLicense = (licenseId?: string | null): boolean => {
  if (!licenseId) return false;
  const id = licenseId.toLowerCase();

  return (
    id.includes('by-nd') ||
    id.includes('by-nc-nd') ||
    id.includes('/nd/') ||
    id.includes('-nd') ||
    id.includes('no-derivatives')
  );
};

const isCommercialCcLicense = (licenseId?: string | null): boolean => {
  if (!licenseId) return false;
  const id = licenseId.toLowerCase();

  const isBy = id.includes('/licenses/by/');
  const isBySa = id.includes('/licenses/by-sa/');
  const hasNc = id.includes('nc');
  const hasNd = id.includes('nd');

  if (hasNc || hasNd) return false;
  return isBy || isBySa;
};

type Page =
  | 'home'
  | 'music'
  | 'games'
  | 'player'
  | 'my-music'
  | 'disclaimer'
  | 'editor'
  | 'rollometer'
  | 'session-review'
  | 'skate-quiz'
  | 'general-quiz'
  | 'capitals-quiz'
  | 'skate-game'
  | 'trick-training'
  | 'trick-recording';

/* ==== Gemini init guard ==== */
const IN_IFRAME = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();
const GEMINI_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
try {
  if (GEMINI_KEY && GEMINI_KEY.trim() && !IN_IFRAME) {
    ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  } else {
    console.info(
      'Gemini disabled:',
      !GEMINI_KEY ? 'no API_KEY in process.env' : 'running inside iframe/sandbox',
    );
  }
} catch (err) {
  console.warn('Gemini disabled (init failed):', err);
  ai = null;
}

/* ===== Equalizer config ===== */
const EQ_BANDS = [
  { f: 60, label: '60 Hz' },
  { f: 230, label: '230 Hz' },
  { f: 910, label: '910 Hz' },
  { f: 3000, label: '3 kHz' },
  { f: 14000, label: '14 kHz' },
] as const;
type EqKey = '60' | '230' | '910' | '3000' | '14000';

type RpMix = 'main' | 'rock' | 'mellow' | 'world';
const RP_LABEL: Record<RpMix, string> = {
  main: 'Main Mix',
  rock: 'Rock Mix',
  mellow: 'Mellow Mix',
  world: 'World/ECM Mix',
};
const RP_STREAMS: Record<RpMix, { primary: string; fallback: string }> = {
  main: {
    primary: 'https://stream.radioparadise.com/aac-320',
    fallback: 'https://stream.radioparadise.com/mp3-192',
  },
  rock: {
    primary: 'https://stream.radioparadise.com/rock-320',
    fallback: 'https://stream.radioparadise.com/rock-192',
  },
  mellow: {
    primary: 'https://stream.radioparadise.com/mellow-320',
    fallback: 'https://stream.radioparadise.com/mellow-192',
  },
  world: {
    primary: 'https://stream.radioparadise.com/world-320',
    fallback: 'https://stream.radioparadise.com/world-192',
  },
};

/* ===== First start popup (INVERT/FM colored) ===== */

const FirstStartInfo: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[9999]">
    <div className="bg-gray-900 p-6 rounded-xl max-w-md text-center border border-white/10 shadow-xl">
      <h2 className="text-3xl font-extrabold tracking-tight mb-4">
        <span style={{ color: '#ffffff' }}>INVERT</span>
        <span style={{ color: '#c52323' }}> FM</span>
      </h2>
      <p className="text-gray-200 leading-relaxed mb-4">
        This app is free and non-commercial. Therefore, Creative Commons Non-Commercial
        (CC-NC) tracks are legally allowed. You may use all available songs for private
        and personal video edits.
      </p>
      <button
        onClick={() => {
          try {
            localStorage.setItem('invertfm_first_start_seen', '1');
          } catch {
            /* ignore */
          }
          onClose();
        }}
        className="mt-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
      >
        Continue
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  // ---------- App State ----------
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageBeforeDisclaimer, setPageBeforeDisclaimer] = useState<Page>('home');

  // ---------- History Navigation ----------
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ page: 'home' }, '', '');
    }
    const onPopState = (event: PopStateEvent) => {
      const targetPage = event.state?.page || 'home';
      setCurrentPage(targetPage);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Wrapper to sync React state with Browser History
  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
    window.history.pushState({ page }, '', '');
  }, []);

  // ---------- Music Player State ----------
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showFirstStartInfo, setShowFirstStartInfo] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('invertfm_first_start_seen') !== '1';
    } catch {
      return false;
    }
  });

  const [favorites, setFavorites] = useLocalStorage<Song[]>('mooseek-favorites', []);
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>('mooseek-playlists', []);
  const [jamendoClientId, setJamendoClientId] = useLocalStorage<string>(
    'mooseek-jamendo-id',
    '',
  );
  const [selectedGenres, setSelectedGenres] = useLocalStorage<string[]>(
    'mooseek-selected-genres',
    [],
  );
  const [recentClips, setRecentClips] = useLocalStorage<RecentClip[]>(
    'invert-clips-recent',
    [],
  );

  const [commercialOnly, setCommercialOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'id_desc' | 'popularity_total' | 'random'>(
    'random',
  );

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistSong, setPlaylistSong] = useState<Song | null>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEqModal, setShowEqModal] = useState(false);

  const [disclaimerLang, setDisclaimerLang] = useState('en-US');
  const [disclaimerTexts, setDisclaimerTexts] = useState<Record<string, string>>({});
  const [isDisclaimerLoading, setIsDisclaimerLoading] = useState(true);

  const [volume, setVolume] = useState(0.5);
  const [videoVolume, setVideoVolume] =
    useLocalStorage<number>('mooseek-video-volume', 1.0);
  const [key, setKey] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [treble, setTreble] = useState(0);
  const [booster, setBooster] = useState(0);
  const [reverb, setReverb] = useState(0);

  const [repeat, setRepeat] = useState<boolean>(false);
  const toggleRepeat = useCallback(() => setRepeat((v) => !v), []);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [activeTemplate, setActiveTemplate] = useLocalStorage<ActiveTemplate>(
    'ui.activeTemplate',
    { type: 'predefined', id: 'invert-white' },
  );
  const [customTemplates, setCustomTemplates] = useLocalStorage<CustomTemplate[]>(
    'ui.customTemplates',
    [],
  );
  const [uiLang, setUiLang] = useLocalStorage<string>('ui.lang', 'en');
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(false);

  const activeCustomTemplate =
    activeTemplate.type === 'custom'
      ? customTemplates.find((t) => t.id === activeTemplate.id) ?? null
      : null;
  const effectiveTemplateIdForStyles: TemplateName =
    activeTemplate.type === 'predefined' ? activeTemplate.id : 'custom';

  useEffect(() => {
    if (activeTemplate.type === 'custom') {
      const exists = customTemplates.some((t) => t.id === activeTemplate.id);
      if (!exists) {
        console.warn(
          '[UI] Active custom template missing, falling back to invert-white',
          activeTemplate,
        );
        setActiveTemplate({ type: 'predefined', id: 'invert-white' });
      }
    }
  }, [activeTemplate, customTemplates, setActiveTemplate]);

  const [youTubeSlots, setYouTubeSlots] = useLocalStorage<YouTubeChannelSlot[]>(
    'mooseek-yt-slots',
    [
      { id: 0, channelId: 'UC-Pk-TTaSrDOjkPKQ7C8HXQ', channelName: 'Skate IQ' },
      { id: 1, channelId: 'UCf9ZbGG906ADVVtNMgctVrA', channelName: 'ThrasherMagazine' },
      { id: 2, channelId: 'UCt16NSYjauKclK67LCXvQyA', channelName: 'Braille Skateboarding' },
      { id: 3, channelId: 'UC2SikNrCZlWKjyjuW9RE1mQ', channelName: 'Santa Cruz Skateboards' },
    ],
  );

  const [showRollometer, setShowRollometer] = useLocalStorage<boolean>(
    'invert-rollometer-unlocked',
    false,
  );
  const [sessions, setSessions] = useLocalStorage<SkateSession[]>(
    'invert-skate-sessions',
    [],
  );
  const [reviewingSession, setReviewingSession] = useState<SkateSession | null>(null);
  const [trickToRecord, setTrickToRecord] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const preloaderRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const volumeNodeRef = useRef<GainNode | null>(null);
  const pitchShiftRef = useRef<any>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const boosterFilterRef = useRef<BiquadFilterNode | null>(null);

  const plateRef = useRef<ReturnType<typeof createPlateReverb> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const eqFiltersRef = useRef<Record<EqKey, BiquadFilterNode | null>>({
    '60': null,
    '230': null,
    '910': null,
    '3000': null,
    '14000': null,
  });
  const [eqGains, setEqGains] = useLocalStorage<Record<EqKey, number>>(
    'mooseek-eq-gains',
    { '60': 0, '230': 0, '910': 0, '3000': 0, '14000': 0 },
  );
  type EqPreset = { id: string; name: string; gains: Record<EqKey, number> };
  const [eqPresets, setEqPresets] = useLocalStorage<EqPreset[]>(
    'mooseek-eq-presets',
    [],
  );

  const currentSong = playlist[currentSongIndex];

  useEffect(() => {
    try {
      const framed = window.top !== window;
      const ancestor = (document as any).ancestorOrigins?.[0] || '';
      if (framed) {
        console.warn('[Environment] Within a frame:', ancestor || '(unknown)');
      }
    } catch {
      console.warn('[Environment] Possibly sandboxed frame.');
    }
  }, []);

  // disclaimer text
  useEffect(() => {
    const load = async () => {
      if (disclaimerTexts[disclaimerLang]) return;
      setIsDisclaimerLoading(true);
      const text = await fetchDisclaimerFromRemoteConfig(disclaimerLang, ai);
      setDisclaimerTexts((prev) => ({ ...prev, [disclaimerLang]: text }));
      setIsDisclaimerLoading(false);
    };
    load();
  }, [disclaimerLang, disclaimerTexts]);

  const handlePlaybackError = useCallback((e?: any) => {
    const audioEl = e?.target as HTMLAudioElement | undefined;
    const src = audioEl?.currentSrc || audioEl?.src;
    const errorCode = (audioEl as any)?.error?.code ?? e?.target?.error?.code;
    console.warn('Audio playback error', { code: errorCode, src, raw: e });
  }, []);

  /* --------------------- AUDIO ENGINE SETUP --------------------- */

  const setupAudioEngine = useCallback(async () => {
    if (sourceNodeRef.current && audioCtxRef.current?.state === 'running') return true;

    let ctx = audioCtxRef.current;
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        await Tone.setContext(ctx);
      } catch {
        setError(
          'Your browser does not support the Web Audio API, which is required for effects.',
        );
        return false;
      }
    }

    if (ctx.state !== 'running') {
      try {
        await ctx.resume();
        await Tone.start();
      } catch {
        setError(
          'Audio playback requires user interaction. Please click the play button again.',
        );
        return false;
      }
    }

    const a = audioRef.current;
    if (!a) return false;

    if (!a.crossOrigin) {
      a.crossOrigin = 'anonymous';
    }

    if (!sourceNodeRef.current) {
      try {
        const source = ctx.createMediaElementSource(a);

        const pitchShift = new Tone.PitchShift(key);

        const trebleFilter = ctx.createBiquadFilter();
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.value = 3000;
        trebleFilter.gain.value = treble * 20;

        const boosterFilter = ctx.createBiquadFilter();
        boosterFilter.type = 'lowshelf';
        boosterFilter.frequency.value = 250;
        boosterFilter.gain.value = booster * 20;

        const eqNodes: Record<EqKey, BiquadFilterNode> = {
          '60': ctx.createBiquadFilter(),
          '230': ctx.createBiquadFilter(),
          '910': ctx.createBiquadFilter(),
          '3000': ctx.createBiquadFilter(),
          '14000': ctx.createBiquadFilter(),
        };
        (Object.keys(eqNodes) as EqKey[]).forEach((k) => {
          const n = eqNodes[k];
          n.type = 'peaking';
          n.frequency.value = Number(k);
          n.Q.value = 1.0;
          n.gain.value = eqGains[k] ?? 0;
        });

        if (!plateRef.current) {
          plateRef.current = createPlateReverb({
            maxWet: 0.8,
            decay: 2.2,
            preDelay: 0.045,
          });
          plateRef.current.setMix(0.0);
          (plateRef.current as any).setHiCut?.(10000);
          (plateRef.current as any).setLoCut?.(140);
          (plateRef.current as any).setPresenceDb?.(3.0);
          (plateRef.current as any).setAlignMs?.(8);
        }

        const volumeNode = ctx.createGain();
        volumeNode.gain.value = volume;

        Tone.connect(source, pitchShift);
        pitchShift.connect(trebleFilter);
        trebleFilter.connect(boosterFilter);
        boosterFilter.connect(eqNodes['60']);
        eqNodes['60'].connect(eqNodes['230']);
        eqNodes['230'].connect(eqNodes['910']);
        eqNodes['910'].connect(eqNodes['3000']);
        eqNodes['3000'].connect(eqNodes['14000']);

        eqNodes['14000'].connect(volumeNode);

        Tone.connect(eqNodes['14000'], (plateRef.current as any).input);
        (plateRef.current as any).output.connect(volumeNode);

        volumeNode.connect(ctx.destination);

        sourceNodeRef.current = source;
        pitchShiftRef.current = pitchShift as any;
        trebleFilterRef.current = trebleFilter;
        boosterFilterRef.current = boosterFilter;
        volumeNodeRef.current = volumeNode;

        eqFiltersRef.current = eqNodes;
      } catch (e) {
        console.error(e);
        setError('Could not initialize audio effects. Your browser may not support them.');
        sourceNodeRef.current = null;
        return false;
      }
    }
    return true;
  }, [key, treble, booster, volume, eqGains]);

  useEffect(() => {
    const eqs = eqFiltersRef.current;
    (Object.keys(eqs) as EqKey[]).forEach((k) => {
      const n = eqs[k];
      if (n) n.gain.value = eqGains[k] ?? 0;
    });
  }, [eqGains]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => {
    if (volumeNodeRef.current) volumeNodeRef.current.gain.value = volume;
  }, [volume]);
  useEffect(() => {
    if (pitchShiftRef.current) (pitchShiftRef.current as any).pitch = key;
  }, [key]);
  useEffect(() => {
    if (trebleFilterRef.current) trebleFilterRef.current.gain.value = treble * 20;
  }, [treble]);
  useEffect(() => {
    if (boosterFilterRef.current) boosterFilterRef.current.gain.value = booster * 20;
  }, [booster]);
  useEffect(() => {
    const v = Math.max(0, Math.min(1, reverb));
    plateRef.current?.setMix(v);
  }, [reverb]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = repeat;
  }, [repeat]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      const ok = await setupAudioEngine();
      if (!ok) return;

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        handlePlaybackError(e);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [isPlaying, setupAudioEngine, handlePlaybackError]);

  const handlePlaySelectedGenres = async (genres: string[]) => {
    if (genres.length === 0) return;
    setIsLoading(true);
    setError(null);
    const ok = await setupAudioEngine();
    if (!ok) {
      setIsLoading(false);
      return;
    }

    try {
      const apiSortOrder = sortOrder === 'random' ? 'popularity_total' : sortOrder;
      const results: Song[][] = await Promise.all(
        genres.map((g) =>
          fetchSongsByGenre(g, jamendoClientId, commercialOnly, apiSortOrder),
        ),
      );

      const flattened: Song[] = results.flat();

      const filtered: Song[] = flattened.filter((s: any) => {
        const licenseUrl = s.license || s.license_url || s.license_ccurl || null;

        if (commercialOnly) {
          return isCommercialCcLicense(licenseUrl);
        } else {
          return !isNonDerivativeLicense(licenseUrl);
        }
      });

      const unique = Array.from(
        new Map(filtered.map((s) => [s.id, s])).values(),
      );

      if (unique.length === 0) {
        throw new Error(
          commercialOnly
            ? 'No songs with commercially usable CC licenses (CC BY / CC BY-SA) found for these genres.'
            : 'No songs found for the selected genres.',
        );
      }

      const finalList =
        sortOrder === 'random' ? unique.sort(() => 0.5 - Math.random()) : unique;
      setPlaylist(finalList);
      setCurrentSongIndex(0);
      navigateTo('player');
      setIsPlaying(true);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayRadioParadise = async (mix: RpMix) => {
    const ok = await setupAudioEngine();
    if (!ok) return;

    const { primary, fallback } = RP_STREAMS[mix];

    const stationSong: Song = {
      id: `radio-paradise-${mix}`,
      name: `Radio Paradise — ${RP_LABEL[mix]}`,
      artist_name: 'Live Stream',
      genre: 'Live Radio',
      album_image:
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <rect x="6" y="12" width="52" height="36" rx="6" fill="#111827" stroke="#374151" stroke-width="2"/>
            <path d="M10 10 L52 2" stroke="#4B5563" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="22" x2="40" y2="22" stroke="#6B7280" stroke-width="2"/>
            <line x1="16" y1="27" x2="40" y2="27" stroke="#6B7280" stroke-width="2"/>
            <line x1="16" y1="32" x2="40" y2="32" stroke="#6B7280" stroke-width="2"/>
            <circle cx="48" cy="34" r="6" fill="none" stroke="#9CA3AF" stroke-width="2"/>
            <circle cx="48" cy="34" r="2" fill="#9CA3AF"/>
          </svg>
        `),
      audio: primary,
      audio_nq: fallback || primary,
      audiodownload_allowed: false,
    };

    setPlaylist([stationSong]);
    setCurrentSongIndex(0);
    navigateTo('player');
    setIsPlaying(true);
  };

  const handlePlayPlaylist = async (songs: Song[], startIndex = 0) => {
    if (songs.length === 0) {
      setError('This playlist is empty and cannot be played.');
      navigateTo('home');
      return;
    }
    const ok = await setupAudioEngine();
    if (!ok) return;
    setPlaylist(songs);
    setCurrentSongIndex(startIndex);
    navigateTo('player');
    setIsPlaying(true);
  };

  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await setupAudioEngine();
    if (!ok) return;

    const audioUrl = URL.createObjectURL(file);
    const localSong: Song = {
      id: `local-${file.name}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      artist_name: 'Local File',
      album_image:
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTEyIDN2MTAuNTVBNC4wMDEgNC4wMDEgMCAwMDEwIDIyYTQgNCAwIDEwNC00VjdoNFYzdi02eiIvPjwvc3ZnPg==',
      audio: audioUrl,
      audio_nq: audioUrl,
      genre: 'Local',
    };
    setPlaylist([localSong]);
    setCurrentSongIndex(0);
    navigateTo('player');
    setIsPlaying(true);
  };

  const handleAddCustomTemplate = (
    name: string,
    background: string,
    bgType: 'image' | 'video',
  ) => {
    if (!name.trim()) return;
    const newTemplate: CustomTemplate = {
      id: Date.now().toString(),
      name: name.trim(),
      background,
      bgType,
      overlayOpacity: 0,
    };
    const updatedTemplates = [newTemplate, ...customTemplates].slice(0, 10);
    setCustomTemplates(updatedTemplates);
    setActiveTemplate({ type: 'custom', id: newTemplate.id });
  };

  const handleUpdateCustomTemplate = (
    id: string,
    updates: Partial<CustomTemplate>,
  ) => {
    setCustomTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const handleDeleteCustomTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    if (activeTemplate.type === 'custom' && activeTemplate.id === id) {
      setActiveTemplate({ type: 'predefined', id: 'invert-white' });
    }
  };

  const handleNextSong = useCallback(() => {
    if (playlist.length <= 1) return;
    setCurrentTime(0);
    setCurrentSongIndex((i) => (i + 1) % playlist.length);
  }, [playlist.length]);

  const handleEnded = useCallback(() => {
    if (repeat) {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
      return;
    }
    const isLast = currentSongIndex === playlist.length - 1;
    const genre = playlist[currentSongIndex]?.genre;
    if (isLast && genre && genre !== 'Local' && jamendoClientId) {
      (async () => {
        try {
          const apiSortOrder = sortOrder === 'random' ? 'popularity_total' : sortOrder;
          const moreRaw = await fetchSongsByGenre(
            genre,
            jamendoClientId,
            commercialOnly,
            apiSortOrder,
          );

          const more: Song[] = moreRaw.filter((s: any) => {
            const licenseUrl = s.license || s.license_url || s.license_ccurl || null;

            if (commercialOnly) {
              return isCommercialCcLicense(licenseUrl);
            } else {
              return !isNonDerivativeLicense(licenseUrl);
            }
          });

          const existing = new Set(playlist.map((p) => p.id));
          const next = more.find((s) => !existing.has(s.id));
          if (next) {
            setPlaylist((prev) => {
              const np = [...prev, next];
              setCurrentSongIndex(np.length - 1);
              return np;
            });
            setCurrentTime(0);
          } else {
            handleNextSong();
          }
        } catch {
          handleNextSong();
        }
      })();
    } else {
      handleNextSong();
    }
  }, [
    repeat,
    currentSongIndex,
    playlist,
    jamendoClientId,
    commercialOnly,
    sortOrder,
    handleNextSong,
  ]);

  const handlePrevSong = useCallback(() => {
    if (playlist.length <= 1) return;
    setCurrentTime(0);
    setCurrentSongIndex((i) => (i - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  const isFavorited = (id: string | number) => favorites.some((s) => s.id === id);

  const handleHeartClick = (song: Song) => {
    if (isFavorited(song.id)) {
      setFavorites((favs) => favs.filter((s) => s.id !== song.id));
    } else {
      const cleaned = sanitizeSong(song);
      setFavorites((favs) => [cleaned, ...favs]);
      setPlaylistSong(cleaned);
      setShowPlaylistModal(true);
    }
  };

  const handleAddToPlaylist = (playlistId: string, song: Song) => {
    setPlaylists((ps) =>
      ps.map((p) => {
        if (p.id === playlistId && !p.songs.some((s) => s.id === song.id)) {
          return { ...p, songs: [sanitizeSong(song), ...p.songs] };
        }
        return p;
      }),
    );
  };

  const handleCreateEmptyPlaylist = (name: string) => {
    const newPlaylist: Playlist = { id: Date.now().toString(), name, songs: [] };
    setPlaylists((ps) => [newPlaylist, ...ps]);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((ps) => ps.filter((p) => p.id !== id));
  };

  const handleDeleteFromFavorites = (id: string | number) => {
    setFavorites((favs) => favs.filter((s) => s.id !== id));
  };

  const handleDeleteFromPlaylist = (playlistId: string, songId: string | number) => {
    setPlaylists((ps) =>
      ps.map((p) => {
        if (p.id === playlistId) {
          return { ...p, songs: p.songs.filter((s) => s.id !== songId) };
        }
        return p;
      }),
    );
  };

  const handleMoveFavoriteToPlaylist = (songId: string, playlistId: string) => {
    const song = favorites.find((s) => s.id.toString() === songId);
    if (song) {
      handleAddToPlaylist(playlistId, song);
      handleDeleteFromFavorites(songId);
    }
  };

  const handleMovePlaylistSongToFavorites = (
    songId: string,
    sourcePlaylistId: string,
  ) => {
    const playlist = playlists.find((p) => p.id === sourcePlaylistId);
    const song = playlist?.songs.find((s) => s.id.toString() === songId);
    if (song && !isFavorited(song.id)) {
      setFavorites((favs) => [sanitizeSong(song), ...favs]);
      handleDeleteFromPlaylist(sourcePlaylistId, song.id);
    }
  };

  const handleCreatePlaylistAndAdd = (name: string, song: Song) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      songs: [sanitizeSong(song)],
    };
    setPlaylists((ps) => [newPlaylist, ...ps]);
  };

  const handleViewSession = useCallback((session: SkateSession) => {
    setReviewingSession(session);
    navigateTo('session-review');
  }, [navigateTo]);

  const handleAddSession = useCallback(
    (session: SkateSession) => {
      setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
    },
    [setSessions],
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    },
    [setSessions],
  );

  const handleSelectTrickToTrain = (trickName: string) => {
    setTrickToRecord(trickName);
    navigateTo('trick-recording');
  };

  // audio element sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(handlePlaybackError);
    } else {
      audio.pause();
    }
  }, [isPlaying, handlePlaybackError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentSong) {
      if (audio.src !== currentSong.audio) {
        audio.src = currentSong.audio;
      }
      if (isPlaying) audio.play().catch(handlePlaybackError);
    }
  }, [currentSong, isPlaying, handlePlaybackError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      if (!audio.paused) {
        setCurrentTime(audio.currentTime);
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };
    const onCanPlay = () => setDuration(audio.duration);
    audio.addEventListener('canplay', onCanPlay);
    animationFrameRef.current = requestAnimationFrame(update);
    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!preloaderRef.current) {
      preloaderRef.current = new Audio();
    }
    const nextIndex = (currentSongIndex + 1) % playlist.length;
    if (playlist.length > 1 && playlist[nextIndex]) {
      preloaderRef.current.src = playlist[nextIndex].audio;
    }
  }, [currentSongIndex, playlist]);

  const handleShowDisclaimer = () => {
    setPageBeforeDisclaimer(currentPage);
    navigateTo('disclaimer');
  };

  const handleCloseDisclaimer = () => {
    navigateTo(pageBeforeDisclaimer);
  };

  const onSaveEqPreset = (name: string) => {
    if (!name.trim()) return;
    const newPreset: EqPreset = {
      id: Date.now().toString(),
      name: name.trim(),
      gains: eqGains,
    };
    setEqPresets((prev) => [newPreset, ...prev].slice(0, 5));
  };
  const onLoadEqPreset = (id: string) => {
    const p = eqPresets.find((p) => p.id === id);
    if (p) setEqGains(p.gains);
  };
  const onDeleteEqPreset = (id: string) => {
    setEqPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const eqModalBands = EQ_BANDS.map(({ f, label }) => {
    const key = String(f) as EqKey;
    return { freq: f, key, label, gain: eqGains[key] ?? 0 };
  });

  /* --------------------------- PAGE ROUTING --------------------------- */

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onSetPage={navigateTo}
            youTubeSlots={youTubeSlots}
            onSetYouTubeSlots={setYouTubeSlots}
          />
        );

      case 'music':
        return (
          <MusicPage
            onPlaySelectedGenres={handlePlaySelectedGenres}
            onSetPage={navigateTo}
            onLocalFileSelect={handleLocalFileSelect}
            isLoading={isLoading}
            error={error}
            onErrorDismiss={() => setError(null)}
            jamendoClientId={jamendoClientId}
            onSetJamendoClientId={setJamendoClientId}
            onShowSettings={() => setShowSettingsModal(true)}
            onShowDisclaimer={handleShowDisclaimer}
            selectedGenres={selectedGenres}
            onSetSelectedGenres={setSelectedGenres}
            onPlayRadioParadise={handlePlayRadioParadise}
            onOpenAdjustments={() => setAdjustmentsOpen(true)}
            uiTemplate={effectiveTemplateIdForStyles}
            uiLang={uiLang}
            activeCustomTemplate={activeCustomTemplate}
            onUpdateCustomTemplate={handleUpdateCustomTemplate}
            showRollometer={showRollometer}
            onToggleRollometer={() => setShowRollometer((p) => !p)}
          />
        );

      case 'games':
        return <GamesPage onSetPage={navigateTo} />;

      case 'player':
        if (!currentSong)
          return (
            <HomePage
              onSetPage={navigateTo}
              youTubeSlots={youTubeSlots}
              onSetYouTubeSlots={setYouTubeSlots}
            />
          );
        return (
          <PlayerPage
            song={currentSong}
            onSetPage={navigateTo}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onPrevSong={handlePrevSong}
            onNextSong={handleNextSong}
            playlistLength={playlist.length}
            isFavorited={isFavorited}
            onHeartClick={handleHeartClick}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            volume={volume}
            onVolumeChange={setVolume}
            speed={speed}
            onSpeedChange={setSpeed}
            keyVal={key}
            onKeyChange={setKey}
            treble={treble}
            onTrebleChange={setTreble}
            booster={booster}
            onBoosterChange={setBooster}
            reverb={reverb}
            onReverbChange={setReverb}
            onShowLicense={() => setShowLicenseModal(true)}
            onShowEqualizer={() => setShowEqModal(true)}
            repeat={repeat}
            onToggleRepeat={toggleRepeat}
          />
        );

      case 'my-music':
        return (
          <MyMusicPage
            onSetPage={navigateTo}
            favorites={favorites}
            playlists={playlists}
            onPlayPlaylist={handlePlayPlaylist}
            onCreateEmptyPlaylist={handleCreateEmptyPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onDeleteFromFavorites={handleDeleteFromFavorites}
            onDeleteFromPlaylist={handleDeleteFromPlaylist}
            onMoveFavoriteToPlaylist={handleMoveFavoriteToPlaylist}
            onMovePlaylistSongToFavorites={handleMovePlaylistSongToFavorites}
            onShowDisclaimer={handleShowDisclaimer}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
          />
        );

      case 'disclaimer':
        return (
          <DisclaimerPage
            text={disclaimerTexts[disclaimerLang] || ''}
            isLoading={isDisclaimerLoading}
            onClose={handleCloseDisclaimer}
            currentLang={disclaimerLang}
            onSetLang={setDisclaimerLang}
          />
        );

      case 'editor':
        return (
          <VideoEditor
            onClose={() => navigateTo('home')}
            recentClips={recentClips}
            onSetRecentClips={setRecentClips}
            videoVolume={videoVolume}
            onVideoVolumeChange={setVideoVolume}
          />
        );

      case 'rollometer':
        return (
          <RollometerPage
            onClose={() => navigateTo('home')}
            sessions={sessions}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onViewSession={handleViewSession}
            onSetPage={navigateTo}
          />
        );

      case 'session-review':
        if (!reviewingSession)
          return (
            <RollometerPage
              onClose={() => navigateTo('home')}
              sessions={sessions}
              onAddSession={handleAddSession}
              onDeleteSession={handleDeleteSession}
              onViewSession={handleViewSession}
              onSetPage={navigateTo}
            />
          );
        return (
          <SessionReviewPage
            session={reviewingSession}
            onClose={() => navigateTo('rollometer')}
          />
        );

      case 'skate-quiz':
        return <SkateQuizPage onClose={() => navigateTo('games')} />;

      case 'general-quiz':
        return <GeneralQuizPage onClose={() => navigateTo('games')} />;

      case 'capitals-quiz':
        return <CapitalsQuizPage onClose={() => navigateTo('games')} />;

      case 'skate-game':
        return <SkateGamePage onClose={() => navigateTo('games')} />;

      /* --------------------------------------------------------------- */
      /* 🔥 FIXED — Trick Planner Routing                                */
      /* --------------------------------------------------------------- */

      case 'trick-training':
        return (
          <TrickTrainerPage
            onBack={() => navigateTo('rollometer')}
            onSelectTrick={handleSelectTrickToTrain}
          />
        );

      case 'trick-recording':
        if (!trickToRecord)
          return (
            <TrickTrainerPage
              onBack={() => navigateTo('rollometer')}
              onSelectTrick={handleSelectTrickToTrain}
            />
          );

        return (
          <TrickRecordingPage
            trickName={trickToRecord}
            onBack={() => navigateTo('trick-training')}
          />
        );


      default:
        return (
          <HomePage
            onSetPage={navigateTo}
            youTubeSlots={youTubeSlots}
            onSetYouTubeSlots={setYouTubeSlots}
          />
        );
    }
  };

  return (
    <div className={`app-container font-sans theme-${effectiveTemplateIdForStyles}`}>
      <audio ref={audioRef} onEnded={handleEnded} onError={handlePlaybackError} />

      {showFirstStartInfo && (
        <FirstStartInfo onClose={() => setShowFirstStartInfo(false)} />
      )}

      {renderPage()}

      {currentSong &&
        ![
          'player',
          'editor',
          'rollometer',
          'session-review',
          'skate-quiz',
          'general-quiz',
          'capitals-quiz',
          'skate-game',
        ].includes(currentPage) && (
          <MiniPlayer
            song={currentSong}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSetPage={navigateTo}
          />
        )}

      {showPlaylistModal && playlistSong && (
        <AnyPlaylistModal
          song={playlistSong}
          playlists={playlists}
          onAddToPlaylist={handleAddToPlaylist}
          onCreatePlaylist={handleCreatePlaylistAndAdd}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}

      {showLicenseModal && currentSong && (
        <AnyLicenseModal song={currentSong} onClose={() => setShowLicenseModal(false)} />
      )}

      {showSettingsModal && (
        <AnySettingsModal
          onClose={() => setShowSettingsModal(false)}
          jamendoClientId={jamendoClientId}
          onSetJamendoClientId={setJamendoClientId}
          commercialOnly={commercialOnly}
          onSetCommercialOnly={setCommercialOnly}
          sortOrder={sortOrder}
          onSetSortOrder={setSortOrder}
          uiLang={uiLang}
          onSetUiLang={setUiLang}
        />
      )}

      {adjustmentsOpen && (
        <AnyAdjustmentsModal
          isOpen={adjustmentsOpen}
          onClose={() => setAdjustmentsOpen(false)}
          activeTemplate={activeTemplate}
          setActiveTemplate={setActiveTemplate}
          customTemplates={customTemplates}
          onAddCustomTemplate={handleAddCustomTemplate}
          onUpdateCustomTemplate={handleUpdateCustomTemplate}
          onDeleteCustomTemplate={handleDeleteCustomTemplate}
          language={uiLang}
          setLanguage={setUiLang}
          genres={GENRES}
        />
      )}

      {showEqModal && (
        <AnyEqualizerModal
          bands={eqModalBands}
          onChangeGain={(k: EqKey, gainDb: number) => {
            setEqGains((prev) => ({ ...prev, [k]: gainDb }));
          }}
          presets={eqPresets}
          onSavePreset={onSaveEqPreset}
          onLoadPreset={onLoadEqPreset}
          onDeletePreset={onDeleteEqPreset}
          onClose={() => setShowEqModal(false)}
        />
      )}
    </div>
  );
};

export default App;
