// C:\Users\user\Desktop\invert61\src\skate_session_review\3d\PathEditor3D.tsx

import React, { useEffect, useRef } from 'react';
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

    /* ---------------------------------------------------
       CAMERA FIT (CRITICAL FIX)
    ----------------------------------------------------*/
    const fitCameraToRamp = () => {
        if (!cameraRef.current || !rampRef.current) return;

        const box = new THREE.Box3().setFromObject(rampRef.current);
        if (box.isEmpty()) return;

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.8;

        cameraRef.current.position.set(
            center.x + distance,
            center.y + distance * 0.6,
            center.z + distance
        );
        cameraRef.current.lookAt(center);
        cameraRef.current.near = 0.05;
        cameraRef.current.far = 200;
        cameraRef.current.updateProjectionMatrix();
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

        const w = Math.max(container.clientWidth, MIN_WIDTH);
        const h = Math.max(container.clientHeight, MIN_HEIGHT);

        const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 200);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        scene.add(new THREE.HemisphereLight(0xdbeafe, 0x020617, 0.7));

        const dir = new THREE.DirectionalLight(0xffffff, 0.9);
        dir.position.set(8, 12, 6);
        dir.castShadow = true;
        scene.add(dir);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 60),
            new THREE.MeshStandardMaterial({ color: 0x020617 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
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

        return () => {
            cancelAnimationFrame(raf);
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    /* ---------------------------------------------------
       BUILD RAMP
    ----------------------------------------------------*/
    useEffect(() => {
        if (!sceneRef.current) return;

        if (rampRef.current) {
            sceneRef.current.remove(rampRef.current);
        }

        const ramp = buildRampGroup(config);
        ramp.traverse(o => {
            if ((o as THREE.Mesh).isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        sceneRef.current.add(ramp);
        rampRef.current = ramp;

        fitCameraToRamp();
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
        onPathChange?.(
            strokesRef.current.map(st => st.map(v => ({ x: v.x, y: v.y, z: v.z })))
        );
    };

    useEffect(() => {
        const dom = rendererRef.current?.domElement;
        if (!dom) return;

        dom.addEventListener('pointerdown', startStroke);
        dom.addEventListener('pointermove', continueStroke);
        dom.addEventListener('pointerup', endStroke);

        return () => {
            dom.removeEventListener('pointerdown', startStroke);
            dom.removeEventListener('pointermove', continueStroke);
            dom.removeEventListener('pointerup', endStroke);
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
        </div>
    );
};

export default PathEditor3D;
