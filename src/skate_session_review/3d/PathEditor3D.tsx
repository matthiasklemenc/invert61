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
    const zoomRef = useRef(1.0);

    /* ---------------------------------------------------
       CAMERA FRAMING (DETERMINISTIC)
    ---------------------------------------------------- */
    const frameObject = (obj: THREE.Object3D | null) => {
        const camera = cameraRef.current;
        if (!camera) return;

        if (!obj) {
            camera.position.set(6, 4, 6);
            camera.lookAt(0, 1, 0);
            camera.updateProjectionMatrix();
            return;
        }

        const box = new THREE.Box3().setFromObject(obj);
        if (box.isEmpty()) return;

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        const dist = maxDim * 2.2 * zoomRef.current;

        if (view === 'top') {
            camera.position.set(center.x, center.y + dist, center.z);
            camera.lookAt(center.x, center.y, center.z);
        } else {
            camera.position.set(
                center.x + dist,
                center.y + dist * 0.5,
                center.z + dist
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

        scene.add(new THREE.HemisphereLight(0xdbeafe, 0x020617, 0.8));

        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(10, 15, 8);
        dir.castShadow = true;
        scene.add(dir);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshStandardMaterial({ color: 0x020617 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = GROUND_Y - 0.05;
        ground.receiveShadow = true;
        scene.add(ground);

        const linesGroup = new THREE.Group();
        scene.add(linesGroup);
        linesGroupRef.current = linesGroup;

        let raf = 0;
        const loop = () => {
            raf = requestAnimationFrame(loop);
            renderer.render(scene, camera);
        };
        loop();

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            zoomRef.current = THREE.MathUtils.clamp(
                zoomRef.current + e.deltaY * 0.001,
                0.4,
                3.0
            );
            if (rampRef.current) frameObject(rampRef.current);
        };

        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        const handleResize = () => {
            const nw = Math.max(container.clientWidth || MIN_WIDTH, MIN_WIDTH);
            const nh = Math.max(container.clientHeight || MIN_HEIGHT, MIN_HEIGHT);
            renderer.setSize(nw, nh);
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            if (rampRef.current) frameObject(rampRef.current);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(raf);
            renderer.domElement.removeEventListener('wheel', onWheel);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    /* ---------------------------------------------------
       BUILD RAMP (THIS IS WHERE IT MUST SHOW)
    ---------------------------------------------------- */
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        if (rampRef.current) {
            scene.remove(rampRef.current);
        }

        const ramp = buildRampGroup(config);
        ramp.traverse(o => {
            if ((o as THREE.Mesh).isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        scene.add(ramp);
        rampRef.current = ramp;

        frameObject(ramp);
    }, [config, view]);

    /* ---------------------------------------------------
       DRAWING
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

        const down = (e: PointerEvent) => {
            const p = pickPoint(e);
            if (!p) return;

            currentStrokeRef.current = [p.clone()];
            const geom = new THREE.BufferGeometry().setFromPoints(currentStrokeRef.current);
            const mat = new THREE.LineBasicMaterial({ color: 0xff4747 });
            linesGroupRef.current?.add(new THREE.Line(geom, mat));
        };

        const move = (e: PointerEvent) => {
            if (!currentStrokeRef.current) return;
            const p = pickPoint(e);
            if (!p) return;

            currentStrokeRef.current.push(p.clone());
            const line = linesGroupRef.current?.children.at(-1) as THREE.Line;
            line.geometry.dispose();
            line.geometry = new THREE.BufferGeometry().setFromPoints(currentStrokeRef.current);
        };

        const up = () => {
            if (!currentStrokeRef.current) return;
            strokesRef.current.push(currentStrokeRef.current);
            currentStrokeRef.current = null;

            onPathChange?.(
                strokesRef.current.map(s => s.map(v => ({ x: v.x, y: v.y, z: v.z })))
            );
        };

        dom.addEventListener('pointerdown', down);
        dom.addEventListener('pointermove', move);
        dom.addEventListener('pointerup', up);

        return () => {
            dom.removeEventListener('pointerdown', down);
            dom.removeEventListener('pointermove', move);
            dom.removeEventListener('pointerup', up);
        };
    }, []);

    /* ---------------------------------------------------
       UI
    ---------------------------------------------------- */
    return (
        <div className="relative w-full h-[320px] md:h-[420px]">
            <div
                ref={containerRef}
                className="w-full h-full rounded-lg overflow-hidden bg-slate-950 border border-white/10"
            />

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
        </div>
    );
};

export default PathEditor3D;
