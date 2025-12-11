// C:\Users\user\Desktop\invert61\src\skate_session_review\3d\PathEditor3D.tsx

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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

    const raycaster = useRef(new THREE.Raycaster());
    const pointer = useRef(new THREE.Vector2());

    const [mode, setMode] = useState<'rotate' | 'draw'>('draw');

    // Notify parent about updated strokes
    const emitPathChange = () => {
        if (!onPathChange) return;
        const out = strokesRef.current.map(st =>
            st.map(v => ({ x: v.x, y: v.y, z: v.z }))
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

        // Orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.minPolarAngle = Math.PI / 6;
        controls.maxPolarAngle = Math.PI / 2;
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
    //  DRAWING HELPERS
    // -----------------------

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

        return hits[0].point.clone();
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

        if (last.distanceTo(p) < 0.04) return;

        pts.push(p);

        const line = linesGroupRef.current?.children[
            linesGroupRef.current.children.length - 1
        ] as THREE.Line | undefined;

        if (!line) return;

        line.geometry.dispose();
        line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    };

    const endStroke = () => {
        if (!currentStrokeRef.current || !currentStrokeRef.current.length) return;

        strokesRef.current.push(currentStrokeRef.current);
        currentStrokeRef.current = null;
        emitPathChange();
    };

    // Pointer event handlers
    useEffect(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;
        const dom = renderer.domElement;

        const down = (ev: PointerEvent) => {
            if (mode !== 'draw') return;
            dom.setPointerCapture(ev.pointerId);
            startStroke(ev);
        };

        const move = (ev: PointerEvent) => {
            if (mode !== 'draw') return;
            if (currentStrokeRef.current) continueStroke(ev);
        };

        const up = (ev: PointerEvent) => {
            if (mode !== 'draw') return;
            if (dom.hasPointerCapture(ev.pointerId)) dom.releasePointerCapture(ev.pointerId);
            endStroke();
        };

        dom.addEventListener('pointerdown', down);
        dom.addEventListener('pointermove', move);
        dom.addEventListener('pointerup', up);
        dom.addEventListener('pointerleave', up);

        return () => {
            dom.removeEventListener('pointerdown', down);
            dom.removeEventListener('pointermove', move);
            dom.removeEventListener('pointerup', up);
            dom.removeEventListener('pointerleave', up);
        };
    }, [mode]);

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

            <div className="absolute top-2 left-2 flex gap-2">
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
