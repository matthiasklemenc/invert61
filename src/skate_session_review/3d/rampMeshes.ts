console.log(">>> USING rampMeshes.ts BUILD VERSION 8 (REALISTIC) <<<");

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
    // keep things sane in editor
    return THREE.MathUtils.clamp(m, 0.4, 2.6);
}

function widthFromLevel(config: RampConfig): number {
    const base = 2.4;
    if (config.widthLevel === "narrow") return base * 0.6;
    if (config.widthLevel === "wide") return base * 1.6;
    return base;
}

/* Shared materials (cached) */
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
   QUARTER PIPE PROFILE (EXTRUDED)
----------------------------------------------------*/

function createQuarterGeometry(height: number, length: number, width: number): THREE.BufferGeometry {
    // Side profile in (X,Y): X = length direction, Y = height
    const shape = new THREE.Shape();
    const radius = height;

    const segments = 24;

    // start at flat bottom (inside ramp)
    shape.moveTo(0, 0);

    // flat part (little bit) at bottom
    const flatFoot = 0.1;
    shape.lineTo(flatFoot, 0);

    // circular transition
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = -Math.PI / 2 + (Math.PI / 2) * t; // -90° -> 0°
        const x = flatFoot + radius * Math.cos(angle);   // 0 → radius
        const y = radius + radius * Math.sin(angle);     // 0 → radius
        shape.lineTo(
            THREE.MathUtils.clamp(x, 0, length),
            THREE.MathUtils.clamp(y, 0, height)
        );
    }

    // back down the "back face"
    shape.lineTo(length, 0);
    shape.lineTo(0, 0);

    const extrudeSettings = {
        depth: width,
        bevelEnabled: false,
        steps: 1
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
}

/* ---------------------------------------------------
   MINIRAMP / HALFPIPE
----------------------------------------------------*/

function buildMiniRamp(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt);
    const radius = height;
    const deck = 0.6;
    const flat = 1.8;

    const totalLen = deck + radius + flat + radius + deck;

    // Left quarter
    const qGeom = createQuarterGeometry(height, radius + deck, width);
    const q1 = new THREE.Mesh(qGeom, concreteMat);
    q1.rotation.y = Math.PI; // face towards center
    q1.position.set(-(flat / 2), 0, 0);
    q1.castShadow = q1.receiveShadow = true;
    group.add(q1);

    // Right quarter
    const q2 = new THREE.Mesh(qGeom.clone(), concreteMat);
    q2.rotation.y = 0;
    q2.position.set(flat / 2, 0, 0);
    q2.castShadow = q2.receiveShadow = true;
    group.add(q2);

    // Flat bottom
    const flatBox = new THREE.Mesh(
        new THREE.BoxGeometry(flat, 0.12, width),
        concreteMat
    );
    flatBox.position.set(0, 0.06, 0);
    flatBox.castShadow = flatBox.receiveShadow = true;
    group.add(flatBox);

    // Decks
    const deckGeom = new THREE.BoxGeometry(deck, 0.06, width);
    const deck1 = new THREE.Mesh(deckGeom, woodMat);
    deck1.position.set(-flat / 2 - radius / 2, height + 0.03, 0);
    const deck2 = deck1.clone();
    deck2.position.x = flat / 2 + radius / 2;
    deck1.castShadow = deck1.receiveShadow = true;
    deck2.castShadow = deck2.receiveShadow = true;
    group.add(deck1, deck2);

    // Coping (front edge)
    const copingRadius = 0.035;
    const copingGeom = new THREE.CylinderGeometry(copingRadius, copingRadius, width, 16);
    const cp1 = new THREE.Mesh(copingGeom, metalMat);
    cp1.rotation.z = Math.PI / 2;
    cp1.position.set(-flat / 2 - radius / 2 + 0.05, height + 0.09, 0);
    const cp2 = cp1.clone();
    cp2.position.set(flat / 2 + radius / 2 - 0.05, height + 0.09, 0);
    cp1.castShadow = cp2.castShadow = true;
    cp1.receiveShadow = cp2.receiveShadow = true;
    group.add(cp1, cp2);

    // Pad under ramp
    const pad = new THREE.Mesh(
        new THREE.BoxGeometry(totalLen + 0.8, 0.08, width + 0.8),
        concreteMat
    );
    pad.position.set(0, -0.04, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return group;
}

