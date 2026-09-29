import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardSensorDataPoint, Stance, TrickDefinition, TrickSample, TrickTerrain } from '../types';
import {
  connectBoardSensor,
  disconnectBoardSensor,
  getBoardSensorDeviceName,
  isBoardSensorConnected,
  subscribeBoardSensor,
  subscribeBoardSensorStatus,
} from '../boardSensorConnection';

const STORAGE_KEY = 'invert61_trick_database_v1';
const LIBRARY_STORAGE_KEY = 'invert61_trick_library_v1';
const PRE_ROLL_MS = 500;
const POST_ROLL_MS = 500;

const DEFAULT_FLAT_TRICKS = [
  'Ollie', 'Nollie', 'Kickflip', 'Heelflip', 'Varial Kickflip', 'Varial Heelflip',
  'Pop Shove-it', 'Frontside Shove-it', 'Frontside 180', 'Backside 180',
  'Frontside 360', 'Backside 360', 'Frontside Kickflip', 'Backside Kickflip',
  'Frontside Heelflip', 'Backside Heelflip', 'Boardslide', 'Lipslide',
  '50-50 Grind', '5-0 Grind', 'Nosegrind', 'Smith Grind', 'Feeble Grind',
  'Rock to Fakie', 'Rock and Roll', 'Axle Stall', 'Disaster', 'Tail Stall',
  'Manual', 'Nose Manual',
];

// These are standard transition motions worth collecting as labeled sensor data.
const DEFAULT_TRANSITION_TRICKS = ['Transition Push', 'Drop-In'];

