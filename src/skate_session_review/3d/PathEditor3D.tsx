// C:\Users\user\Desktop\invert61\src\skate_session_review\3d\PathEditor3D.tsx

import React, { useEffect, useRef, useState } from 'react';
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

const PathEditor3D: React.FC<PathEditor3DProps> = ({ config, onPathChange }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rampRef = useRef<THREE.Group | null>(null);

    const strokesRef = useRef<THREE.Vector3[][]>([]);
    const currentStrokeRef = useRef<THREE.Vector3[] | null>(null);
    const linesGroupRef = useRef<THREE.Group | null>(null);

    const raycaster = useRef(new THREE.Raycaster());
    const pointer = useRef(new THREE.Vector2());
    const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y));

    const [view, setView] = useState<ViewMode>('front');

    /* ---------------------------------------------------
       CAMERA FIT (CRITICAL FIX) + VIEW MODE
    ----------------------------------------------------*/
    const frameObject = (obj: THREE.Object3D | null, mode: ViewMode) => {
        const camera = cameraRef.current;
        if (!camera) return;

        // Fallback if object is missing / empty
        if (!obj) {
            camera.position.set(6, 4, 6);
            camera.lookAt(0, 1, 0);
            camera.near = 0.05;
            camera.far = 500;
            camera.updateProjectionMatrix();
            return;
        }

        const box = new THREE.Box3().setFromObject(obj);
        if (box.isEmpty()) {
            camera.position.set(6, 4, 6);
            camera.lookAt(0, 1, 0);
            camera.near = 0.05;
            camera.far = 500;
            camera.updateProjectionMatrix();
            return;
        }

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const baseDist = Math.max(2.5, maxDim * 2.2);

        if (mode === 'top') {
            // Top-down: high Y, centered XZ
            const topDist = Math.max(size.x, size.z) * 2.4;
            camera.position.set(center.x, center.y + topDist, center.z);
        } else {
            // Front-ish: angled view
            camera.position.set(
                center.x + baseDist,
                center.y + baseDist * 0.6,
                center.z + baseDist
            );
        }

        camera.lookAt(center);
        camera.near = 0.05;
        camera.far = 500;
        camera.updateProjectionMatrix();
    };

    const disposeObject = (obj: THREE.Object3D) => {
        obj.traverse(o => {
            const m = o as THREE.Mesh;
            if (m.isMesh) {
                if (m.geometry) m.geometry.dispose();
                const mat: any = m.material;
                if (Array.isArray(mat)) mat.forEach(x => x?.dispose?.());
                else mat?.dispose?.();
            }
        });
    };

    /* ---------------------------------------------------
       SCENE INIT
    ----------------------------------------------------*/
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020617);
        sceneRef.current = scene;

        const w = Math.max(container.clientWidth || MIN_WIDTH, MIN_WIDTH);
        const h = Math.max(container.clientHeight || MIN_HEIGHT, MIN_HEIGHT);

        const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 500);
        camera.position.set(6, 4, 6);
        camera.lookAt(0, 1, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        scene.add(new THREE.HemisphereLight(0xdbeafe, 0x020617, 0.75));

        const dir = new THREE.DirectionalLight(0xffffff, 0.9);
        dir.position.set(8, 12, 6);
        dir.castShadow = true;
        dir.shadow.mapSize.set(1024, 1024);
        scene.add(dir);

        // Ground (visual only)
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 1, metalness: 0 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = GROUND_Y - 0.1;
        ground.receiveShadow = true;
        scene.add(ground);

        // Lines group
        const linesGroup = new THREE.Group();
        scene.add(linesGroup);
        linesGroupRef.current = linesGroup;

        // Resize
        const handleResize = () => {
            const rr = rendererRef.current;
            const cc = cameraRef.current;
            const cont = containerRef.current;
            if (!rr || !cc || !cont) return;

            const nw = Math.max(cont.clientWidth || MIN_WIDTH, MIN_WIDTH);
            const nh = Math.max(cont.clientHeight || MIN_HEIGHT, MIN_HEIGHT);
            rr.setSize(nw, nh);
            rr.setPixelRatio(window.devicePixelRatio || 1);
            cc.aspect = nw / nh;
            cc.updateProjectionMatrix();

            // keep ramp in view after resize
            if (rampRef.current) frameObject(rampRef.current, view);
        };
        window.addEventListener('resize', handleResize);

        // Render loop
        let raf = 0;
        const loop = () => {
            raf = requestAnimationFrame(loop);
            renderer.render(scene, camera);
        };
        loop();

        // Initial frame even before ramp exists
        frameObject(null, view);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(raf);

            // cleanup ramp
            if (rampRef.current) {
                scene.remove(rampRef.current);
                disposeObject(rampRef.current);
                rampRef.current = null;
            }

            // cleanup lines
            if (linesGroupRef.current) {
                linesGroupRef.current.traverse(o => {
                    const line = o as THREE.Line;
                    if ((line as any).isLine && (line as any).geometry) (line as any).geometry.dispose();
                    const mat: any = (line as any).material;
                    mat?.dispose?.();
                });
            }

            renderer.dispose();
            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------------------------------------------------
       BUILD RAMP
    ----------------------------------------------------*/
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        if (rampRef.current) {
            scene.remove(rampRef.current);
            disposeObject(rampRef.current);
            rampRef.current = null;
        }

        const ramp = buildRampGroup(config);

        // Force visibility & shadows
        ramp.traverse(o => {
            const m = o as THREE.Mesh;
            if (m.isMesh) {
                m.castShadow = true;
                m.receiveShadow = true;
                m.frustumCulled = false;
            }
        });

        ramp.position.y = 0;
        scene.add(ramp);
        rampRef.current = ramp;

        // CRITICAL: frame after adding ramp
        frameObject(ramp, view);
    }, [config]); // keep as-is (view changes handled below)

    /* ---------------------------------------------------
       VIEW TOGGLE (re-frame camera)
    ----------------------------------------------------*/
    useEffect(() => {
        if (!rampRef.current) return;
        frameObject(rampRef.current, view);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    /* ---------------------------------------------------
       DRAWING
    ----------------------------------------------------*/
    const pickPoint = (e: PointerEvent): THREE.Vector3 | null => {
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        if (!camera || !renderer) return null;

        const rect = renderer.domElement.getBoundingClientRect();
        pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.current.setFromCamera(pointer.current, camera);

        const p = new THREE.Vector3();
        const hit = raycaster.current.ray.intersectPlane(groundPlane.current, p);
        if (!hit) return null;

        // keep line slightly above ground so it doesn't z-fight
        p.y = GROUND_Y + 0.02;
        return p;
    };

    const startStroke = (e: PointerEvent) => {
        const p = pickPoint(e);
        if (!p) return;

        currentStrokeRef.current = [p.clone()];

        const geom = new THREE.BufferGeometry().setFromPoints(currentStrokeRef.current);
        const mat = new THREE.LineBasicMaterial({ color: 0xff4747 });
        const line = new THREE.Line(geom, mat);
        (line as any).userData.__isStroke = true;
        linesGroupRef.current?.add(line);
    };

    const continueStroke = (e: PointerEvent) => {
        const stroke = currentStrokeRef.current;
        if (!stroke) return;

        const p = pickPoint(e);
        if (!p) return;

        const last = stroke[stroke.length - 1];
        if (last && last.distanceTo(p) < 0.03) return;

        stroke.push(p.clone());

        const group = linesGroupRef.current;
        if (!group || group.children.length === 0) return;

        const line = group.children[group.children.length - 1] as THREE.Line;
        if (!line || !(line as any).isLine) return;

        line.geometry.dispose();
        line.geometry = new THREE.BufferGeometry().setFromPoints(stroke);
    };

    const endStroke = () => {
        const stroke = currentStrokeRef.current;
        if (!stroke || stroke.length === 0) {
            currentStrokeRef.current = null;
            return;
        }

        // Commit stroke
        strokesRef.current.push(stroke);
        currentStrokeRef.current = null;

        onPathChange?.(
            strokesRef.current.map(st => st.map(v => ({ x: v.x, y: v.y, z: v.z })))
        );
    };

    useEffect(() => {
        const dom = rendererRef.current?.domElement;
        if (!dom) return;

        const onDown = (e: PointerEvent) => {
            dom.setPointerCapture(e.pointerId);
            startStroke(e);
        };
        const onMove = (e: PointerEvent) => {
            if (!currentStrokeRef.current) return;
            continueStroke(e);
        };
        const onUp = (e: PointerEvent) => {
            if (dom.hasPointerCapture(e.pointerId)) dom.releasePointerCapture(e.pointerId);
            endStroke();
        };

        dom.addEventListener('pointerdown', onDown);
        dom.addEventListener('pointermove', onMove);
        dom.addEventListener('pointerup', onUp);
        dom.addEventListener('pointercancel', onUp);
        dom.addEventListener('pointerleave', onUp);

        return () => {
            dom.removeEventListener('pointerdown', onDown);
            dom.removeEventListener('pointermove', onMove);
            dom.removeEventListener('pointerup', onUp);
            dom.removeEventListener('pointercancel', onUp);
            dom.removeEventListener('pointerleave', onUp);
        };
    }, []);

    /* ---------------------------------------------------
       UI
    ----------------------------------------------------*/
    return (
        <div className="relative w-full h-[320px] md:h-[420px]">
            <div
                ref={containerRef}
                className="w-full h-full rounded-lg overflow-hidden bg-slate-950 border border-white/10"
            />

            {/* View toggle (Front / Top) */}
            <div className="absolute top-2 right-2 flex gap-2">
                <button
                    type="button"
                    onClick={() => setView('front')}
                    className={
                        'px-3 py-1 text-[11px] rounded-full border ' +
                        (view === 'front'
                            ? 'bg-white text-black border-white'
                            : 'bg-black/60 text-gray-100 border-white/20 hover:bg-black/80')
                    }
                >
                    Front
                </button>

                <button
                    type="button"
                    onClick={() => setView('top')}
                    className={
                        'px-3 py-1 text-[11px] rounded-full border ' +
                        (view === 'top'
                            ? 'bg-white text-black border-white'
                            : 'bg-black/60 text-gray-100 border-white/20 hover:bg-black/80')
                    }
                >
                    Top
                </button>
            </div>
        </div>
    );
};

export default PathEditor3D;
