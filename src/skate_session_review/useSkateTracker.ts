
import { useState, useRef, useCallback } from 'react';
import { SkateSession, GpsPoint } from './types';
import { workerString } from '../tracker.worker';

// Define the shape of messages coming from the worker
interface WorkerMessage {
    type: 'UPDATE' | 'HIGHLIGHT' | 'SESSION_END';
    payload: any;
}

export const useSkateTracker = (onSessionComplete: (session: SkateSession) => void) => {
    const workerRef = useRef<Worker | null>(null);
    const [trackerState, setTrackerState] = useState({
        status: 'idle',
        totalDistance: 0,
        duration: 0,
        timeOnBoard: 0,
        timeOffBoard: 0,
        currentSpeed: 0,
        topSpeed: 0,
        isRolling: false,
        counts: { pumps: 0, ollies: 0, airs: 0, fsGrinds: 0, bsGrinds: 0, stalls: 0, slams: 0 },
        debugMessage: ''
    });
    const [error, setError] = useState<string | null>(null);

    const startTracking = useCallback((stance: 'REGULAR' | 'GOOFY') => {
        if (workerRef.current) workerRef.current.terminate();

        // Create a blob URL for the worker script
        const blob = new Blob([workerString], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        workerRef.current = new Worker(workerUrl);

        // Load trained tricks from localStorage
        let trainedTricks = {};
        try {
            const savedTricks = localStorage.getItem('invert-trained-tricks');
            if (savedTricks) {
                trainedTricks = JSON.parse(savedTricks);
            }
        } catch (e) {
            console.error("Failed to load trained tricks", e);
        }

        // Initialize worker
        workerRef.current.postMessage({ type: 'START', payload: { stance, trainedTricks } });

        // Setup message handling
        workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
            const { type, payload } = event.data;
            if (type === 'UPDATE') {
                setTrackerState(prev => ({ ...prev, ...payload }));
            } else if (type === 'SESSION_END') {
                onSessionComplete(payload);
                setTrackerState(prev => ({ ...prev, status: 'idle' }));
            }
        };

        // GPS Handling
        let watchId: number;
        if ('geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    workerRef.current?.postMessage({
                        type: 'POSITION_UPDATE',
                        payload: {
                            coords: {
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude,
                                speed: pos.coords.speed
                            },
                            timestamp: pos.timestamp
                        }
                    });
                },
                (err) => setError(`GPS Error: ${err.message}`),
                { enableHighAccuracy: true, maximumAge: 0 }
            );
        }

        // Motion Sensor Handling
        const handleMotion = (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity;
            const rot = e.rotationRate;
            if (!acc || !rot) return;

            workerRef.current?.postMessage({
                type: 'MOTION',
                payload: {
                    acc: { x: acc.x, y: acc.y, z: acc.z },
                    rot: { alpha: rot.alpha, beta: rot.beta, gamma: rot.gamma },
                    timestamp: e.timeStamp
                }
            });
        };

        // Request permission on iOS
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            (DeviceMotionEvent as any).requestPermission()
                .then((response: string) => {
                    if (response === 'granted') {
                        window.addEventListener('devicemotion', handleMotion);
                    } else {
                        setError("Motion permission denied");
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('devicemotion', handleMotion);
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            window.removeEventListener('devicemotion', handleMotion);
        };

    }, [onSessionComplete]);

    const stopTracking = useCallback(() => {
        workerRef.current?.postMessage({ type: 'STOP' });
        // Cleanup happens in the SESSION_END handler or component unmount
    }, []);

    return { trackerState, error, startTracking, stopTracking };
};
