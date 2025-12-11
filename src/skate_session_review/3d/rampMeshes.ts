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
        const alpha = 0.15 + Math.random() * 0.1;
        ctx.fillStyle = `rgba(60,38,20,${alpha})`;
        ctx.fillRect(0, y, canvas.width, 3);
    }
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const w = 10 + Math.random() * 40;
        const h = 3 + Math.random() * 6;
        const a = 0.12 + Math.random() * 0.1;
        ctx.fillStyle = `rgba(90,60,32,${a})`;
        ctx.fillRect(x, Math.random() * canvas.height, w, h);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
}

function createConcreteTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#4b4f58';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // speckles
    for (let i = 0; i < 800; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 1.2;
        const shade = 160 + Math.floor(Math.random() * 70);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
}

function widthFromLevel(level: RampConfig['widthLevel']): number {
    switch (level) {
        case 'narrow':
            return 2.4;
        case 'wide':
            return 4.8;
        case 'medium':
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
        metalness: 0.15,
    });

    const transitionMat = new THREE.MeshStandardMaterial({
        map: concreteTex,
        roughness: 0.9,
        metalness: 0.05,
    });

    const copingMat = new THREE.MeshStandardMaterial({
        color: 0xd0d5df,
        roughness: 0.25,
        metalness: 0.85,
    });

    const group = new THREE.Group();

    const height = config.heightFt * 0.3; // 2–10 ft → ~0.6–3.0 world-units
    const width = widthFromLevel(config.widthLevel);
    const flatLength = 2.4;
    const transitionLength = height * 1.2;
    const totalLength = flatLength + transitionLength * 2;

    // base platform under everything
    const baseGeom = new THREE.BoxGeometry(width + 0.6, 0.2, totalLength + 0.6);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 1.0,
        metalness: 0.0,
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -0.1;
    base.receiveShadow = true;
    group.add(base);

    // flat center deck (wood)
    const flatGeom = new THREE.BoxGeometry(width, 0.12, flatLength);
    const flat = new THREE.Mesh(flatGeom, deckMat);
    flat.position.set(0, 0, 0);
    flat.castShadow = true;
    flat.receiveShadow = true;
    group.add(flat);

    // helper to build one transition as a curved wedge
    const buildTransition = (sign: 1 | -1) => {
        const segments = 18;
        const depth = transitionLength;
        const curveGeom = new THREE.PlaneGeometry(depth, height, segments, 4);

        const posAttr = curveGeom.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < posAttr.count; i++) {
            const z = posAttr.getX(i); // in PlaneGeometry, x is width, y is height → we will rotate
            const y = posAttr.getY(i);
            // we actually only need z coordinate for curve, but we fake it via y:
            const t = (y + height / 2) / height; // 0..1
            const curveY = Math.sin(t * Math.PI * 0.5) * height;
            posAttr.setY(i, curveY - height / 2);
        }
        posAttr.needsUpdate = true;
        curveGeom.computeVertexNormals();

        const trans = new THREE.Mesh(curveGeom, transitionMat);
        // Rotate so plane becomes ramp in Z-direction
        trans.rotation.x = -Math.PI / 2;
        if (sign === 1) {
            trans.position.z = flatLength / 2 + depth / 2;
        } else {
            trans.rotation.y = Math.PI; // flip
            trans.position.z = -flatLength / 2 - depth / 2;
        }
        trans.position.y = height / 2;
        trans.castShadow = true;
        trans.receiveShadow = true;
        group.add(trans);

        // deck platform on top of transition
        const deckGeom = new THREE.BoxGeometry(width, 0.12, 0.6);
        const deck = new THREE.Mesh(deckGeom, deckMat);
        deck.position.set(0, height + 0.06, sign * (flatLength / 2 + 0.3));
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        // coping cylinder
        const copingGeom = new THREE.CylinderGeometry(0.04, 0.04, width + 0.06, 16);
        const coping = new THREE.Mesh(copingGeom, copingMat);
        coping.rotation.z = Math.PI / 2;
        coping.position.set(0, height + 0.08, sign * (flatLength / 2 + 0.6));
        coping.castShadow = true;
        group.add(coping);
    };

    buildTransition(1);
    buildTransition(-1);

    // position so center is roughly at origin, skate direction = +Z
    group.position.set(0, 0, 0);

    return group;
}

/**
 * Street ledge: simple low box with nice wood-top + concrete sides.
 */
function buildLedge(config: RampConfig): THREE.Group {
    const woodTex = createWoodTexture();
    const concreteTex = createConcreteTexture();

    const group = new THREE.Group();
    const width = widthFromLevel(config.widthLevel);
    const height = config.heightFt * 0.15; // 2–10 ft → 0.3–1.5 world
    const length = 3.5;

    const bodyGeom = new THREE.BoxGeometry(width, height, length);
    const bodyMat = new THREE.MeshStandardMaterial({
        map: concreteTex,
        roughness: 0.9,
        metalness: 0.05,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const topGeom = new THREE.BoxGeometry(width + 0.02, 0.04, length + 0.02);
    const topMat = new THREE.MeshStandardMaterial({
        map: woodTex,
        roughness: 0.6,
        metalness: 0.15,
    });
    const top = new THREE.Mesh(topGeom, topMat);
    top.position.y = height / 2 + 0.02;
    top.castShadow = true;
    group.add(top);

    return group;
}

/**
 * Very simple flatbar / rail.
 */
function buildFlatbar(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const width = widthFromLevel(config.widthLevel);
    const length = 3.8;
    const railHeight = config.heightFt * 0.15 + 0.4;

    const concreteTex = createConcreteTexture();

    const feetMat = new THREE.MeshStandardMaterial({
        map: concreteTex,
        roughness: 0.8,
        metalness: 0.1,
    });

    const railMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5f5,
        roughness: 0.3,
        metalness: 0.9,
    });

    const footGeom = new THREE.BoxGeometry(0.26, 0.08, 0.4);
    const footLeft = new THREE.Mesh(footGeom, feetMat);
    const footRight = new THREE.Mesh(footGeom, feetMat);
    footLeft.position.set(0, 0.04, -length / 2 + 0.4);
    footRight.position.set(0, 0.04, length / 2 - 0.4);
    footLeft.castShadow = footLeft.receiveShadow = true;
    footRight.castShadow = footRight.receiveShadow = true;
    group.add(footLeft, footRight);

    const legGeom = new THREE.CylinderGeometry(0.04, 0.04, railHeight - 0.04, 12);
    const legLeft = new THREE.Mesh(legGeom, feetMat);
    const legRight = new THREE.Mesh(legGeom, feetMat);
    legLeft.position.set(0, railHeight / 2, -length / 2 + 0.4);
    legRight.position.set(0, railHeight / 2, length / 2 - 0.4);
    legLeft.castShadow = legRight.castShadow = true;
    group.add(legLeft, legRight);

    const railGeom = new THREE.CylinderGeometry(0.05, 0.05, length, 20);
    const rail = new THREE.Mesh(railGeom, railMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.y = railHeight;
    rail.castShadow = true;
    group.add(rail);

    return group;
}

/**
 * Builds a low-poly, textured ramp model for the current `RampConfig`.
 * You can extend this with more cases as you add more types in `rampTypes.ts`.
 */
export function buildRampGroup(config: RampConfig): THREE.Group {
    const id = (config.typeId || '').toLowerCase();

    if (id.includes('ledge')) return buildLedge(config);
    if (id.includes('flatbar') || id.includes('rail')) return buildFlatbar(config);

    // default / mini ramp / bowl-ish: use curved mini ramp
    return buildMiniRamp(config);
}
