// skate_session_review/useSkateTracker.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
    SkateSession,
    TrackerState,
    WorkerCommand,
    WorkerMessage,
    PositionUpdatePayload
} from './types';
import { workerString } from './tracker.worker';

// Fix: Add counts to initialState to match the updated TrackerState type.
const initialState: TrackerState = {
    status: 'idle',
    stance: 'REGULAR',
    startTime: null,
    totalDistance: 0,
    duration: 0,
    timeOnBoard: 0,
    timeOffBoard: 0,
    currentSpeed: 0,
    topSpeed: 0,
    isRolling: false,
    debugMessage: '',
    counts: {
        pumps: 0,
        ollies: 0,
        airs: 0,
        fsGrinds: 0,
        bsGrinds: 0,
        stalls: 0,
        slams: 0,
    },
};

export const useSkateTracker = (onSessionEnd: (session: SkateSession) => void) => {
    const [trackerState, setTrackerState] = useState<TrackerState>(initialState);
    const [error, setError] = useState<string | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const fallbackIntervalRef = useRef<number | null>(null);
    const motionReceivedRef = useRef(false);
    const latestMotionRef = useRef<any>(null);

    // -----------------------------------------------------
    // Worker creation / teardown
    // -----------------------------------------------------
    useEffect(() => {
        const blob = new Blob([workerString], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
            const { type, payload } = event.data;

            switch (type) {
                case 'UPDATE':
                    setTrackerState(prev => ({
                        ...prev,
                        ...payload,
                    }));
                    setError(null);
                    break;

                case 'SESSION_END':
                    onSessionEnd(payload);
                    setTrackerState(initialState);
                    break;

                case 'ERROR':
                    setError(payload.message);
                    setTrackerState(prev => ({
                        ...prev,
                        status: 'error',
                        debugMessage: payload.message,
                    }));
                    break;
            }
        };

        return () => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            workerRef.current = null;
        };
    }, [onSessionEnd]);

    // ---------------------------------------------------------
    // DIRECT MOTION LISTENER (best accuracy)
    // ---------------------------------------------------------
    useEffect(() => {
        function handleMotion(e: DeviceMotionEvent) {
            motionReceivedRef.current = true;

            // 🔥 FIX: Standardize on accelerationIncludingGravity for robust physics
            const accRaw = e.accelerationIncludingGravity;
            const rot = e.rotationRate;

            const motionPayload = {
                acc: accRaw
                    ? { x: accRaw.x ?? 0, y: accRaw.y ?? 0, z: accRaw.z ?? 0 }
                    : null,
                rot: rot
                    ? { alpha: rot.alpha ?? 0, beta: rot.beta ?? 0, gamma: rot.gamma ?? 0 }
                    : null,
                timestamp: Date.now(),
            };

            latestMotionRef.current = motionPayload;

            const worker = workerRef.current;
            if (worker) {
                worker.postMessage({
                    type: 'MOTION',
                    payload: motionPayload,
                });
            }
        }

        window.addEventListener('devicemotion', handleMotion, { passive: true });

        return () => {
            window.removeEventListener('devicemotion', handleMotion);
        };
    }, []);

    // ---------------------------------------------------------
    // HYBRID FALLBACK (if no motion event arrives)
    // ---------------------------------------------------------
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!motionReceivedRef.current) {
                console.log("⚠ No direct devicemotion events — using fallback polling mode.");

                // Start fallback polling 60Hz
                fallbackIntervalRef.current = window.setInterval(() => {
                    const m = latestMotionRef.current;
                    if (!m) return;

                    workerRef.current?.postMessage({
                        type: "MOTION",
                        payload: m,
                    });
                }, 16);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    // -----------------------------------------------------
    // Stop tracking
    // -----------------------------------------------------
    const stopTracking = useCallback(() => {
        workerRef.current?.postMessage({ type: 'STOP' } as WorkerCommand);

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        if (fallbackIntervalRef.current !== null) {
            clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = null;
        }
    }, []);

    // -----------------------------------------------------
    // Start tracking
    // -----------------------------------------------------
    const startTracking = useCallback(
        async (stance: 'REGULAR' | 'GOOFY') => {
            setError(null);
            motionReceivedRef.current = false; // reset hybrid flag

            setTrackerState({
                ...initialState,
                stance,
                status: 'tracking',
                debugMessage: '',
            });

            // iOS motion permission (Android ignores this)
            if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                try {
                    const permissionState = await (DeviceMotionEvent as any).requestPermission();
                    if (permissionState !== 'granted') {
                        const msg = 'Motion sensor permission denied.';
                        setError(msg);
                        setTrackerState(prev => ({
                            ...prev,
                            status: 'denied',
                            debugMessage: msg,
                        }));
                        return;
                    }
                } catch {
                    const msg = 'Motion sensor permission request failed.';
                    setError(msg);
                    setTrackerState(prev => ({
                        ...prev,
                        status: 'error',
                        debugMessage: msg,
                    }));
                    return;
                }
            }

            // cleanup old GPS watchers
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }

            // tell worker to begin
            workerRef.current?.postMessage(
                { type: 'START', payload: { stance } } as WorkerCommand
            );

            // GPS watcher
            watchIdRef.current = navigator.geolocation.watchPosition(
                position => {
                    const payload: PositionUpdatePayload = {
                        coords: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            speed: position.coords.speed,
                        },
                        timestamp: position.timestamp,
                    };

                    workerRef.current?.postMessage({
                        type: 'POSITION_UPDATE',
                        payload,
                    } as WorkerCommand);
                },
                err => {
                    const errorMessage = `GPS Error: ${err.message}`;
                    setError(errorMessage);
                    setTrackerState(prev => ({
                        ...prev,
                        status: 'error',
                        debugMessage: errorMessage,
                    }));

                    if (err.code === err.PERMISSION_DENIED) {
                        stopTracking();
                    }
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 1000,
                    timeout: 10000,
                }
            );
        },
        [stopTracking]
    );

    return { trackerState, error, startTracking, stopTracking };
};