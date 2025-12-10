import { useState, useRef, useCallback } from 'react';
import { MotionDataPoint, TrickTake } from './types';

export type RecorderStatus = 'idle' | 'permission' | 'arming' | 'armed' | 'recording' | 'confirming' | 'denied' | 'error';

const STILLNESS_THRESHOLD = 0.05; // Lower is stricter
const STILLNESS_DURATION = 1500; // ms
const RECORD_START_THRESHOLD = 2.0; // G-force to start
const RECORD_END_THRESHOLD = 1.2; // G-force to stop
const MAX_RECORD_DURATION = 5000; // ms

export const useMotionRecorder = () => {
    const [status, setStatus] = useState<RecorderStatus>('idle');
    const motionBuffer = useRef<MotionDataPoint[]>([]);
    const stillnessBuffer = useRef<number[]>([]);
    const stillnessTimer = useRef<number | null>(null);
    const recordingTimer = useRef<number | null>(null);

    const [recordedData, setRecordedData] = useState<TrickTake | null>(null);

    const handleMotion = (e: DeviceMotionEvent) => {
        const acc = e.accelerationIncludingGravity;
        const rot = e.rotationRate;
        if (!acc || !rot) return;

        const dataPoint: MotionDataPoint = {
            ax: acc.x ?? 0, ay: acc.y ?? 0, az: acc.z ?? 0,
            gx: rot.alpha ?? 0, gy: rot.beta ?? 0, gz: rot.gamma ?? 0,
            timestamp: e.timeStamp,
        };
        
        const magnitude = Math.sqrt(dataPoint.ax**2 + dataPoint.ay**2 + dataPoint.az**2) / 9.81;

        if (status === 'arming') {
            stillnessBuffer.current.push(magnitude);
            if (stillnessBuffer.current.length > 20) stillnessBuffer.current.shift();
            
            const mean = stillnessBuffer.current.reduce((a, b) => a + b, 0) / stillnessBuffer.current.length;
            const variance = stillnessBuffer.current.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / stillnessBuffer.current.length;
            
            if (variance < STILLNESS_THRESHOLD) {
                if (!stillnessTimer.current) {
                    stillnessTimer.current = window.setTimeout(() => {
                        setStatus('armed');
                        motionBuffer.current = []; // Clear buffer before recording starts
                    }, STILLNESS_DURATION);
                }
            } else {
                if (stillnessTimer.current) {
                    clearTimeout(stillnessTimer.current);
                    stillnessTimer.current = null;
                }
            }
        } else if (status === 'armed') {
            if (magnitude > RECORD_START_THRESHOLD) {
                setStatus('recording');
                motionBuffer.current.push(dataPoint);
                recordingTimer.current = window.setTimeout(() => stopRecording(), MAX_RECORD_DURATION);
            }
        } else if (status === 'recording') {
            motionBuffer.current.push(dataPoint);
            // End recording when motion settles down
            if (magnitude < RECORD_END_THRESHOLD) {
                stopRecording();
            }
        }
    };

    const stopRecording = () => {
        window.removeEventListener('devicemotion', handleMotion);
        if (recordingTimer.current) clearTimeout(recordingTimer.current);
        recordingTimer.current = null;
        setRecordedData([...motionBuffer.current]);
        setStatus('confirming');
    };

    const startRecordingAttempt = useCallback(async () => {
        setStatus('permission');
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceMotionEvent as any).requestPermission();
                if (permissionState !== 'granted') {
                    setStatus('denied');
                    return;
                }
            } catch (err) {
                console.error(err);
                setStatus('error');
                return;
            }
        }
        
        motionBuffer.current = [];
        stillnessBuffer.current = [];
        if (stillnessTimer.current) clearTimeout(stillnessTimer.current);
        stillnessTimer.current = null;

        window.addEventListener('devicemotion', handleMotion);
        setStatus('arming');
    }, []);

    const confirmTake = () => {
        setStatus('idle');
        setRecordedData(null);
    };

    const discardTake = () => {
        setStatus('idle');
        setRecordedData(null);
    };

    return { status, startRecordingAttempt, confirmTake, discardTake, recordedData };
};
