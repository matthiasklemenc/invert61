console.log(">>> USING rampMeshes.ts BUILD VERSION 9 (SMOOTH + GROUNDED) <<<");

// --- REALISTIC SKATEPARK GEOMETRY FOR EDITOR ---
// C:\Users\user\Desktop\invert61\src\skate_session_review\3d\rampMeshes.ts

import * as THREE from "three";
import type { RampConfig } from "../planner/rampTypes";

/* ---------------------------------------------------
   TEXTURE HELPERS
----------------------------------------------------*/
function createWoodTexture(): THREE.Texture {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#7b5a38";
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 6) {
        const t = Math.random() * 20;
        ctx.fillStyle = `rgb(${120 + t},${90 + t / 2},60)`;
        ctx.fillRect(0, y, 256, 3);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    return tex;
}

function createConcreteTexture(): THREE.Texture {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const v = 140 + Math.random() * 80;
        ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.4})`;
        ctx.fillRect(x, y, 1, 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
}

/* ---------------------------------------------------
   SCALING HELPERS
----------------------------------------------------*/
function heightInMetersFromFt(ft: number): number {
    const m = ft * 0.3048;
    return THREE.MathUtils.clamp(m, 0.4, 2.6);
}

function widthFromLevel(config: RampConfig): number {
    const base = 2.4; // ~8ft default
    if (config.widthLevel === "narrow") return base * 0.6;
    if (config.widthLevel === "wide") return base * 1.6;
    return base;
}

/* ---------------------------------------------------
   MATERIALS (CACHED)
----------------------------------------------------*/
const concreteTex = createConcreteTexture();
const woodTex = createWoodTexture();

const concreteMat = new THREE.MeshStandardMaterial({
    map: concreteTex,
    roughness: 0.92,
    metalness: 0.05,
    side: THREE.DoubleSide
});

const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.6,
    metalness: 0.05,
    side: THREE.DoubleSide
});

const metalMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    metalness: 0.9,
    roughness: 0.35,
    side: THREE.DoubleSide
});

/* ---------------------------------------------------
   GROUNDING (NO RECURSION)
----------------------------------------------------*/
function groundGroup(group: THREE.Group, groundY = 0): THREE.Group {
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return group;

    const lift = groundY - box.min.y;
    group.position.y += lift;

    group.updateMatrixWorld(true);
    return group;
}

/* ---------------------------------------------------
   QUARTER PIPE PROFILE (SMOOTH + REAL DECK BUILT-IN)
   Coordinate convention:
   - X: forward/length
   - Y: up/height
   - Z: width (extrude depth)
----------------------------------------------------*/
function createQuarterGeometry(height: number, transitionLen: number, width: number, deckLen: number): THREE.BufferGeometry {
    const shape = new THREE.Shape();

    // Small flat at bottom so it doesn’t start at a razor edge
    const flatFoot = 0.12;

    // Use a circular-ish transition radius that matches height
    const radius = height;

    // Keep transition sane (if caller passes too small)
    const effectiveTransition = Math.max(transitionLen, radius * 0.95);

    // Curve detail (higher = smoother)
    const segments = 64;

    // Start at inside bottom
    shape.moveTo(0, 0);
    shape.lineTo(flatFoot, 0);

    // Arc from bottom -> lip
    // We want the arc to end at (flatFoot + radius, height)
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = -Math.PI / 2 + (Math.PI / 2) * t; // -90° -> 0°
        const x = flatFoot + radius * Math.cos(angle);
        const y = radius + radius * Math.sin(angle);
        shape.lineTo(x, y);
    }

    const lipX = flatFoot + radius; // end of transition (lip)
    const deckStartX = lipX;
    const deckEndX = lipX + deckLen;

    // Deck flat (this is what you were missing before -> no floating wood)
    shape.lineTo(deckEndX, height);

    // Back face down to ground
    shape.lineTo(deckEndX, 0);

    // Close
    shape.lineTo(0, 0);

    const geom = new THREE.ExtrudeGeometry(shape, {
        depth: width,
        bevelEnabled: false,
        steps: 1
    });

    // Center on Z (width) and ground to Y=0
    geom.computeBoundingBox();
    if (geom.boundingBox) {
        const minY = geom.boundingBox.min.y;
        const minZ = geom.boundingBox.min.z;
        const maxZ = geom.boundingBox.max.z;
        const centerZ = (minZ + maxZ) * 0.5;

        geom.translate(0, -minY, -centerZ);
    }

    // Correct shading
    geom.computeVertexNormals();

    return geom;
}

/* Utility: mirror a geometry across X so the ramp faces the other way */
function mirrorGeometryX(g: THREE.BufferGeometry): THREE.BufferGeometry {
    const geom = g.clone();
    geom.scale(-1, 1, 1);
    geom.computeBoundingBox();
    if (geom.boundingBox) {
        // after mirroring, x range is negative; shift so it starts at x=0 again
        geom.translate(-geom.boundingBox.min.x, 0, 0);
    }
    geom.computeVertexNormals();
    return geom;
}

/* ---------------------------------------------------
   MINIRAMP / HALFPIPE (REAL PROPORTIONS)
----------------------------------------------------*/
function buildMiniRamp(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt);

    // Realistic defaults (feel free to tune later)
    const deckLen = 0.70;   // ~70cm
    const flatLen = 1.80;   // bottom flat between transitions
    const transitionLen = height; // transition radius ~= height

    const qGeomRight = createQuarterGeometry(height, transitionLen, width, deckLen);
    const qGeomLeft = mirrorGeometryX(qGeomRight);

    // Place transitions so their inside bottoms touch the flat section edges
    const left = new THREE.Mesh(qGeomLeft, concreteMat);
    left.castShadow = left.receiveShadow = true;
    left.position.x = -flatLen / 2;

    const right = new THREE.Mesh(qGeomRight, concreteMat);
    right.castShadow = right.receiveShadow = true;
    right.position.x = flatLen / 2;

    group.add(left, right);

    // Flat bottom concrete
    const flat = new THREE.Mesh(new THREE.BoxGeometry(flatLen, 0.12, width), concreteMat);
    flat.position.set(0, 0.06, 0);
    flat.castShadow = flat.receiveShadow = true;
    group.add(flat);

    // Wood deck overlays (thin) — now they sit exactly on the built-in deck
    const deckThickness = 0.06;
    const deckOverlay = new THREE.Mesh(new THREE.BoxGeometry(deckLen, deckThickness, width), woodMat);
    deckOverlay.castShadow = deckOverlay.receiveShadow = true;

    // Deck lives at the end of the transition:
    const lipX = 0.12 + height;
    const deckCenterLocalX = lipX + deckLen / 2;

    const deckLeft = deckOverlay.clone();
    deckLeft.position.set(left.position.x + deckCenterLocalX, height + deckThickness / 2, 0);

    const deckRight = deckOverlay.clone();
    deckRight.position.set(right.position.x + deckCenterLocalX, height + deckThickness / 2, 0);

    group.add(deckLeft, deckRight);

    // Coping sits at the lip (not floating)
    const copingRadius = 0.030; // ~60mm diameter-ish look
    const copingGeom = new THREE.CylinderGeometry(copingRadius, copingRadius, width, 24);
    const coping = new THREE.Mesh(copingGeom, metalMat);
    coping.rotation.z = Math.PI / 2;
    coping.castShadow = coping.receiveShadow = true;

    const copingY = height + copingRadius * 0.85;

    const copingLeft = coping.clone();
    copingLeft.position.set(left.position.x + lipX, copingY, 0);

    const copingRight = coping.clone();
    copingRight.position.set(right.position.x + lipX, copingY, 0);

    group.add(copingLeft, copingRight);

    // Pad under everything
    const totalLen = (flatLen + 2 * (lipX + deckLen));
    const pad = new THREE.Mesh(new THREE.BoxGeometry(totalLen + 0.8, 0.08, width + 0.8), concreteMat);
    pad.position.set(0, -0.04, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return groundGroup(group);
}

function buildHalfpipe(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt) * 1.1;

    const deckLen = 0.90;
    const flatLen = 0.90;
    const transitionLen = height;

    const qGeomRight = createQuarterGeometry(height, transitionLen, width, deckLen);
    const qGeomLeft = mirrorGeometryX(qGeomRight);

    const left = new THREE.Mesh(qGeomLeft, concreteMat);
    left.castShadow = left.receiveShadow = true;
    left.position.x = -flatLen / 2;

    const right = new THREE.Mesh(qGeomRight, concreteMat);
    right.castShadow = right.receiveShadow = true;
    right.position.x = flatLen / 2;

    group.add(left, right);

    const flat = new THREE.Mesh(new THREE.BoxGeometry(flatLen, 0.12, width), concreteMat);
    flat.position.set(0, 0.06, 0);
    flat.castShadow = flat.receiveShadow = true;
    group.add(flat);

    const deckThickness = 0.06;
    const deckOverlay = new THREE.Mesh(new THREE.BoxGeometry(deckLen, deckThickness, width), woodMat);
    deckOverlay.castShadow = deckOverlay.receiveShadow = true;

    const lipX = 0.12 + height;
    const deckCenterLocalX = lipX + deckLen / 2;

    const deckLeft = deckOverlay.clone();
    deckLeft.position.set(left.position.x + deckCenterLocalX, height + deckThickness / 2, 0);

    const deckRight = deckOverlay.clone();
    deckRight.position.set(right.position.x + deckCenterLocalX, height + deckThickness / 2, 0);

    group.add(deckLeft, deckRight);

    const copingRadius = 0.030;
    const copingGeom = new THREE.CylinderGeometry(copingRadius, copingRadius, width, 24);
    const coping = new THREE.Mesh(copingGeom, metalMat);
    coping.rotation.z = Math.PI / 2;
    coping.castShadow = coping.receiveShadow = true;

    const copingY = height + copingRadius * 0.85;

    const copingLeft = coping.clone();
    copingLeft.position.set(left.position.x + lipX, copingY, 0);

    const copingRight = coping.clone();
    copingRight.position.set(right.position.x + lipX, copingY, 0);

    group.add(copingLeft, copingRight);

    const totalLen = (flatLen + 2 * (lipX + deckLen));
    const pad = new THREE.Mesh(new THREE.BoxGeometry(totalLen + 0.8, 0.08, width + 0.8), concreteMat);
    pad.position.set(0, -0.04, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return groundGroup(group);
}

/* ---------------------------------------------------
   SINGLE QUARTERS (LOW / MEDIUM / VERT)
----------------------------------------------------*/
function buildSingleQuarter(config: RampConfig, variant: "low" | "medium" | "vert"): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);

    const baseHeight = heightInMetersFromFt(config.heightFt);
    let height = baseHeight;
    if (variant === "low") height *= 0.7;
    if (variant === "vert") height *= 1.25;

    const deckLen = 0.90;
    const transitionLen = height;

    const geom = createQuarterGeometry(height, transitionLen, width, deckLen);
    const ramp = new THREE.Mesh(geom, concreteMat);
    ramp.castShadow = ramp.receiveShadow = true;
    group.add(ramp);

    // Deck overlay (wood)
    const deckThickness = 0.06;
    const lipX = 0.12 + height;
    const deckCenterX = lipX + deckLen / 2;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(deckLen, deckThickness, width), woodMat);
    deck.position.set(deckCenterX, height + deckThickness / 2, 0);
    deck.castShadow = deck.receiveShadow = true;
    group.add(deck);

    // Coping at lip
    const copingRadius = 0.030;
    const copingGeom = new THREE.CylinderGeometry(copingRadius, copingRadius, width, 24);
    const coping = new THREE.Mesh(copingGeom, metalMat);
    coping.rotation.z = Math.PI / 2;
    coping.position.set(lipX, height + copingRadius * 0.85, 0);
    coping.castShadow = coping.receiveShadow = true;
    group.add(coping);

    // Pad under
    const totalLen = lipX + deckLen;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(totalLen + 0.6, 0.08, width + 0.6), concreteMat);
    pad.position.set(totalLen / 2 - 0.2, -0.04, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return groundGroup(group);
}

/* ---------------------------------------------------
   BOWLS (KEEP SIMPLE FOR NOW — NOT INVERTED)
----------------------------------------------------*/
function buildBowlRound(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const height = heightInMetersFromFt(config.heightFt) * 0.9;
    const radius = height * 1.35;

    // A bowl is basically a “cut sphere” opening upward
    const geom = new THREE.SphereGeometry(radius, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    geom.scale(1, 0.75, 1);
    geom.computeVertexNormals();

    const bowl = new THREE.Mesh(geom, concreteMat);
    bowl.castShadow = bowl.receiveShadow = true;

    // Place so the lowest point is near y=0 before groundGroup
    bowl.position.y = height - radius * 0.75;
    group.add(bowl);

    const deck = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.05, radius * 1.05, 0.08, 64), woodMat);
    deck.position.y = height + 0.04;
    deck.receiveShadow = true;
    group.add(deck);

    const coping = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, 0.06, 64, 1, true), metalMat);
    coping.position.y = height + 0.07;
    coping.receiveShadow = coping.castShadow = true;
    group.add(coping);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.2, radius * 1.2, 0.08, 48), concreteMat);
    pad.position.y = -0.04;
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return groundGroup(group);
}

function buildBowlOval(config: RampConfig): THREE.Group {
    const group = buildBowlRound(config);
    group.scale.x = 1.6;
    group.updateMatrixWorld(true);
    return groundGroup(group);
}

function buildBowlKidney(config: RampConfig): THREE.Group {
    // Keep your old kidney logic but ensure it’s grounded and not inverted
    const group = new THREE.Group();
    const height = heightInMetersFromFt(config.heightFt) * 0.9;

    const r1 = height * 1.25;
    const r2 = height * 1.0;

    const geom1 = new THREE.SphereGeometry(r1, 40, 28, 0, Math.PI * 2, 0, Math.PI / 2);
    geom1.scale(1, 0.75, 1);
    geom1.computeVertexNormals();

    const geom2 = new THREE.SphereGeometry(r2, 40, 28, 0, Math.PI * 2, 0, Math.PI / 2);
    geom2.scale(1, 0.75, 1);
    geom2.computeVertexNormals();

    const bowl1 = new THREE.Mesh(geom1, concreteMat);
    bowl1.position.set(-r2 * 0.65, height - r1 * 0.75, 0);
    bowl1.castShadow = bowl1.receiveShadow = true;

    const bowl2 = new THREE.Mesh(geom2, concreteMat);
    bowl2.position.set(r1 * 0.55, height - r2 * 0.75, 0);
    bowl2.castShadow = bowl2.receiveShadow = true;

    group.add(bowl1, bowl2);

    const deckRadius = r1 + r2 * 0.6;
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(deckRadius, deckRadius, 0.08, 64), woodMat);
    deck.position.y = height + 0.04;
    deck.receiveShadow = true;
    group.add(deck);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(deckRadius * 1.1, deckRadius * 1.1, 0.08, 48), concreteMat);
    pad.position.y = -0.04;
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return groundGroup(group);
}

/* ---------------------------------------------------
   STREET: BANK, KICKER, LEDGE, MANUAL, FLATBAR, STAIRS
   (Still “boxy” by design — we’ll smooth these next.)
----------------------------------------------------*/
function buildBank(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt) * 0.7;
    const length = 3.0;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), concreteMat);
    mesh.castShadow = mesh.receiveShadow = true;

    // Place and rotate around bottom edge: we shift up first, then rotate, then groundGroup fixes final
    mesh.position.set(length / 2, height / 2, 0);
    mesh.rotation.z = -Math.atan(height / length);

    group.add(mesh);

    const pad = new THREE.Mesh(new THREE.BoxGeometry(length + 0.6, 0.08, width + 0.6), concreteMat);
    pad.position.set(length / 2, -0.04, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return groundGroup(group);
}

function buildKicker(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt) * 0.35;
    const length = 1.4;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), concreteMat);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.set(length / 2, height / 2, 0);
    mesh.rotation.z = -Math.atan(height / length);
    group.add(mesh);

    const pad = new THREE.Mesh(new THREE.BoxGeometry(length + 0.4, 0.06, width + 0.4), concreteMat);
    pad.position.set(length / 2, -0.03, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return groundGroup(group);
}

function buildLedge(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);
    const length = 2.8;

    const base = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, width + 0.3), new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.95 }));
    base.position.y = 0.05;

    const block = new THREE.Mesh(new THREE.BoxGeometry(length - 0.1, 0.45, width), new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.9 }));
    block.position.y = 0.05 + 0.225;

    const coping = new THREE.Mesh(new THREE.BoxGeometry(length - 0.1, 0.05, 0.05), metalMat);
    coping.position.y = 0.05 + 0.45 + 0.025;
    coping.position.z = width / 2 - 0.03;

    [base, block, coping].forEach(m => (m.castShadow = (m.receiveShadow = true)));

    group.add(base, block, coping);
    group.updateMatrixWorld(true);
    return groundGroup(group);
}

function buildManualPad(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);
    const length = 2.2;
    const height = 0.35;

    const base = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, width + 0.2), concreteMat);
    base.position.y = 0.04;

    const pad = new THREE.Mesh(new THREE.BoxGeometry(length - 0.1, height, width), new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.9 }));
    pad.position.y = 0.04 + height / 2;

    [base, pad].forEach(m => (m.castShadow = (m.receiveShadow = true)));

    group.add(base, pad);
    group.updateMatrixWorld(true);
    return groundGroup(group);
}

function buildFlatbar(): THREE.Group {
    const group = new THREE.Group();
    const railLen = 3.0;
    const height = 0.4;

    const postMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8 });

    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, railLen, 24), metalMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.y = height;
    rail.castShadow = rail.receiveShadow = true;

    const baseGeom = new THREE.BoxGeometry(0.5, 0.06, 0.5);
    const base1 = new THREE.Mesh(baseGeom, postMat);
    base1.position.set(-railLen / 2 + 0.5, 0.03, 0);
    const base2 = base1.clone();
    base2.position.x = railLen / 2 - 0.5;

    const postGeom = new THREE.BoxGeometry(0.1, height, 0.1);
    const p1 = new THREE.Mesh(postGeom, postMat);
    p1.position.set(base1.position.x, height / 2, 0);
    const p2 = new THREE.Mesh(postGeom, postMat);
    p2.position.set(base2.position.x, height / 2, 0);

    [base1, base2, p1, p2].forEach(m => (m.castShadow = (m.receiveShadow = true)));

    group.add(base1, base2, p1, p2, rail);
    group.updateMatrixWorld(true);
    return groundGroup(group);
}

function buildStairs(config: RampConfig, withRail: boolean): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);

    const steps = 5;
    const totalHeight = heightInMetersFromFt(config.heightFt) * 0.7;
    const stepHeight = totalHeight / steps;
    const stepDepth = 0.4;
    const run = steps * stepDepth;

    for (let i = 0; i < steps; i++) {
        const h = stepHeight * (i + 1);
        const y = h / 2;
        const depth = stepDepth * (steps - i);
        const z = -run / 2 + depth / 2;

        const step = new THREE.Mesh(new THREE.BoxGeometry(depth, stepHeight, width), concreteMat);
        step.position.set(z, y, 0);
        step.castShadow = step.receiveShadow = true;
        group.add(step);
    }

    const topDeck = new THREE.Mesh(new THREE.BoxGeometry(stepDepth * 2, 0.08, width + 0.4), concreteMat);
    topDeck.position.set(run / 2 + stepDepth, totalHeight + 0.04, 0);

    const bottom = new THREE.Mesh(new THREE.BoxGeometry(stepDepth * 2, 0.08, width + 0.4), concreteMat);
    bottom.position.set(-run / 2 - stepDepth, 0.04, 0);

    topDeck.castShadow = bottom.castShadow = true;
    topDeck.receiveShadow = bottom.receiveShadow = true;
    group.add(topDeck, bottom);

    if (withRail) {
        const railLen = run + stepDepth * 2;
        const railHeight = totalHeight + 0.1;

        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, railLen, 24), metalMat);
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, railHeight, -width / 2 + 0.15);
        rail.castShadow = rail.receiveShadow = true;

        const postGeom = new THREE.BoxGeometry(0.08, railHeight, 0.08);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8 });

        const p1 = new THREE.Mesh(postGeom, postMat);
        p1.position.set(-railLen / 2, railHeight / 2, -width / 2 + 0.15);

        const p2 = new THREE.Mesh(postGeom, postMat);
        p2.position.set(railLen / 2, railHeight / 2, -width / 2 + 0.15);

        [p1, p2].forEach(p => (p.castShadow = (p.receiveShadow = true)));

        group.add(rail, p1, p2);
    }

    group.updateMatrixWorld(true);
    return groundGroup(group);
}

/* ---------------------------------------------------
   MAIN ROUTER
----------------------------------------------------*/
export function buildRampGroup(config: RampConfig): THREE.Group {
    const id = config.typeId.toUpperCase();

    // Transition ramps
    if (id === "MINIRAMP") return buildMiniRamp(config);
    if (id === "HALFPIPE") return buildHalfpipe(config);
    if (id === "QUARTER_LOW") return buildSingleQuarter(config, "low");
    if (id === "QUARTER_MEDIUM") return buildSingleQuarter(config, "medium");
    if (id === "QUARTER_VERT") return buildSingleQuarter(config, "vert");
    if (id === "BOWL_ROUND") return buildBowlRound(config);
    if (id === "BOWL_OVAL") return buildBowlOval(config);
    if (id === "BOWL_KIDNEY") return buildBowlKidney(config);

    // Street
    if (id === "BANK") return buildBank(config);
    if (id === "KICKER") return buildKicker(config);
    if (id === "LEDGE") return buildLedge(config);
    if (id === "MANUAL_PAD") return buildManualPad(config);
    if (id === "FLATBAR") return buildFlatbar();
    if (id === "STAIRS") return buildStairs(config, false);
    if (id === "STAIRS_RAIL") return buildStairs(config, true);

    console.warn("[rampMeshes] Unknown typeId, falling back to Manual Pad:", id);
    return buildManualPad(config);
}
