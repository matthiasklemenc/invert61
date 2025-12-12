// C:\Users\user\Desktop\invert61\src\skate_session_review\3d\PathEditor3D.tsx

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { RampConfig } from '../planner/rampTypes';
import { RAMP_TYPES } from '../planner/rampTypes';
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

type Mode = 'rotate' | 'draw';
type SnapMode = 'off' | 'coping' | 'deck' | 'center';

const PathEditor3D: React.FC<PathEditor3DProps> = ({ config, onPathChange }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const rampRef = useRef<THREE.Group | null>(null);

    const strokesRef = useRef<THREE.Vector3[][]>([]);
    const currentStrokeRef = useRef<THREE.Vector3[] | null>(null);
    const linesGroupRef = useRef<THREE.Group | null>(null);
    const groundRef = useRef<THREE.Mesh | null>(null);
    const ghostRef = useRef<THREE.Mesh | null>(null);

    const raycaster = useRef(new THREE.Raycaster());
    const pointer = useRef(new THREE.Vector2());

    const [mode, setMode] = useState<Mode>('draw');
    const [snapMode, setSnapMode] = useState<SnapMode>('off');

    // discipline info (transition / street) – kept for future tweaks
    const rampDiscipline: 'transition' | 'street' | 'unknown' = (() => {
        const t = RAMP_TYPES.find(r => r.id === config.typeId);
        return t?.discipline ?? 'unknown';
    })();

    // Notify parent about updated strokes
    const emitPathChange = () => {
        if (!onPathChange) return;
        const out = strokesRef.current.map(st =>
            st.map(v => ({ x: v.x, y: v.y, z: v.z })),
        );
        onPathChange(out);
    };

    // -----------------------
    //  INITIALIZE 3D SCENE
    // -----------------------
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020617);
        sceneRef.current = scene;

        // Camera
        const width = container.clientWidth || 640;
        const height = container.clientHeight || 360;

        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
        camera.position.set(5, 3.5, 6);
        camera.lookAt(0, 1, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const hemi = new THREE.HemisphereLight(0xdbeafe, 0x020617, 0.6);
        scene.add(hemi);

        const dir = new THREE.DirectionalLight(0xffffff, 0.9);
        dir.position.set(6, 10, 4);
        dir.castShadow = true;
        dir.shadow.mapSize.set(1024, 1024);
        dir.shadow.camera.near = 1;
        dir.shadow.camera.far = 30;
        dir.shadow.camera.left = -10;
        dir.shadow.camera.right = 10;
        dir.shadow.camera.top = 10;
        dir.shadow.camera.bottom = -10;
        scene.add(dir);

        // Ground
        const groundGeom = new THREE.PlaneGeometry(40, 40);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x020617,
            roughness: 1.0,
            metalness: 0.0,
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        scene.add(ground);
        groundRef.current = ground;

        // Group for strokes
        const linesGroup = new THREE.Group();
        scene.add(linesGroup);
        linesGroupRef.current = linesGroup;

        // Ghost preview point (small glowing sphere)
        const ghostGeo = new THREE.SphereGeometry(0.04, 16, 16);
        const ghostMat = new THREE.MeshStandardMaterial({
            color: 0xff8080,
            emissive: 0xff4747,
            emissiveIntensity: 0.9,
            metalness: 0.1,
            roughness: 0.3,
        });
        const ghost = new THREE.Mesh(ghostGeo, ghostMat);
        ghost.visible = false;
        scene.add(ghost);
        ghostRef.current = ghost;

        // Orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.minPolarAngle = Math.PI / 6;
        controls.maxPolarAngle = Math.PI / 2;
        controls.enabled = false; // start in draw mode
        controlsRef.current = controls;

        // Resize handler
        const handleResize = () => {
            if (!rendererRef.current || !cameraRef.current || !containerRef.current)
                return;
            const w = containerRef.current.clientWidth || 640;
            const h = containerRef.current.clientHeight || 360;
            rendererRef.current.setSize(w, h);
            cameraRef.current.aspect = w / h;
            cameraRef.current.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);

        // Animation loop
        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameId);
            controls.dispose();
            renderer.dispose();
            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Keep OrbitControls enabled only in rotate mode
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.enabled = mode === 'rotate';
        }
        // Hide ghost point when rotating
        if (ghostRef.current && mode !== 'draw') {
            ghostRef.current.visible = false;
        }
    }, [mode]);

    // -----------------------
    //  BUILD / REBUILD RAMP
    // -----------------------
    useEffect(() => {
        if (!sceneRef.current) return;

        if (rampRef.current) {
            sceneRef.current.remove(rampRef.current);
        }

        const ramp = buildRampGroup(config);
        ramp.traverse(obj => {
            if ((obj as THREE.Mesh).isMesh) {
                const m = obj as THREE.Mesh;
                m.castShadow = true;
                m.receiveShadow = true;
            }
        });

        ramp.position.y = 0;
        sceneRef.current.add(ramp);
        rampRef.current = ramp;
    }, [config]);

    // -----------------------
    //  HELPERS
    // -----------------------

    // Simple Catmull-Rom curve smoothing for nicer strokes
    const smoothStroke = (points: THREE.Vector3[]): THREE.Vector3[] => {
        if (points.length < 3) return points;
        const curve = new THREE.CatmullRomCurve3(points);
        const segments = Math.min(points.length * 4, 200);
        return curve.getPoints(segments);
    };

    // Snapping helper
    const applySnapping = (point: THREE.Vector3): THREE.Vector3 => {
        if (snapMode === 'off') return point;

        const snapped = point.clone();

        // Rough world height of ramp top (matches rampMeshes scaling: ft * 0.15)
        const copingHeight = config.heightFt * 0.15;
        const deckHeight = copingHeight + 0.08;

        switch (snapMode) {
            case 'coping':
                snapped.y = copingHeight;
                break;
            case 'deck':
                snapped.y = deckHeight;
                break;
            case 'center':
                snapped.z = 0;
                break;
            default:
                break;
        }

        // reserved for discipline-specific tweaks later
        void rampDiscipline;

        return snapped;
    };

    // Raycast into ramp / ground and optionally snap result
    const pickOnSurface = (event: PointerEvent): THREE.Vector3 | null => {
        const renderer = rendererRef.current;
        const camera = cameraRef.current;

        if (!renderer || !camera) return null;

        const rect = renderer.domElement.getBoundingClientRect();
        pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.current.setFromCamera(pointer.current, camera);

        const targets: THREE.Object3D[] = [];
        if (rampRef.current) targets.push(rampRef.current);
        if (groundRef.current) targets.push(groundRef.current);

        const hits = raycaster.current.intersectObjects(targets, true);
        if (!hits.length) return null;

        const hitPoint = hits[0].point.clone();
        return applySnapping(hitPoint);
    };

    const startStroke = (event: PointerEvent) => {
        const p = pickOnSurface(event);
        if (!p) return;

        currentStrokeRef.current = [p];

        const geom = new THREE.BufferGeometry().setFromPoints([p]);
        const mat = new THREE.LineBasicMaterial({ color: 0xff4747, linewidth: 2 });
        const line = new THREE.Line(geom, mat);
        line.userData.__isStroke = true;

        linesGroupRef.current?.add(line);
    };

    const continueStroke = (event: PointerEvent) => {
        if (!currentStrokeRef.current) return;

        const p = pickOnSurface(event);
        if (!p) return;

        const pts = currentStrokeRef.current;
        const last = pts[pts.length - 1];

        // Skip very tiny movements to avoid insane vertex counts
        if (last.distanceTo(p) < 0.03) return;

        pts.push(p);

        const line = linesGroupRef.current?.children[
            linesGroupRef.current.children.length - 1
        ] as THREE.Line | undefined;

        if (!line) return;

        const smoothed = smoothStroke(pts);
        line.geometry.dispose();
        line.geometry = new THREE.BufferGeometry().setFromPoints(smoothed);
    };

    const endStroke = () => {
        if (!currentStrokeRef.current || !currentStrokeRef.current.length) return;

        strokesRef.current.push(currentStrokeRef.current);
        currentStrokeRef.current = null;
        emitPathChange();
    };

    // -----------------------
    //  POINTER EVENTS
    // -----------------------
    useEffect(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;
        const dom = renderer.domElement;

        const handlePointerDown = (ev: PointerEvent) => {
            if (mode !== 'draw') return;
            dom.setPointerCapture(ev.pointerId);
            startStroke(ev);
        };

        const handlePointerMove = (ev: PointerEvent) => {
            if (mode !== 'draw') return;

            // Update ghost cursor
            const p = pickOnSurface(ev);
            if (ghostRef.current) {
                if (p) {
                    ghostRef.current.position.copy(p);
                    ghostRef.current.visible = true;
                } else {
                    ghostRef.current.visible = false;
                }
            }

            if (currentStrokeRef.current) {
                continueStroke(ev);
            }
        };

        const handlePointerUp = (ev: PointerEvent) => {
            if (mode !== 'draw') return;
            if (dom.hasPointerCapture(ev.pointerId)) {
                dom.releasePointerCapture(ev.pointerId);
            }
            endStroke();
        };

        dom.addEventListener('pointerdown', handlePointerDown);
        dom.addEventListener('pointermove', handlePointerMove);
        dom.addEventListener('pointerup', handlePointerUp);
        dom.addEventListener('pointerleave', handlePointerUp);

        return () => {
            dom.removeEventListener('pointerdown', handlePointerDown);
            dom.removeEventListener('pointermove', handlePointerMove);
            dom.removeEventListener('pointerup', handlePointerUp);
            dom.removeEventListener('pointerleave', handlePointerUp);
        };
    }, [mode, snapMode]);

    // -----------------------
    //  UNDO / RESET
    // -----------------------
    const handleUndo = () => {
        if (!strokesRef.current.length) return;
        strokesRef.current.pop();

        if (!linesGroupRef.current) return;

        for (let i = linesGroupRef.current.children.length - 1; i >= 0; i--) {
            const child = linesGroupRef.current.children[i];
            if ((child as any).userData?.__isStroke) {
                linesGroupRef.current.remove(child);
                break;
            }
        }
        emitPathChange();
    };

    const handleReset = () => {
        strokesRef.current = [];
        currentStrokeRef.current = null;

        if (linesGroupRef.current) {
            [...linesGroupRef.current.children].forEach(c => {
                if ((c as any).userData?.__isStroke) {
                    linesGroupRef.current!.remove(c);
                }
            });
        }
        if (ghostRef.current) {
            ghostRef.current.visible = false;
        }
        emitPathChange();
    };

    // -----------------------
    //  RENDER UI
    // -----------------------
    return (
        <div className="relative w-full h-full">
            <div
                ref={containerRef}
                className="w-full h-full rounded-lg overflow-hidden bg-slate-950 border border-white/10"
            />

            <div className="absolute top-2 left-2 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setMode('draw')}
                    className={
                        'px-3 py-1 text-[11px] rounded-full border ' +
                        (mode === 'draw'
                            ? 'bg-[#c52323] border-[#c52323] text-white'
                            : 'bg-black/40 border-white/20 text-gray-200')
                    }
                >
                    Draw Line
                </button>

                <button
                    type="button"
                    onClick={() => setMode('rotate')}
                    className={
                        'px-3 py-1 text-[11px] rounded-full border ' +
                        (mode === 'rotate'
                            ? 'bg-white text-black border-white'
                            : 'bg-black/40 border-white/20 text-gray-200')
                    }
                >
                    Rotate View
                </button>

                <div className="ml-2 flex items-center gap-1 bg-black/40 border border-white/20 rounded-full px-2 py-1">
                    <span className="text-[10px] uppercase tracking-wide text-gray-300">
                        Snap
                    </span>
                    {(['off', 'coping', 'deck', 'center'] as SnapMode[]).map(modeKey => (
                        <button
                            key={modeKey}
                            type="button"
                            onClick={() => setSnapMode(modeKey)}
                            className={
                                'px-2 py-0.5 text-[10px] rounded-full ' +
                                (snapMode === modeKey
                                    ? 'bg-white text-black'
                                    : 'bg-transparent text-gray-300')
                            }
                        >
                            {modeKey === 'off'
                                ? 'Off'
                                : modeKey === 'coping'
                                ? 'Coping'
                                : modeKey === 'deck'
                                ? 'Deck'
                                : 'Center'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                    type="button"
                    onClick={handleUndo}
                    className="px-3 py-1 text-[11px] rounded-full bg-black/60 border border-white/20 text-gray-100 hover:bg-black/80"
                >
                    Undo
                </button>

                <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1 text-[11px] rounded-full bg-black/60 border border-white/20 text-gray-100 hover:bg-black/80"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default PathEditor3D;