/* Halfpipe: just wider + no long flat (short flat only) */
function buildHalfpipe(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt) * 1.1;
    const radius = height;
    const deck = 0.8;
    const flat = 0.9;

    const totalLen = deck + radius + flat + radius + deck;

    const qGeom = createQuarterGeometry(height, radius + deck, width);
    const q1 = new THREE.Mesh(qGeom, concreteMat);
    q1.rotation.y = Math.PI;
    q1.position.set(-(flat / 2), 0, 0);
    q1.castShadow = q1.receiveShadow = true;
    const q2 = new THREE.Mesh(qGeom.clone(), concreteMat);
    q2.rotation.y = 0;
    q2.position.set(flat / 2, 0, 0);
    q2.castShadow = q2.receiveShadow = true;
    group.add(q1, q2);

    const flatBox = new THREE.Mesh(
        new THREE.BoxGeometry(flat, 0.12, width),
        concreteMat
    );
    flatBox.position.set(0, 0.06, 0);
    flatBox.castShadow = flatBox.receiveShadow = true;
    group.add(flatBox);

    const deckGeom = new THREE.BoxGeometry(deck, 0.06, width);
    const deck1 = new THREE.Mesh(deckGeom, woodMat);
    deck1.position.set(-flat / 2 - radius / 2, height + 0.03, 0);
    const deck2 = deck1.clone();
    deck2.position.x = flat / 2 + radius / 2;
    deck1.castShadow = deck1.receiveShadow = true;
    deck2.castShadow = deck2.receiveShadow = true;
    group.add(deck1, deck2);

    const copingGeom = new THREE.CylinderGeometry(0.035, 0.035, width, 16);
    const cp1 = new THREE.Mesh(copingGeom, metalMat);
    cp1.rotation.z = Math.PI / 2;
    cp1.position.set(-flat / 2 - radius / 2 + 0.05, height + 0.09, 0);
    const cp2 = cp1.clone();
    cp2.position.x = flat / 2 + radius / 2 - 0.05;
    cp1.castShadow = cp2.castShadow = true;
    cp1.receiveShadow = cp2.receiveShadow = true;
    group.add(cp1, cp2);

    const pad = new THREE.Mesh(
        new THREE.BoxGeometry(totalLen + 0.8, 0.08, width + 0.8),
        concreteMat
    );
    pad.position.set(0, -0.04, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return group;
}

/* ---------------------------------------------------
   SINGLE QUARTERS
----------------------------------------------------*/

function buildSingleQuarter(config: RampConfig, variant: "low" | "medium" | "vert"): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);

    const baseHeight = heightInMetersFromFt(config.heightFt);
    let height = baseHeight;
    if (variant === "low") height *= 0.7;
    if (variant === "vert") height *= 1.25;

    const radius = height;
    const deck = 0.8;

    const qGeom = createQuarterGeometry(height, radius + deck, width);
    const quarter = new THREE.Mesh(qGeom, concreteMat);
    quarter.rotation.y = Math.PI; // face towards +X
    quarter.position.set(0, 0, 0);
    quarter.castShadow = quarter.receiveShadow = true;
    group.add(quarter);

    const deckBox = new THREE.Mesh(
        new THREE.BoxGeometry(deck, 0.06, width),
        woodMat
    );
    // place slightly behind the top of the transition
    deckBox.position.set(-radius / 2 - deck / 2, height + 0.03, 0);
    deckBox.castShadow = deckBox.receiveShadow = true;
    group.add(deckBox);

    const copingGeom = new THREE.CylinderGeometry(0.035, 0.035, width, 16);
    const cp = new THREE.Mesh(copingGeom, metalMat);
    cp.rotation.z = Math.PI / 2;
    cp.position.set(-radius / 2 + 0.02, height + 0.09, 0);
    cp.castShadow = cp.receiveShadow = true;
    group.add(cp);

    const pad = new THREE.Mesh(
        new THREE.BoxGeometry(radius + deck + 0.6, 0.08, width + 0.6),
        concreteMat
    );
    pad.position.set(-0.2, -0.04, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return group;
}

