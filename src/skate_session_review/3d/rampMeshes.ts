// C:\Users\user\Desktop\invert61\src\skate_session_review\3d\rampMeshes.ts

import * as THREE from 'three';
import type { RampConfig } from '../planner/rampTypes';

function createWoodTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    // base color
    ctx.fillStyle = '#7b5a38';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // wood “grain”
    for (let y = 0; y < canvas.height; y += 6) {
        const light = Math.random() * 20;
        ctx.fillStyle = `rgb(${120 + light}, ${90 + light / 2}, ${60})`;
        ctx.fillRect(0, y, canvas.width, 3);
    }

    // some knots
    for (let i = 0; i < 6; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 4 + Math.random() * 6;
        const grd = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
        grd.addColorStop(0, 'rgba(60, 35, 20, 0.8)');
        grd.addColorStop(1, 'rgba(60, 35, 20, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    return tex;
}

function createConcreteTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle speckles
    for (let i = 0; i < 8000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const v = 140 + Math.random() * 80;
        ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.4})`;
        ctx.fillRect(x, y, 1, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
}

/**
 * Convert slider “heightFt” into a scaled world height.
 * We keep everything skate-park sized (1 Three.js unit ≈ 1 m).
 */
function heightInMetersFromFt(heightFt: number): number {
    const rawMeters = heightFt * 0.3048; // 1 ft = 0.3048 m
    // For the mini-ramp we tame extremes a bit so it looks nice in the view.
    if (rawMeters < 0.5) return 0.5;
    if (rawMeters > 2.4) return 2.4;
    return rawMeters;
}

/**
 * Width helper based on config.widthLevel.
 */
function widthFromLevel(config: RampConfig): number {
    const baseWidth = 2.4; // 8 ft base width

    switch (config.widthLevel) {
        case 'narrow':
            return baseWidth * 0.6; // ca. 1.5 m
        case 'medium':
            return baseWidth; // 2.4 m
        case 'wide':
            return baseWidth * 1.6; // ca. 3.8 m
        default:
            return 3.6;
    }
}

/**
 * Generic mini-ramp: two opposing transitions + flat in the middle.
 * Low-poly but shaped & textured so it feels like a real park object.
 */
function buildMiniRamp(config: RampConfig): THREE.Group {
    const woodTex = createWoodTexture();
    const concreteTex = createConcreteTexture();

    const deckMat = new THREE.MeshStandardMaterial({
        map: woodTex,
        roughness: 0.6,
        metalness: 0.05,
    });

    const concreteMat = new THREE.MeshStandardMaterial({
        map: concreteTex,
        roughness: 0.95,
        metalness: 0.05,
        color: 0xbfc7d1,
    });

    const group = new THREE.Group();

    const rampWidth = widthFromLevel(config);
    const rampHeight = heightInMetersFromFt(config.heightFt);
    const transitionRadius = rampHeight * 0.9;
    const flatBottom = 2.0; // 2 m flat in the middle
    const deckLength = 0.6; // fast in / out

    const totalLength = deckLength + transitionRadius + flatBottom + transitionRadius + deckLength;

    // helper function: create quarter-pipe section via lathe
    function createQuarterPipe(sign: 1 | -1) {
        const pts: THREE.Vector2[] = [];
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const angle = (Math.PI / 2) * t;
            const x = rampHeight - transitionRadius * Math.cos(angle);
            const y = transitionRadius * Math.sin(angle);
            pts.push(new THREE.Vector2(x, y));
        }

        const geometry = new THREE.LatheGeometry(pts, 1);
        geometry.rotateZ(-Math.PI / 2);
        const mesh = new THREE.Mesh(geometry, concreteMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // position in world
        const offsetZ =
            sign > 0
                ? -totalLength / 2 + deckLength + transitionRadius / 2
                : totalLength / 2 - deckLength - transitionRadius / 2;

        mesh.position.set(0, 0, offsetZ);
        mesh.scale.set(rampWidth / 2, 1, 1);
        mesh.rotation.y = sign > 0 ? 0 : Math.PI;
        return mesh;
    }

    // left transition
    const q1 = createQuarterPipe(1);
    // right transition
    const q2 = createQuarterPipe(-1);

    // flat bottom
    const flatGeom = new THREE.BoxGeometry(rampWidth, 0.12, flatBottom);
    const flatMesh = new THREE.Mesh(flatGeom, concreteMat);
    flatMesh.position.set(0, 0.06, 0);
    flatMesh.receiveShadow = true;

    // decks
    const deckGeom = new THREE.BoxGeometry(rampWidth, 0.08, deckLength);
    const deck1 = new THREE.Mesh(deckGeom, deckMat);
    deck1.position.set(0, rampHeight, -totalLength / 2 + deckLength / 2);
    deck1.castShadow = deck1.receiveShadow = true;

    const deck2 = deck1.clone();
    deck2.position.set(0, rampHeight, totalLength / 2 - deckLength / 2);

    // coping (simple metallic cylinders)
    const copingMat = new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        roughness: 0.5,
        metalness: 0.9,
    });
    const copingGeom = new THREE.CylinderGeometry(0.03, 0.03, rampWidth, 16);

    const coping1 = new THREE.Mesh(copingGeom, copingMat);
    coping1.rotation.z = Math.PI / 2;
    coping1.position.set(0, rampHeight + 0.03, -totalLength / 2 + deckLength);
    coping1.castShadow = coping1.receiveShadow = true;

    const coping2 = coping1.clone();
    coping2.position.set(0, rampHeight + 0.03, totalLength / 2 - deckLength);

    // assemble
    group.add(q1, q2, flatMesh, deck1, deck2, coping1, coping2);

    // “concrete pad” under everything
    const padGeom = new THREE.BoxGeometry(rampWidth + 0.6, 0.06, totalLength + 0.6);
    const padMesh = new THREE.Mesh(padGeom, concreteMat);
    padMesh.position.y = -0.03;
    padMesh.receiveShadow = true;
    group.add(padMesh);

    // center in scene
    group.position.set(0, 0, 0);

    return group;
}

/**
 * BANK (simple wedge) – dedicated geometry, fixed height 0.4 m.
 * Uses the same width logic as other street obstacles.
 */
function buildBank(config: RampConfig): THREE.Group {
    const concreteTex = createConcreteTexture();

    // Basic bank dimensions (in meters)
    const width = widthFromLevel(config.widthLevel); // e.g. ~2–3 m
    const height = 0.4; // 40 cm, as requested
    const length = 3.0; // 3 m run-up

    // Wedge (prism) so it actually looks like a bank
    const positions = new Float32Array([
        // bottom rectangle (z forward)
        -width / 2, 0, 0,          // 0
         width / 2, 0, 0,          // 1
        -width / 2, 0, length,     // 2
         width / 2, 0, length,     // 3

        // top back edge
        -width / 2, height, length, // 4
         width / 2, height, length, // 5
    ]);

    const indices = [
        // bottom
        0, 2, 1,
        2, 3, 1,

        // back vertical face
        2, 4, 3,
        3, 4, 5,

        // left side
        0, 2, 4,

        // right side
        1, 5, 3,

        // front sloped face
        0, 1, 5,
        0, 5, 4,
    ];

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        map: concreteTex,
        roughness: 0.9,
        metalness: 0.05,
        color: 0xbfc7d1,
    });

    const bankMesh = new THREE.Mesh(geom, mat);
    bankMesh.castShadow = true;
    bankMesh.receiveShadow = true;

    const group = new THREE.Group();
    group.add(bankMesh);

    return group;
}

/**
 * Ledge / manual pad style block.
 */
function buildLedge(config: RampConfig): THREE.Group {
    const concreteTex = createConcreteTexture();
    const woodTex = createWoodTexture();

    const group = new THREE.Group();

    const baseWidth = 0.6; // depth in z
    const height = 0.4; // 40 cm ledge
    const length = 2.4; // 8 ft

    const width =
        config.widthLevel === 'wide'
            ? 3.0
            : config.widthLevel === 'narrow'
            ? 1.6
            : 2.2;

    const baseGeom = new THREE.BoxGeometry(width, 0.1, length + 0.4);
    const baseMat = new THREE.MeshStandardMaterial({
        map: concreteTex,
        roughness: 0.95,
        metalness: 0.05,
        color: 0x9ca3af,
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.05;
    base.receiveShadow = true;

    const blockGeom = new THREE.BoxGeometry(width - 0.1, height, length);
    const blockMat = new THREE.MeshStandardMaterial({
        map: concreteTex,
        roughness: 0.9,
        metalness: 0.02,
        color: 0xbfc7d1,
    });
    const block = new THREE.Mesh(blockGeom, blockMat);
    block.position.y = 0.05 + height / 2;
    block.castShadow = block.receiveShadow = true;

    const copingGeom = new THREE.BoxGeometry(width - 0.08, 0.04, length + 0.02);
    const copingMat = new THREE.MeshStandardMaterial({
        color: 0xe5e7eb,
        roughness: 0.4,
        metalness: 0.8,
    });
    const coping = new THREE.Mesh(copingGeom, copingMat);
    coping.position.y = 0.05 + height + 0.02;
    coping.castShadow = coping.receiveShadow = true;

    group.add(base, block, coping);

    return group;
}

function buildFlatbar(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const railLength = 3.0;
    const height = 0.4;

    const supportMat = new THREE.MeshStandardMaterial({
        color: 0x4b5563,
        roughness: 0.8,
        metalness: 0.2,
    });

    const railMat = new THREE.MeshStandardMaterial({
        color: 0xe5e7eb,
        roughness: 0.4,
        metalness: 0.9,
    });

    const railGeom = new THREE.CylinderGeometry(0.03, 0.03, railLength, 16);
    const rail = new THREE.Mesh(railGeom, railMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.y = height;
    rail.castShadow = rail.receiveShadow = true;

    const baseGeom = new THREE.BoxGeometry(0.4, 0.05, 0.5);
    const base1 = new THREE.Mesh(baseGeom, supportMat);
    base1.position.set(-railLength / 2 + 0.4, 0.025, 0);
    const base2 = base1.clone();
    base2.position.x = railLength / 2 - 0.4;
    base1.receiveShadow = base2.receiveShadow = true;

    const postGeom = new THREE.BoxGeometry(0.09, height, 0.09);
    const post1 = new THREE.Mesh(postGeom, supportMat);
    const post2 = post1.clone();
    post1.position.set(base1.position.x, height / 2, 0);
    post2.position.set(base2.position.x, height / 2, 0);
    post1.castShadow = post1.receiveShadow = true;
    post2.castShadow = post2.receiveShadow = true;

    group.add(base1, base2, post1, post2, rail);

    return group;
}

export function buildRampGroup(config: RampConfig): THREE.Group {
    const id = config.typeId;

    // street obstacles
    if (id.includes('ledge')) return buildLedge(config);
    if (id.includes('bank')) return buildBank(config);
    if (id.includes('flatbar') || id.includes('rail')) return buildFlatbar(config);

    // default / mini ramp / bowl-ish: use curved mini ramp
    return buildMiniRamp(config);
}
