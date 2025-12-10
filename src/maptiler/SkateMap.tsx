
import React, { useEffect, useRef, useState } from 'react';

// --- CONFIGURATION ---
const MAPTILER_KEY: string = '4gpXL4qS0zO5bGwk6mFK';

// Use a high-contrast dark style for the "Invert" aesthetic
const MAP_STYLE = `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;

export type GpsPoint = {
    lat: number;
    lon: number;
    timestamp?: number;
    speed?: number | null;
};

type Props = {
    // Mode 1: Session Path (Line)
    path?: GpsPoint[];
    
    // Mode 2: Spot Finder (Points) - Prepared for future
    markers?: { lat: number; lon: number; title: string; description?: string }[];
    
    // General config
    center?: [number, number]; // [lon, lat]
    zoom?: number;
    className?: string;
};

const SkateMap: React.FC<Props> = ({ path = [], markers = [], center, zoom, className }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<any>(null); 
    const [error, setError] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize Map
    useEffect(() => {
        if (map.current) return; // Already initialized
        if (!mapContainer.current) return;

        // SAFE ACCESS: Get the global variable ONLY when this effect runs
        const maplibregl = (window as any).maplibregl;

        if (!maplibregl) {
            console.error("MapLibre GL JS not loaded on window object.");
            setError("Map library could not load. Check internet connection.");
            return;
        }

        try {
            // Default center: Berlin or User's path start
            const startCenter = center 
                ? center 
                : (path.length > 0 ? [path[0].lon, path[0].lat] : [13.405, 52.52]); // Fallback [lon, lat]

            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: MAP_STYLE,
                center: startCenter as [number, number],
                zoom: zoom || 14,
                attributionControl: false, // Cleaner look
            });

            map.current.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');
            map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

            map.current.on('load', () => {
                setIsLoaded(true);
            });

            map.current.on('error', (e: any) => {
                console.error("Map Error:", e);
                // Only show visible error if it's a fatal map style load error
                if (e.error && e.error.message && (e.error.message.includes('style') || e.error.message.includes('Forbidden'))) {
                     setError(e.error.message);
                }
            });

        } catch (err: any) {
            console.error("Failed to initialize map:", err);
            setError(err.message || "Map failed to load");
        }

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Handle Path (Session Tracker)
    useEffect(() => {
        const maplibregl = (window as any).maplibregl; // Access here for types if needed, but map.current is already set
        
        if (!map.current || !isLoaded || path.length < 2 || !maplibregl) return;

        const coordinates = path.map(p => [p.lon, p.lat]);

        // Remove existing layer/source if updating
        if (map.current.getSource('session-route')) {
            if (map.current.getLayer('session-path')) map.current.removeLayer('session-path');
            if (map.current.getLayer('session-path-glow')) map.current.removeLayer('session-path-glow');
            map.current.removeSource('session-route');
        }

        map.current.addSource('session-route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                }
            }
        });

        // 1. Glow Layer (Underneath)
        map.current.addLayer({
            id: 'session-path-glow',
            type: 'line',
            source: 'session-route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#c52323', // Invert Red
                'line-width': 10,
                'line-opacity': 0.3,
                'line-blur': 4
            }
        });

        // 2. Main Path Layer
        map.current.addLayer({
            id: 'session-path',
            type: 'line',
            source: 'session-route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#ff4444', // Brighter Red for core
                'line-width': 4
            }
        });

        // Fit Bounds
        const bounds = new maplibregl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord as [number, number]));
        
        try {
            map.current.fitBounds(bounds, {
                padding: 50,
                animate: true
            });
        } catch (e) {
            console.warn("Could not fit bounds (invalid coords?)", e);
        }

    }, [isLoaded, path]);

    // Handle Markers (Spot Finder - Future Proofing)
    useEffect(() => {
        const maplibregl = (window as any).maplibregl;
        if (!map.current || !isLoaded || markers.length === 0 || !maplibregl) return;

        // Simple marker adding logic
        markers.forEach(marker => {
            const el = document.createElement('div');
            el.className = 'skate-marker';
            el.style.backgroundColor = '#c52323';
            el.style.width = '15px';
            el.style.height = '15px';
            el.style.borderRadius = '50%';
            el.style.border = '2px solid white';
            el.style.cursor = 'pointer';

            const popup = new maplibregl.Popup({ offset: 25 }).setText(marker.title);

            new maplibregl.Marker({ element: el })
                .setLngLat([marker.lon, marker.lat])
                .setPopup(popup)
                .addTo(map.current!);
        });
    }, [isLoaded, markers]);

    return (
        <div className={`relative w-full overflow-hidden rounded-lg bg-neutral-900 ${className || 'h-64'}`}>
            {error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/80 p-4 text-center">
                    <div>
                        <p className="text-red-500 font-bold mb-2">Map Error</p>
                        <p className="text-gray-300 text-sm">{error}</p>
                    </div>
                </div>
            )}
            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
};

export default SkateMap;
