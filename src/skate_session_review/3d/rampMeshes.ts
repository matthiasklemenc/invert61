// --- CORRECTED + STABLE RAMP GEOMETRY FOR EDITOR ---
// C:\Users\user\Desktop\invert61\src\skate_session_review\3d\rampMeshes.ts

import * as THREE from "three";
import type { RampConfig } from "../planner/rampTypes";

/* ---------------------------------------------------
   TEXTURE HELPERS (unchanged)
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
    return THREE.MathUtils.clamp(m, 0.5, 2.4);
}

function widthFromLevel(config: RampConfig): number {
    const base = 2.4;
    if (config.widthLevel === "narrow") return base * 0.6;
    if (config.widthLevel === "wide") return base * 1.6;
    return base;
}

/* ---------------------------------------------------
   PROPER QUARTER PIPE SHAPE
----------------------------------------------------*/

function createQuarterTransition(
    radius: number,
    height: number,
    width: number,
    concreteMat: THREE.Material,
    flip = false
): THREE.Mesh {
    const pts: THREE.Vector2[] = [];
    const resolution = 24; // smooth curve
    for (let i = 0; i <= resolution; i++) {
        const t = i / resolution;
        const angle = (Math.PI / 2) * t;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        pts.push(new THREE.Vector2(x, y));
    }

    const geom = new THREE.LatheGeometry(pts, 24);
    geom.rotateX(Math.PI / 2);
    geom.scale(1, 1, width / radius);

    const mesh = new THREE.Mesh(geom, concreteMat);
    mesh.castShadow = mesh.receiveShadow = true;

    if (flip) mesh.rotation.y = Math.PI;

    return mesh;
}

/* ---------------------------------------------------
   MINIRAMP / HALFPIPE BUILDER
----------------------------------------------------*/

function buildMiniRamp(config: RampConfig): THREE.Group {
    const group = new THREE.Group();

    const width = widthFromLevel(config);
    const height = heightInMetersFromFt(config.heightFt);

    const radius = height * 0.9;
    const deck = 0.55;
    const flat = 1.8;

    const totalLength = deck + radius + flat + radius + deck;

    const concreteMat = new THREE.MeshStandardMaterial({
        map: createConcreteTexture(),
        roughness: 0.92,
        metalness: 0.05,
    });

    const woodMat = new THREE.MeshStandardMaterial({
        map: createWoodTexture(),
        roughness: 0.6,
        metalness: 0.05,
    });

    // LEFT TRANSITION
    const q1 = createQuarterTransition(radius, height, width, concreteMat, false);
    q1.position.set(-width * 0.0, 0, -totalLength / 2 + deck + radius);
    group.add(q1);

    // RIGHT TRANSITION
    const q2 = createQuarterTransition(radius, height, width, concreteMat, true);
    q2.position.set(0, 0, totalLength / 2 - deck - radius);
    group.add(q2);

    // FLAT
    const flatBox = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.12, flat),
        concreteMat
    );
    flatBox.position.set(0, 0.06, 0);
    group.add(flatBox);

    // DECKS
    const deckBox1 = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.06, deck),
        woodMat
    );
    deckBox1.position.set(0, height + 0.03, -totalLength / 2 + deck / 2);
    group.add(deckBox1);

    const deckBox2 = deckBox1.clone();
    deckBox2.position.set(0, height + 0.03, totalLength / 2 - deck / 2);
    group.add(deckBox2);

    // COPING
    const copingMat = new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        metalness: 0.9,
        roughness: 0.4,
    });
    const copingGeom = new THREE.CylinderGeometry(0.03, 0.03, width, 16);

    const cp1 = new THREE.Mesh(copingGeom, copingMat);
    cp1.rotation.z = Math.PI / 2;
    cp1.position.set(0, height + 0.09, -totalLength / 2 + deck);
    group.add(cp1);

    const cp2 = cp1.clone();
    cp2.position.set(0, height + 0.09, totalLength / 2 - deck);
    group.add(cp2);

    // PAD UNDER RAMP
    const pad = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.6, 0.08, totalLength + 0.6),
        concreteMat
    );
    pad.position.set(0, -0.04, 0);
    group.add(pad);

    group.updateMatrixWorld(true);
    return group;
}