/* ---------------------------------------------------
   BOWLS
----------------------------------------------------*/

function buildBowlRound(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt) * 0.9;

    const radius = height * 1.1;

    // Use a sphere section as bowl
    const geom = new THREE.SphereGeometry(radius, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    geom.scale(1, 0.8, 1);
    const bowl = new THREE.Mesh(geom, concreteMat);
    bowl.position.y = height - radius * 0.8;
    bowl.castShadow = bowl.receiveShadow = true;
    group.add(bowl);

    const deck = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.1, radius * 1.1, 0.08, 48),
        woodMat
    );
    deck.position.y = height + 0.04;
    deck.receiveShadow = true;
    group.add(deck);

    const coping = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.05, radius * 1.05, 0.06, 48, 1, true),
        metalMat
    );
    coping.position.y = height + 0.07;
    coping.receiveShadow = coping.castShadow = true;
    group.add(coping);

    // Pad under bowl
    const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.25, radius * 1.25, 0.08, 32),
        concreteMat
    );
    pad.position.y = -0.04;
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return group;
}

function buildBowlOval(config: RampConfig): THREE.Group {
    const group = buildBowlRound(config);
    // squash / stretch in X to make oval
    group.scale.x = 1.6;
    group.updateMatrixWorld(true);
    return group;
}

function buildBowlKidney(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const height = heightInMetersFromFt(config.heightFt) * 0.9;

    const r1 = height * 1.0;
    const r2 = height * 0.8;

    const geom1 = new THREE.SphereGeometry(r1, 28, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    geom1.scale(1, 0.8, 1);
    const bowl1 = new THREE.Mesh(geom1, concreteMat);
    bowl1.position.set(-r2 * 0.8, height - r1 * 0.8, 0);
    bowl1.castShadow = bowl1.receiveShadow = true;

    const geom2 = new THREE.SphereGeometry(r2, 28, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    geom2.scale(1, 0.8, 1);
    const bowl2 = new THREE.Mesh(geom2, concreteMat);
    bowl2.position.set(r1 * 0.6, height - r2 * 0.8, 0);
    bowl2.castShadow = bowl2.receiveShadow = true;

    group.add(bowl1, bowl2);

    const deckRadius = r1 + r2 * 0.8;
    const deck = new THREE.Mesh(
        new THREE.CylinderGeometry(deckRadius, deckRadius, 0.08, 48),
        woodMat
    );
    deck.position.y = height + 0.04;
    deck.receiveShadow = true;
    group.add(deck);

    const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(deckRadius * 1.1, deckRadius * 1.1, 0.08, 32),
        concreteMat
    );
    pad.position.y = -0.04;
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return group;
}

/* ---------------------------------------------------
   STREET: BANK, KICKER, LEDGE, MANUAL, FLATBAR, STAIRS
----------------------------------------------------*/

function buildBank(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt) * 0.7;
    const length = 3.0;

    const geom = new THREE.BoxGeometry(length, height, width);
    const mesh = new THREE.Mesh(geom, concreteMat);
    mesh.position.set(length / 2, height / 2, 0);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.rotation.z = -Math.atan(height / length);
    group.add(mesh);

    const pad = new THREE.Mesh(
        new THREE.BoxGeometry(length + 0.6, 0.08, width + 0.6),
        concreteMat
    );
    pad.position.set(length / 2, -0.04, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return group;
}

function buildKicker(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt) * 0.35;
    const length = 1.4;

    const geom = new THREE.BoxGeometry(length, height, width);
    const mesh = new THREE.Mesh(geom, concreteMat);
    mesh.position.set(length / 2, height / 2, 0);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.rotation.z = -Math.atan(height / length);
    group.add(mesh);

    const pad = new THREE.Mesh(
        new THREE.BoxGeometry(length + 0.4, 0.06, width + 0.4),
        concreteMat
    );
    pad.position.set(length / 2, -0.03, 0);
    pad.receiveShadow = true;
    group.add(pad);

    group.updateMatrixWorld(true);
    return group;
}

