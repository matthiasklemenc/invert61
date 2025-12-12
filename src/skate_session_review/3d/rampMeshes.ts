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
        const w = 10 + Math.random() * 30;
        const h = 2 + Math.random() * 4;
        const alpha = 0.1 + Math.random() * 0.15;
        ctx.fillStyle = `rgba(90,60,30,${alpha})`;
        ctx.fillRect(x, Math.random() * canvas.height, w, h);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
}

function createConcreteTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    // base grey
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // noise
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const n = 120 + Math.random() * 40; // greyish
        data[i] = n;
        data[i + 1] = n;
        data[i + 2] = n;
        // alpha stays
    }
    ctx.putImageData(imageData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
}

const woodTexture = createWoodTexture();
const concreteTexture = createConcreteTexture();

// Basic materials (PBR-ish)
const rampMat = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    color: 0xffffff,
    roughness: 0.75,
    metalness: 0.05,
});

const copingMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.9,
    roughness: 0.2,
});

const deckMat = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.6,
    metalness: 0.05,
});

const streetMat = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    color: 0xbfc3c9,
    roughness: 0.85,
    metalness: 0.0,
});

const railMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    metalness: 1.0,
    roughness: 0.25,
});

const stairRiserMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.9,
    metalness: 0.0,
});

// Helper: approximate transition radius from height in meters
function transitionRadiusFromHeight(heightM: number): number {
    // very rough: typical mini ~1.5× height radius
    return heightM * 1.5;
}

// Helper: width from config widthLevel
function widthFromLevel(level: RampConfig['widthLevel']): number {
    switch (level) {
        case 'narrow':
            return 2.2;
        case 'wide':
            return 4.0;
        case 'medium':
        default:
            return 3.0;
    }
}

function createMiniramp(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const h = config.heightFt * 0.3048; // meters
    const w = widthFromLevel(config.widthLevel);
    const flat = h * 1.6; // flat bottom length
    const radius = transitionRadiusFromHeight(h);

    const halfSpan = radius + flat / 2;

    const geom = new THREE.CylinderGeometry(
        radius,
        radius,
        w,
        32,
        1,
        false,
        Math.PI / 2,
        Math.PI
    );
    geom.rotateZ(Math.PI / 2);
    const rampMesh = new THREE.Mesh(geom, rampMat);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    group.add(rampMesh);

    // decks
    const deckDepth = 0.6;
    const deckThickness = 0.06;

    const deckGeom = new THREE.BoxGeometry(deckDepth, deckThickness, w);
    const deck1 = new THREE.Mesh(deckGeom, deckMat);
    deck1.position.set(-halfSpan - deckDepth / 2, h, 0);
    deck1.castShadow = true;
    deck1.receiveShadow = true;

    const deck2 = deck1.clone();
    deck2.position.set(halfSpan + deckDepth / 2, h, 0);

    group.add(deck1, deck2);

    // coping
    const copingRadius = 0.04;
    const copingGeom = new THREE.CylinderGeometry(copingRadius, copingRadius, w, 16);
    const coping1 = new THREE.Mesh(copingGeom, copingMat);
    coping1.rotation.z = Math.PI / 2;
    coping1.position.set(-halfSpan, h, 0);

    const coping2 = coping1.clone();
    coping2.position.set(halfSpan, h, 0);

    group.add(coping1, coping2);

    return group;
}

