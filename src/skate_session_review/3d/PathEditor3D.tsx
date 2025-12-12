// C:\Users\user\Desktop\invert61\src\skate_session_review\3d\PathEditor3D.tsx

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { RampConfig } from '../planner/rampTypes';
import { RAMP_TYPES } from '../planner/rampTypes';
import { buildRampGroup } from './rampMeshes';
import { detectGrindSections } from '../planner/grindDetection';

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
type SnapMode = 'off' | 'coping';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;
const GROUND_Y = 0;

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
    const grindGroupRef = useRef<THREE.Group | null>(null);

    const groundRef = useRef<THREE.Mesh | null>(null);
    const ghostRef = useRef<THREE.Mesh | null>(null);

    const raycaster = useRef(new THREE.Raycaster());
    const heightRaycaster = useRef(new THREE.Raycaster());
    const pointer = useRef(new THREE.Vector2());
    const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y));

    const [mode, setMode] = useState<Mode>('draw');
    const [snapMode, setSnapMode] = useState<SnapMode>('off');

    /* ---------------------------------------------------
       HELPERS
    ----------------------------------------------------*/

    const rebuildGrindHighlights = () => {
        if (!sceneRef.current || !rampRef.current || !grindGroupRef.current) return;

        grindGroupRef.current.clear();

        const flatPath = strokesRef.current.flat();
        if (flatPath.length < 2) return;

        const box = new THREE.Box3().setFromObject(rampRef.current);
        if (box.isEmpty()) return;

        const grindSections = detectGrindSections(
            flatPath.map(v => ({ x: v.x, y: v.y, z: v.z })),
            box.max.y
        );

        grindSections.forEach(section => {
            const startIdx = Math.floor(section.startT * (flatPath.length - 1));
            const endIdx = Math.ceil(section.endT * (flatPath.length - 1));

            const pts = flatPath.slice(startIdx, endIdx + 1);
            if (pts.length < 2) return;

            const geom = new THREE.BufferGeometry().setFromPoints(pts);
            const mat = new THREE.LineBasicMaterial({
                color: 0xfacc15, // yellow
                linewidth: 3,
            });

            const line = new THREE.Line(geom, mat);
            grindGroupRef.current!.add(line);
        });
    };

    const emitPathChange = () => {
        onPathChange?.(
            strokesRef.current.map(st =>
                st.map(v => ({ x: v.x, y: v.y, z: v.z }))
            )
        );
        rebuildGrindHighlights();
    };

    /* ---------------------------------------------------
       SCENE SETUP
    ----------------------------------------------------*/

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020617);
        sceneRef.current = scene;

        const w = Math.max(container.clientWidth, MIN_WIDTH);
        const h = Math.max(container.clientHeight, MIN_HEIGHT);

        const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
        camera.position.set(5, 3.5, 6);
        camera.lookAt(0, 1, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        scene.add(new THREE.HemisphereLight(0xdbeafe, 0x020617, 0.6));

        const dir = new THREE.DirectionalLight(0xffffff, 0.9);
        dir.position.set(6, 10, 4);
        dir.castShadow = true;
        scene.add(dir);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(40, 40),
            new THREE.MeshStandardMaterial({ color: 0x020617 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        scene.add(ground);
        groundRef.current = ground;

        linesGroupRef.current = new THREE.Group();
        grindGroupRef.current = new THREE.Group();
        scene.add(linesGroupRef.current);
        scene.add(grindGroupRef.current);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enabled = false;
        controlsRef.current = controls;

        let raf = 0;
        const loop = () => {
            raf = requestAnimationFrame(loop);
            controls.update();
            renderer.render(scene, camera);
        };
        loop();

        return () => {
            cancelAnimationFrame(raf);
            controls.dispose();
            renderer.dispose();
        };
    }, []);

    /* ---------------------------------------------------
       RAMP BUILD
    ----------------------------------------------------*/

    useEffect(() => {
        if (!sceneRef.current) return;

        if (rampRef.current) {
            sceneRef.current.remove(rampRef.current);
        }

        const ramp = buildRampGroup(config);
        sceneRef.current.add(ramp);
        rampRef.current = ramp;

        rebuildGrindHighlights();
    }, [config]);

    /* ---------------------------------------------------
       DRAWING
    ----------------------------------------------------*/

    const pickPoint = (e: PointerEvent): THREE.Vector3 | null => {
        if (!cameraRef.current || !rendererRef.current) return null;

        const rect = rendererRef.current.domElement.getBoundingClientRect();
        pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.current.setFromCamera(pointer.current, cameraRef.current);

        const p = new THREE.Vector3();
        raycaster.current.ray.intersectPlane(groundPlane.current, p);
        return p;
    };

    const startStroke = (e: PointerEvent) => {
        const p = pickPoint(e);
        if (!p) return;

        currentStrokeRef.current = [p];
        strokesRef.current.push(currentStrokeRef.current);

        const geom = new THREE.BufferGeometry().setFromPoints([p]);
        const mat = new THREE.LineBasicMaterial({ color: 0xff4747 });
        const line = new THREE.Line(geom, mat);
        linesGroupRef.current?.add(line);
    };

    const continueStroke = (e: PointerEvent) => {
        if (!currentStrokeRef.current) return;
        const p = pickPoint(e);
        if (!p) return;

        currentStrokeRef.current.push(p);

        const line = linesGroupRef.current?.children.at(-1) as THREE.Line;
        line.geometry.dispose();
        line.geometry = new THREE.BufferGeometry().setFromPoints(currentStrokeRef.current);
    };

    const endStroke = () => {
        currentStrokeRef.current = null;
        emitPathChange();
    };

    useEffect(() => {
        const dom = rendererRef.current?.domElement;
        if (!dom) return;

        const down = (e: PointerEvent) => mode === 'draw' && startStroke(e);
        const move = (e: PointerEvent) => mode === 'draw' && continueStroke(e);
        const up = () => mode === 'draw' && endStroke();

        dom.addEventListener('pointerdown', down);
        dom.addEventListener('pointermove', move);
        dom.addEventListener('pointerup', up);

        return () => {
            dom.removeEventListener('pointerdown', down);
            dom.removeEventListener('pointermove', move);
            dom.removeEventListener('pointerup', up);
        };
    }, [mode]);

    /* ---------------------------------------------------
       UI
    ----------------------------------------------------*/

    return (
        <div className="relative w-full h-[320px] md:h-[420px]">
            <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />

            <div className="absolute top-2 left-2 flex gap-2">
                <button onClick={() => setMode('draw')} className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                    Draw
                </button>
                <button onClick={() => setMode('rotate')} className="px-2 py-1 bg-white text-black text-xs rounded">
                    Rotate
                </button>
            </div>
        </div>
    );
};

export default PathEditor3D;