function buildLedge(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);
    const length = 2.8;

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.1, width + 0.3),
        new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.95 })
    );
    base.position.y = 0.05;

    const block = new THREE.Mesh(
        new THREE.BoxGeometry(length - 0.1, 0.45, width),
        new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.9 })
    );
    block.position.y = 0.05 + 0.225;

    const coping = new THREE.Mesh(
        new THREE.BoxGeometry(length - 0.1, 0.05, 0.05),
        metalMat
    );
    coping.position.y = 0.05 + 0.45 + 0.025;
    coping.position.z = width / 2 - 0.03;

    base.castShadow = base.receiveShadow = true;
    block.castShadow = block.receiveShadow = true;
    coping.castShadow = coping.receiveShadow = true;

    group.add(base, block, coping);
    group.updateMatrixWorld(true);
    return group;
}

function buildManualPad(config: RampConfig): THREE.Group {
    const group = new THREE.Group();
    const width = widthFromLevel(config);
    const length = 2.2;
    const height = 0.35;

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.08, width + 0.2),
        concreteMat
    );
    base.position.y = 0.04;

    const pad = new THREE.Mesh(
        new THREE.BoxGeometry(length - 0.1, height, width),
        new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.9 })
    );
    pad.position.y = 0.04 + height / 2;

    base.castShadow = base.receiveShadow = true;
    pad.castShadow = pad.receiveShadow = true;

    group.add(base, pad);
    group.updateMatrixWorld(true);
    return group;
}

function buildFlatbar(): THREE.Group {
    const group = new THREE.Group();
    const railLen = 3.0;
    const height = 0.4;

    const postMat = new THREE.MeshStandardMaterial({
        color: 0x4b5563,
        roughness: 0.8
    });

    const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, railLen, 20),
        metalMat
    );
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

    [base1, base2, p1, p2].forEach(m => {
        m.castShadow = m.receiveShadow = true;
    });

    group.add(base1, base2, p1, p2, rail);
    group.updateMatrixWorld(true);
    return group;
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

        const step = new THREE.Mesh(
            new THREE.BoxGeometry(depth, stepHeight, width),
            concreteMat
        );
        step.position.set(z, y, 0);
        step.castShadow = step.receiveShadow = true;
        group.add(step);
    }

    // top deck + bottom landing
    const topDeck = new THREE.Mesh(
        new THREE.BoxGeometry(stepDepth * 2, 0.08, width + 0.4),
        concreteMat
    );
    topDeck.position.set(run / 2 + stepDepth, totalHeight + 0.04, 0);
    const bottom = new THREE.Mesh(
        new THREE.BoxGeometry(stepDepth * 2, 0.08, width + 0.4),
        concreteMat
    );
    bottom.position.set(-run / 2 - stepDepth, 0.04, 0);
    topDeck.castShadow = bottom.castShadow = true;
    topDeck.receiveShadow = bottom.receiveShadow = true;
    group.add(topDeck, bottom);

    if (withRail) {
        const railLen = run + stepDepth * 2;
        const railHeight = totalHeight + 0.1;

        const rail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, railLen, 18),
            metalMat
        );
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, railHeight, -width / 2 + 0.15);
        rail.castShadow = rail.receiveShadow = true;

        const postGeom = new THREE.BoxGeometry(0.08, railHeight, 0.08);
        const postMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.8
        });

        const p1 = new THREE.Mesh(postGeom, postMat);
        p1.position.set(-railLen / 2, railHeight / 2, -width / 2 + 0.15);
        const p2 = new THREE.Mesh(postGeom, postMat);
        p2.position.set(railLen / 2, railHeight / 2, -width / 2 + 0.15);

        [p1, p2].forEach(p => {
            p.castShadow = p.receiveShadow = true;
        });

        group.add(rail, p1, p2);
    }

    group.updateMatrixWorld(true);
    return group;
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

    // Fallback – just show a small manual pad instead of the weird blob
    console.warn("[rampMeshes] Unknown typeId, falling back to Manual Pad:", id);
    return buildManualPad(config);
}
