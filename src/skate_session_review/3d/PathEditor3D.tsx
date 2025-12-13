// C:\Users\user\Desktop\invert61\src\skate_session_review\3d\PathEditor3D.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { RampConfig } from '../planner/rampTypes';
import { buildRampGroup } from './rampMeshes';

export interface PathPoint3D {
    x: number;
    y: number;
    z: number;
}

interface PathEditor3DProps {
    config: RampConfig;
    onPathChange?: (strokes: PathPoint3D[][]) => void;
}

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;
const GROUND_Y = 0;

type ViewMode = 'front' | 'top';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const PathEditor3D: React.FC<PathEditor3DProps> = ({ config, onPathChange }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rampRef = useRef<THREE.Group | null>(null);

    // drawing state
    const strokesRef = useRef<THREE.Vector3[][]>([]);
    const currentStrokeRef = useRef<THREE.Vector3[] | null>(null);
    const linesGroupRef = useRef<THREE.Group | null>(null);

    const raycaster = useRef(new THREE.Raycaster());
    const pointer = useRef(new THREE.Vector2());
    const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y));

    const [view, setView] = useState<ViewMode>('front');
    const viewRef = useRef<ViewMode>('front');
    useEffect(() => {
        viewRef.current = view;
        // reframe immediately on view switch
        if (rampRef.current) frameObject(rampRef.current, view);
    }, [view]);

    // zoom (used for wheel + pinch)
    const zoomRef = useRef(1.0);

    // pinch tracking
    const activeTouches = useRef<Map<number, { x: number; y: number }>>(new Map());
    const lastPinchDistRef = useRef<number | null>(null);

    const disposeObject = (obj: THREE.Object3D) => {
        obj.traverse(o => {
            const m = o as THREE.Mesh;
            if (m.isMesh) {
                m.geometry?.dispose();
                const mat: any = m.material;
                if (Array.isArray(mat)) mat.forEach(x => x?.dispose?.());
                else mat?.dispose?.();
            }
        });
    };

    const emitStrokes = () => {
        onPathChange?.(
            strokesRef.current.map(s => s.map(v => ({ x: v.x, y: v.y, z: v.z })))
        );
    };

    const clearLines = () => {
        const g = linesGroupRef.current;
        if (!g) return;

        g.children.forEach(child => {
            const line = child as THREE.Line;
            line.geometry?.dispose?.();
            const mat: any = line.material;
            mat?.dispose?.();
        });
        g.clear();
    };

    const undoStroke = () => {
        if (currentStrokeRef.current) return; // don't undo mid-stroke
        if (strokesRef.current.length === 0) return;

        strokesRef.current.pop();

        // remove last rendered line
        const g = linesGroupRef.current;
        if (g && g.children.length > 0) {
            const last = g.children[g.children.length - 1] as THREE.Line;
            last.geometry?.dispose?.();
            const mat: any = last.material;
            mat?.dispose?.();
            g.remove(last);
        }

        emitStrokes();
    };

    const resetStrokes = () => {
        currentStrokeRef.current = null;
        strokesRef.current = [];
        clearLines();
        emitStrokes();
    };

    /* ---------------------------------------------------
       CAMERA FRAMING (STATIC VIEWS)
    ---------------------------------------------------- */
    const frameObject = (obj: THREE.Object3D | null, mode: ViewMode) => {
        const camera = cameraRef.current;
        if (!camera) return;

        if (!obj) {
            camera.position.set(6, 4, 6);
            camera.lookAt(0, 1, 0);
            camera.near = 0.05;
            camera.far = 500;
            camera.updateProjectionMatrix();
            return;
        }

        obj.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(obj);
        if (box.isEmpty()) return;

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const baseDist = Math.max(2.8, maxDim * 2.2);
        const dist = baseDist * clamp(zoomRef.current, 0.4, 3.0);

        if (mode === 'top') {
            // true top-down (slight Z epsilon avoids lookAt degeneracy)
            camera.position.set(center.x, center.y + dist, center.z + 0.001);
            camera.lookAt(center.x, center.y, center.z);
        } else {
            // "front" = fixed, slightly 3D-ish angle (static, NOT orbitable)
            camera.position.set(
                center.x + dist,
                center.y + dist * 0.45,
                center.z + dist * 0.85
            );
            camera.lookAt(center);
        }

        camera.near = 0.05;
        camera.far = 500;
        camera.updateProjectionMatrix();
    };

    /* ---------------------------------------------------
       SCENE INIT
    ---------------------------------------------------- */
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020617);
        sceneRef.current = scene;

        const w = Math.max(container.clientWidth || MIN_WIDTH, MIN_WIDTH);
        const h = Math.max(container.clientHeight || MIN_HEIGHT, MIN_HEIGHT);

        const camera = new THREE.PerspectiveCamera(35, w / h, 0.05, 500);
        camera.position.set(6, 4, 6);
        camera.lookAt(0, 1, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        scene.add(new THREE.HemisphereLight(0xdbeafe, 0x020617, 0.95));

        const dir = new THREE.DirectionalLight(0xffffff, 1.15);
        dir.position.set(10, 15, 8);
        dir.castShadow = true;
        dir.shadow.mapSize.set(1024, 1024);
        scene.add(dir);

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshStandardMaterial({ color: 0x020617 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = GROUND_Y - 0.05;
        ground.receiveShadow = true;
        scene.add(ground);

        // Grid helper (helps verify camera even when ramp is missing)
        const grid = new THREE.GridHelper(40, 40, 0x1f2a44, 0x0b1220);
        grid.position.y = GROUND_Y;
        (grid.material as THREE.Material).transparent = true;
        (grid.material as THREE.Material).opacity = 0.6;
        scene.add(grid);

        // Lines group
        const linesGroup = new THREE.Group();
        scene.add(linesGroup);
        linesGroupRef.current = linesGroup;

        // Render loop
        let raf = 0;
        const loop = () => {
            raf = requestAnimationFrame(loop);
            renderer.render(scene, camera);
        };
        loop();

        // Wheel zoom (mouse)
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            zoomRef.current = clamp(zoomRef.current + e.deltaY * 0.001, 0.4, 3.0);
            if (rampRef.current) frameObject(rampRef.current, viewRef.current);
        };
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        // Pinch zoom (touch)
        const onPointerDown = (e: PointerEvent) => {
            if (e.pointerType !== 'touch') return;
            renderer.domElement.setPointerCapture(e.pointerId);
            activeTouches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activeTouches.current.size === 2) {
                const pts = Array.from(activeTouches.current.values());
                const dx = pts[0].x - pts[1].x;
                const dy = pts[0].y - pts[1].y;
                lastPinchDistRef.current = Math.hypot(dx, dy);
            }
        };

        const onPointerMove = (e: PointerEvent) => {
            if (e.pointerType !== 'touch') return;
            if (!activeTouches.current.has(e.pointerId)) return;

            activeTouches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activeTouches.current.size !== 2) return;

            const pts = Array.from(activeTouches.current.values());
            const dx = pts[0].x - pts[1].x;
            const dy = pts[0].y - pts[1].y;
            const dist = Math.hypot(dx, dy);

            const last = lastPinchDistRef.current;
            if (last && last > 0) {
                const delta = (last - dist) * 0.004; // pinch sensitivity
                zoomRef.current = clamp(zoomRef.current + delta, 0.4, 3.0);
                if (rampRef.current) frameObject(rampRef.current, viewRef.current);
            }
            lastPinchDistRef.current = dist;
        };

        const onPointerUp = (e: PointerEvent) => {
            if (e.pointerType !== 'touch') return;
            activeTouches.current.delete(e.pointerId);
            if (activeTouches.current.size < 2) lastPinchDistRef.current = null;
        };

        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        renderer.domElement.addEventListener('pointermove', onPointerMove);
        renderer.domElement.addEventListener('pointerup', onPointerUp);
        renderer.domElement.addEventListener('pointercancel', onPointerUp);

        const handleResize = () => {
            const nw = Math.max(container.clientWidth || MIN_WIDTH, MIN_WIDTH);
            const nh = Math.max(container.clientHeight || MIN_HEIGHT, MIN_HEIGHT);
            renderer.setSize(nw, nh);
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            if (rampRef.current) frameObject(rampRef.current, viewRef.current);
        };

        window.addEventListener('resize', handleResize);

        // initial frame
        frameObject(null, viewRef.current);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(raf);

            renderer.domElement.removeEventListener('wheel', onWheel);
            renderer.domElement.removeEventListener('pointerdown', onPointerDown);
            renderer.domElement.removeEventListener('pointermove', onPointerMove);
            renderer.domElement.removeEventListener('pointerup', onPointerUp);
            renderer.domElement.removeEventListener('pointercancel', onPointerUp);

            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    /* ---------------------------------------------------
       BUILD RAMP (FORCE VISIBILITY + REFRESH FRAME)
    ---------------------------------------------------- */
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        // remove old ramp
        if (rampRef.current) {
            scene.remove(rampRef.current);
            disposeObject(rampRef.current);
            rampRef.current = null;
        }

        const ramp = buildRampGroup(config);

        // force consistent placement + visibility
        ramp.position.set(0, 0, 0);
        ramp.rotation.set(0, 0, 0);

        ramp.traverse(o => {
            const m = o as THREE.Mesh;
            if (m.isMesh) {
                m.visible = true;
                m.castShadow = true;
                m.receiveShadow = true;
                m.frustumCulled = false;
            }
        });

        ramp.updateMatrixWorld(true);

        scene.add(ramp);
        rampRef.current = ramp;

        // frame camera *after* it is in the scene + matrices updated
        frameObject(ramp, viewRef.current);

    }, [config, view]);

    /* ---------------------------------------------------
       DRAWING (mouse/pen only; touch reserved for pinch)
    ---------------------------------------------------- */
    const pickPoint = (e: PointerEvent): THREE.Vector3 | null => {
        if (!cameraRef.current || !rendererRef.current) return null;

        const rect = rendererRef.current.domElement.getBoundingClientRect();
        pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.current.setFromCamera(pointer.current, cameraRef.current);
        const p = new THREE.Vector3();
        if (!raycaster.current.ray.intersectPlane(groundPlane.current, p)) return null;

        p.y = GROUND_Y + 0.02;
        return p;
    };

    useEffect(() => {
        const dom = rendererRef.current?.domElement;
        if (!dom) return;

        const startStroke = (e: PointerEvent) => {
            const p = pickPoint(e);
            if (!p) return;

            currentStrokeRef.current = [p.clone()];
            const geom = new THREE.BufferGeometry().setFromPoints(currentStrokeRef.current);
            const mat = new THREE.LineBasicMaterial({ color: 0xff4747 });
            linesGroupRef.current?.add(new THREE.Line(geom, mat));
        };

        const continueStroke = (e: PointerEvent) => {
            const stroke = currentStrokeRef.current;
            if (!stroke) return;

            const p = pickPoint(e);
            if (!p) return;

            // reduce noise
            if (stroke.length > 0 && stroke[stroke.length - 1].distanceTo(p) < 0.02) return;

            stroke.push(p.clone());

            const line = linesGroupRef.current?.children.at(-1) as THREE.Line | undefined;
            if (!line) return;

            line.geometry.dispose();
            line.geometry = new THREE.BufferGeometry().setFromPoints(stroke);
        };

        const endStroke = () => {
            const stroke = currentStrokeRef.current;
            if (!stroke) return;

            strokesRef.current.push(stroke);
            currentStrokeRef.current = null;
            emitStrokes();
        };

        const down = (e: PointerEvent) => {
            // touch is pinch/zoom only
            if (e.pointerType === 'touch') return;

            dom.setPointerCapture(e.pointerId);
            startStroke(e);
        };

        const move = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;
            continueStroke(e);
        };

        const up = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;
            try {
                dom.releasePointerCapture(e.pointerId);
            } catch {
                // ignore
            }
            endStroke();
        };

        dom.addEventListener('pointerdown', down);
        dom.addEventListener('pointermove', move);
        dom.addEventListener('pointerup', up);
        dom.addEventListener('pointercancel', up);
        dom.addEventListener('pointerleave', up);

        return () => {
            dom.removeEventListener('pointerdown', down);
            dom.removeEventListener('pointermove', move);
            dom.removeEventListener('pointerup', up);
            dom.removeEventListener('pointercancel', up);
            dom.removeEventListener('pointerleave', up);
        };
    }, [onPathChange]);

    const canUndo = useMemo(() => strokesRef.current.length > 0, [view, config]);

    /* ---------------------------------------------------
       UI
    ---------------------------------------------------- */
    return (
        <div className="relative w-full h-[320px] md:h-[420px]">
            <div
                ref={containerRef}
                className="w-full h-full rounded-lg overflow-hidden bg-slate-950 border border-white/10"
            />

            {/* View buttons */}
            <div className="absolute top-2 right-2 flex gap-2">
                <button
                    onClick={() => setView('front')}
                    className={`px-3 py-1 text-[11px] rounded-full border ${
                        view === 'front'
                            ? 'bg-white text-black'
                            : 'bg-black/60 text-white border-white/20'
                    }`}
                >
                    Front
                </button>
                <button
                    onClick={() => setView('top')}
                    className={`px-3 py-1 text-[11px] rounded-full border ${
                        view === 'top'
                            ? 'bg-white text-black'
                            : 'bg-black/60 text-white border-white/20'
                    }`}
                >
                    Top
                </button>
            </div>

            {/* Line controls */}
            <div className="absolute bottom-2 left-2 flex gap-2">
                <button
                    onClick={undoStroke}
                    className="px-3 py-1 text-[11px] rounded-full border bg-black/60 text-white border-white/20 hover:bg-black/75"
                    title="Undo last stroke"
                >
                    Undo
                </button>
                <button
                    onClick={resetStrokes}
                    className="px-3 py-1 text-[11px] rounded-full border bg-black/60 text-white border-white/20 hover:bg-black/75"
                    title="Clear all strokes"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default PathEditor3D;