function createQuarter(config: RampConfig, vertical = false, medium = false): THREE.Group {
    const group = new THREE.Group();

    const h = config.heightFt * 0.3048;
    const w = widthFromLevel(config.widthLevel);

    const radius = transitionRadiusFromHeight(h);
    const arc = vertical ? Math.PI / 2 : (medium ? Math.PI / 3 : Math.PI / 4);
    const geom = new THREE.CylinderGeometry(
        radius,
        radius,
        w,
        32,
        1,
        false,
        Math.PI,
        arc
    );
    geom.rotateZ(Math.PI / 2);
    const rampMesh = new THREE.Mesh(geom, rampMat);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    group.add(rampMesh);

    // deck
    const deckDepth = 0.7;
    const deckThickness = 0.06;
    const deckGeom = new THREE.BoxGeometry(deckDepth, deckThickness, w);
    const deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.set(-radius - deckDepth / 2, h, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // coping
    const copingRadius = 0.045;
    const copingGeom = new THREE.CylinderGeometry(copingRadius, copingRadius, w, 16);
    const coping = new THREE.Mesh(copingGeom, copingMat);
    coping.rotation.z = Math.PI / 2;
    coping.position.set(-radius, h, 0);
    group.add(coping);

    return group;
}

function createHalfpipe(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const h = config.heightFt * 0.3048;
    const w = widthFromLevel(config.widthLevel);
    const radius = transitionRadiusFromHeight(h);

    const geom = new THREE.CylinderGeometry(
        radius,
        radius,
        w,
        40,
        1,
        false,
        Math.PI / 2.4,
        Math.PI * (1.0) // big chunk
    );
    geom.rotateZ(Math.PI / 2);
    const rampMesh = new THREE.Mesh(geom, rampMat);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    group.add(rampMesh);

    // decks both sides
    const deckDepth = 0.8;
    const deckThickness = 0.06;
    const deckGeom = new THREE.BoxGeometry(deckDepth, deckThickness, w);

    const deck1 = new THREE.Mesh(deckGeom, deckMat);
    deck1.position.set(-radius - deckDepth / 2, h, 0);
    deck1.castShadow = true;
    deck1.receiveShadow = true;

    const deck2 = deck1.clone();
    deck2.position.set(radius + deckDepth / 2, h, 0);

    group.add(deck1, deck2);

    // coping
    const copingRadius = 0.045;
    const copingGeom = new THREE.CylinderGeometry(copingRadius, copingRadius, w, 16);
    const coping1 = new THREE.Mesh(copingGeom, copingMat);
    coping1.rotation.z = Math.PI / 2;
    coping1.position.set(-radius, h, 0);
    const coping2 = coping1.clone();
    coping2.position.set(radius, h, 0);
    group.add(coping1, coping2);

    return group;
}

function createRoundBowl(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const h = config.heightFt * 0.3048;
    const radius = transitionRadiusFromHeight(h);
    const w = widthFromLevel(config.widthLevel);

    const bowlGeom = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    bowlGeom.rotateX(-Math.PI / 2);
    const bowl = new THREE.Mesh(bowlGeom, rampMat);
    bowl.position.y = h - radius;
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    group.add(bowl);

    // lip / coping ring
    const torusGeom = new THREE.TorusGeometry(radius, 0.05, 16, 64);
    const torus = new THREE.Mesh(torusGeom, copingMat);
    torus.position.y = h;
    group.add(torus);

    return group;
}

function createOvalBowl(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const h = config.heightFt * 0.3048;

    const long = transitionRadiusFromHeight(h) * 1.4;
    const short = transitionRadiusFromHeight(h);

    const geom = new THREE.SphereGeometry(short, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    geom.scale(long / short, 1, 1);
    geom.rotateX(-Math.PI / 2);
    const bowl = new THREE.Mesh(geom, rampMat);
    bowl.position.y = h - short;
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    group.add(bowl);

    const torusGeom = new THREE.TorusGeometry(short, 0.05, 16, 64);
    torusGeom.scale(long / short, 1, 1);
    const torus = new THREE.Mesh(torusGeom, copingMat);
    torus.position.y = h;
    group.add(torus);

    return group;
}

function createKidneyBowl(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const h = config.heightFt * 0.3048;
    const rSmall = transitionRadiusFromHeight(h) * 0.8;
    const rBig = transitionRadiusFromHeight(h) * 1.2;

    const small = new THREE.SphereGeometry(rSmall, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    small.rotateX(-Math.PI / 2);
    const smallMesh = new THREE.Mesh(small, rampMat);
    smallMesh.position.set(-rSmall * 0.7, h - rSmall, 0);

    const big = new THREE.SphereGeometry(rBig, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    big.rotateX(-Math.PI / 2);
    const bigMesh = new THREE.Mesh(big, rampMat);
    bigMesh.position.set(rBig * 0.6, h - rBig, 0);

    smallMesh.castShadow = smallMesh.receiveShadow = true;
    bigMesh.castShadow = bigMesh.receiveShadow = true;

    group.add(smallMesh, bigMesh);

    // simple coping spline (not perfect kidney, but looks good)
    const path = new THREE.CurvePath<THREE.Vector3>();
    path.add(new THREE.EllipseCurve(
        -rSmall * 0.7, 0,
        rSmall, rSmall * 0.9,
        Math.PI * 0.2, Math.PI * 1.2,
        false,
        0
    ) as any);
    path.add(new THREE.EllipseCurve(
        rBig * 0.6, 0,
        rBig, rBig * 0.8,
        Math.PI * 1.2, Math.PI * 0.2,
        false,
        0
    ) as any);

    const pts2 = path.getPoints(80);
    const pts3 = pts2.map(p => new THREE.Vector3(p.x, h, p.y));
    const tubeGeom = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts3), 200, 0.05, 12, true);
    const coping = new THREE.Mesh(tubeGeom, copingMat);
    group.add(coping);

    return group;
}

function createStairs(config: RampConfig, withRail: boolean): THREE.Group {
    const group = new THREE.Group();

    const h = config.heightFt * 0.3048;
    const w = widthFromLevel(config.widthLevel);
    const steps = 6;
    const stepRise = h / steps;
    const stepDepth = 0.35;

    for (let i = 0; i < steps; i++) {
        const stepGeom = new THREE.BoxGeometry(stepDepth, stepRise, w);
        const step = new THREE.Mesh(stepGeom, streetMat);
        step.position.set(
            -((steps - 1) * stepDepth) / 2 + i * stepDepth,
            stepRise / 2 + i * stepRise,
            0
        );
        step.castShadow = true;
        step.receiveShadow = true;
        group.add(step);

        const riserGeom = new THREE.BoxGeometry(0.02, stepRise, w);
        const riser = new THREE.Mesh(riserGeom, stairRiserMat);
        riser.position.set(
            step.position.x - stepDepth / 2 + 0.01,
            step.position.y,
            0
        );
        riser.castShadow = true;
        riser.receiveShadow = true;
        group.add(riser);
    }

    if (withRail) {
        const railHeight = h * 0.8;
        const railLen = steps * stepDepth * 1.3;

        const postGeom = new THREE.CylinderGeometry(0.04, 0.04, railHeight, 16);
        const post1 = new THREE.Mesh(postGeom, railMat);
        const post2 = post1.clone();

        post1.position.set(-railLen / 2, railHeight / 2, -w * 0.15);
        post2.position.set(railLen / 2, railHeight / 2, -w * 0.15);
        post1.castShadow = post2.castShadow = true;
        post1.receiveShadow = post2.receiveShadow = true;
        group.add(post1, post2);

        const railGeom = new THREE.CylinderGeometry(0.035, 0.035, railLen, 16);
        const rail = new THREE.Mesh(railGeom, railMat);
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, railHeight, -w * 0.15);
        rail.castShadow = rail.receiveShadow = true;
        group.add(rail);
    }

    return group;
}

function createFlatbar(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const w = widthFromLevel(config.widthLevel);
    const length = 3.0 + (config.heightFt - 2) * 0.3;
    const height = 0.4 + (config.heightFt - 2) * 0.05;

    const barGeom = new THREE.BoxGeometry(length, 0.06, 0.06);
    const bar = new THREE.Mesh(barGeom, railMat);
    bar.position.y = height;
    bar.castShadow = bar.receiveShadow = true;
    group.add(bar);

    const footGeom = new THREE.BoxGeometry(0.4, 0.06, 0.3);
    const foot1 = new THREE.Mesh(footGeom, streetMat);
    const foot2 = foot1.clone();
    foot1.position.set(-length / 3, 0.03, 0);
    foot2.position.set(length / 3, 0.03, 0);
    foot1.castShadow = foot2.castShadow = true;
    foot1.receiveShadow = foot2.receiveShadow = true;
    group.add(foot1, foot2);

    return group;
}

function createLedge(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const h = config.heightFt * 0.3048 * 0.7; // street ledges meist ~0.3–0.6 m
    const length = 2.4 + (config.heightFt - 2) * 0.2;
    const depth = 0.4;

    const bodyGeom = new THREE.BoxGeometry(length, h, depth);
    const body = new THREE.Mesh(bodyGeom, streetMat);
    body.position.y = h / 2;
    body.castShadow = body.receiveShadow = true;
    group.add(body);

    // coped edge
    const edgeGeom = new THREE.BoxGeometry(length, 0.05, 0.08);
    const edge = new THREE.Mesh(edgeGeom, copingMat);
    edge.position.set(0, h + 0.025, depth / 2 - 0.04);
    edge.castShadow = edge.receiveShadow = true;
    group.add(edge);

    return group;
}

function createManualPad(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const h = 0.25 + (config.heightFt - 2) * 0.04;
    const length = 1.8 + (config.heightFt - 2) * 0.2;
    const depth = 1.0;

    const geo = new THREE.BoxGeometry(length, h, depth);
    const pad = new THREE.Mesh(geo, streetMat);
    pad.position.y = h / 2;
    pad.castShadow = pad.receiveShadow = true;
    group.add(pad);

    // subtle top edge
    const edgeGeom = new THREE.BoxGeometry(length, 0.02, depth);
    const edge = new THREE.Mesh(edgeGeom, copingMat);
    edge.position.y = h + 0.01;
    group.add(edge);

    return group;
}

function createKicker(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const h = config.heightFt * 0.3048 * 0.6;
    const length = 1.6 + (config.heightFt - 2) * 0.25;
    const w = widthFromLevel(config.widthLevel);

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(length, 0);
    shape.lineTo(length, h);
    shape.quadraticCurveTo(length * 0.4, h * 0.9, 0, 0);

    const extrude = new THREE.ExtrudeGeometry(shape, {
        depth: w,
        bevelEnabled: false,
    });
    extrude.rotateX(-Math.PI / 2);
    const ramp = new THREE.Mesh(extrude, streetMat);
    ramp.castShadow = ramp.receiveShadow = true;
    group.add(ramp);

    return group;
}

export function buildRampGroup(config: RampConfig): THREE.Group {
    switch (config.typeId) {
        case 'miniramp':
            return createMiniramp(config);
        case 'quarter_low':
            return createQuarter(config, false, false);
        case 'quarter_medium':
            return createQuarter(config, false, true);
        case 'quarter_vert':
            return createQuarter(config, true, false);
        case 'halfpipe':
            return createHalfpipe(config);
        case 'bowl_round':
            return createRoundBowl(config);
        case 'bowl_oval':
            return createOvalBowl(config);
        case 'bowl_kidney':
            return createKidneyBowl(config);
        case 'stairs':
            return createStairs(config, false);
        case 'stairs_rail':
            return createStairs(config, true);
        case 'flatbar':
            return createFlatbar(config);
        case 'ledge':
            return createLedge(config);
        case 'manual_pad':
            return createManualPad(config);
        case 'kicker':
            return createKicker(config);
        default: {
            const g = new THREE.Group();
            const placeholder = new THREE.BoxGeometry(2, 0.2, 2);
            const m = new THREE.Mesh(placeholder, rampMat);
            m.position.y = 0.1;
            g.add(m);
            return g;
        }
    }
}
