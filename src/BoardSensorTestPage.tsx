import React, { useCallback, useEffect, useState } from 'react';
import { BoardSensorDataPoint } from './skate_session_review/types';
import {
  connectBoardSensor,
  disconnectBoardSensor,
  getBoardSensorDeviceName,
  isBoardSensorConnected,
  subscribeBoardSensor,
  subscribeBoardSensorStatus,
} from './skate_session_review/boardSensorConnection';

interface SensorValues {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  roll: number;
  pitch: number;
  yaw: number;
}

const EMPTY_VALUES: SensorValues = {
  ax: 0,
  ay: 0,
  az: 0,
  gx: 0,
  gy: 0,
  gz: 0,
  roll: 0,
  pitch: 0,
  yaw: 0,
};

const formatNumber = (value: number, decimals = 2) => value.toFixed(decimals);

const ValueCard: React.FC<{ label: string; value: string; unit: string }> = ({
  label,
  value,
  unit,
}) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
    <div className="text-[11px] uppercase tracking-widest text-gray-500">{label}</div>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-bold tabular-nums text-white">{value}</span>
      <span className="text-xs text-gray-500">{unit}</span>
    </div>
  </div>
);

const BoardSensorTestPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [status, setStatus] = useState(isBoardSensorConnected() ? 'Connected — receiving data' : 'Not connected');
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState(getBoardSensorDeviceName());
  const [values, setValues] = useState<SensorValues>(EMPTY_VALUES);
  const [packetCount, setPacketCount] = useState(0);

  const handleSensorPoint = useCallback((point: BoardSensorDataPoint) => {
    setValues(point);
    setPacketCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const unsubscribeData = subscribeBoardSensor(handleSensorPoint);
    const unsubscribeStatus = subscribeBoardSensorStatus((connected, name) => {
      setStatus(connected ? 'Connected — receiving data' : 'Not connected');
      setDeviceName(name);
      if (!connected) setPacketCount(0);
    });

    return () => {
      unsubscribeData();
      unsubscribeStatus();
    };
  }, [handleSensorPoint]);

  const connect = useCallback(async () => {
    setError(null);
    try {
      setStatus('Connecting…');
      setPacketCount(0);
      await connectBoardSensor();
    } catch (err) {
      if ((err as Error)?.name === 'NotFoundError') {
        setStatus('Not connected');
        return;
      }
      setStatus('Connection failed');
      setError(err instanceof Error ? err.message : 'Unknown Bluetooth error.');
    }
  }, []);

  const disconnect = useCallback(() => {
    setError(null);
    disconnectBoardSensor();
  }, []);

  const isConnected = isBoardSensorConnected();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6 relative h-10 w-full max-w-4xl">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center w-full absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
          <h1 className="text-xl font-bold tracking-wider text-cyan-400">BOARD SENSOR</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">WT9011DCL Test</p>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto">
        <section className="rounded-2xl border border-white/10 bg-gray-800/70 p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Bluetooth</div>
              <div className="mt-1 font-semibold text-white">{deviceName}</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-600'}`} />
              <span className="text-gray-300">{status}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={connect}
              disabled={isConnected}
              className="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-gray-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              CONNECT SENSOR
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={!isConnected}
              className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              DISCONNECT
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            Notifications received: <span className="tabular-nums text-gray-300">{packetCount}</span>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ValueCard label="Acceleration X" value={formatNumber(values.ax)} unit="g" />
          <ValueCard label="Acceleration Y" value={formatNumber(values.ay)} unit="g" />
          <ValueCard label="Acceleration Z" value={formatNumber(values.az)} unit="g" />
          <ValueCard label="Gyroscope X" value={formatNumber(values.gx)} unit="°/s" />
          <ValueCard label="Gyroscope Y" value={formatNumber(values.gy)} unit="°/s" />
          <ValueCard label="Gyroscope Z" value={formatNumber(values.gz)} unit="°/s" />
          <ValueCard label="Roll" value={formatNumber(values.roll)} unit="°" />
          <ValueCard label="Pitch" value={formatNumber(values.pitch)} unit="°" />
          <ValueCard label="Yaw" value={formatNumber(values.yaw)} unit="°" />
        </section>

        <p className="mt-5 text-center text-xs leading-relaxed text-gray-500">
          This test page only connects to the WT9011DCL and displays its live BLE data. It does not change the existing session tracker or trick-recognition logic.
        </p>
      </main>
    </div>
  );
};

export default BoardSensorTestPage;
