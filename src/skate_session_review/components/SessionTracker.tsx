import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint, BoardSensorDataPoint, Stance } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
  }

const SERVICE_UUID = '0000ffe5-0000-1000-8000-00805f9a34fb';
const NOTIFY_CHARACTERISTIC_UUID = '0000ffe4-0000-1000-8000-00805f9a34fb';
const SENSOR_NAME_PREFIX = 'WT901';

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

type BluetoothCharacteristic = BluetoothRemoteGATTCharacteristic & {
  value?: DataView | null;
};

type BluetoothDeviceWithGatt = BluetoothDevice & {
  gatt: BluetoothRemoteGATTServer | null;
};

type WebBluetoothNavigator = Navigator & {
  bluetooth?: {
    requestDevice(options: {
      filters?: Array<{ namePrefix?: string }>;
      optionalServices?: string[];
    }): Promise<BluetoothDeviceWithGatt>;
  };
};

const readInt16LE = (view: DataView, offset: number) => view.getInt16(offset, true);

const parseWitMotionPacket = (value: DataView): SensorValues | null => {
  if (value.byteLength < 20 || value.getUint8(0) !== 0x55 || value.getUint8(1) !== 0x61) {
    return null;
  }

  const scaleAcc = 16 / 32768;
  const scaleGyro = 2000 / 32768;
  const scaleAngle = 180 / 32768;

  return {
    ax: readInt16LE(value, 2) * scaleAcc,
    ay: readInt16LE(value, 4) * scaleAcc,
    az: readInt16LE(value, 6) * scaleAcc,
    gx: readInt16LE(value, 8) * scaleGyro,
    gy: readInt16LE(value, 10) * scaleGyro,
    gz: readInt16LE(value, 12) * scaleGyro,
    roll: readInt16LE(value, 14) * scaleAngle,
    pitch: readInt16LE(value, 16) * scaleAngle,
    yaw: readInt16LE(value, 18) * scaleAngle,
  };
};

