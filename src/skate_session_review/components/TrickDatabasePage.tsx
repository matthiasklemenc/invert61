import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardSensorDataPoint, Stance, TrickSample } from '../types';
import {
  connectBoardSensor,
  disconnectBoardSensor,
  getBoardSensorDeviceName,
  isBoardSensorConnected,
  subscribeBoardSensor,
  subscribeBoardSensorStatus,
} from '../boardSensorConnection';

const STORAGE_KEY = 'invert61_trick_database_v1';
const PRE_ROLL_MS = 500;
const POST_ROLL_MS = 500;

const TRICKS = [
  'Ollie', 'Nollie', 'Kickflip', 'Heelflip', 'Varial Kickflip', 'Varial Heelflip',
  'Pop Shove-it', 'Frontside Shove-it', 'Frontside 180', 'Backside 180',
  'Frontside 360', 'Backside 360', 'Frontside Kickflip', 'Backside Kickflip',
  'Frontside Heelflip', 'Backside Heelflip', 'Boardslide', 'Lipslide',
  '50-50 Grind', '5-0 Grind', 'Nosegrind', 'Smith Grind', 'Feeble Grind',
  'Rock to Fakie', 'Rock and Roll', 'Axle Stall', 'Disaster', 'Tail Stall',
  'Manual', 'Nose Manual', 'Other',
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const motionValue = (sample: BoardSensorDataPoint) => {
  const acceleration = Math.sqrt(sample.ax ** 2 + sample.ay ** 2 + sample.az ** 2);
  const rotation = Math.sqrt(sample.gx ** 2 + sample.gy ** 2 + sample.gz ** 2) / 250;
  return acceleration + rotation;
};

const TrickDatabasePage: React.FC<{ onBack: () => void; initialStance?: Stance }> = ({ onBack, initialStance }) => {
  const [samples, setSamples] = useState<TrickSample[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [rider, setRider] = useState('Skater A');
  const [stance, setStance] = useState<Stance>(initialStance ?? Stance.Regular);
  const [trick, setTrick] = useState('Kickflip');
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

  const startTimeRef = useRef(0);
  const samplesRef = useRef<BoardSensorDataPoint[]>([]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const recordingRef = useRef(false);
  const unsubscribeSensorRef = useRef<(() => void) | null>(null);

  const writeDatabase = useCallback((next: TrickSample[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSamples(next);
  }, []);

  useEffect(() => {
    return subscribeBoardSensorStatus((connected, name) => {
      setSensorConnected(connected);
      setDeviceName(name);
    });
  }, []);

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

      if (!isBoardSensorConnected()) {
        await connectBoardSensor();
      }

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
    if (!reviewData.length) return;

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
        trick,
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
    const captureStart = sample.captureStartMs ?? 0;
    const normalizedData = sample.sensorData.map((point) => ({
      ...point,
      timestamp: point.timestamp - captureStart,
    }));
    const selectionStartRelative = Math.max(0, sample.selectionStartMs - captureStart);
    const selectionEndRelative = Math.max(selectionStartRelative + 20, sample.selectionEndMs - captureStart);
    const maxTimestamp = normalizedData[normalizedData.length - 1]?.timestamp ?? selectionEndRelative;

    setEditingSampleId(sample.id);
    setTrick(sample.trick);
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
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), samples }, null, 2)], { type: 'application/json' });
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
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Trick</label>
            <select value={trick} onChange={(e) => setTrick(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white">
              {TRICKS.map((item) => <option key={item}>{item}</option>)}
            </select>
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
              <button
                type="button"
                onClick={() => { setSensorError(null); disconnectBoardSensor(); }}
                className="w-full mt-3 border border-white/15 text-white font-black py-3 rounded-2xl uppercase tracking-widest hover:bg-white/5"
              >
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
          <p className="text-gray-500 text-xs mb-8">{rider} · {stance}</p>
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
                <p className="text-[10px] text-gray-500 uppercase">{rider} · {stance}</p>
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
        {samples.length === 0 ? <p className="text-xs text-gray-600">No training samples saved yet.</p> : <div className="space-y-2 max-h-72 overflow-auto">{samples.map((sample) => <div key={sample.id} className="flex items-center justify-between gap-3 bg-gray-900 rounded-xl p-3"><button onClick={() => openSavedSample(sample)} className="min-w-0 flex-1 text-left"><div className="text-sm font-bold text-white truncate">{sample.trick}</div><div className="text-[10px] text-gray-500">{sample.rider} · {sample.stance} · {sample.sensorData.length} samples</div></button><button onClick={() => setDeleteConfirmId(sample.id)} className="text-[10px] text-red-400 uppercase shrink-0">Delete</button></div>)}</div>}
      </div>

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
