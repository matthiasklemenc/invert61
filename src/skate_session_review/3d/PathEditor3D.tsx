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

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;
const GROUND_Y = 0;

type ViewMode = 'front' | 'top';

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

    const raycaster = useRef(new THREE.Raycaster());
    const pointer = useRef(new THREE.Vector2());
    const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y));

    const [view, setView] = useState<ViewMode>('front');
    const viewRef = useRef<ViewMode>('front');
    useEffect(() => {
        viewRef.current = view;
    }, [view]);

    /* ---------------------------------------------------
       CAMERA FRAMING
    ---------------------------------------------------- */
    const frameObject = (obj: THREE.Object3D | null, mode: ViewMode) => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;

        if (!obj) {
            camera.position.set(6, 4, 6);
            camera.lookAt(0, 1, 0);
            controls.target.set(0, 1, 0);
            controls.update();

            camera.near = 0.05;
            camera.far = 500;
            camera.updateProjectionMatrix();
            return;
        }

        const box = new THREE.Box3().setFromObject(obj);
        if (box.isEmpty()) return;

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const dist = Math.max(2.5, maxDim * 2.2);

        if (mode === 'top') {
            camera.position.set(center.x, center.y + dist * 1.8, center.z + 0.001);
        } else {
            camera.position.set(
                center.x + dist,
                center.y + dist * 0.6,
                center.z + dist
            );
        }

        camera.lookAt(center);
        controls.target.copy(center);

        // keep controls usable (pinch/wheel)
        controls.update();

        camera.near = 0.05;
        camera.far = 500;
        camera.updateProjectionMatrix();
    };

    const applyViewConstraints = (mode: ViewMode) => {
        const controls = controlsRef.current;
        if (!controls) return;

        // Always allow zoom (pinch / wheel)
        controls.enableZoom = true;
        controls.zoomSpeed = 1.0;

        // Make touch gestures do the right thing:
        // 1-finger = rotate/pan (depending on enableRotate), 2-finger = pinch zoom
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;

        // Touch mapping (pinch zoom works)
        controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        if (mode === 'top') {
            // top view: lock rotation so it stays a "map-like" top-down editor
            controls.enableRotate = false;
        } else {
            controls.enableRotate = true;
        }

        controls.update();
    };

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

        // ✅ OrbitControls (pinch zoom + wheel zoom)
        const controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        applyViewConstraints(viewRef.current);

        scene.add(new THREE.HemisphereLight(0xdbeafe, 0x020617, 0.75));

        const dir = new THREE.DirectionalLight(0xffffff, 0.9);
        dir.position.set(8, 12, 6);
        dir.castShadow = true;
        dir.shadow.mapSize.set(1024, 1024);
        scene.add(dir);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshStandardMaterial({ color: 0x020617 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = GROUND_Y - 0.1;
        ground.receiveShadow = true;
        scene.add(ground);

        const linesGroup = new THREE.Group();
        scene.add(linesGroup);
        linesGroupRef.current = linesGroup;

        const handleResize = () => {
            if (!rendererRef.current || !cameraRef.current || !containerRef.current) return;
            const nw = Math.max(container.clientWidth || MIN_WIDTH, MIN_WIDTH);
            const nh = Math.max(container.clientHeight || MIN_HEIGHT, MIN_HEIGHT);
            rendererRef.current.setSize(nw, nh);
            cameraRef.current.aspect = nw / nh;
            cameraRef.current.updateProjectionMatrix();

            // ✅ use current view, not stale
            if (rampRef.current) frameObject(rampRef.current, viewRef.current);
        };

        window.addEventListener('resize', handleResize);

        let raf = 0;
        const loop = () => {
            raf = requestAnimationFrame(loop);
            controls.update();
            renderer.render(scene, camera);
        };
        loop();

        frameObject(null, viewRef.current);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(raf);

            controls.dispose();
            renderer.dispose();

            container.removeChild(renderer.domElement);
        };
    }, []);

    /* ---------------------------------------------------
       BUILD RAMP
    ---------------------------------------------------- */
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        if (rampRef.current) {
            scene.remove(rampRef.current);
            disposeObject(rampRef.current);
        }

        const ramp = buildRampGroup(config);
        ramp.traverse(o => {
            const m = o as THREE.Mesh;
            if (m.isMesh) {
                m.castShadow = true;
                m.receiveShadow = true;
                m.frustumCulled = false;
            }
        });

        ramp.position.y = 0.02;
        scene.add(ramp);
        rampRef.current = ramp;

        // ✅ use current view, not stale
        frameObject(ramp, viewRef.current);
    }, [config]);

    /* ---------------------------------------------------
       VIEW SWITCH
    ---------------------------------------------------- */
    useEffect(() => {
        applyViewConstraints(view);
        if (rampRef.current) frameObject(rampRef.current, view);
    }, [view]);

    /* ---------------------------------------------------
       DRAWING (mouse only; touch is reserved for pinch/orbit)
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

        if (stroke[stroke.length - 1].distanceTo(p) < 0.03) return;
        stroke.push(p.clone());

        const line = linesGroupRef.current?.children.at(-1) as THREE.Line;
        if (!line) return;

        line.geometry.dispose();
        line.geometry = new THREE.BufferGeometry().setFromPoints(stroke);
    };

    const endStroke = () => {
        const stroke = currentStrokeRef.current;
        if (!stroke) return;

        strokesRef.current.push(stroke);
        currentStrokeRef.current = null;

        onPathChange?.(
            strokesRef.current.map(s => s.map(v => ({ x: v.x, y: v.y, z: v.z })))
        );
    };

    useEffect(() => {
        const dom = rendererRef.current?.domElement;
        if (!dom) return;

        const down = (e: PointerEvent) => {
            // ✅ Touch = OrbitControls / pinch zoom (no drawing)
            if (e.pointerType === 'touch') return;

            dom.setPointerCapture(e.pointerId);
            startStroke(e);
        };
        const move = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;
            if (currentStrokeRef.current) continueStroke(e);
        };
        const up = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;

            dom.releasePointerCapture(e.pointerId);
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