const SessionTracker: React.FC<SessionTrackerProps> = ({ onSessionComplete, onBack }) => {
  const [status, setStatus] = useState<'uninitialized' | 'tracking'>('uninitialized');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pointsRecorded, setPointsRecorded] = useState(0);
  const [sensorConnected, setSensorConnected] = useState(false);
  const [sensorPacketCount, setSensorPacketCount] = useState(0);
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('—');
  const [selectedStance, setSelectedStance] = useState<Stance | null>(null);

  const statusRef = useRef(status);
  const startTimeRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);

  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  const boardSensorDataRef = useRef<BoardSensorDataPoint[]>([]);

  const deviceRef = useRef<BluetoothDeviceWithGatt | null>(null);
  const characteristicRef = useRef<BluetoothCharacteristic | null>(null);
  const lastTimelineLogTimeRef = useRef(0);

  const setTrackerStatus = (nextStatus: typeof status) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  };

  const disconnectSensor = useCallback(() => {
    const characteristic = characteristicRef.current;
    if (characteristic) {
      characteristic.removeEventListener('characteristicvaluechanged', handleNotification);
    }

    const device = deviceRef.current;
    if (device) {
      device.removeEventListener('gattserverdisconnected', handleSensorDisconnected);
      if (device.gatt?.connected) {
        device.gatt.disconnect();
      }
    }

    deviceRef.current = null;
    characteristicRef.current = null;
    setSensorConnected(false);
    setDeviceName('—');
  }, []);

  function handleSensorDisconnected() {
    setSensorConnected(false);
  }

  const handleNotification = useCallback((event: Event) => {
    const characteristic = event.target as BluetoothCharacteristic;
    if (!characteristic.value || statusRef.current !== 'tracking') return;

    const parsed = parseWitMotionPacket(characteristic.value);
    if (!parsed) return;

    const now = Date.now();
    const timestamp = now - startTimeRef.current;

    const sensorPoint: BoardSensorDataPoint = {
      timestamp,
      ...parsed,
    };

    boardSensorDataRef.current.push(sensorPoint);
    setSensorPacketCount((count) => count + 1);

    // Keep the existing timeline alive, but now source it from the board sensor
    // instead of the phone's DeviceMotion API.
    if (now - lastTimelineLogTimeRef.current >= 150) {
      lastTimelineLogTimeRef.current = now;

      const totalG = Math.sqrt(
        parsed.ax * parsed.ax +
        parsed.ay * parsed.ay +
        parsed.az * parsed.az,
      );

      const rotationMagnitude = Math.sqrt(
        parsed.gx * parsed.gx +
        parsed.gy * parsed.gy +
        parsed.gz * parsed.gz,
      );

      timelineRef.current.push({
        timestamp: parseFloat((timestamp / 1000).toFixed(2)),
        intensity: parseFloat(totalG.toFixed(2)),
        rotation: parseFloat(rotationMagnitude.toFixed(2)),
      });

      setPointsRecorded(timelineRef.current.length);
    }
  }, []);

  const connectSensor = useCallback(async () => {
    const bluetooth = (navigator as WebBluetoothNavigator).bluetooth;

    if (!bluetooth) {
      throw new Error('Web Bluetooth is not available. Open INVERT in Chrome on Android.');
    }

    setSensorError(null);
    setDeviceName('—');

    const device = await bluetooth.requestDevice({
      filters: [{ namePrefix: SENSOR_NAME_PREFIX }],
      optionalServices: [SERVICE_UUID],
    });

    deviceRef.current = device;
    setDeviceName(device.name || 'WT901 sensor');
    device.addEventListener('gattserverdisconnected', handleSensorDisconnected);

    const server = await device.gatt?.connect();
    if (!server) {
      throw new Error('Could not connect to the sensor GATT server.');
    }

    const service = await server.getPrimaryService(SERVICE_UUID);
    const characteristic = (await service.getCharacteristic(
      NOTIFY_CHARACTERISTIC_UUID,
    )) as BluetoothCharacteristic;

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', handleNotification);
    characteristicRef.current = characteristic;

    setSensorConnected(true);
  }, [handleNotification]);

  const startRecording = async () => {
    if (statusRef.current === 'tracking' || !selectedStance) return;

    try {
      await connectSensor();

      timelineRef.current = [];
      speedReadingsRef.current = [];
      pathRef.current = [];
      boardSensorDataRef.current = [];
      setElapsedTime(0);
      setPointsRecorded(0);
      setSensorPacketCount(0);

      startTimeRef.current = Date.now();
      lastTimelineLogTimeRef.current = startTimeRef.current;

      setTrackerStatus('tracking');

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const now = Date.now();
            const speed = (pos.coords.speed || 0) * 3.6;

            speedReadingsRef.current.push(speed);

            pathRef.current.push({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              timestamp: pos.timestamp,
              speed,
              sessionTimestamp: now - startTimeRef.current,
            });
          },
          (error) => {
            console.error('GPS error:', error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
          },
        );
      }
    } catch (error) {
      setSensorConnected(false);
      setSensorError(error instanceof Error ? error.message : 'Could not connect to the WT901 sensor.');
    }
  };

  const stopSession = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setElapsedTime(durationSeconds);

    const speeds = speedReadingsRef.current;

    onSessionComplete({
      id: `skate-${Date.now()}`,
      date: new Date().toISOString(),
      duration: durationSeconds,
      trickSummary: {},
      totalTricks: 0,
      maxSpeed: speeds.length ? Math.max(...speeds) : 0,
      avgSpeed: speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
      timelineData: [...timelineRef.current],
      path: pathRef.current.length > 1 ? [...pathRef.current] : undefined,
      boardSensorData: [...boardSensorDataRef.current],
      stance: selectedStance ?? undefined,
    });

    setTrackerStatus('uninitialized');
    disconnectSensor();
  };

  useEffect(() => {
    if (status === 'tracking') {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      const characteristic = characteristicRef.current;
      if (characteristic) {
        characteristic.removeEventListener('characteristicvaluechanged', handleNotification);
      }

      const device = deviceRef.current;
      if (device) {
        device.removeEventListener('gattserverdisconnected', handleSensorDisconnected);
        if (device.gatt?.connected) {
          device.gatt.disconnect();
        }
      }
    };
  }, [handleNotification]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-3xl shadow-2xl min-h-[520px] border border-gray-700">
      <h2 className="text-2xl font-black mb-6 text-cyan-400 uppercase tracking-tighter italic">
        Session Tracker
      </h2>

      {status === 'uninitialized' && (
        <div className="w-full text-center space-y-6">
          <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-700">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Step 1 · Rider stance</p>
            <p className="text-gray-300 text-sm leading-relaxed font-mono">
              Select the rider stance before recording. It is stored with the session and is also used for trick-database samples.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[Stance.Regular, Stance.Goofy].map((stance) => (
              <button
                key={stance}
                type="button"
                onClick={() => setSelectedStance(stance)}
                className={`py-4 rounded-xl font-black uppercase tracking-widest transition-all ${selectedStance === stance ? 'bg-cyan-500 text-gray-950' : 'bg-gray-900 text-gray-400 border border-gray-700'}`}
              >
                {stance}
              </button>
            ))}
          </div>

          {selectedStance && (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Step 2 · Session type</p>
              <button
                type="button"
                onClick={() => { startRecording(); }}
                className="w-full bg-green-500 text-gray-900 font-black py-4 rounded-2xl uppercase tracking-widest"
              >
                SESSION TRACKER · RECORD SESSION
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-700">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Board Sensor</p>
              <p className="text-sm font-bold text-green-400">WT9011DCL</p>
            </div>
            <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-700">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">GPS</p>
              <p className="text-sm font-bold text-cyan-400">High Accuracy</p>
            </div>
          </div>

          {sensorError && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {sensorError}
            </div>
          )}
        </div>
      )}

      {status === 'tracking' && (
        <div className="text-center w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] text-white font-black mb-6 bg-red-600 animate-pulse uppercase tracking-widest">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            Tracking Active
          </div>

          <div className="text-8xl font-black text-white mb-8 tabular-nums tracking-tighter drop-shadow-lg">
            {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:
            {(elapsedTime % 60).toString().padStart(2, '0')}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-700 text-left">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Sensor</p>
              <p className={`text-sm font-black ${sensorConnected ? 'text-green-400' : 'text-red-400'}`}>
                {sensorConnected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-[10px] text-gray-600 mt-1 truncate">{deviceName}</p>
            </div>

            <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-700 text-left">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Signal</p>
              <p className="text-sm font-black text-cyan-400">Receiving</p>
              <p className="text-[10px] text-gray-600 mt-1">{sensorPacketCount} packets</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-700 shadow-inner">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Sensor Samples</p>
              <p className="text-4xl font-black text-cyan-400 tabular-nums">
                {sensorPacketCount}
              </p>
            </div>
            <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-700 shadow-inner">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">GPS Points</p>
              <p className="text-4xl font-black text-white tabular-nums">
                {pathRef.current.length}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-[10px] text-gray-600 font-mono mb-8 uppercase font-bold">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            {pointsRecorded} Timeline Points Logged
          </div>

          <button
            onClick={stopSession}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 text-2xl rounded-2xl shadow-2xl transition-all active:scale-95 border-b-4 border-red-800"
          >
            STOP SESSION
          </button>
        </div>
      )}

      {status !== 'tracking' && (
        <div className="mt-auto w-full pt-4">
          <button
            onClick={onBack}
            className="w-full bg-transparent text-gray-700 font-bold py-2 rounded-lg hover:text-white transition-all text-[10px] uppercase tracking-[0.4em]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionTracker;