/* ---------------------------------------------------
   STREET OBSTACLES (your existing ones kept)
----------------------------------------------------*/

function buildBank(config: RampConfig): THREE.Group {
    // (unchanged except for fixed width reference)
    const group = new THREE.Group();
    const tex = createConcreteTexture();
    const width = widthFromLevel(config);
    const height = 0.4;
    const length = 3.0;

    const verts = new Float32Array([
        -width / 2, 0, 0,
         width / 2, 0, 0,
        -width / 2, 0, length,
         width / 2, 0, length,
        -width / 2, height, length,
         width / 2, height, length
    ]);

    const idx = [
        0,2,1, 2,3,1,
        2,4,3, 3,4,5,
        0,2,4,
        1,5,3,
        0,1,5, 0,5,4
    ];

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(verts,3));
    g.setIndex(idx);
    g.computeVertexNormals();

    const m = new THREE.MeshStandardMaterial({
        map: tex,
        roughness:0.95,
        metalness:0.05
    });

    const mesh = new THREE.Mesh(g,m);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    group.updateMatrixWorld(true);
    return group;
}

function buildLedge(config: RampConfig): THREE.Group {
    // unchanged
    const group = new THREE.Group();
    const concrete = createConcreteTexture();
    const wood = createWoodTexture();

    const width =
        config.widthLevel === "wide" ? 3.0 :
        config.widthLevel === "narrow" ? 1.6 :
        2.2;

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(width,0.1,2.8),
        new THREE.MeshStandardMaterial({ map: concrete, roughness:0.95 })
    );
    base.position.y=0.05;

    const block = new THREE.Mesh(
        new THREE.BoxGeometry(width-0.1,0.4,2.4),
        new THREE.MeshStandardMaterial({ map: concrete })
    );
    block.position.y=0.05+0.2;

    const coping = new THREE.Mesh(
        new THREE.BoxGeometry(width-0.1,0.04,2.42),
        new THREE.MeshStandardMaterial({ color:0xe5e7eb, metalness:0.8 })
    );
    coping.position.y=0.05+0.4+0.02;

    group.add(base,block,coping);
    group.updateMatrixWorld(true);
    return group;
}

function buildFlatbar(): THREE.Group {
    const group = new THREE.Group();
    const railLen = 3.0;
    const height = 0.4;

    const postMat = new THREE.MeshStandardMaterial({
        color:0x4b5563, roughness:0.8
    });
    const railMat = new THREE.MeshStandardMaterial({
        color:0xe5e7eb, metalness:0.9
    });

    const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03,0.03,railLen,16),
        railMat
    );
    rail.rotation.z = Math.PI/2;
    rail.position.y = height;

    const baseGeom = new THREE.BoxGeometry(0.4,0.05,0.5);

    const base1 = new THREE.Mesh(baseGeom,postMat);
    base1.position.set(-railLen/2+0.4,0.025,0);
    const base2 = base1.clone();
    base2.position.x = railLen/2-0.4;

    const postGeom = new THREE.BoxGeometry(0.1,height,0.1);
    const p1 = new THREE.Mesh(postGeom,postMat);
    p1.position.set(base1.position.x,height/2,0);
    const p2 = new THREE.Mesh(postGeom,postMat);
    p2.position.set(base2.position.x,height/2,0);

    group.add(base1,base2,p1,p2,rail);
    group.updateMatrixWorld(true);
    return group;
}

/* ---------------------------------------------------
   MAIN ROUTER
----------------------------------------------------*/

export function buildRampGroup(config: RampConfig): THREE.Group {
    const id = config.typeId.toUpperCase();

    // Street
    if (id.includes("LEDGE") || id.includes("MANUAL")) return buildLedge(config);
    if (id.includes("BANK")) return buildBank(config);
    if (id.includes("FLATBAR") || id.includes("RAIL")) return buildFlatbar();

    // Transition types → use correct mini-ramp geometry
    return buildMiniRamp(config);
}