const makeId = (name: string, terrain: TrickTerrain) =>
  `${terrain}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

const createDefaultLibrary = (): TrickDefinition[] => {
  const now = new Date().toISOString();
  return [
    ...DEFAULT_FLAT_TRICKS.map((name) => ({ id: makeId(name, 'flat'), name, terrain: 'flat' as const, builtIn: true, createdAt: now })),
    ...DEFAULT_TRANSITION_TRICKS.map((name) => ({ id: makeId(name, 'transition'), name, terrain: 'transition' as const, builtIn: true, createdAt: now })),
  ];
};

const loadLibrary = (): TrickDefinition[] => {
  try {
    const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as TrickDefinition[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fall back to defaults below.
  }
  const defaults = createDefaultLibrary();
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
};

const loadSamples = (): TrickSample[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const motionValue = (sample: BoardSensorDataPoint) => {
  const acceleration = Math.sqrt(sample.ax ** 2 + sample.ay ** 2 + sample.az ** 2);
  const rotation = Math.sqrt(sample.gx ** 2 + sample.gy ** 2 + sample.gz ** 2) / 250;
  return acceleration + rotation;
};

const TrickDatabasePage: React.FC<{ onBack: () => void; initialStance?: Stance }> = ({ onBack, initialStance }) => {
  const [samples, setSamples] = useState<TrickSample[]>(loadSamples);
  const [library, setLibrary] = useState<TrickDefinition[]>(loadLibrary);
  const initialFlat = library.find((item) => item.terrain === 'flat') ?? library[0];
  const initialTransition = library.find((item) => item.terrain === 'transition') ?? library[0];
  const [flatTrickId, setFlatTrickId] = useState(initialFlat?.id ?? '');
  const [transitionTrickId, setTransitionTrickId] = useState(initialTransition?.id ?? '');
  const [terrain, setTerrain] = useState<TrickTerrain>(initialFlat ? 'flat' : 'transition');
  const [trick, setTrick] = useState(initialFlat?.name ?? '');
  const [trickId, setTrickId] = useState(initialFlat?.id ?? '');
  const [rider, setRider] = useState('Skater A');
  const [stance, setStance] = useState<Stance>(initialStance ?? Stance.Regular);
  const [status, setStatus] = useState<'setup' | 'recording' | 'review'>('setup');
  const [sensorConnected, setSensorConnected] = useState(isBoardSensorConnected());
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState(getBoardSensorDeviceName());
  const [packetCount, setPacketCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [reviewData, setReviewData] = useState<BoardSensorDataPoint[]>([]);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteTrickId, setDeleteTrickId] = useState<string | null>(null);
  const [addTerrain, setAddTerrain] = useState<TrickTerrain | null>(null);
  const [newTrickName, setNewTrickName] = useState('');

  const startTimeRef = useRef(0);
  const samplesRef = useRef<BoardSensorDataPoint[]>([]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const recordingRef = useRef(false);
  const unsubscribeSensorRef = useRef<(() => void) | null>(null);

  const writeDatabase = useCallback((next: TrickSample[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSamples(next);
  }, []);

  const writeLibrary = useCallback((next: TrickDefinition[]) => {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(next));
    setLibrary(next);
  }, []);

  const flatTricks = useMemo(() => library.filter((item) => item.terrain === 'flat'), [library]);
  const transitionTricks = useMemo(() => library.filter((item) => item.terrain === 'transition'), [library]);
  const selectedDefinition = library.find((item) => item.id === trickId);

  useEffect(() => {
    return subscribeBoardSensorStatus((connected, name) => {
      setSensorConnected(connected);
      setDeviceName(name);
    });
  }, []);

  const selectTrick = (id: string) => {
    const selected = library.find((item) => item.id === id);
    if (!selected) return;
    setTrickId(selected.id);
    setTrick(selected.name);
    setTerrain(selected.terrain);
    if (selected.terrain === 'flat') setFlatTrickId(selected.id);
    else setTransitionTrickId(selected.id);
  };

  const handleTerrainSelection = (nextTerrain: TrickTerrain, id: string) => {
    const selected = library.find((item) => item.id === id);
    if (!selected) return;
    setTerrain(nextTerrain);
    selectTrick(selected.id);
  };

  const handleSensorPoint = useCallback((point: BoardSensorDataPoint) => {
    if (!recordingRef.current) return;
    const timestamp = point.timestamp - startTimeRef.current;
    if (timestamp < 0) return;

    samplesRef.current.push({ ...point, timestamp });
    setPacketCount(samplesRef.current.length);
  }, []);

  const startAttempt = async () => {
    try {
      setSensorError(null);
      if (!selectedDefinition) {
        setSensorError('Select a trick before starting the attempt.');
        return;
      }

      if (!isBoardSensorConnected()) await connectBoardSensor();

      samplesRef.current = [];
      setPacketCount(0);
      setElapsedMs(0);
      startTimeRef.current = Date.now();

      unsubscribeSensorRef.current?.();
      unsubscribeSensorRef.current = subscribeBoardSensor(handleSensorPoint);
      recordingRef.current = true;
      setStatus('recording');
    } catch (error) {
      setSensorError(error instanceof Error ? error.message : 'Could not connect to the WT901 sensor.');
    }
  };

  const stopAndReview = () => {
    recordingRef.current = false;
    unsubscribeSensorRef.current?.();
    unsubscribeSensorRef.current = null;

    const data = [...samplesRef.current];
    if (data.length < 5) {
      setSensorError('Not enough sensor data was recorded. Try the attempt again.');
      setStatus('setup');
      return;
    }

    const max = data[data.length - 1].timestamp;
    setReviewData(data);
    setSelectionStart(Math.max(0, max * 0.35));
    setSelectionEnd(Math.min(max, Math.max(500, max * 0.65)));
    setStatus('review');
  };

  const retry = () => {
    setEditingSampleId(null);
    setReviewData([]);
    setSelectionStart(0);
    setSelectionEnd(0);
    setPacketCount(0);
    setSensorError(null);
    setStatus('setup');
  };

  const saveAttempt = () => {
    if (!reviewData.length || !selectedDefinition) return;

    const min = Math.max(0, Math.min(selectionStart, selectionEnd) - PRE_ROLL_MS);
    const max = Math.min(reviewData[reviewData.length - 1].timestamp, Math.max(selectionStart, selectionEnd) + POST_ROLL_MS);
    const selected = reviewData.filter((point) => point.timestamp >= min && point.timestamp <= max);

    if (selected.length < 3) {
      setSensorError('The selected range is too short. Move START and END farther apart.');
      return;
    }

    if (editingSampleId) {
      const updated = samples.map((sample) => sample.id === editingSampleId
        ? {
            ...sample,
            trick: selectedDefinition.name,
            trickId: selectedDefinition.id,
            terrain: selectedDefinition.terrain,
            selectionStartMs: Math.min(selectionStart, selectionEnd),
            selectionEndMs: Math.max(selectionStart, selectionEnd),
            captureStartMs: min,
            captureEndMs: max,
            sensorData: selected,
          }
        : sample
      );
      writeDatabase(updated);
    } else {
      const sample: TrickSample = {
        id: `trick-${Date.now()}`,
        trick: selectedDefinition.name,
        trickId: selectedDefinition.id,
        terrain: selectedDefinition.terrain,
        rider: rider.trim() || 'Unknown Rider',
        stance,
        createdAt: new Date().toISOString(),
        selectionStartMs: Math.min(selectionStart, selectionEnd),
        selectionEndMs: Math.max(selectionStart, selectionEnd),
        captureStartMs: min,
        captureEndMs: max,
        sensorData: selected,
      };
      writeDatabase([sample, ...samples]);
    }

    setEditingSampleId(null);
    setReviewData([]);
    setSelectionStart(0);
    setSelectionEnd(0);
    setPacketCount(0);
    setStatus('setup');
  };

  const openSavedSample = (sample: TrickSample) => {
    const savedTerrain = sample.terrain ?? 'flat';
    const savedDefinition = library.find((item) => item.id === sample.trickId)
      ?? library.find((item) => item.name === sample.trick && item.terrain === savedTerrain);

    if (savedDefinition) selectTrick(savedDefinition.id);
    else {
      setTrick(sample.trick);
      setTerrain(savedTerrain);
      setTrickId(sample.trickId ?? makeId(sample.trick, savedTerrain));
    }

    const captureStart = sample.captureStartMs ?? 0;
    const normalizedData = sample.sensorData.map((point) => ({ ...point, timestamp: point.timestamp - captureStart }));
    const selectionStartRelative = Math.max(0, sample.selectionStartMs - captureStart);
    const selectionEndRelative = Math.max(selectionStartRelative + 20, sample.selectionEndMs - captureStart);
    const maxTimestamp = normalizedData[normalizedData.length - 1]?.timestamp ?? selectionEndRelative;

    setEditingSampleId(sample.id);
    setRider(sample.rider);
    setStance(sample.stance);
    setSensorError(null);
    setReviewData(normalizedData);
    setSelectionStart(Math.min(selectionStartRelative, maxTimestamp));
    setSelectionEnd(Math.min(selectionEndRelative, maxTimestamp));
    setStatus('review');
  };

  const duration = reviewData.length ? reviewData[reviewData.length - 1].timestamp : 0;
  const waveform = useMemo(() => reviewData.map(motionValue), [reviewData]);
  const waveformMax = Math.max(...waveform, 1);

  const positionToTime = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || duration <= 0) return 0;
    return clamp(((clientX - rect.left) / rect.width) * duration, 0, duration);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (event: PointerEvent) => {
      const next = positionToTime(event.clientX);
      if (dragging === 'start') setSelectionStart(Math.min(next, selectionEnd - 20));
      else setSelectionEnd(Math.max(next, selectionStart + 20));
    };
    const up = () => setDragging(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [dragging, selectionStart, selectionEnd, duration]);

  useEffect(() => {
    if (status !== 'recording') return;
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 100);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => () => {
    recordingRef.current = false;
    unsubscribeSensorRef.current?.();
  }, []);

  const exportDatabase = () => {
    const blob = new Blob([JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), library, samples }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invert61-trick-database-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteSample = (id: string) => {
    writeDatabase(samples.filter((sample) => sample.id !== id));
    setDeleteConfirmId(null);
  };

  const deleteTrick = (id: string) => {
    const definition = library.find((item) => item.id === id);
    if (!definition) return;

    const updatedLibrary = library.filter((item) => item.id !== id);
    const updatedSamples = samples.filter((sample) => {
      const sampleTerrain = sample.terrain ?? 'flat';
      const sampleMatchesId = sample.trickId === id;
      const legacySampleMatchesName = !sample.trickId && sample.trick === definition.name && sampleTerrain === definition.terrain;
      return !sampleMatchesId && !legacySampleMatchesName;
    });

    writeLibrary(updatedLibrary);
    writeDatabase(updatedSamples);

    const replacement = updatedLibrary.find((item) => item.terrain === definition.terrain);
    if (definition.terrain === 'flat') {
      setFlatTrickId(replacement?.id ?? '');
    } else {
      setTransitionTrickId(replacement?.id ?? '');
    }

    if (trickId === id) {
      if (replacement) selectTrick(replacement.id);
      else {
        setTrickId('');
        setTrick('');
      }
    }
    setDeleteTrickId(null);
  };

  const addTrick = () => {
    const name = newTrickName.trim();
    if (!addTerrain || !name) return;

    const duplicate = library.some((item) => item.terrain === addTerrain && item.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setSensorError(`A ${addTerrain === 'flat' ? 'Flat Ground' : 'Transition'} trick with this name already exists.`);
      return;
    }

    const definition: TrickDefinition = {
      id: `custom-${addTerrain}-${Date.now()}`,
      name,
      terrain: addTerrain,
      createdAt: new Date().toISOString(),
    };
    const next = [...library, definition];
    writeLibrary(next);
    selectTrick(definition.id);
    if (addTerrain === 'flat') setFlatTrickId(definition.id);
    else setTransitionTrickId(definition.id);
    setNewTrickName('');
    setAddTerrain(null);
    setSensorError(null);
  };

  const selectedDeleteDefinition = deleteTrickId ? library.find((item) => item.id === deleteTrickId) : null;
  const selectedDeleteCount = selectedDeleteDefinition
    ? samples.filter((sample) => sample.trickId === selectedDeleteDefinition.id || (!sample.trickId && sample.trick === selectedDeleteDefinition.name && (sample.terrain ?? 'flat') === selectedDeleteDefinition.terrain)).length
    : 0;

  const renderTrickSelector = (selectorTerrain: TrickTerrain, items: TrickDefinition[], selectedId: string) => (
    <div className="space-y-2">
      <select
        value={selectedId}
        onChange={(e) => handleTerrainSelection(selectorTerrain, e.target.value)}
        className="w-full min-w-0 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white"
      >
        {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setAddTerrain(selectorTerrain); setNewTrickName(''); setSensorError(null); }}
          className="bg-cyan-500 text-gray-950 font-black px-3 py-2 rounded-lg uppercase text-[9px] tracking-widest"
        >
          + Add Trick
        </button>
        <button
          type="button"
          onClick={() => selectedId && setDeleteTrickId(selectedId)}
          disabled={!selectedId}
          className="bg-red-600/80 disabled:bg-gray-800 disabled:text-gray-600 text-white font-black px-3 py-2 rounded-lg uppercase text-[9px]"
          title="Delete selected trick"
        >
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-xs uppercase tracking-widest">← Back</button>
        <div className="text-center">
          <h2 className="text-xl font-black text-cyan-400 tracking-wider">TRICK DATABASE</h2>
          <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em]">WT901 Training Samples</p>
        </div>
        <button onClick={exportDatabase} disabled={!samples.length} className="text-cyan-400 disabled:text-gray-700 text-[10px] uppercase tracking-widest">Export</button>
      </div>

      {status === 'setup' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">New Attempt</h3>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Rider</label>
            <input value={rider} onChange={(e) => setRider(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white mb-4" />
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Stance</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[Stance.Regular, Stance.Goofy].map((value) => (
                <button key={value} onClick={() => setStance(value)} className={`py-3 rounded-xl font-black uppercase ${stance === value ? 'bg-cyan-500 text-gray-950' : 'bg-gray-900 text-gray-400 border border-gray-700'}`}>{value}</button>
              ))}
            </div>

            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Flat Ground</label>
            {renderTrickSelector('flat', flatTricks, flatTrickId)}

            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2 mt-4">Transition</label>
            {renderTrickSelector('transition', transitionTricks, transitionTrickId)}

            <div className="mt-4 text-[10px] text-gray-500 uppercase tracking-widest">
              Selected: <span className="text-white">{trick || 'None'}</span> · {terrain === 'flat' ? 'Flat Ground' : 'Transition'}
            </div>
          </div>

          {sensorError && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{sensorError}</div>}

          {!sensorConnected && (
            <button onClick={startAttempt} className="w-full bg-green-500 text-gray-950 font-black py-5 rounded-2xl uppercase tracking-widest">
              CONNECT SENSOR & START ATTEMPT
            </button>
          )}

          {sensorConnected && (
            <>
              <button onClick={startAttempt} className="w-full bg-green-500 text-gray-950 font-black py-5 rounded-2xl uppercase tracking-widest">
                START ATTEMPT
              </button>
              <button type="button" onClick={() => { setSensorError(null); disconnectBoardSensor(); }} className="w-full mt-3 border border-white/15 text-white font-black py-3 rounded-2xl uppercase tracking-widest hover:bg-white/5">
                DISCONNECT SENSOR
              </button>
            </>
          )}

          <div className="text-center text-[10px] text-gray-600 uppercase tracking-widest">
            {sensorConnected ? `Sensor connected · ${deviceName}` : 'Sensor not connected'} · {samples.length} saved samples on this phone
          </div>
        </div>
      )}

      {status === 'recording' && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 text-[10px] font-black uppercase tracking-widest mb-8"><span className="w-2 h-2 bg-white rounded-full" /> Recording</div>
          <h3 className="text-3xl font-black text-white mb-2">{trick}</h3>
          <p className="text-gray-500 text-xs mb-2">{terrain === 'flat' ? 'Flat Ground' : 'Transition'} · {rider} · {stance}</p>
          <div className="text-7xl font-black text-white tabular-nums mb-6">{(elapsedMs / 1000).toFixed(1)}s</div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-gray-900 rounded-xl p-4"><div className="text-[10px] text-gray-500 uppercase">Sensor</div><div className="text-green-400 font-black">{sensorConnected ? 'Connected' : 'Disconnected'}</div></div>
            <div className="bg-gray-900 rounded-xl p-4"><div className="text-[10px] text-gray-500 uppercase">Samples</div><div className="text-cyan-400 font-black">{packetCount}</div></div>
          </div>
          <button onClick={stopAndReview} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest">STOP & REVIEW</button>
        </div>
      )}

      {status === 'review' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-black text-white">{trick}</h3>
                <p className="text-[10px] text-gray-500 uppercase">{terrain === 'flat' ? 'Flat Ground' : 'Transition'} · {rider} · {stance}</p>
              </div>
              <div className="text-[10px] text-gray-500">{reviewData.length} samples</div>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Drag the vertical lines to mark the trick</p>
            <div ref={timelineRef} className="relative h-48 rounded-xl bg-gray-950 border border-gray-700 overflow-hidden touch-none select-none">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gray-800" />
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-70">
                <polyline fill="none" stroke="currentColor" strokeWidth="1.2" className="text-cyan-400" points={waveform.map((value, index) => `${(index / Math.max(1, waveform.length - 1)) * 100},${95 - (value / waveformMax) * 80}`).join(' ')} />
              </svg>
              {duration > 0 && <>
                <div className="absolute inset-y-0 bg-cyan-400/15" style={{ left: `${(Math.min(selectionStart, selectionEnd) / duration) * 100}%`, right: `${100 - (Math.max(selectionStart, selectionEnd) / duration) * 100}%` }} />
                <div onPointerDown={() => setDragging('start')} className="absolute inset-y-0 w-1 bg-cyan-300 cursor-ew-resize z-10" style={{ left: `calc(${(selectionStart / duration) * 100}% - 2px)` }}><div className="absolute top-0 -left-2 px-1 text-[9px] bg-cyan-400 text-gray-950 font-black">START</div></div>
                <div onPointerDown={() => setDragging('end')} className="absolute inset-y-0 w-1 bg-cyan-300 cursor-ew-resize z-10" style={{ left: `calc(${(selectionEnd / duration) * 100}% - 2px)` }}><div className="absolute bottom-0 -left-2 px-1 text-[9px] bg-cyan-400 text-gray-950 font-black">END</div></div>
              </>}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2"><span>{(Math.min(selectionStart, selectionEnd) / 1000).toFixed(2)}s</span><span>{((Math.max(selectionStart, selectionEnd) - Math.min(selectionStart, selectionEnd)) / 1000).toFixed(2)}s selected</span><span>{(Math.max(selectionStart, selectionEnd) / 1000).toFixed(2)}s</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={retry} className="bg-gray-700 text-white font-black py-4 rounded-xl uppercase">TRY THIS TRICK AGAIN</button>
            <button onClick={saveAttempt} className="bg-green-500 text-gray-950 font-black py-4 rounded-xl uppercase">SAVE</button>
          </div>
        </div>
      )}

      <div className="mt-6 bg-gray-800 rounded-2xl border border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-black uppercase tracking-widest text-white">Saved Samples</h3><span className="text-[10px] text-gray-500">{samples.length}</span></div>
        {samples.length === 0 ? <p className="text-xs text-gray-600">No training samples saved yet.</p> : <div className="space-y-2 max-h-72 overflow-auto">{samples.map((sample) => <div key={sample.id} className="flex items-center justify-between gap-3 bg-gray-900 rounded-xl p-3"><button onClick={() => openSavedSample(sample)} className="min-w-0 flex-1 text-left"><div className="text-sm font-bold text-white truncate">{sample.trick}</div><div className="text-[10px] text-gray-500">{sample.terrain === 'transition' ? 'Transition' : 'Flat Ground'} · {sample.rider} · {sample.stance} · {sample.sensorData.length} samples</div></button><button onClick={() => setDeleteConfirmId(sample.id)} className="text-[10px] text-red-400 uppercase shrink-0">Delete</button></div>)}</div>}
      </div>

      {addTerrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
          <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-1">Add Trick</h3>
            <p className="text-xs text-gray-500 mb-4">{addTerrain === 'flat' ? 'Flat Ground' : 'Transition'}</p>
            <input autoFocus value={newTrickName} onChange={(e) => setNewTrickName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTrick(); }} placeholder="Trick name" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white mb-4" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setAddTerrain(null)} className="bg-gray-700 text-white font-black py-3 rounded-xl uppercase">Cancel</button>
              <button onClick={addTrick} disabled={!newTrickName.trim()} className="bg-cyan-500 disabled:opacity-40 text-gray-950 font-black py-3 rounded-xl uppercase">Add Trick</button>
            </div>
          </div>
        </div>
      )}

      {deleteTrickId && selectedDeleteDefinition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
          <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-2">Delete {selectedDeleteDefinition.name}?</h3>
            <p className="text-sm text-gray-400 mb-6">
              {selectedDeleteCount > 0
                ? `This will permanently delete ${selectedDeleteCount} recorded sensor ${selectedDeleteCount === 1 ? 'sample' : 'samples'} for this trick.`
                : 'There are no recorded sensor samples for this trick yet.'}
              {' '}This cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteTrickId(null)} className="bg-gray-700 text-white font-black py-3 rounded-xl uppercase">Cancel</button>
              <button onClick={() => deleteTrick(selectedDeleteDefinition.id)} className="bg-red-600 text-white font-black py-3 rounded-xl uppercase">Delete Trick</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
          <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-2">Delete Sample?</h3>
            <p className="text-sm text-gray-400 mb-6">Do you really want to delete this sample?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="bg-gray-700 text-white font-black py-3 rounded-xl uppercase">No</button>
              <button onClick={() => deleteSample(deleteConfirmId)} className="bg-red-600 text-white font-black py-3 rounded-xl uppercase">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrickDatabasePage;
